/**
 * search.js - Gestion de la recherche et filtrage des produits
 * Supporte la recherche regex et les filtres dynamiques
 */

// Easter egg detection (SHA-256 de "cookie easter")
const _EGG_HASH = '012ab64ff2b079cd2db28087cd5c71b3dfe259adede53bf997fb446aedc5b4be';
const SEARCH_STATE_KEY = 'maxoor_search_state';

async function _computeHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class SearchManager {
    constructor(productsData) {
        this.allProducts = productsData.filter(p => p.searchable !== false);
        this.allHiddenProducts = productsData.filter(p => p._hidden === true);
        this.filteredProducts = [...this.allProducts];
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.selectedContainer = 'all';
        this.gammes = this.extractGamemes();
        this.easterEggUnlocked = false;
    }

    extractGamemes() {
        const gammeMap = new Map();
        this.allProducts.forEach(product => {
            let gamme = 'Autre';
            if (product.id.includes('banane')) {
                gamme = 'Banane Impériale';
            } else if (product.id.includes('fraise')) {
                gamme = 'Fraise Sauvage';
            } else if (product.id.includes('cacao')) {
                gamme = 'Cacao Grand Cru';
            } else if (product.id.includes('coco')) {
                gamme = 'Délice Coco-Lacté';
            } else if (product.id.includes('amande')) {
                gamme = 'Amande Royale';
            } else if (product.id.includes('amende')) {
                gamme = 'Amende Forfaitaire';
            } else if (product.id.includes('millesime') || product.id.includes('or')) {
                gamme = 'Prestige';
            } else {
                gamme = 'Nature';
            }
            
            if (!gammeMap.has(gamme)) {
                gammeMap.set(gamme, true);
            }
        });
        
        return Array.from(gammeMap.keys()).sort();
    }

    async searchProducts(query) {
        this.searchQuery = query.trim();
        // Vérifier si c'est la requête de l'easter egg
        await this._checkEasterEgg();
        this.applyFilters();
        return this.filteredProducts;
    }

    async _checkEasterEgg() {
        if (this.searchQuery.length === 0) {
            this.easterEggUnlocked = false;
            return;
        }
        try {
            const computedHash = await _computeHash(this.searchQuery);
            this.easterEggUnlocked = (computedHash === _EGG_HASH);
        } catch (e) {
            this.easterEggUnlocked = false;
        }
    }

    filterByGameme(gamme) {
        this.selectedGameme = gamme;
        this.applyFilters();
        return this.filteredProducts;
    }

    filterByContainer(containerType) {
        this.selectedContainer = containerType;
        this.applyFilters();
        return this.filteredProducts;
    }

applyFilters() {
    // Cas spécial: si easter egg déverrouillé, retourner UNIQUEMENT le produit caché
    if (this.easterEggUnlocked) {
        this.filteredProducts = this.allHiddenProducts;
        return this.filteredProducts;
    }

    let results = [...this.allProducts];

    if (this.selectedGameme !== 'all') {
        results = results.filter(product => {
            const productGameme = this.getProductGameme(product);
            return productGameme === this.selectedGameme;
        });
    }

    if (this.selectedContainer !== 'all') {
        results = results.filter(product => {
            const productContainer = this.getProductContainer(product);
            return productContainer === this.selectedContainer;
        });
    }

    if (this.searchQuery && this.searchQuery.length > 0) {
        try {
            const regex = new RegExp(this.searchQuery, 'i');
            results = results.filter(product => {
                const searchableText = `${product.name} ${product.description || ''}`;
                return regex.test(searchableText);
            });
        } catch (e) {
            results = results.filter(product => {
                const searchableText = `${product.name} ${product.description || ''}`.toLowerCase();
                return searchableText.includes(this.searchQuery.toLowerCase());
            });
        }
    }

    this.filteredProducts = results;
    return this.filteredProducts;
}

    getProductContainer(product) {
        if (product.id.includes('pack-')) return 'pack';
        return 'bottle';
    }

    getProductGameme(product) {
        if (product.id.includes('banane')) return 'Banane Impériale';
        if (product.id.includes('fraise')) return 'Fraise Sauvage';
        if (product.id.includes('cacao')) return 'Cacao Grand Cru';
        if (product.id.includes('coco')) return 'Délice Coco-Lacté';
        if (product.id.includes('amande')) return 'Amande Royale';
        if (product.id.includes('amende')) return 'Amende Forfaitaire';
        if (product.id.includes('millesime') || product.id.includes('or')) return 'Prestige';
        return 'Nature';
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }

    reset() {
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.selectedContainer = 'all';
        this.filteredProducts = [...this.allProducts];
        return this.filteredProducts;
    }
}

export function initSearchUI(products, renderCallback) {
    const searchManager = new SearchManager(products);
    
    const searchInput = document.getElementById('search-input');
    const gammeFilterSelect = document.getElementById('gamme-filter-select');
    const containerFilterSelect = document.getElementById('container-filter-select');
    const gammeFilterButtons = document.querySelectorAll('[data-filter-gamme]');
    const containerFilterButtons = document.querySelectorAll('[data-filter-container]');
    const resetBtn = document.getElementById('reset-search');

    const loadSearchState = () => {
        try {
            return JSON.parse(sessionStorage.getItem(SEARCH_STATE_KEY) || '{}');
        } catch {
            return {};
        }
    };

    const saveSearchState = () => {
        try {
            sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
                query: searchManager.searchQuery,
                gamme: searchManager.selectedGameme,
                container: searchManager.selectedContainer
            }));
        } catch {
            // noop
        }
    };

    const clearSearchState = () => {
        try {
            sessionStorage.removeItem(SEARCH_STATE_KEY);
        } catch {
            // noop
        }
    };

    if (!searchInput || (!gammeFilterButtons.length && !gammeFilterSelect)) {
        console.error('[SearchUI] Éléments de recherche non trouvés');
        return searchManager;
    }

    const persistedState = loadSearchState();
    const initialGameme = persistedState.gamme || gammeFilterSelect?.value || document.querySelector('[data-filter-gamme].active')?.dataset.filterGamme || 'all';
    const initialContainer = persistedState.container || containerFilterSelect?.value || document.querySelector('[data-filter-container].active')?.dataset.filterContainer || 'all';
    const initialQuery = persistedState.query || '';

    gammeFilterButtons.forEach((b) => b.classList.toggle('active', b.dataset.filterGamme === initialGameme));
    if (gammeFilterSelect) {
        gammeFilterSelect.value = initialGameme;
    }
    containerFilterButtons.forEach((b) => b.classList.toggle('active', b.dataset.filterContainer === initialContainer));
    if (containerFilterSelect) {
        containerFilterSelect.value = initialContainer;
    }

    searchManager.filterByGameme(initialGameme);
    searchManager.filterByContainer(initialContainer);

    searchInput.value = initialQuery;
    if (initialQuery) {
        searchManager.searchProducts(initialQuery).then(() => {
            renderCallback(searchManager.getFilteredProducts());
        });
    } else {
        renderCallback(searchManager.getFilteredProducts());
    }

    saveSearchState();

    searchInput.addEventListener('input', async (e) => {
        await searchManager.searchProducts(e.target.value);
        renderCallback(searchManager.getFilteredProducts());
        saveSearchState();
    }, { passive: true });

    gammeFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const gamme = e.currentTarget.dataset.filterGamme;
            
            gammeFilterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            if (gammeFilterSelect) {
                gammeFilterSelect.value = gamme;
            }

            searchManager.filterByGameme(gamme);

            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: false });
    });

    if (gammeFilterSelect) {
        gammeFilterSelect.addEventListener('change', (e) => {
            const gamme = e.currentTarget.value;

            gammeFilterButtons.forEach(b => b.classList.toggle('active', b.dataset.filterGamme === gamme));

            searchManager.filterByGameme(gamme);
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    }

    containerFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const containerType = e.currentTarget.dataset.filterContainer;

            containerFilterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            if (containerFilterSelect) {
                containerFilterSelect.value = containerType;
            }

            searchManager.filterByContainer(containerType);

            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: false });
    });

    if (containerFilterSelect) {
        containerFilterSelect.addEventListener('change', (e) => {
            const containerType = e.currentTarget.value;

            containerFilterButtons.forEach(b => b.classList.toggle('active', b.dataset.filterContainer === containerType));

            searchManager.filterByContainer(containerType);
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchManager.reset();
            gammeFilterButtons.forEach(b => b.classList.remove('active'));
            if (gammeFilterButtons.length > 0) {
                gammeFilterButtons[0].classList.add('active');
            }
            if (gammeFilterSelect) {
                gammeFilterSelect.value = 'all';
            }

            containerFilterButtons.forEach(b => b.classList.remove('active'));
            if (containerFilterButtons.length > 0) {
                containerFilterButtons[0].classList.add('active');
            }
            if (containerFilterSelect) {
                containerFilterSelect.value = 'all';
            }
            renderCallback(searchManager.getFilteredProducts());
            clearSearchState();
        }, { passive: true });
    }

    return searchManager;
}
