/**
 * storage.js - Gestion de la persistance localStorage
 */

export const StorageManager = {
    /**
     * Sauvegarde le panier
     * @param {Array} cart - Tableau des IDs de produits
     */
    saveCart(cart) {
        localStorage.setItem('maxoor_cart', JSON.stringify(cart));
    },

    /**
     * Charge le panier depuis le stockage
     * @param {Array} productsData - Données des produits pour validation
     * @returns {Array} Panier chargé et validé
     */
    loadCart(productsData) {
        const saved = localStorage.getItem('maxoor_cart');
        if (saved) {
            try {
                const savedCart = JSON.parse(saved);
                // Vérifier que les produits existent toujours
                return savedCart.filter(itemId => productsData.some(p => p.id === itemId));
            } catch (e) {
                console.error('Erreur lors du chargement du panier', e);
            }
        }
        return [];
    },

    /**
     * Sauvegarde le code promo appliqué
     * @param {string|null} code - Code promo ou null
     */
    savePromoCode(code) {
        if (code) {
            localStorage.setItem('maxoor_promo_code', code);
        } else {
            localStorage.removeItem('maxoor_promo_code');
        }
    },

    /**
     * Charge le code promo depuis le stockage
     * @returns {string|null}
     */
    loadPromoCode() {
        return localStorage.getItem('maxoor_promo_code');
    },

    /**
     * Gère les consentements cookies RGPD
     * @param {string} status - 'accepted' ou 'rejected'
     */
    setCookieConsent(status) {
        localStorage.setItem('rgpd_cookie_consent', status);
    },

    /**
     * Vérifie si le consentement RGPD existe
     * @returns {boolean}
     */
    hasCookieConsent() {
        return localStorage.getItem('rgpd_cookie_consent') !== null;
    },

    /**
     * Sauvegarde l'accès à la prévisualisation
     */
    setPreviewAccess() {
        sessionStorage.setItem('maxoor_preview_access', 'true');
    },

    /**
     * Vérifie l'accès à la prévisualisation
     * @returns {boolean}
     */
    hasPreviewAccess() {
        return sessionStorage.getItem('maxoor_preview_access') === 'true';
    },

    /**
     * Efface l'accès à la prévisualisation
     */
    clearPreviewAccess() {
        sessionStorage.removeItem('maxoor_preview_access');
    }
};
