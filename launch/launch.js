/**
 * launch.js
 * Gestion du compte à rebours et du formulaire de mot de passe
 * Maxoor Inc. - April 2026
 */

const LAUNCH_DATE = new Date('2026-04-14T20:45:00').getTime();
const PASSWORD_HASH = '491068e8824786c4648f2f46d2d9bc850fe78b26a3ede2361917851ec3687d1a'; // SHA-256 de "maxoor2026"

/**
 * Initialise le compte à rebours
 */
function initCountdown() {
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // S'exécute immédiatement
}

/**
 * Met à jour l'affichage du compte à rebours
 */
function updateCountdown() {
    const now = new Date().getTime();
    const distance = LAUNCH_DATE - now;
    const countdown = document.querySelector('.countdown');

    if (!countdown) {
        return;
    }

    if (distance < 0) {
        countdown.innerHTML = '<div style="grid-column: 1/-1; color: var(--color-light-1); font-size: 1.5rem; font-weight: bold;">🎉 Maxoor is LIVE!</div>';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysItem = document.getElementById('countdown-days')?.closest('.countdown-item');
    const hoursItem = document.getElementById('countdown-hours')?.closest('.countdown-item');
    const minutesItem = document.getElementById('countdown-minutes')?.closest('.countdown-item');
    const secondsItem = document.getElementById('countdown-seconds')?.closest('.countdown-item');

    if (daysItem) {
        daysItem.classList.toggle('hidden', days === 0);
    }
    if (hoursItem) {
        hoursItem.classList.toggle('hidden', hours === 0);
    }
    if (minutesItem) {
        minutesItem.classList.toggle('hidden', minutes === 0);
    }
    if (secondsItem) {
        secondsItem.classList.remove('hidden');
    }

    if (countdown) {
        const visibleItems = countdown.querySelectorAll('.countdown-item:not(.hidden)').length;
        countdown.style.setProperty('--countdown-columns', String(Math.max(1, visibleItems)));
    }

    document.getElementById('countdown-days').textContent = String(days).padStart(2, '0');
    document.getElementById('countdown-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = String(seconds).padStart(2, '0');
}


/**
 * Calcule le SHA-256 d'une chaîne de caractères
 * @param {string} str - La chaîne à hacher
 * @returns {Promise<string>} - Le hash SHA-256 en hexadécimal
 */
async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gère la soumission du formulaire de mot de passe
 */
async function handlePasswordSubmit(e) {
    e.preventDefault();

    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.querySelector('.error-message');
    const successMessage = document.querySelector('.success-message');
    const submitBtn = document.querySelector('.password-form button[type="submit"]');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!passwordInput.value.trim()) {
        errorMessage.textContent = 'Veuillez entrer un mot de passe';
        errorMessage.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Vérification...';

    try {
        const hash = await sha256(passwordInput.value);
        
        if (hash === PASSWORD_HASH) {
            // Mot de passe correct
            sessionStorage.setItem('maxoor_preview_access', 'true');
            successMessage.textContent = '✓ Accès accordé! Redirection...';
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            // Mot de passe incorrect
            errorMessage.textContent = 'Mot de passe incorrect';
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Accéder';
        }
    } catch (error) {
        console.error('Erreur lors du hachage:', error);
        errorMessage.textContent = 'Erreur système. Veuillez réessayer.';
        errorMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Accéder';
    }
}

/**
 * Initialise la page au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifie si l'accès est déjà accordé
    if (sessionStorage.getItem('maxoor_preview_access')) {
        window.location.href = '/';
        return;
    }

    // Démarrage du compte à rebours
    initCountdown();

    // Éventuel gestion du formulaire de mot de passe
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }

    // Refresh des icônes Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Refresh des icônes Lucide après le chargement complet
window.addEventListener('load', () => {
    if (window.lucide) {
        lucide.createIcons();
    }
});
