export function handleAuthError(response) {
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return true;
    }
    return false;
}