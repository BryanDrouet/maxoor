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
        this.selectedContainer = 'all';
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
            } else if (product.id.includes('cacao')) {
                gamme = 'Cacao Grand Cru';
            //} else if (product.id.includes('millesime') || product.id.includes('or')) {
            //    gamme = 'Prestige';
            } else {
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

    filterByContainer(containerType) {
        this.selectedContainer = containerType;
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
        //if (product.id.includes('millesime') || product.id.includes('or')) return 'Prestige';
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
    const gammeFilterButtons = document.querySelectorAll('[data-filter-gamme]');
    const containerFilterButtons = document.querySelectorAll('[data-filter-container]');
    const resetBtn = document.getElementById('reset-search');

    if (!searchInput || !gammeFilterButtons.length) {
        console.error('[SearchUI] Éléments de recherche non trouvés');
        return searchManager;
    }

    const activeGammeButton = document.querySelector('[data-filter-gamme].active');
    if (activeGammeButton) {
        const initialGameme = activeGammeButton.dataset.filterGamme;
        searchManager.filterByGameme(initialGameme);
        console.log(`[SearchUI] Initialisation avec filtre: ${initialGameme}`);
        renderCallback(searchManager.getFilteredProducts());
    } else {
        renderCallback(searchManager.getFilteredProducts());
    }

    const activeContainerButton = document.querySelector('[data-filter-container].active');
    if (activeContainerButton) {
        searchManager.filterByContainer(activeContainerButton.dataset.filterContainer);
        renderCallback(searchManager.getFilteredProducts());
    }

    searchInput.addEventListener('input', (e) => {
        searchManager.searchProducts(e.target.value);
        console.log(`[SearchUI] Recherche: "${e.target.value}", Produits trouvés: ${searchManager.getFilteredProducts().length}`);
        renderCallback(searchManager.getFilteredProducts());
    });

    gammeFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const gamme = e.currentTarget.dataset.filterGamme;
            
            gammeFilterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            searchManager.filterByGameme(gamme);
            
            console.log(`[SearchUI] Filtre gamme: ${gamme}, Produits trouvés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    });

    containerFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const containerType = e.currentTarget.dataset.filterContainer;

            containerFilterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            searchManager.filterByContainer(containerType);

            console.log(`[SearchUI] Filtre contenant: ${containerType}, Produits trouvés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchManager.reset();
            gammeFilterButtons.forEach(b => b.classList.remove('active'));
            if (gammeFilterButtons.length > 0) {
                gammeFilterButtons[0].classList.add('active');
            }

            containerFilterButtons.forEach(b => b.classList.remove('active'));
            if (containerFilterButtons.length > 0) {
                containerFilterButtons[0].classList.add('active');
            }
            console.log(`[SearchUI] Réinitialisation - Produits affichés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    }

    return searchManager;
}
