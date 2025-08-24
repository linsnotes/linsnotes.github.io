---
layout: post
title: Deploying n8n AI Starter Kit on Raspberry Pi
date: 2025-08-24 00:18:00 +0800
published: true #false or true
categories: n8n
toc: true
media_subpath: /assets/media/2025/deploying-n8n-ai-starter-kit-on-raspberry-pi
image: raspberrypi_n8n.png
tags: [n8n, pi, docker, portainer]
---

This guide simplifies the [official n8n Self-Hosted AI Starter Kit](https://github.com/n8n-io/self-hosted-ai-starter-kit) for Raspberry Pi. Unlike the original, this setup:

* Requires **no CPU profile configuration**.
* Uses **Portainer** for easy stack management.
* Strips away unnecessary complexity.
* Works on Raspberry Pi with **Ollama (CPU-only)**.

---

## Step 1: Create Docker Volumes

Run the following commands to create persistent storage for your containers:

```bash
docker volume create n8n_storage && \
docker volume create postgres_storage && \
docker volume create qdrant_storage && \
docker volume create ollama_storage
```

If something goes wrong and you need a fresh start, delete the volumes:

```bash
docker volume rm n8n_storage postgres_storage qdrant_storage ollama_storage
```

Also create a shared folder:

```bash
mkdir -p ~/n8n-shared
```

🔹 **Why `n8n-shared`?**
This folder allows you to pass files between n8n workflows and Ollama/Qdrant. For example, you can store prompt files, workflow outputs, or logs in one place accessible by both services.

---

## Step 2: Prepare the `.env` File

Create a `.env` file with the following content:

```ini
POSTGRES_USER=root
POSTGRES_PASSWORD=strongpass
POSTGRES_DB=n8n

N8N_ENCRYPTION_KEY=<secret key>  # Use `openssl rand -hex 32`
N8N_USER_MANAGEMENT_JWT_SECRET=<secret key> # Use `openssl rand -hex 32`

SHARED_FOLDER=/home/<user>/n8n-shared
OLLAMA_MODEL=qwen3:0.6b  # Start with a small model
```

📌 **Notes:**

* Use strong, randomly generated secrets for encryption and JWT.
* Adjust `<user>` in `SHARED_FOLDER` to your actual Linux username.

---

## Step 3: Deploy the Stack in Portainer

1. Go to **Portainer → Stacks → Add Stack**.
2. Paste the following **docker-compose.yaml** into the editor.

```yaml
networks:
  n8nnet:

x-n8n: &service-n8n
  image: n8nio/n8n:latest
  networks: ['n8nnet']
  environment:
    DB_TYPE: postgresdb
    DB_POSTGRESDB_HOST: postgres
    DB_POSTGRESDB_USER: ${POSTGRES_USER}
    DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
    DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
    N8N_DIAGNOSTICS_ENABLED: "false"
    N8N_PERSONALIZATION_ENABLED: "false"
    N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
    N8N_USER_MANAGEMENT_JWT_SECRET: ${N8N_USER_MANAGEMENT_JWT_SECRET}
    OLLAMA_HOST: ${OLLAMA_HOST:-ollama:11434}
    N8N_DEFAULT_BINARY_DATA_MODE: filesystem

x-ollama: &service-ollama
  image: ollama/ollama:latest
  container_name: ollama
  networks: ['n8nnet']
  restart: unless-stopped
  ports:
    - "11434:11434"
  volumes:
    - ollama_storage:/root/.ollama

x-init-ollama: &init-ollama
  image: ollama/ollama:latest
  networks: ['n8nnet']
  container_name: ollama-pull-llama
  volumes:
    - ollama_storage:/root/.ollama
  entrypoint: /bin/sh
  environment:
    OLLAMA_HOST: ollama:11434
    OLLAMA_MODEL: ${OLLAMA_MODEL:-qwen3:0.6b}
  command:
    - "-c"
    - |
      echo "Waiting for Ollama..."
      until wget -qO- "http://ollama:11434/api/tags" >/dev/null 2>&1; do sleep 2; done
      echo "Ollama is up, pulling ${OLLAMA_MODEL}..."
      ollama pull "${OLLAMA_MODEL}"

services:
  postgres:
    image: postgres:16-alpine
    hostname: postgres
    networks: ['n8nnet']
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_storage:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -h localhost -U ${POSTGRES_USER} -d ${POSTGRES_DB}']
      interval: 5s
      timeout: 5s
      retries: 10

  n8n:
    <<: *service-n8n
    hostname: n8n
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    volumes:
      - n8n_storage:/home/node/.n8n
      - ${SHARED_FOLDER}:/data/shared
    depends_on:
      postgres:
        condition: service_healthy

  qdrant:
    image: qdrant/qdrant:latest
    hostname: qdrant
    container_name: qdrant
    networks: ['n8nnet']
    restart: unless-stopped
    ports:
      - "6333:6333"
    volumes:
      - qdrant_storage:/qdrant/storage

  ollama:
    <<: *service-ollama

  ollama-pull-llama:
    <<: *init-ollama
    depends_on:
      - ollama

volumes:
  n8n_storage:
    external: true
  postgres_storage:
    external: true
  ollama_storage:
    external: true
  qdrant_storage:
    external: true
```

3. Upload your `.env` file in Portainer.
4. Deploy the stack.

---

## Step 4: Open Required Ports

Allow n8n’s UI port (5678) on your server firewall:

```bash
iptables -A INPUT -p tcp --dport 5678 -j ACCEPT
```

⚠️ **Important:**
After modifying `iptables`, you may need to restart Docker. This is because Docker manages iptables rules for container networking, and changes outside may not take effect until Docker reloads its own network configuration.

---

## Step 5: Access n8n

* Without a domain:

  ```
  http://192.168.1.50:5678
  ```
* With **Nginx Proxy Manager (NPM)**:

  ```
  https://n8n.mydomain.com
  ```

👉 If using a domain, ensure you configure **reverse proxy** with SSL in Nginx Proxy Manager.

---

## Step 6: Ollama Endpoint Fix

Inside n8n, set the Ollama endpoint to:

```
http://ollama:11434
```

❌ Do not use `http://localhost:11434`, as localhost resolves inside the n8n container, not on your Raspberry Pi host.

---

✅ You now have a **lightweight, Raspberry Pi-optimized AI automation stack** running n8n, Qdrant, Postgres, and Ollama — all managed via Portainer.

---

Would you like me to also create an **SEO-optimized meta description** (so you can drop it into your blog or docs for better Google ranking)?
