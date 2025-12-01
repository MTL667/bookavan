# 🚀 Easypanel Deployment Gids

Complete handleiding voor het deployen van BookAVan op Easypanel met interne service links.

## 🎯 Waarom Easypanel?

Easypanel maakt deployment super eenvoudig:
- ✅ Automatische SSL certificaten
- ✅ Interne service links (geen losse credentials nodig!)
- ✅ Git-based deployment
- ✅ Managed PostgreSQL
- ✅ Environment variable management
- ✅ Auto-scaling en monitoring

## 📦 Stap-voor-Stap Deployment

### Stap 1: Maak een PostgreSQL Service

1. **Log in op Easypanel**
2. Ga naar je project (of maak een nieuw project)
3. Klik **"Services"** → **"Create Service"**
4. Selecteer **"PostgreSQL"**

**Configuratie:**
```
Service Name:    bookavan-db
Version:         15 (of latest)
Database Name:   bookavan
Username:        bookavan
Password:        [Auto-generated] ✅
```

5. Klik **"Create"**
6. Wacht tot de service running is (groen)

### Stap 2: Maak de BookAVan App

1. Klik **"Apps"** → **"Create App"**
2. Selecteer **"From Source Code"**

**Git Configuratie:**
```
Repository URL:  https://github.com/MTL667/bookavan.git
Branch:          main
Build Type:      Docker
Dockerfile:      ./Dockerfile
```

3. Klik **"Next"**

### Stap 3: Link de PostgreSQL Service

Dit is de **magic** van Easypanel! 🎉

1. In de app configuratie, ga naar **"Environment Variables"**
2. Klik **"Add Variable"**
3. Voeg toe:

```
Key:    DATABASE_URL
Value:  Link to → bookavan-db
```

Easypanel genereert automatisch:
```
postgresql://bookavan:auto-generated-password@bookavan-db:5432/bookavan
```

**Voordelen:**
- ✅ Geen losse credentials nodig
- ✅ Automatische wachtwoord rotatie mogelijk
- ✅ Interne netwerk communicatie (sneller + veiliger)
- ✅ Service discovery (geen hardcoded IPs)

### Stap 4: Configureer Environment Variables

Voeg deze variabelen toe in Easypanel:

#### ✅ Verplicht

```env
# Database (automatisch via link)
DATABASE_URL = [Link to bookavan-db]

# SendGrid Email
SENDGRID_API_KEY = SG.your-key-here
FROM_EMAIL = noreply@jouwbedrijf.nl

# Microsoft Entra ID
ENTRA_CLIENT_ID = your-client-id-from-azure-portal

# Admin Users
ADMIN_EMAILS = admin@jouwbedrijf.nl,it@jouwbedrijf.nl
```

#### ⚠️ Optioneel

```env
# Tenant Whitelist (leeg = alle organisaties)
ENTRA_ALLOWED_TENANTS = 

# Node Environment (auto-set door Easypanel)
NODE_ENV = production
PORT = 3000
```

### Stap 5: Configureer Port Mapping

1. Ga naar **"Ports"**
2. Add port mapping:
   - **Container Port:** 3000
   - **Public:** Yes
   - **HTTPS:** Yes ✅

### Stap 6: Configureer Domain

1. Ga naar **"Domains"**
2. Klik **"Add Domain"**
3. Voeg je domein toe:
   ```
   bookavan.jouwbedrijf.nl
   ```

4. Easypanel toont DNS instructies:
   ```
   CNAME: bookavan.jouwbedrijf.nl → xyz.easypanel.host
   ```

5. Voeg deze CNAME toe bij je DNS provider
6. Wacht op DNS propagatie (5-30 minuten)
7. SSL certificaat wordt automatisch gegenereerd! 🎉

### Stap 7: Deploy!

1. Klik **"Deploy"**
2. Monitor de build logs
3. Wacht tot status **"Running"** is (groen)
4. Bezoek je domein!

## 🔧 Database Schema Initialiseren

Na de eerste deployment:

### Optie 1: Via Easypanel Console

1. Ga naar **bookavan-db** service
2. Klik **"Console"**
3. Run:
   ```bash
   psql -U bookavan -d bookavan
   ```
4. Copy-paste inhoud van `database/schema.sql`
5. Execute

### Optie 2: Via psql Client (lokaal)

```bash
# Get connection string from Easypanel
DATABASE_URL="postgresql://bookavan:password@host:port/bookavan"

# Run schema
psql $DATABASE_URL -f database/schema.sql
```

### Optie 3: Via Init Script (toekomstig)

Voeg toe aan Dockerfile (optioneel):
```dockerfile
COPY database/init.sh /docker-entrypoint-initdb.d/
```

## 🔗 Easypanel Internal Links Uitgelegd

### Wat zijn Internal Links?

Easypanel creëert een **private netwerk** tussen services in hetzelfde project:

```
┌─────────────────────────────────────────────────┐
│  Easypanel Project: bookavan                    │
│                                                 │
│  ┌────────────────┐     Internal Network       │
│  │  bookavan-app  │◄────────────────┐          │
│  │  (Node.js)     │                 │          │
│  └────────────────┘                 │          │
│         │                            │          │
│         │ DATABASE_URL               │          │
│         │ (private link)             │          │
│         │                            │          │
│         ▼                            │          │
│  ┌────────────────┐                 │          │
│  │  bookavan-db   │─────────────────┘          │
│  │  (PostgreSQL)  │                            │
│  └────────────────┘                            │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         │ HTTPS (public)
         ▼
    🌍 Internet
```

**Voordelen:**
- 🔒 **Veilig**: Database niet publiek toegankelijk
- ⚡ **Snel**: Lokale netwerk communicatie
- 🎯 **Simpel**: Geen handmatige credentials
- 🔄 **Dynamisch**: Service discovery automatisch

### DATABASE_URL Format

Easypanel genereert:
```
postgresql://[username]:[password]@[service-name]:[port]/[database]
```

**Voorbeeld:**
```
postgresql://bookavan:xK9mP2nQ7L@bookavan-db:5432/bookavan
```

**Breakdown:**
- `bookavan` = username
- `xK9mP2nQ7L` = auto-generated password
- `bookavan-db` = internal service hostname
- `5432` = PostgreSQL port
- `bookavan` = database name

## 🔄 Updates Deployen

### Automatisch (Aanbevolen)

1. Push code naar GitHub:
   ```bash
   git push origin main
   ```

2. Easypanel detecteert automatisch de push
3. Bouwt nieuwe Docker image
4. Deployed automatisch

### Handmatig

1. Ga naar je app in Easypanel
2. Klik **"Redeploy"** of **"Rebuild"**
3. Wacht op completion

## 📊 Monitoring

### Logs Bekijken

1. Ga naar je app in Easypanel
2. Klik **"Logs"**
3. Realtime logs verschijnen
4. Filter op severity (info, error, etc.)

### Health Check

Easypanel monitort automatisch:
```
GET /health

Response:
{
  "status": "healthy",
  "database": "connected"
}
```

Als health check faalt: automatische restart!

### Metrics

Bekijk in Easypanel:
- CPU usage
- Memory usage
- Network traffic
- Request counts

## 🔐 Beveiliging Best Practices

### Environment Variables

✅ **Gebruik secrets voor:**
- `SENDGRID_API_KEY`
- `DATABASE_URL` (via link)
- Andere API keys

❌ **Zet NOOIT in Git:**
- Wachtwoorden
- API keys
- Connection strings

### Database

✅ **Easypanel doet automatisch:**
- Database niet publiek exposed
- Internal network only
- Encrypted connections

### SSL/HTTPS

✅ **Easypanel regelt:**
- Automatische SSL certificaten (Let's Encrypt)
- HTTPS redirect
- Certificate renewal

## 🔄 Backups

### Database Backups

1. Ga naar **bookavan-db** service
2. Klik **"Backups"**
3. Configureer:
   ```
   Frequency:  Daily
   Retention:  7 days
   Time:       03:00 UTC
   ```

4. Klik **"Save"**

### Manual Backup

```bash
# In Easypanel console
pg_dump -U bookavan bookavan > backup-$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql -U bookavan bookavan < backup-20251201.sql
```

## 🚨 Troubleshooting

### App won't start

**Check logs:**
1. Easypanel → App → Logs
2. Kijk naar errors bij startup

**Veelvoorkomende oorzaken:**
- ❌ DATABASE_URL niet correct
- ❌ ENTRA_CLIENT_ID ontbreekt
- ❌ Port 3000 conflict
- ❌ Ontbrekende environment variables

**Oplossing:**
```bash
npm run verify  # Lokaal testen
```

### Can't connect to database

**Check:**
1. Is bookavan-db service running? (groen)
2. Is DATABASE_URL correct gelinkt?
3. Schema geïnitialiseerd?

**Test connectie:**
```bash
# In app console
node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(console.log)"
```

### SSL certificate issues

**Easypanel lost automatisch op:**
- Wacht 5-10 minuten na DNS propagatie
- Certificaat wordt automatisch aangemaakt
- Check DNS CNAME is correct

### Authentication not working

**Check:**
1. ENTRA_CLIENT_ID correct?
2. Redirect URI in Azure Portal matches domain?
3. Browser console voor errors?

**Test:**
```javascript
// In browser console
console.log(window.ENTRA_CLIENT_ID);
```

## 📈 Scaling

### Vertical Scaling

Easypanel → App → Settings:
```
Resources:
  Memory:  512MB → 1GB
  CPU:     0.5 → 1.0
```

### Horizontal Scaling

Voor hoge traffic:
```
Replicas: 1 → 3
```

Easypanel doet automatisch:
- Load balancing
- Health checks
- Rolling deployments

## 💰 Kosten

**Typische setup:**
- App (512MB RAM): €5-10/maand
- PostgreSQL (1GB): €5-10/maand
- SSL: Gratis (Let's Encrypt)
- **Totaal: ~€10-20/maand**

## ✅ Deployment Checklist

Voor productie deployment:

- [ ] PostgreSQL service aangemaakt
- [ ] DATABASE_URL gelinkt
- [ ] SENDGRID_API_KEY toegevoegd
- [ ] ENTRA_CLIENT_ID geconfigureerd
- [ ] ADMIN_EMAILS ingesteld
- [ ] Custom domain toegevoegd
- [ ] DNS CNAME geconfigureerd
- [ ] SSL certificaat actief (groen slot)
- [ ] Database schema geïnitialiseerd
- [ ] Health check OK (groen)
- [ ] Test inloggen met Microsoft
- [ ] Test booking aanmaken
- [ ] Test email ontvangen
- [ ] Test admin functies
- [ ] Backups geconfigureerd
- [ ] Monitoring ingesteld

## 🎉 Success!

Als alles werkt:
- ✅ App draait op https://bookavan.jouwbedrijf.nl
- ✅ Groene status in Easypanel
- ✅ Health check OK
- ✅ Database connected
- ✅ Login werkt
- ✅ Emails worden verstuurd

**Je bent live!** 🚀

## 📚 Meer Informatie

- **Easypanel Docs**: https://easypanel.io/docs
- **BookAVan README**: `README.md`
- **Database Schema**: `database/schema.sql`
- **Entra ID Setup**: `ENTRA_ID_SETUP.md`

## 🆘 Support

**Easypanel Issues:**
- Easypanel Discord/Support

**BookAVan Issues:**
- GitHub Issues: https://github.com/MTL667/bookavan/issues
- Email: info@jouwbedrijf.nl

---

**Klaar om te deployen?** Volg de stappen hierboven en je bent in 10 minuten live! 🎉

