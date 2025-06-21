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

## Step 1. Create and Configure Your Google Cloud Project

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
1. Navigate to **APIs & Services > OAuth consent screen > Get Started**.
2. Fill in the required fields:
   - App Information: App name, User support email
   - Audience: select "External"
   - Contact information: Email adresses
   - Finish

### d. Create an OAuth Client ID
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
   - Under **Application type**, choose **Desktop app**.
   - Name of your OAuth 2.0 client (for example, “Raspberry Pi 5”).
5. Click **Create**.
6. When the dialog appears, click **Download** to save the JSON file (This is needed for Step 3).

---

## Important Note on OAuth 2.0 Scopes for Gmail SMTP Authentication
> Just a side note — NO ACTION is needed for this part.

You do **NOT** need to enable the Gmail API.

- **Difference Between Gmail API and SMTP Access:**

  * The Gmail API scope \[`https://www.googleapis.com/auth/gmail.send`] is intended only for the API’s own send-message endpoint and is therefore more restrictive.
  * Supplying only the `gmail.send` scope will cause XOAUTH2 authentication failures.
  * `msmtp` authenticates to Gmail’s regular SMTP server via XOAUTH2, which requires a token bearing the full Gmail scope. 

- **Required Scope for SMTP:**  
  For SMTP (and IMAP/POP3) access, Gmail requires that the OAuth token include the full access scope:
  ```
  https://mail.google.com/
  ```
  This full scope guarantees that the token carries all the permissions the SMTP server expects. Although this grants broader permissions, it is required for successful authentication.

- **Common Error – “Username and Password Wrong”:**  
  If msmtp constructs an XOAUTH2 authentication string with a token generated under the restricted scope, Gmail’s SMTP server will reject it—leading to the “username and password wrong” error message.

---

## Step 2. Install Required Linux and Python Packages

### a. Install Required Packages
On your Raspberry Pi, open the terminal and run the following two commands:
```bash
sudo apt update
sudo apt install msmtp msmtp-mta python3 python3-pip python3-google-auth python3-google-auth-oauthlib python3-google-auth-httplib2
```
- **msmtp & msmtp-mta:**
  Let you use msmtp as a sendmail replacement.
- **python3 python3-pip python3-google-auth python3-google-auth-oauthlib python3-google-auth-httplib2:**
  Provide the environment for the OAuth token management scripts.

⚠️ **Important:****Use `apt` instead of `pip` to install the required Python libraries.**
- Before proceeding, check if `google-auth-oauthlib` was previously installed using `pip`. If it was, uninstall it to prevent conflicts with the version installed by `apt`. The version of `google-auth-oauthlib` installed via apt is older, but it includes the `run_console()` function — which is required by the Python script you'll use later.

```bash
sudo pip show google-auth-oauthlib
```
If the package is listed, uninstall it with:
```bash
sudo pip uninstall google-auth-oauthlib --break-system-packages
```
---




## Step 3. Set Up msmtp and OAuth 2.0 Scripts Folder 
Tip: It’s best to SSH into your Raspberry Pi from another computer that has a web browser. This makes it easier to copy and paste the commands and scripts.

Create a dedicated folder (for example, `~/msmtp`) to store your OAuth files and scripts:
```bash
mkdir -p ~/msmtp
cd ~/msmtp
touch client_secret.json config.json authorize.py get_token.py msmtp.log 
```
### client_secret.json
In Step 1, you downloaded your OAuth client ID credentials. Now, copy and paste the contents of that file into `~/msmtp/client_secret.json`.

### **authorize.py**
This script runs the initial OAuth authorization flow and saves your credentials. Open `~/msmtp/authorize.py` and paste:
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


### **get_token.py**
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
        print("Access token retrieved successfully.")
    except Exception as err:
        print("Error:", err)
        sys.exit(1)
```


### **config.json**
Open `~/msmtp/config.json` and paste:
```json
{
  "CLIENT_SECRETS_FILE": "/home/pi/msmtp/client_secret.json",  
  "CRED_FILE": "/home/pi/msmtp/credentials.json"
}
```
Adjust the file paths if your directory structure is different.

### Run these commands to ensure that the scripts are executable and that the current user has the correct ownership:
```bash
sudo chmod +x ~/msmtp/authorize.py ~/msmtp/get_token.py
sudo chown -R "$(whoami):$(whoami)" ~/msmtp
chmod 600 ~/msmtp/client_secret.json  # sets read/write permission for owner only
```

---

## Step 4. Configure msmtp as the System Sendmail

### a. Edit the msmtp System Configuration File  
Open (or create) the file `/etc/msmtprc` with sudo:
```bash
sudo nano /etc/msmtprc
```
Copy and paste the configuration below, making sure to adjust any values as needed for your setup:
```bash
# Global defaults
defaults
auth           oauthbearer
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /home/pi/msmtp/msmtp.log   # Change this to your preferred log file path

# Gmail account configuration
account        gmail
host           smtp.gmail.com
port           587
from           your-email@gmail.com       # Change this to your own Gmail address that will be used to send emails
user           your-email@gmail.com       # Change this to your own Gmail address that will be used to send emails
passwordeval   "python3 /home/pi/msmtp/get_token.py"     # Change this to the location of your script

# Set a default account
account default : gmail
```
*Note:* The `auth oauthbearer` directive tells msmtp to use OAuth 2.0 rather than a static password. The `passwordeval` directive executes a Python script to supply a fresh access token each time msmtp is invoked.

Save and exit (in nano, press `Ctrl+O` then `Ctrl+X`).





## Step 5. Testing and Sending Email

### **Usage:**
From within the `msmtp` directory:
1. Run `./authorize.py` once to authorize and generate your credentials.
2. Then run `./get_token.py` to print a valid access token for `msmtp` to use.


### a. Run the Authorization Script
```bash
cd ~/msmtp
./authorize.py  # authorize and generate credentials
```
Follow the prompt by visiting the provided URL, logging into your Google account, and pasting back the authorization code. This step generates (or updates) the credentials JSON file `credentials.json` in `~/msmtp` directory.

### b. Verify Token Retrieval
Test the token refresh script by running:
```bash
./get_token.py
```
You should see the message: "Access token retrieved successfully." — this confirms that the token was successfully obtained.




### c. Send a Test Email

Once `msmtp` is properly configured (via `/etc/msmtprc`), it acts as a lightweight SMTP client that can send email via Gmail using OAuth 2.0. You can test email delivery.

When configured correctly, **any system process or script that sends mail via `sendmail` will automatically use `msmtp` under the hood**. This includes tools like `cron`, `logwatch`, or custom alert scripts — making it a simple and secure way to receive automated system notifications via Gmail.


**Quick one-liner test using `sendmail`**

```bash
echo -e "Subject: Test Email\n\nThis is a test email sent using msmtp with Gmail OAuth 2.0." | sendmail recipient-email@gmail.com
```

This confirms that the `sendmail` command is correctly routed to `msmtp`.



**Create a test email file and send it manually**

```bash
cat <<EOF > testmail.txt
From: Your Name <your-email@gmail.com>
To: Recipient Name <recipient@example.com>
Subject: Test Email from msmtp

Hello,

This is a test email sent from msmtp using OAuth 2.0.
EOF
```
```bash
msmtp recipient@example.com < testmail.txt
```

> This method gives you more control over the message structure and headers, and is helpful for debugging formatting or content issues.



### d. Debugging and Logs
If sending fails, check the msmtp log file for details:
```bash
cat ~/msmtp/msmtp.log
```
The log file will help diagnose any authentication issues or token errors.

---

## Summary

1. **Google Cloud Setup:**  
   - Create a new project.
   - Configure the OAuth consent screen.
   - Create an OAuth 2.0 Client ID.

2. **System Setup:**  
   - Install msmtp, msmtp-mta, Python 3, and the necessary Python libraries.

3. **Scripts:**  
   - Place `client_secret.json`, `config.json`, `authorize.py`, `get_token.py` and `msmtp.log`  in a dedicated folder (e.g., `~/msmtp`).
   - Run `./authorize.py` to perform the OAuth flow and save credentials.
   - Verify token retrieval with `./get_token.py`.

4. **msmtp Configuration:**  
   - Configure `/etc/msmtprc` to use OAuth 2.0 (`auth oauthbearer`) with a `passwordeval` command calling your token script.

5. **Test Email:**  
   - Send a test email using the `sendmail` command, and review logs if errors occur.

By following these updated steps on your Raspberry Pi or Ubuntu system, you will have successfully configured msmtp to send emails via Gmail using OAuth 2.0 authentication—ensuring both enhanced security and compliance with Google’s current requirements.
