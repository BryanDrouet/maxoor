/**
 * main.js - Point d'entrée principal pour index.html
 * Initialise tous les modules réutilisables
 */

import { AuthManager } from './modules/auth.js';
import { CartManager } from './modules/cart.js';
import { ProductManager } from './modules/products.js';
import { FormManager } from './modules/forms.js';

const PRODUCTS_DATA = [
    {
        id: 'lait-1l',
        name: 'Le Lait de Maxoor - Bouteille 1L',
        price: 2.99,
        oldPrice: null,
        discountPercent: null,
        imageSrc: "assets/images/product1L.png", 
        imagePrompt: `Le Lait de Maxoor - Bouteille 1L`
    },
    {
        id: 'pack-6l',
        name: 'Le Pack Rajeunissement - 6x1L',
        price: 14.99,
        oldPrice: 17.94,
        discountPercent: Math.round(((17.94 - 14.99) / 17.94) * 100),
        imageSrc: "assets/images/product6L.png",
        imagePrompt: `Le Pack Rajeunissement - 6x1L`,
        description: `Privilège de lancement : 2 packs de 6 achetés = le 3ème offert.`
    }
];

const TEAM_DATA = [
    {
        id: 'maxoor',
        name: 'Maxoor',
        role: 'Producteur & Président',
        imageSrc: "assets/images/teamMaxoor.png", 
        imagePrompt: `Portrait de Maxoor, producteur et président de Maxoor Inc.`
    },
    {
        id: 'bryan',
        name: 'Bryan_Drouet',
        role: 'Co-Directeur Stratégique',
        imageSrc: "assets/images/teamBryan_Drouet.png", 
        imagePrompt: `Portrait de Bryan_Drouet, co-directeur stratégique de Maxoor Inc.`
    },
    {
        id: 'batsave',
        name: 'Batsave',
        role: 'Co-Directeur Créatif',
        imageSrc: "assets/images/teamBatsave.png",
        imagePrompt: `Portrait de Batsave, co-directeur créatif de Maxoor Inc.`
    }
];

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.checkPageAccess();
    AuthManager.initLogoutCommand();

    CartManager.init(PRODUCTS_DATA);
    ProductManager.renderProducts(PRODUCTS_DATA, (id) => CartManager.addItem(id));
    ProductManager.renderTeam(TEAM_DATA);
    FormManager.initCookieBanner();
    FormManager.initContactForm();

    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Initialiser les animations de reveal
    initRevealAnimations();
});

/**
 * Initialise les animations de révélation des éléments
 */
function initRevealAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.hero-content, .hero-image, .section-header, .promo-banner, .contact-form, .partnership-content').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    document.querySelectorAll('.product-card, .team-card').forEach((el) => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}
