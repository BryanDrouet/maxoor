document.addEventListener('DOMContentLoaded', function() {
    initTwitchPlayer();
    lucide.createIcons();
});

function initTwitchPlayer() {
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

    updateStreamStatus();
}

function updateStreamStatus() {
    const statusBadge = document.getElementById('stream-status');
    if (!statusBadge) return;

    fetch('https://api.twitch.tv/kraken/streams/batsave', {
        headers: {
            'Client-ID': 'YOUR_CLIENT_ID'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.stream) {
            statusBadge.innerHTML = '<span class="status-dot" aria-hidden="true"></span><span>En direct</span>';
            statusBadge.classList.add('online');
            statusBadge.classList.remove('offline');
        }
    })
    .catch(err => {
        console.log('Stream status check unavailable');
    });
}

window.addEventListener('load', function() {
    lucide.createIcons();
});
