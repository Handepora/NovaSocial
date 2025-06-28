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
    setupAccountManagement();
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
    const currentActiveView = document.querySelector('.view.active');
    const targetView = document.getElementById(viewName + '-view');
    
    if (!targetView || currentView === viewName) return;
    
    // Simple and clean transition
    if (currentActiveView) {
        currentActiveView.classList.remove('active');
    }
    
    targetView.classList.add('active');
    currentView = viewName;
    
    // Update sidebar navigation active state
    updateSidebarActive(viewName);
    
    // Load view-specific data immediately
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
        case 'configuracion':
            loadConfigurationData();
            break;
        case 'monitoreo':
            loadMonitoringData();
            break;
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset card animations when view changes
function resetCardAnimations() {
    const cards = document.querySelectorAll('.dashboard-card, .content-section');
    cards.forEach(card => {
        card.style.animation = 'none';
        card.offsetHeight; // Trigger reflow
        card.style.animation = '';
    });
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
    const platforms = Array.from(document.querySelectorAll('#content-creation-form input[type="checkbox"]:checked')).map(cb => cb.value);
    const provider = document.getElementById('ai-provider')?.value || 'perplexity';
    
    if (!topic || platforms.length === 0) {
        showErrorMessage('Por favor completa el tema y selecciona al menos una plataforma');
        return;
    }
    
    const resultContainer = document.getElementById('generated-content');
    resultContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p class="mt-2">Generando contenido...</p></div>';
    
    try {
        console.log('Generating content with:', { topic, tone, platforms, provider });
        
        const response = await fetchData('/api/generate-content', {
            method: 'POST',
            body: JSON.stringify({ 
                topic: topic, 
                platforms: platforms,
                provider: provider
            })
        });
        
        console.log('Generation response:', response);
        
        if (response && response.status === 'success') {
            // Transform the response to match displayGeneratedContent expected format
            const transformedContent = {};
            platforms.forEach(platform => {
                transformedContent[platform] = {
                    content: response.content[platform] || '',
                    hashtags: response.hashtags[platform] || []
                };
            });
            displayGeneratedContent(transformedContent, platforms);
            showSuccessMessage('Contenido generado exitosamente');
        } else if (response && response.status === 'error') {
            if (response.requires_setup) {
                showErrorMessage(`${response.error}. Configura las API keys en la sección de Configuración.`);
            } else {
                showErrorMessage(response.error || 'Error al generar contenido');
            }
        } else if (response && response.error) {
            showErrorMessage(response.error);
        } else {
            showErrorMessage('Respuesta inesperada del servidor');
        }
        
    } catch (error) {
        console.error('Error generating content:', error);
        showErrorMessage('Error al generar contenido: ' + (error.message || 'Error desconocido'));
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
                            <button class="btn btn-success" onclick="publishNow('${platform}', \`${platformContent.content}\`, '${platformContent.hashtags.join(' ')}')">
                                <i class="fas fa-rocket me-1"></i>Publicar Ahora
                            </button>
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
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        
        if (!response.ok) {
            // Return the error data from the server if available
            throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
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
    // Get current time in Madrid timezone
    const now = new Date();
    const madridTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    const tomorrow = new Date(madridTime.getTime() + 24 * 60 * 60 * 1000);
    
    const dateInput = document.getElementById('postDate');
    const timeInput = document.getElementById('postTime');
    const timezoneInput = document.getElementById('postTimezone');
    
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        timeInput.value = '10:00';
    }
    
    // Set Madrid as default timezone
    if (timezoneInput) {
        timezoneInput.value = 'Europe/Madrid';
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
    
    // Set default scheduling time (tomorrow at 10 AM Madrid time)
    const now = new Date();
    const madridTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    const tomorrow = new Date(madridTime.getTime() + 24 * 60 * 60 * 1000);
    document.getElementById('postDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('postTime').value = '10:00';
    document.getElementById('postTimezone').value = 'Europe/Madrid';
    
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

// Social Media Account Management
async function loadConfigurationData() {
    try {
        await Promise.all([
            loadSocialAccounts(),
            loadAccountStats(),
            loadAIProviders(),
            loadAIProviderStats(),
            loadPromptSettings()
        ]);
    } catch (error) {
        console.error('Error loading configuration data:', error);
        showErrorMessage('Error al cargar la configuración');
    }
}

async function loadSocialAccounts() {
    try {
        const accounts = await fetchData('/api/accounts');
        mockData.social_accounts = accounts; // Store accounts for later use
        displaySocialAccounts(accounts);
    } catch (error) {
        console.error('Error loading social accounts:', error);
    }
}

async function loadAccountStats() {
    try {
        const stats = await fetchData('/api/accounts/stats');
        updateAccountStats(stats);
    } catch (error) {
        console.error('Error loading account stats:', error);
    }
}

function displaySocialAccounts(accounts) {
    const container = document.getElementById('social-accounts-list');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-users fa-3x mb-3"></i>
                <h6>No hay cuentas configuradas</h6>
                <p>Agrega tu primera cuenta de red social para empezar a publicar</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addAccountModal">
                    <i class="fas fa-plus me-1"></i>Agregar Primera Cuenta
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = accounts.map(account => {
        const statusBadge = getStatusBadge(account.status);
        const platformIcon = getPlatformIcon(account.platform);
        
        return `
            <div class="account-card mb-3 p-3 border rounded" data-account-id="${account.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <i class="${platformIcon} platform-${account.platform} me-3 fa-2x"></i>
                        <div>
                            <h6 class="mb-1">${account.display_name}</h6>
                            <div class="text-muted small">
                                ${account.account_name}
                                ${account.is_default ? '<span class="badge bg-primary ms-2">Predeterminada</span>' : ''}
                            </div>
                            <div class="text-muted small mt-1">
                                Conectada: ${formatDate(account.connected_date)}
                            </div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        ${statusBadge}
                        <div class="btn-group btn-group-sm">
                            ${account.status === 'connected' ? 
                                `<button class="btn btn-outline-success" onclick="testConnection(${account.id})" title="Probar conexión">
                                    <i class="fas fa-wifi"></i>
                                </button>` : 
                                `<button class="btn btn-outline-warning" onclick="testConnection(${account.id})" title="Conectar">
                                    <i class="fas fa-link"></i>
                                </button>`
                            }
                            <button class="btn btn-outline-primary" onclick="editAccount(${account.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteAccount(${account.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mt-2">
                    <div class="d-flex gap-3 text-small">
                        <span>
                            <i class="fas fa-robot me-1"></i>
                            Auto-posting: ${account.auto_posting ? 
                                '<span class="text-success">Habilitado</span>' : 
                                '<span class="text-muted">Deshabilitado</span>'
                            }
                        </span>
                        <span>
                            <i class="fas fa-key me-1"></i>
                            API: ${account.has_api ? 
                                '<span class="text-success">Configurada</span>' : 
                                '<span class="text-warning">Sin configurar</span>'
                            }
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        connected: '<span class="badge bg-success">Conectada</span>',
        pending: '<span class="badge bg-warning">Pendiente</span>',
        error: '<span class="badge bg-danger">Error</span>',
        disconnected: '<span class="badge bg-secondary">Desconectada</span>'
    };
    return badges[status] || badges.pending;
}

function updateAccountStats(stats) {
    const elements = {
        'connected-accounts': stats.connected,
        'pending-accounts': stats.pending,
        'error-accounts': stats.error
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// Setup account management event listeners
function setupAccountManagement() {
    // Add account modal event listeners
    const saveBasicBtn = document.getElementById('saveAccountBasic');
    const saveWithAPIBtn = document.getElementById('saveAccountWithAPI');
    
    if (saveBasicBtn) {
        saveBasicBtn.addEventListener('click', () => handleAddAccount(false));
    }
    
    if (saveWithAPIBtn) {
        saveWithAPIBtn.addEventListener('click', () => handleAddAccount(true));
    }
    
    // Platform selection change handler
    const platformSelect = document.getElementById('accountPlatform');
    if (platformSelect) {
        platformSelect.addEventListener('change', function() {
            updatePlatformApiHelp(this.value);
        });
    }
    
    // API configuration toggle
    const enableAPIToggle = document.getElementById('enableAPIConfig');
    if (enableAPIToggle) {
        enableAPIToggle.addEventListener('change', function() {
            const apiContent = document.getElementById('apiCredentialsContent');
            if (apiContent) {
                apiContent.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    // Add modal event listeners to reset form when opened
    const addAccountModal = document.getElementById('addAccountModal');
    if (addAccountModal) {
        addAccountModal.addEventListener('show.bs.modal', function() {
            // Force reset when modal is opened manually
            resetAccountForm(true);
        });
    }
}

// Update platform-specific API help text
function updatePlatformApiHelp(platform) {
    const helpDiv = document.getElementById('platformApiHelp');
    if (!helpDiv) return;
    
    const platformHelp = {
        linkedin: {
            title: 'LinkedIn API',
            text: 'Requiere Client ID y Client Secret de LinkedIn Developers. Necesita aprobación para Marketing Developer Platform.',
            color: 'alert-info'
        },
        twitter: {
            title: 'Twitter API',
            text: 'Requiere API Key, API Secret y Bearer Token. Twitter API v2 es de pago.',
            color: 'alert-warning'
        },
        instagram: {
            title: 'Instagram API',
            text: 'Usa Instagram Graph API o Basic Display API. Requiere App ID y App Secret de Facebook Developers.',
            color: 'alert-info'
        },
        facebook: {
            title: 'Facebook API',
            text: 'Requiere App ID y App Secret de Facebook Developers. Configura permisos de páginas.',
            color: 'alert-info'
        },
        youtube: {
            title: 'YouTube API',
            text: 'Requiere OAuth 2.0 Client ID y Client Secret de Google Cloud Console. Habilita YouTube Data API v3.',
            color: 'alert-info'
        },
        tiktok: {
            title: 'TikTok API',
            text: 'API en beta limitada. Requiere aprobación especial de TikTok Developers.',
            color: 'alert-warning'
        }
    };
    
    if (platform && platformHelp[platform]) {
        const help = platformHelp[platform];
        helpDiv.className = `alert ${help.color}`;
        helpDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>${help.title}:</strong> ${help.text}
        `;
    } else {
        helpDiv.className = 'alert alert-warning';
        helpDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Instrucciones:</strong> Selecciona una plataforma arriba para ver las instrucciones específicas de configuración de API.
        `;
    }
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Test API credentials
async function testApiCredentials() {
    const platform = document.getElementById('accountPlatform').value;
    const apiKey = document.getElementById('apiKey').value;
    const apiSecret = document.getElementById('apiSecret').value;
    
    if (!platform) {
        showErrorMessage('Selecciona una plataforma primero');
        return;
    }
    
    if (!apiKey || !apiSecret) {
        showErrorMessage('Ingresa las credenciales de API');
        return;
    }
    
    try {
        // Show loading state
        const testButton = document.querySelector('[onclick="testApiCredentials()"]');
        const originalText = testButton.innerHTML;
        testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Verificando...';
        testButton.disabled = true;
        
        console.log('Verifying credentials for:', platform);
        
        // Call the new verification endpoint
        const response = await fetchData('/api/accounts/verify-credentials', {
            method: 'POST',
            body: JSON.stringify({
                platform: platform,
                api_key: apiKey,
                api_secret: apiSecret
            })
        });
        
        console.log('Verification response:', response);
        
        if (response.status === 'success') {
            const profile = response.profile;
            
            // Check if real API credentials were detected
            if (profile.note === 'API_REAL_DETECTED') {
                showSuccessMessage('Credenciales reales detectadas. Para conectar con tu cuenta real, contacta al desarrollador para implementar la integración completa de APIs.');
                
                // Set placeholder values
                const accountField = document.getElementById('accountName');
                const displayField = document.getElementById('accountDisplayName');
                
                if (accountField) {
                    accountField.value = 'tu-cuenta-real';
                    accountField.placeholder = 'Se detectó API real - Implementación pendiente';
                }
                
                if (displayField) {
                    displayField.value = 'Tu Cuenta Real';
                    displayField.placeholder = 'Nombre real de tu cuenta';
                }
                
            } else {
                // Handle demo/test credentials
                const accountField = document.getElementById('accountName');
                const displayField = document.getElementById('accountDisplayName');
                
                if (accountField && profile.username) {
                    accountField.value = profile.username;
                }
                
                if (displayField && profile.display_name) {
                    displayField.value = profile.display_name;
                }
                
                showSuccessMessage(`Credenciales de demo verificadas. Cuenta: ${profile.username} (${profile.follower_count.toLocaleString()} seguidores)`);
            }
            
            // Mark credentials as verified to preserve form state
            credentialsVerified = true;
            
            // Mark API configuration as enabled since credentials are verified
            const enableAPIToggle = document.getElementById('enableAPIConfig');
            if (enableAPIToggle) {
                enableAPIToggle.checked = true;
                // Trigger the change event to show API content if hidden
                enableAPIToggle.dispatchEvent(new Event('change'));
            }
            
            // Show verification status
            const credentialsSection = document.querySelector('#apiCredentialsContent');
            let statusDiv = document.getElementById('verification-status');
            
            if (!statusDiv) {
                statusDiv = document.createElement('div');
                statusDiv.id = 'verification-status';
                credentialsSection.appendChild(statusDiv);
            }
            
            if (profile.note === 'API_REAL_DETECTED') {
                statusDiv.innerHTML = `
                    <div class="alert alert-warning mt-3">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>API Real Detectada:</strong> ${profile.display_name}<br>
                        <small class="text-muted">
                            Para conectar con tu cuenta real, se requiere implementación completa de las APIs de ${platform}
                        </small>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div class="alert alert-success mt-3">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Demo verificado:</strong> ${profile.display_name}<br>
                        <small class="text-muted">
                            <i class="fas fa-users me-1"></i>${profile.follower_count.toLocaleString()} seguidores (datos de demostración)
                            ${profile.verified ? '<i class="fas fa-check-circle text-primary ms-2"></i>Verificada' : ''}
                        </small>
                    </div>
                `;
            }
            
        } else {
            showErrorMessage(response.message || `Error al validar credenciales de ${platform}`);
        }
        
        // Restore button state
        testButton.innerHTML = originalText;
        testButton.disabled = false;
        
    } catch (error) {
        console.error('Error verifying credentials:', error);
        showErrorMessage('Error al probar las credenciales: ' + error.message);
        
        // Restore button state
        const testButton = document.querySelector('[onclick="testApiCredentials()"]');
        if (testButton) {
            testButton.innerHTML = '<i class="fas fa-vial me-1"></i>Probar Credenciales';
            testButton.disabled = false;
        }
    }
}

// Show API instructions modal
function showApiInstructions() {
    const modal = new bootstrap.Modal(document.getElementById('apiInstructionsModal'));
    modal.show();
}

// Open developer console for selected platform
function openDeveloperConsole() {
    const platform = document.getElementById('accountPlatform').value;
    
    const developerUrls = {
        linkedin: 'https://www.linkedin.com/developers/',
        twitter: 'https://developer.twitter.com/',
        instagram: 'https://developers.facebook.com/',
        facebook: 'https://developers.facebook.com/',
        youtube: 'https://console.developers.google.com/',
        tiktok: 'https://developers.tiktok.com/'
    };
    
    if (platform && developerUrls[platform]) {
        window.open(developerUrls[platform], '_blank');
    } else {
        showErrorMessage('Selecciona una plataforma primero');
    }
}

async function handleAddAccount(withAPI) {
    try {
        const formData = {
            platform: document.getElementById('accountPlatform').value,
            account_name: document.getElementById('accountName').value,
            display_name: document.getElementById('accountDisplayName').value,
            auto_posting: document.getElementById('enableAutoPosting').checked,
            is_default: document.getElementById('isDefaultAccount').checked,
            has_api: withAPI
        };
        
        // Include API credentials if withAPI is true
        if (withAPI) {
            formData.api_key = document.getElementById('apiKey').value;
            formData.api_secret = document.getElementById('apiSecret').value;
            formData.access_token = document.getElementById('accessToken').value;
            formData.webhook_url = document.getElementById('webhookUrl').value;
        }
        
        // Validate required fields
        if (!formData.platform || !formData.account_name) {
            showErrorMessage('Por favor completa los campos requeridos');
            return;
        }
        
        // Validate API credentials if API is enabled
        if (withAPI && (!formData.api_key || !formData.api_secret)) {
            showErrorMessage('Completa las credenciales de API o desactiva la configuración de API');
            return;
        }
        
        // Set display name if not provided
        if (!formData.display_name) {
            formData.display_name = `${formData.account_name} - ${formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}`;
        }
        
        const response = await fetchData('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response.status === 'success') {
            showSuccessMessage(response.message);
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAccountModal'));
            modal.hide();
            
            // Reset form but preserve some settings if credentials were verified
            setTimeout(() => {
                resetAccountForm();
            }, 300);
            
            // Refresh account list and stats
            loadSocialAccounts();
            loadAccountStats();
        }
    } catch (error) {
        showErrorMessage('Error al agregar la cuenta: ' + error.message);
    }
}

// Global variable to track if credentials were verified
let credentialsVerified = false;

// Reset account form
function resetAccountForm(force = false) {
    // Don't reset if credentials were just verified, unless forced
    if (credentialsVerified && !force) {
        credentialsVerified = false;
        return;
    }
    
    document.getElementById('addAccountForm').reset();
    document.getElementById('apiCredentialsContent').style.display = 'none';
    document.getElementById('enableAPIConfig').checked = false;
    credentialsVerified = false;
    
    // Reset modal title
    document.getElementById('addAccountModalLabel').textContent = 'Agregar Cuenta de Red Social';
    
    // Clear verification status
    const statusDiv = document.getElementById('verification-status');
    if (statusDiv) {
        statusDiv.remove();
    }
    
    // Reset platform API help
    const platformApiHelp = document.getElementById('platformApiHelp');
    if (platformApiHelp) {
        platformApiHelp.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Instrucciones:</strong> Selecciona una plataforma arriba para ver las instrucciones específicas de configuración de API.
        `;
    }
    
    // Reset save button handlers
    const saveBasicBtn = document.getElementById('saveAccountBasic');
    const saveWithAPIBtn = document.getElementById('saveAccountWithAPI');
    
    saveBasicBtn.onclick = () => handleAddAccount(false);
    saveWithAPIBtn.onclick = () => handleAddAccount(true);
}

// AI Provider Management
async function loadAIProviders() {
    try {
        const providers = await fetchData('/api/ai-providers');
        mockData.ai_providers = providers; // Store providers for later use
        displayAIProviders(providers);
        updateAIProviderStatus(providers);
    } catch (error) {
        console.error('Error loading AI providers:', error);
    }
}

async function loadAIProviderStats() {
    try {
        const providers = await fetchData('/api/ai-providers');
        updateAIProviderStats(providers);
    } catch (error) {
        console.error('Error loading AI provider stats:', error);
    }
}

function displayAIProviders(providers) {
    const container = document.getElementById('ai-providers-list');
    if (!container) return;
    
    if (providers.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-robot fa-3x mb-3"></i>
                <h6>No hay proveedores de IA configurados</h6>
                <p>Configura al menos un proveedor para generar contenido automáticamente</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = providers.map(provider => {
        const statusBadge = getAIProviderStatusBadge(provider.status);
        const providerIcon = getAIProviderIcon(provider.name);
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <i class="${providerIcon} me-3 fa-2x"></i>
                            <div>
                                <h6 class="mb-1">${provider.display_name}</h6>
                                <div class="text-muted small">
                                    Modelo: ${provider.model}
                                    ${provider.is_default ? '<span class="badge bg-primary ms-2">Predeterminado</span>' : ''}
                                </div>
                                ${provider.last_tested ? 
                                    `<div class="text-muted small mt-1">Última prueba: ${formatDate(provider.last_tested)}</div>` : ''
                                }
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            ${statusBadge}
                            <div class="btn-group btn-group-sm">
                                ${provider.status === 'connected' ? 
                                    `<button class="btn btn-outline-success" onclick="testAIProvider('${provider.name}')" title="Probar conexión">
                                        <i class="fas fa-vial"></i>
                                    </button>` : 
                                    `<button class="btn btn-outline-warning" onclick="openAIProviderModal('${provider.name}')" title="Configurar">
                                        <i class="fas fa-key"></i>
                                    </button>`
                                }
                                <button class="btn btn-outline-primary" onclick="setDefaultAIProvider('${provider.name}')" title="Establecer como predeterminado">
                                    <i class="fas fa-star"></i>
                                </button>
                                ${provider.status === 'connected' ? 
                                    `<button class="btn btn-outline-danger" onclick="disconnectAIProvider('${provider.name}')" title="Desconectar">
                                        <i class="fas fa-unlink"></i>
                                    </button>` : ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getAIProviderStatusBadge(status) {
    const badges = {
        connected: '<span class="badge bg-success">Conectado</span>',
        disconnected: '<span class="badge bg-secondary">Desconectado</span>',
        error: '<span class="badge bg-danger">Error</span>'
    };
    return badges[status] || badges.disconnected;
}

function getAIProviderIcon(provider) {
    const icons = {
        openai: 'fas fa-brain text-success',
        gemini: 'fas fa-gem text-primary',
        perplexity: 'fas fa-search text-warning'
    };
    return icons[provider] || 'fas fa-robot';
}

function updateAIProviderStatus(providers) {
    providers.forEach(provider => {
        const statusElement = document.getElementById(`${provider.name}-status`);
        if (statusElement) {
            statusElement.className = `badge bg-${provider.status === 'connected' ? 'success' : 'secondary'}`;
            statusElement.textContent = provider.status === 'connected' ? 'Conectado' : 'Desconectado';
        }
    });
}

function updateAIProviderStats(providers) {
    const connected = providers.filter(p => p.status === 'connected').length;
    const defaultProvider = providers.find(p => p.is_default);
    
    const connectedElement = document.getElementById('connected-ai-providers');
    if (connectedElement) connectedElement.textContent = connected;
    
    const defaultElement = document.getElementById('default-ai-provider');
    if (defaultElement) {
        defaultElement.textContent = defaultProvider ? defaultProvider.display_name : 'No configurado';
    }
}

async function saveAIProvider(providerName) {
    try {
        const apiKey = document.getElementById(`${providerName}-api-key`).value;
        
        if (!apiKey) {
            showErrorMessage('Por favor ingresa la API key');
            return;
        }
        
        const response = await fetchData(`/api/ai-providers/${providerName}`, {
            method: 'PUT',
            body: JSON.stringify({ api_key: apiKey })
        });
        
        if (response.status === 'success') {
            showSuccessMessage(response.message);
            
            // Clear the input field
            document.getElementById(`${providerName}-api-key`).value = '';
            
            // Refresh provider list and stats
            loadAIProviders();
            loadAIProviderStats();
        }
    } catch (error) {
        showErrorMessage('Error al guardar la API key: ' + error.message);
    }
}

async function testAIProvider(providerName) {
    const testButton = document.querySelector(`[onclick="testAIProvider('${providerName}')"]`);
    const originalContent = testButton.innerHTML;
    
    try {
        testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        testButton.disabled = true;
        
        const response = await fetchData(`/api/ai-providers/${providerName}/test`, {
            method: 'POST'
        });
        
        console.log('Test response:', response); // Debug log
        
        if (response && response.status === 'success') {
            showSuccessMessage(response.message || 'Conexión exitosa');
            if (response.test_content) {
                showSuccessMessage('Contenido de prueba: ' + response.test_content);
            }
        } else if (response && response.status === 'error') {
            showErrorMessage(response.message || 'Error al probar el proveedor');
        } else {
            showErrorMessage('Respuesta inesperada del servidor');
        }
        
        // Refresh provider list and stats
        await loadAIProviders();
        await loadAIProviderStats();
        
    } catch (error) {
        console.error('Error testing AI provider:', error);
        showErrorMessage('Error al probar el proveedor: ' + error.message);
    } finally {
        // Always restore button
        testButton.innerHTML = originalContent;
        testButton.disabled = false;
    }
}

async function disconnectAIProvider(providerName) {
    const provider = mockData.ai_providers?.find(p => p.name === providerName);
    if (!provider) {
        showErrorMessage('Proveedor no encontrado');
        return;
    }
    
    // Populate modal with provider info
    document.getElementById('provider-delete-name').textContent = provider.display_name || providerName;
    document.getElementById('provider-delete-status').textContent = provider.status === 'connected' ? 'Conectado' : 'Desconectado';
    
    // Show confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('deleteProviderModal'));
    modal.show();
    
    // Set up confirmation handler
    document.getElementById('confirm-delete-provider').onclick = async function() {
        try {
            const response = await fetchData(`/api/ai-providers/${providerName}`, {
                method: 'DELETE'
            });
            
            if (response.status === 'success') {
                modal.hide();
                showSuccessMessage(response.message);
                
                // Refresh provider list and stats
                loadAIProviders();
                loadAIProviderStats();
            }
        } catch (error) {
            showErrorMessage('Error al desconectar el proveedor: ' + error.message);
        }
    };
}

async function setDefaultAIProvider(providerName) {
    try {
        const response = await fetchData(`/api/ai-providers/${providerName}`, {
            method: 'PUT',
            body: JSON.stringify({ is_default: true })
        });
        
        if (response.status === 'success') {
            showSuccessMessage(`${providerName} establecido como proveedor predeterminado`);
            
            // Refresh provider list and stats
            loadAIProviders();
            loadAIProviderStats();
        }
    } catch (error) {
        showErrorMessage('Error al establecer proveedor predeterminado: ' + error.message);
    }
}

function openAIProviderModal(providerName) {
    const modal = new bootstrap.Modal(document.getElementById('aiProviderModal'));
    modal.show();
    
    // Focus on the specific provider's input
    setTimeout(() => {
        const input = document.getElementById(`${providerName}-api-key`);
        if (input) input.focus();
    }, 500);
}

async function testConnection(accountId) {
    try {
        const response = await fetchData(`/api/accounts/${accountId}/test`, {
            method: 'POST'
        });
        
        if (response.status === 'success') {
            showSuccessMessage(response.message);
        } else {
            showErrorMessage(response.message);
        }
        
        // Refresh account list and stats
        loadSocialAccounts();
        loadAccountStats();
        
    } catch (error) {
        showErrorMessage('Error al probar la conexión: ' + error.message);
    }
}

async function deleteAccount(accountId) {
    const account = mockData.social_accounts?.find(acc => acc.id === accountId);
    if (!account) {
        showErrorMessage('Cuenta no encontrada');
        return;
    }
    
    // Populate modal with account info
    document.getElementById('account-delete-name').textContent = account.username || account.name || 'Sin nombre';
    document.getElementById('account-delete-platform').textContent = account.platform;
    
    // Show confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
    
    // Set up confirmation handler
    document.getElementById('confirm-delete-account').onclick = async function() {
        try {
            const response = await fetchData(`/api/accounts/${accountId}`, {
                method: 'DELETE'
            });
            
            if (response.status === 'success') {
                modal.hide();
                showSuccessMessage(response.message);
                
                // Refresh account list and stats
                loadSocialAccounts();
                loadAccountStats();
            }
        } catch (error) {
            showErrorMessage('Error al eliminar la cuenta: ' + error.message);
        }
    };
}

function editAccount(accountId) {
    // Find the account data
    fetchData('/api/accounts').then(accounts => {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        // Pre-populate edit form (you can create a separate edit modal or reuse add modal)
        document.getElementById('accountPlatform').value = account.platform;
        document.getElementById('accountName').value = account.account_name;
        document.getElementById('accountDisplayName').value = account.display_name;
        document.getElementById('enableAutoPosting').checked = account.auto_posting;
        document.getElementById('isDefaultAccount').checked = account.is_default;
        
        // Show modal in edit mode
        const modal = new bootstrap.Modal(document.getElementById('addAccountModal'));
        document.getElementById('addAccountModalLabel').textContent = 'Editar Cuenta de Red Social';
        
        // Update save buttons to handle edit
        const saveBasicBtn = document.getElementById('saveAccountBasic');
        const saveWithAPIBtn = document.getElementById('saveAccountWithAPI');
        
        saveBasicBtn.onclick = () => handleUpdateAccount(accountId, false);
        saveWithAPIBtn.onclick = () => handleUpdateAccount(accountId, true);
        
        modal.show();
    });
}

async function handleUpdateAccount(accountId, withAPI) {
    try {
        const formData = {
            account_name: document.getElementById('accountName').value,
            display_name: document.getElementById('accountDisplayName').value,
            auto_posting: document.getElementById('enableAutoPosting').checked,
            is_default: document.getElementById('isDefaultAccount').checked
        };
        
        const response = await fetchData(`/api/accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (response.status === 'success') {
            showSuccessMessage(response.message);
            
            // Close modal and reset
            const modal = bootstrap.Modal.getInstance(document.getElementById('addAccountModal'));
            modal.hide();
            
            // Reset modal to add mode
            document.getElementById('addAccountModalLabel').textContent = 'Agregar Cuenta de Red Social';
            document.getElementById('addAccountForm').reset();
            
            // Refresh account list and stats
            loadSocialAccounts();
            loadAccountStats();
        }
    } catch (error) {
        showErrorMessage('Error al actualizar la cuenta: ' + error.message);
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

// Prompt Configuration Functions
async function loadPromptSettings() {
    try {
        const response = await fetchData("/api/prompt-settings");
        if (response.success) {
            populatePromptFields(response.settings);
        }
    } catch (error) {
        console.error("Error loading prompt settings:", error);
    }
}

function populatePromptFields(settings) {
    // System prompt
    if (settings.system_prompt) {
        document.getElementById("systemPrompt").value = settings.system_prompt;
    }
    
    // Platform prompts
    const platforms = ["twitter", "linkedin", "instagram", "web"];
    platforms.forEach(platform => {
        const element = document.getElementById(`${platform}Prompt`);
        if (element && settings.platform_prompts && settings.platform_prompts[platform]) {
            element.value = settings.platform_prompts[platform];
        }
    });
    
    // Tone prompts
    const tones = ["professional", "casual", "humorous", "inspirational"];
    tones.forEach(tone => {
        const element = document.getElementById(`${tone}Tone`);
        if (element && settings.tone_prompts && settings.tone_prompts[tone]) {
            element.value = settings.tone_prompts[tone];
        }
    });
}

async function saveSystemPrompt() {
    const systemPrompt = document.getElementById("systemPrompt").value;
    
    try {
        const response = await fetchData("/api/prompt-settings/system", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ system_prompt: systemPrompt })
        });
        
        if (response.success) {
            showSuccessMessage("Prompt del sistema guardado correctamente");
        } else {
            showErrorMessage(response.error || "Error al guardar el prompt del sistema");
        }
    } catch (error) {
        showErrorMessage("Error al guardar: " + error.message);
    }
}

async function savePlatformPrompts() {
    const platforms = ["twitter", "linkedin", "instagram", "web"];
    const platformPrompts = {};
    
    platforms.forEach(platform => {
        const element = document.getElementById(`${platform}Prompt`);
        if (element) {
            platformPrompts[platform] = element.value;
        }
    });
    
    try {
        const response = await fetchData("/api/prompt-settings/platforms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform_prompts: platformPrompts })
        });
        
        if (response.success) {
            showSuccessMessage("Prompts de plataforma guardados correctamente");
        } else {
            showErrorMessage(response.error || "Error al guardar los prompts de plataforma");
        }
    } catch (error) {
        showErrorMessage("Error al guardar: " + error.message);
    }
}

async function saveTonePrompts() {
    const tones = ["professional", "casual", "humorous", "inspirational"];
    const tonePrompts = {};
    
    tones.forEach(tone => {
        const element = document.getElementById(`${tone}Tone`);
        if (element) {
            tonePrompts[tone] = element.value;
        }
    });
    
    try {
        const response = await fetchData("/api/prompt-settings/tones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tone_prompts: tonePrompts })
        });
        
        if (response.success) {
            showSuccessMessage("Configuración de tonos guardada correctamente");
        } else {
            showErrorMessage(response.error || "Error al guardar la configuración de tonos");
        }
    } catch (error) {
        showErrorMessage("Error al guardar: " + error.message);
    }
}

async function resetPromptsToDefault() {
    if (!confirm("¿Estás seguro de que quieres restaurar todos los prompts a sus valores predeterminados?")) {
        return;
    }
    
    try {
        const response = await fetchData("/api/prompt-settings/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        if (response.success) {
            populatePromptFields(response.settings);
            showSuccessMessage("Prompts restaurados a valores predeterminados");
        } else {
            showErrorMessage(response.error || "Error al restaurar los prompts");
        }
    } catch (error) {
        showErrorMessage("Error al restaurar: " + error.message);
    }
}

// ===== ENHANCED ANIMATION UTILITIES =====

// Enhanced animation utilities
function addLoadingAnimation(element) {
    element.classList.add('loading-content');
    element.style.pointerEvents = 'none';
}

function removeLoadingAnimation(element) {
    element.classList.remove('loading-content');
    element.style.pointerEvents = '';
}

// Smooth scroll to top when changing views
function smoothScrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Enhanced notification system with animations
function createAnimatedNotification(message, type = 'success') {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'position-fixed top-0 end-0 p-3';
    alertContainer.style.zIndex = '9999';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.style.animation = 'fadeInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    alert.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    document.body.appendChild(alertContainer);
    
    // Auto-remove with animation
    const duration = type === 'success' ? 4000 : 5000;
    setTimeout(() => {
        alert.style.animation = 'fadeOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.parentNode.removeChild(alertContainer);
            }
        }, 400);
    }, duration);
}

// Button loading state animations
function setButtonLoading(button, isLoading = true) {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cargando...';
        button.disabled = true;
        button.style.transform = 'scale(0.98)';
    } else {
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = false;
        button.style.transform = '';
        delete button.dataset.originalText;
    }
}

// Card hover effect enhancement
function enhanceCardAnimations() {
    const cards = document.querySelectorAll('.card, .account-card, .dashboard-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}

// Initialize enhanced animations when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    enhanceCardAnimations();
    
    // Add smooth scrolling to navigation
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.addEventListener('click', () => {
            smoothScrollToTop();
        });
    });
});

