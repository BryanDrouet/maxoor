/**
 * products.js - Gestion des produits et équipe
 */

export const ProductManager = {
    /**
     * Rendu les cartes de produits
     * @param {Array} productsData - Données des produits
     * @param {Function} onAddToCart - Callback ajout au panier
     */
    renderProducts(productsData, onAddToCart) {
        const productsContainer = document.getElementById('products-container');
        if (!productsContainer) return;

        const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23003D38'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2300B8A8'>Image via Gemini</text></svg>`;

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
                onAddToCart(btn.dataset.id);
                const originalText = btn.innerHTML;
                btn.innerHTML = `<i data-lucide="check" aria-hidden="true"></i> Sélectionné`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }, 1000);
            }
        });
    },

    /**
     * Rendu les cartes d'équipe
     * @param {Array} teamData - Données de l'équipe
     */
    renderTeam(teamData) {
        const teamContainer = document.getElementById('team-container');
        if (!teamContainer) return;

        const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23003D38'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2300B8A8'>Image via Gemini</text></svg>`;

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
};
