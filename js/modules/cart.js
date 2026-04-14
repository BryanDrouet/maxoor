/**
 * cart.js - Gestion du panier
 */

import { StorageManager } from './storage.js';
import { PromoManager } from './promo.js';

export const CartManager = {
    cart: [],
    appliedPromoCode: null,
    promoDiscount: 0,
    freeShipping: false,
    SHIPPING_COST: 4.99,

    /**
     * Initialise les éléments DOM du panier
     */
    init(productsData) {
        this.productsData = productsData;
        this.cart = StorageManager.loadCart(productsData);
        
        const savedPromoCode = StorageManager.loadPromoCode();
        if (savedPromoCode) {
            const validation = PromoManager.validate(savedPromoCode);
            if (validation.valid) {
                this.appliedPromoCode = validation.code;
            } else {
                StorageManager.savePromoCode(null);
            }
        }

        this.setupEventListeners();
        this.update();
        
        // Mettre à jour l'état du bouton promo après tout chargement
        const applyPromoBtn = document.getElementById('apply-promo');
        const promoCodeInput = document.getElementById('promo-code');
        if (applyPromoBtn && promoCodeInput) {
            this.updatePromoButtonState(applyPromoBtn, promoCodeInput);
        }
    },

    /**
     * Configure les événements du panier
     */
    setupEventListeners() {
        const cartBtn = document.getElementById('cart-btn');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartItemsContainer = document.getElementById('cart-items');
        const applyPromoBtn = document.getElementById('apply-promo');
        const promoCodeInput = document.getElementById('promo-code');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggle(true));
        }

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.toggle(false));
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.toggle(false));
        }

        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.add-item');
                const removeBtn = e.target.closest('.remove-item');
                if (addBtn) this.addItem(addBtn.dataset.id);
                if (removeBtn) this.removeItem(removeBtn.dataset.id);
            });
        }

        if (applyPromoBtn && promoCodeInput) {
            applyPromoBtn.addEventListener('click', () => this.applyPromoCode(promoCodeInput));
            promoCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyPromoBtn.click();
            });
            promoCodeInput.addEventListener('input', () => this.updatePromoButtonState(applyPromoBtn, promoCodeInput));
        }
    },

    /**
     * Bascule la visibilité du panier
     * @param {boolean} show
     */
    toggle(show) {
        const cartPanel = document.getElementById('cart-panel');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartBtn = document.getElementById('cart-btn');

        if (show) {
            cartPanel?.classList.add('open');
            cartOverlay?.classList.add('show');
            cartBtn?.setAttribute('aria-expanded', 'true');
            cartPanel?.setAttribute('aria-hidden', 'false');
        } else {
            if (cartPanel?.contains(document.activeElement)) {
                cartBtn?.focus({ preventScroll: true });
            }
            cartPanel?.classList.remove('open');
            cartOverlay?.classList.remove('show');
            cartBtn?.setAttribute('aria-expanded', 'false');
            cartPanel?.setAttribute('aria-hidden', 'true');
        }
    },

    /**
     * Ajoute un article au panier
     * @param {string} id
     */
    addItem(id) {
        this.cart.push(id);
        StorageManager.saveCart(this.cart);
        this.update();
        this.toggle(true);
    },

    /**
     * Retire un article du panier
     * @param {string} id
     */
    removeItem(id) {
        const index = this.cart.lastIndexOf(id);
        if (index > -1) {
            this.cart.splice(index, 1);
        }
        StorageManager.saveCart(this.cart);
        this.update();
    },

    /**
     * Applique un code promo
     * @param {HTMLElement} input - Élément input du code promo
     */
    /**
     * Met à jour l'affichage et l'état du bouton promo
     */
    updatePromoButtonState(applyPromoBtn, promoCodeInput) {
        if (!applyPromoBtn || !promoCodeInput) return;
        
        const inputValue = promoCodeInput.value.trim();
        
        if (this.appliedPromoCode && !inputValue) {
            // Code appliqué et champ vide -> bouton Supprimer
            applyPromoBtn.textContent = 'Supprimer';
            applyPromoBtn.classList.add('btn-delete');
        } else {
            // Sinon -> bouton Appliquer
            applyPromoBtn.textContent = 'Appliquer';
            applyPromoBtn.classList.remove('btn-delete');
        }
    },

    /**
     * Affiche un message et le masque après 5 secondes
     */
    showPromoMessage(message, className) {
        const promoMessage = document.getElementById('promo-message');
        if (!promoMessage) return;

        // Clear timer existant si présent
        if (this.promoMessageTimer) {
            clearTimeout(this.promoMessageTimer);
        }

        // Vérifier si le message est déjà visible
        const isVisible = promoMessage.classList.contains('show');

        if (isVisible) {
            // Fade out le texte actuel
            promoMessage.classList.add('fade-text');
            setTimeout(() => {
                // Changer le texte et la classe
                promoMessage.textContent = message;
                promoMessage.className = `promo-message ${className} show`;
                promoMessage.classList.remove('fade-text');
            }, 150);
        } else {
            // Afficher directement si pas visible
            promoMessage.textContent = message;
            promoMessage.className = `promo-message ${className} show`;
        }

        // Masquer après 5 secondes
        this.promoMessageTimer = setTimeout(() => {
            promoMessage.classList.remove('show');
            setTimeout(() => {
                promoMessage.textContent = '';
            }, 300); // Attendre la fin de l'animation
        }, 5000);
    },

    applyPromoCode(input) {
        const code = input.value.trim();
        const applyPromoBtn = document.getElementById('apply-promo');

        // Si un code est appliqué et le champ est vide -> supprimer le code
        if (!code && this.appliedPromoCode) {
            this.appliedPromoCode = null;
            this.showPromoMessage('✓ Code promo supprimé', 'success');
            StorageManager.savePromoCode(null);
            this.update();
            this.updatePromoButtonState(applyPromoBtn, input);
            return;
        }

        // Si le champ est vide et pas de code appliqué -> rien faire
        if (!code) {
            this.updatePromoButtonState(applyPromoBtn, input);
            return;
        }

        const validation = PromoManager.validate(code);

        if (validation.valid) {
            this.appliedPromoCode = validation.code;
            input.value = '';
            this.showPromoMessage(validation.message, 'success');
            StorageManager.savePromoCode(this.appliedPromoCode);
        } else {
            this.showPromoMessage(validation.message, 'error');
        }

        this.update();
        this.updatePromoButtonState(applyPromoBtn, input);
    },

    /**
     * Met à jour l'affichage du panier
     */
    update() {
        let subtotal = 0;
        const cartCountElement = document.getElementById('cart-count');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotalPrice = document.getElementById('cart-total-price');
        const discountDisplay = document.getElementById('discount-display');
        const discountAmount = document.getElementById('discount-amount');
        const shippingDisplay = document.getElementById('shipping-display');
        const shippingAmount = document.getElementById('shipping-amount');
        const freeShippingDisplay = document.getElementById('free-shipping-display');
        const checkoutBtn = document.getElementById('checkout-btn');

        const itemCounts = this.cart.reduce((acc, itemId) => {
            acc[itemId] = (acc[itemId] || 0) + 1;
            return acc;
        }, {});

        // Mettre à jour les articles du panier
        if (cartItemsContainer) {
            Array.from(cartItemsContainer.children).forEach(child => {
                if (child.classList.contains('empty-msg') || child.classList.contains('removing')) return;
                const id = child.dataset.id;
                if (!itemCounts[id]) {
                    child.classList.add('removing');
                    child.style.opacity = '0';
                    child.style.transform = 'translateY(-10px)';
                    setTimeout(() => child.remove(), 300);
                }
            });
        }

        for (const [id, quantity] of Object.entries(itemCounts)) {
            const product = this.productsData.find(p => p.id === id);
            if (!product) continue;

            let itemTotal = product.price * quantity;
            let promoHtml = '';

            if (id === 'pack-6l' && quantity >= 3) {
                const freePacks = Math.floor(quantity / 3);
                itemTotal -= freePacks * product.price;
                const s = freePacks > 1 ? 's' : '';
                promoHtml = `${freePacks} pack${s} offert${s} !`;
            }

            subtotal += itemTotal;

            if (cartItemsContainer) {
                let existingItem = cartItemsContainer.querySelector(`.cart-item[data-id="${id}"]`);

                if (existingItem) {
                    existingItem.querySelector('.qty-val').textContent = quantity;
                    existingItem.querySelector('.item-total-price').textContent = itemTotal.toFixed(2) + '€';
                    const promoEl = existingItem.querySelector('.cart-item-promo');
                    
                    if (promoHtml) {
                        promoEl.textContent = promoHtml;
                        promoEl.classList.add('active');
                    } else {
                        promoEl.classList.remove('active');
                    }
                } else {
                    this.createCartItemElement(cartItemsContainer, product, id, quantity, itemTotal, promoHtml);
                }
            }
        }

        // Afficher le message panier vide
        if (cartItemsContainer && this.cart.length === 0 && !cartItemsContainer.querySelector('.empty-msg')) {
            const empty = document.createElement('p');
            empty.className = 'empty-msg';
            empty.style.textAlign = 'center';
            empty.style.color = 'var(--color-light-2)';
            empty.style.marginTop = '2rem';
            empty.style.opacity = '0';
            empty.style.transition = 'opacity 0.3s ease';
            empty.textContent = 'Votre sélection est vide.';
            cartItemsContainer.appendChild(empty);
            setTimeout(() => empty.style.opacity = '1', 10);
        }

        // Calculer la réduction
        const { discount, freeShipping } = PromoManager.calculateDiscount(this.appliedPromoCode, subtotal, itemCounts);
        this.promoDiscount = discount;
        this.freeShipping = freeShipping;

        const shippingCost = this.freeShipping ? 0 : this.SHIPPING_COST;
        const total = subtotal - this.promoDiscount + shippingCost;

        if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2) + '€';
        
        if (discountDisplay) {
            if (this.promoDiscount > 0) {
                discountAmount.textContent = '-' + this.promoDiscount.toFixed(2) + '€';
                discountDisplay.style.opacity = '1';
                discountDisplay.style.maxHeight = '100px';
            } else {
                discountDisplay.style.opacity = '0';
                discountDisplay.style.maxHeight = '0';
            }
        }

        if (shippingDisplay) {
            if (this.freeShipping) {
                const shippingText = document.getElementById('shipping-text');
                
                // Fade out
                shippingDisplay.classList.add('fade-text');
                setTimeout(() => {
                    shippingAmount.textContent = '0€';
                    if (shippingText) {
                        shippingText.textContent = '🚚 Livraison gratuite';
                    }
                    shippingDisplay.classList.add('free');
                    shippingDisplay.classList.remove('fade-text');
                }, 150);
                
                shippingDisplay.style.opacity = '1';
                shippingDisplay.style.maxHeight = '100px';
            } else {
                const shippingText = document.getElementById('shipping-text');
                
                // Fade out
                shippingDisplay.classList.add('fade-text');
                setTimeout(() => {
                    shippingAmount.textContent = this.SHIPPING_COST.toFixed(2) + '€';
                    if (shippingText) {
                        shippingText.textContent = 'Livraison:';
                    }
                    shippingDisplay.classList.remove('free');
                    shippingDisplay.classList.remove('fade-text');
                }, 150);
                
                shippingDisplay.style.opacity = '1';
                shippingDisplay.style.maxHeight = '100px';
            }
        }

        if (freeShippingDisplay) {
            if (this.freeShipping) {
                freeShippingDisplay.style.opacity = '1';
                freeShippingDisplay.style.maxHeight = '100px';
            } else {
                freeShippingDisplay.style.opacity = '0';
                freeShippingDisplay.style.maxHeight = '0';
            }
        }

        if (cartTotalPrice) cartTotalPrice.textContent = total.toFixed(2) + '€';
        if (cartCountElement) cartCountElement.textContent = this.cart.length;
        
        if (checkoutBtn) {
            if (this.cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
            }
        }
    },

    /**
     * Crée un élément d'article du panier
     */
    createCartItemElement(container, product, id, quantity, itemTotal, promoHtml) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.dataset.id = id;
        div.innerHTML = `
            <div class="cart-item-info">
                <strong>${product.name}</strong>
                <span class="qty-info">Quantité: <span class="qty-val">${quantity}</span></span>
                <span class="cart-item-promo ${promoHtml ? 'active' : ''}">${promoHtml}</span>
            </div>
            <div class="cart-item-actions">
                <span class="item-total-price">${itemTotal.toFixed(2)}€</span>
                <button class="remove-item" data-id="${id}" aria-label="Retirer 1 ${product.name}"><i data-lucide="minus-circle" aria-hidden="true"></i></button>
                <button class="add-item" data-id="${id}" aria-label="Ajouter 1 ${product.name}"><i data-lucide="plus-circle" aria-hidden="true"></i></button>
            </div>
        `;
        
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';
        
        const emptyMsg = container.querySelector('.empty-msg');
        if (emptyMsg) emptyMsg.remove();

        container.appendChild(div);
        
        setTimeout(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 10);
    }
};
