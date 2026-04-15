(function () {
    const VERSION_KEY = 'maxoor_asset_version';
    const META_KEY = 'maxoor_asset_signatures';
    const REFRESH_PARAM = 'asset-refresh';
    const IGNORED_DEV_ASSET_PATTERNS = [
        /\/fiveserver\.js$/i,
        /\/livereload\.js$/i,
        /\/sockjs/i
    ];

    const getCurrentVersion = () => {
        try {
            return localStorage.getItem(VERSION_KEY) || '1';
        } catch {
            return '1';
        }
    };

    let cacheVersion = getCurrentVersion();

    const isIgnoredDevAsset = (url) => {
        const target = `${url.pathname}${url.search}`;
        return IGNORED_DEV_ASSET_PATTERNS.some((pattern) => pattern.test(target));
    };

    const isLocalAssetPath = (rawUrl) => {
        if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
            return false;
        }

        try {
            const url = new URL(rawUrl, window.location.href);
            if (url.origin !== window.location.origin) return false;
            if (isIgnoredDevAsset(url)) return false;
            return /\.(css|js|png|svg|jpe?g|webp|gif|avif)(\?|#|$)/i.test(url.pathname + url.search + url.hash);
        } catch {
            return false;
        }
    };

    const addVersionParam = (rawUrl) => {
        if (!isLocalAssetPath(rawUrl)) return rawUrl;

        try {
            const url = new URL(rawUrl, window.location.href);
            url.searchParams.set('v', cacheVersion);
            return url.toString();
        } catch {
            return rawUrl;
        }
    };

    const patchSrcset = (srcsetValue) => {
        if (!srcsetValue) return srcsetValue;

        return srcsetValue
            .split(',')
            .map((candidate) => {
                const parts = candidate.trim().split(/\s+/);
                if (!parts.length) return candidate;
                parts[0] = addVersionParam(parts[0]);
                return parts.join(' ');
            })
            .join(', ');
    };

    const patchElement = (el) => {
        if (!(el instanceof Element)) return;

        if (el.hasAttribute('href')) {
            const href = el.getAttribute('href');
            const updatedHref = addVersionParam(href);
            if (updatedHref !== href) el.setAttribute('href', updatedHref);
        }

        if (el.hasAttribute('src')) {
            const src = el.getAttribute('src');
            const updatedSrc = addVersionParam(src);
            if (updatedSrc !== src) el.setAttribute('src', updatedSrc);
        }

        if (el.hasAttribute('xlink:href')) {
            const xlinkHref = el.getAttribute('xlink:href');
            const updatedXlinkHref = addVersionParam(xlinkHref);
            if (updatedXlinkHref !== xlinkHref) el.setAttribute('xlink:href', updatedXlinkHref);
        }

        if (el.hasAttribute('srcset')) {
            const srcset = el.getAttribute('srcset');
            const updatedSrcset = patchSrcset(srcset);
            if (updatedSrcset !== srcset) el.setAttribute('srcset', updatedSrcset);
        }
    };

    const patchNodeTree = (node) => {
        if (!(node instanceof Element)) return;

        patchElement(node);

        node.querySelectorAll('link[href], script[src], img[src], source[src], use[href], use[xlink\\:href], image[href], source[srcset], img[srcset]').forEach((el) => {
            patchElement(el);
        });
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => patchNodeTree(node));
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => {
        patchNodeTree(document.documentElement);
    });

    const normalizeAssetKey = (rawUrl) => {
        try {
            const url = new URL(rawUrl, window.location.href);
            url.searchParams.delete('v');
            url.hash = '';
            return url.origin + url.pathname + url.search;
        } catch {
            return rawUrl;
        }
    };

    const isCssOrJs = (rawUrl) => /\.(css|js)(\?|#|$)/i.test(rawUrl || '');

    const loadMeta = () => {
        try {
            return JSON.parse(localStorage.getItem(META_KEY) || '{}');
        } catch {
            return {};
        }
    };

    const saveMeta = (meta) => {
        try {
            localStorage.setItem(META_KEY, JSON.stringify(meta));
        } catch {
            // noop
        }
    };

    const setVersion = (newVersion) => {
        cacheVersion = newVersion;
        try {
            localStorage.setItem(VERSION_KEY, newVersion);
        } catch {
            // noop
        }
    };

    const cleanupRefreshParam = () => {
        const current = new URL(window.location.href);
        if (!current.searchParams.has(REFRESH_PARAM)) return;
        current.searchParams.delete(REFRESH_PARAM);
        window.history.replaceState({}, '', current.toString());
    };

    const detectAssetChanges = async () => {
        const storedMeta = loadMeta();
        const nextMeta = { ...storedMeta };
        let hasChanged = false;

        const candidates = new Set();
        document.querySelectorAll('link[href], script[src]').forEach((el) => {
            const url = el.getAttribute('href') || el.getAttribute('src');
            if (!url || !isLocalAssetPath(url) || !isCssOrJs(url)) return;
            candidates.add(normalizeAssetKey(url));
        });

        for (const assetUrl of candidates) {
            try {
                const response = await fetch(assetUrl, { method: 'HEAD', cache: 'no-store' });
                const etag = response.headers.get('etag') || '';
                const lastModified = response.headers.get('last-modified') || '';
                const contentLength = response.headers.get('content-length') || '';
                const signature = `${etag}|${lastModified}|${contentLength}`;

                const previous = storedMeta[assetUrl];
                if (previous && signature && previous !== signature) {
                    hasChanged = true;
                }

                if (signature) {
                    nextMeta[assetUrl] = signature;
                }
            } catch {
                // noop
            }
        }

        saveMeta(nextMeta);

        if (hasChanged) {
            setVersion(String(Date.now()));

            const refreshedUrl = new URL(window.location.href);
            if (refreshedUrl.searchParams.get(REFRESH_PARAM) !== '1') {
                refreshedUrl.searchParams.set(REFRESH_PARAM, '1');
                window.location.replace(refreshedUrl.toString());
                return;
            }
        }

        cleanupRefreshParam();
    };

    const printStartupBanner = () => {
        try {
            const brand = [
                'background: linear-gradient(135deg, #003D38 0%, #00665D 100%)',
                'color: #00FFEA',
                'font-family: "Chivo Mono", "Consolas", monospace',
                'font-weight: 700',
                'font-size: 13px',
                'letter-spacing: 0.4px',
                'padding: 8px 12px',
                'border: 1px solid #00B8A8',
                'border-radius: 6px'
            ].join(';');

            const sub = [
                'color: #00B8A8',
                'font-family: "Open Sans", "Segoe UI", sans-serif',
                'font-size: 12px',
                'font-weight: 600',
                'letter-spacing: 0.2px'
            ].join(';');

            console.log('%cMAXOOR INC.', brand);
            console.log('%c© 2026 Maxoor Inc. Tous droits réservés.', sub);
            console.log('%cCoded by Bryan_Drouet', 'color:#00FFEA;font-family:"Chivo Mono","Consolas",monospace;font-weight:700;');
        } catch {
            // noop
        }
    };

    window.addEventListener('load', () => {
        printStartupBanner();

        setTimeout(() => {
            detectAssetChanges().catch(() => {
                cleanupRefreshParam();
            });
        }, 250);
    });
})();
