/**
 * storage.js - Gestion de la persistance localStorage
 */

export const StorageManager = {
    saveCart(cart) {
        localStorage.setItem('maxoor_cart', JSON.stringify(cart));
    },

    loadCart(productsData) {
        const saved = localStorage.getItem('maxoor_cart');
        if (saved) {
            try {
                const savedCart = JSON.parse(saved);
                return savedCart.filter(itemId => productsData.some(p => p.id === itemId));
            } catch (e) {
                console.error('Erreur lors du chargement du panier', e);
            }
        }
        return [];
    },

    savePromoCode(code) {
        if (code) {
            localStorage.setItem('maxoor_promo_code', code);
        } else {
            localStorage.removeItem('maxoor_promo_code');
        }
    },

    loadPromoCode() {
        return localStorage.getItem('maxoor_promo_code');
    },

    setCookieConsent(status) {
        localStorage.setItem('rgpd_cookie_consent', status);
    },

    hasCookieConsent() {
        return localStorage.getItem('rgpd_cookie_consent') !== null;
    },

    setPreviewAccess() {
        sessionStorage.setItem('maxoor_preview_access', 'true');
    },

    hasPreviewAccess() {
        return sessionStorage.getItem('maxoor_preview_access') === 'true';
    },

    clearPreviewAccess() {
        sessionStorage.removeItem('maxoor_preview_access');
    }
};
