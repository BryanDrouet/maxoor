/**
 * forms.js - Gestion des formulaires
 */

import { StorageManager } from './storage.js';

const CONTACT_FORM_DRAFT_KEY = 'maxoor_contact_form_draft';

export const FormManager = {
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
        }, { passive: true });

        rejectCookies.addEventListener('click', () => {
            StorageManager.setCookieConsent('rejected');
            cookieBanner.classList.remove('show');
        }, { passive: true });
    },

    initContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        const subjectSelect = contactForm.querySelector('#user_subject');
        const customSubjectGroup = contactForm.querySelector('#custom-subject-group');
        const customSubjectInput = contactForm.querySelector('#user_custom_subject');

        const saveDraft = () => {
            const draft = {};

            contactForm.querySelectorAll('input, textarea, select').forEach((field) => {
                if (!field.name || field.type === 'hidden' || field.type === 'submit') return;

                if (field.type === 'checkbox') {
                    draft[field.name] = Boolean(field.checked);
                    return;
                }

                draft[field.name] = field.value;
            });

            try {
                sessionStorage.setItem(CONTACT_FORM_DRAFT_KEY, JSON.stringify(draft));
            } catch {
                // noop
            }
        };

        const restoreDraft = () => {
            let draft = null;
            try {
                draft = JSON.parse(sessionStorage.getItem(CONTACT_FORM_DRAFT_KEY) || 'null');
            } catch {
                draft = null;
            }

            if (!draft || typeof draft !== 'object') return;

            contactForm.querySelectorAll('input, textarea, select').forEach((field) => {
                if (!field.name || !(field.name in draft)) return;

                if (field.type === 'checkbox') {
                    field.checked = Boolean(draft[field.name]);
                    return;
                }

                field.value = draft[field.name] ?? '';
            });
        };

        const clearDraft = () => {
            try {
                sessionStorage.removeItem(CONTACT_FORM_DRAFT_KEY);
            } catch {
                // noop
            }
        };

        const isCustomSubject = () => subjectSelect?.value === 'Autre demande prestigieuse';
        const updateCustomSubjectVisibility = () => {
            if (!subjectSelect || !customSubjectGroup || !customSubjectInput) return;

            if (isCustomSubject()) {
                customSubjectGroup.hidden = false;
                customSubjectInput.required = true;
                customSubjectInput.setAttribute('aria-required', 'true');
            } else {
                customSubjectGroup.hidden = true;
                customSubjectInput.required = false;
                customSubjectInput.removeAttribute('aria-required');
                customSubjectInput.value = '';
                customSubjectInput.setCustomValidity('');
            }
        };

        if (subjectSelect) {
            subjectSelect.addEventListener('change', updateCustomSubjectVisibility, { passive: true });
        }

        restoreDraft();
        updateCustomSubjectVisibility();

        contactForm.addEventListener('input', saveDraft, { passive: true });
        contactForm.addEventListener('change', saveDraft, { passive: true });

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            const originalText = submitBtn.innerHTML;
            const formData = new FormData(contactForm);
            const actionUrl = contactForm.getAttribute('action') || '';

            // Si "Autre" est choisi, l'objet personnalise devient obligatoire
            if (isCustomSubject() && customSubjectInput) {
                const customSubjectValue = customSubjectInput.value.trim();
                if (!customSubjectValue) {
                    customSubjectInput.setCustomValidity('Veuillez renseigner un objet personnalisé.');
                    customSubjectInput.reportValidity();
                    return;
                }

                customSubjectInput.setCustomValidity('');
                formData.set('subject', customSubjectValue);
                formData.set('custom_subject', customSubjectValue);
            }

            console.group('[ContactForm] Submit debug');
            console.log('Action URL:', actionUrl);
            console.log('Method:', contactForm.getAttribute('method') || 'POST');
            console.log('Name provided:', Boolean(formData.get('name')));
            console.log('Email provided:', Boolean(formData.get('email')));
            console.log('Subject value:', formData.get('subject'));
            console.log('Message length:', String(formData.get('message') || '').length);
            console.log('RGPD checked:', formData.get('rgpd_consent') !== null);

            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.75';
            submitBtn.innerHTML = 'Envoi en cours...';

            try {
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Accept: 'application/json'
                    }
                });

                console.log('Response status:', response.status, response.statusText);

                let responseBody = null;
                try {
                    responseBody = await response.json();
                    console.log('Response body:', responseBody);
                } catch {
                    console.log('Response body: non-JSON (acceptable selon service)');
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                submitBtn.innerHTML = `<i data-lucide="check-circle" aria-hidden="true"></i> Requête envoyée`;
                submitBtn.style.backgroundColor = '#00B8A8';
                submitBtn.style.color = '#000000';
                if (typeof lucide !== 'undefined') lucide.createIcons();

                contactForm.reset();
                updateCustomSubjectVisibility();
                clearDraft();
            } catch (error) {
                console.error('[ContactForm] Erreur envoi:', error);
                submitBtn.innerHTML = 'Erreur d\'envoi - voir console';
                submitBtn.style.backgroundColor = '#ff6464';
                submitBtn.style.color = '#000000';
            } finally {
                console.groupEnd();
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.color = '';
                    submitBtn.style.opacity = '1';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 2500);
            }
        });
    },

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

    async sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};
