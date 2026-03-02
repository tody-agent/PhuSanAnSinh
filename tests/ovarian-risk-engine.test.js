import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    countUSFeatures,
    calculateRMI,
    stratifyRMI,
    calculateROMA,
    stratifyROMA,
    screenPatient,
    getActionPlan,
    createEmptyPatient,
} from '../src/utils/ovarian-risk-engine.js';

/**
 * Helper: create patient data with overrides
 */
function makeData(overrides = {}) {
    const d = createEmptyPatient();
    Object.assign(d, overrides);
    if (overrides.ultrasound) {
        Object.assign(d.ultrasound, overrides.ultrasound);
    }
    return d;
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Worked example from spec (55yo, postmeno, CA-125=350, US=3, 9cm)
// ═══════════════════════════════════════════════════════════════
describe('Worked example from spec', () => {
    const data = makeData({
        age: 55,
        postmenopausal: true,
        ca125: 350,
        he4: 280,
        hasHE4: true,
        he4System: 'roche',
        tumorSizeCm: 9,
        ultrasound: {
            multilocular: true,
            solid: true,
            metastases: false,
            ascites: true,
            bilateral: false,
        },
    });

    it('US score = 3', () => {
        assert.equal(countUSFeatures(data.ultrasound), 3);
    });

    it('RMI 1 = 3 × 3 × 350 = 3150', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi1, 3150);
    });

    it('RMI 4 = 4 × 4 × 2 × 350 = 11200', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi4, 11200);
    });

    it('ROMA ≈ 88.7%', () => {
        const roma = calculateROMA(data);
        assert.ok(roma != null);
        // Allow some float precision tolerance
        assert.ok(roma.roma >= 88.0 && roma.roma <= 89.5, `ROMA=${roma.roma}, expected ~88.7`);
    });

    it('PI ≈ 2.058', () => {
        const roma = calculateROMA(data);
        assert.ok(roma != null);
        assert.ok(Math.abs(roma.pi - 2.058) < 0.05, `PI=${roma.pi}, expected ~2.058`);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 2: RMI version differences with US_score = 0
// ═══════════════════════════════════════════════════════════════
describe('US_score = 0 edge case (RMI 1 = 0, others ≠ 0)', () => {
    const data = makeData({
        postmenopausal: true,
        ca125: 100,
        ultrasound: {
            multilocular: false,
            solid: false,
            metastases: false,
            ascites: false,
            bilateral: false,
        },
    });

    it('RMI 1 = 0 (U=0)', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi1, 0);
    });

    it('RMI 2 = 1 × 4 × 100 = 400', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi2, 400);
    });

    it('RMI 3 = 1 × 3 × 100 = 300', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi3, 300);
    });

    it('RMI 4 = 1 × 4 × 1 × 100 = 400', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi4, 400);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 3: RMI stratification thresholds
// ═══════════════════════════════════════════════════════════════
describe('RMI stratification thresholds', () => {
    it('RMI 1: <25 = LOW', () => {
        assert.equal(stratifyRMI(24, 1), 'LOW');
    });

    it('RMI 1: 25 = MODERATE', () => {
        assert.equal(stratifyRMI(25, 1), 'MODERATE');
    });

    it('RMI 1: 199 = MODERATE', () => {
        assert.equal(stratifyRMI(199, 1), 'MODERATE');
    });

    it('RMI 1: 200 = HIGH', () => {
        assert.equal(stratifyRMI(200, 1), 'HIGH');
    });

    it('RMI 4: 449 = MODERATE', () => {
        assert.equal(stratifyRMI(449, 4), 'MODERATE');
    });

    it('RMI 4: 450 = HIGH', () => {
        assert.equal(stratifyRMI(450, 4), 'HIGH');
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: ROMA stratification
// ═══════════════════════════════════════════════════════════════
describe('ROMA stratification', () => {
    it('Roche premenopausal: 11.3% = LOW', () => {
        const r = stratifyROMA(11.3, false, 'roche');
        assert.equal(r.category, 'LOW');
        assert.equal(r.cutoff, 11.4);
    });

    it('Roche premenopausal: 11.4% = HIGH', () => {
        const r = stratifyROMA(11.4, false, 'roche');
        assert.equal(r.category, 'HIGH');
    });

    it('Roche postmenopausal: 29.8% = LOW', () => {
        const r = stratifyROMA(29.8, true, 'roche');
        assert.equal(r.category, 'LOW');
    });

    it('Roche postmenopausal: 29.9% = HIGH', () => {
        const r = stratifyROMA(29.9, true, 'roche');
        assert.equal(r.category, 'HIGH');
    });

    it('Abbott premenopausal: 7.4% = HIGH', () => {
        const r = stratifyROMA(7.4, false, 'abbott');
        assert.equal(r.category, 'HIGH');
        assert.equal(r.cutoff, 7.4);
    });

    it('Abbott postmenopausal: 25.3% = HIGH', () => {
        const r = stratifyROMA(25.3, true, 'abbott');
        assert.equal(r.category, 'HIGH');
        assert.equal(r.cutoff, 25.3);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 5: No HE4 → ROMA null
// ═══════════════════════════════════════════════════════════════
describe('No HE4 → ROMA null', () => {
    it('missing HE4 → calculateROMA returns null', () => {
        const data = makeData({ ca125: 100 });
        const roma = calculateROMA(data);
        assert.equal(roma, null);
    });

    it('HE4=0 → calculateROMA returns null', () => {
        const data = makeData({ ca125: 100, he4: 0 });
        const roma = calculateROMA(data);
        assert.equal(roma, null);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 6: US feature counting
// ═══════════════════════════════════════════════════════════════
describe('US feature counting', () => {
    it('all features → 5', () => {
        const us = {
            multilocular: true,
            solid: true,
            metastases: true,
            ascites: true,
            bilateral: true,
        };
        assert.equal(countUSFeatures(us), 5);
    });

    it('no features → 0', () => {
        const d = createEmptyPatient();
        assert.equal(countUSFeatures(d.ultrasound), 0);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 7: Premenopausal RMI (M=1 for all versions)
// ═══════════════════════════════════════════════════════════════
describe('Premenopausal patient', () => {
    const data = makeData({
        postmenopausal: false,
        ca125: 50,
        ultrasound: { multilocular: true, solid: false, metastases: false, ascites: false, bilateral: false },
    });

    it('RMI 1 = U=1 × M=1 × 50 = 50', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi1, 50);
    });

    it('RMI 2 = U=1 × M=1 × 50 = 50', () => {
        const r = calculateRMI(data);
        assert.equal(r.rmi2, 50);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 8: screenPatient full pipeline
// ═══════════════════════════════════════════════════════════════
describe('screenPatient — full pipeline', () => {
    it('returns complete result with RMI and ROMA', () => {
        const data = makeData({
            age: 55,
            postmenopausal: true,
            ca125: 350,
            he4: 280,
            hasHE4: true,
            he4System: 'roche',
            tumorSizeCm: 9,
            ultrasound: {
                multilocular: true,
                solid: true,
                metastases: false,
                ascites: true,
                bilateral: false,
            },
        });

        const r = screenPatient(data);
        assert.equal(r.overallRisk, 'HIGH');
        assert.equal(r.rmi1Cat, 'HIGH');
        assert.equal(r.rmi4Cat, 'HIGH');
        assert.equal(r.romaCat, 'HIGH');
        assert.equal(r.hasHE4, true);
        assert.ok(r.roma > 80);
    });

    it('low risk patient → overallRisk = LOW', () => {
        const data = makeData({
            postmenopausal: false,
            ca125: 10,
            ultrasound: { multilocular: false, solid: false, metastases: false, ascites: false, bilateral: false },
        });

        const r = screenPatient(data);
        // RMI 1 = 0 (U=0), but RMI 2/3/4 = 1*1*10 = 10 → LOW
        assert.equal(r.rmi2Cat, 'LOW');
        assert.equal(r.overallRisk, 'LOW');
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 9: getActionPlan
// ═══════════════════════════════════════════════════════════════
describe('getActionPlan', () => {
    it('HIGH → URGENT with 5 actions', () => {
        const plan = getActionPlan('HIGH');
        assert.equal(plan.urgency, 'URGENT');
        assert.equal(plan.actions.length, 5);
    });

    it('MODERATE → SEMI_URGENT with 5 actions', () => {
        const plan = getActionPlan('MODERATE');
        assert.equal(plan.urgency, 'SEMI_URGENT');
        assert.equal(plan.actions.length, 5);
    });

    it('LOW → LOW with 4 actions', () => {
        const plan = getActionPlan('LOW');
        assert.equal(plan.urgency, 'LOW');
        assert.equal(plan.actions.length, 4);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 10: RMI 4 with S factor
// ═══════════════════════════════════════════════════════════════
describe('RMI 4 S factor', () => {
    it('size < 7cm → S=1', () => {
        const data = makeData({
            postmenopausal: true,
            ca125: 100,
            tumorSizeCm: 5,
            ultrasound: { multilocular: true, solid: true, metastases: false, ascites: false, bilateral: false },
        });
        const r = calculateRMI(data);
        // U=4, M=4, S=1, CA125=100
        assert.equal(r.rmi4, 4 * 4 * 1 * 100);
    });

    it('size >= 7cm → S=2', () => {
        const data = makeData({
            postmenopausal: true,
            ca125: 100,
            tumorSizeCm: 8,
            ultrasound: { multilocular: true, solid: true, metastases: false, ascites: false, bilateral: false },
        });
        const r = calculateRMI(data);
        // U=4, M=4, S=2, CA125=100
        assert.equal(r.rmi4, 4 * 4 * 2 * 100);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 11: rmi1ZeroWarning detection
// ═══════════════════════════════════════════════════════════════
describe('rmi1ZeroWarning', () => {
    it('US_score=0 + CA-125 > 0 → warning on', () => {
        const data = makeData({
            ca125: 200,
            ultrasound: { multilocular: false, solid: false, metastases: false, ascites: false, bilateral: false },
        });
        const r = screenPatient(data);
        assert.equal(r.rmi1ZeroWarning, true);
    });

    it('US_score > 0 → no warning', () => {
        const data = makeData({
            ca125: 200,
            ultrasound: { multilocular: true, solid: false, metastases: false, ascites: false, bilateral: false },
        });
        const r = screenPatient(data);
        assert.equal(r.rmi1ZeroWarning, false);
    });
});
