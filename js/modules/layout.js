const HEADER_VARIANTS = new Set(['main', 'simple', 'launch', 'boutique']);

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
let markdownEnginePromise = null;

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeUrl(rawUrl) {
    const value = rawUrl.trim();
    if (!value) return '#';

    if (
        value.startsWith('#') ||
        value.startsWith('/') ||
        value.startsWith('./') ||
        value.startsWith('../')
    ) {
        return value;
    }

    try {
        const parsed = new URL(value, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
            return value;
        }
    } catch {
        return '#';
    }

    return '#';
}

function renderInlineMarkdown(text) {
    let rendered = escapeHtml(text);

    rendered = rendered.replace(/`([^`]+)`/g, '<code>$1</code>');

    rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
        const safeUrl = escapeHtml(sanitizeUrl(url));
        const isExternal = /^https?:\/\//i.test(safeUrl);
        const rel = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
        return `<a href="${safeUrl}"${rel}>${label}</a>`;
    });

    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    rendered = rendered.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    rendered = rendered.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    rendered = rendered.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    rendered = rendered.replace(/_([^_]+)_/g, '<em>$1</em>');
    rendered = rendered.replace(/\|\|([^|]+)\|\|/g, '<span class="markdown-spoiler">$1</span>');

    rendered = rendered.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_match, prefix, url) => {
        const safeUrl = escapeHtml(sanitizeUrl(url));
        return `${prefix}<a href="${safeUrl}" rel="noopener noreferrer" target="_blank">${safeUrl}</a>`;
    });

    return rendered;
}

function renderMarkdownFallback(markdownSource) {
    const lines = markdownSource.replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let paragraphBuffer = [];
    let blockquoteBuffer = [];
    let inUnorderedList = false;
    let inOrderedList = false;

    const flushParagraph = () => {
        if (paragraphBuffer.length === 0) return;
        html.push(`<p>${renderInlineMarkdown(paragraphBuffer.join(' '))}</p>`);
        paragraphBuffer = [];
    };

    const closeLists = () => {
        if (inUnorderedList) {
            html.push('</ul>');
            inUnorderedList = false;
        }
        if (inOrderedList) {
            html.push('</ol>');
            inOrderedList = false;
        }
    };

    const flushBlockquote = () => {
        if (blockquoteBuffer.length === 0) return;
        const quoteContent = blockquoteBuffer
            .map((line) => renderInlineMarkdown(line))
            .join('<br>');
        html.push(`<blockquote><p>${quoteContent}</p></blockquote>`);
        blockquoteBuffer = [];
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            closeLists();
            flushBlockquote();
            continue;
        }

        const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
        if (blockquoteMatch) {
            flushParagraph();
            closeLists();
            blockquoteBuffer.push(blockquoteMatch[1]);
            continue;
        }

        flushBlockquote();

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            closeLists();
            const level = headingMatch[1].length;
            html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
            continue;
        }

        const dividerMatch = trimmed.match(/^([-*_])\1{2,}$/);
        if (dividerMatch) {
            flushParagraph();
            closeLists();
            html.push('<hr>');
            continue;
        }

        const subtleLineMatch = trimmed.match(/^-#\s+(.+)$/);
        if (subtleLineMatch) {
            flushParagraph();
            closeLists();
            html.push(`<p class="markdown-subtle">${renderInlineMarkdown(subtleLineMatch[1])}</p>`);
            continue;
        }

        const taskItemMatch = trimmed.match(/^[-*+]\s+\[( |x|X)\]\s+(.+)$/);
        if (taskItemMatch) {
            flushParagraph();
            if (inOrderedList) {
                html.push('</ol>');
                inOrderedList = false;
            }
            if (!inUnorderedList) {
                html.push('<ul>');
                inUnorderedList = true;
            }

            const isChecked = taskItemMatch[1].toLowerCase() === 'x';
            const checkmark = isChecked ? '&#10003;' : '&nbsp;';
            html.push(`<li class="markdown-task-item"><span class="markdown-task-box" aria-hidden="true">${checkmark}</span><span>${renderInlineMarkdown(taskItemMatch[2])}</span></li>`);
            continue;
        }

        const unorderedListMatch = trimmed.match(/^[-*+]\s+(.+)$/) || trimmed.match(/^•\s+(.+)$/);
        if (unorderedListMatch) {
            flushParagraph();
            if (inOrderedList) {
                html.push('</ol>');
                inOrderedList = false;
            }
            if (!inUnorderedList) {
                html.push('<ul>');
                inUnorderedList = true;
            }
            html.push(`<li>${renderInlineMarkdown(unorderedListMatch[1])}</li>`);
            continue;
        }

        const orderedListMatch = trimmed.match(/^\d+[\.)]\s+(.+)$/);
        if (orderedListMatch) {
            flushParagraph();
            if (inUnorderedList) {
                html.push('</ul>');
                inUnorderedList = false;
            }
            if (!inOrderedList) {
                html.push('<ol>');
                inOrderedList = true;
            }
            html.push(`<li>${renderInlineMarkdown(orderedListMatch[1])}</li>`);
            continue;
        }

        closeLists();
        paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    closeLists();
    flushBlockquote();

    return html.join('\n');
}

function loadExternalScript(src, globalName) {
    if (globalName && typeof window[globalName] !== 'undefined') {
        return Promise.resolve(window[globalName]);
    }

    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-lib="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve(globalName ? window[globalName] : true), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.dataset.lib = src;
        script.addEventListener('load', () => resolve(globalName ? window[globalName] : true), { once: true });
        script.addEventListener('error', () => reject(new Error(`Impossible de charger ${src}`)), { once: true });
        document.head.appendChild(script);
    });
}

function normalizeMarkdownForDiscordSyntax(markdownSource) {
    const normalizedLines = markdownSource.replace(/\r\n?/g, '\n').split('\n').map((line) => {
        if (/^\s*•\s+/.test(line)) {
            return line.replace(/^(\s*)•\s+/, '$1- ');
        }

        if (/^\s*\d+\)\s+/.test(line)) {
            return line.replace(/^(\s*\d+)\)\s+/, '$1. ');
        }

        return line;
    });

    return normalizedLines.join('\n');
}

function setupMarkedExtensions(markedLib) {
    const subtleBlockExtension = {
        name: 'discordSubtleLine',
        level: 'block',
        start(src) {
            const match = src.match(/^-#\s/m);
            return match ? match.index : undefined;
        },
        tokenizer(src) {
            const match = /^-#\s+(.+)(?:\n|$)/.exec(src);
            if (!match) return undefined;

            return {
                type: 'discordSubtleLine',
                raw: match[0],
                text: match[1]
            };
        },
        renderer(token) {
            return `<p class="markdown-subtle">${markedLib.parseInline(token.text || '')}</p>`;
        }
    };

    const spoilerInlineExtension = {
        name: 'discordSpoiler',
        level: 'inline',
        start(src) {
            const match = src.match(/\|\|/);
            return match ? match.index : undefined;
        },
        tokenizer(src) {
            const match = /^\|\|([\s\S]+?)\|\|/.exec(src);
            if (!match) return undefined;

            return {
                type: 'discordSpoiler',
                raw: match[0],
                text: match[1]
            };
        },
        renderer(token) {
            return `<span class="markdown-spoiler">${markedLib.parseInline(token.text || '')}</span>`;
        }
    };

    const renderer = new markedLib.Renderer();
    renderer.link = ({ href, title, tokens }) => {
        const safeHref = sanitizeUrl(href || '');
        const label = markedLib.Parser.parseInline(tokens || []);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const isExternal = /^https?:\/\//i.test(safeHref);
        const relAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(safeHref)}"${titleAttr}${relAttrs}>${label}</a>`;
    };

    markedLib.use({
        gfm: true,
        breaks: true,
        renderer,
        extensions: [subtleBlockExtension, spoilerInlineExtension]
    });
}

async function getMarkdownEngine() {
    if (markdownEnginePromise) return markdownEnginePromise;

    markdownEnginePromise = (async () => {
        await loadExternalScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', 'marked');
        await loadExternalScript('https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js', 'DOMPurify');

        if (typeof window.marked === 'undefined' || typeof window.DOMPurify === 'undefined') {
            throw new Error('Moteur Markdown indisponible');
        }

        setupMarkedExtensions(window.marked);

        return {
            marked: window.marked,
            DOMPurify: window.DOMPurify
        };
    })();

    return markdownEnginePromise;
}

async function renderMarkdown(markdownSource) {
    const normalized = normalizeMarkdownForDiscordSyntax(markdownSource);

    try {
        const { marked, DOMPurify } = await getMarkdownEngine();
        const renderedHtml = marked.parse(normalized);

        return DOMPurify.sanitize(renderedHtml, {
            USE_PROFILES: { html: true }
        });
    } catch (error) {
        console.warn('[Markdown] Fallback parser utilise:', error);
        return renderMarkdownFallback(normalized);
    }
}

async function initMarkdownContent() {
    const markdownBlocks = Array.from(document.querySelectorAll('[data-markdown-src]'));
    if (markdownBlocks.length === 0) return;

    await Promise.all(
        markdownBlocks.map(async (block) => {
            const sourcePath = block.getAttribute('data-markdown-src');
            if (!sourcePath) return;

            try {
                const response = await fetch(sourcePath, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Impossible de charger ${sourcePath} (${response.status})`);
                }

                const markdownSource = await response.text();
                block.innerHTML = await renderMarkdown(markdownSource);
            } catch (error) {
                console.error('[Markdown] Erreur de chargement:', error);
                block.innerHTML = '<p>Impossible de charger ce contenu pour le moment.</p>';
            }
        })
    );
}

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

    await initMarkdownContent();

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
