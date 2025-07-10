// Token storage helpers for authentication

/**
 * Get the current auth token from localStorage.
 * @returns {string|null}
 */
export function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Set or remove the auth token in localStorage.
 * @param {string|null} token
 */
export function setAuthToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
    document.dispatchEvent(new CustomEvent('navShouldUpdate'));
}
