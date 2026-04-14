/**
 * auth.js - Gestion de l'authentification et accès aux pages protégées
 */

import { StorageManager } from './storage.js';

const LAUNCH_DATE = new Date('2026-04-14T20:45:00').getTime();

export const AuthManager = {
    /**
     * Vérifie si l'utilisateur a accès à la page principale
     * @returns {boolean}
     */
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

    /**
     * Octroie l'accès en tant que prévisualisateur
     */
    grantPreviewAccess() {
        StorageManager.setPreviewAccess();
    },

    /**
     * Efface l'accès et redirige vers /launch/
     */
    logout() {
        StorageManager.clearPreviewAccess();
        window.location.href = '/launch/';
    },

    /**
     * Expose la fonction de déconnexion dans window
     */
    initLogoutCommand() {
        window.logoutMaxoor = () => this.logout();
        console.log('%c🍼 Maxoor Inc. - Mode Développement', 'color: #00FFEA; font-size: 14px; font-weight: bold;');
        console.log('%cPour se déconnecter : logoutMaxoor()', 'color: #00B8A8; font-size: 12px;');
    }
};
