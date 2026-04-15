/**
 * launch-init.js - Initialisation pour la page de lancement
 */

import { AuthManager } from '../js/modules/auth.js';
import { CountdownManager } from '../js/modules/countdown.js';
import { FormManager } from '../js/modules/forms.js';

const LAUNCH_DATE = new Date('2026-04-14T20:45:00').getTime();
const PASSWORD_HASH = '491068e8824786c4648f2f46d2d9bc850fe78b26a3ede2361917851ec3687d1a'; // SHA-256 de "maxoor2026"

document.addEventListener('DOMContentLoaded', () => {
    const launchHasPassed = Date.now() >= LAUNCH_DATE;

    if (launchHasPassed) {
        document.querySelectorAll('.product-info-section').forEach((section) => section.remove());
    }

    CountdownManager.init();

    FormManager.initPasswordForm(PASSWORD_HASH, () => {
        AuthManager.grantPreviewAccess();
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
