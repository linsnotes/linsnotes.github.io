---
layout: post
title: Sending Email from Raspberry Pi Using msmtp with Gmail OAuth 2.0 
date: 2025-04-17 07:00:00 +0800
published: true #false or true
categories: linux
toc: true
media_subpath: /assets/media/2025/sending-email-from-raspberry-pi-using-msmtp-with-gmail-oauth2
image: raspi-email.webp
tags: [linux, debian, msmtp, oauth2.0]
---

## App Passwords No Longer Work – Use OAuth 2.0 for Gmail SMTP with msmtp
*(Note: OAuth 2.0 is now required for msmtp to work with Gmail because Google no longer supports simple password authentication.)*

This guide explains how to set up msmtp—a lightweight SMTP client—to send mail via Gmail using OAuth 2.0 (XOAUTH2) instead of static passwords. You will create a Google Cloud project, configure OAuth 2.0 (without needing to enable the Gmail API), install required software, set up msmtp as your system sendmail, and deploy two Python scripts for authorization and token refreshing.

---

## 1. Create and Configure Your Google Cloud Project

### a. Create a Google Account (if needed)
- Visit [Google Account Signup](https://accounts.google.com/signup) to create an account.

### b. Access the Google Cloud Console and Create a New Project
1. **Go to the Console:**  
   Open [Google Cloud Console](https://console.cloud.google.com/).
2. **Create a New Project:**  
   - Click the project drop-down in the top navigation bar.
   - Choose **New Project**.
   - Enter a project name (e.g., **msmtp**) and fill in any required details.
   - Click **Create** and wait for the project to initialize.

### c. Configure the OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** as the User Type.
3. Fill in the required fields:
   - **App name:** e.g., msmtp  
   - **User support email:** Your email address  
   - **App domain:** **Leave empty**
   - **Authorized domains:** **Leave empty**
   - Provide your developer contact information.
4. Save your settings.

### d. Create an OAuth Client ID
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Under **Application type**, choose **Desktop app**.
4. Provide a name (for example, “msmtp Desktop App”).
5. Click **Create**.
6. When the dialog appears, click **Download** to save the JSON file (rename it to `client_secret.json` if desired).
7. **Secure the file:**  
   On your Raspberry Pi/Ubuntu, set strict permissions:
   ```bash
   chmod 600 /home/pi/msmtp/client_secret.json
   ```

---

## 2. Important Note on OAuth 2.0 Scopes for Gmail SMTP Authentication

Gmail’s SMTP server uses the XOAUTH2 mechanism when you provide an OAuth token. Keep the following in mind:

- **XOAuth2 Mechanism:**  
  Gmail expects the token passed during authentication to have been generated with all necessary permissions.

- **Required Scope for SMTP:**  
  For SMTP (and IMAP/POP3) access, Gmail requires that the OAuth token include the full access scope:
  ```
  https://mail.google.com/
  ```
  This full scope guarantees that the token carries all the permissions the SMTP server expects.

- **Difference Between Gmail API and SMTP Access:**  
  - The Gmail API scope [`https://www.googleapis.com/auth/gmail.send`] is designed for the API’s send functionality and is more restrictive.  
  - msmtp relies on SMTP server authentication via XOAUTH2, which mandates a token with the full scope. Using only the `gmail.send` scope will result in authentication errors.

- **Common Error – “Username and Password Wrong”:**  
  If msmtp constructs an XOAUTH2 authentication string with a token generated under the restricted scope, Gmail’s SMTP server will reject it—leading to the “username and password wrong” error message.

- **Recommendation:**  
  Always use the full scope for SMTP authentication with msmtp:
  ```python
  SCOPES = ['https://mail.google.com/']
  ```
  Although this grants broader permissions, it is required for successful authentication.

---

## 3. Install Required Linux and Python Packages

### a. Update and Install System Packages
Open a terminal and run:
```bash
sudo apt update
sudo apt install msmtp msmtp-mta python3 python3-pip
```
- **msmtp & msmtp-mta:** Let you use msmtp as a sendmail replacement.
- **python3 & python3-pip:** Provide the environment for the OAuth token management scripts.

### b. Install Python Libraries for OAuth 2.0
Instead of using pip3, install the required Python libraries using apt:
```bash
sudo apt update
sudo apt install python3-google-auth python3-google-auth-oauthlib python3-google-auth-httplib2
```
Important: Check if google-auth-oauthlib was previously installed using pip. If it was, you should uninstall it to avoid conflicts with the system-installed version:
```bash
sudo pip show google-auth-oauthlib
```
If the package is listed, uninstall it with:
```bash
sudo pip uninstall google-auth-oauthlib --break-system-packages
```
---

## 4. Configure msmtp as the System Sendmail

### a. Edit the msmtp System Configuration File  
Open (or create) the file `/etc/msmtprc` with sudo:
```bash
sudo nano /etc/msmtprc
```
Insert the configuration below (adjust values where necessary):
```bash
# Global defaults
defaults
auth           oauthbearer
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

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
*Note:* The `auth oauthbearer` directive tells msmtp to use OAuth 2.0 rather than a static password. The `passwordeval` directive executes a Python script to supply a fresh access token each time msmtp is invoked.

Save and exit (in nano, press `Ctrl+O` then `Ctrl+X`).

---

## 5. Set Up Your OAuth 2.0 Scripts Folder

Create a dedicated folder (for example, `~/msmtp`) to store your OAuth files and scripts:
```bash
mkdir -p ~/msmtp
cd ~/msmtp
touch client_secret.json config.json authorize.py get_token.py
```
Copy or move the downloaded `client_secret.json` into this folder.

### a. Create the **config.json** File
Open `config.json` in your text editor and add:
```json
{
  "CLIENT_SECRETS_FILE": "/home/pi/msmtp/client_secret.json",
  "CRED_FILE": "/home/pi/msmtp/credentials.json"
}
```
*Tip:* Adjust the file paths if your directory structure is different.

### b. Create the **authorize.py** Script  
This script runs the initial OAuth authorization flow and saves your credentials. Open `authorize.py` and paste:
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
> **Usage:** Run this script once to authorize and generate your credentials:
> ```bash
> ./authorize.py
> ```

### c. Create the **get_token.py** Script  
This script is invoked by msmtp (via the `passwordeval` directive) to retrieve a valid access token, refreshing it if necessary. Open `get_token.py` and paste:
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
> **Usage:** Running this script (e.g., `./get_token.py`) prints a valid access token for msmtp to use.

---

## 6. Testing and Sending Email

### a. Run the Authorization Script
Before sending email, run:
```bash
cd ~/msmtp
./authorize.py
```
Follow the prompt by visiting the provided URL, logging into your Google account, and pasting back the authorization code. This step generates (or updates) the credentials JSON file.

### b. Verify Token Retrieval
Test the token refresh script by running:
```bash
./get_token.py
```
A valid access token should be printed to your terminal.

### c. Send a Test Email
Once msmtp is configured (per `/etc/msmtprc`), test email delivery:
```bash
echo -e "Subject: Test Email\n\nThis is a test email sent using msmtp with Gmail OAuth 2.0." | sendmail your-email@gmail.com
```
Alternatively, create an email file and send it:
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
If sending fails, check the msmtp log file for details:
```bash
cat /var/log/msmtp.log
```
The log file will help diagnose any authentication issues or token errors.

---

## 7. Summary

1. **Google Cloud Setup:**  
   - Create a new project.
   - Configure the OAuth consent screen with **App domain** and **Authorized domains** left empty.
   - Create an OAuth client (Desktop app) and secure the downloaded JSON file.

2. **System Setup:**  
   - Install msmtp, msmtp-mta, Python 3, and the necessary Python libraries.

3. **msmtp Configuration:**  
   - Configure `/etc/msmtprc` to use OAuth 2.0 (`auth oauthbearer`) with a `passwordeval` command calling your token script.

4. **OAuth Scripts:**  
   - Place `client_secret.json`, `config.json`, `authorize.py`, and `get_token.py` in a dedicated folder (e.g., `~/msmtp`).
   - Run `authorize.py` to perform the OAuth flow and save credentials.
   - Verify token retrieval with `get_token.py`.

5. **Important OAuth Scope Information:**  
   - Gmail’s SMTP server requires a token generated with the full scope [`https://mail.google.com/`]. Tokens with only the restricted `gmail.send` scope will not authenticate, causing a “username and password wrong” error.

6. **Test Email:**  
   - Send a test email using the `sendmail` command, and review logs if errors occur.

By following these updated steps on your Raspberry Pi or Ubuntu system, you will have successfully configured msmtp to send emails via Gmail using OAuth 2.0 authentication—ensuring both enhanced security and compliance with Google’s current requirements.