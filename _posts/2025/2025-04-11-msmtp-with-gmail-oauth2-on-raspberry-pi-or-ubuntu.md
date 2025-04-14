---
layout: post
title: msmtp with Gmail OAuth 2.0 on Raspberry Pi (or Ubuntu)  
date: 2025-04-11 12:30:00 +/-tttt
published: true #false or true
categories: linux
toc: true
media_subpath: /assets/media/2024/sending-email-from-raspberry-pi
image: raspi-email.webp
tags: [linux, debian, msmtp, oauth2.0]
---

# msmtp with Gmail OAuth 2.0 on Raspberry Pi (or Ubuntu)  
*(Note: OAuth 2.0 is now required for msmtp to work with Gmail because traditional password authentication is no longer supported.)*

This guide explains how to set up msmtp (a lightweight SMTP client) so it can send mail via Gmail using OAuth 2.0 instead of a static password. You will create a Google Cloud project, enable and configure the Gmail API (which now requires OAuth 2.0), install system packages and Python libraries, configure msmtp as your system sendmail, and set up two Python scripts (one to perform the initial authorization and one to provide a fresh access token on demand).

---

## 1. Create and Configure Your Google Cloud Project

### a. Create a Google Account (if needed)
- Visit [Google Account Signup](https://accounts.google.com/signup) to create an account.

### b. Access the Google Cloud Console
1. **Go to the Console:**  
   Open [Google Cloud Console](https://console.cloud.google.com/).
2. **Create a New Project:**  
   - Click the project drop-down in the top navigation bar.
   - Choose **New Project**.
   - Enter a project name (for example, **msmtp**) and fill in any required details.
   - Click **Create** and wait for the project to initialize.

### c. Enable the Gmail API
1. In the Cloud Console, navigate to **APIs & Services > Library**.
2. Search for **Gmail API**.
3. Click **Enable**.

### d. Configure the OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** as the User Type.
3. Fill in the required fields:  
   - **App name:** e.g., msmtp  
   - **User support email:** Your email address  
   - **App domain:** You may use a dummy domain like `http://localhost.com`  
   - **Authorized domains:** Add `localhost.com`  
   - Provide your developer contact information.
4. Save your settings.

### e. Create an OAuth Client ID
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Under **Application type**, choose **Desktop app**.
4. Provide a name (for example, “msmtp Desktop App”).
5. Click **Create**.
6. When the dialog appears, click **Download** to save the JSON file (e.g., rename it to `client_secret.json`).
7. **Secure the file:**  
   On your Raspberry Pi/Ubuntu, set strict permissions:  
   ```bash
   chmod 600 /home/pi/msmtp/client_secret.json
   ```

*Reference on Gmail OAuth changes and msmtp integration (see also ArchWiki): citeturn0search3*

---

## 2. Install Required Linux and Python Packages

### a. Update and Install System Packages
Open a terminal and run:
```bash
sudo apt update
sudo apt install msmtp msmtp-mta python3 python3-pip
```
- **msmtp & msmtp-mta:** Allow msmtp to be used as a sendmail replacement.
- **python3 & python3-pip:** Provide the Python environment needed for token management.

### b. Install Python Libraries for OAuth 2.0
Using pip, install the required packages:
```bash
pip3 install google-auth google-auth-oauthlib google-auth-httplib2
```

---

## 3. Configure msmtp as the System Sendmail

### a. Edit the msmtp System Configuration File  
Open or create the file `/etc/msmtprc` (using sudo if necessary):
```bash
sudo nano /etc/msmtprc
```
Insert a configuration similar to the following. Make sure to adjust the values where needed:
```bash
# Global defaults
defaults
auth           oauthbearer
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /home/pi/msmtp/msmtp.log

# Gmail account configuration
account        gmail
host           smtp.gmail.com
port           587
from           your-email@gmail.com
user           your-email@gmail.com
passwordeval   "python3 /home/pi/msmtp/get_token.py"

# Set a default account
account default : gmail
```
Save and exit the editor (in nano, press `Ctrl+O` then `Ctrl+X`).

*Note: The line `auth oauthbearer` tells msmtp to use OAuth 2.0 rather than a plain password. The `passwordeval` directive runs a Python script that returns a fresh access token each time msmtp is invoked.*

---

## 4. Set Up Your OAuth 2.0 Scripts Folder

Create a dedicated folder (for example, `~/msmtp`) to store all your OAuth-related files:
```bash
mkdir -p ~/msmtp
cd ~/msmtp
touch client_secret.json config.json authorize.py get_token.py
```
Copy or move the downloaded `client_secret.json` into this folder.

### a. Create the **config.json** File
Using your text editor, open `config.json` and add:
```json
{
  "CLIENT_SECRETS_FILE": "/home/pi/msmtp/client_secret.json",
  "CRED_FILE": "/home/pi/msmtp/credentials.json"
}
```
*Tip: Adjust the file paths if your directory structure is different.*

### b. Create the **authorize.py** Script  
This script handles the initial OAuth authorization flow and saves the credentials (access token, refresh token, etc.). Open `authorize.py` and paste the following code:
```python
#!/usr/bin/env python3
import os
import json
import logging
import sys
from google_auth_oauthlib.flow import InstalledAppFlow

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

CONFIG_FILE = 'config.json'

def load_config():
    if not os.path.exists(CONFIG_FILE):
        logging.error(f"Configuration file {CONFIG_FILE} not found. Please create it.")
        sys.exit(1)
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
    except Exception as e:
        logging.error(f"Failed to load {CONFIG_FILE}: {e}")
        sys.exit(1)
    for key in ["CLIENT_SECRETS_FILE", "CRED_FILE"]:
        if key not in config or not config[key]:
            logging.error(f"Missing or empty '{key}' in {CONFIG_FILE}")
            sys.exit(1)
    return config

config = load_config()
CLIENT_SECRETS_FILE = config["CLIENT_SECRETS_FILE"]
CRED_FILE = config["CRED_FILE"]

# OAuth scope required for Gmail SMTP access.
SCOPES = ['https://mail.google.com/']

def authorize():
    if not os.path.exists(CLIENT_SECRETS_FILE):
        logging.error(f"Client secrets file not found: {CLIENT_SECRETS_FILE}")
        sys.exit(1)
    try:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    except Exception as e:
        logging.error(f"Error loading client secrets: {e}")
        sys.exit(1)
    try:
        creds = flow.run_console()
    except Exception as e:
        logging.error(f"Authorization flow error: {e}")
        sys.exit(1)
    data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
        "expiry": creds.expiry.isoformat() if creds.expiry else None,
    }
    try:
        with open(CRED_FILE, 'w') as f:
            json.dump(data, f)
        logging.info(f"Credentials saved to {CRED_FILE}")
    except Exception as e:
        logging.error(f"Error saving credentials: {e}")
        sys.exit(1)

if __name__ == '__main__':
    authorize()
```
> **Usage:** Run this script one time to authorize and generate your credentials:
> ```bash
> ./authorize.py
> ```

### c. Create the **get_token.py** Script  
This script is used by msmtp (via `passwordeval`) to get a valid access token, refreshing it if necessary.
Open `get_token.py` and paste:
```python
#!/usr/bin/env python3
import os
import json
import time
import sys
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

CONFIG_FILE = 'config.json'

def load_config():
    if not os.path.exists(CONFIG_FILE):
        print(f"Configuration file {CONFIG_FILE} not found. Please create it.")
        sys.exit(1)
    try:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"Error loading configuration: {e}")
        sys.exit(1)
    if "CRED_FILE" not in config or not config["CRED_FILE"]:
        print("Configuration error: 'CRED_FILE' is missing in config.json")
        sys.exit(1)
    return config

config = load_config()
CRED_FILE = config["CRED_FILE"]

def load_credentials():
    if not os.path.exists(CRED_FILE):
        raise FileNotFoundError(f"Credentials file not found. Run authorize.py first: {CRED_FILE}")
    with open(CRED_FILE, 'r') as f:
        cred_data = json.load(f)
    expiry_str = cred_data.pop('expiry', None)
    creds = Credentials(**cred_data)
    if expiry_str:
        try:
            creds.expiry = datetime.fromisoformat(expiry_str)
        except Exception as e:
            print("Warning: Could not parse expiry:", expiry_str)
    return creds

def save_credentials(creds):
    data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
        "expiry": creds.expiry.isoformat() if creds.expiry else None,
    }
    with open(CRED_FILE, 'w') as f:
        json.dump(data, f)

def get_access_token():
    creds = load_credentials()
    if not creds.valid or (creds.expiry and (creds.expiry.timestamp() - time.time() < 300)):
        if creds.refresh_token:
            try:
                creds.refresh(Request())
                save_credentials(creds)
            except Exception as e:
                raise Exception("Token refresh failed. Reauthorization may be required.") from e
        else:
            raise Exception("No refresh token available. Please reauthorize.")
    return creds.token

if __name__ == '__main__':
    try:
        token = get_access_token()
        print(token)
    except Exception as err:
        print("Error:", err)
        sys.exit(1)
```
> **Usage:** Running this script (e.g., `./get_token.py`) prints a valid access token. msmtp uses it automatically.

*For details on Gmail OAuth 2.0 protocols, see Google’s documentation: citeturn0search4*

---

## 5. Testing and Sending Email

### a. Run the Authorization Script
Before sending mail, run:
```bash
cd ~/msmtp
./authorize.py
```
Follow the prompt: you will be asked to visit a URL, log into your Google account, and paste back an authorization code. This step creates (or updates) the credentials JSON file.

### b. Verify Token Retrieval
Test the token refresh script by running:
```bash
./get_token.py
```
It should print a valid access token to your terminal.

### c. Send a Test Email
Once msmtp is correctly configured (as in `/etc/msmtprc`), test sending an email:
```bash
echo -e "Subject: Test Email\n\nThis is a test email sent using msmtp with Gmail OAuth 2.0." | sendmail your-email@gmail.com
```
Or, create an email file and send it:
```bash
cat <<EOF > testmail.txt
From: Your Name <your-email@gmail.com>
To: Recipient Name <recipient@example.com>
Subject: Test Email from msmtp

Hello,

This is a test email sent from msmtp using OAuth 2.0.
EOF
msmtp recipient@example.com < testmail.txt
```

### d. Debugging and Logs
If sending fails, check the msmtp log file:
```bash
cat /home/pi/msmtp/msmtp.log
```
This log will detail any authentication issues or token errors.


---

## Summary

1. **Google Cloud Setup:**  
   - Create a new project, enable the Gmail API, configure the OAuth consent screen, and generate an OAuth client (download the JSON file).
2. **System Setup:**  
   - Install msmtp, msmtp-mta, Python 3, and required Python libraries.
3. **msmtp Configuration:**  
   - Edit `/etc/msmtprc` to use OAuth 2.0 (`auth oauthbearer`) and call your `get_token.py` script for dynamic token retrieval.
4. **OAuth Scripts:**  
   - Place `client_secret.json`, `config.json`, `authorize.py`, and `get_token.py` in a dedicated folder (e.g., `~/msmtp`).
   - Run `authorize.py` to perform the OAuth flow and save credentials.
   - Run `get_token.py` to ensure a valid token can be retrieved.
5. **Test Email:**  
   - Use the `sendmail` command to send a test email, and check logs if errors occur.

By following these steps on your Raspberry Pi (or Ubuntu), you will have successfully set up msmtp to send emails via Gmail using OAuth 2.0 authentication—ensuring enhanced security and compliance with Google’s new requirements.
