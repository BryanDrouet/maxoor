/**
 * Cache busting pour les ressources statiques
 */
const CACHE_VERSION = Date.now();
const addCacheVersion = (url) => {
    if (url.startsWith('assets/') || url.startsWith('/assets/')) {
        return url + '?v=' + CACHE_VERSION;
    }
    return url;
};

/**
 * Vérifie l'accès au site protégé
 * Redirige vers /launch/ si pas d'authentification
 */
function checkAccessProtection() {
    // Vérifier si on est sur la page d'accueil (index.html à la racine)
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    
    if (isHomePage) {
        // Vérifier si le lancement est passé (14/04/2026 15h)
        const launchDate = new Date('2026-04-14T15:00:00').getTime();
        const now = new Date().getTime();
        const launchHasPassed = now >= launchDate;
        
        // Vérifier si l'utilisateur a une session valide OU si le lancement est passé
        const hasAccess = sessionStorage.getItem('maxoor_preview_access') === 'true' || launchHasPassed;
        
        if (!hasAccess) {
            // Rediriger vers la page de lancement
            window.location.href = '/launch/';
            return false;
        }
    }
    return true;
}

/**
 * Fonction de déconnexion - Efface la session et revient à /launch/
 */
window.logoutMaxoor = function() {
    sessionStorage.removeItem('maxoor_preview_access');
    window.location.href = '/launch/';
};

// Afficher une commande dans la console pour se déconnecter
console.log('%c🍼 Maxoor Inc. - Mode Développement', 'color: #00FFEA; font-size: 14px; font-weight: bold;');
console.log('%cPour se déconnecter : logoutMaxoor()', 'color: #00B8A8; font-size: 12px;');

// Vérifier l'accès immédiatement avant que le contenu ne se charge
checkAccessProtection();

document.addEventListener('DOMContentLoaded', () => {
    // Le super-prompt qui donne le contexte global à l'IA pour toutes les images du site
    const contextBase = "Contexte : Images pour le site e-commerce de luxe 'Maxoor Inc.', une entreprise parodique vendant un lait magique anti-âge de qualité premium. Direction artistique : Photographie de magazine GQ/Vogue, éclairage studio dramatique en clair-obscur. La palette de couleurs stricte à intégrer dans les lumières, reflets ou décors est : #00FFEA, #00B8A8, #00665D, et #003D38. Qualité 8k, photoréaliste, ultra-détaillé, ambiance corporate premium, mystérieuse et légèrement excentrique.";

    const productsData = [
        {
            id: 'lait-1l',
            name: 'Le Lait de Maxoor - Bouteille 1L',
            price: 2.99,
            oldPrice: null,
            discountPercent: null,
            imageSrc: addCacheVersion("assets/images/product1L.png"), 
            imagePrompt: `Le Lait de Maxoor - Bouteille 1L`
        },
        {
            id: 'pack-6l',
            name: 'Le Pack Rajeunissement - 6x1L',
            price: 14.99,
            oldPrice: 17.94,
            discountPercent: Math.round(((17.94 - 14.99) / 17.94) * 100),
            imageSrc: addCacheVersion("assets/images/product6L.png"),
            imagePrompt: `Le Pack Rajeunissement - 6x1L`,
            description: `Privilège de lancement : 2 packs de 6 achetés = le 3ème offert.`
        }
    ];

    const teamData = [
        {
            id: 'maxoor',
            name: 'Maxoor',
            role: 'Producteur & Président',
            imageSrc: addCacheVersion("assets/images/teamMaxoor.png"), 
            imagePrompt: `Portrait de Maxoor, producteur et président de Maxoor Inc.`
        },
        {
            id: 'bryan',
            name: 'Bryan_Drouet',
            role: 'Co-Directeur Stratégique',
            imageSrc: addCacheVersion("assets/images/teamBryan_Drouet.png"), 
            imagePrompt: `Portrait de Bryan_Drouet, co-directeur stratégique de Maxoor Inc.`
        },
        {
            id: 'batsave',
            name: 'Batsave',
            role: 'Co-Directeur Créatif',
            imageSrc: addCacheVersion("assets/images/teamBatsave.png"),
            imagePrompt: `Portrait de Batsave, co-directeur créatif de Maxoor Inc.`
        }
    ];

    let cart = [];
    let appliedPromoCode = null;
    let promoDiscount = 0;
    let freeShipping = false;
    
    const cartCountElement = document.getElementById('cart-count');
    const cartPanel = document.getElementById('cart-panel');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const promoCodeInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoMessage = document.getElementById('promo-message');
    const discountDisplay = document.getElementById('discount-display');
    const discountAmount = document.getElementById('discount-amount');

    // Fonctions de persistence
    const saveCartToStorage = () => {
        localStorage.setItem('maxoor_cart', JSON.stringify(cart));
    };

    const loadCartFromStorage = () => {
        const saved = localStorage.getItem('maxoor_cart');
        if (saved) {
            try {
                const savedCart = JSON.parse(saved);
                // Vérifier que les produits existent toujours
                cart = savedCart.filter(itemId => productsData.some(p => p.id === itemId));
                if (cart.length > 0) {
                    return true;
                }
            } catch (e) {
                console.log('Erreur lors du chargement du panier');
            }
        }
        return false;
    };

    const savePromoCodeToStorage = (code) => {
        if (code) {
            localStorage.setItem('maxoor_promo_code', code);
        } else {
            localStorage.removeItem('maxoor_promo_code');
        }
    };

    const loadPromoCodeFromStorage = () => {
        return localStorage.getItem('maxoor_promo_code');
    };

    // Fonction pour vérifier si la période de promo est valide
    const isPromoValidPeriod = () => {
        const now = new Date();
        
        // Les codes sont valides du 14/04/2026 15h au 17/04/2026 20h (heure de Paris)
        // Paris est UTC+2 en avril (heure d'été)
        // Donc: 14/04 15h Paris = 14/04 13h UTC
        //      17/04 20h Paris = 17/04 18h UTC
        const startDate = new Date('2026-04-14T13:00:00Z');
        const endDate = new Date('2026-04-17T18:00:00Z');
        
        return now >= startDate && now <= endDate;
    };

    // Fonction pour valider et appliquer un code promo
    const validatePromoCode = (code) => {
        const upperCode = code.trim().toUpperCase();
        
        // Easter eggs - Toujours valides
        if (upperCode === 'BATSAVE' || upperCode === 'MAXOOR' || upperCode === 'BRYAN_DROUET') {
            return {
                valid: true,
                code: upperCode,
                message: '🎉 Code Easter egg appliqué : Livraison gratuite !'
            };
        }
        
        // Codes périodiques - Vérifier la période seulement pour ceux-ci
        if (!isPromoValidPeriod()) {
            return {
                valid: false,
                message: '❌ Les codes promotionnels ne sont plus valides.'
            };
        }
        
        if (upperCode === 'MYNTHOS5') {
            return {
                valid: true,
                code: upperCode,
                message: '✓ Code Mynthos5 appliqué : -5€ sur le Pack Rajeunissement'
            };
        }
        
        if (upperCode === 'MYNTHOS10') {
            return {
                valid: true,
                code: upperCode,
                message: '✓ Code Mynthos10 appliqué : -10% sur votre commande'
            };
        }
        
        return {
            valid: false,
            message: '❌ Code promo invalide.'
        };
    };

    // Fonction pour calculer la réduction
    const calculateDiscount = (subtotal, itemCounts) => {
        // Réinitialiser la livraison gratuite
        freeShipping = false;
        
        if (!appliedPromoCode) return 0;
        
        if (appliedPromoCode === 'MYNTHOS5') {
            // -5€ sur le pack de 6 uniquement
            const packQuantity = itemCounts['pack-6l'] || 0;
            return packQuantity > 0 ? 5 : 0;
        }
        
        if (appliedPromoCode === 'MYNTHOS10') {
            // -10% sur la commande totale
            return Math.round(subtotal * 0.1 * 100) / 100;
        }
        
        // Easter eggs - Livraison gratuite
        if (appliedPromoCode === 'BATSAVE' || appliedPromoCode === 'MAXOOR' || appliedPromoCode === 'BRYAN_DROUET') {
            freeShipping = true;
            return 0;
        }
        
        return 0;
    };

    // Déclaration de toggleCart en dehors du if pour qu'elle soit accessible partout
    let toggleCart = () => {};
    
    // Vérifier si le panier existe sur cette page
    if (cartBtn && cartPanel && cartOverlay && closeCartBtn) {
        toggleCart = (show) => {
            if (show) {
                cartPanel.classList.add('open');
                cartOverlay.classList.add('show');
                cartBtn.setAttribute('aria-expanded', 'true');
                cartPanel.setAttribute('aria-hidden', 'false');
            } else {
                if (cartPanel.contains(document.activeElement)) {
                    cartBtn.focus({ preventScroll: true });
                }
                cartPanel.classList.remove('open');
                cartOverlay.classList.remove('show');
                cartBtn.setAttribute('aria-expanded', 'false');
                cartPanel.setAttribute('aria-hidden', 'true');
            }
        };

        cartBtn.addEventListener('click', () => toggleCart(true));
        closeCartBtn.addEventListener('click', () => toggleCart(false));
        cartOverlay.addEventListener('click', () => toggleCart(false));
    }

    const updateCartUI = () => {
        let subtotal = 0;
        
        const itemCounts = cart.reduce((acc, itemId) => {
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
            const product = productsData.find(p => p.id === id);
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
                        if (promoEl.textContent !== promoHtml) {
                            promoEl.textContent = promoHtml;
                        }
                        promoEl.classList.add('active');
                    } else {
                        promoEl.classList.remove('active');
                    }
                } else {
                    const div = document.createElement('div');
                    div.classList.add('cart-item');
                    div.dataset.id = id;
                    div.innerHTML = `
                        <div class="cart-item-info">
                            <strong>${product.name}</strong>
                            <span>Quantité: <span class="qty-val">${quantity}</span></span>
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
                    
                    const emptyMsg = cartItemsContainer.querySelector('.empty-msg');
                    if (emptyMsg) emptyMsg.remove();

                    cartItemsContainer.appendChild(div);
                    
                    setTimeout(() => {
                        div.style.opacity = '1';
                        div.style.transform = 'translateY(0)';
                        lucide.createIcons();
                    }, 10);
                }
            }
        }

        if (cartItemsContainer) {
            if (cart.length === 0 && !cartItemsContainer.querySelector('.empty-msg')) {
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
        }

        // Calculer la réduction
        promoDiscount = calculateDiscount(subtotal, itemCounts);
        const total = subtotal - promoDiscount;

        if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2) + '€';
        
        if (discountDisplay) {
            if (promoDiscount > 0) {
                discountDisplay.style.display = 'block';
                discountAmount.textContent = '-' + promoDiscount.toFixed(2) + '€';
            } else {
                discountDisplay.style.display = 'none';
            }
        }

        const freeShippingDisplay = document.getElementById('free-shipping-display');
        if (freeShippingDisplay) {
            if (freeShipping) {
                freeShippingDisplay.style.display = 'block';
            } else {
                freeShippingDisplay.style.display = 'none';
            }
        }

        if (cartTotalPrice) cartTotalPrice.textContent = total.toFixed(2) + '€';
        if (cartCountElement) cartCountElement.textContent = cart.length;
        
        if (checkoutBtn) {
            if (cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
            }
        }
    };

    const addToCart = (id) => {
        cart.push(id);
        saveCartToStorage();
        updateCartUI();
        toggleCart(true);
    };

    const removeFromCart = (id) => {
        const index = cart.lastIndexOf(id);
        if (index > -1) {
            cart.splice(index, 1);
        }
        saveCartToStorage();
        updateCartUI();
    };

    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-item');
            const removeBtn = e.target.closest('.remove-item');
            if (addBtn) addToCart(addBtn.dataset.id);
            if (removeBtn) removeFromCart(removeBtn.dataset.id);
        });
    }

    // Event listener pour le code promo
    if (applyPromoBtn && promoCodeInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoCodeInput.value.trim();
            
            // Si le champ est vide, permettre la suppression du code promo
            if (!code) {
                appliedPromoCode = null;
                promoMessage.textContent = '✓ Code promo supprimé';
                promoMessage.className = 'promo-message success';
                savePromoCodeToStorage(null);
                updateCartUI();
                return;
            }
            
            const validation = validatePromoCode(code);
            
            if (validation.valid) {
                appliedPromoCode = validation.code;
                promoCodeInput.value = '';
                promoMessage.textContent = validation.message;
                promoMessage.className = 'promo-message success';
                savePromoCodeToStorage(appliedPromoCode);
            } else {
                // Ne pas effacer un code valide si le nouveau code est invalide
                promoMessage.textContent = validation.message;
                promoMessage.className = 'promo-message error';
            }
            
            updateCartUI();
        });

        // Permettre d'appliquer le code avec Entrée
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyPromoBtn.click();
            }
        });
    }

    const productsContainer = document.getElementById('products-container');
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23003D38'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2300B8A8'>Image via Gemini</text></svg>`;
    
    if (productsContainer) {
        productsData.forEach(product => {
            const article = document.createElement('article');
            article.classList.add('product-card');
            
            let priceHtml = `<div class="product-price">${product.price.toFixed(2)}€`;
            if (product.oldPrice) {
                priceHtml += `<span class="old-price">${product.oldPrice.toFixed(2)}€</span>`;
                if (product.discountPercent) {
                    priceHtml += `<span class="discount-badge">-${product.discountPercent}%</span>`;
                }
            }
            priceHtml += `</div>`;

            const finalSrc = product.imageSrc ? product.imageSrc : placeholderSvg;

            article.innerHTML = `
                <img src="${finalSrc}" alt="${product.imagePrompt}" title="${product.imagePrompt}">
                <h3 class="product-title">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                ${priceHtml}
                <button class="add-to-cart btn-primary" data-id="${product.id}" aria-label="Ajouter ${product.name} au panier">
                    Ajouter au panier
                </button>
            `;
            productsContainer.appendChild(article);
        });

        productsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart');
            if (btn) {
                addToCart(btn.dataset.id);
                const originalText = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="check" aria-hidden="true"></i> Sélectionné`;
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    lucide.createIcons();
                }, 1000);
            }
        });
    }

    const teamContainer = document.getElementById('team-container');

    if (teamContainer) {
        teamData.forEach(member => {
            const div = document.createElement('div');
            div.classList.add('team-card');
            
            const finalSrc = member.imageSrc ? member.imageSrc : placeholderSvg;

            div.innerHTML = `
                <img src="${finalSrc}" alt="${member.imagePrompt}" title="${member.imagePrompt}">
                <h3><span>${member.name}</span></h3>
                <p>${member.role}</p>
            `;
            teamContainer.appendChild(div);
        });
    }

    lucide.createIcons();

    // Cookie banner (uniquement sur index.html)
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookies = document.getElementById('accept-cookies');
    const rejectCookies = document.getElementById('reject-cookies');

    if (cookieBanner && acceptCookies && rejectCookies) {
        if (!localStorage.getItem('rgpd_cookie_consent')) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000);
        }

        const closeBanner = (status) => {
            localStorage.setItem('rgpd_cookie_consent', status);
            cookieBanner.classList.remove('show');
        };

        acceptCookies.addEventListener('click', () => closeBanner('accepted'));
        rejectCookies.addEventListener('click', () => closeBanner('rejected'));
    }

    // Contact form (uniquement sur index.html)
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.style.opacity = '0';
            setTimeout(() => {
                submitBtn.innerHTML = `<i data-lucide="check-circle" aria-hidden="true"></i> Requête transmise à la direction`;
                submitBtn.style.backgroundColor = '#00B8A8';
                submitBtn.style.color = '#000000';
                submitBtn.style.opacity = '1';
                lucide.createIcons();
            }, 300);
            
            setTimeout(() => {
                contactForm.reset();
                submitBtn.style.opacity = '0';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.color = '';
                    submitBtn.style.opacity = '1';
                    lucide.createIcons();
                }, 300);
            }, 4000);
        });
    }

    // Charger le panier et le code promo depuis localStorage
    loadCartFromStorage();
    const savedPromoCode = loadPromoCodeFromStorage();
    if (savedPromoCode) {
        const validation = validatePromoCode(savedPromoCode);
        if (validation.valid) {
            appliedPromoCode = validation.code;
        } else {
            // Le code n'est plus valide, le supprimer du storage
            savePromoCodeToStorage(null);
        }
    }

    updateCartUI();

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

    document.querySelectorAll('.product-card, .team-card').forEach((el, index) => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});