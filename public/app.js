// ============================================
// BookAVan - Frontend Application Logic
// ============================================

// Global state
let currentUser = null;
let currentMonth = new Date();
let selectedDate = null;
let availabilityData = { bookings: [], blocked: [] };
let msalInstance = null;

// MSAL Configuration (Microsoft Authentication)
const msalConfig = {
    auth: {
        clientId: window.ENTRA_CLIENT_ID || "your-client-id", // Will be injected or set
        authority: `https://login.microsoftonline.com/organizations`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
};

const loginRequest = {
    scopes: ["openid", "profile", "email"]
};

// ============================================
// Authentication Functions
// ============================================

async function initializeMSAL() {
    try {
        if (typeof msal !== 'undefined') {
            msalInstance = new msal.PublicClientApplication(msalConfig);
            await msalInstance.initialize();
            
            // Check if user is already logged in
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                currentUser = accounts[0];
                updateUIForLoggedInUser();
            }
        } else {
            console.warn('MSAL library not loaded');
        }
    } catch (error) {
        console.error('MSAL initialization error:', error);
    }
}

async function login() {
    if (!msalInstance) {
        alert('Authenticatie is niet beschikbaar. Configureer eerst ENTRA_CLIENT_ID.');
        return;
    }
    
    try {
        const response = await msalInstance.loginPopup(loginRequest);
        currentUser = response.account;
        updateUIForLoggedInUser();
    } catch (error) {
        console.error('Login error:', error);
        alert('Inloggen mislukt. Probeer het opnieuw.');
    }
}

function logout() {
    if (msalInstance && currentUser) {
        msalInstance.logoutPopup({
            account: currentUser
        });
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

async function getAccessToken() {
    if (!msalInstance || !currentUser) {
        return null;
    }
    
    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: currentUser
        });
        return response.idToken;
    } catch (error) {
        console.error('Token acquisition error:', error);
        // Try interactive login if silent fails
        try {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            return response.idToken;
        } catch (popupError) {
            console.error('Popup token acquisition error:', popupError);
            return null;
        }
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.name || currentUser.username;
    document.getElementById('authWarning').style.display = 'none';
    
    // Check if user is admin
    const adminEmails = (window.ADMIN_EMAILS || '').toLowerCase().split(',');
    const userEmail = (currentUser.username || currentUser.email || '').toLowerCase();
    
    if (adminEmails.includes(userEmail.trim())) {
        document.getElementById('adminBtn').style.display = 'block';
        document.getElementById('adminPhotoUpload').style.display = 'block';
    }
}

function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('authWarning').style.display = 'block';
    document.getElementById('adminBtn').style.display = 'none';
    document.getElementById('adminPhotoUpload').style.display = 'none';
}

// ============================================
// Calendar Functions
// ============================================

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('currentMonth');
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Set month title
    const monthNames = [
        'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
        'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    calendar.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 7 for Monday-first calendar
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Get last day of previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Add previous month's trailing days
    for (let i = dayOfWeek - 1; i > 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = prevMonthLastDay - i + 1;
        calendar.appendChild(dayElement);
    }
    
    // Add current month's days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= lastDay; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);
        
        // Check if today
        if (currentDate.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }
        
        // Check if selected
        if (selectedDate && currentDate.getTime() === selectedDate.getTime()) {
            dayElement.classList.add('selected');
        }
        
        // Check availability
        const dateStatus = checkDateAvailability(currentDate);
        if (dateStatus === 'booked') {
            dayElement.classList.add('booked');
            dayElement.title = 'Gereserveerd';
        } else if (dateStatus === 'blocked') {
            dayElement.classList.add('blocked');
            dayElement.title = 'Onderhoud';
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => selectDate(currentDate));
        
        calendar.appendChild(dayElement);
    }
    
    // Add next month's leading days to fill grid
    const totalCells = calendar.children.length - 7; // Subtract headers
    const remainingCells = totalCells % 7;
    if (remainingCells > 0) {
        for (let i = 1; i <= 7 - remainingCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.textContent = i;
            calendar.appendChild(dayElement);
        }
    }
}

function checkDateAvailability(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if date has any bookings
    for (const booking of availabilityData.bookings) {
        const bookingStart = new Date(booking.start_datetime);
        const bookingEnd = new Date(booking.end_datetime);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        
        if (date >= bookingStart && date <= bookingEnd) {
            return 'booked';
        }
    }
    
    // Check if date is blocked
    for (const blocked of availabilityData.blocked) {
        const blockedStart = new Date(blocked.start_datetime);
        const blockedEnd = new Date(blocked.end_datetime);
        blockedStart.setHours(0, 0, 0, 0);
        blockedEnd.setHours(0, 0, 0, 0);
        
        if (date >= blockedStart && date <= blockedEnd) {
            return 'blocked';
        }
    }
    
    return 'available';
}

function selectDate(date) {
    selectedDate = date;
    renderCalendar();
    
    // Update form with selected date
    const dateStr = date.toISOString().split('T')[0];
    document.getElementById('startDate').value = dateStr;
    document.getElementById('endDate').value = dateStr;
}

function prevMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
    loadAvailability();
}

function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
    loadAvailability();
}

// ============================================
// API Functions
// ============================================

async function loadAvailability() {
    try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const response = await fetch(
            `/api/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
        );
        
        if (response.ok) {
            availabilityData = await response.json();
            renderCalendar();
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

async function loadPhotos() {
    try {
        const response = await fetch('/api/photos');
        if (response.ok) {
            const photos = await response.json();
            renderPhotos(photos);
        }
    } catch (error) {
        console.error('Error loading photos:', error);
        document.getElementById('photosGrid').innerHTML = 
            '<div class="loading">Fout bij laden van foto\'s</div>';
    }
}

function renderPhotos(photos) {
    const grid = document.getElementById('photosGrid');
    
    if (photos.length === 0) {
        grid.innerHTML = '<div class="loading">Nog geen foto\'s beschikbaar</div>';
        return;
    }
    
    grid.innerHTML = photos.map(photo => `
        <div class="photo-card">
            <img src="${photo.file_url}" alt="Van foto" loading="lazy">
            <div class="photo-card-info">
                <small>${new Date(photo.uploaded_at).toLocaleDateString('nl-NL')}</small>
            </div>
        </div>
    `).join('');
}

async function submitBooking(formData) {
    const token = await getAccessToken();
    
    if (!token) {
        throw new Error('Niet ingelogd');
    }
    
    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Fout bij aanmaken reservering');
    }
    
    return data;
}

async function blockTimeSlot(formData) {
    const token = await getAccessToken();
    
    if (!token) {
        throw new Error('Niet ingelogd');
    }
    
    const response = await fetch('/api/admin/blocked-slots', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Fout bij blokkeren periode');
    }
    
    return data;
}

async function uploadPhoto(file) {
    const token = await getAccessToken();
    
    if (!token) {
        throw new Error('Niet ingelogd');
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Fout bij uploaden foto');
    }
    
    return data;
}

// ============================================
// Form Handlers
// ============================================

function handleBookingFormSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showError('U moet ingelogd zijn om een reservering te maken');
        return;
    }
    
    const formData = {
        start_datetime: `${document.getElementById('startDate').value}T${document.getElementById('startTime').value}`,
        end_datetime: `${document.getElementById('endDate').value}T${document.getElementById('endTime').value}`,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        department: document.getElementById('department').value,
        reason: document.getElementById('reason').value
    };
    
    // Basic validation
    const startDateTime = new Date(formData.start_datetime);
    const endDateTime = new Date(formData.end_datetime);
    
    if (startDateTime >= endDateTime) {
        showError('Einddatum moet na startdatum liggen');
        return;
    }
    
    if (startDateTime < new Date()) {
        showError('Startdatum kan niet in het verleden liggen');
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Bezig met reserveren...';
    
    submitBooking(formData)
        .then(() => {
            showSuccess('Reservering succesvol aangemaakt! U ontvangt een bevestigingsmail.');
            document.getElementById('bookingForm').reset();
            loadAvailability();
        })
        .catch(error => {
            showError(error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Boeking bevestigen';
        });
}

function handleBlockSlotFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        start_datetime: document.getElementById('blockStart').value,
        end_datetime: document.getElementById('blockEnd').value,
        reason: document.getElementById('blockReason').value
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    blockTimeSlot(formData)
        .then(() => {
            alert('Periode succesvol geblokkeerd');
            document.getElementById('blockSlotForm').reset();
            loadAvailability();
            closeAdminPanel();
        })
        .catch(error => {
            alert(`Fout: ${error.message}`);
        })
        .finally(() => {
            submitBtn.disabled = false;
        });
}

function handlePhotoUploadFormSubmit(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('photoFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Selecteer een foto');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploaden...';
    
    uploadPhoto(file)
        .then(() => {
            alert('Foto succesvol geüpload');
            fileInput.value = '';
            loadPhotos();
        })
        .catch(error => {
            alert(`Fout: ${error.message}`);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload foto';
        });
}

// ============================================
// UI Helper Functions
// ============================================

function showError(message) {
    const errorDiv = document.getElementById('formError');
    const successDiv = document.getElementById('formSuccess');
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('formError');
    const successDiv = document.getElementById('formSuccess');
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
}

function scrollToBooking() {
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

function openAdminPanel() {
    document.getElementById('adminPanel').style.display = 'block';
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

// ============================================
// FAQ Accordion
// ============================================

function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize MSAL
    initializeMSAL();
    
    // Load data
    loadAvailability();
    loadPhotos();
    
    // Initialize calendar
    renderCalendar();
    
    // Initialize FAQ
    initializeFAQ();
    
    // Pre-fill form with user data if logged in
    if (currentUser) {
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('email').value = currentUser.username || '';
    }
    
    // Event Listeners
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('prevMonth').addEventListener('click', prevMonth);
    document.getElementById('nextMonth').addEventListener('click', nextMonth);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingFormSubmit);
    
    // Admin event listeners
    const blockSlotForm = document.getElementById('blockSlotForm');
    if (blockSlotForm) {
        blockSlotForm.addEventListener('submit', handleBlockSlotFormSubmit);
    }
    
    const photoUploadForm = document.getElementById('photoUploadForm');
    if (photoUploadForm) {
        photoUploadForm.addEventListener('submit', handlePhotoUploadFormSubmit);
    }
    
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', openAdminPanel);
    }
    
    const closeAdminBtn = document.getElementById('closeAdmin');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', closeAdminPanel);
    }
    
    // Set default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    document.getElementById('startDate').value = tomorrowStr;
    document.getElementById('endDate').value = tomorrowStr;
});

// Make scrollToBooking available globally
window.scrollToBooking = scrollToBooking;

