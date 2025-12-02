const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Security headers for MSAL.js popup flow
app.use((req, res, next) => {
  // Allow popups to communicate with opener window
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Required for MSAL.js
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// PostgreSQL connection
// Support both DATABASE_URL (Easypanel internal link) and individual credentials
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost')
        ? { rejectUnauthorized: false }
        : false
    })
  : new Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

// SendGrid configuration
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// File upload configuration
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen zijn toegestaan (jpeg, jpg, png, gif)'));
    }
  }
});

// Middleware: Verify Entra ID token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen authenticatie token gevonden' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Decode without verification (for demo purposes)
    // In production, you should verify the signature with Microsoft's public keys
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: 'Ongeldig token' });
    }
    
    // Check if tenant is allowed
    const allowedTenants = (process.env.ENTRA_ALLOWED_TENANTS || '').split(',').map(t => t.trim());
    if (allowedTenants.length > 0 && allowedTenants[0] !== '' && !allowedTenants.includes(decoded.tid)) {
      return res.status(403).json({ error: 'Tenant niet toegestaan' });
    }
    
    req.user = {
      email: decoded.email || decoded.preferred_username || decoded.upn,
      name: decoded.name,
      tid: decoded.tid
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Token verificatie mislukt' });
  }
};

// Middleware: Check if user is admin
const requireAdmin = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  
  if (!adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Administratorrechten vereist' });
  }
  
  next();
};

// Function to send confirmation email via SendGrid
async function sendConfirmationEmail(booking) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, skipping email');
    return;
  }
  
  const startDate = new Date(booking.start_datetime);
  const endDate = new Date(booking.end_datetime);
  
  const formatDateTime = (date) => {
    return date.toLocaleString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const msg = {
    to: booking.email,
    from: process.env.FROM_EMAIL || 'noreply@bookavan.com',
    subject: 'Bevestiging: Reservering bestelwagen',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bevestiging van uw reservering</h2>
        
        <p>Beste ${booking.name},</p>
        
        <p>Uw reservering van de bestelwagen is bevestigd!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Reserveringsdetails</h3>
          <p><strong>Ophalen:</strong> ${formatDateTime(startDate)}</p>
          <p><strong>Terugbrengen:</strong> ${formatDateTime(endDate)}</p>
          <p><strong>Afdeling:</strong> ${booking.department}</p>
          <p><strong>Reden:</strong> ${booking.reason}</p>
        </div>
        
        <h3 style="color: #1f2937;">Belangrijke informatie</h3>
        
        <h4>Sleutels ophalen</h4>
        <p>De sleutels van de bestelwagen kunnen opgehaald worden bij de receptie tijdens kantooruren (8:00 - 17:00).</p>
        
        <h4>Tankkaart</h4>
        <p>De tankkaart bevindt zich in het handschoenvakje. De pincode is <strong>1234</strong>.</p>
        
        <h4>Voor- en nafoto's</h4>
        <p>Vergeet niet om voor vertrek en na terugkomst foto's te maken met de AppMyCar app. Dit is verplicht voor alle reserveringen.</p>
        <p><a href="https://apps.apple.com/ph/app/mycar-link/id1590489755" style="color: #2563eb;">Download AppMyCar</a></p>
        
        <h4>Belangrijke regels</h4>
        <ul>
          <li>Breng de bestelwagen op tijd terug</li>
          <li>Zorg ervoor dat de wagen schoon is bij terugkomst</li>
          <li>Tank de wagen vol voordat u hem terugbrengt</li>
          <li>Meld eventuele schade direct aan de receptie</li>
          <li>De bestelwagen is alleen voor zakelijk gebruik</li>
        </ul>
        
        <p style="margin-top: 30px;">Bij vragen kunt u contact opnemen met <a href="mailto:info@company.com" style="color: #2563eb;">info@company.com</a>.</p>
        
        <p>Met vriendelijke groet,<br>Het Facilities Team</p>
      </div>
    `
  };
  
  try {
    await sgMail.send(msg);
    console.log('Confirmation email sent to:', booking.email);
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    // Don't throw - we don't want to cancel the booking if email fails
  }
}

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// Get all photos
app.get('/api/photos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, file_name, file_url, uploaded_at FROM photos ORDER BY uploaded_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Fout bij ophalen foto\'s' });
  }
});

// Get bookings and blocked slots (for calendar view)
app.get('/api/availability', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start en einddatum zijn verplicht' });
    }
    
    // Get bookings
    const bookingsResult = await pool.query(
      'SELECT id, start_datetime, end_datetime, name FROM bookings WHERE start_datetime <= $1 AND end_datetime >= $2',
      [end, start]
    );
    
    // Get blocked slots
    const blockedResult = await pool.query(
      'SELECT id, start_datetime, end_datetime, reason FROM blocked_slots WHERE start_datetime <= $1 AND end_datetime >= $2',
      [end, start]
    );
    
    res.json({
      bookings: bookingsResult.rows,
      blocked: blockedResult.rows
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Fout bij ophalen beschikbaarheid' });
  }
});

// Create booking (protected)
app.post('/api/bookings', verifyToken, async (req, res) => {
  const { start_datetime, end_datetime, name, email, phone, department, reason } = req.body;
  
  // Validation
  if (!start_datetime || !end_datetime || !name || !email || !phone || !department || !reason) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }
  
  const start = new Date(start_datetime);
  const end = new Date(end_datetime);
  const now = new Date();
  
  if (start >= end) {
    return res.status(400).json({ error: 'Einddatum moet na startdatum liggen' });
  }
  
  if (start < now) {
    return res.status(400).json({ error: 'Startdatum kan niet in het verleden liggen' });
  }
  
  try {
    // Check for conflicts with existing bookings
    const conflictingBookings = await pool.query(
      `SELECT id FROM bookings 
       WHERE (start_datetime < $2 AND end_datetime > $1)`,
      [start_datetime, end_datetime]
    );
    
    if (conflictingBookings.rows.length > 0) {
      return res.status(409).json({ error: 'Deze periode is al gereserveerd' });
    }
    
    // Check for conflicts with blocked slots
    const conflictingBlocked = await pool.query(
      `SELECT id FROM blocked_slots 
       WHERE (start_datetime < $2 AND end_datetime > $1)`,
      [start_datetime, end_datetime]
    );
    
    if (conflictingBlocked.rows.length > 0) {
      return res.status(409).json({ error: 'Deze periode is geblokkeerd voor onderhoud' });
    }
    
    // Create booking
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO bookings (id, start_datetime, end_datetime, name, email, phone, department, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [id, start_datetime, end_datetime, name, email, phone, department, reason]
    );
    
    const booking = result.rows[0];
    
    // Send confirmation email (async, don't wait)
    sendConfirmationEmail(booking).catch(err => 
      console.error('Failed to send confirmation email:', err)
    );
    
    res.status(201).json({
      message: 'Reservering succesvol aangemaakt',
      booking: booking
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Fout bij aanmaken reservering' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Block time slot (admin only)
app.post('/api/admin/blocked-slots', verifyToken, requireAdmin, async (req, res) => {
  const { start_datetime, end_datetime, reason } = req.body;
  
  if (!start_datetime || !end_datetime || !reason) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }
  
  const start = new Date(start_datetime);
  const end = new Date(end_datetime);
  
  if (start >= end) {
    return res.status(400).json({ error: 'Einddatum moet na startdatum liggen' });
  }
  
  try {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO blocked_slots (id, start_datetime, end_datetime, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, start_datetime, end_datetime, reason]
    );
    
    res.status(201).json({
      message: 'Periode succesvol geblokkeerd',
      blocked_slot: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error blocking slot:', error);
    res.status(500).json({ error: 'Fout bij blokkeren periode' });
  }
});

// Upload photo (admin only)
app.post('/api/admin/photos', verifyToken, requireAdmin, upload.single('photo'), async (req, res) => {
  console.log('📸 Photo upload request received');
  console.log('User:', req.user);
  console.log('File:', req.file);
  
  if (!req.file) {
    console.error('❌ No file received in upload');
    return res.status(400).json({ error: 'Geen foto geüpload' });
  }
  
  try {
    const id = uuidv4();
    const fileName = req.file.filename;
    const fileUrl = `/uploads/${fileName}`;
    const filePath = req.file.path;
    
    console.log('📁 File saved to:', filePath);
    console.log('🔗 File URL:', fileUrl);
    
    // Verify file was actually saved
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found after upload:', filePath);
      return res.status(500).json({ error: 'Fout bij opslaan foto op disk' });
    }
    
    const result = await pool.query(
      `INSERT INTO photos (id, file_name, file_url, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, fileName, fileUrl, req.user.email]
    );
    
    console.log('✅ Photo saved to database:', result.rows[0]);
    
    res.status(201).json({
      message: 'Foto succesvol geüpload',
      photo: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    res.status(500).json({ 
      error: 'Fout bij uploaden foto',
      details: error.message 
    });
  }
});

// Delete photo (admin only)
app.delete('/api/admin/photos/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foto niet gevonden' });
    }
    
    // Optionally delete the file from disk here
    
    res.json({ message: 'Foto succesvol verwijderd' });
    
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Fout bij verwijderen foto' });
  }
});

// Get all bookings (admin only)
app.get('/api/admin/bookings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY start_datetime DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Fout bij ophalen reserveringen' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Debug endpoint to check environment variables (remove in production)
app.get('/api/debug/config', (req, res) => {
  res.json({
    entra_client_id_set: !!process.env.ENTRA_CLIENT_ID,
    entra_client_id_length: (process.env.ENTRA_CLIENT_ID || '').length,
    entra_client_id_preview: process.env.ENTRA_CLIENT_ID ? 
      process.env.ENTRA_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
    admin_emails_set: !!process.env.ADMIN_EMAILS,
    database_url_set: !!process.env.DATABASE_URL,
    sendgrid_key_set: !!process.env.SENDGRID_API_KEY,
    node_env: process.env.NODE_ENV,
  });
});

// Serve frontend with injected config
app.get('*', (req, res) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/uploads') ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    return res.status(404).send('Not found');
  }
  
  const fs = require('fs');
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inject Entra ID configuration
  const configScript = `
    <script>
      // Microsoft Entra ID Configuration
      window.ENTRA_CLIENT_ID = "${process.env.ENTRA_CLIENT_ID || ''}";
      window.ADMIN_EMAILS = "${process.env.ADMIN_EMAILS || ''}";
    </script>
  `;
  
  html = html.replace('</head>', `${configScript}</head>`);
  res.send(html);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Er is iets misgegaan' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  pool.end();
  process.exit(0);
});

