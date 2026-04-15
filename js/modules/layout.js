const HEADER_VARIANTS = new Set(['main', 'simple', 'launch']);

async function injectPartial(selector, partialPath) {
    const container = document.querySelector(selector);
    if (!container) return;

    const response = await fetch(partialPath, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Impossible de charger ${partialPath} (${response.status})`);
    }

    container.innerHTML = await response.text();
}

async function initSharedLayout() {
    const header = document.querySelector('[data-shared-header]');
    const footer = document.querySelector('[data-shared-footer]');

    const headerVariant = header?.getAttribute('data-shared-header') || '';
    if (header && HEADER_VARIANTS.has(headerVariant)) {
        await injectPartial('[data-shared-header]', `/partials/header-${headerVariant}.html`);
    }

    if (footer) {
        await injectPartial('[data-shared-footer]', '/partials/footer.html');
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

window.layoutReadyPromise = initSharedLayout()
    .catch((error) => {
        console.error('[Layout] Erreur de chargement des partials:', error);
    })
    .finally(() => {
        window.dispatchEvent(new CustomEvent('layout:ready'));
    });
