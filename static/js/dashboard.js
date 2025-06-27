// Dashboard JavaScript - Social Media AI Dashboard

// Global variables
let currentView = 'dashboard';
let analyticsCharts = {};
let mockData = {};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    setupEventListeners();
    setupSchedulingEventListeners();
    setupContentGenerationWorkflow();
    initializeTheme();
    // Load dashboard data after a short delay to ensure DOM is fully ready
    setTimeout(() => {
        loadDashboardData();
        initializeCharts();
        setDefaultScheduleDateTime();
    }, 100);
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
        
        // Update sidebar navigation active state
        updateSidebarActive(viewName);
        
        // Load view-specific data
        switch(viewName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'calendario':
                loadCalendarData();
                loadUpcomingPosts();
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

function updateSidebarActive(viewName) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to the current view's nav link
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
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
    // Ensure data is valid
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid chart data:', data);
        return;
    }
    
    // If chart exists, update its data
    if (analyticsCharts.performance) {
        analyticsCharts.performance.data.datasets[0].data = data;
        analyticsCharts.performance.update('active');
    } else {
        // If chart doesn't exist, it will be created by initializeCharts
        console.log('Performance chart not initialized yet');
    }
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
    const today = new Date();
    
    let html = `
        <div class="calendar-grid">
            <div class="calendar-header">Dom</div>
            <div class="calendar-header">Lun</div>
            <div class="calendar-header">Mar</div>
            <div class="calendar-header">Mié</div>
            <div class="calendar-header">Jue</div>
            <div class="calendar-header">Vie</div>
            <div class="calendar-header">Sáb</div>
    `;
    
    // Previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `
            <div class="calendar-day other-month" data-date="${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
                <span class="calendar-day-number">${day}</span>
                <div class="day-events"></div>
            </div>
        `;
    }
    
    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;
        const todayClass = isToday ? ' today' : '';
        
        html += `
            <div class="calendar-day${todayClass}" data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}">
                <span class="calendar-day-number">${date}</span>
                <div class="day-events"></div>
            </div>
        `;
    }
    
    // Next month days to fill the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let date = 1; date <= remainingCells; date++) {
        html += `
            <div class="calendar-day other-month" data-date="${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}">
                <span class="calendar-day-number">${date}</span>
                <div class="day-events"></div>
            </div>
        `;
    }
    
    html += '</div>';
    
    const calendarContainer = document.getElementById('calendar-container');
    if (calendarContainer) {
        calendarContainer.innerHTML = html;
    }
}

function addCalendarEvents(posts) {
    posts.forEach(post => {
        const postDate = new Date(post.scheduled_date).toISOString().split('T')[0];
        const dayElement = document.querySelector(`[data-date="${postDate}"] .day-events`);
        
        if (dayElement) {
            const eventElement = document.createElement('div');
            eventElement.className = `calendar-event ${post.platform}`;
            eventElement.innerHTML = post.title.length > 15 ? post.title.substring(0, 15) + '...' : post.title;
            eventElement.title = `${post.title} - ${formatTime(post.scheduled_date)}`;
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                editPost(post.id);
            });
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
        const fullContent = `${platformContent.content}\n\n${platformContent.hashtags.join(' ')}`;
        
        html += `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="tab-${platform}">
                <div class="card">
                    <div class="card-header">
                        <i class="fab fa-${platform} me-2"></i>
                        Vista previa para ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </div>
                    <div class="card-body">
                        <div class="generated-text mb-3">
                            <p>${platformContent.content}</p>
                        </div>
                        <div class="hashtags mb-3">
                            <strong>Hashtags:</strong> 
                            <span class="text-muted">${platformContent.hashtags.join(' ')}</span>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary" onclick="scheduleGeneratedContent('${platform}', \`${platformContent.content}\`, '${platformContent.hashtags.join(' ')}')">
                                <i class="fas fa-calendar-plus me-1"></i>Programar Publicación
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editGeneratedContent('${platform}', \`${platformContent.content}\`, '${platformContent.hashtags.join(' ')}')">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                            <button class="btn btn-outline-warning" onclick="copyToClipboard(\`${fullContent}\`)">
                                <i class="fas fa-copy me-1"></i>Copiar
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
    // Get current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = currentTheme === 'dark';
    
    // Set theme-appropriate colors
    const textColor = isDark ? '#9ca3af' : '#718096';
    const gridColor = isDark ? '#374151' : '#e2e8f0';
    const accentColor = isDark ? '#3b82f6' : '#ff6b47';
    const bgColor = isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 107, 71, 0.1)';
    const tooltipBg = isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipText = isDark ? '#ffffff' : '#2d3748';
    
    // Set Chart.js defaults
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.backgroundColor = bgColor;
    
    // Initialize performance chart with empty data first
    const performanceCanvas = document.getElementById('performanceChart');
    if (performanceCanvas) {
        const ctx = performanceCanvas.getContext('2d');
        analyticsCharts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Interacciones',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: accentColor,
                    backgroundColor: bgColor,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: accentColor,
                    pointBorderColor: isDark ? '#ffffff' : '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipText,
                        bodyColor: tooltipText,
                        borderColor: accentColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            padding: 10
                        }
                    },
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            padding: 10
                        }
                    }
                }
            }
        });
    }
}

// Theme Management
function initializeTheme() {
    // Get saved theme preference or default to dark
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Apply saved theme
    setTheme(savedTheme);
    
    // Set up theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('dashboard-theme', newTheme);
        });
    }
}

function setTheme(theme) {
    const themeIcon = document.getElementById('themeIcon');
    
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }
    
    // Update charts with new theme colors
    updateChartsTheme(theme);
}

function updateChartsTheme(theme) {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#718096';
    const gridColor = isDark ? '#374151' : '#e2e8f0';
    const accentColor = isDark ? '#3b82f6' : '#ff6b47';
    
    // Update Chart.js defaults
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // Update existing charts
    Object.keys(analyticsCharts).forEach(chartKey => {
        const chart = analyticsCharts[chartKey];
        if (chart && chart.options) {
            // Update scales colors
            if (chart.options.scales) {
                if (chart.options.scales.y) {
                    chart.options.scales.y.grid.color = gridColor;
                    chart.options.scales.y.ticks.color = textColor;
                }
                if (chart.options.scales.x) {
                    chart.options.scales.x.grid.color = gridColor;
                    chart.options.scales.x.ticks.color = textColor;
                }
            }
            
            // Update dataset colors for certain charts
            if (chart.data && chart.data.datasets) {
                chart.data.datasets.forEach(dataset => {
                    if (dataset.borderColor === '#3b82f6' || dataset.borderColor === '#ff6b47') {
                        dataset.borderColor = accentColor;
                    }
                    if (dataset.backgroundColor && (
                        dataset.backgroundColor === 'rgba(59, 130, 246, 0.1)' || 
                        dataset.backgroundColor === 'rgba(255, 107, 71, 0.1)'
                    )) {
                        dataset.backgroundColor = isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 107, 71, 0.1)';
                    }
                    if (dataset.pointBackgroundColor === '#3b82f6' || dataset.pointBackgroundColor === '#ff6b47') {
                        dataset.pointBackgroundColor = accentColor;
                    }
                });
            }
            
            chart.update('none');
        }
    });
}

// Real-time Scheduling Functionality
let currentCalendarDate = new Date();
let currentEditingPostId = null;
let scheduledPosts = [];

// Setup scheduling event listeners
function setupSchedulingEventListeners() {
    // Schedule new post modal
    const saveButton = document.getElementById('saveScheduledPost');
    if (saveButton) {
        saveButton.addEventListener('click', handleSchedulePost);
    }
    
    // Edit post modal
    const updateButton = document.getElementById('updateScheduledPost');
    if (updateButton) {
        updateButton.addEventListener('click', handleUpdatePost);
    }
    
    const deleteButton = document.getElementById('deleteScheduledPost');
    if (deleteButton) {
        deleteButton.addEventListener('click', handleDeletePost);
    }
    
    // Calendar navigation
    const prevButton = document.getElementById('prev-month');
    if (prevButton) {
        prevButton.addEventListener('click', () => navigateCalendar(-1));
    }
    
    const nextButton = document.getElementById('next-month');
    if (nextButton) {
        nextButton.addEventListener('click', () => navigateCalendar(1));
    }
    
    // Modal events
    const scheduleModal = document.getElementById('scheduleModal');
    if (scheduleModal) {
        scheduleModal.addEventListener('show.bs.modal', setDefaultScheduleDateTime);
    }
}

// Set default date and time for scheduling
function setDefaultScheduleDateTime() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const dateInput = document.getElementById('postDate');
    const timeInput = document.getElementById('postTime');
    
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        timeInput.value = '10:00';
    }
}

// Handle scheduling a new post
async function handleSchedulePost() {
    try {
        const formData = {
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value,
            platform: document.getElementById('postPlatform').value,
            scheduled_date: `${document.getElementById('postDate').value}T${document.getElementById('postTime').value}:00`,
            timezone: document.getElementById('postTimezone').value
        };
        
        // Validate form
        if (!formData.title || !formData.content || !formData.platform || !formData.scheduled_date) {
            showErrorMessage('Por favor completa todos los campos requeridos');
            return;
        }
        
        const response = await fetchData('/api/posts/schedule', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response.status === 'success') {
            showSuccessMessage('Publicación programada exitosamente');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
            modal.hide();
            document.getElementById('scheduleForm').reset();
            
            // Refresh calendar and upcoming posts
            loadCalendarData();
            loadUpcomingPosts();
            
            // Update dashboard if on dashboard view
            if (currentView === 'dashboard') {
                loadDashboardData();
            }
        }
    } catch (error) {
        showErrorMessage('Error al programar la publicación: ' + error.message);
    }
}

// Handle updating an existing post
async function handleUpdatePost() {
    try {
        const postId = document.getElementById('editPostId').value;
        const formData = {
            title: document.getElementById('editPostTitle').value,
            content: document.getElementById('editPostContent').value,
            platform: document.getElementById('editPostPlatform').value,
            scheduled_date: `${document.getElementById('editPostDate').value}T${document.getElementById('editPostTime').value}:00`
        };
        
        const response = await fetchData(`/api/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (response.status === 'success') {
            showSuccessMessage('Publicación actualizada exitosamente');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPostModal'));
            modal.hide();
            
            // Refresh views
            loadCalendarData();
            loadUpcomingPosts();
        }
    } catch (error) {
        showErrorMessage('Error al actualizar la publicación: ' + error.message);
    }
}

// Handle deleting a post
async function handleDeletePost() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
        return;
    }
    
    try {
        const postId = document.getElementById('editPostId').value;
        
        const response = await fetchData(`/api/posts/${postId}`, {
            method: 'DELETE'
        });
        
        if (response.status === 'success') {
            showSuccessMessage('Publicación eliminada exitosamente');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPostModal'));
            modal.hide();
            
            // Refresh views
            loadCalendarData();
            loadUpcomingPosts();
        }
    } catch (error) {
        showErrorMessage('Error al eliminar la publicación: ' + error.message);
    }
}

// Enhanced calendar loading with real data
async function loadCalendarData() {
    try {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth() + 1;
        
        // Update calendar title
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const calendarTitle = document.getElementById('calendar-title');
        if (calendarTitle) {
            calendarTitle.textContent = `${months[month - 1]} ${year}`;
        }
        
        // Load posts for the month
        const calendarData = await fetchData(`/api/posts/calendar/${year}/${month}`);
        scheduledPosts = calendarData.posts || [];
        
        // Generate calendar HTML
        generateCalendarHTML(year, month);
        
        // Add events to calendar
        addCalendarEvents(scheduledPosts);
        
        // Update statistics
        updateCalendarStats();
        
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showErrorMessage('Error al cargar el calendario');
    }
}

// Load upcoming posts
async function loadUpcomingPosts() {
    try {
        const upcomingPosts = await fetchData('/api/posts/upcoming');
        displayUpcomingPosts(upcomingPosts);
    } catch (error) {
        console.error('Error loading upcoming posts:', error);
    }
}

// Display upcoming posts in sidebar
function displayUpcomingPosts(posts) {
    const container = document.getElementById('upcoming-posts');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-alt fa-2x mb-2"></i>
                <p>No hay publicaciones próximas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => {
        const date = new Date(post.scheduled_date);
        const platformIcon = getPlatformIcon(post.platform);
        
        return `
            <div class="upcoming-post-item mb-3 p-2 border rounded cursor-pointer" onclick="editPost(${post.id})">
                <div class="d-flex align-items-center mb-1">
                    <i class="${platformIcon} platform-${post.platform} me-2"></i>
                    <small class="text-muted">${formatDate(post.scheduled_date)} - ${formatTime(post.scheduled_date)}</small>
                </div>
                <div class="fw-bold text-truncate">${post.title}</div>
                <div class="text-muted small text-truncate">${post.content}</div>
            </div>
        `;
    }).join('');
}

// Navigate calendar months
function navigateCalendar(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    loadCalendarData();
}

// Edit post function
function editPost(postId) {
    // Find the post
    const post = scheduledPosts.find(p => p.id === postId);
    if (!post) return;
    
    // Populate edit form
    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostTitle').value = post.title;
    document.getElementById('editPostContent').value = post.content;
    document.getElementById('editPostPlatform').value = post.platform;
    
    const dateTime = new Date(post.scheduled_date);
    document.getElementById('editPostDate').value = dateTime.toISOString().split('T')[0];
    document.getElementById('editPostTime').value = dateTime.toTimeString().slice(0, 5);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editPostModal'));
    modal.show();
}

// Update calendar statistics
function updateCalendarStats() {
    const scheduled = scheduledPosts.filter(p => p.status === 'scheduled').length;
    const sent = scheduledPosts.filter(p => p.status === 'sent').length;
    const pending = scheduledPosts.filter(p => p.status === 'pending').length;
    
    const scheduledCount = document.getElementById('scheduled-count');
    const sentCount = document.getElementById('sent-count');
    const pendingCount = document.getElementById('pending-count');
    
    if (scheduledCount) scheduledCount.textContent = scheduled;
    if (sentCount) sentCount.textContent = sent;
    if (pendingCount) pendingCount.textContent = pending;
}

// Get platform icon
function getPlatformIcon(platform) {
    const icons = {
        linkedin: 'fab fa-linkedin',
        twitter: 'fab fa-twitter',
        instagram: 'fab fa-instagram',
        facebook: 'fab fa-facebook'
    };
    return icons[platform] || 'fas fa-globe';
}

// Content-to-Scheduling Integration Functions
function scheduleGeneratedContent(platform, content, hashtags) {
    // Create a title from the first part of the content
    const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
    const fullContent = `${content}\n\n${hashtags}`;
    
    // Pre-populate the scheduling modal
    document.getElementById('postTitle').value = title;
    document.getElementById('postContent').value = fullContent;
    document.getElementById('postPlatform').value = platform;
    
    // Set default scheduling time (tomorrow at 10 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('postDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('postTime').value = '10:00';
    
    // Show the scheduling modal
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    modal.show();
    
    showSuccessMessage('Contenido listo para programar');
}

function editGeneratedContent(platform, content, hashtags) {
    // Create an editable version of the content
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Contenido - ${platform.charAt(0).toUpperCase() + platform.slice(1)}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Contenido</label>
                        <textarea class="form-control" id="editContent" rows="4">${content}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Hashtags</label>
                        <input type="text" class="form-control" id="editHashtags" value="${hashtags}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="saveEditedContent('${platform}')">
                        <i class="fas fa-save me-1"></i>Guardar y Continuar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const editModal = new bootstrap.Modal(modal);
    editModal.show();
    
    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function saveEditedContent(platform) {
    const editedContent = document.getElementById('editContent').value;
    const editedHashtags = document.getElementById('editHashtags').value;
    
    // Close edit modal
    const editModal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
    editModal.hide();
    
    // Update the display with edited content
    setTimeout(() => {
        const activeTab = document.querySelector(`#tab-${platform}`);
        if (activeTab) {
            const contentDiv = activeTab.querySelector('.generated-text p');
            const hashtagsSpan = activeTab.querySelector('.hashtags .text-muted');
            
            if (contentDiv) contentDiv.textContent = editedContent;
            if (hashtagsSpan) hashtagsSpan.textContent = editedHashtags;
            
            // Update the scheduling button with new content
            const scheduleBtn = activeTab.querySelector('.btn-primary');
            if (scheduleBtn) {
                scheduleBtn.setAttribute('onclick', `scheduleGeneratedContent('${platform}', \`${editedContent}\`, '${editedHashtags}')`);
            }
        }
        
        showSuccessMessage('Contenido actualizado exitosamente');
    }, 300);
}

function copyToClipboard(content) {
    navigator.clipboard.writeText(content).then(() => {
        showSuccessMessage('Contenido copiado al portapapeles');
    }).catch(err => {
        showErrorMessage('Error al copiar contenido');
    });
}

// Enhanced content generation workflow
function setupContentGenerationWorkflow() {
    // Add event listeners for validation actions
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-success[onclick*="approvePost"]')) {
            const postId = e.target.closest('[onclick*="approvePost"]').getAttribute('onclick').match(/\d+/)[0];
            approveAndSchedulePost(postId);
        }
    });
}

async function approveAndSchedulePost(postId) {
    try {
        // First approve the post
        const response = await fetchData(`/api/posts/approve/${postId}`, {
            method: 'POST'
        });
        
        if (response.status === 'approved') {
            // Find the post in pending posts to get its content
            const pendingPosts = await fetchData('/api/posts/pending');
            const post = pendingPosts.find(p => p.id == postId);
            
            if (post) {
                // Pre-populate scheduling modal with approved content
                document.getElementById('postTitle').value = post.title;
                document.getElementById('postContent').value = post.content;
                document.getElementById('postPlatform').value = post.platform;
                
                // Set default scheduling time
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.getElementById('postDate').value = tomorrow.toISOString().split('T')[0];
                document.getElementById('postTime').value = '10:00';
                
                // Show scheduling modal
                const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
                modal.show();
                
                showSuccessMessage('Post aprobado - Listo para programar');
                
                // Refresh validation view
                loadValidationData();
            }
        }
    } catch (error) {
        showErrorMessage('Error al aprobar el post: ' + error.message);
    }
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
    
    .upcoming-post-item {
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .upcoming-post-item:hover {
        background-color: var(--hover-bg);
        transform: translateY(-1px);
    }
    
    .calendar-day {
        position: relative;
        min-height: 100px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .calendar-day:hover {
        background-color: var(--hover-bg);
    }
    
    .calendar-event {
        font-size: 0.75rem;
        padding: 1px 4px;
        margin: 1px 0;
        border-radius: 2px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .calendar-event.linkedin { background-color: #0077b5; color: white; }
    .calendar-event.twitter { background-color: #1da1f2; color: white; }
    .calendar-event.instagram { background-color: #e4405f; color: white; }
    .calendar-event.facebook { background-color: #1877f2; color: white; }
    
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
