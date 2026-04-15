const HEADER_VARIANTS = new Set(['main', 'simple', 'launch']);

const IMAGE_VIEWER_HTML = `
<div class="image-viewer" data-image-viewer hidden aria-hidden="true">
    <button class="image-viewer__backdrop" type="button" aria-label="Fermer la visionneuse"></button>
    <div class="image-viewer__panel" role="dialog" aria-modal="true" aria-label="Visionneuse d'image">
        <div class="image-viewer__toolbar">
            <div class="image-viewer__caption" data-image-viewer-caption></div>
            <div class="image-viewer__actions">
                <button type="button" class="image-viewer__action" data-image-viewer-zoom-out aria-label="Réduire l'image">−</button>
                <button type="button" class="image-viewer__action" data-image-viewer-reset aria-label="Réinitialiser le zoom">1:1</button>
                <button type="button" class="image-viewer__action" data-image-viewer-zoom-in aria-label="Agrandir l'image">+</button>
                <button type="button" class="image-viewer__action image-viewer__action--close" data-image-viewer-close aria-label="Fermer la visionneuse">×</button>
            </div>
        </div>
        <div class="image-viewer__stage" data-image-viewer-stage>
            <img class="image-viewer__image" data-image-viewer-image alt="" draggable="false">
        </div>
        <p class="image-viewer__hint">Molette ou pincement pour zoomer, glisser pour déplacer, Échap pour fermer.</p>
    </div>
</div>
`;

let imageViewerState = null;

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

    initImageViewer();
}

function initImageViewer() {
    if (imageViewerState) return;

    const existingViewer = document.querySelector('[data-image-viewer]');
    if (existingViewer) {
        imageViewerState = createImageViewer(existingViewer);
        return;
    }

    const viewerTemplate = document.createElement('template');
    viewerTemplate.innerHTML = IMAGE_VIEWER_HTML.trim();
    const viewerElement = viewerTemplate.content.firstElementChild;

    if (!viewerElement) return;

    document.body.appendChild(viewerElement);
    imageViewerState = createImageViewer(viewerElement);
}

function createImageViewer(viewerElement) {
    const backdrop = viewerElement.querySelector('.image-viewer__backdrop');
    const panel = viewerElement.querySelector('.image-viewer__panel');
    const stage = viewerElement.querySelector('[data-image-viewer-stage]');
    const image = viewerElement.querySelector('[data-image-viewer-image]');
    const caption = viewerElement.querySelector('[data-image-viewer-caption]');
    const closeButtons = viewerElement.querySelectorAll('[data-image-viewer-close]');
    const zoomInButton = viewerElement.querySelector('[data-image-viewer-zoom-in]');
    const zoomOutButton = viewerElement.querySelector('[data-image-viewer-zoom-out]');
    const resetButton = viewerElement.querySelector('[data-image-viewer-reset]');

    const state = {
        scale: 1,
        panX: 0,
        panY: 0,
        minScale: 1,
        maxScale: 5,
        open: false,
        pointerMode: 'idle',
        pointers: new Map(),
        dragStart: null,
        pinchStartDistance: 0,
        pinchStartScale: 1,
        pinchStartCenter: null,
        lastActiveImage: null
    };

    const updateTransform = () => {
        image.style.setProperty('--viewer-scale', String(state.scale));
        image.style.setProperty('--viewer-pan-x', `${state.panX}px`);
        image.style.setProperty('--viewer-pan-y', `${state.panY}px`);
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const setScale = (nextScale) => {
        state.scale = clamp(nextScale, state.minScale, state.maxScale);
        if (state.scale === 1) {
            state.panX = 0;
            state.panY = 0;
        }
        updateTransform();
    };

    const zoomBy = (delta, anchor = null) => {
        const previousScale = state.scale;
        const nextScale = clamp(previousScale + delta, state.minScale, state.maxScale);
        if (nextScale === previousScale) return;

        if (anchor && stage) {
            const stageRect = stage.getBoundingClientRect();
            const anchorX = anchor.clientX - stageRect.left - stageRect.width / 2;
            const anchorY = anchor.clientY - stageRect.top - stageRect.height / 2;
            const ratio = nextScale / previousScale;
            state.panX = anchorX - (anchorX - state.panX) * ratio;
            state.panY = anchorY - (anchorY - state.panY) * ratio;
        }

        state.scale = nextScale;
        if (state.scale <= state.minScale + 0.001) {
            state.panX = 0;
            state.panY = 0;
        }
        updateTransform();
    };

    const open = (sourceImage) => {
        if (!sourceImage) return;

        state.lastActiveImage = sourceImage;
        state.open = true;
        viewerElement.hidden = false;
        viewerElement.removeAttribute('inert');
        viewerElement.classList.add('is-open');
        viewerElement.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('has-image-viewer-open');

        const imageUrl = sourceImage.currentSrc || sourceImage.src;
        const imageCaption =
            sourceImage.getAttribute('data-viewer-caption') ||
            sourceImage.getAttribute('data-image-caption') ||
            sourceImage.alt ||
            sourceImage.title ||
            sourceImage.getAttribute('aria-label') ||
            'Image agrandie';

        image.src = imageUrl;
        image.alt = imageCaption;
        if (caption) {
            caption.textContent = imageCaption;
        }

        state.scale = 1;
        state.panX = 0;
        state.panY = 0;
        state.pointerMode = 'idle';
        state.pointers.clear();
        updateTransform();

        window.requestAnimationFrame(() => {
            zoomInButton?.focus({ preventScroll: true });
        });
    };

    const close = () => {
        if (!state.open) return;

        state.open = false;
        viewerElement.classList.remove('is-open');
        viewerElement.setAttribute('aria-hidden', 'true');
        viewerElement.setAttribute('inert', '');
        document.documentElement.classList.remove('has-image-viewer-open');
        viewerElement.hidden = true;
        state.pointers.clear();
        state.pointerMode = 'idle';
        state.dragStart = null;
        // Retour au focus sur l'image qui a lancé le viewer
        state.lastActiveImage?.focus({ preventScroll: true });
    };

    const reset = () => {
        state.scale = 1;
        state.panX = 0;
        state.panY = 0;
        updateTransform();
    };

    const getPrimaryPointer = () => state.pointers.values().next().value;

    const distanceBetweenPointers = () => {
        const pointers = Array.from(state.pointers.values());
        if (pointers.length < 2) return 0;
        const dx = pointers[0].clientX - pointers[1].clientX;
        const dy = pointers[0].clientY - pointers[1].clientY;
        return Math.hypot(dx, dy);
    };

    const centerBetweenPointers = () => {
        const pointers = Array.from(state.pointers.values());
        if (pointers.length < 2) return null;
        return {
            clientX: (pointers[0].clientX + pointers[1].clientX) / 2,
            clientY: (pointers[0].clientY + pointers[1].clientY) / 2
        };
    };

    const onPointerDown = (event) => {
        if (!state.open) return;
        if (!event.isPrimary && event.pointerType === 'mouse') return;

        state.pointers.set(event.pointerId, event);
        stage.setPointerCapture(event.pointerId);

        if (state.pointers.size === 1) {
            state.pointerMode = 'drag';
            state.dragStart = {
                clientX: event.clientX,
                clientY: event.clientY,
                startPanX: state.panX,
                startPanY: state.panY
            };
        }

        if (state.pointers.size === 2) {
            state.pointerMode = 'pinch';
            state.pinchStartDistance = distanceBetweenPointers();
            state.pinchStartScale = state.scale;
            state.pinchStartCenter = centerBetweenPointers();
        }
    };

    const onPointerMove = (event) => {
        if (!state.open || !state.pointers.has(event.pointerId)) return;

        state.pointers.set(event.pointerId, event);

        if (state.pointerMode === 'pinch' && state.pointers.size >= 2) {
            const distance = distanceBetweenPointers();
            if (!state.pinchStartDistance) return;
            const ratio = distance / state.pinchStartDistance;
            const nextScale = clamp(state.pinchStartScale * ratio, state.minScale, state.maxScale);
            const center = centerBetweenPointers() || state.pinchStartCenter;
            if (center) {
                const stageRect = stage.getBoundingClientRect();
                const centerX = center.clientX - stageRect.left - stageRect.width / 2;
                const centerY = center.clientY - stageRect.top - stageRect.height / 2;
                const scaleRatio = nextScale / state.scale;
                state.panX = centerX - (centerX - state.panX) * scaleRatio;
                state.panY = centerY - (centerY - state.panY) * scaleRatio;
            }
            state.scale = nextScale;
            if (state.scale <= state.minScale + 0.001) {
                state.panX = 0;
                state.panY = 0;
            }
            updateTransform();
            return;
        }

        if (state.pointerMode === 'drag' && state.dragStart && state.scale > 1) {
            const deltaX = event.clientX - state.dragStart.clientX;
            const deltaY = event.clientY - state.dragStart.clientY;
            state.panX = state.dragStart.startPanX + deltaX;
            state.panY = state.dragStart.startPanY + deltaY;
            updateTransform();
        }
    };

    const endPointer = (event) => {
        if (!state.pointers.has(event.pointerId)) return;

        state.pointers.delete(event.pointerId);

        if (state.pointers.size === 0) {
            state.pointerMode = 'idle';
            state.dragStart = null;
            state.pinchStartDistance = 0;
            state.pinchStartScale = state.scale;
            state.pinchStartCenter = null;
            return;
        }

        if (state.pointers.size === 1) {
            state.pointerMode = 'drag';
            const remaining = getPrimaryPointer();
            if (remaining) {
                state.dragStart = {
                    clientX: remaining.clientX,
                    clientY: remaining.clientY,
                    startPanX: state.panX,
                    startPanY: state.panY
                };
            }
        }
    };

    const onWheel = (event) => {
        if (!state.open) return;
        event.preventDefault();
        const direction = Math.sign(event.deltaY);
        zoomBy(direction > 0 ? -0.14 : 0.14, event);
    };

    const onKeyDown = (event) => {
        if (!state.open) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomBy(0.2);
            return;
        }

        if (event.key === '-') {
            event.preventDefault();
            zoomBy(-0.2);
            return;
        }

        if (event.key === '0') {
            event.preventDefault();
            reset();
        }
    };

    const onDocumentClick = (event) => {
        const target = event.target;
        const clickableImage = target.closest?.('img');

        if (clickableImage && !target.closest('[data-image-viewer]')) {
            event.preventDefault();
            open(clickableImage);
            return;
        }

        const closeTrigger = target.closest?.('[data-image-viewer-close], .image-viewer__backdrop');
        if (closeTrigger) {
            close();
            return;
        }

        if (target.closest?.('[data-image-viewer-zoom-in]')) {
            zoomBy(0.2);
            return;
        }

        if (target.closest?.('[data-image-viewer-zoom-out]')) {
            zoomBy(-0.2);
            return;
        }

        if (target.closest?.('[data-image-viewer-reset]')) {
            reset();
        }
    };

    backdrop.addEventListener('click', close, { passive: true });
    closeButtons.forEach((button) => button.addEventListener('click', close, { passive: true }));
    stage.addEventListener('pointerdown', onPointerDown, { passive: true });
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerup', endPointer, { passive: true });
    stage.addEventListener('pointercancel', endPointer, { passive: true });
    stage.addEventListener('pointerleave', endPointer, { passive: true });
    stage.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('click', onDocumentClick, { capture: true, passive: false });
    document.addEventListener('keydown', onKeyDown, { passive: true });

    zoomInButton?.addEventListener('click', () => zoomBy(0.2), { passive: true });
    zoomOutButton?.addEventListener('click', () => zoomBy(-0.2), { passive: true });
    resetButton?.addEventListener('click', reset, { passive: true });

    updateTransform();

    return state;
}

window.layoutReadyPromise = initSharedLayout()
    .catch((error) => {
        console.error('[Layout] Erreur de chargement des partials:', error);
    })
    .finally(() => {
        window.dispatchEvent(new CustomEvent('layout:ready'));
    });
