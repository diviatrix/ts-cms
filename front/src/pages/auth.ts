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
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h2 class="card-title text-center mb-4">${mode === 'login' ? 'Login' : 'Register'}</h2>
                                <form id="auth-form">
                                    <div class="mb-3">
                                        <input type="text" class="form-control" id="login" placeholder="Login" required>
                                    </div>
                                    ${mode === 'register' ? '<div class="mb-3"><input type="email" class="form-control" id="email" placeholder="Email" required></div>' : ''}
                                    <div class="mb-3">
                                        <input type="password" class="form-control" id="password" placeholder="Password" required>
                                    </div>
                                    <div class="d-grid gap-2 mb-3">
                                        <button type="submit" class="btn btn-primary">${mode === 'login' ? 'Login' : 'Register'}</button>
                                    </div>
                                    <p id="auth-message" class="text-center"></p>
                                    <div class="text-center">
                                        <a href="#" id="switch-mode">${mode === 'login' ? 'No account? Register' : 'Already have an account? Login'}</a>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                    message!.className = 'text-danger text-center';
                }
            } else {
                const response = await api.post('/api/register', { login, email, password });
                if (response?.success) {
                    message!.textContent = 'Registration successful. You can now log in.';
                    message!.className = 'text-success text-center';
                } else {
                    message!.textContent = response?.message || 'Registration failed.';
                    message!.className = 'text-danger text-center';
                }
            }
        });
    }
};

auth();
