/**
 * countdown.js - Gestion du compte à rebours
 */

const LAUNCH_DATE = new Date('2026-04-14T20:45:00').getTime();

export const CountdownManager = {
    init() {
        const countdownInterval = setInterval(() => this.update(), 1000);
        this.update();
    },

    update() {
        const now = new Date().getTime();
        const distance = LAUNCH_DATE - now;
        const countdown = document.querySelector('.countdown');

        if (!countdown) return;

        if (distance < 0) {
            countdown.closest('.launch-countdown-section')?.classList.add('hidden');
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minutesEl = document.getElementById('countdown-minutes');
        const secondsEl = document.getElementById('countdown-seconds');

        if (daysEl) {
            daysEl.closest('.countdown-item')?.classList.toggle('hidden', days === 0);
            daysEl.textContent = String(days).padStart(2, '0');
        }
        if (hoursEl) {
            hoursEl.closest('.countdown-item')?.classList.toggle('hidden', hours === 0);
            hoursEl.textContent = String(hours).padStart(2, '0');
        }
        if (minutesEl) {
            minutesEl.closest('.countdown-item')?.classList.toggle('hidden', minutes === 0);
            minutesEl.textContent = String(minutes).padStart(2, '0');
        }
        if (secondsEl) {
            secondsEl.closest('.countdown-item')?.classList.remove('hidden');
            secondsEl.textContent = String(seconds).padStart(2, '0');
        }

        if (countdown) {
            const visibleItems = countdown.querySelectorAll('.countdown-item:not(.hidden)').length;
            countdown.style.setProperty('--countdown-columns', String(Math.max(1, visibleItems)));
        }
    }
};
