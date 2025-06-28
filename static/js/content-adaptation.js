// Content Adaptation Functions
function updateCharCount() {
    const content = document.getElementById('original-content').value;
    const charCount = document.getElementById('content-char-count');
    if (charCount) {
        charCount.textContent = content.length;
    }
}

async function adaptContent() {
    const originalContent = document.getElementById('original-content').value.trim();
    const style = document.getElementById('adaptation-style').value;
    const tone = document.getElementById('adaptation-tone').value;
    const provider = document.getElementById('adaptation-provider').value;
    const focus = document.getElementById('adaptation-focus').value;
    
    // Get selected platforms
    const platforms = Array.from(document.querySelectorAll('#content-adaptation-form input[type="checkbox"]:checked')).map(cb => cb.value);
    
    if (!originalContent) {
        showErrorMessage('Por favor pega el contenido que quieres adaptar');
        return;
    }
    
    if (platforms.length === 0) {
        showErrorMessage('Selecciona al menos una plataforma de destino');
        return;
    }
    
    try {
        // Show loading state
        const button = document.querySelector('[onclick="adaptContent()"]');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Adaptando...';
        button.disabled = true;
        
        const response = await fetchData('/api/adapt-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                original_content: originalContent,
                style: style,
                tone: tone,
                platforms: platforms,
                provider: provider,
                focus: focus
            })
        });
        
        if (response.status === 'success') {
            displayAdaptedContent(response.adapted_content, platforms);
            showSuccessMessage('Contenido adaptado exitosamente');
        } else if (response.status === 'error') {
            if (response.requires_setup) {
                showErrorMessage(`${response.error}. Configura las API keys en la sección de Configuración.`);
            } else {
                showErrorMessage(response.error || 'Error al adaptar contenido');
            }
        } else if (response.error) {
            showErrorMessage(response.error);
        } else {
            showErrorMessage('Respuesta inesperada del servidor');
        }
        
        // Restore button state
        button.innerHTML = originalText;
        button.disabled = false;
        
    } catch (error) {
        console.error('Error adapting content:', error);
        showErrorMessage('Error al adaptar contenido: ' + (error.message || 'Error desconocido'));
        
        // Restore button state
        const button = document.querySelector('[onclick="adaptContent()"]');
        button.innerHTML = '<i class="fas fa-magic me-2"></i>Adaptar Contenido';
        button.disabled = false;
    }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayAdaptedContent(adaptedContent, platforms) {
    const resultContainer = document.getElementById('adapted-content-results');
    
    let html = '<ul class="nav nav-tabs mb-3">';
    platforms.forEach((platform, index) => {
        const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        html += `<li class="nav-item">
            <a class="nav-link ${index === 0 ? 'active' : ''}" data-bs-toggle="tab" href="#adapt-tab-${platform}">
                <i class="fab fa-${platform} me-2"></i>${platformName}
            </a>
        </li>`;
    });
    html += '</ul>';
    
    html += '<div class="tab-content">';
    platforms.forEach((platform, index) => {
        const content = adaptedContent[platform];
        if (content) {
            // Escape HTML content to prevent XSS
            const safeContentHtml = content.content ? escapeHtml(content.content).replace(/\n/g, '<br>') : '';
            const safeHashtagsHtml = content.hashtags ? escapeHtml(content.hashtags.join(' ')) : '';
            
            // Escape for JavaScript string contexts
            const safeContent = content.content ? content.content.replace(/`/g, '\\`').replace(/'/g, "\\'") : '';
            const safeHashtags = content.hashtags ? content.hashtags.join(' ').replace(/'/g, "\\'") : '';
            
            html += `
                <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="adapt-tab-${platform}">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="fab fa-${platform} me-2"></i>
                                Adaptado para ${platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </div>
                            <small class="text-muted">${content.content ? content.content.length : 0} caracteres</small>
                        </div>
                        <div class="card-body">
                            <div class="adapted-text mb-3">
                                <div class="content-preview p-3 bg-light rounded">
                                    ${safeContentHtml}
                                </div>
                            </div>
                            ${content.hashtags && content.hashtags.length > 0 ? `
                                <div class="hashtags mb-3">
                                    <strong>Hashtags:</strong> 
                                    <span class="text-primary">${safeHashtagsHtml}</span>
                                </div>
                            ` : ''}
                            <div class="d-flex gap-2">
                                <button class="btn btn-success" onclick="publishNow('${platform}', '${safeContent}', '${safeHashtags}')">
                                    <i class="fas fa-rocket me-1"></i>Publicar Ahora
                                </button>
                                <button class="btn btn-primary" onclick="scheduleAdaptedContent('${platform}', '${safeContent}', '${safeHashtags}')">
                                    <i class="fas fa-calendar-plus me-1"></i>Programar
                                </button>
                                <button class="btn btn-outline-secondary" onclick="editAdaptedContent('${platform}', '${safeContent}', '${safeHashtags}')">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-outline-success" onclick="copyAdaptedContent('${platform}')">
                                    <i class="fas fa-copy me-1"></i>Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    html += '</div>';
    
    resultContainer.innerHTML = html;
}

function scheduleAdaptedContent(platform, content, hashtags) {
    // Fill the scheduling modal with adapted content
    const postContent = document.getElementById('postContent');
    const postPlatform = document.getElementById('postPlatform');
    const postTimezone = document.getElementById('postTimezone');
    
    if (postContent) {
        postContent.value = content + (hashtags ? '\n\n' + hashtags : '');
    }
    if (postPlatform) {
        postPlatform.value = platform;
    }
    if (postTimezone) {
        postTimezone.value = 'Europe/Madrid';
    }
    
    // Set Madrid time for scheduling
    const now = new Date();
    const madridTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    const tomorrow = new Date(madridTime.getTime() + 24 * 60 * 60 * 1000);
    
    const postDate = document.getElementById('postDate');
    const postTime = document.getElementById('postTime');
    
    if (postDate) {
        postDate.value = tomorrow.toISOString().split('T')[0];
    }
    if (postTime) {
        postTime.value = '10:00';
    }
    
    // Open scheduling modal
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    modal.show();
    
    showSuccessMessage(`Contenido cargado en el programador para ${platform}`);
}

function editAdaptedContent(platform, content, hashtags) {
    const fullContent = content + (hashtags ? '\n\n' + hashtags : '');
    const newContent = prompt(`Editar contenido para ${platform}:`, fullContent);
    
    if (newContent !== null && newContent.trim() !== '') {
        // Update the display with edited content
        const contentPreview = document.querySelector(`#adapt-tab-${platform} .content-preview`);
        if (contentPreview) {
            contentPreview.innerHTML = newContent.replace(/\n/g, '<br>');
        }
        showSuccessMessage('Contenido editado correctamente');
    }
}

function copyAdaptedContent(platform) {
    const contentElement = document.querySelector(`#adapt-tab-${platform} .content-preview`);
    if (contentElement) {
        const content = contentElement.textContent || contentElement.innerText;
        navigator.clipboard.writeText(content).then(() => {
            showSuccessMessage(`Contenido de ${platform} copiado al portapapeles`);
        }).catch(() => {
            showErrorMessage('Error al copiar al portapapeles');
        });
    }
}

// Initialize character count on page load
document.addEventListener('DOMContentLoaded', function() {
    const originalContentTextarea = document.getElementById('original-content');
    if (originalContentTextarea) {
        originalContentTextarea.addEventListener('input', updateCharCount);
        updateCharCount(); // Initialize count
    }
});