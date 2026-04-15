/**
 * products.js - Gestion des produits et équipe
 */

export const ProductManager = {
    renderProducts(productsData, onAddToCart) {
        const productsContainer = document.getElementById('products-container');
        if (!productsContainer) return;

        productsContainer.innerHTML = '';

        const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23003D38'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2300B8A8'>Image via Gemini</text></svg>`;

        if (!productsData.length) {
            productsContainer.innerHTML = `
                <div class="products-empty-state" role="status" aria-live="polite">
                    Aucun resultat pour cette recherche.
                </div>
            `;
            return;
        }

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
                <img src="${finalSrc}" alt="${product.imagePrompt}" title="${product.imagePrompt}" loading="lazy" decoding="async" fetchpriority="low">
                <h3 class="product-title">${product.name}</h3>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                ${priceHtml}
                <button class="add-to-cart btn-primary" data-id="${product.id}" aria-label="Ajouter ${product.name} au panier">
                    Ajouter au panier
                </button>
            `;
            productsContainer.appendChild(article);
        });

        productsContainer.removeEventListener('click', productsContainer._handleCartClick);
        
        productsContainer._handleCartClick = (e) => {
            const btn = e.target.closest('.add-to-cart');
            if (btn) {
                onAddToCart(btn.dataset.id);
            }
        };
        
        productsContainer.addEventListener('click', productsContainer._handleCartClick);
    },

    renderTeam(teamData) {
        const teamContainer = document.getElementById('team-container');
        if (!teamContainer) return;

        const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23003D38'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2300B8A8'>Image via Gemini</text></svg>`;

        teamData.forEach(member => {
            const div = document.createElement('div');
            div.classList.add('team-card');
            
            const finalSrc = member.imageSrc ? member.imageSrc : placeholderSvg;

            div.innerHTML = `
                <img src="${finalSrc}" alt="${member.imagePrompt}" title="${member.imagePrompt}" loading="lazy" decoding="async" fetchpriority="low">
                <h3><span>${member.name}</span></h3>
                <p>${member.role}</p>
            `;
            teamContainer.appendChild(div);
        });
    }
};
