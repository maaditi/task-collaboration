# Complete Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Production Deployment Options](#production-deployment-options)
3. [Heroku Deployment](#heroku-deployment)
4. [Render.com Deployment](#rendercom-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Vercel + Railway Deployment](#vercel--railway-deployment)
7. [Docker Deployment](#docker-deployment)
8. [MongoDB Atlas Setup](#mongodb-atlas-setup)
9. [Environment Variables](#environment-variables)
10. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Local Development Setup

### Prerequisites Check
```bash
# Check Node.js version (should be 16+)
node --version

# Check npm version
npm --version

# Check MongoDB installation
mongod --version

# Check Git
git --version
```

### Step-by-Step Setup

#### 1. Start MongoDB
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (Ubuntu/Debian)
sudo systemctl start mongod
sudo systemctl enable mongod

# Windows
# Start MongoDB as a service from Services app
# Or run: "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
```

#### 2. Backend Setup
```bash
# Clone repository
git clone <your-repo-url>
cd task-collaboration-platform/backend

# Install dependencies
npm install

# Create and configure .env file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor

# Start development server
npm run dev

# Server should be running on http://localhost:5000
```

#### 3. Frontend Setup
```bash
# Open new terminal
cd task-collaboration-platform/frontend

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start development server
npm start

# Frontend should open at http://localhost:3000
```

#### 4. Verify Setup
```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"OK","message":"Server is running"}
```

---

## Production Deployment Options

| Platform | Backend | Frontend | Database | Cost |
|----------|---------|----------|----------|------|
| Heroku + Vercel | ✅ | ✅ | MongoDB Atlas | Free tier available |
| Render.com | ✅ | ✅ | MongoDB Atlas | Free tier available |
| Railway + Vercel | ✅ | ✅ | MongoDB Atlas | Free tier available |
| AWS EC2 | ✅ | ✅ | MongoDB Atlas / AWS DocumentDB | Pay as you go |
| DigitalOcean | ✅ | ✅ | MongoDB Atlas / DO MongoDB | $5/month minimum |
| Docker | ✅ | ✅ | Self-hosted | Infrastructure cost |

---

## Heroku Deployment

### Backend Deployment to Heroku

#### 1. Prepare Heroku Account
```bash
# Install Heroku CLI
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login
```

#### 2. Create Heroku App
```bash
cd backend

# Create Procfile
echo "web: node server.js" > Procfile

# Create app
heroku create your-app-name-backend

# Add buildpack
heroku buildpacks:set heroku/nodejs
```

#### 3. Configure Environment Variables
```bash
# Set all required environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_EXPIRE=7d
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set CLIENT_URL=https://your-frontend-domain.vercel.app

# Verify config
heroku config
```

#### 4. Deploy
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Deploy to Heroku
git push heroku main

# Or if you're on a different branch
git push heroku your-branch:main

# View logs
heroku logs --tail

# Open app
heroku open
```

### Frontend Deployment to Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy Frontend
```bash
cd frontend

# Create .env.production file
cat > .env.production << EOF
REACT_APP_API_URL=https://your-app-name-backend.herokuapp.com/api
REACT_APP_SOCKET_URL=https://your-app-name-backend.herokuapp.com
EOF

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# Set up and deploy: Y
# Which scope: Your account
# Link to existing project: N
# Project name: task-collaboration-frontend
# Directory: ./
# Override settings: N

# For production deployment
vercel --prod
```

---

## Render.com Deployment

### Complete Setup on Render

#### 1. Create Account
- Go to [Render.com](https://render.com)
- Sign up with GitHub

#### 2. Deploy Backend (Web Service)

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: taskflow-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_generated_secret
   JWT_EXPIRE=7d
   CLIENT_URL=https://your-frontend.onrender.com
   ```

5. Click "Create Web Service"

#### 3. Deploy Frontend (Static Site)

1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: taskflow-frontend
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://taskflow-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://taskflow-backend.onrender.com
   ```

5. Click "Create Static Site"

---

## AWS Deployment

### AWS EC2 + MongoDB Atlas

#### 1. Launch EC2 Instance

```bash
# Create new EC2 instance (Ubuntu 22.04 LTS)
# Instance type: t2.micro (free tier)
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22), Custom TCP (5000)

# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

#### 2. Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx
```

#### 3. Deploy Backend
```bash
# Clone repository
git clone <your-repo-url>
cd task-collaboration-platform/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add production environment variables

# Start with PM2
pm2 start server.js --name taskflow-backend
pm2 save
pm2 startup
```

#### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/taskflow

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 6. Deploy Frontend

Use Vercel/Netlify for frontend or:

```bash
cd ../frontend
npm install
npm run build

# Copy build to nginx directory
sudo cp -r build/* /var/www/html/
```

---

## Vercel + Railway Deployment

### Backend on Railway

#### 1. Setup Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=your_mongodb_atlas_uri
railway variables set JWT_SECRET=your_secret
railway variables set CLIENT_URL=https://your-app.vercel.app

# Deploy
railway up
```

### Frontend on Vercel
Same as Heroku section above.

---

## Docker Deployment

### Create Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/taskflow
      - JWT_SECRET=your_secret_key
      - CLIENT_URL=http://localhost:3000
    depends_on:
      - mongo
    networks:
      - taskflow-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - taskflow-network

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - taskflow-network

volumes:
  mongo-data:

networks:
  taskflow-network:
```

### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Deploy to cloud
# Push to Docker Hub
docker tag taskflow-backend:latest yourusername/taskflow-backend:latest
docker push yourusername/taskflow-backend:latest
```

---

## MongoDB Atlas Setup

### Step-by-Step Guide

#### 1. Create Account
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up for free account

#### 2. Create Cluster
1. Click "Build a Database"
2. Choose "FREE" Shared tier
3. Select cloud provider and region (choose closest to your server)
4. Cluster name: "TaskFlow"
5. Click "Create Cluster"

#### 3. Configure Access
1. **Database Access**:
   - Click "Database Access" in sidebar
   - Click "Add New Database User"
   - Username: `taskflow_user`
   - Password: Generate secure password
   - Built-in Role: "Read and write to any database"
   - Click "Add User"

2. **Network Access**:
   - Click "Network Access" in sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific server IPs
   - Click "Confirm"

#### 4. Get Connection String
1. Click "Databases" in sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy connection string:
   ```
   mongodb+srv://taskflow_user:<password>@taskflow.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with actual password
6. Add database name: `/taskflow` before the `?`

Final connection string:
```
mongodb+srv://taskflow_user:yourpassword@taskflow.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
```

---

## Environment Variables

### Backend (.env)
```bash
# Required
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-url.com

# Optional
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

### Generate Secure JWT Secret
```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using online tool
# https://www.grc.com/passwords.htm
```

---

## Post-Deployment Checklist

### Backend Verification
- [ ] Health endpoint accessible: `https://your-backend.com/api/health`
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database connection successful
- [ ] WebSocket connection working
- [ ] Rate limiting active
- [ ] HTTPS enabled
- [ ] Logs accessible

### Frontend Verification
- [ ] App loads without errors
- [ ] API calls successful
- [ ] WebSocket connecting
- [ ] Authentication working
- [ ] All routes accessible
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Performance acceptable (Lighthouse score)

### Security Checklist
- [ ] JWT secret is secure and random
- [ ] Database credentials secured
- [ ] Environment variables not in version control
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation working
- [ ] Error messages don't expose sensitive info

### Monitoring Setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Alerts configured

### Testing
```bash
# Test registration
curl -X POST https://your-backend.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Test login
curl -X POST https://your-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test protected route
curl https://your-backend.com/api/boards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting Common Issues

### Database Connection Failed
```bash
# Check MongoDB Atlas IP whitelist
# Verify connection string format
# Test connection string locally:
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/taskflow"
```

### CORS Errors
```javascript
// backend/server.js - Verify CORS config
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### WebSocket Not Connecting
```javascript
// Check Socket.IO CORS
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});
```

### Build Failures
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

---

## Scaling for Production

### Performance Optimizations
1. Enable gzip compression
2. Add CDN for static assets
3. Implement caching with Redis
4. Use MongoDB indexes
5. Enable connection pooling

### High Availability
1. Deploy multiple backend instances
2. Use load balancer
3. MongoDB replica set
4. Implement health checks
5. Auto-scaling policies

### Monitoring Commands
```bash
# Heroku
heroku logs --tail --app your-app-name
heroku ps --app your-app-name

# PM2 (on EC2)
pm2 logs
pm2 monit
pm2 status

# Docker
docker-compose logs -f backend
docker stats
```

This comprehensive guide should enable successful deployment on any major platform!
