#!/usr/bin/env node
/**
 * Multitenant Configuration Verificatie Script
 * Controleert of de multitenant setup correct is geconfigureerd
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n🔍 BookAVan Multitenant Configuratie Check\n');
console.log('═'.repeat(60));

let hasErrors = false;
let hasWarnings = false;

// Check 1: ENTRA_CLIENT_ID
console.log('\n📋 1. Client ID Configuratie');
console.log('─'.repeat(60));

if (!process.env.ENTRA_CLIENT_ID) {
    console.log('❌ ENTRA_CLIENT_ID is niet ingesteld in .env');
    console.log('   → Voeg toe: ENTRA_CLIENT_ID=your-client-id');
    hasErrors = true;
} else if (process.env.ENTRA_CLIENT_ID === 'your-client-id-here' || 
           process.env.ENTRA_CLIENT_ID === 'your-application-client-id-here') {
    console.log('⚠️  ENTRA_CLIENT_ID heeft nog de placeholder waarde');
    console.log('   → Vervang met echte Client ID uit Azure Portal');
    hasWarnings = true;
} else {
    console.log('✅ ENTRA_CLIENT_ID is ingesteld');
    console.log(`   → ${process.env.ENTRA_CLIENT_ID.substring(0, 8)}...`);
}

// Check 2: MSAL Authority (in frontend code)
console.log('\n📋 2. MSAL Authority Configuratie');
console.log('─'.repeat(60));

const appJsPath = path.join(__dirname, 'public', 'app.js');
if (fs.existsSync(appJsPath)) {
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    
    if (appJs.includes('login.microsoftonline.com/organizations')) {
        console.log('✅ Authority is correct ingesteld voor multitenant');
        console.log('   → https://login.microsoftonline.com/organizations');
    } else if (appJs.includes('login.microsoftonline.com/common')) {
        console.log('⚠️  Authority is ingesteld op /common');
        console.log('   → Dit accepteert ook persoonlijke Microsoft accounts');
        console.log('   → Overweeg /organizations voor alleen werk accounts');
        hasWarnings = true;
    } else {
        console.log('❌ Authority lijkt niet correct ingesteld');
        hasErrors = true;
    }
} else {
    console.log('⚠️  Kan public/app.js niet vinden');
    hasWarnings = true;
}

// Check 3: Tenant Whitelist
console.log('\n📋 3. Tenant Whitelist (ENTRA_ALLOWED_TENANTS)');
console.log('─'.repeat(60));

if (!process.env.ENTRA_ALLOWED_TENANTS || process.env.ENTRA_ALLOWED_TENANTS.trim() === '') {
    console.log('✅ ENTRA_ALLOWED_TENANTS is leeg (alle organisaties toegestaan)');
    console.log('   → Elke Azure AD organisatie kan inloggen');
    console.log('   💡 Voor extra beveiliging: voeg specifieke tenant IDs toe');
} else {
    const tenants = process.env.ENTRA_ALLOWED_TENANTS.split(',').map(t => t.trim());
    console.log(`✅ Tenant whitelist geconfigureerd met ${tenants.length} tenant(s)`);
    tenants.forEach((tid, i) => {
        console.log(`   ${i + 1}. ${tid}`);
    });
    console.log('   → Alleen deze tenants kunnen inloggen');
}

// Check 4: Admin Emails
console.log('\n📋 4. Admin Email Configuratie');
console.log('─'.repeat(60));

if (!process.env.ADMIN_EMAILS) {
    console.log('⚠️  ADMIN_EMAILS is niet ingesteld');
    console.log('   → Niemand heeft admin rechten');
    console.log('   → Voeg toe: ADMIN_EMAILS=admin@company.com');
    hasWarnings = true;
} else {
    const admins = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
    console.log(`✅ ${admins.length} admin email(s) geconfigureerd:`);
    admins.forEach(email => {
        console.log(`   → ${email}`);
    });
}

// Check 5: Database Configuration
console.log('\n📋 5. Database Configuratie');
console.log('─'.repeat(60));

if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL is ingesteld (Easypanel internal link)');
    // Don't log the full URL (contains password)
    const urlMatch = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):.*@([^:]+):(\d+)\/(.+)/);
    if (urlMatch) {
        const [, user, host, port, database] = urlMatch;
        console.log(`   Host: ${host}`);
        console.log(`   Port: ${port}`);
        console.log(`   Database: ${database}`);
        console.log(`   User: ${user}`);
    } else {
        console.log('   ⚠️  URL format lijkt niet correct');
        hasWarnings = true;
    }
} else {
    const dbVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
    const missingDb = dbVars.filter(v => !process.env[v]);

    if (missingDb.length === 0) {
        console.log('✅ Database configuratie compleet (individuele credentials)');
        console.log(`   Host: ${process.env.PGHOST}`);
        console.log(`   Database: ${process.env.PGDATABASE}`);
        console.log(`   User: ${process.env.PGUSER}`);
    } else {
        console.log('❌ Database configuratie incompleet:');
        console.log('   Gebruik DATABASE_URL (aanbevolen voor Easypanel)');
        console.log('   Of configureer individuele credentials:');
        missingDb.forEach(v => {
            console.log(`   → ${v} ontbreekt`);
        });
        hasErrors = true;
    }
}

// Check 6: SendGrid Configuration
console.log('\n📋 6. SendGrid Email Configuratie');
console.log('─'.repeat(60));

if (!process.env.SENDGRID_API_KEY) {
    console.log('⚠️  SENDGRID_API_KEY is niet ingesteld');
    console.log('   → Email notificaties werken niet');
    hasWarnings = true;
} else if (process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
    console.log('⚠️  SENDGRID_API_KEY heeft placeholder waarde');
    hasWarnings = true;
} else {
    console.log('✅ SendGrid API key is ingesteld');
}

if (!process.env.FROM_EMAIL) {
    console.log('⚠️  FROM_EMAIL is niet ingesteld');
    hasWarnings = true;
} else {
    console.log(`✅ From email: ${process.env.FROM_EMAIL}`);
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('📊 Samenvatting\n');

if (!hasErrors && !hasWarnings) {
    console.log('🎉 Alles ziet er goed uit!');
    console.log('   Je multitenant configuratie is correct.');
    console.log('\n✅ Klaar om te deployen!');
} else if (!hasErrors && hasWarnings) {
    console.log('⚠️  Configuratie is functioneel maar heeft aandachtspunten');
    console.log('   Bekijk de waarschuwingen hierboven.');
    console.log('\n✅ Je kunt wel deployen, maar los de waarschuwingen op.');
} else {
    console.log('❌ Er zijn configuratie fouten die opgelost moeten worden');
    console.log('   Bekijk de errors hierboven en los ze op.');
    console.log('\n❌ Los de errors op voordat je deployed.');
}

console.log('\n📚 Meer info:');
console.log('   → ENTRA_ID_SETUP.md - Complete setup guide');
console.log('   → ENTRA_ID_QUICK_REFERENCE.md - Quick reference');
console.log('   → env.example - Configuratie voorbeeld\n');

process.exit(hasErrors ? 1 : 0);

