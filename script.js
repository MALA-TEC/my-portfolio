// API URL
// Sync local storage with database
async function syncWithDatabase() {
    try {
        const response = await fetch(API_URL + 'get_events.php?limit=100', {
            headers: { 'X-API-Key': 'test-key' }
        });
        const result = await response.json();
        
        if (result.success && result.data.events.length > 0) {
            // Merge database events with local events
            let localEvents = JSON.parse(localStorage.getItem('unity_events') || '[]');
            let dbEvents = result.data.events;
            
            // Combine and deduplicate
            const allEvents = [...dbEvents, ...localEvents];
            const uniqueEvents = [];
            const ids = new Set();
            
            for (const event of allEvents) {
                if (!ids.has(event.certificate_id || event.id)) {
                    ids.add(event.certificate_id || event.id);
                    uniqueEvents.push({
                        id: event.certificate_id || event.id,
                        type: event.event_type,
                        name: event.full_name,
                        date: event.event_date,
                        regDate: event.registration_date || event.regDate,
                        region: event.region,
                        zone: event.zone,
                        woreda: event.woreda,
                        kebele: event.kebele,
                        phone: event.phone_number,
                        photo: event.photo,
                        spouse1_photo: event.spouse1_photo,
                        spouse2_photo: event.spouse2_photo,
                        spouse1_name: event.spouse1_name,
                        spouse2_name: event.spouse2_name
                    });
                }
            }
            
            localStorage.setItem('unity_events', JSON.stringify(uniqueEvents));
            console.log('Synced with database:', uniqueEvents.length, 'events');
        }
    } catch (error) {
        console.log('Sync with database failed:', error);
    }
}

// Call sync when loading dashboard
function loadDashboard() {
    syncWithDatabase().then(() => {
        // Your existing loadDashboard code here
        displayDashboard();
    });
}
const API_URL = 'http://localhost/unity-registry/backend/api/';

// Current event type
let currentEventType = '';
let uploadedPhotoBase64 = null;
let spouse1PhotoBase64 = null;  // First spouse photo
let spouse2PhotoBase64 = null;  // Second spouse photo

// Ethiopian Regions
const ethiopianRegions = [
    'Tigray Region',
    'Afar Region',
    'Amhara Region',
    'Oromia Region',
    'Somali Region',
    'Benishangul-Gumuz Region',
    'Southern Nations, Nationalities, and Peoples\' Region',
    'Gambela Region',
    'Harari Region',
    'Addis Ababa City Administration',
    'Dire Dawa City Administration'
];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to event cards
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('click', function() {
            const eventType = this.getAttribute('data-event');
            showForm(eventType);
        });
    });
    
    // Navigation links
    const navHomeLink = document.getElementById('navHomeLink');
    const navSupportLink = document.getElementById('navSupportLink');
    const navDashboardLink = document.getElementById('navDashboardLink');
    
    if (navHomeLink) navHomeLink.addEventListener('click', showHome);
    if (navSupportLink) navSupportLink.addEventListener('click', showSupport);
    if (navDashboardLink) navDashboardLink.addEventListener('click', loadDashboard);
    
    // Create form page if it doesn't exist
    if (!document.getElementById('formPage')) {
        createFormPage();
    }
    
    // Create dashboard page if it doesn't exist
    if (!document.getElementById('dashboardPage')) {
        createDashboardPage();
    }
    
    // Setup form submission if form exists
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleFormSubmit);
    }
});

// Create the registration form page dynamically with all fields including dual photos for marriage
function createFormPage() {
    const formPage = document.createElement('div');
    formPage.id = 'formPage';
    formPage.className = 'registration-page';
    formPage.style.display = 'none';
    formPage.innerHTML = `
        <style>
            .form-section {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 25px;
                margin-bottom: 25px;
                border: 1px solid rgba(255,255,255,0.3);
            }
            
            .form-section-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #1d4d6e;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #ffd966;
                display: inline-block;
            }
            
            .form-row {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .form-group {
                flex: 1;
                min-width: 200px;
            }
            
            label {
                display: block;
                font-weight: 500;
                margin-bottom: 8px;
                color: #1d4d6e;
                font-size: 0.85rem;
                letter-spacing: 0.3px;
            }
            
            label i {
                margin-right: 5px;
                color: #ffd966;
            }
            
            input, select, textarea {
                width: 100%;
                padding: 12px 16px;
                border: 1.5px solid #e2edf5;
                border-radius: 12px;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
                transition: 0.2s;
                background: #ffffff;
            }
            
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #2c7eb6;
                box-shadow: 0 0 0 3px rgba(44,126,182,0.1);
            }
            
            .required-star {
                color: #dc3545;
                margin-left: 3px;
            }
            
            .phone-input-group {
                display: flex;
                gap: 10px;
            }
            
            .country-code {
                width: 80px;
            }
            
            /* Photo Upload Styles */
            .photo-upload-container {
                display: flex;
                gap: 20px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            
            .photo-preview {
                width: 150px;
                height: 150px;
                border: 2px dashed #cbdde9;
                border-radius: 15px;
                overflow: hidden;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .photo-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .photo-preview .default-icon {
                text-align: center;
                color: #999;
            }
            
            .photo-preview .default-icon i {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .photo-upload-buttons {
                flex: 1;
            }
            
            .photo-input {
                display: none;
            }
            
            .photo-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                margin-right: 10px;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            
            .photo-btn.remove {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            
            .photo-hint {
                font-size: 0.75rem;
                color: #666;
                margin-top: 10px;
            }
            
            /* Dual Photo Styles for Marriage */
            .dual-photo-container {
                display: flex;
                gap: 30px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .spouse-photo-box {
                flex: 1;
                min-width: 250px;
                text-align: center;
                padding: 20px;
                background: rgba(255,255,255,0.5);
                border-radius: 20px;
            }
            
            .spouse-photo-box h4 {
                color: #1d4d6e;
                margin-bottom: 15px;
                font-size: 1.1rem;
            }
            
            .spouse-photo-box h4 i {
                margin-right: 8px;
            }
        </style>
        
        <div class="navbar">
            <div class="logo">
                <h1>UNITY REGISTRY <i class="fas fa-certificate"></i></h1>
                <span>Vital Events · Digital Seal 2026</span>
            </div>
            <div class="nav-links">
                <a href="#" id="formHomeLink">Home</a>
                <a href="#" id="formDashboardLink">Life Records Dashboard</a>
            </div>
        </div>
        
        <div class="reg-hero">
            <div class="reg-header">
                <h2><i class="fas fa-edit"></i> <span id="formTitle">Registration</span></h2>
                <button class="back-home-btn" id="backHomeBtn"><i class="fas fa-arrow-left"></i> Back to Home</button>
            </div>
            <div class="form-body">
                <form id="registerForm">
                    <!-- Photo Upload Section (Dynamic - changes based on event type) -->
                    <div id="photoSection"></div>
                    
                    <!-- Personal Information Section -->
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="fas fa-user-circle"></i> Personal Information
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-user"></i> Full Name <span class="required-star">*</span></label>
                                <input type="text" id="fullName" required placeholder="Enter full name">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-venus-mars"></i> Gender <span class="required-star">*</span></label>
                                <select id="gender">
                                    <option value="">Select Gender</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-calendar-alt"></i> Date of Birth <span class="required-star">*</span></label>
                                <input type="date" id="dateOfBirth">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-id-card"></i> National ID Number</label>
                                <input type="text" id="nationalId" placeholder="e.g., KEB-1234567890">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-phone"></i> Phone Number <span class="required-star">*</span></label>
                                <div class="phone-input-group">
                                    <select id="countryCode" class="country-code">
                                        <option value="+251">+251 (Ethiopia)</option>
                                        <option value="+1">+1 (USA)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+971">+971 (UAE)</option>
                                    </select>
                                    <input type="tel" id="phoneNumber" required placeholder="9XXXXXXXX">
                                </div>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-envelope"></i> Email Address</label>
                                <input type="email" id="email" placeholder="example@email.com">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Address Information Section -->
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="fas fa-map-marker-alt"></i> Address Information
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-globe-africa"></i> Region <span class="required-star">*</span></label>
                                <select id="region" required>
                                    <option value="">Select Region</option>
                                    ${ethiopianRegions.map(region => `<option value="${region}">${region}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-city"></i> Zone <span class="required-star">*</span></label>
                                <input type="text" id="zone" required placeholder="Enter zone name">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-map-pin"></i> Woreda <span class="required-star">*</span></label>
                                <input type="text" id="woreda" required placeholder="Enter woreda number or name">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-home"></i> Kebele <span class="required-star">*</span></label>
                                <input type="text" id="kebele" required placeholder="Enter kebele number">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-house-user"></i> House Number</label>
                                <input type="text" id="houseNumber" placeholder="House/Block number">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-location-dot"></i> Sub-City</label>
                                <input type="text" id="subCity" placeholder="Sub-city name (if applicable)">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-map"></i> Additional Address Info</label>
                                <textarea id="additionalAddress" rows="2" placeholder="Landmarks, nearby places, direction notes..."></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Event Specific Information -->
                    <div id="eventSpecificSection" class="form-section">
                        <div class="form-section-title">
                            <i class="fas fa-calendar-check"></i> Event Information
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-calendar-day"></i> Event Date <span class="required-star">*</span></label>
                                <input type="date" id="eventDate" required>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-clock"></i> Event Time</label>
                                <input type="time" id="eventTime">
                            </div>
                        </div>
                        <div id="extraFields"></div>
                    </div>
                    
                    <!-- Document Information Section -->
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="fas fa-file-alt"></i> Document Information
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-passport"></i> Supporting Document Type</label>
                                <select id="documentType">
                                    <option value="">Select Document Type</option>
                                    <option>Health Facility Report</option>
                                    <option>Court Order</option>
                                    <option>Religious Certificate</option>
                                    <option>Police Report</option>
                                    <option>Hospital Record</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-hashtag"></i> Document Number</label>
                                <input type="text" id="documentNumber" placeholder="Document reference number">
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        <i class="fas fa-check-circle"></i> Register Event
                    </button>
                </form>
                <div id="formMessage" style="display: none;" class="message"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(formPage);
    
    // Add event listeners for new form page
    document.getElementById('formHomeLink')?.addEventListener('click', showHome);
    document.getElementById('formDashboardLink')?.addEventListener('click', loadDashboard);
    document.getElementById('backHomeBtn')?.addEventListener('click', showHome);
    
    // Add dynamic region-based field updates
    const regionSelect = document.getElementById('region');
    if (regionSelect) {
        regionSelect.addEventListener('change', updateZoneSuggestions);
    }
}

// Handle photo upload for single photo
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('File size too large. Maximum size is 2MB.');
            return;
        }
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            alert('Only JPG, JPEG, and PNG files are allowed.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedPhotoBase64 = e.target.result;
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${uploadedPhotoBase64}" alt="Profile Photo">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Handle spouse 1 photo upload
function handleSpouse1PhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('File size too large. Maximum size is 2MB.');
            return;
        }
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            alert('Only JPG, JPEG, and PNG files are allowed.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            spouse1PhotoBase64 = e.target.result;
            const preview = document.getElementById('spouse1Preview');
            if (preview) {
                preview.innerHTML = `<img src="${spouse1PhotoBase64}" alt="Spouse 1 Photo">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Handle spouse 2 photo upload
function handleSpouse2PhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('File size too large. Maximum size is 2MB.');
            return;
        }
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            alert('Only JPG, JPEG, and PNG files are allowed.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            spouse2PhotoBase64 = e.target.result;
            const preview = document.getElementById('spouse2Preview');
            if (preview) {
                preview.innerHTML = `<img src="${spouse2PhotoBase64}" alt="Spouse 2 Photo">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Remove single photo
function removePhoto() {
    uploadedPhotoBase64 = null;
    const preview = document.getElementById('photoPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="default-icon">
                <i class="fas fa-user-circle"></i>
                <p>No Photo</p>
            </div>
        `;
    }
    const photoInput = document.getElementById('photoInput');
    if (photoInput) photoInput.value = '';
}

// Remove spouse 1 photo
function removeSpouse1Photo() {
    spouse1PhotoBase64 = null;
    const preview = document.getElementById('spouse1Preview');
    if (preview) {
        preview.innerHTML = `
            <div class="default-icon">
                <i class="fas fa-user-circle"></i>
                <p>No Photo</p>
            </div>
        `;
    }
    const input = document.getElementById('spouse1PhotoInput');
    if (input) input.value = '';
}

// Remove spouse 2 photo
function removeSpouse2Photo() {
    spouse2PhotoBase64 = null;
    const preview = document.getElementById('spouse2Preview');
    if (preview) {
        preview.innerHTML = `
            <div class="default-icon">
                <i class="fas fa-user-circle"></i>
                <p>No Photo</p>
            </div>
        `;
    }
    const input = document.getElementById('spouse2PhotoInput');
    if (input) input.value = '';
}

// Update zone suggestions based on region
function updateZoneSuggestions() {
    const region = document.getElementById('region').value;
    const zoneInput = document.getElementById('zone');
    
    const zoneSuggestions = {
        'Addis Ababa City Administration': ['Addis Ketema', 'Akaky Kaliti', 'Arada', 'Bole', 'Gulele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'],
        'Oromia Region': ['Arsi', 'Bale', 'Borana', 'East Hararghe', 'East Shewa', 'Guji', 'Horo Guduru', 'Illubabor', 'Jimma', 'Kelem Welega', 'North Shewa', 'South West Shewa', 'West Arsi', 'West Hararghe', 'West Shewa'],
        'Amhara Region': ['Agew Awi', 'East Gojjam', 'North Gondar', 'North Shewa', 'North Wollo', 'Oromia', 'South Gondar', 'South Wollo', 'Wag Hemra', 'West Gojjam'],
        'Tigray Region': ['Central Tigray', 'East Tigray', 'North West Tigray', 'South Tigray', 'South East Tigray']
    };
    
    if (zoneSuggestions[region]) {
        const datalistId = 'zoneSuggestions';
        let datalist = document.getElementById(datalistId);
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = datalistId;
            zoneInput.setAttribute('list', datalistId);
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = zoneSuggestions[region].map(zone => `<option value="${zone}">`).join('');
    }
}

// Create the dashboard page dynamically with professional design
function createDashboardPage() {
    const dashboardPage = document.createElement('div');
    dashboardPage.id = 'dashboardPage';
    dashboardPage.className = 'registration-page';
    dashboardPage.style.display = 'none';
    dashboardPage.innerHTML = `
        <style>
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 25px;
                color: white;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                transition: transform 0.3s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-card i {
                font-size: 2.5rem;
                margin-bottom: 15px;
            }
            
            .stat-card .stat-number {
                font-size: 2rem;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .stat-card .stat-label {
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            .dashboard-table-container {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 25px;
                margin-top: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .dashboard-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .dashboard-table th {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
            }
            
            .dashboard-table td {
                padding: 15px;
                border-bottom: 1px solid #e0e0e0;
                color: #333;
            }
            
            .dashboard-table tr:hover {
                background: #f8f9fa;
            }
            
            .event-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .event-badge.birth { background: #e3f2fd; color: #1976d2; }
            .event-badge.marriage { background: #fce4ec; color: #c2185b; }
            .event-badge.divorce { background: #f3e5f5; color: #7b1fa2; }
            .event-badge.adoption { background: #e8f5e9; color: #388e3c; }
            .event-badge.death { background: #efebe9; color: #5d4037; }
            
            .btn-view {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-view:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(102,126,234,0.4);
            }
            
            .dashboard-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
            }
            
            .dashboard-action-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .dashboard-action-btn.clear {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
            }
            
            .dashboard-action-btn.export {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
            }
            
            .certificate-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .certificate-content {
                background: white;
                width: 90%;
                max-width: 950px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 20px;
                position: relative;
                animation: modalSlideIn 0.4s ease;
            }
            
            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .certificate-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                text-align: center;
                border-radius: 20px 20px 0 0;
                color: white;
            }
            
            .certificate-body {
                padding: 40px;
            }
            
            .certificate-photo {
                text-align: center;
                margin: 20px 0;
            }
            
            .certificate-photo-img {
                width: 150px;
                height: 150px;
                border-radius: 50%;
                object-fit: cover;
                border: 4px solid #ffd700;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            }
            
            .dual-photo-certificate {
                display: flex;
                gap: 40px;
                justify-content: center;
                flex-wrap: wrap;
                margin: 30px 0;
            }
            
            .dual-photo-item {
                text-align: center;
            }
            
            .dual-photo-item h4 {
                margin-top: 15px;
                color: #667eea;
                font-size: 1rem;
            }
            
            .certificate-seal {
                text-align: center;
                margin: 20px 0;
            }
            
            .certificate-seal i {
                font-size: 60px;
                color: #ffd700;
            }
            
            .certificate-info {
                margin: 30px 0;
            }
            
            .certificate-info-row {
                display: flex;
                padding: 12px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .certificate-label {
                font-weight: 600;
                width: 180px;
                color: #667eea;
            }
            
            .certificate-value {
                flex: 1;
                color: #333;
            }
            
            .certificate-footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 20px 20px;
                font-size: 0.85rem;
                color: #666;
            }
            
            .close-modal {
                position: absolute;
                top: 15px;
                right: 25px;
                font-size: 35px;
                cursor: pointer;
                color: white;
                transition: all 0.3s ease;
            }
            
            .close-modal:hover {
                transform: scale(1.2);
            }
            
            .print-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 20px;
            }
            
            .empty-dashboard {
                text-align: center;
                padding: 60px;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
            }
            
            .empty-dashboard i {
                font-size: 80px;
                color: #ccc;
                margin-bottom: 20px;
            }
        </style>
        
        <div class="navbar">
            <div class="logo">
                <h1>UNITY REGISTRY <i class="fas fa-certificate"></i></h1>
                <span>Vital Events · Digital Seal 2026</span>
            </div>
            <div class="nav-links">
                <a href="#" id="dashboardHomeLink">Home</a>
                <a href="#" id="dashboardNavLink" class="active-nav">Dashboard</a>
            </div>
        </div>
        
        <div class="reg-hero">
            <div class="reg-header">
                <h2><i class="fas fa-chart-line"></i> Life Records Dashboard</h2>
                <button class="back-home-btn" id="dashboardBackBtn"><i class="fas fa-arrow-left"></i> Back to Home</button>
            </div>
            <div class="form-body">
                <div id="dashboardContent"></div>
            </div>
        </div>
        
        <div id="certificateModal" class="certificate-modal">
            <div class="certificate-content">
                <span class="close-modal" onclick="closeCertificate()">&times;</span>
                <div id="certificateContent"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dashboardPage);
    
    document.getElementById('dashboardHomeLink')?.addEventListener('click', showHome);
    document.getElementById('dashboardNavLink')?.addEventListener('click', loadDashboard);
    document.getElementById('dashboardBackBtn')?.addEventListener('click', showHome);
}

// Show registration form
function showForm(eventType) {
    // Reset photos based on event type
    if (eventType === 'marriage') {
        spouse1PhotoBase64 = null;
        spouse2PhotoBase64 = null;
    } else {
        uploadedPhotoBase64 = null;
    }
    
    currentEventType = eventType;
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('formPage').style.display = 'block';
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) dashboardPage.style.display = 'none';
    
    let title = '';
    let icon = '';
    switch(eventType) {
        case 'birth': title = 'Birth Registration'; icon = '👶'; break;
        case 'marriage': title = 'Marriage Registration'; icon = '💍'; break;
        case 'divorce': title = 'Divorce Registration'; icon = '⚖️'; break;
        case 'adoption': title = 'Adoption Registration'; icon = '👨‍👩‍👧'; break;
        case 'death': title = 'Death Registration'; icon = '🕊️'; break;
        default: title = 'Event Registration'; icon = '📝';
    }
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerHTML = `${icon} ${title}`;
    
    // Create photo section based on event type
    const photoSection = document.getElementById('photoSection');
    if (eventType === 'marriage') {
        photoSection.innerHTML = `
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-camera"></i> Spouse Photos
                </div>
                <div class="dual-photo-container">
                    <div class="spouse-photo-box">
                        <h4><i class="fas fa-male"></i> Spouse 1 Photo</h4>
                        <div class="photo-preview" id="spouse1Preview">
                            <div class="default-icon">
                                <i class="fas fa-user-circle"></i>
                                <p>No Photo</p>
                            </div>
                        </div>
                        <input type="file" id="spouse1PhotoInput" class="photo-input" accept="image/jpeg,image/png,image/jpg">
                        <div style="margin-top: 15px;">
                            <button type="button" class="photo-btn" onclick="document.getElementById('spouse1PhotoInput').click()">
                                <i class="fas fa-upload"></i> Upload Photo
                            </button>
                            <button type="button" class="photo-btn remove" onclick="removeSpouse1Photo()">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                    <div class="spouse-photo-box">
                        <h4><i class="fas fa-female"></i> Spouse 2 Photo</h4>
                        <div class="photo-preview" id="spouse2Preview">
                            <div class="default-icon">
                                <i class="fas fa-user-circle"></i>
                                <p>No Photo</p>
                            </div>
                        </div>
                        <input type="file" id="spouse2PhotoInput" class="photo-input" accept="image/jpeg,image/png,image/jpg">
                        <div style="margin-top: 15px;">
                            <button type="button" class="photo-btn" onclick="document.getElementById('spouse2PhotoInput').click()">
                                <i class="fas fa-upload"></i> Upload Photo
                            </button>
                            <button type="button" class="photo-btn remove" onclick="removeSpouse2Photo()">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
                <div class="photo-hint" style="text-align: center; margin-top: 20px;">
                    <i class="fas fa-info-circle"></i> Accepted formats: JPG, PNG. Max size: 2MB each
                </div>
            </div>
        `;
        
        // Add event listeners for spouse photo uploads
        document.getElementById('spouse1PhotoInput')?.addEventListener('change', handleSpouse1PhotoUpload);
        document.getElementById('spouse2PhotoInput')?.addEventListener('change', handleSpouse2PhotoUpload);
    } else {
        photoSection.innerHTML = `
            <div class="form-section">
                <div class="form-section-title">
                    <i class="fas fa-camera"></i> Photo Upload
                </div>
                <div class="photo-upload-container">
                    <div class="photo-preview" id="photoPreview">
                        <div class="default-icon">
                            <i class="fas fa-user-circle"></i>
                            <p>No Photo</p>
                        </div>
                    </div>
                    <div class="photo-upload-buttons">
                        <input type="file" id="photoInput" class="photo-input" accept="image/jpeg,image/png,image/jpg">
                        <button type="button" class="photo-btn" onclick="document.getElementById('photoInput').click()">
                            <i class="fas fa-upload"></i> Upload Photo
                        </button>
                        <button type="button" class="photo-btn remove" onclick="removePhoto()">
                            <i class="fas fa-trash"></i> Remove Photo
                        </button>
                        <div class="photo-hint">
                            <i class="fas fa-info-circle"></i> Accepted formats: JPG, PNG. Max size: 2MB
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for single photo upload
        document.getElementById('photoInput')?.addEventListener('change', handlePhotoUpload);
    }
    
    // Add event-specific extra fields
    let extraHtml = '';
    if (eventType === 'birth') {
        extraHtml = `
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-weight-hanging"></i> Birth Weight (kg)</label>
                    <input type="number" id="birthWeight" step="0.01" placeholder="e.g., 3.2">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-stethoscope"></i> Attendant/Doctor Name</label>
                    <input type="text" id="attendant" placeholder="Doctor/Midwife name">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-father"></i> Father's Name</label>
                    <input type="text" id="fatherName" placeholder="Father's full name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-mother"></i> Mother's Name</label>
                    <input type="text" id="motherName" placeholder="Mother's full name">
                </div>
            </div>
        `;
    } else if (eventType === 'marriage') {
        extraHtml = `
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-ring"></i> Spouse 1 Full Name <span class="required-star">*</span></label>
                    <input type="text" id="spouse1" required placeholder="First spouse full name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-ring"></i> Spouse 2 Full Name <span class="required-star">*</span></label>
                    <input type="text" id="spouse2" required placeholder="Second spouse full name">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-church"></i> Marriage Location/Venue</label>
                    <input type="text" id="marriageLocation" placeholder="Church, Hall, or Office name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user-tie"></i> Officiant Name</label>
                    <input type="text" id="officiant" placeholder="Priest, Judge, or Registrar name">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-file-alt"></i> Marriage Certificate Number</label>
                    <input type="text" id="marriageCertNumber" placeholder="Certificate number">
                </div>
            </div>
        `;
    } else if (eventType === 'divorce') {
        extraHtml = `
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Petitioner Name <span class="required-star">*</span></label>
                    <input type="text" id="petitioner" required placeholder="Person filing for divorce">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Respondent Name <span class="required-star">*</span></label>
                    <input type="text" id="respondent" required placeholder="Other party">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-gavel"></i> Court Name</label>
                    <input type="text" id="courtName" placeholder="Court name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-file-alt"></i> Decree Number</label>
                    <input type="text" id="decreeNumber" placeholder="Court decree number">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-comment"></i> Divorce Reason</label>
                    <textarea id="divorceReason" rows="2" placeholder="Reason for divorce..."></textarea>
                </div>
            </div>
        `;
    } else if (eventType === 'adoption') {
        extraHtml = `
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-child"></i> Child Name <span class="required-star">*</span></label>
                    <input type="text" id="childName" required placeholder="Child's full name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-calendar"></i> Child's Date of Birth</label>
                    <input type="date" id="childDob">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-users"></i> Adoptive Parents <span class="required-star">*</span></label>
                    <input type="text" id="adoptiveParents" required placeholder="Names of adoptive parents">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-building"></i> Adoption Agency</label>
                    <input type="text" id="adoptionAgency" placeholder="Agency name">
                </div>
            </div>
        `;
    } else if (eventType === 'death') {
        extraHtml = `
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Death Place <span class="required-star">*</span></label>
                    <input type="text" id="deathPlace" required placeholder="Location of death">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-notes-medical"></i> Cause of Death</label>
                    <input type="text" id="causeOfDeath" placeholder="Cause of death">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="fas fa-user-md"></i> Physician Name</label>
                    <input type="text" id="physicianName" placeholder="Attending physician's name">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-user-check"></i> Informant Name</label>
                    <input type="text" id="informantName" placeholder="Person reporting the death">
                </div>
            </div>
        `;
    }
    
    const extraFields = document.getElementById('extraFields');
    if (extraFields) extraFields.innerHTML = extraHtml;
    
    // Reset form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.reset();
    
    const formMessage = document.getElementById('formMessage');
    if (formMessage) {
        formMessage.style.display = 'none';
        formMessage.innerHTML = '';
    }
}

// Show home page
function showHome() {
    document.getElementById('homePage').style.display = 'block';
    const formPage = document.getElementById('formPage');
    const dashboardPage = document.getElementById('dashboardPage');
    if (formPage) formPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'none';
}

// Show support page
function showSupport() {
    alert('🏛️ UNITY REGISTRY SUPPORT CENTER\n\n' +
          '📞 Hotline: 1-800-UNITY-2026\n' +
          '📧 Email: support@unityregistry.gov\n' +
          '💬 Live Chat: Available 24/7\n\n' +
          '📍 Headquarters: Unity Tower, Digital District\n' +
          '⏰ Hours: Monday-Friday, 9 AM - 6 PM');
}

// Show message
function showMessage(msg, type) {
    const msgDiv = document.getElementById('formMessage');
    if (!msgDiv) return;
    msgDiv.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    msgDiv.className = `message ${type}`;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 4000);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName')?.value;
    const eventDate = document.getElementById('eventDate')?.value;
    const region = document.getElementById('region')?.value;
    const phoneNumber = document.getElementById('phoneNumber')?.value;
    
    if (!fullName || !eventDate || !region || !phoneNumber) {
        showMessage('Please fill all required fields (*)', 'error');
        return;
    }
    
    // Prepare complete data
    const eventData = {
        event_type: currentEventType,
        full_name: fullName,
        event_date: eventDate,
        registration_date: new Date().toISOString(),
        
        // Photos
        photo: currentEventType === 'marriage' ? null : uploadedPhotoBase64,
        spouse1_photo: currentEventType === 'marriage' ? spouse1PhotoBase64 : null,
        spouse2_photo: currentEventType === 'marriage' ? spouse2PhotoBase64 : null,
        
        // Personal Information
        gender: document.getElementById('gender')?.value || '',
        date_of_birth: document.getElementById('dateOfBirth')?.value || '',
        national_id: document.getElementById('nationalId')?.value || '',
        country_code: document.getElementById('countryCode')?.value || '+251',
        phone_number: phoneNumber,
        email: document.getElementById('email')?.value || '',
        
        // Address Information
        region: region,
        zone: document.getElementById('zone')?.value || '',
        woreda: document.getElementById('woreda')?.value || '',
        kebele: document.getElementById('kebele')?.value || '',
        house_number: document.getElementById('houseNumber')?.value || '',
        sub_city: document.getElementById('subCity')?.value || '',
        additional_address: document.getElementById('additionalAddress')?.value || '',
        
        // Event Information
        event_time: document.getElementById('eventTime')?.value || '',
        
        // Document Information
        document_type: document.getElementById('documentType')?.value || '',
        document_number: document.getElementById('documentNumber')?.value || ''
    };
    
    // Add event-specific data
    if (currentEventType === 'birth') {
        eventData.birth_weight = document.getElementById('birthWeight')?.value || '';
        eventData.attendant = document.getElementById('attendant')?.value || '';
        eventData.father_name = document.getElementById('fatherName')?.value || '';
        eventData.mother_name = document.getElementById('motherName')?.value || '';
    } else if (currentEventType === 'marriage') {
        eventData.spouse1_name = document.getElementById('spouse1')?.value || '';
        eventData.spouse2_name = document.getElementById('spouse2')?.value || '';
        eventData.marriage_location = document.getElementById('marriageLocation')?.value || '';
        eventData.officiant = document.getElementById('officiant')?.value || '';
        eventData.marriage_cert_number = document.getElementById('marriageCertNumber')?.value || '';
    } else if (currentEventType === 'divorce') {
        eventData.petitioner = document.getElementById('petitioner')?.value || '';
        eventData.respondent = document.getElementById('respondent')?.value || '';
        eventData.court_name = document.getElementById('courtName')?.value || '';
        eventData.decree_number = document.getElementById('decreeNumber')?.value || '';
        eventData.divorce_reason = document.getElementById('divorceReason')?.value || '';
    } else if (currentEventType === 'adoption') {
        eventData.child_name = document.getElementById('childName')?.value || '';
        eventData.child_dob = document.getElementById('childDob')?.value || '';
        eventData.adoptive_parents = document.getElementById('adoptiveParents')?.value || '';
        eventData.adoption_agency = document.getElementById('adoptionAgency')?.value || '';
    } else if (currentEventType === 'death') {
        eventData.death_place = document.getElementById('deathPlace')?.value || '';
        eventData.cause_of_death = document.getElementById('causeOfDeath')?.value || '';
        eventData.physician_name = document.getElementById('physicianName')?.value || '';
        eventData.informant_name = document.getElementById('informantName')?.value || '';
    }
    
    // Generate certificate ID
    const certId = 'UNITY-' + new Date().getFullYear() + '-' + 
                   currentEventType.substring(0, 3).toUpperCase() + '-' + 
                   Math.random().toString(36).substr(2, 8).toUpperCase();
    eventData.certificate_id = certId;
    
    // Save to localStorage
    saveToLocalStorage(eventData, certId);
    
    // Reset photos after saving
    if (currentEventType === 'marriage') {
        spouse1PhotoBase64 = null;
        spouse2PhotoBase64 = null;
    } else {
        uploadedPhotoBase64 = null;
    }
    
    // Try to save to database
    try {
        const response = await fetch(API_URL + 'save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        const result = await response.json();
        if (result.success) {
            showMessage(`✅ Registration successful! Certificate ID: ${certId}`, 'success');
        } else {
            showMessage(`✅ Registration saved locally! Certificate ID: ${certId}`, 'success');
        }
    } catch (error) {
        console.log('Database save failed:', error);
        showMessage(`✅ Registration saved locally! Certificate ID: ${certId}`, 'success');
    }
    
    // Reset form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.reset();
    
    const extraFields = document.getElementById('extraFields');
    if (extraFields) extraFields.innerHTML = '';
    
    // Ask to view dashboard
    setTimeout(() => {
        if (confirm('🎉 Registration Complete!\n\nWould you like to view your certificate in the Dashboard?')) {
            loadDashboard();
        } else {
            showHome();
        }
    }, 1500);
}

// Save to localStorage
function saveToLocalStorage(eventData, certId) {
    let events = JSON.parse(localStorage.getItem('unity_events') || '[]');
    events.unshift({
        id: certId,
        type: eventData.event_type,
        name: eventData.full_name,
        date: eventData.event_date,
        regDate: new Date().toLocaleString(),
        region: eventData.region,
        zone: eventData.zone,
        woreda: eventData.woreda,
        kebele: eventData.kebele,
        phone: eventData.phone_number,
        photo: eventData.photo,
        spouse1_photo: eventData.spouse1_photo,
        spouse2_photo: eventData.spouse2_photo,
        spouse1_name: eventData.spouse1_name,
        spouse2_name: eventData.spouse2_name,
        eventData: eventData
    });
    localStorage.setItem('unity_events', JSON.stringify(events));
}

// Load dashboard with professional design
function loadDashboard() {
    if (!document.getElementById('dashboardPage')) {
        createDashboardPage();
    }
    
    document.getElementById('homePage').style.display = 'none';
    const formPage = document.getElementById('formPage');
    const dashboardPage = document.getElementById('dashboardPage');
    if (formPage) formPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
    
    let events = JSON.parse(localStorage.getItem('unity_events') || '[]');
    
    const totalEvents = events.length;
    const eventsByType = {
        birth: events.filter(e => e.type === 'birth').length,
        marriage: events.filter(e => e.type === 'marriage').length,
        divorce: events.filter(e => e.type === 'divorce').length,
        adoption: events.filter(e => e.type === 'adoption').length,
        death: events.filter(e => e.type === 'death').length
    };
    
    if (events.length === 0) {
        document.getElementById('dashboardContent').innerHTML = `
            <div class="empty-dashboard">
                <i class="fas fa-chart-pie"></i>
                <h2 style="color: #333; margin: 20px 0;">No Events Registered Yet</h2>
                <p style="color: #666; margin-bottom: 30px;">Start by registering your first vital event</p>
                <button onclick="showHome()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-size: 1rem;">
                    <i class="fas fa-plus"></i> Register an Event
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="dashboard-stats">
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <i class="fas fa-database"></i>
                <div class="stat-number">${totalEvents}</div>
                <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <i class="fas fa-baby-carriage"></i>
                <div class="stat-number">${eventsByType.birth}</div>
                <div class="stat-label">Births</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <i class="fas fa-heart"></i>
                <div class="stat-number">${eventsByType.marriage}</div>
                <div class="stat-label">Marriages</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <i class="fas fa-dove"></i>
                <div class="stat-number">${eventsByType.death}</div>
                <div class="stat-label">Records</div>
            </div>
        </div>
        
        <div class="dashboard-table-container">
            <h3 style="margin-bottom: 20px; color: #333;">
                <i class="fas fa-list-ul"></i> Recent Registrations
            </h3>
            <div style="overflow-x: auto;">
                <table class="dashboard-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Certificate ID</th>
                            <th>Event Type</th>
                            <th>Full Name</th>
                            <th>Region</th>
                            <th>Woreda/Kebele</th>
                            <th>Event Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    events.forEach(event => {
        const eventTypeCap = event.type.charAt(0).toUpperCase() + event.type.slice(1);
        const badgeClass = event.type;
        const location = `${event.woreda || 'N/A'}/${event.kebele || 'N/A'}`;
        
        let photoHtml = '';
        if (event.type === 'marriage') {
            photoHtml = `
                <div style="display: flex; gap: 5px; align-items: center;">
                    ${event.spouse1_photo ? `<img src="${event.spouse1_photo}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` : '<i class="fas fa-male" style="font-size: 30px; color: #667eea;"></i>'}
                    <i class="fas fa-heart" style="font-size: 12px; color: #f5576c;"></i>
                    ${event.spouse2_photo ? `<img src="${event.spouse2_photo}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` : '<i class="fas fa-female" style="font-size: 30px; color: #f093fb;"></i>'}
                </div>
            `;
        } else {
            photoHtml = event.photo ? 
                `<img src="${event.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` : 
                `<i class="fas fa-user-circle" style="font-size: 40px; color: #999;"></i>`;
        }
        
        html += `
            <tr>
                <td>${photoHtml}</td>
                <td><code style="background: #f1f3f5; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${event.id.substring(0, 20)}...</code></td>
                <td><span class="event-badge ${badgeClass}">${eventTypeCap}</span></td>
                <td><strong>${escapeHtml(event.name)}</strong></td>
                <td>${event.region || 'N/A'}</td>
                <td>${location}</td>
                <td>${event.date}</td>
                <td><button class="btn-view" onclick="showProfessionalCertificate('${event.id}')"><i class="fas fa-certificate"></i> View</button></td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <div class="dashboard-actions">
                <button class="dashboard-action-btn clear" onclick="clearAllEvents()">
                    <i class="fas fa-trash-alt"></i> Clear All Records
                </button>
                <button class="dashboard-action-btn export" onclick="exportEventsToCSV()">
                    <i class="fas fa-download"></i> Export to CSV
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('dashboardContent').innerHTML = html;
}

// Show professional certificate with photos (supports dual photos for marriage)
function showProfessionalCertificate(certId) {
    let events = JSON.parse(localStorage.getItem('unity_events') || '[]');
    const event = events.find(e => e.id === certId);
    
    if (!event) return;
    
    const eventTypeCap = event.type.charAt(0).toUpperCase() + event.type.slice(1);
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let photoHtml = '';
    
    if (event.type === 'marriage') {
        const spouse1Photo = event.spouse1_photo ? 
            `<img src="${event.spouse1_photo}" class="certificate-photo-img" alt="Spouse 1 Photo">` : 
            `<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <i class="fas fa-user" style="font-size: 50px; color: white;"></i>
             </div>`;
        
        const spouse2Photo = event.spouse2_photo ? 
            `<img src="${event.spouse2_photo}" class="certificate-photo-img" alt="Spouse 2 Photo">` : 
            `<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <i class="fas fa-user" style="font-size: 50px; color: white;"></i>
             </div>`;
        
        photoHtml = `
            <div class="dual-photo-certificate">
                <div class="dual-photo-item">
                    ${spouse1Photo}
                    <h4>${escapeHtml(event.spouse1_name || 'Spouse 1')}</h4>
                </div>
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-heart" style="font-size: 40px; color: #ffd700;"></i>
                </div>
                <div class="dual-photo-item">
                    ${spouse2Photo}
                    <h4>${escapeHtml(event.spouse2_name || 'Spouse 2')}</h4>
                </div>
            </div>
        `;
    } else {
        photoHtml = `
            <div class="certificate-photo">
                ${event.photo ? 
                    `<img src="${event.photo}" class="certificate-photo-img" alt="Profile Photo">` : 
                    `<div style="width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <i class="fas fa-user" style="font-size: 60px; color: white;"></i>
                     </div>`
                }
            </div>
        `;
    }
    
    const certificateHTML = `
        <div class="certificate-header">
            <h2><i class="fas fa-certificate"></i> UNITY REGISTRY</h2>
            <p>Official Vital Event Certificate</p>
            <span class="close-modal" onclick="closeCertificate()">&times;</span>
        </div>
        <div class="certificate-body">
            ${photoHtml}
            
            <div class="certificate-seal">
                <i class="fas fa-stamp"></i>
                <i class="fas fa-shield-alt"></i>
                <i class="fas fa-check-circle"></i>
            </div>
            
            <h3 style="text-align: center; color: #667eea; margin: 20px 0;">CERTIFICATE OF ${eventTypeCap.toUpperCase()}</h3>
            
            <div class="certificate-info">
                <div class="certificate-info-row">
                    <div class="certificate-label">Certificate ID:</div>
                    <div class="certificate-value"><strong>${event.id}</strong></div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Event Type:</div>
                    <div class="certificate-value">${eventTypeCap}</div>
                </div>
                ${event.type === 'marriage' ? `
                <div class="certificate-info-row">
                    <div class="certificate-label">Spouse 1 Name:</div>
                    <div class="certificate-value">${escapeHtml(event.spouse1_name || 'N/A')}</div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Spouse 2 Name:</div>
                    <div class="certificate-value">${escapeHtml(event.spouse2_name || 'N/A')}</div>
                </div>
                ` : `
                <div class="certificate-info-row">
                    <div class="certificate-label">Full Name:</div>
                    <div class="certificate-value">${escapeHtml(event.name)}</div>
                </div>
                `}
                <div class="certificate-info-row">
                    <div class="certificate-label">Phone Number:</div>
                    <div class="certificate-value">${event.phone || 'N/A'}</div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Address:</div>
                    <div class="certificate-value">
                        Region: ${event.region || 'N/A'}<br>
                        Zone: ${event.zone || 'N/A'}<br>
                        Woreda: ${event.woreda || 'N/A'}<br>
                        Kebele: ${event.kebele || 'N/A'}
                    </div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Event Date:</div>
                    <div class="certificate-value">${eventDate}</div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Registration Date:</div>
                    <div class="certificate-value">${event.regDate}</div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Issued By:</div>
                    <div class="certificate-value">Unity Registry Government Portal</div>
                </div>
                <div class="certificate-info-row">
                    <div class="certificate-label">Digital Signature:</div>
                    <div class="certificate-value"><i class="fas fa-lock"></i> Verified | ${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 10).toUpperCase()}</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button class="print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Certificate
                </button>
            </div>
        </div>
        <div class="certificate-footer">
            <p>This is an electronically generated certificate and is valid without signature.</p>
            <p><i class="fas fa-qrcode"></i> Verify at: https://unityregistry.gov/verify/${event.id}</p>
            <p>© ${new Date().getFullYear()} Unity Registry - All Rights Reserved</p>
        </div>
    `;
    
    document.getElementById('certificateContent').innerHTML = certificateHTML;
    document.getElementById('certificateModal').style.display = 'flex';
}

// Close certificate modal
function closeCertificate() {
    document.getElementById('certificateModal').style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear all events
function clearAllEvents() {
    if (confirm('⚠️ WARNING: This will delete ALL records permanently.\n\nAre you absolutely sure?')) {
        localStorage.removeItem('unity_events');
        loadDashboard();
        alert('✅ All records have been cleared successfully');
    }
}

// Export events to CSV
function exportEventsToCSV() {
    let events = JSON.parse(localStorage.getItem('unity_events') || '[]');
    if (events.length === 0) {
        alert('No events to export');
        return;
    }
    
    let csvContent = "Certificate ID,Event Type,Full Name,Spouse 1,Spouse 2,Region,Zone,Woreda,Kebele,Phone,Event Date,Registration Date\n";
    events.forEach(event => {
        const spouse1 = event.type === 'marriage' ? (event.spouse1_name || '') : '';
        const spouse2 = event.type === 'marriage' ? (event.spouse2_name || '') : '';
        csvContent += `"${event.id}","${event.type}","${event.name}","${spouse1}","${spouse2}","${event.region || ''}","${event.zone || ''}","${event.woreda || ''}","${event.kebele || ''}","${event.phone || ''}","${event.date}","${event.regDate}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unity_registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Export completed successfully!');
}

// Make functions globally available
window.showForm = showForm;
window.showHome = showHome;
window.loadDashboard = loadDashboard;
window.showProfessionalCertificate = showProfessionalCertificate;
window.closeCertificate = closeCertificate;
window.clearAllEvents = clearAllEvents;
window.exportEventsToCSV = exportEventsToCSV;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;
window.handleSpouse1PhotoUpload = handleSpouse1PhotoUpload;
window.handleSpouse2PhotoUpload = handleSpouse2PhotoUpload;
window.removeSpouse1Photo = removeSpouse1Photo;
window.removeSpouse2Photo = removeSpouse2Photo;