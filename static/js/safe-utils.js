// Safe Utility Functions for Robust JavaScript Operations
// Prevents DOM errors and improves deployment stability

// Global error handler for uncaught errors
window.addEventListener('error', function(event) {
    console.warn('Caught error:', event.error?.message || event.message);
    event.preventDefault();
});

// Safe element operations
window.safeDOM = {
    // Safe element by ID operation
    byId: function(id, operation = null, fallback = null) {
        try {
            const element = document.getElementById(id);
            if (!element) {
                return fallback;
            }
            return operation ? operation(element) : element;
        } catch (error) {
            console.warn(`Operation failed for element ${id}:`, error);
            return fallback;
        }
    },

    // Safe querySelector operation
    query: function(selector, operation = null, fallback = null) {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                return fallback;
            }
            return operation ? operation(element) : element;
        } catch (error) {
            console.warn(`Query failed for selector ${selector}:`, error);
            return fallback;
        }
    },

    // Safe querySelectorAll operation
    queryAll: function(selector, operation = null, fallback = []) {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
                return fallback;
            }
            return operation ? operation(elements) : elements;
        } catch (error) {
            console.warn(`QueryAll failed for selector ${selector}:`, error);
            return fallback;
        }
    },

    // Safe innerHTML setting
    setHTML: function(elementOrId, html) {
        return this.byId(elementOrId, el => {
            el.innerHTML = html;
            return true;
        }, false);
    },

    // Safe text content setting
    setText: function(elementOrId, text) {
        return this.byId(elementOrId, el => {
            el.textContent = text;
            return true;
        }, false);
    },

    // Safe value setting
    setValue: function(elementOrId, value) {
        return this.byId(elementOrId, el => {
            el.value = value;
            return true;
        }, false);
    },

    // Safe event listener addition
    addListener: function(elementOrId, event, handler) {
        return this.byId(elementOrId, el => {
            el.addEventListener(event, handler);
            return true;
        }, false);
    },

    // Safe class operations
    addClass: function(elementOrId, className) {
        return this.byId(elementOrId, el => {
            el.classList.add(className);
            return true;
        }, false);
    },

    removeClass: function(elementOrId, className) {
        return this.byId(elementOrId, el => {
            el.classList.remove(className);
            return true;
        }, false);
    },

    toggleClass: function(elementOrId, className) {
        return this.byId(elementOrId, el => {
            el.classList.toggle(className);
            return true;
        }, false);
    },

    // Safe attribute operations
    setAttribute: function(elementOrId, attr, value) {
        return this.byId(elementOrId, el => {
            el.setAttribute(attr, value);
            return true;
        }, false);
    },

    getAttribute: function(elementOrId, attr, fallback = null) {
        return this.byId(elementOrId, el => {
            return el.getAttribute(attr);
        }, fallback);
    },

    // Check if element exists
    exists: function(elementOrId) {
        return this.byId(elementOrId, () => true, false);
    }
};

// Safe async operations
window.safeAsync = {
    // Safe fetch with error handling
    fetch: async function(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Fetch failed for ${url}:`, error);
            throw error;
        }
    },

    // Safe setTimeout wrapper
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Safe function execution
window.safeFn = {
    // Execute function safely
    exec: function(fn, ...args) {
        try {
            if (typeof fn !== 'function') {
                console.warn('Not a function:', fn);
                return null;
            }
            return fn(...args);
        } catch (error) {
            console.warn('Function execution failed:', error);
            return null;
        }
    },

    // Execute function if exists
    execIf: function(fnName, context = window, ...args) {
        try {
            const fn = context[fnName];
            if (typeof fn === 'function') {
                return fn.apply(context, args);
            }
            return null;
        } catch (error) {
            console.warn(`Function ${fnName} execution failed:`, error);
            return null;
        }
    }
};

// Initialize safe operations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Safe utilities initialized');
});