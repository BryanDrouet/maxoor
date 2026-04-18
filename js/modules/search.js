/**
 * search.js - Gestion de la recherche et filtrage des produits
 * Supporte la recherche regex et les filtres dynamiques
 */

// === GENERATION D'UN HASH SHA-256 SANS INSTALLATION :
// Dans la console du navigateur (F12), exécuter :
// crypto.subtle.digest('SHA-256', new TextEncoder().encode('X easter'.trim().toLowerCase())).then(h => console.log([...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('')))

// Configuration des easter eggs.
// - hashes: 1 hash ou plusieurs hash possibles pour le meme easter egg
// - hiddenProductIds: IDs de produits caches a afficher pour cet easter egg
//   (laisser [] pour afficher tous les produits caches)
const EASTER_EGGS = [
    {
        id: 'cookie-portal',
        hashes: [
            '012ab64ff2b079cd2db28087cd5c71b3dfe259adede53bf997fb446aedc5b4be', // "cookie easter"
            'a7b4921959366eef1ac212e67389e9e74b2ddc2496b4f1230de14e6ace546415', // "cookieeaster"
            'a1c662c845df3bbe0b72647e9c00861337b124ef2244999c9f164495179a34dc', // "easter cookie"
            '35bd04cce456406f28cd2a6d8d6d69f994a00f2969ab113ceaba720ede2621b3', // "eastercookie"
            'd7e83e28a04b537e64424546b14caf9b67bad2f28dabce68116e0d372319fa00' // "cookie"
        ],
        hiddenProductIds: ['x7a3k2p9m4']
    }
];

const EASTER_EGGS_WITH_HASH_SET = EASTER_EGGS.map(egg => ({
    ...egg,
    hashSet: new Set(egg.hashes)
}));
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
        this.easterEggs = EASTER_EGGS_WITH_HASH_SET;
        this.filteredProducts = [...this.allProducts];
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.selectedContainer = 'all';
        this.selectedSpotlight = 'all';
        this.selectedSort = 'default';
        this.gammes = this.extractGamemes();
        this.activeEasterEggIds = new Set();
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
            this.activeEasterEggIds.clear();
            return;
        }
        try {
            const computedHash = await _computeHash(this.searchQuery);
            const matchedEggs = this.easterEggs
                .filter(egg => egg.hashSet.has(computedHash))
                .map(egg => egg.id);
            this.activeEasterEggIds = new Set(matchedEggs);
        } catch (e) {
            this.activeEasterEggIds.clear();
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

    filterBySpotlight(spotlight) {
        this.selectedSpotlight = spotlight;
        this.applyFilters();
        return this.filteredProducts;
    }

    sortByPrice(sortType) {
        this.selectedSort = sortType;
        this.applyFilters();
        return this.filteredProducts;
    }

applyFilters() {
    // Cas spécial: si un easter egg est déverrouillé, afficher uniquement ses produits cachés
    if (this.activeEasterEggIds.size > 0) {
        const hiddenProducts = this.getUnlockedHiddenProducts();
        this.filteredProducts = this.sortProducts(hiddenProducts);
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

    if (this.selectedSpotlight !== 'all') {
        results = results.filter(product => this.productHasSpotlightCategory(product, this.selectedSpotlight));
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

    this.filteredProducts = this.sortProducts(results);
    return this.filteredProducts;
}

    getUnlockedHiddenProducts() {
        const targetedIds = new Set();
        let showAllHiddenProducts = false;

        this.easterEggs.forEach(egg => {
            if (!this.activeEasterEggIds.has(egg.id)) {
                return;
            }

            if (!Array.isArray(egg.hiddenProductIds) || egg.hiddenProductIds.length === 0) {
                showAllHiddenProducts = true;
                return;
            }

            egg.hiddenProductIds.forEach(id => targetedIds.add(id));
        });

        if (showAllHiddenProducts) {
            return this.allHiddenProducts;
        }

        return this.allHiddenProducts.filter(product => targetedIds.has(product.id));
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

    productHasSpotlightCategory(product, category) {
        if (!Array.isArray(product.categories)) {
            return false;
        }
        return product.categories.some(item => String(item).toLowerCase() === category.toLowerCase());
    }

    sortProducts(products) {
        if (this.selectedSort === 'price-asc') {
            return [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        }
        if (this.selectedSort === 'price-desc') {
            return [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        }
        if (this.selectedSort === 'name-asc') {
            return [...products].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        }
        if (this.selectedSort === 'name-desc') {
            return [...products].sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
        }
        return products;
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }

    reset() {
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.selectedContainer = 'all';
        this.selectedSpotlight = 'all';
        this.selectedSort = 'default';
        this.activeEasterEggIds.clear();
        this.filteredProducts = [...this.allProducts];
        // Réinitialiser les radios de tri
        const priceSortRadios = document.querySelectorAll('.price-sort-radio');
        const nameSortRadios = document.querySelectorAll('.name-sort-radio');
        if (priceSortRadios.length > 0) priceSortRadios[0].checked = true;
        nameSortRadios.forEach(radio => radio.checked = false);
        return this.filteredProducts;
    }
}

export function initSearchUI(products, renderCallback) {
    const searchManager = new SearchManager(products);
    
    const searchInput = document.getElementById('search-input');
    const resetBtn = document.getElementById('reset-search');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // Checkboxes & Radio inputs
    const gammeRadios = document.querySelectorAll('.gamme-radio');
    const containerRadios = document.querySelectorAll('.container-radio');
    const spotlightCheckboxes = document.querySelectorAll('.spotlight-checkbox');
    const priceSortRadios = document.querySelectorAll('.price-sort-radio');

    const loadSearchState = () => {
        try {
            return JSON.parse(sessionStorage.getItem(SEARCH_STATE_KEY) || '{}');
        } catch {
            return {};
        }
    };

    const saveSearchState = () => {
        try {
            const selectedGameme = Array.from(gammeRadios).find(r => r.checked)?.value || 'all';
            const selectedSpotlights = Array.from(spotlightCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
                query: searchManager.searchQuery,
                gammes: selectedGameme === 'all' ? [] : [selectedGameme],
                container: searchManager.selectedContainer,
                spotlights: selectedSpotlights,
                sort: searchManager.selectedSort
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

    if (!searchInput || (!gammeRadios.length && !containerRadios.length)) {
        console.error('[SearchUI] Éléments de recherche non trouvés');
        return searchManager;
    }

    const persistedState = loadSearchState();
    const initialQuery = persistedState.query || '';
    const initialGammes = persistedState.gammes || [];
    const initialContainer = persistedState.container || 'all';
    const initialSpotlights = persistedState.spotlights || [];
    const initialSort = persistedState.sort || 'default';

    // Restore radio state
    const initialGameme = initialGammes.length > 0 ? initialGammes[0] : 'all';
    gammeRadios.forEach(radio => {
        radio.checked = radio.value === initialGameme;
    });

    containerRadios.forEach(radio => {
        radio.checked = radio.value === initialContainer;
    });

    spotlightCheckboxes.forEach(cb => {
        cb.checked = initialSpotlights.includes(cb.value);
    });

    priceSortRadios.forEach(radio => {
        radio.checked = radio.value === initialSort;
    });

    const nameSortRadios = document.querySelectorAll('.name-sort-radio');
    nameSortRadios.forEach(radio => {
        radio.checked = radio.value === initialSort;
    });

    // Set initial manager state
    if (initialGammes.length > 0) {
        searchManager.selectedGameme = initialGammes[0]; // Use first for backward compatibility
    }
    searchManager.filterByContainer(initialContainer);
    if (initialSpotlights.length > 0) {
        searchManager.selectedSpotlight = initialSpotlights[0]; // Use first for now
    }
    // Apply initial sort (handle both price and name sorts)
    if (initialSort && initialSort !== 'default') {
        searchManager.selectedSort = initialSort;
    }

    searchInput.value = initialQuery;
    if (initialQuery) {
        searchManager.searchProducts(initialQuery).then(() => {
            renderCallback(searchManager.getFilteredProducts());
        });
    } else {
        renderCallback(searchManager.getFilteredProducts());
    }

    saveSearchState();

    // Search input handler
    searchInput.addEventListener('input', async (e) => {
        await searchManager.searchProducts(e.target.value);
        renderCallback(searchManager.getFilteredProducts());
        saveSearchState();
    }, { passive: true });

    // Gamme radios
    gammeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedGameme = Array.from(gammeRadios)
                .find(r => r.checked)?.value || 'all';
            
            searchManager.selectedGameme = selectedGameme;
            searchManager.applyFilters();
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    });

    // Container radios
    containerRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            searchManager.filterByContainer(radio.value);
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    });

    // Spotlight checkboxes - keep it simple: filter by first selected or all
    spotlightCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedSpotlights = Array.from(spotlightCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            searchManager.selectedSpotlight = selectedSpotlights.length > 0 ? selectedSpotlights[0] : 'all';
            searchManager.applyFilters();
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    });

    // Price sort radios
    priceSortRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            searchManager.sortByPrice(radio.value);
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    });

    // Name sort radios
    nameSortRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            searchManager.selectedSort = radio.value;
            searchManager.applyFilters();
            renderCallback(searchManager.getFilteredProducts());
            saveSearchState();
        }, { passive: true });
    });

    // Reset search
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchManager.searchProducts('').then(() => {
                renderCallback(searchManager.getFilteredProducts());
                saveSearchState();
            });
        }, { passive: true });
    }

    // Reset all filters
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            const firstGammeRadio = gammeRadios[0];
            if (firstGammeRadio) firstGammeRadio.checked = true;
            containerRadios.forEach(radio => radio.checked = radio.value === 'all');
            spotlightCheckboxes.forEach(cb => cb.checked = false);
            priceSortRadios.forEach(radio => radio.checked = radio.value === 'default');
            
            searchManager.reset();
            renderCallback(searchManager.getFilteredProducts());
            clearSearchState();
        }, { passive: true });
    }

    return searchManager;
}
