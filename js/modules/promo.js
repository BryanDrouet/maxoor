/**
 * promo.js - Gestion des codes promotionnels
 */

export const PromoManager = {
    /**
     * Vérifie si la période de promotion est valide
     * @returns {boolean}
     */
    isValidPeriod() {
        const now = new Date();
        // Les codes sont valides du 14/04/2026 15h au 17/04/2026 20h (heure de Paris)
        // Paris est UTC+2 en avril (heure d'été)
        // Donc: 14/04 15h Paris = 14/04 13h UTC
        //      17/04 20h Paris = 17/04 18h UTC
        const startDate = new Date('2026-04-14T13:00:00Z');
        const endDate = new Date('2026-04-17T18:00:00Z');
        
        return now >= startDate && now <= endDate;
    },

    /**
     * Valide un code promo
     * @param {string} code - Code à valider
     * @returns {object} Résultat validation { valid, code, message }
     */
    validate(code) {
        const upperCode = code.trim().toUpperCase();
        
        // Easter eggs - Toujours valides
        if (upperCode === 'BATSAVE' || upperCode === 'MAXOOR' || upperCode === 'BRYAN_DROUET') {
            return {
                valid: true,
                code: upperCode,
                message: '🎉 Code Easter egg appliqué : Livraison gratuite !'
            };
        }
        
        // Codes périodiques
        if (upperCode === 'MYNTHOS5' || upperCode === 'MYNTHOS10') {
            // Vérifier si la période est valide pour ces codes
            if (!this.isValidPeriod()) {
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
        }
        
        // Code n'existe pas
        return {
            valid: false,
            message: '❌ Ce code promo n\'existe pas.'
        };
    },

    /**
     * Calcule la réduction en fonction du code appliqué
     * @param {string|null} appliedCode - Code appliqué
     * @param {number} subtotal - Sous-total
     * @param {object} itemCounts - Quantités par produit
     * @returns {object} { discount, freeShipping }
     */
    calculateDiscount(appliedCode, subtotal, itemCounts) {
        let freeShipping = false;
        let discount = 0;
        
        if (!appliedCode) {
            return { discount: 0, freeShipping: false };
        }
        
        if (appliedCode === 'MYNTHOS5') {
            const packQuantity = itemCounts['pack-6l'] || 0;
            discount = packQuantity > 0 ? 5 : 0;
        } else if (appliedCode === 'MYNTHOS10') {
            discount = Math.round(subtotal * 0.1 * 100) / 100;
        } else if (appliedCode === 'BATSAVE' || appliedCode === 'MAXOOR' || appliedCode === 'BRYAN_DROUET') {
            freeShipping = true;
        }
        
        return { discount, freeShipping };
    }
};
