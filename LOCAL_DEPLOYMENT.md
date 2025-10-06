# SinceOnEarth Flight Tracker - Local Deployment Guide

This guide will help you run and deploy the SinceOnEarth Flight Tracker application on your local machine or any hosting platform.

## Prerequisites

- **Node.js** (v20 or later)
- **npm** (comes with Node.js)
- **PostgreSQL database** (local or cloud-hosted like Neon, Supabase, Railway)

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection
NEON_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key-here

# Optional: Aviationstack API (for flight lookup)
AVIATIONSTACK_API_KEY=your-api-key-here
```

**Important Notes:**
- Replace the `NEON_DATABASE_URL` with your actual PostgreSQL connection string
- Generate a secure random string for `SESSION_SECRET` (you can use: `openssl rand -base64 32`)
- The Aviationstack API key is optional but required for the flight lookup feature

### 3. Set Up the Database

The app uses Drizzle ORM. To sync your database schema:

```bash
npm run db:push
```

This will create all necessary tables in your PostgreSQL database.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates:
- Frontend build in `dist/client/`
- Backend build in `dist/`

### 2. Run Production Server

```bash
npm start
```

The production server will run on port 5000 (or the PORT environment variable).

## Deployment Options

### Option 1: VPS/Cloud Server (DigitalOcean, AWS, etc.)

1. **Upload your code** to the server (via git, scp, etc.)
2. **Install Node.js** on the server
3. **Set environment variables** in production
4. **Install dependencies**: `npm install --production`
5. **Build the app**: `npm run build`
6. **Use PM2 to run the app**:

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start dist/index.js --name sinceonearth

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

7. **Set up Nginx as reverse proxy** (optional but recommended):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NEON_DATABASE_URL=${NEON_DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Vercel/Netlify (Serverless)

This app uses Express and needs a Node.js server, so it's best suited for:
- **Vercel** (supports serverless functions)
- **Railway** (recommended - easy deployment)
- **Render** (free tier available)

For Railway:
1. Connect your GitHub repo
2. Set environment variables in Railway dashboard
3. Railway auto-detects and deploys Node.js apps

### Option 4: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NEON_DATABASE_URL="your-database-url"
heroku config:set SESSION_SECRET="your-secret"

# Deploy
git push heroku main
```

## Database Setup Options

You need a PostgreSQL database. Here are some options:

### Option 1: Neon (Serverless Postgres - Recommended)
- Sign up at [neon.tech](https://neon.tech)
- Create a project
- Copy the connection string
- Free tier: 0.5 GB storage, always available

### Option 2: Supabase
- Sign up at [supabase.com](https://supabase.com)
- Create a project
- Get connection string from Settings > Database
- Free tier: 500 MB storage

### Option 3: Railway
- Sign up at [railway.app](https://railway.app)
- Add PostgreSQL service
- Get connection string from Variables tab

### Option 4: Local PostgreSQL
```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt install postgresql

# macOS
brew install postgresql

# Start PostgreSQL
sudo service postgresql start

# Create database
createdb sinceonearth

# Connection string format
postgresql://username:password@localhost:5432/sinceonearth
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEON_DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret key for session encryption |
| `AVIATIONSTACK_API_KEY` | No | API key for flight data lookup |
| `NODE_ENV` | No | Set to 'production' for production |
| `PORT` | No | Port to run server (default: 5000) |

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
- Check if your database URL is correct
- Ensure your database server is running
- Check if your IP is whitelisted (for cloud databases)
- Verify SSL mode settings

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Admin User Setup

After deployment, you need to manually set a user as admin:

1. Register a user through the app
2. Connect to your database
3. Run this SQL:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

## Support

For issues or questions about the app, refer to the codebase or create an issue in your repository.

## License

MIT
