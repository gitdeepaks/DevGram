# AWS Ubuntu Deployment Guide for DevGram Backend

This guide will help you deploy the DevGram backend API on an AWS Ubuntu instance.

## Prerequisites

- AWS Ubuntu instance (Ubuntu 20.04 LTS or later recommended)
- SSH access to your instance
- Code repository cloned to the instance
- MongoDB Atlas account (or MongoDB instance)
- Domain name (optional, for production)

---

## Step 1: Connect to Your AWS Instance

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

---

## Step 2: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Step 3: Install Bun Runtime

Since this project uses Bun, install it on your Ubuntu instance:

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH (for current session)
source ~/.bashrc

# Verify installation
bun --version
```

**Note:** If you prefer using Node.js instead of Bun, you can install Node.js:

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 4: Install Additional Dependencies

```bash
# Install build essentials (may be needed for some npm packages)
sudo apt install -y build-essential

# Install Git (if not already installed)
sudo apt install -y git
```

---

## Step 5: Navigate to Project Directory

```bash
cd /path/to/your/cloned/repo
# Example: cd ~/DevGram
```

---

## Step 6: Install Project Dependencies

**If using Bun:**
```bash
bun install
```

**If using Node.js:**
```bash
npm install
```

---

## Step 7: Set Up Environment Variables

Create or edit the `.env` file in your project root:

```bash
nano .env
```

Add the following variables:

```env
MONGODB_URI="your-mongodb-connection-string"
JWT_SECRET="your-jwt-secret-key"
```

**Important Security Notes:**
- Use a strong, randomly generated JWT_SECRET (at least 64 characters)
- Never commit `.env` file to Git
- Ensure MongoDB connection string has proper authentication

**Generate a secure JWT_SECRET:**
```bash
openssl rand -hex 64
```

---

## Step 8: Configure AWS Security Group

In your AWS Console:

1. Go to **EC2** → **Security Groups**
2. Select your instance's security group
3. Add **Inbound Rules**:
   - **Type:** Custom TCP
   - **Port:** 4100 (or your chosen port)
   - **Source:** 0.0.0.0/0 (or restrict to specific IPs for better security)
   - **Description:** DevGram Backend API

**For production with Nginx:**
- Open port **80** (HTTP)
- Open port **443** (HTTPS)
- Close port **4100** (only accessible via Nginx)

---

## Step 9: Install and Configure PM2 (Process Manager)

PM2 will keep your application running and restart it automatically if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Or with Bun
bun install -g pm2
```

**Start your application with PM2:**

**If using Bun:**
```bash
pm2 start "bun run src/index.js" --name devgram-api
```

**If using Node.js:**
```bash
pm2 start src/index.js --name devgram-api --interpreter node
```

**PM2 Useful Commands:**
```bash
# View running processes
pm2 list

# View logs
pm2 logs devgram-api

# Restart application
pm2 restart devgram-api

# Stop application
pm2 stop devgram-api

# Delete application from PM2
pm2 delete devgram-api

# Monitor application
pm2 monit
```

**Save PM2 configuration:**
```bash
pm2 save
```

---

## Step 10: Configure PM2 to Start on System Boot

```bash
# Generate startup script
pm2 startup

# Follow the command output (it will show a sudo command to run)
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current PM2 process list
pm2 save
```

---

## Step 11: (Optional) Set Up Nginx as Reverse Proxy

Nginx will act as a reverse proxy, providing better security and allowing you to use SSL.

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx

Create a new configuration file:

```bash
sudo nano /etc/nginx/sites-available/devgram
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**If you don't have a domain, use your server's IP:**
```nginx
server {
    listen 80;
    server_name _;  # Accepts any domain/IP

    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/devgram /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

## Step 12: (Optional) Set Up SSL with Let's Encrypt

For production, secure your API with HTTPS.

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx and set up auto-renewal.

**Auto-renewal test:**
```bash
sudo certbot renew --dry-run
```

---

## Step 13: Update CORS Configuration

If you're deploying to a production domain, update the CORS configuration in `src/index.js`:

```javascript
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:5174",
			"https://your-frontend-domain.com",  // Add your production frontend URL
		],
		credentials: true,
	})
);
```

After updating, restart your application:

```bash
pm2 restart devgram-api
```

---

## Step 14: Verify Deployment

### Test the API

```bash
# Test if server is running
curl http://localhost:4100

# Or if using Nginx
curl http://your-domain.com
# Or
curl http://your-server-ip
```

### Check Application Logs

```bash
pm2 logs devgram-api
```

### Check System Resources

```bash
pm2 monit
```

---

## Step 15: Firewall Configuration (UFW)

Configure Ubuntu's firewall:

```bash
# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Or allow direct access to port 4100 (if not using Nginx)
sudo ufw allow 4100/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

---

## Troubleshooting

### Application Not Starting

1. **Check logs:**
   ```bash
   pm2 logs devgram-api
   ```

2. **Verify environment variables:**
   ```bash
   cat .env
   ```

3. **Test MongoDB connection:**
   - Verify MongoDB URI is correct
   - Check MongoDB Atlas network access settings
   - Ensure your AWS instance IP is whitelisted in MongoDB Atlas

### Port Already in Use

```bash
# Find process using port 4100
sudo lsof -i :4100

# Kill the process if needed
sudo kill -9 <PID>
```

### Permission Issues

```bash
# Ensure proper file permissions
sudo chown -R ubuntu:ubuntu /path/to/your/project
```

### PM2 Not Starting on Boot

```bash
# Re-run PM2 startup
pm2 startup
pm2 save
```

---

## Maintenance Commands

### Update Application

```bash
cd /path/to/your/project
git pull origin main
bun install  # or npm install
pm2 restart devgram-api
```

### View Application Status

```bash
pm2 status
pm2 logs devgram-api --lines 50
```

### Restart Services

```bash
# Restart application
pm2 restart devgram-api

# Restart Nginx
sudo systemctl restart nginx
```

---

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords and SSH keys**

3. **Restrict MongoDB access:**
   - Whitelist only your AWS instance IP in MongoDB Atlas
   - Use strong database credentials

4. **Regular backups:**
   - Backup your `.env` file securely
   - Consider database backups

5. **Monitor logs regularly:**
   ```bash
   pm2 logs devgram-api
   ```

6. **Use environment variables:**
   - Never hardcode secrets
   - Keep `.env` out of version control

---

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] Security group configured
- [ ] Firewall (UFW) configured
- [ ] PM2 installed and configured
- [ ] Application starts on boot
- [ ] Nginx configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] CORS updated for production frontend
- [ ] Logs monitoring set up
- [ ] Backup strategy in place

---

## Quick Reference

```bash
# Start application
pm2 start "bun run src/index.js" --name devgram-api

# Stop application
pm2 stop devgram-api

# Restart application
pm2 restart devgram-api

# View logs
pm2 logs devgram-api

# View status
pm2 status

# Save PM2 configuration
pm2 save
```

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs devgram-api`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify MongoDB connection
4. Check firewall and security group settings

---

**Deployment completed!** Your DevGram backend should now be running on your AWS Ubuntu instance.
