# 🚀 Quick Start Guide

Get BookAVan running in 5 minutes!

## 🎯 Prerequisites

- Node.js 20+
- PostgreSQL database
- SendGrid account (for emails)
- Microsoft Entra ID app registration

## ⚡ Fast Track

### 1. Install & Configure

```bash
# Clone or navigate to project
cd BookAVan

# Run setup script
./setup.sh

# Edit .env file with your credentials
nano .env
```

### 2. Set Up Database

```bash
# If using Docker Compose (easiest)
docker-compose up -d postgres

# Or connect to your PostgreSQL
source .env
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f database/schema.sql
```

### 3. Configure Services

#### SendGrid (Email)
1. Go to https://sendgrid.com
2. Create API key
3. Add to `.env`: `SENDGRID_API_KEY=SG.xxxxx`
4. Verify sender email address

#### Microsoft Entra ID (Auth)
1. Go to https://portal.azure.com
2. Azure AD → App registrations → New registration
3. Name: "BookAVan"
4. Redirect URI: `http://localhost:3000`
5. Authentication → Enable ID tokens
6. Copy Client ID to `.env`: Add to frontend or inject via server

### 4. Run Application

```bash
# Option A: Local development
npm start

# Option B: Docker Compose (includes database)
docker-compose up -d

# Option C: Docker only
docker build -t bookavan .
docker run -p 3000:3000 --env-file .env bookavan
```

### 5. Access Application

Open browser: http://localhost:3000

## 📋 Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL running
- [ ] Database schema created
- [ ] `.env` file configured
- [ ] SendGrid API key set
- [ ] Entra ID app registered
- [ ] Admin emails configured
- [ ] Application running on port 3000

## 🔍 Verify Setup

### Test Database Connection
```bash
curl http://localhost:3000/health
```

Expected: `{"status":"healthy","database":"connected"}`

### Test Frontend
```bash
curl http://localhost:3000
```

Expected: HTML page loads

### Test Authentication
1. Click "Inloggen met Microsoft"
2. Sign in with company account
3. Should see your name in nav bar

### Test Booking
1. Log in
2. Select date on calendar
3. Fill booking form
4. Submit
5. Check email for confirmation

## 🐛 Common Issues

### Port 3000 already in use
```bash
# Change port in .env
PORT=3001
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Or if using system PostgreSQL
pg_isready
```

### MSAL not loading
Add to `public/index.html` before closing `</head>`:
```html
<script>
  window.ENTRA_CLIENT_ID = "your-client-id";
</script>
```

### Emails not sending
- Verify SendGrid API key is correct
- Check sender email is verified in SendGrid
- Look for errors in logs: `docker-compose logs app`

## 🚀 Deploy to Production

### Easypanel (Recommended)
See [DEPLOYMENT.md](DEPLOYMENT.md) for full guide

Quick steps:
1. Push code to Git
2. Create app in Easypanel
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy!

### Docker
```bash
# Build
docker build -t bookavan:production .

# Run
docker run -d \
  --name bookavan \
  -p 3000:3000 \
  --env-file .env \
  bookavan:production
```

## 📚 Documentation

- **Full README**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Database Schema**: [database/schema.sql](database/schema.sql)

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- Test health: `curl http://localhost:3000/health`
- Review `.env` configuration
- Check PostgreSQL connection
- Verify SendGrid API key

## 🎉 Success!

Once you see the landing page and can log in, you're ready to start booking!

**Next steps:**
- Customize company information in `public/index.html`
- Add admin users to `ADMIN_EMAILS`
- Upload van photos (admin feature)
- Test full booking flow
- Deploy to production

---

**Need more details?** See [README.md](README.md)

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md)

