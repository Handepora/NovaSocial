// Publish Now functionality
async function publishNow(platform, content, hashtags) {
    // Find the publish button and add loading state
    const publishBtn = event.target;
    const originalText = publishBtn.innerHTML;
    
    // Set loading state
    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Publicando...';
    publishBtn.disabled = true;
    publishBtn.classList.add('btn-loading');
    
    try {
        const fullContent = hashtags ? `${content} ${hashtags}` : content;
        
        const response = await fetch('/api/publish-now', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                platform: platform,
                content: fullContent,
                hashtags: hashtags
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Success feedback with animation
            publishBtn.innerHTML = '<i class="fas fa-check me-1"></i>Publicado';
            publishBtn.classList.remove('btn-success', 'btn-loading');
            publishBtn.classList.add('btn-outline-success');
            
            showSuccessMessage(`✓ Contenido publicado exitosamente en ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
            
            // Refresh monitoring view if it's active
            const monitoreoView = document.getElementById('monitoreo-view');
            if (monitoreoView && monitoreoView.style.display !== 'none') {
                loadMonitoringData();
            }
            
            // Reset button after 3 seconds
            setTimeout(() => {
                publishBtn.innerHTML = originalText;
                publishBtn.classList.remove('btn-outline-success');
                publishBtn.classList.add('btn-success');
                publishBtn.disabled = false;
            }, 3000);
        } else {
            showErrorMessage(`Error al publicar en ${platform}: ${data.message || 'Error desconocido'}`);
            // Reset button on error
            publishBtn.innerHTML = originalText;
            publishBtn.classList.remove('btn-loading');
            publishBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error publishing content:', error);
        showErrorMessage('Error al publicar contenido. Por favor, intenta de nuevo.');
        // Reset button on error
        publishBtn.innerHTML = originalText;
        publishBtn.classList.remove('btn-loading');
        publishBtn.disabled = false;
    }
}

// Social Media Monitoring functionality
async function loadMonitoringData() {
    try {
        const response = await fetch('/api/monitoring-data');
        const data = await response.json();
        
        if (data.status === 'success') {
            displayMonitoringData(data.data);
        } else {
            throw new Error(data.message || 'Error al cargar datos de monitoreo');
        }
    } catch (error) {
        console.error('Error loading monitoring data:', error);
        showErrorMessage('Error al cargar datos de monitoreo');
    }
}

function displayMonitoringData(data) {
    const container = document.getElementById('monitoring-container');
    if (!container) return;

    let html = '<div class="row">';
    
    // Platform summary cards
    Object.keys(data.platforms).forEach(platform => {
        const platformData = data.platforms[platform];
        html += `
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <i class="fab fa-${platform} fa-3x text-primary mb-3"></i>
                        <h5>${platform.charAt(0).toUpperCase() + platform.slice(1)}</h5>
                        <div class="row text-center">
                            <div class="col-6">
                                <div class="h4 text-success">${platformData.published_today || 0}</div>
                                <small class="text-muted">Hoy</small>
                            </div>
                            <div class="col-6">
                                <div class="h4 text-info">${platformData.total_posts || 0}</div>
                                <small class="text-muted">Total</small>
                            </div>
                        </div>
                        <div class="mt-3">
                            <span class="badge ${platformData.status === 'connected' ? 'bg-success' : 'bg-warning'}">
                                ${platformData.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Recent posts section
    html += `
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Publicaciones Recientes</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Plataforma</th>
                                <th>Contenido</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Interacciones</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (data.recent_posts && data.recent_posts.length > 0) {
        data.recent_posts.forEach(post => {
            html += `
                <tr>
                    <td>
                        <i class="fab fa-${post.platform} me-2"></i>
                        ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </td>
                    <td>
                        <div class="text-truncate" style="max-width: 300px;" title="${post.content}">
                            ${post.content}
                        </div>
                    </td>
                    <td>${formatDate(post.published_date)}</td>
                    <td>
                        <span class="badge ${post.status === 'published' ? 'bg-success' : post.status === 'failed' ? 'bg-danger' : 'bg-warning'}">
                            ${post.status === 'published' ? 'Publicado' : post.status === 'failed' ? 'Falló' : 'Pendiente'}
                        </span>
                    </td>
                    <td>
                        <small class="text-muted">
                            ${post.likes || 0} likes, ${post.shares || 0} shares
                        </small>
                    </td>
                </tr>
            `;
        });
    } else {
        html += `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay publicaciones recientes
                </td>
            </tr>
        `;
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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