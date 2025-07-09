import { api } from '../utils/api.js';
import { navmenu } from '../components/navmenu/navmenu.js';

const app = document.getElementById('app');
if (app) app.before(navmenu());

export const auth = () => {
    if (!app) return;
    let mode: 'login' | 'register' = 'login';
    render();

    function render() {
        app!.innerHTML = `
            <h1>${mode === 'login' ? 'Login' : 'Register'}</h1>
            <form id="auth-form">
                <div><input type="text" id="login" placeholder="Login" required></div>
                ${mode === 'register' ? '<div><input type="email" id="email" placeholder="Email" required></div>' : ''}
                <div><input type="password" id="password" placeholder="Password" required></div>
                <div><button type="submit">${mode === 'login' ? 'Login' : 'Register'}</button></div>
                <p id="auth-message"></p>
                <a href="#" id="switch-mode">${mode === 'login' ? 'No account? Register' : 'Already have an account? Login'}</a>
            </form>
        `;
        document.getElementById('switch-mode')?.addEventListener('click', (e) => {
            e.preventDefault();
            mode = mode === 'login' ? 'register' : 'login';
            render();
        });
        document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = (document.getElementById('login') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;
            const email = (document.getElementById('email') as HTMLInputElement)?.value;
            const message = document.getElementById('auth-message');
            if (mode === 'login') {
                const response = await api.post('/api/login', { login, password });
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    window.location.href = '/admin.html';
                } else {
                    message!.textContent = response?.message || 'Login failed.';
                    message!.style.color = 'red';
                }
            } else {
                const response = await api.post('/api/register', { login, email, password });
                if (response?.success) {
                    message!.textContent = 'Registration successful. You can now log in.';
                    message!.style.color = 'green';
                } else {
                    message!.textContent = response?.message || 'Registration failed.';
                    message!.style.color = 'red';
                }
            }
        });
    }
};

auth();
