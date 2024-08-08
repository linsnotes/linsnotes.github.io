### Simple Guide for Ubuntu/Debian Configuration

1. **Set up Firewall**
   ```bash
   sudo apt update
   sudo apt install wget -y
   wget https://raw.githubusercontent.com/linsnotes/iptables-setup/main/configure-iptables.sh
   chmod +x configure-iptables.sh
   sudo ./configure-iptables.sh
   ```

2. **Generate SSH Key**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

3. **Configure `sshd`**
   ```bash
   sudo nano /etc/ssh/sshd_config.d/mysshd
   # Add or modify configurations as needed, then restart SSH service
   sudo systemctl restart sshd
   ```

4. **Run SSH Login Alert Script**
   ```bash
   wget https://raw.githubusercontent.com/linsnotes/ssh-login-alert/main/ssh-login-alert.sh
   chmod +x ssh-login-alert.sh
   sudo ./ssh-login-alert.sh
   ```

5. **Set Up 2FA**
   ```bash
   sudo apt install libpam-google-authenticator
   google-authenticator
   sudo nano /etc/pam.d/sshd
   # Comment: # @include common-auth
   # Add: auth required pam_google_authenticator.so
   sudo systemctl restart sshd
   ```

6. **Run the WireGuard Script**
   ```bash
   wget https://raw.githubusercontent.com/linsnotes/wireguard-vpn-server-script/main/wgvpn.sh
   chmod +x wgvpn.sh
   sudo ./wgvpn.sh
   ```

7. **Create Aliases**
   ```bash
   sudo nano /etc/profile.d/myaliases.sh
   # Add aliases, make script executable
   sudo chmod +x /etc/profile.d/myaliases.sh
   source /etc/profile.d/myaliases.sh
   ```

### Conclusion
These simplified steps cover the essential configurations for setting up a firewall, SSH key, SSH daemon, SSH login alerts, 2FA, WireGuard VPN, and custom aliases on Ubuntu/Debian.
