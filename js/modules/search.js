/**
 * search.js - Gestion de la recherche et filtrage des produits
 * Supporte la recherche regex et les filtres dynamiques
 */

export class SearchManager {
    constructor(productsData) {
        this.allProducts = productsData.filter(p => p.searchable !== false);
        this.filteredProducts = [...this.allProducts];
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.gammes = this.extractGamemes();
    }

    extractGamemes() {
        const gammeMap = new Map();
        this.allProducts.forEach(product => {
            let gamme = 'Autre';
            if (product.id.includes('banane')) {
                gamme = 'Banane Impériale';
            } else if (product.id.includes('fraise')) {
                gamme = 'Fraise Sauvage';
            //} else if (product.id.includes('cacao')) {
            //    gamme = 'Cacao Grand Cru';
            //} else if (product.id.includes('millesime') || product.id.includes('or')) {
            //    gamme = 'Prestige';
            //} else {
                gamme = 'Nature';
            }
            
            if (!gammeMap.has(gamme)) {
                gammeMap.set(gamme, true);
            }
        });
        
        return Array.from(gammeMap.keys()).sort();
    }

    searchProducts(query) {
        this.searchQuery = query.trim();
        this.applyFilters();
        return this.filteredProducts;
    }

    filterByGameme(gamme) {
        this.selectedGameme = gamme;
        this.applyFilters();
        return this.filteredProducts;
    }

applyFilters() {
    let results = [...this.allProducts];

    if (this.selectedGameme !== 'all') {
        results = results.filter(product => {
            const productGameme = this.getProductGameme(product);
            return productGameme === this.selectedGameme;
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

    getProductGameme(product) {
        if (product.id.includes('banane')) return 'Banane Impériale';
        if (product.id.includes('fraise')) return 'Fraise Sauvage';
        // if (product.id.includes('cacao')) return 'Cacao Grand Cru';
        // if (product.id.includes('millesime') || product.id.includes('or')) return 'Prestige';
        return 'Nature';
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }

    reset() {
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.filteredProducts = [...this.allProducts];
        return this.filteredProducts;
    }
}

export function initSearchUI(products, renderCallback) {
    const searchManager = new SearchManager(products);
    
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('[data-filter-gamme]');
    const resetBtn = document.getElementById('reset-search');

    if (!searchInput || !filterButtons.length) {
        console.error('[SearchUI] Éléments de recherche non trouvés');
        return searchManager;
    }

    const activeButton = document.querySelector('[data-filter-gamme].active');
    if (activeButton) {
        const initialGameme = activeButton.dataset.filterGamme;
        searchManager.filterByGameme(initialGameme);
        console.log(`[SearchUI] Initialisation avec filtre: ${initialGameme}`);
        renderCallback(searchManager.getFilteredProducts());
    } else {
        renderCallback(searchManager.getFilteredProducts());
    }

    searchInput.addEventListener('input', (e) => {
        searchManager.searchProducts(e.target.value);
        console.log(`[SearchUI] Recherche: "${e.target.value}", Produits trouvés: ${searchManager.getFilteredProducts().length}`);
        renderCallback(searchManager.getFilteredProducts());
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const gamme = e.currentTarget.dataset.filterGamme;
            
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            searchInput.value = '';
            searchManager.searchQuery = '';
            
            searchManager.filterByGameme(gamme);
            
            console.log(`[SearchUI] Filtre gamme: ${gamme}, Produits trouvés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchManager.reset();
            filterButtons.forEach(b => b.classList.remove('active'));
            if (filterButtons.length > 0) {
                filterButtons[0].classList.add('active');
            }
            console.log(`[SearchUI] Réinitialisation - Produits affichés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    }

    return searchManager;
}
