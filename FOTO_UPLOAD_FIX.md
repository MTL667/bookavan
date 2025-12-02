# 📸 Foto Upload Fix - Persistent Volume

## 🔍 Het Probleem

Foto's worden geüpload maar **niet bewaard** of verdwijnen na een app restart.

**Oorzaak:** De `uploads/` directory in de Docker container is **niet persistent**. Bij elke deployment of restart gaat de directory verloren.

## ✅ Oplossing: Persistent Volume in Easypanel

Je moet een **persistent volume** toevoegen in Easypanel zodat uploads bewaard blijven.

### Stap-voor-Stap

#### 1. Ga naar Easypanel

1. Open je **BookAVan** app
2. Klik op **"Volumes"** of **"Mounts"** in het menu

#### 2. Voeg Volume Toe

Klik **"+ Add Volume"** of **"Create Volume"**

**Configuratie:**
```
Name:        bookavan-uploads
Mount Path:  /app/uploads
Type:        Volume (persistent)
```

#### 3. Save & Redeploy

1. Klik **"Save"**
2. Klik **"Redeploy"** om het volume te activeren
3. Wacht tot deployment compleet is

## 🔍 Verificatie

### Test 1: Upload een Foto

1. Login als admin
2. Ga naar foto sectie
3. Upload een foto
4. **Check Easypanel logs:**

Je zou moeten zien:
```
📸 Photo upload request received
User: { email: 'kevinvanhoecke@hertbelgium.be', ... }
File: { filename: '1733147890123-456789.jpg', ... }
📁 File saved to: /app/uploads/1733147890123-456789.jpg
🔗 File URL: /uploads/1733147890123-456789.jpg
✅ Photo saved to database
```

### Test 2: Verify Persistence

1. Upload een foto
2. Foto verschijnt in gallery ✅
3. **Redeploy** de app (simuleer restart)
4. **Check:** Foto is nog steeds zichtbaar ✅

Als de foto weg is na redeploy:
→ Volume is niet correct geconfigureerd

## 🐳 Docker Compose (Lokaal Testen)

Voor lokaal testen is het volume al geconfigureerd:

```yaml
volumes:
  - ./uploads:/app/uploads
```

Test lokaal:
```bash
docker-compose up -d
# Upload foto
# Restart: docker-compose restart app
# Foto blijft bestaan ✅
```

## ⚙️ Alternative: Easypanel Volume via UI

Als je geen "Volumes" menu ziet, probeer:

### Via Environment Settings

Sommige Easypanel versies hebben een andere UI:

1. Go to **Settings** of **Advanced**
2. Zoek naar **"Volume Mounts"** of **"Persistent Storage"**
3. Add mount:
   ```
   /app/uploads → persistent volume
   ```

### Via YAML/JSON

Als je directe configuratie hebt:

```json
"mounts": [
  {
    "type": "volume",
    "name": "bookavan-uploads",
    "mountPath": "/app/uploads"
  }
]
```

## 🔧 Troubleshooting

### Foto uploadt maar verdwijnt

**Symptomen:**
- Upload lijkt te werken
- Foto zichtbaar direct na upload
- Na refresh of redeploy: weg

**Diagnose:**
```bash
# Check Easypanel logs
# Zoek naar:
📁 File saved to: /app/uploads/filename.jpg
```

Als je dit ziet maar foto verdwijnt:
→ **GEEN persistent volume**

**Fix:** Voeg volume toe (zie boven)

### Foto upload geeft error

**Check logs in Easypanel:**

```bash
# Goede upload:
📸 Photo upload request received
✅ Photo saved to database

# Slechte upload:
❌ No file received in upload
❌ File not found after upload
❌ Error uploading photo
```

**Mogelijke oorzaken:**
1. Multer error (file te groot, verkeerd type)
2. Permissions error (kan niet schrijven naar /app/uploads)
3. Directory bestaat niet

### Permissions Error

Als je ziet:
```
Error: EACCES: permission denied, open '/app/uploads/...'
```

**Fix in Dockerfile:**
```dockerfile
RUN mkdir -p uploads && chmod 777 uploads
```

Of beter:
```dockerfile
RUN mkdir -p uploads && chown -R node:node uploads
USER node
```

## 📊 Beste Oplossing

### Voor Easypanel (Production):

**Optie 1: Persistent Volume (Aanbevolen)**
```
Easypanel → Volumes → Add Volume
Mount: /app/uploads
```
✅ Foto's blijven bij restarts
✅ Backup mogelijk
✅ Schaalbaar

**Optie 2: Object Storage (Advanced)**

Voor grotere deployments, gebruik externe storage:
- AWS S3
- Google Cloud Storage
- Cloudflare R2
- DigitalOcean Spaces

Vereist code aanpassing in `server.js` om naar S3 te uploaden.

## 📝 Quick Checklist

Om foto upload te laten werken:

- [ ] Persistent volume toegevoegd in Easypanel
- [ ] Mount path: `/app/uploads`
- [ ] App geredeployed na volume toevoeging
- [ ] Test upload: Foto verschijnt
- [ ] Test persistence: Redeploy → foto blijft
- [ ] Check logs: Zie upload success berichten

## 💡 Snelle Test

Na volume configuratie:

```bash
# In Easypanel logs na upload:
📸 Photo upload request received
📁 File saved to: /app/uploads/1733147890-123456.jpg
✅ Photo saved to database: { id: 'xxx', file_url: '/uploads/...' }
```

Als je dit ziet en foto blijft na redeploy:
→ ✅ **Volume werkt perfect!**

## 🆘 Hulp Nodig?

1. **Screenshot** van Easypanel volumes/mounts settings
2. **Easypanel logs** na foto upload (laatste 20 regels)
3. **Browser console** na upload poging

Dan kan ik exact zien wat het probleem is!

---

**🎯 Actie: Voeg persistent volume toe in Easypanel voor /app/uploads**

**Dit is essentieel voor foto storage!** 📸💾

