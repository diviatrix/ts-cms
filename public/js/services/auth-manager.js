import { setAuthToken } from '../core/api-client.js';

export class AuthManager {
  constructor(app) {
    this.app = app;
  }

  login(token) {
    setAuthToken(token);
    this.app.updateAuthState();
  }

  logout() {
    setAuthToken(null);
    window.location.href = '/';
  }

  handleAuthSuccess(event) {
    const { token } = event.detail;
    if (token) {
      this.login(token);
    }
  }
}