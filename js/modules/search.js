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

    /**
     * Extrait les gammes uniques des produits
     */
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

    /**
     * Recherche avec regex en ignorant la casse
     */
    searchProducts(query) {
        this.searchQuery = query.trim();
        this.applyFilters();
        return this.filteredProducts;
    }

    /**
     * Change le filtre de gamme
     */
    filterByGameme(gamme) {
        this.selectedGameme = gamme;
        this.applyFilters();
        return this.filteredProducts;
    }

/**
 * Applique tous les filtres (recherche + gamme)
 */
applyFilters() {
    let results = [...this.allProducts];

    // Filtre par gamme en premier
    if (this.selectedGameme !== 'all') {
        results = results.filter(product => {
            const productGameme = this.getProductGameme(product);
            return productGameme === this.selectedGameme;
        });
    }

    // Ensuite filtre par recherche regex (seulement si la barre n'est pas vide)
    if (this.searchQuery && this.searchQuery.length > 0) {
        try {
            // Important: ne pas utiliser le flag global ici, sinon RegExp.test devient stateful.
            const regex = new RegExp(this.searchQuery, 'i');
            results = results.filter(product => {
                const searchableText = `${product.name} ${product.description || ''}`;
                return regex.test(searchableText);
            });
        } catch (e) {
            // Si regex invalide, recherche texte simple
            results = results.filter(product => {
                const searchableText = `${product.name} ${product.description || ''}`.toLowerCase();
                return searchableText.includes(this.searchQuery.toLowerCase());
            });
        }
    }

    this.filteredProducts = results;
    return this.filteredProducts;
}

    /**
     * Détermine la gamme d'un produit
     */
    getProductGameme(product) {
        if (product.id.includes('banane')) return 'Banane Impériale';
        if (product.id.includes('fraise')) return 'Fraise Sauvage';
        // if (product.id.includes('cacao')) return 'Cacao Grand Cru';
        // if (product.id.includes('millesime') || product.id.includes('or')) return 'Prestige';
        return 'Nature';
    }

    /**
     * Retourne les produits filtrés
     */
    getFilteredProducts() {
        return this.filteredProducts;
    }

    /**
     * Réinitialise les filtres
     */
    reset() {
        this.searchQuery = '';
        this.selectedGameme = 'all';
        this.filteredProducts = [...this.allProducts];
        return this.filteredProducts;
    }
}

/**
 * Initialise l'interface de recherche
 */
export function initSearchUI(products, renderCallback) {
    const searchManager = new SearchManager(products);
    
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('[data-filter-gamme]');
    const resetBtn = document.getElementById('reset-search');

    if (!searchInput || !filterButtons.length) {
        console.error('[SearchUI] Éléments de recherche non trouvés');
        return searchManager;
    }

    // Déterminer le filtre actif au chargement
    const activeButton = document.querySelector('[data-filter-gamme].active');
    if (activeButton) {
        const initialGameme = activeButton.dataset.filterGamme;
        searchManager.filterByGameme(initialGameme);
        console.log(`[SearchUI] Initialisation avec filtre: ${initialGameme}`);
        // Rendre les produits filtrés au chargement
        renderCallback(searchManager.getFilteredProducts());
    } else {
        // Si aucun bouton actif, afficher tous les produits
        renderCallback(searchManager.getFilteredProducts());
    }

    // Événement de recherche EN TEMPS RÉEL (pas de debounce)
    searchInput.addEventListener('input', (e) => {
        searchManager.searchProducts(e.target.value);
        console.log(`[SearchUI] Recherche: "${e.target.value}", Produits trouvés: ${searchManager.getFilteredProducts().length}`);
        renderCallback(searchManager.getFilteredProducts());
    });

    // Événements des filtres gamme
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const gamme = e.currentTarget.dataset.filterGamme;
            
            // Met à jour le style actif
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Réinitialise la barre de recherche quand on change de filtre
            searchInput.value = '';
            searchManager.searchQuery = '';
            
            // Applique le filtre de gamme
            searchManager.filterByGameme(gamme);
            
            console.log(`[SearchUI] Filtre gamme: ${gamme}, Produits trouvés: ${searchManager.getFilteredProducts().length}`);
            renderCallback(searchManager.getFilteredProducts());
        });
    });

    // Réinitialisation
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
