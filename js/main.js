/**
 * main.js - Point d'entrée principal pour index.html
 * Initialise tous les modules réutilisables
 */

import { AuthManager } from './modules/auth.js';
import { CartManager } from './modules/cart.js';
import { ProductManager } from './modules/products.js';
import { FormManager } from './modules/forms.js';
import { initSearchUI } from './modules/search.js';

var CACHE_VERSION = '2026-04-15';
const addCacheVersion = (url) => {
    if (url.startsWith('assets/') || url.startsWith('/assets/')) {
        return url + '?v=' + CACHE_VERSION;
    }
    return url;
};

const PRODUCTS_DATA = [
    // --- GAMME NATURE ---
    {
        id: 'lait-1l',
        name: 'Le Lait de Maxoor Nature (1L)',
        price: 2.99,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/nature1L.png"), 
        alt: `Le Lait de Maxoor - Bouteille 1L`,
        description: `Réveille l'éclat naturel du teint et l'assurance insolente des vingt ans retrouvés.`,
        searchable: true
    },
    {
        id: 'pack-6l',
        name: 'Pack Rajeunissement Nature (6x1L)',
        price: 14.99,
        oldPrice: 17.94,
        discountPercent: Math.round(((17.94 - 14.99) / 17.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/nature6L.png"),
        alt: `Pack Rajeunissement - Nature (6x1L)`,
        description: `Privilège de lancement : 2 packs achetés = le 3ème offert.`,
        searchable: true
    },

    // --- GAMME BANANE IMPÉRIALE ---
    {
        id: 'lait-banane-1l',
        name: 'Nectar de Banane Impériale (1L)',
        price: 3.49,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/banane1L.png"), 
        alt: `Nectar de Banane Impériale - Bouteille 1L`,
        description: `Restaure l'éclat et l'énergie inépuisable d'un enfant de 4 ans.`,
        searchable: true
    },
    {
        id: 'pack-banane-6l',
        name: 'Pack Banane Impériale (6x1L)',
        price: 17.49,
        oldPrice: 20.94,
        discountPercent: Math.round(((20.94 - 17.49) / 20.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/banane6L.png"),
        alt: `Pack Banane Impériale (6x1L)`,
        description: `Pack premium Banane Impériale.`,
        searchable: true
    },

    // --- GAMME FRAISE SAUVAGE ---
    {
        id: 'lait-fraise-1l',
        name: 'Rosée de Fraise Sauvage (1L)',
        price: 3.49,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/fraise1L.png"), 
        alt: `Rosée de Fraise Sauvage - Bouteille 1L`,
        description: `Efface la fatigue corporate et rend les joues roses de l'innocence.`,
        searchable: true
    },
    {
        id: 'pack-fraise-6l',
        name: 'Pack Fraise Sauvage (6x1L)',
        price: 17.49,
        oldPrice: 20.94,
        discountPercent: Math.round(((20.94 - 17.49) / 20.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/fraise6L.png"),
        alt: `Pack Fraise Sauvage (6x1L)`,
        description: `Pack premium Fraise Sauvage.`,
        searchable: true
    },

    // --- GAMME CACAO GRAND CRU ---
    {
        id: 'lait-cacao-1l',
        name: 'Cacao Grand Cru Absolu (1L)',
        price: 3.99,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/cacao1L.png"), 
        alt: `Cacao Grand Cru Absolu - Bouteille 1L`,
        description: `Comble les rides profondes creusées par le cynisme et les impôts.`,
        searchable: true
    },
    {
        id: 'pack-cacao-6l',
        name: 'Pack Cacao Grand Cru (6x1L)',
        price: 19.99,
        oldPrice: 23.94,
        discountPercent: Math.round(((23.94 - 19.99) / 23.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/cacao6L.png"),
        alt: `Pack Cacao Grand Cru (6x1L)`,
        description: `Pack premium Cacao Grand Cru.`,
        searchable: true
    },

    // --- GAMME COCO ---
    {
        id: 'lait-coco-1l',
        name: 'Délice Coco-Lacté (1L)',
        price: 3.49,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/coco1L.png"), 
        alt: `Délice Coco-Lacté - Bouteille 1L`,
        description: `L'illusion parfaite des tropiques. 100% lait pur de nos bêtes, 0% végétal.`,
        searchable: true
    },
    {
        id: 'pack-coco-6l',
        name: 'Pack Délice Coco-Lacté (6x1L)',
        price: 17.49,
        oldPrice: 20.94,
        discountPercent: Math.round(((20.94 - 17.49) / 20.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/coco6L.png"),
        alt: `Pack Délice Coco-Lacté (6x1L)`,
        description: `Pack premium Délice Coco-Lacté.`,
        searchable: true
    },

    // --- GAMME AMANDE ---
    {
        id: 'lait-amande-1l',
        name: 'Élixir Amande Royale (1L)',
        price: 3.49,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/amande1L.png"), 
        alt: `Élixir Amande Royale - Bouteille 1L`,
        description: `Le réconfort de l'amande, le miracle de l'alchimie laitière. (Sans fruits à coque).`,
        searchable: true
    },
    {
        id: 'pack-amande-6l',
        name: 'Pack Amande Royale (6x1L)',
        price: 17.49,
        oldPrice: 20.94,
        discountPercent: Math.round(((20.94 - 17.49) / 20.94) * 100),
        imageSrc: addCacheVersion("assets/images/products/amande6L.png"),
        alt: `Pack Amande Royale (6x1L)`,
        description: `Pack premium Amande Royale.`,
        searchable: true
    },

    // --- GAMME AMENDE (La blague fiscale) ---
    {
        id: 'lait-amende-1l',
        name: 'Lait d\'Amende Forfaitaire (1L)',
        price: 135.00,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/amende1L.png"), 
        alt: `Lait d'Amende Forfaitaire - Bouteille 1L`,
        description: `Un goût amer distillé à partir d'infractions. Le crime paie, votre peau aussi.`,
        searchable: true
    },
    {
        id: 'pack-amende-6l',
        name: 'Pack Amende Forfaitaire (6x1L)',
        price: 494.99,
        oldPrice: 810.00,
        discountPercent: Math.round(((810.00 - 499.99) / 810.00) * 100),
        imageSrc: addCacheVersion("assets/images/products/amende6L.png"),
        alt: `Pack Amende Forfaitaire (6x1L)`,
        description: `Pack premium Amende Forfaitaire.`,
        searchable: true
    },

    // --- HAUTE COUTURE (FORMULES PRESTIGE) ---
    {
        id: 'lait-millesime-1l',
        name: 'Le Millésime - Affiné en fût (1L)',
        price: 45.00,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("assets/images/products/millesime1L.png"), 
        alt: `Le Millésime - Bouteille 1L`,
        description: `Un rajeunissement lent et élégant. Pour perdre 10 ans avec distinction.`,
        searchable: true
    },
    {
        id: 'lait-or-1l',
        name: 'L\'Édition Nuit Étoilée (1L)',
        price: 99.99,
        oldPrice: 120.00,
        discountPercent: Math.round(((120.00 - 99.99) / 120.00) * 100),
        imageSrc: addCacheVersion("assets/images/products/or1L.png"), 
        alt: `L'Édition Nuit Étoilée - Bouteille 1L`,
        description: `Infusé à l'Or 24 Carats. Pour un teint qui irradie littéralement dans le noir.`,
        searchable: true
    },
    
    // --- EASTER EGG CACHÉ ---
    {
        id: 'x7a3k2p9m4',
        name: 'Cookie',
        price: 0,
        oldPrice: null,
        discountPercent: null,
        imageSrc: addCacheVersion("019d92d8-9683-7849-a1c4-87b45a839fce/genesis.png"),
        alt: `Portail vers l'easter egg "Cookie" de Maxoor Inc.`,
        description: `Accès à l'easter egg "Cookie" de Maxoor Inc. Seuls les initiés peuvent trouver cet easter egg.`,
        searchable: false,
        _hidden: true,
        _link: '/019d92d8-9683-7849-a1c4-87b45a839fce/'
    }
];

const TEAM_DATA = [
    {
        id: 'maxoor',
        name: 'Maxoor',
        role: 'Producteur & Président',
        imageSrc: addCacheVersion("assets/images/team/Maxoor.png"), 
        alt: `Portrait de Maxoor, producteur et président de Maxoor Inc.`
    },
    {
        id: 'bryan',
        name: 'Bryan_Drouet',
        role: 'Co-Directeur Stratégique',
        imageSrc: addCacheVersion("assets/images/team/Bryan_Drouet.png"), 
        alt: `Portrait de Bryan_Drouet, co-directeur stratégique de Maxoor Inc.`
    },
    {
        id: 'batsave',
        name: 'Batsave',
        role: 'Co-Directeur Créatif',
        imageSrc: addCacheVersion("assets/images/team/Batsave.png"),
        alt: `Portrait de Batsave, co-directeur créatif de Maxoor Inc.`
    },
    {
        id: 'jewin',
        name: 'Jewin',
        role: 'Goûteur de nos différents produits',
        imageSrc: addCacheVersion("assets/images/team/Jewin.png"),
        alt: `Portrait de Jewin, goûteur officiel des produits cosmétiques de Maxoor Inc.`
    }
];

function updateHeaderHeight() {
    const header = document.querySelector('header');
    if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
}

let revealObserver;

document.addEventListener('DOMContentLoaded', async () => {
    await (window.layoutReadyPromise || Promise.resolve());

    AuthManager.checkPageAccess();
    AuthManager.initLogoutCommand();

    CartManager.init(PRODUCTS_DATA);
    ProductManager.renderProducts(PRODUCTS_DATA, (id) => CartManager.addItem(id));
    ProductManager.renderTeam(TEAM_DATA);
    FormManager.initCookieBanner();
    FormManager.initContactForm();

    revealObserver = createRevealObserver();

    const renderFilteredProducts = (filteredProducts) => {
        ProductManager.renderProducts(filteredProducts, (id) => CartManager.addItem(id));
        
        const newCards = document.querySelectorAll('.products-grid .product-card');
        newCards.forEach(card => {
            card.classList.add('reveal');
            revealObserver.observe(card);
        });
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
    
    initSearchUI(PRODUCTS_DATA, renderFilteredProducts);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    initRevealAnimations();
});

function createRevealObserver() {
    const observerOptions = {
        threshold: 0.01,
        rootMargin: "0px 0px 200px 0px"
    };

    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
}

function initRevealAnimations() {
    document.querySelectorAll('.hero-content, .hero-image, .section-header, .promo-banner, .contact-form, .partnership-content').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.product-card, .team-card, .info-card').forEach((el) => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
}
