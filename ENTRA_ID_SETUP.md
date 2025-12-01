# 🔐 Microsoft Entra ID Setup Gids

Complete handleiding voor het configureren van Microsoft Entra ID (Azure AD) multitenant authenticatie voor BookAVan.

## 📋 Wat heb je nodig?

- ✅ Azure account met toegang tot Azure Portal
- ✅ Rechten om app registraties aan te maken
- ✅ Domein waar de app gehost wordt (voor Redirect URI)

## 🚀 Stap 1: App Registreren in Azure Portal

### 1.1 Ga naar Azure Portal

Bezoek: **https://portal.azure.com**

### 1.2 Navigeer naar App Registraties

1. Zoek naar **"Azure Active Directory"** of **"Microsoft Entra ID"** in de zoekbalk
2. Klik op **"App registrations"** (App-registraties) in het linkermenu
3. Klik op **"+ New registration"** (+ Nieuwe registratie)

### 1.3 Vul de Basis Informatie In

**Name (Naam):**
```
BookAVan
```

**Supported account types (Ondersteunde accounttypen):**

Selecteer één van deze opties:

✅ **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**
   - Voor meerdere organisaties
   - Beste keuze voor de meeste scenario's

Of:

⚠️ **"Accounts in any organizational directory and personal Microsoft accounts"**
   - Inclusief persoonlijke Microsoft accounts
   - Alleen kiezen als je ook privé accounts wilt toestaan

**Redirect URI (Omleidings-URI):**

| Environment | Type | URL |
|-------------|------|-----|
| Development | Web | `http://localhost:3000` |
| Staging | Web | `https://staging.jouwbedrijf.nl` |
| Production | Web | `https://bookavan.jouwbedrijf.nl` |

> **Let op:** Voeg eerst je development URL toe. Je kunt later meer URLs toevoegen.

### 1.4 Klik op "Register"

## 🔑 Stap 2: Kopieer je Client ID

Na registratie zie je het **Overview** scherm met belangrijke informatie:

### Wat je ziet:

```
Application (client) ID:    12345678-abcd-1234-efgh-123456789012
Directory (tenant) ID:      87654321-dcba-4321-hgfe-210987654321
```

### Wat je nodig hebt:

✅ **Application (client) ID** - DIT IS JE CLIENT_ID!

**Kopieer deze waarde** en bewaar deze veilig.

### Waar te vinden:

```
Azure Portal → App registrations → BookAVan → Overview → Essentials
```

## ⚙️ Stap 3: Configureer Authentication

### 3.1 Ga naar Authentication

1. Klik op **"Authentication"** in het linkermenu
2. Je ziet je Redirect URI(s)

### 3.2 Enable ID Tokens

Scroll naar beneden naar **"Implicit grant and hybrid flows"**

Vink aan:
- ✅ **ID tokens** (used for implicit and hybrid flows)
- ⚠️ **Access tokens** (optioneel, niet strikt nodig)

### 3.3 Voeg Extra Redirect URIs Toe

Klik op **"+ Add URI"** om extra URLs toe te voegen:

```
http://localhost:3000                    (development)
https://staging.jouwbedrijf.nl          (staging)
https://bookavan.jouwbedrijf.nl         (production)
```

### 3.4 Configureer Logout URL (optioneel)

Onder **"Front-channel logout URL"**:
```
https://bookavan.jouwbedrijf.nl/logout
```

### 3.5 Klik op "Save"

## 🔓 Stap 4: API Permissions Controleren

### 4.1 Ga naar API Permissions

Klik op **"API permissions"** in het linkermenu

### 4.2 Standaard Permissions

Je zou deze permissions moeten zien:

| Permission | Type | Description |
|------------|------|-------------|
| `User.Read` | Delegated | Sign in and read user profile |
| `openid` | Delegated | Sign users in |
| `profile` | Delegated | View users' basic profile |
| `email` | Delegated | View users' email address |

### 4.3 Permissions Toevoegen (indien nodig)

Als deze er niet zijn:

1. Klik op **"+ Add a permission"**
2. Selecteer **"Microsoft Graph"**
3. Kies **"Delegated permissions"**
4. Zoek en selecteer:
   - ✅ `User.Read`
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
5. Klik **"Add permissions"**

### 4.4 Admin Consent (optioneel)

Voor sommige organisaties moet een admin toestemming geven:

Klik op **"✓ Grant admin consent for [Your Organization]"**

## 🔐 Stap 5: Tenant IDs Ophalen (optioneel)

Als je specifieke organisaties wilt toestaan:

### 5.1 Ga naar Azure Active Directory Overview

```
Azure Portal → Azure Active Directory → Overview
```

### 5.2 Kopieer Tenant ID

Onder **"Basic information"** zie je:
```
Tenant ID: 12345678-90ab-cdef-1234-567890abcdef
```

### 5.3 Herhaal voor Andere Organisaties

Vraag andere organisaties om hun Tenant ID te delen als je ze toegang wilt geven.

## 📝 Stap 6: Configureer je Applicatie

### 6.1 Update .env Bestand

```bash
cd /Users/kevin/BookAVan
nano .env
```

Voeg toe:

```env
# Microsoft Entra ID Configuration
ENTRA_CLIENT_ID=12345678-abcd-1234-efgh-123456789012

# Optioneel: Specifieke tenants toestaan (laat leeg voor alle organisaties)
ENTRA_ALLOWED_TENANTS=

# Of specifieke tenants:
# ENTRA_ALLOWED_TENANTS=tenant-id-1,tenant-id-2,tenant-id-3

# Admin emails (volledige email adressen)
ADMIN_EMAILS=admin@jouwbedrijf.nl,it@jouwbedrijf.nl
```

### 6.2 Herstart je Applicatie

```bash
# Als je Docker Compose gebruikt:
docker-compose restart app

# Als je npm gebruikt:
npm start
```

### 6.3 Test de Configuratie

1. Open je browser: `http://localhost:3000`
2. Klik op **"Inloggen met Microsoft"**
3. Je zou naar Microsoft login moeten worden doorgestuurd
4. Login met je organisatie account
5. Je zou terug moeten komen naar de app met je naam in de navigatie

## ✅ Verificatie Checklist

Controleer of alles werkt:

- [ ] App geregistreerd in Azure Portal
- [ ] Client ID gekopieerd en in `.env` gezet
- [ ] ID tokens enabled in Authentication
- [ ] Redirect URIs toegevoegd voor alle environments
- [ ] API permissions geconfigureerd (User.Read, openid, profile, email)
- [ ] `.env` bestand geconfigureerd met `ENTRA_CLIENT_ID`
- [ ] Applicatie herstart
- [ ] Login test succesvol

## 🔧 Configuratie Opties

### Optie A: Alle Organisaties Toestaan (Aanbevolen voor Start)

```env
ENTRA_CLIENT_ID=your-client-id
ENTRA_ALLOWED_TENANTS=
```

Dit staat **alle** Azure AD organisatie accounts toe.

### Optie B: Specifieke Organisaties Toestaan

```env
ENTRA_CLIENT_ID=your-client-id
ENTRA_ALLOWED_TENANTS=abc123-def456-ghi789,xyz987-uvw654-rst321
```

Dit staat **alleen** deze specifieke tenant IDs toe.

### Optie C: Specifieke Organisaties + Logging

Voor debugging, bekijk de server logs om te zien welke tenant IDs inloggen:

```bash
docker-compose logs -f app
```

Je ziet:
```
Token decoded: {
  email: "user@company.com",
  tid: "abc123-def456-ghi789",
  name: "User Name"
}
```

Kopieer de `tid` waarde en voeg toe aan `ENTRA_ALLOWED_TENANTS`.

## 🐛 Troubleshooting

### Probleem: "Redirect URI mismatch"

**Oplossing:**
- Controleer of de Redirect URI in Azure Portal **exact** overeenkomt met je app URL
- Let op: `http` vs `https`
- Let op: trailing slash (`/` aan het einde)

### Probleem: "AADSTS50105: User not assigned"

**Oplossing:**
- Ga naar Azure Portal → Enterprise Applications → BookAVan
- Ga naar "Users and groups"
- Voeg gebruikers/groepen toe
- Of: Zet "Assignment required" uit (Properties → Assignment required? = No)

### Probleem: "Client ID not found"

**Oplossing:**
- Controleer of `ENTRA_CLIENT_ID` correct is in `.env`
- Herstart je app na het wijzigen van `.env`
- Controleer browser console: `window.ENTRA_CLIENT_ID` zou de waarde moeten tonen

### Probleem: "Tenant not allowed"

**Oplossing:**
- Controleer `ENTRA_ALLOWED_TENANTS` in `.env`
- Laat leeg om alle tenants toe te staan
- Of voeg de specifieke tenant ID toe

### Probleem: MSAL library not loading

**Oplossing:**
Controleer of MSAL.js wordt geladen in `public/index.html`:
```html
<script src="https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js"></script>
```

## 📚 Handige Links

- **Azure Portal**: https://portal.azure.com
- **App Registrations**: https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps
- **MSAL.js Docs**: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview
- **Entra ID Docs**: https://learn.microsoft.com/en-us/azure/active-directory/

## 🎯 Samenvatting

**Minimale configuratie die je nodig hebt:**

1. **Client ID** (van Azure Portal)
2. **Redirect URI** (in Azure Portal configureren)
3. **ID tokens enabled** (in Authentication)

**In je `.env`:**
```env
ENTRA_CLIENT_ID=your-client-id-here
ADMIN_EMAILS=admin@company.com
```

Dat is het! De rest is optioneel.

## 🚀 Klaar voor Productie

Wanneer je live gaat:

1. ✅ Verander Redirect URI naar productie URL
2. ✅ Gebruik HTTPS (geen HTTP)
3. ✅ Configureer custom domain in Easypanel
4. ✅ Test inloggen met verschillende users
5. ✅ Test admin functies met admin accounts
6. ✅ Configureer logout flow
7. ✅ Monitor login errors in Azure Portal (Sign-ins logs)

---

**Vragen?** Bekijk de troubleshooting sectie of raadpleeg de [Microsoft documentatie](https://learn.microsoft.com/en-us/azure/active-directory/develop/).

**Success!** 🎉 Je Microsoft Entra ID authenticatie is nu geconfigureerd!

