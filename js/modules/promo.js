/**
 * promo.js - Gestion des codes promotionnels
 */

export const PromoManager = {
    isValidPeriod() {
        const now = new Date();
        const startDate = new Date('2026-04-14T13:00:00Z');
        const endDate = new Date('2026-04-17T18:00:00Z');
        
        return now >= startDate && now <= endDate;
    },

    validate(code) {
        const upperCode = code.trim().toUpperCase();
        
        if (upperCode === 'MAXOOR' || upperCode === 'BRYAN_DROUET' || upperCode === 'BATSAVE' || upperCode === 'JEWIN') {
            return {
                valid: true,
                code: upperCode,
                message: '🎉 Code Easter egg appliqué : Livraison gratuite !'
            };
        }
        
        if (upperCode === 'MYNTHOS5' || upperCode === 'MYNTHOS10') {
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
        
        return {
            valid: false,
            message: '❌ Ce code promo n\'existe pas.'
        };
    },

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
        } else if (appliedCode === 'MAXOOR' || appliedCode === 'BRYAN_DROUET' || appliedCode === 'JEWIN') {
            freeShipping = true;
        }
        
        return { discount, freeShipping };
    }
};
