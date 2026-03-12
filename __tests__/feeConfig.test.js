const { calculateServiceFee, CHEF_ORDER_FEE, calculateDeliveryFee, getChefOrderFee, SERVICE_FEE_TIERS } = require('../config/feeConfig');

describe('feeConfig', () => {
    describe('calculateServiceFee', () => {
        it('returns 5 EGP for subtotals under 150', () => {
            expect(calculateServiceFee(50)).toBe(5);
            expect(calculateServiceFee(100)).toBe(5);
            expect(calculateServiceFee(149)).toBe(5);
        });

        it('returns 5 EGP for subtotal exactly 150 (boundary)', () => {
            expect(calculateServiceFee(150)).toBe(5);
        });

        it('returns 8 EGP for subtotals between 151 and 400', () => {
            expect(calculateServiceFee(151)).toBe(8);
            expect(calculateServiceFee(250)).toBe(8);
            expect(calculateServiceFee(399)).toBe(8);
        });

        it('returns 8 EGP for subtotal exactly 400 (boundary)', () => {
            expect(calculateServiceFee(400)).toBe(8);
        });

        it('returns 12 EGP for subtotals above 400', () => {
            expect(calculateServiceFee(401)).toBe(12);
            expect(calculateServiceFee(550)).toBe(12);
            expect(calculateServiceFee(900)).toBe(12);
            expect(calculateServiceFee(5000)).toBe(12);
        });

        it('handles edge case of 0 subtotal', () => {
            expect(calculateServiceFee(0)).toBe(5);
        });
    });

    describe('CHEF_ORDER_FEE', () => {
        it('is a flat 4 EGP', () => {
            expect(CHEF_ORDER_FEE).toBe(4);
        });
    });

    describe('getChefOrderFee', () => {
        it('returns 4 EGP', () => {
            expect(getChefOrderFee()).toBe(4);
        });
    });

    describe('SERVICE_FEE_TIERS', () => {
        it('has 3 tiers', () => {
            expect(SERVICE_FEE_TIERS).toHaveLength(3);
        });

        it('tiers are sorted ascending by maxSubtotal', () => {
            for (let i = 1; i < SERVICE_FEE_TIERS.length; i++) {
                expect(SERVICE_FEE_TIERS[i].maxSubtotal).toBeGreaterThan(SERVICE_FEE_TIERS[i - 1].maxSubtotal);
            }
        });

        it('last tier has Infinity maxSubtotal (catch-all)', () => {
            expect(SERVICE_FEE_TIERS[SERVICE_FEE_TIERS.length - 1].maxSubtotal).toBe(Infinity);
        });
    });

    describe('calculateDeliveryFee', () => {
        it('returns fallback when no tiers', () => {
            expect(calculateDeliveryFee(5, [], 10)).toBe(10);
            expect(calculateDeliveryFee(5, null, 15)).toBe(15);
        });

        it('finds correct tier for distance', () => {
            const tiers = [
                { maxDistance: 3, fee: 10 },
                { maxDistance: 5, fee: 15 },
                { maxDistance: 10, fee: 25 },
            ];
            expect(calculateDeliveryFee(2, tiers)).toBe(10);
            expect(calculateDeliveryFee(4, tiers)).toBe(15);
            expect(calculateDeliveryFee(8, tiers)).toBe(25);
        });

        it('returns highest tier fee when distance exceeds all', () => {
            const tiers = [
                { maxDistance: 3, fee: 10 },
                { maxDistance: 5, fee: 15 },
            ];
            expect(calculateDeliveryFee(100, tiers)).toBe(15);
        });
    });
});
