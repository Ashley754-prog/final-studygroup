# Railway Deployment Guide for Study Group System

## Overview
This guide will help you deploy your Study Group application on Railway.app using Docker.

## Prerequisites
- Railway.app account (new account since free trial ended)
- Git repository with your project code
- Docker installed on your local machine (optional but recommended)

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Get Started" or "Sign Up"
3. Choose a plan (starts at ~$5/month)
4. Add payment method and complete registration
5. Verify your email address

## Step 2: Create New Project on Railway
1. Click "New Project" in Railway dashboard
2. Choose "Deploy from GitHub repository"
3. Connect your GitHub account
4. Select your study group repository
5. Click "Import"

## Step 3: Configure Environment Variables
In your Railway project dashboard, add these environment variables:

### Backend Environment Variables:
```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=study_group

# JWT
JWT_SECRET=your_jwt_secret_key_here

# SendGrid (Email Service)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@studygroup.com
FROM_NAME=Study Squad

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables:
```
VITE_API_URL=http://your-railway-app-url.railway.app:5000
```

## Step 4: Create Dockerfile
Create a `Dockerfile` in your project root:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

## Step 5: Create docker-compose.yml
Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=study_group
      - JWT_SECRET=${JWT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - FROM_EMAIL=${FROM_EMAIL}
      - FROM_NAME=${FROM_NAME}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - PORT=5000
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=study_group
      - MYSQL_USER=root
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

volumes:
  mysql_data:
```

## Step 6: Update Package Scripts
Update your `package.json` scripts section:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step needed for backend'"
  }
}
```

## Step 7: Create Railway Service
1. In Railway project dashboard, click "New Service"
2. Choose "Dockerfile" option
3. Select the `docker-compose.yml` file
4. Click "Create Service"

## Step 8: Deploy
1. Railway will automatically detect your configuration
2. Click "Deploy" to start the deployment
3. Wait for the build and deployment to complete

## Step 9: Configure Database
1. Once deployed, access your MySQL service
2. Run these SQL commands to create your database:

```sql
CREATE DATABASE IF NOT EXISTS study_group;
USE study_group;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  middle_name VARCHAR(255),
  is_admin BOOLEAN DEFAULT 0,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  bio TEXT,
  profile_photo VARCHAR(255),
  google_id VARCHAR(255),
  verification_code VARCHAR(10),
  reset_password_token VARCHAR(255),
  reset_password_expire TIMESTAMP,
  language VARCHAR(50) DEFAULT 'English',
  timezone VARCHAR(100) DEFAULT 'Asia/Manila (GMT+8)',
  notifications BOOLEAN DEFAULT TRUE,
  two_factor_auth BOOLEAN DEFAULT FALSE
);

-- Create other necessary tables...
```

## Step 10: Test Your Deployment
1. Access your Railway app URL (provided in dashboard)
2. Test user registration and login
3. Test admin functionality
4. Test group creation and management
5. Test real-time features

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure MySQL service is running and accessible
2. **Environment Variables**: Double-check all required variables are set
3. **Port Conflicts**: Railway handles port mapping automatically
4. **Build Failures**: Check package.json and dependencies
5. **CORS Issues**: Ensure FRONTEND_URL is correctly set

### Railway Specific:
- Use Railway's built-in MySQL service for database
- Railway automatically handles SSL certificates
- Railway provides built-in logging and monitoring
- Railway automatically scales based on traffic

## Cost Considerations
- Railway: ~$5-20/month depending on usage
- MySQL: Included in Railway plans
- SendGrid: Free tier (100 emails/day) or paid plans
- Google OAuth: Free tier with usage limits

## Next Steps After Deployment
1. Monitor your application logs
2. Set up monitoring alerts
3. Configure backup strategies
4. Test all features thoroughly
5. Share your deployed application URL

## Support
If you encounter issues during deployment:
- Check Railway documentation at docs.railway.app
- Review Railway logs for error messages
- Ensure all environment variables are correctly set
- Verify database connectivity

Good luck with your deployment!
