/**
 * twitch.js - Gestion du lecteur Twitch
 */

export const TwitchManager = {
    init() {
        const player = document.getElementById('twitch-player');
        if (!player) return;

        const currentDomain = window.location.hostname;
        const iframe = document.createElement('iframe');
        
        iframe.src = `https://player.twitch.tv/?channel=batsave&parent=${currentDomain}`;
        iframe.frameborder = '0';
        iframe.allowFullscreen = true;
        iframe.scrolling = 'no';
        iframe.height = '378';
        iframe.width = '620';
        
        player.appendChild(iframe);
    }
};
