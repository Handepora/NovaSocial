// Clean sidebar management - no duplicates
document.addEventListener('DOMContentLoaded', function() {
    // Remove any JavaScript-generated sidebars that might be causing duplicates
    const allSidebars = document.querySelectorAll('[id*="nova-nav"], .nova-sidebar');
    allSidebars.forEach(sidebar => {
        if (sidebar.parentNode && sidebar.parentNode !== document.querySelector('nav.sidebar')) {
            sidebar.remove();
        }
    });
    
    // Setup navigation for existing HTML sidebar only
    const navLinks = document.querySelectorAll('[data-view]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            if (view) {
                // Call showView if it exists
                if (typeof window.showView === 'function') {
                    window.showView(view);
                }
                
                // Update active states
                navLinks.forEach(l => {
                    const parent = l.closest('div');
                    if (parent) {
                        parent.style.background = 'transparent';
                        parent.style.borderLeft = 'none';
                    }
                });
                
                // Set active state
                const parent = this.closest('div');
                if (parent) {
                    parent.style.background = 'rgba(255, 107, 71, 0.1)';
                    parent.style.borderLeft = '3px solid #ff6b47';
                }
            }
        });
    });
    
    // Ensure view switching works
    if (typeof window.showView === 'function') {
        window.showView('dashboard');
    }
});