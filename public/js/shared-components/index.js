/**
 * Shared Components Index
 * Main export file for all shared components
 */

// Import all components
import { BasePageController } from './base-controller.js';
import { AuthPageController, ProtectedPageController } from './auth-controller.js';
import { FormHandler } from './form-handler.js';
import { DataTable } from './data-table.js';
import { BreadcrumbNav, UnsavedChangesDetector } from './navigation.js';

// Re-export all components
export {
    BasePageController,
    AuthPageController,
    ProtectedPageController,
    FormHandler,
    DataTable,
    BreadcrumbNav,
    UnsavedChangesDetector
};

// Simple hash/query parser for all frontend and admin use
export function parseHashQuery() {
    const hash = window.location.hash || '';
    // Example: #records?editRecordId=123
    const [tab, query] = hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(query || '');
    return { tab, params };
}
