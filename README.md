# 🚐 BookAVan - Van Booking System

A modern, production-ready web application for managing company van reservations. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## 🌟 Features

- **Responsive Landing Page** - Clean, modern design optimized for all devices
- **Interactive Calendar** - Visual availability display with booking management
- **Microsoft Entra ID Authentication** - Secure multi-tenant SSO integration
- **Email Notifications** - Automated booking confirmations via SendGrid
- **Photo Gallery** - Dynamic van photo management
- **Admin Panel** - Maintenance scheduling and photo uploads
- **Dutch Language** - Complete UI in Nederlands
- **Docker Ready** - Containerized for easy deployment

## 🏗️ Technology Stack

### Backend
- **Node.js** 20 LTS
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **SendGrid API** - Email service
- **JWT** - Token validation

### Frontend
- **Vanilla JavaScript** - No heavy frameworks
- **MSAL.js** - Microsoft authentication
- **Modern CSS** - Responsive design with CSS Grid/Flexbox

### DevOps
- **Docker** - Containerization
- **Easypanel** - Deployment platform

## 📋 Prerequisites

- Docker (for containerized deployment)
- PostgreSQL database
- SendGrid account
- Microsoft Entra ID application registration

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd BookAVan
npm install
```

### 2. Environment Configuration

Create a `.env` file (use `env.example` as template):

```env
# Server
PORT=3000
NODE_ENV=production

# PostgreSQL (provided by Easypanel)
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=bookavan

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourcompany.com

# Microsoft Entra ID
ENTRA_ALLOWED_TENANTS=tenant-id-1,tenant-id-2
ADMIN_EMAILS=admin@company.com,it@company.com
```

### 3. Database Setup

Run the database migration:

```bash
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f database/schema.sql
```

Or connect to your PostgreSQL instance and execute the SQL in `database/schema.sql`.

### 4. Run Locally

```bash
npm start
```

Access at: `http://localhost:3000`

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t bookavan:latest .
```

### Run Container

```bash
docker run -d \
  --name bookavan \
  -p 3000:3000 \
  -e PGHOST=your-postgres-host \
  -e PGPORT=5432 \
  -e PGUSER=your-username \
  -e PGPASSWORD=your-password \
  -e PGDATABASE=bookavan \
  -e SENDGRID_API_KEY=your-key \
  -e FROM_EMAIL=noreply@company.com \
  -e ENTRA_ALLOWED_TENANTS=tenant-id \
  -e ADMIN_EMAILS=admin@company.com \
  bookavan:latest
```

## 📦 Easypanel Deployment

### 1. Create New App in Easypanel

1. Go to your Easypanel dashboard
2. Click "Create" → "App"
3. Choose "Docker" as source type

### 2. Configure App

**Build Settings:**
- Repository: Your Git repository
- Branch: `main`
- Dockerfile Path: `./Dockerfile`

**Environment Variables:**
Add all variables from your `.env` file

**Domains:**
- Add your custom domain
- Enable SSL/HTTPS

### 3. Create PostgreSQL Database

1. In Easypanel, create a new PostgreSQL service
2. Note the connection details
3. Update your app's environment variables

### 4. Deploy

Click "Deploy" and Easypanel will:
- Build the Docker image
- Deploy the container
- Set up networking
- Configure SSL

## 🔐 Microsoft Entra ID Setup

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set name: "BookAVan"
5. Set redirect URI: `https://yourdomain.com` (Web platform)

### 2. Configure Authentication

1. Go to "Authentication"
2. Enable "Access tokens" and "ID tokens"
3. Add redirect URIs for all environments

### 3. Set Permissions

1. Go to "API permissions"
2. Add permissions:
   - `User.Read`
   - `email`
   - `openid`
   - `profile`

### 4. Update Frontend

Add to your HTML or inject via server:

```javascript
window.ENTRA_CLIENT_ID = "your-client-id";
window.ADMIN_EMAILS = "admin@company.com,it@company.com";
```

## 📧 SendGrid Setup

1. Create account at [SendGrid](https://sendgrid.com)
2. Verify sender email address
3. Create API key with "Mail Send" permissions
4. Add API key to environment variables

## 🗄️ Database Schema

The application uses three main tables:

- **bookings** - Van reservations
- **blocked_slots** - Maintenance periods
- **photos** - Van photo gallery

See `database/schema.sql` for complete schema.

## 🎨 Customization

### Styling

Edit `public/styles.css` to customize:
- Colors (see CSS variables in `:root`)
- Fonts
- Spacing
- Layout

### Content

Edit `public/index.html` for:
- Company information
- Contact details
- FAQ answers
- Hero text

### Business Logic

Edit `server.js` for:
- Booking rules
- Email templates
- Admin permissions

## 📱 Features Walkthrough

### For Employees

1. **Login** - Click "Inloggen met Microsoft"
2. **Select Date** - Click on calendar to choose date
3. **Fill Form** - Complete booking details
4. **Submit** - Receive email confirmation
5. **Pick Up Keys** - At reception during office hours

### For Administrators

1. **Login** - Use admin email account
2. **Admin Panel** - Click ⚙️ button (bottom right)
3. **Block Dates** - Schedule maintenance periods
4. **Upload Photos** - Add van images to gallery

## 🔧 API Endpoints

### Public Endpoints

- `GET /api/photos` - Get van photos
- `GET /api/availability` - Get booking calendar data

### Protected Endpoints (Require Auth)

- `POST /api/bookings` - Create new booking

### Admin Endpoints (Require Admin Role)

- `POST /api/admin/blocked-slots` - Block time period
- `POST /api/admin/photos` - Upload photo
- `DELETE /api/admin/photos/:id` - Delete photo
- `GET /api/admin/bookings` - List all bookings

## 🛡️ Security

- Microsoft Entra ID SSO authentication
- JWT token validation
- Tenant whitelist
- Admin email whitelist
- CORS protection
- Input validation
- SQL injection prevention (parameterized queries)

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT 1"
```

### Email Not Sending

- Check SendGrid API key
- Verify sender email is verified
- Check SendGrid dashboard for errors

### Authentication Not Working

- Verify Entra ID client ID
- Check redirect URIs match
- Ensure tenant IDs are correct

### Port Already in Use

```bash
# Change port in .env
PORT=3001
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Logs

```bash
# Docker logs
docker logs bookavan

# Follow logs
docker logs -f bookavan
```

## 🔄 Updates

To update the application:

1. Pull latest changes
2. Rebuild Docker image
3. Redeploy container
4. Run any new migrations

```bash
git pull
docker build -t bookavan:latest .
docker stop bookavan
docker rm bookavan
docker run -d --name bookavan [... env vars ...] bookavan:latest
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues or questions:
- Email: info@company.com
- Internal: facilities@company.com

## 🙏 Credits

Built with ❤️ for efficient van management

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Maintained by:** IT Department

