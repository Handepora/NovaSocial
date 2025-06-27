// Dashboard JavaScript - Social Media AI Dashboard

// Global variables
let currentView = 'dashboard';
let analyticsCharts = {};
let mockData = {};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboardData();
    initializeCharts();
    setupEventListeners();
});

// Navigation Management
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            showView(view);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewName + '-view');
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
        
        // Load view-specific data
        switch(viewName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'calendario':
                loadCalendarData();
                break;
            case 'validacion':
                loadValidationData();
                break;
            case 'analiticas':
                loadAnalyticsData();
                break;
        }
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Load today's posts
        const todayPosts = await fetchData('/api/posts/today');
        updateTodayPosts(todayPosts);
        
        // Load pending posts count
        const pendingPosts = await fetchData('/api/posts/pending');
        updatePendingCount(pendingPosts.length);
        
        // Load analytics for performance chart
        const analytics = await fetchData('/api/analytics');
        updatePerformanceChart(analytics.weekly_interactions);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage('Error al cargar los datos del dashboard');
    }
}

function updateTodayPosts(posts) {
    const countElement = document.getElementById('today-posts-count');
    const listElement = document.getElementById('today-posts-list');
    
    countElement.textContent = posts.length;
    
    if (posts.length === 0) {
        listElement.innerHTML = '<p class="text-muted small">No hay publicaciones programadas para hoy</p>';
        return;
    }
    
    listElement.innerHTML = posts.map(post => `
        <div class="post-item mb-2">
            <div class="d-flex align-items-center">
                <i class="fab fa-${post.platform} platform-${post.platform} me-2"></i>
                <div class="flex-grow-1">
                    <div class="small fw-medium">${post.title}</div>
                    <div class="text-muted small">${formatTime(post.scheduled_date)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePendingCount(count) {
    const countElement = document.getElementById('pending-posts-count');
    countElement.textContent = count;
}

function updatePerformanceChart(data) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (analyticsCharts.performance) {
        analyticsCharts.performance.destroy();
    }
    
    analyticsCharts.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Interacciones',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

// Calendar Management
function loadCalendarData() {
    const calendarContainer = document.getElementById('calendar-container');
    
    // Simple calendar implementation
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    calendarContainer.innerHTML = generateCalendarHTML(currentYear, currentMonth);
    
    // Add calendar events
    fetchData('/api/posts').then(posts => {
        addCalendarEvents(posts);
    });
}

function generateCalendarHTML(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let html = `
        <div class="calendar-header mb-3">
            <h4>${monthNames[month]} ${year}</h4>
        </div>
        <div class="calendar-grid">
            <div class="row">
                <div class="col text-center fw-bold">Dom</div>
                <div class="col text-center fw-bold">Lun</div>
                <div class="col text-center fw-bold">Mar</div>
                <div class="col text-center fw-bold">Mié</div>
                <div class="col text-center fw-bold">Jue</div>
                <div class="col text-center fw-bold">Vie</div>
                <div class="col text-center fw-bold">Sáb</div>
            </div>
    `;
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        html += '<div class="row">';
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                html += '<div class="col calendar-day"></div>';
            } else if (date > daysInMonth) {
                html += '<div class="col calendar-day"></div>';
            } else {
                html += `<div class="col calendar-day" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}">
                    <div class="day-number">${date}</div>
                    <div class="day-events"></div>
                </div>`;
                date++;
            }
        }
        html += '</div>';
        if (date > daysInMonth) break;
    }
    
    html += '</div>';
    return html;
}

function addCalendarEvents(posts) {
    posts.forEach(post => {
        const postDate = new Date(post.scheduled_date).toISOString().split('T')[0];
        const dayElement = document.querySelector(`[data-date="${postDate}"] .day-events`);
        
        if (dayElement) {
            const eventElement = document.createElement('div');
            eventElement.className = `calendar-post ${post.platform}`;
            eventElement.innerHTML = `
                <i class="fab fa-${post.platform} me-1"></i>
                <span class="small">${post.title.substring(0, 20)}...</span>
            `;
            eventElement.addEventListener('click', () => showPostDetails(post));
            dayElement.appendChild(eventElement);
        }
    });
}

// Content Creation
function setupEventListeners() {
    // Quick create form
    const quickCreateForm = document.getElementById('quick-create-form');
    if (quickCreateForm) {
        quickCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const topic = document.getElementById('quick-topic').value;
            if (topic) {
                // Switch to create content view and populate form
                showView('crear-contenido');
                document.getElementById('main-topic').value = topic;
            }
        });
    }
    
    // Content creation form
    const contentForm = document.getElementById('content-creation-form');
    if (contentForm) {
        contentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateContent();
        });
    }
}

async function generateContent() {
    const topic = document.getElementById('main-topic').value;
    const tone = document.getElementById('tone-voice').value;
    const platforms = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    if (!topic || platforms.length === 0) {
        showErrorMessage('Por favor completa el tema y selecciona al menos una plataforma');
        return;
    }
    
    const resultContainer = document.getElementById('generated-content');
    resultContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p class="mt-2">Generando contenido...</p></div>';
    
    try {
        const generatedContent = await fetchData('/api/posts/generate', {
            method: 'POST',
            body: JSON.stringify({ topic, tone, platforms })
        });
        
        displayGeneratedContent(generatedContent, platforms);
        
    } catch (error) {
        console.error('Error generating content:', error);
        showErrorMessage('Error al generar contenido');
    }
}

function displayGeneratedContent(content, platforms) {
    const resultContainer = document.getElementById('generated-content');
    
    let html = '<ul class="nav nav-tabs mb-3">';
    platforms.forEach((platform, index) => {
        html += `<li class="nav-item">
            <a class="nav-link ${index === 0 ? 'active' : ''}" data-bs-toggle="tab" href="#tab-${platform}">
                <i class="fab fa-${platform} me-2"></i>${platform.charAt(0).toUpperCase() + platform.slice(1)}
            </a>
        </li>`;
    });
    html += '</ul>';
    
    html += '<div class="tab-content">';
    platforms.forEach((platform, index) => {
        const platformContent = content[platform];
        html += `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="tab-${platform}">
                <div class="card">
                    <div class="card-header">
                        <i class="fab fa-${platform} me-2"></i>
                        Vista previa para ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </div>
                    <div class="card-body">
                        <p>${platformContent.content}</p>
                        <div class="mt-3">
                            <strong>Hashtags:</strong> ${platformContent.hashtags.join(' ')}
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-success me-2">
                                <i class="fas fa-check me-1"></i>Aprobar y Programar
                            </button>
                            <button class="btn btn-outline-primary me-2">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                            <button class="btn btn-outline-danger">
                                <i class="fas fa-trash me-1"></i>Descartar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    resultContainer.innerHTML = html;
}

// Validation Management
async function loadValidationData() {
    try {
        const pendingPosts = await fetchData('/api/posts/pending');
        displayPendingPosts(pendingPosts);
    } catch (error) {
        console.error('Error loading validation data:', error);
        showErrorMessage('Error al cargar los datos de validación');
    }
}

function displayPendingPosts(posts) {
    const container = document.getElementById('pending-approval-list');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-check-circle fa-2x mb-2"></i>
                <p>No hay posts pendientes de aprobación</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post.id}">
            <div class="d-flex align-items-start">
                <i class="fab fa-${post.platform} platform-${post.platform} platform-icon"></i>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${post.title}</h6>
                    <div class="post-content">${post.content}</div>
                    <div class="post-meta">Creado: ${formatDate(post.created_date)}</div>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-success btn-sm me-2" onclick="approvePost(${post.id})">
                    <i class="fas fa-check me-1"></i>Aprobar
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectPost(${post.id})">
                    <i class="fas fa-times me-1"></i>Rechazar
                </button>
            </div>
        </div>
    `).join('');
}

async function approvePost(postId) {
    try {
        await fetchData(`/api/posts/approve/${postId}`, { method: 'POST' });
        
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        postCard.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            postCard.remove();
            // Reload validation data
            loadValidationData();
        }, 300);
        
        showSuccessMessage('Post aprobado correctamente');
        
    } catch (error) {
        console.error('Error approving post:', error);
        showErrorMessage('Error al aprobar el post');
    }
}

async function rejectPost(postId) {
    try {
        await fetchData(`/api/posts/reject/${postId}`, { method: 'POST' });
        
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        const rejectedContainer = document.getElementById('rejected-list');
        
        // Move to rejected column
        postCard.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            rejectedContainer.appendChild(postCard);
            postCard.style.animation = 'slideIn 0.3s ease';
        }, 300);
        
        showSuccessMessage('Post rechazado');
        
    } catch (error) {
        console.error('Error rejecting post:', error);
        showErrorMessage('Error al rechazar el post');
    }
}

// Analytics Management
async function loadAnalyticsData() {
    try {
        const analytics = await fetchData('/api/analytics');
        updateFollowersChart(analytics.followers_growth);
        updateEngagementChart(analytics.engagement_rates);
        updateTopPostsTable();
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showErrorMessage('Error al cargar los datos de analíticas');
    }
}

function updateFollowersChart(data) {
    const ctx = document.getElementById('followersChart').getContext('2d');
    
    if (analyticsCharts.followers) {
        analyticsCharts.followers.destroy();
    }
    
    analyticsCharts.followers = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => formatDate(d.date)),
            datasets: [
                {
                    label: 'LinkedIn',
                    data: data.map(d => d.linkedin),
                    borderColor: '#0077b5',
                    backgroundColor: 'rgba(0, 119, 181, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Twitter',
                    data: data.map(d => d.twitter),
                    borderColor: '#1da1f2',
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Instagram',
                    data: data.map(d => d.instagram),
                    borderColor: '#e4405f',
                    backgroundColor: 'rgba(228, 64, 95, 0.1)',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#9ca3af'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function updateEngagementChart(data) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    if (analyticsCharts.engagement) {
        analyticsCharts.engagement.destroy();
    }
    
    analyticsCharts.engagement = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['LinkedIn', 'Twitter', 'Instagram'],
            datasets: [{
                label: 'Tasa de Interacción (%)',
                data: [data.linkedin, data.twitter, data.instagram],
                backgroundColor: ['#0077b5', '#1da1f2', '#e4405f'],
                borderColor: ['#0077b5', '#1da1f2', '#e4405f'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        color: '#374151'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}

function updateTopPostsTable() {
    const tableBody = document.getElementById('top-posts-table');
    
    // Mock top posts data
    const topPosts = [
        { title: 'Anuncio de nuevo producto innovador', platform: 'linkedin', interactions: 245, reach: 1250 },
        { title: 'Behind the scenes de nuestro equipo', platform: 'instagram', interactions: 312, reach: 1580 },
        { title: 'Tips para mejorar productividad', platform: 'twitter', interactions: 189, reach: 890 },
        { title: 'Reflexiones sobre el futuro del trabajo', platform: 'linkedin', interactions: 156, reach: 780 },
        { title: 'Celebrando logros del trimestre', platform: 'twitter', interactions: 134, reach: 650 }
    ];
    
    tableBody.innerHTML = topPosts.map(post => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <i class="fab fa-${post.platform} platform-${post.platform} me-2"></i>
                    ${post.title}
                </div>
            </td>
            <td>${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</td>
            <td>${post.interactions}</td>
            <td>${post.reach.toLocaleString()}</td>
        </tr>
    `).join('');
}

// Utility Functions
async function fetchData(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSuccessMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
    toast.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showErrorMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showPostDetails(post) {
    const modal = new bootstrap.Modal(document.getElementById('postDetailModal'));
    const contentDiv = document.getElementById('post-detail-content');
    
    contentDiv.innerHTML = `
        <div class="row">
            <div class="col-md-12">
                <div class="d-flex align-items-center mb-3">
                    <i class="fab fa-${post.platform} platform-${post.platform} me-2" style="font-size: 1.5rem;"></i>
                    <h5 class="mb-0">${post.title}</h5>
                </div>
                <div class="mb-3">
                    <strong>Contenido:</strong>
                    <p class="mt-2">${post.content}</p>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <strong>Fecha programada:</strong>
                        <p>${formatDate(post.scheduled_date)} a las ${formatTime(post.scheduled_date)}</p>
                    </div>
                    <div class="col-md-6">
                        <strong>Estado:</strong>
                        <span class="badge bg-${post.status === 'scheduled' ? 'success' : 'warning'}">${post.status}</span>
                    </div>
                </div>
                ${post.engagement !== undefined ? `
                <div class="row mt-3">
                    <div class="col-md-6">
                        <strong>Interacciones:</strong>
                        <p>${post.engagement}</p>
                    </div>
                    <div class="col-md-6">
                        <strong>Alcance:</strong>
                        <p>${post.reach.toLocaleString()}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.show();
}

function initializeCharts() {
    // Set Chart.js defaults for dark theme
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.borderColor = '#374151';
    Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.1)';
}

// Add CSS for toast notifications
const toastStyles = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--secondary-bg);
        color: var(--text-primary);
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        transform: translateX(400px);
        transition: all 0.3s ease;
        border-left: 4px solid var(--accent-color);
    }
    
    .toast-notification.success {
        border-left-color: var(--success-color);
    }
    
    .toast-notification.error {
        border-left-color: var(--danger-color);
    }
    
    .toast-notification.show {
        transform: translateX(0);
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
    
    .calendar-day {
        min-height: 100px;
        border: 1px solid var(--border-color);
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    
    .calendar-day:hover {
        background-color: rgba(59, 130, 246, 0.1);
    }
    
    .day-number {
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .day-events {
        max-height: 70px;
        overflow-y: auto;
    }
`;

// Inject toast styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);
