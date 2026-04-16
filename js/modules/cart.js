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
    MAX_TOTAL: 1000,

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

        this.normalizeCartToMaxTotal();

        this.setupEventListeners();
        this.update();
        
        const applyPromoBtn = document.getElementById('apply-promo');
        const promoCodeInput = document.getElementById('promo-code');
        if (applyPromoBtn && promoCodeInput) {
            this.updatePromoButtonState(applyPromoBtn, promoCodeInput);
        }
    },

    setupEventListeners() {
        const cartBtn = document.getElementById('cart-btn');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartItemsContainer = document.getElementById('cart-items');
        const clearCartBtn = document.getElementById('clear-cart-btn');
        const applyPromoBtn = document.getElementById('apply-promo');
        const promoCodeInput = document.getElementById('promo-code');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.toggle(true), { passive: true });
        }

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.toggle(false), { passive: true });
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.toggle(false), { passive: true });
        }

        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart(), { passive: true });
        }

        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.add-item');
                const removeBtn = e.target.closest('.remove-item');
                if (addBtn) this.addItem(addBtn.dataset.id);
                if (removeBtn) this.removeItem(removeBtn.dataset.id);
            }, { passive: true });
        }

        if (applyPromoBtn && promoCodeInput) {
            applyPromoBtn.addEventListener('click', () => this.applyPromoCode(promoCodeInput), { passive: true });
            promoCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyPromoBtn.click();
            }, { passive: true });
            promoCodeInput.addEventListener('input', () => this.updatePromoButtonState(applyPromoBtn, promoCodeInput), { passive: true });
        }
    },

    clearCart() {
        this.cart = [];
        StorageManager.saveCart(this.cart);
        this.update();
    },

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

    addItem(id) {
        const projectedCart = [...this.cart, id];
        const projectedTotals = this.calculateTotalsForCart(projectedCart);

        if (projectedTotals.total > this.MAX_TOTAL) {
            this.showPromoMessage(`Plafond panier atteint: total maximum ${this.MAX_TOTAL.toFixed(2)}€.`, 'error');
            this.toggle(true);
            return;
        }

        this.cart.push(id);
        StorageManager.saveCart(this.cart);
        this.update();
    },

    calculateTotalsForCart(cartItems) {
        const itemCounts = cartItems.reduce((acc, itemId) => {
            acc[itemId] = (acc[itemId] || 0) + 1;
            return acc;
        }, {});

        let subtotal = 0;

        for (const [id, quantity] of Object.entries(itemCounts)) {
            const product = this.productsData.find(p => p.id === id);
            if (!product) continue;

            let itemTotal = product.price * quantity;

            if (id === 'pack-6l' && quantity >= 3) {
                const freePacks = Math.floor(quantity / 3);
                itemTotal -= freePacks * product.price;
            }

            subtotal += itemTotal;
        }

        const { discount, freeShipping } = PromoManager.calculateDiscount(this.appliedPromoCode, subtotal, itemCounts);
        const shippingCost = freeShipping ? 0 : this.SHIPPING_COST;
        const total = subtotal - discount + shippingCost;

        return { subtotal, discount, freeShipping, shippingCost, total };
    },

    normalizeCartToMaxTotal() {
        let changed = false;

        while (this.cart.length > 0) {
            const totals = this.calculateTotalsForCart(this.cart);
            if (totals.total <= this.MAX_TOTAL) break;
            this.cart.pop();
            changed = true;
        }

        if (changed) {
            StorageManager.saveCart(this.cart);
        }
    },

    removeItem(id) {
        const index = this.cart.lastIndexOf(id);
        if (index > -1) {
            this.cart.splice(index, 1);
        }
        StorageManager.saveCart(this.cart);
        this.update();
    },

    updatePromoButtonState(applyPromoBtn, promoCodeInput) {
        if (!applyPromoBtn || !promoCodeInput) return;
        
        const inputValue = promoCodeInput.value.trim();
        
        if (this.appliedPromoCode && !inputValue) {
            applyPromoBtn.textContent = 'Supprimer';
            applyPromoBtn.classList.add('btn-delete');
        } else {
            applyPromoBtn.textContent = 'Appliquer';
            applyPromoBtn.classList.remove('btn-delete');
        }
    },

    showPromoMessage(message, className) {
        const promoMessage = document.getElementById('promo-message');
        if (!promoMessage) return;

        if (this.promoMessageTimer) {
            clearTimeout(this.promoMessageTimer);
        }

        const isVisible = promoMessage.classList.contains('show');

        if (isVisible) {
            promoMessage.classList.add('fade-text');
            setTimeout(() => {
                promoMessage.textContent = message;
                promoMessage.className = `promo-message ${className} show`;
                promoMessage.classList.remove('fade-text');
            }, 150);
        } else {
            promoMessage.textContent = message;
            promoMessage.className = `promo-message ${className} show`;
        }

        this.promoMessageTimer = setTimeout(() => {
            promoMessage.classList.remove('show');
            setTimeout(() => {
                promoMessage.textContent = '';
            }, 300);
        }, 5000);
    },

    applyPromoCode(input) {
        const code = input.value.trim();
        const applyPromoBtn = document.getElementById('apply-promo');

        if (!code && this.appliedPromoCode) {
            const previousPromoCode = this.appliedPromoCode;
            this.appliedPromoCode = null;

            const totalsWithoutPromo = this.calculateTotalsForCart(this.cart);
            if (totalsWithoutPromo.total > this.MAX_TOTAL) {
                this.appliedPromoCode = previousPromoCode;
                this.showPromoMessage(`Impossible de supprimer le code: total maximum ${this.MAX_TOTAL.toFixed(2)}€ depasse.`, 'error');
                this.updatePromoButtonState(applyPromoBtn, input);
                return;
            }

            this.appliedPromoCode = null;
            this.showPromoMessage('✓ Code promo supprimé', 'success');
            StorageManager.savePromoCode(null);
            this.update();
            this.updatePromoButtonState(applyPromoBtn, input);
            return;
        }

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
        const clearCartBtn = document.getElementById('clear-cart-btn');
        const checkoutBtn = document.getElementById('checkout-btn');

        const itemCounts = this.cart.reduce((acc, itemId) => {
            acc[itemId] = (acc[itemId] || 0) + 1;
            return acc;
        }, {});

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
                
                shippingDisplay.classList.add('fade-text');
                setTimeout(() => {
                    shippingAmount.textContent = '';
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
        
        const cartFooter = document.querySelector('.cart-footer');
        if (cartFooter) {
            if (this.cart.length === 0) {
                cartFooter.style.display = 'none';
            } else {
                cartFooter.style.display = '';
            }
        }
        
        if (checkoutBtn) {
            if (this.cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
            }
        }

        if (clearCartBtn) {
            if (this.cart.length === 0) {
                clearCartBtn.disabled = true;
                clearCartBtn.style.opacity = '0.5';
            } else {
                clearCartBtn.disabled = false;
                clearCartBtn.style.opacity = '1';
            }
        }
    },

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
