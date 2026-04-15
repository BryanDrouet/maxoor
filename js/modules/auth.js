/**
 * auth.js - Gestion de l'authentification et accès aux pages protégées
 */

import { StorageManager } from './storage.js';

const LAUNCH_DATE = new Date('2026-04-14T20:45:00').getTime();

export const AuthManager = {
    checkPageAccess() {
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        
        if (isHomePage) {
            const now = new Date().getTime();
            const launchHasPassed = now >= LAUNCH_DATE;
            const hasAccess = StorageManager.hasPreviewAccess() || launchHasPassed;
            
            if (!hasAccess) {
                window.location.href = '/launch/';
                return false;
            }
        }
        return true;
    },

    grantPreviewAccess() {
        StorageManager.setPreviewAccess();
    },

    logout() {
        StorageManager.clearPreviewAccess();
        window.location.href = '/launch/';
    },

    initLogoutCommand() {
        window.logoutMaxoor = () => this.logout();
    }
};
