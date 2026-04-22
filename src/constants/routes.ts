/**
 * API Routes Constants
 *
 * This file will contain all API endpoint definitions.
 * Centralizes route paths for maintainability and consistency.
 *
 * Will include:
 * - API endpoint paths
 * - Route name mappings
 * - URL patterns
 */

// Placeholder exports - will be populated during refactoring
export const AUTH_ROUTES = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
};

// USER_ROUTES removed - user management is now handled by external auth service
// export const USER_ROUTES = {
//   LIST: '/api/users',
//   DETAIL: '/api/users/:id',
//   CREATE: '/api/users',
//   UPDATE: '/api/users/:id',
//   DELETE: '/api/users/:id',
// };

export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  // USERS: USER_ROUTES, // User management is now handled by external auth service
  // Add more route groups as needed
};

export const ROUTE_NAMES = {
  // TODO: Map route names to paths
};

export default {
  API_ROUTES,
  ROUTE_NAMES,
};
