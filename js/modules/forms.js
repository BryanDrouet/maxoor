/**
 * forms.js - Gestion des formulaires
 */

import { StorageManager } from './storage.js';

export const FormManager = {
    /**
     * Initialise la banneau de cookies RGPD
     */
    initCookieBanner() {
        const cookieBanner = document.getElementById('cookie-banner');
        const acceptCookies = document.getElementById('accept-cookies');
        const rejectCookies = document.getElementById('reject-cookies');

        if (!cookieBanner || !acceptCookies || !rejectCookies) return;

        if (!StorageManager.hasCookieConsent()) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000);
        }

        acceptCookies.addEventListener('click', () => {
            StorageManager.setCookieConsent('accepted');
            cookieBanner.classList.remove('show');
        });

        rejectCookies.addEventListener('click', () => {
            StorageManager.setCookieConsent('rejected');
            cookieBanner.classList.remove('show');
        });
    },

    /**
     * Initialise le formulaire de contact
     */
    initContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.style.opacity = '0';
            setTimeout(() => {
                submitBtn.innerHTML = `<i data-lucide="check-circle" aria-hidden="true"></i> Requête transmise à la direction`;
                submitBtn.style.backgroundColor = '#00B8A8';
                submitBtn.style.color = '#000000';
                submitBtn.style.opacity = '1';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 300);
            
            setTimeout(() => {
                contactForm.reset();
                submitBtn.style.opacity = '0';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.color = '';
                    submitBtn.style.opacity = '1';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 300);
            }, 4000);
        });
    },

    /**
     * Initialise le formulaire de mot de passe (page de lancement)
     * @param {string} correctPassword - SHA-256 du mot de passe correct
     * @param {Function} onSuccess - Callback après authentification réussie
     */
    async initPasswordForm(correctPassword, onSuccess) {
        const form = document.querySelector('.password-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const passwordInput = document.getElementById('password-input');
            const errorMessage = document.querySelector('.error-message');
            const successMessage = document.querySelector('.success-message');
            const submitBtn = form.querySelector('button[type="submit"]');

            if (errorMessage) errorMessage.style.display = 'none';
            if (successMessage) successMessage.style.display = 'none';

            if (!passwordInput.value.trim()) {
                if (errorMessage) {
                    errorMessage.textContent = 'Veuillez entrer un mot de passe';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            if (submitBtn) submitBtn.disabled = true;

            try {
                const hash = await this.sha256(passwordInput.value);
                
                if (hash === correctPassword) {
                    if (successMessage) {
                        successMessage.textContent = '✓ Identifiant correct ! Accès accordé.';
                        successMessage.style.display = 'block';
                    }
                    
                    if (onSuccess) onSuccess();
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = '❌ Mot de passe incorrect.';
                        errorMessage.style.display = 'block';
                    }
                }
            } catch (error) {
                if (errorMessage) {
                    errorMessage.textContent = 'Erreur lors de la vérification.';
                    errorMessage.style.display = 'block';
                }
                console.error('Erreur SHA-256:', error);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    },

    /**
     * Calcule le SHA-256 d'une chaîne
     * @param {string} str
     * @returns {Promise<string>} Hash hexadécimal
     */
    async sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};
