# 🔑 Entra ID Quick Reference

Snelle referentie voor wat je wel en niet nodig hebt.

## ✅ Wat je WEL nodig hebt

| Item | Waar te vinden | Voorbeeld | Verplicht |
|------|----------------|-----------|-----------|
| **Client ID** | Azure Portal → App registration → Overview | `12345678-abcd-1234-efgh-123456789012` | ✅ Ja |
| **Redirect URI** | Configureren in Azure Portal → Authentication | `https://bookavan.jouwbedrijf.nl` | ✅ Ja |
| **ID tokens enabled** | Azure Portal → Authentication → Implicit grant | Checkbox aanvinken | ✅ Ja |

## ❌ Wat je NIET nodig hebt

| Item | Waarom niet | Wanneer WEL nodig |
|------|-------------|-------------------|
| **Client Secret** | Public client (browser) | Server-to-server apps |
| **Certificate** | Public client (browser) | Enterprise apps met cert auth |
| **Tenant ID** | Multitenant setup | Single tenant apps |
| **App Roles** | Basis functionaliteit | Geavanceerde role-based access |

## 📝 Minimale Configuratie

### In Azure Portal:

1. **App Registration:**
   ```
   Name: BookAVan
   Account types: Multitenant (any organizational directory)
   Redirect URI: https://jouw-domein.nl
   ```

2. **Authentication:**
   ```
   ✅ ID tokens (used for implicit and hybrid flows)
   ```

3. **API Permissions:**
   ```
   ✅ User.Read
   ✅ openid
   ✅ profile
   ✅ email
   ```

4. **Certificates & secrets:**
   ```
   ❌ Leeg laten - NIETS doen hier!
   ```

### In je .env bestand:

```env
ENTRA_CLIENT_ID=12345678-abcd-1234-efgh-123456789012
ENTRA_ALLOWED_TENANTS=
ADMIN_EMAILS=admin@jouwbedrijf.nl
```

Dat is alles! 🎉

## 🔄 Public Client vs Confidential Client

### Public Client (ons geval)

```
┌─────────────────────────────────────┐
│  Browser (MSAL.js)                  │
│  ────────────────────────────────  │
│  ✅ Client ID                       │
│  ❌ Client Secret (onveilig!)      │
│  ✅ PKCE (automatisch)             │
│  ✅ Redirect URI                   │
└─────────────────────────────────────┘
```

**Gebruik voor:**
- ✅ Single Page Applications (SPA)
- ✅ Browser-based apps
- ✅ Mobile apps
- ✅ Desktop apps

### Confidential Client (NIET ons geval)

```
┌─────────────────────────────────────┐
│  Server (Node.js backend)           │
│  ────────────────────────────────  │
│  ✅ Client ID                       │
│  ✅ Client Secret                   │
│  ❌ PKCE (niet nodig)              │
│  ✅ Redirect URI                   │
└─────────────────────────────────────┘
```

**Gebruik voor:**
- ✅ Server-to-server apps
- ✅ Daemon/background services
- ✅ Web APIs zonder gebruikersinterface
- ✅ Microservices authenticatie

## 🛡️ Beveiliging Vergelijking

### Met Client Secret (Confidential)

```javascript
// Backend only - NIET in browser!
const client = new ConfidentialClientApplication({
    auth: {
        clientId: "abc123",
        clientSecret: "secret456", // 🔐 Geheim
        authority: "https://login.microsoft.com/tenant"
    }
});
```

**Beveiliging:** Secret blijft op server ✅

### Zonder Client Secret (Public)

```javascript
// Browser - MSAL.js
const client = new PublicClientApplication({
    auth: {
        clientId: "abc123",
        // Geen secret - zou zichtbaar zijn! ❌
        authority: "https://login.microsoft.com/organizations"
    }
});
// Gebruikt PKCE voor beveiliging ✅
```

**Beveiliging:** PKCE beschermt tegen token theft ✅

## 📊 Beslissingsboom

```
Draait je auth code in de browser?
│
├─ Ja → Public Client
│        ✅ Gebruik MSAL.js
│        ❌ Geen client secret
│        ✅ PKCE beveiliging
│        📄 Dit is BookAVan!
│
└─ Nee → Confidential Client
         ✅ Server-side OAuth
         ✅ Client secret vereist
         ✅ Secret blijft op server
         📄 NIET voor BookAVan
```

## 🎯 Checklist

Controleer je configuratie:

### Azure Portal
- [ ] App geregistreerd als **Multitenant**
- [ ] **Redirect URI** toegevoegd
- [ ] **ID tokens** enabled in Authentication
- [ ] **API permissions** geconfigureerd
- [ ] **Certificates & secrets** is LEEG (niets gedaan)

### Applicatie
- [ ] `ENTRA_CLIENT_ID` in `.env`
- [ ] `ADMIN_EMAILS` in `.env`
- [ ] `ENTRA_ALLOWED_TENANTS` leeg (of specifieke tenants)
- [ ] App herstart na `.env` wijziging

### Test
- [ ] Kan inloggen met Microsoft account
- [ ] Naam verschijnt in navigatie na login
- [ ] Admin functies zichtbaar voor admin users
- [ ] Booking kan aangemaakt worden na login

## 🚫 Veelgemaakte Fouten

### ❌ Fout 1: Client Secret Aanmaken
```
"Moet ik niet een secret aanmaken in Azure Portal?"
```
**Nee!** Voor public clients (MSAL.js) is dit niet nodig en zelfs onveilig.

### ❌ Fout 2: Web Platform Kiezen
```
"Ik heb 'Web' als platform gekozen, niet 'SPA'"
```
**Geen probleem!** Het werkt ook, je hoeft alleen geen secret te gebruiken.

### ❌ Fout 3: Secret in Frontend Code
```javascript
// ❌ NOOIT DOEN!
const secret = "mijn-geheime-secret";
```
**Gevaarlijk!** Secrets horen NOOIT in browser code.

### ❌ Fout 4: Tenant ID als Verplicht Zien
```
"Wat is mijn tenant ID?"
```
**Niet nodig!** Voor multitenant apps laat je `ENTRA_ALLOWED_TENANTS` leeg.

## 📚 Meer Info

**Volledige setup:** Zie `ENTRA_ID_SETUP.md`

**MSAL.js Docs:** https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview

**PKCE Explained:** https://oauth.net/2/pkce/

## 💡 Samenvatting

| Vraag | Antwoord |
|-------|----------|
| Heb ik een client secret nodig? | ❌ **Nee** |
| Heb ik een client ID nodig? | ✅ **Ja** |
| Heb ik een tenant ID nodig? | ⚠️ **Optioneel** (alleen voor whitelist) |
| Heb ik een redirect URI nodig? | ✅ **Ja** |
| Moet ik PKCE configureren? | ✅ **Automatisch** (MSAL.js doet dit) |
| Is deze setup veilig? | ✅ **Ja** (met PKCE) |

---

**Twijfel je nog?** → Kijk in `ENTRA_ID_SETUP.md` voor de complete uitleg! 📖

