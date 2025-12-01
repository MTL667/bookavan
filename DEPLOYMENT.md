# 🚀 BookAVan Deployment Guide

This guide covers deploying BookAVan to Easypanel and other platforms.

## 📦 Easypanel Deployment (Recommended)

Easypanel provides the simplest deployment experience with automatic SSL, database management, and **internal service links** (no manual credentials needed!).

> 📘 **Gedetailleerde Easypanel Gids**: Zie [`EASYPANEL_SETUP.md`](EASYPANEL_SETUP.md) voor een complete stap-voor-stap handleiding met screenshots en troubleshooting.

### Prerequisites

- Easypanel account
- GitHub/GitLab repository with your code
- SendGrid account
- Microsoft Entra ID application

### Quick Start with Internal Links

BookAVan is geconfigureerd om **DATABASE_URL** te gebruiken via Easypanel's interne service links:

```env
DATABASE_URL = [Link to bookavan-db]  ← Easypanel doet dit automatisch!
```

**Geen losse credentials nodig** - Easypanel genereert automatisch:
```
postgresql://user:password@service:5432/database
```

### Step-by-Step Deployment

#### 1. Prepare Your Repository

1. Push all code to your Git repository
2. Ensure all files are committed including:
   - `Dockerfile`
   - `package.json`
   - `server.js`
   - `public/` folder
   - `database/` folder

#### 2. Create PostgreSQL Database in Easypanel

1. Log into Easypanel
2. Go to your project
3. Click **"Services"** → **"Create Service"**
4. Select **"PostgreSQL"**
5. Configure:
   - **Service Name:** `bookavan-db`
   - **Version:** 15 or latest
   - **Database Name:** `bookavan`
   - **Username:** `bookavan`
   - **Password:** (generate strong password)
6. Click **"Create"**
7. Wait for database to be ready
8. **Note down the connection details** (found in service settings)

#### 3. Create the BookAVan App

1. In Easypanel, click **"Apps"** → **"Create App"**
2. Select **"From Source Code"**
3. Configure Git connection:
   - **Repository URL:** Your Git repo URL
   - **Branch:** `main` (or your default branch)
   - **Build Type:** Docker
   - **Dockerfile Path:** `./Dockerfile`

#### 4. Configure Environment Variables

In the app settings, add these environment variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# PostgreSQL Connection (RECOMMENDED: Use internal link)
DATABASE_URL=[Link to bookavan-db service]  ← Easypanel link feature

# Alternative: Individual credentials (not needed if DATABASE_URL is set)
# PGHOST=bookavan-db
# PGPORT=5432
# PGUSER=bookavan
# PGPASSWORD=your_generated_password
# PGDATABASE=bookavan

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourcompany.com

# Microsoft Entra ID
# Comma-separated list of allowed tenant IDs
ENTRA_ALLOWED_TENANTS=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Admin Users
# Comma-separated list of admin email addresses
ADMIN_EMAILS=admin@yourcompany.com,it@yourcompany.com
```

#### 5. Configure Domain

1. In app settings, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain: `bookavan.yourcompany.com`
4. Easypanel will automatically:
   - Configure DNS (add CNAME record shown)
   - Generate SSL certificate
   - Set up HTTPS redirect

#### 6. Configure Ports

1. Go to **"Ports"**
2. Add port mapping:
   - **Container Port:** 3000
   - **Public:** Yes
   - **HTTPS:** Yes (recommended)

#### 7. Deploy

1. Click **"Deploy"**
2. Easypanel will:
   - Clone your repository
   - Build Docker image
   - Start container
   - Connect to database
   - Provision SSL certificate

3. Monitor deployment in **"Logs"** section

#### 8. Initialize Database

The database schema is automatically created if you mapped the schema file correctly. If not:

1. Go to your PostgreSQL service in Easypanel
2. Click **"Console"**
3. Run:
```bash
psql -U bookavan -d bookavan
```
4. Copy and paste contents of `database/schema.sql`
5. Execute

Or use the built-in SQL console in Easypanel PostgreSQL service.

#### 9. Update Frontend Configuration

After deployment, you need to inject your Entra ID client ID:

**Option A: Server-side injection (recommended)**

Update `server.js` to inject config into HTML:

```javascript
app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const injectedHtml = html.replace(
    '</head>',
    `<script>
      window.ENTRA_CLIENT_ID = "${process.env.ENTRA_CLIENT_ID}";
      window.ADMIN_EMAILS = "${process.env.ADMIN_EMAILS}";
    </script></head>`
  );
  res.send(injectedHtml);
});
```

**Option B: Static configuration**

Edit `public/index.html` directly:

```html
<script>
  window.ENTRA_CLIENT_ID = "your-client-id-here";
  window.ADMIN_EMAILS = "admin@company.com";
</script>
```

#### 10. Test Deployment

1. Visit your domain: `https://bookavan.yourcompany.com`
2. Test authentication with Microsoft account
3. Create a test booking
4. Verify email is received
5. Test admin functions (if applicable)

### Monitoring & Maintenance

#### View Logs

1. Go to your app in Easypanel
2. Click **"Logs"**
3. View real-time logs
4. Filter by severity

#### Health Checks

Easypanel automatically monitors your app health at `/health`

#### Restart App

1. Go to app settings
2. Click **"Restart"**

#### Update App

1. Push changes to Git repository
2. In Easypanel, click **"Redeploy"**
3. Or enable auto-deploy on Git push

#### Database Backups

1. Go to PostgreSQL service
2. Click **"Backups"**
3. Schedule automatic backups
4. Download backups as needed

---

## 🐳 Alternative: Docker Compose (Local/VPS)

For deployment on a VPS or local development:

### 1. Clone Repository

```bash
git clone https://github.com/yourcompany/bookavan.git
cd bookavan
```

### 2. Configure Environment

Create `.env` file:

```env
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@company.com
ENTRA_ALLOWED_TENANTS=tenant-id
ADMIN_EMAILS=admin@company.com
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Access Application

Visit: `http://localhost:3000`

### 5. Stop Services

```bash
docker-compose down
```

---

## ☁️ Alternative: Cloud Platforms

### AWS ECS/Fargate

1. Push Docker image to ECR
2. Create ECS task definition
3. Deploy to Fargate
4. Use RDS for PostgreSQL
5. Configure Application Load Balancer

### Google Cloud Run

1. Push image to Google Container Registry
2. Deploy to Cloud Run
3. Use Cloud SQL for PostgreSQL
4. Configure custom domain

### Azure Container Instances

1. Push to Azure Container Registry
2. Create Container Instance
3. Use Azure Database for PostgreSQL
4. Configure Azure DNS

### DigitalOcean App Platform

1. Connect Git repository
2. Configure as Docker app
3. Add managed PostgreSQL database
4. Configure environment variables

---

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Use strong PostgreSQL password
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Review admin email list
- [ ] Test authentication flow
- [ ] Verify SendGrid sender authentication
- [ ] Review environment variables
- [ ] Test all API endpoints
- [ ] Enable rate limiting (optional)
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Review Docker security

---

## 📊 Post-Deployment

### Monitoring

Set up monitoring for:
- Application uptime
- Database connections
- API response times
- Error rates
- Email delivery rates

### Backup Strategy

- Database: Daily automated backups
- Uploaded photos: Regular backups to object storage
- Configuration: Version control all settings

### Scaling

If you need to scale:

1. **Horizontal scaling:** Add more app containers
2. **Database:** Upgrade to larger PostgreSQL instance
3. **Media storage:** Move uploads to S3/CloudStorage
4. **Caching:** Add Redis for session management

---

## 🆘 Troubleshooting

### App won't start

1. Check logs: `docker logs bookavan-app`
2. Verify environment variables
3. Test database connection
4. Check port availability

### Can't connect to database

1. Verify `PGHOST` is correct
2. Check PostgreSQL is running
3. Test connection: `psql -h $PGHOST -U $PGUSER -d $PGDATABASE`
4. Check firewall rules

### Authentication not working

1. Verify Entra ID client ID
2. Check redirect URIs match deployment URL
3. Verify tenant IDs are correct
4. Check browser console for errors

### Emails not sending

1. Verify SendGrid API key
2. Check sender email is verified
3. Review SendGrid dashboard for errors
4. Check email quota

---

## 📞 Support

For deployment assistance:
- **Email:** it@yourcompany.com
- **Docs:** https://docs.easypanel.io
- **GitHub Issues:** Your repository issues page

---

**Last Updated:** December 2025

