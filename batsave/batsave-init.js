import { TwitchManager } from '../js/modules/twitch.js';

document.addEventListener('DOMContentLoaded', () => {
    TwitchManager.init();

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
