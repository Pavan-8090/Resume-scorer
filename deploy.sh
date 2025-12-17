#!/bin/bash

# ResumeChecker VPS Deployment Script
# This script automates the deployment process on Ubuntu VPS

set -e  # Exit on error

echo "🚀 ResumeChecker VPS Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root. Use a regular user with sudo privileges.${NC}"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully!${NC}"
    echo -e "${YELLOW}Please log out and log back in for Docker group changes to take effect.${NC}"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 0
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    sudo apt update
    sudo apt install docker-compose-plugin -y
    echo -e "${GREEN}Docker Compose installed!${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}.env file created!${NC}"
        echo -e "${YELLOW}Please edit .env file with your actual values before continuing.${NC}"
        echo -e "${YELLOW}Run: nano .env${NC}"
        read -p "Press Enter after you've edited .env file..."
    else
        echo -e "${RED}.env.example not found!${NC}"
        exit 1
    fi
fi

# Ask for deployment mode
echo ""
echo "Select deployment mode:"
echo "1) Production (docker-compose.prod.yml)"
echo "2) Development (docker-compose.yml)"
read -p "Enter choice [1-2]: " mode

if [ "$mode" == "1" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${GREEN}Using production configuration${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${GREEN}Using development configuration${NC}"
fi

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

# Build images
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker compose -f $COMPOSE_FILE build --no-cache

# Start services
echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${GREEN}Service Status:${NC}"
docker compose -f $COMPOSE_FILE ps

# Health check
echo ""
echo -e "${YELLOW}Performing health checks...${NC}"
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs backend"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may still be starting...${NC}"
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs frontend"
fi

# Display access information
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Health Check: http://localhost:5000/health"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop: docker compose -f $COMPOSE_FILE down"
echo "  Restart: docker compose -f $COMPOSE_FILE restart"
echo "  Status: docker compose -f $COMPOSE_FILE ps"
echo ""

# Ask about nginx setup
read -p "Do you want to set up Nginx reverse proxy? (y/n): " setup_nginx
if [ "$setup_nginx" == "y" ] || [ "$setup_nginx" == "Y" ]; then
    echo ""
    read -p "Enter your domain name (e.g., example.com): " domain
    if [ ! -z "$domain" ]; then
        echo -e "${YELLOW}Setting up Nginx for $domain...${NC}"
        
        # Create nginx config
        sudo tee /etc/nginx/sites-available/resumescore > /dev/null <<EOF
# Backend API
server {
    listen 80;
    server_name api.$domain;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Increase timeouts for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        client_max_body_size 50M;
    }
}

# Frontend
server {
    listen 80;
    server_name $domain www.$domain;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/resumescore /etc/nginx/sites-enabled/
        sudo nginx -t
        
        if [ $? -eq 0 ]; then
            sudo systemctl restart nginx
            echo -e "${GREEN}Nginx configured successfully!${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Update your DNS to point $domain and api.$domain to this server's IP"
            echo "2. Install SSL certificate:"
            echo "   sudo apt install certbot python3-certbot-nginx -y"
            echo "   sudo certbot --nginx -d $domain -d www.$domain -d api.$domain"
            echo "3. Update .env file with your domain URLs"
        else
            echo -e "${RED}Nginx configuration test failed!${NC}"
        fi
    fi
fi

# Ask about systemd service
read -p "Do you want to set up auto-start on reboot? (y/n): " setup_systemd
if [ "$setup_systemd" == "y" ] || [ "$setup_systemd" == "Y" ]; then
    WORK_DIR=$(pwd)
    SERVICE_FILE="/etc/systemd/system/resumescore.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=ResumeChecker Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$WORK_DIR
ExecStart=/usr/bin/docker compose -f $COMPOSE_FILE up -d
ExecStop=/usr/bin/docker compose -f $COMPOSE_FILE down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable resumescore
    echo -e "${GREEN}Systemd service configured! Services will auto-start on reboot.${NC}"
fi

echo ""
echo -e "${GREEN}All done! Your ResumeChecker is now running.${NC}"


