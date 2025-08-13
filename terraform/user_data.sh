#!/bin/bash
# User data script for EC2 instances
# This script will run when the instance starts

# Update system
apt update -y
apt upgrade -y

# Install required packages
apt install -y curl wget gnupg2 software-properties-common

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb

# Install SSM agent (if not already installed)
snap install amazon-ssm-agent --classic
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

# Create application directory and log directory
mkdir -p /opt/homematch
mkdir -p /var/log/homematch
chown ubuntu:ubuntu /var/log/homematch
cd /opt/homematch

# Create environment file
cat > .env << EOF
NODE_ENV=production
DB_HOST=${db_host}
DB_NAME=${db_name}
DB_USERNAME=${db_username}
DB_PASSWORD=${db_password}
DB_PORT=5432
EOF

# Create a simple health check endpoint
cat > health.js << 'EOF'
const http = require('http');
const fs = require('fs');
const path = require('path');

// Setup logging
const logFile = '/var/log/homematch/application.log';
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = timestamp + ' - ' + message + '\n';
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
};

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    log('Health check requested');
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    log('404 - ' + req.url);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  log('Health check server running on port ' + PORT);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});
EOF

# Create systemd service file for health check
cat > /etc/systemd/system/homematch-health.service << 'EOF'
[Unit]
Description=HomeMatch Health Check Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/homematch
ExecStart=/usr/bin/node health.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/homematch/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable homematch-health.service
systemctl start homematch-health.service

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/homematch",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/homematch/*.log",
            "log_group_name": "/aws/ec2/homematch",
            "log_stream_name": "{instance_id}/application"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure Nginx as reverse proxy
cat > /etc/nginx/sites-available/homematch << 'EOF'
server {
    listen 80;
    server_name _;

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Main application routes
    location / {
        proxy_pass http://localhost:3000;
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
EOF

# Enable the site and remove default
ln -sf /etc/nginx/sites-available/homematch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration and restart
nginx -t
systemctl enable nginx
systemctl restart nginx

# Set proper permissions
chown -R ubuntu:ubuntu /opt/homematch

echo "EC2 instance initialization completed" >> /var/log/user-data.log