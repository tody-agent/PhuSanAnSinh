import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    preprocess,
    classifyACOG,
    classifyNICE,
    checkConcordance,
    aspirinTiming,
    getFollowUp,
    screenPatient,
    createEmptyPatient,
    WARNING_SIGNS,
} from '../src/utils/preeclampsia-engine.js';

/**
 * Helper: create a patient with specific overrides
 */
function makePatient(overrides = {}) {
    const p = createEmptyPatient();
    if (overrides.name) p.name = overrides.name;
    if (overrides.maternal_age != null) p.maternal_age = overrides.maternal_age;
    if (overrides.gestational_age_weeks != null) p.gestational_age_weeks = overrides.gestational_age_weeks;
    if (overrides.gestational_age_days != null) p.gestational_age_days = overrides.gestational_age_days;
    if (overrides.height_cm != null) p.height_cm = overrides.height_cm;
    if (overrides.weight_kg != null) p.weight_kg = overrides.weight_kg;
    if (overrides.high_risk) Object.assign(p.high_risk, overrides.high_risk);
    if (overrides.moderate_risk) Object.assign(p.moderate_risk, overrides.moderate_risk);
    return preprocess(p);
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: 1 high factor → ACOG HIGH, aspirin true
// ═══════════════════════════════════════════════════════════════
describe('Test 1: 1 high-risk factor → ACOG HIGH', () => {
    it('pregestational diabetes → HIGH, aspirin true', () => {
        const p = makePatient({ high_risk: { pregestational_diabetes: true } });
        const r = classifyACOG(p);
        assert.equal(r.category, 'HIGH');
        assert.equal(r.aspirin, true);
        assert.equal(r.high_factors.length, 1);
        assert.ok(r.high_factors[0].includes('ĐTĐ'));
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 2: 2 moderate factors → ACOG HIGH, aspirin true
// ═══════════════════════════════════════════════════════════════
describe('Test 2: 2 moderate factors → ACOG HIGH', () => {
    it('nulliparity + age 37 → HIGH, aspirin true', () => {
        const p = makePatient({
            maternal_age: 37,
            moderate_risk: { nulliparity: true },
        });
        const r = classifyACOG(p);
        assert.equal(r.category, 'HIGH');
        assert.equal(r.aspirin, true);
        assert.equal(r.moderate_factors.length, 2);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 3: 1 moderate factor → ACOG MODERATE, aspirin false
// ═══════════════════════════════════════════════════════════════
describe('Test 3: 1 moderate factor → ACOG MODERATE', () => {
    it('nulliparity only → MODERATE, aspirin false', () => {
        const p = makePatient({ moderate_risk: { nulliparity: true } });
        const r = classifyACOG(p);
        assert.equal(r.category, 'MODERATE');
        assert.equal(r.aspirin, false);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 4: 0 factors → ACOG LOW
// ═══════════════════════════════════════════════════════════════
describe('Test 4: 0 factors → ACOG LOW', () => {
    it('age 28, BMI 23, no risk factors → LOW, aspirin false', () => {
        const p = makePatient({
            maternal_age: 28,
            height_cm: 160,
            weight_kg: 59, // BMI ~23.0
        });
        const r = classifyACOG(p);
        assert.equal(r.category, 'LOW');
        assert.equal(r.aspirin, false);
        assert.equal(r.high_factors.length, 0);
        assert.equal(r.moderate_factors.length, 0);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 5: Age 37, BMI 32, nullipara → ACOG HIGH, NICE MODERATE (discordant)
// ═══════════════════════════════════════════════════════════════
describe('Test 5: ACOG HIGH vs NICE MODERATE — discordant', () => {
    it('age 37, BMI 32, nullipara → discordant', () => {
        const p = makePatient({
            maternal_age: 37,
            height_cm: 165,
            weight_kg: 87, // BMI ~31.9
            moderate_risk: { nulliparity: true },
        });

        const acog = classifyACOG(p);
        const nice = classifyNICE(p);
        const conc = checkConcordance(acog, nice, p);

        // ACOG: 3 moderate (nullipara + age>=35 + bmi>30) → HIGH
        assert.equal(acog.category, 'HIGH');
        assert.equal(acog.aspirin, true);

        // NICE: only nullipara qualifies (age<40, bmi<35) → 1 mod → MODERATE
        assert.equal(nice.category, 'MODERATE');
        assert.equal(nice.aspirin, false);

        assert.equal(conc.agree, false);
        assert.ok(conc.reasons.length > 0);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 6: Multifetal only → ACOG HIGH, NICE MODERATE
// ═══════════════════════════════════════════════════════════════
describe('Test 6: Multifetal only → ACOG HIGH, NICE MODERATE', () => {
    it('multifetal is high in ACOG but moderate in NICE', () => {
        const p = makePatient({ high_risk: { multifetal: true } });

        const acog = classifyACOG(p);
        const nice = classifyNICE(p);

        assert.equal(acog.category, 'HIGH');
        assert.equal(acog.aspirin, true);

        // NICE: multifetal = 1 moderate factor → MODERATE
        assert.equal(nice.category, 'MODERATE');
        assert.equal(nice.aspirin, false);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 7: GA 14w + HIGH → urgency OPTIMAL
// ═══════════════════════════════════════════════════════════════
describe('Test 7: Aspirin timing — OPTIMAL', () => {
    it('GA 14 weeks → OPTIMAL window', () => {
        const t = aspirinTiming(14, true);
        assert.equal(t.urgency, 'OPTIMAL');
        assert.ok(t.text.includes('12–16'));
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 8: GA 22w + HIGH → urgency LATE_BUT_BENEFICIAL
// ═══════════════════════════════════════════════════════════════
describe('Test 8: Aspirin timing — LATE_BUT_BENEFICIAL', () => {
    it('GA 22 weeks → still beneficial', () => {
        const t = aspirinTiming(22, true);
        assert.equal(t.urgency, 'LATE_BUT_BENEFICIAL');
        assert.ok(t.text.includes('28'));
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 9: GA 37w + HIGH → urgency DO_NOT_START
// ═══════════════════════════════════════════════════════════════
describe('Test 9: Aspirin timing — DO_NOT_START', () => {
    it('GA 37 weeks → do not start', () => {
        const t = aspirinTiming(37, true);
        assert.equal(t.urgency, 'DO_NOT_START');
        assert.ok(t.text.includes('36'));
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 10: Missing age/BMI → auto-check fields false
// ═══════════════════════════════════════════════════════════════
describe('Test 10: Missing demographics → flags stay false', () => {
    it('name only → no auto-checked flags', () => {
        const p = makePatient({ name: 'Test' });
        assert.equal(p.moderate_risk.age_gte_35, false);
        assert.equal(p.moderate_risk.age_gte_40, false);
        assert.equal(p.moderate_risk.bmi_gt_30, false);
        assert.equal(p.moderate_risk.bmi_gte_35, false);
        assert.equal(p.bmi, null);
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 11: IVF + nullipara → ACOG HIGH, NICE MODERATE (discordant)
// ═══════════════════════════════════════════════════════════════
describe('Test 11: IVF + nullipara → discordant', () => {
    it('IVF counted by ACOG but not NICE', () => {
        const p = makePatient({
            moderate_risk: { nulliparity: true, ivf: true },
        });

        const acog = classifyACOG(p);
        const nice = classifyNICE(p);
        const conc = checkConcordance(acog, nice, p);

        // ACOG: 2 moderate (nullipara + IVF) → HIGH
        assert.equal(acog.category, 'HIGH');
        assert.equal(acog.aspirin, true);

        // NICE: only nullipara (IVF not counted) → 1 mod → MODERATE
        assert.equal(nice.category, 'MODERATE');
        assert.equal(nice.aspirin, false);

        assert.equal(conc.agree, false);
        assert.ok(conc.reasons.some(r => r.includes('IVF')));
    });
});

// ═══════════════════════════════════════════════════════════════
// TEST 12: low_income only → ACOG MODERATE, aspirin "CONSIDER"
// ═══════════════════════════════════════════════════════════════
describe('Test 12: low_income only → MODERATE, aspirin CONSIDER', () => {
    it('single low_income factor → aspirin = CONSIDER', () => {
        const p = makePatient({ moderate_risk: { low_income: true } });
        const r = classifyACOG(p);
        assert.equal(r.category, 'MODERATE');
        assert.equal(r.aspirin, 'CONSIDER');
    });
});

// ═══════════════════════════════════════════════════════════════
// ADDITIONAL: preprocess, follow-up, screenPatient, WARNING_SIGNS
// ═══════════════════════════════════════════════════════════════
describe('preprocess — BMI calculation', () => {
    it('160cm, 80kg → BMI 31.2', () => {
        const p = makePatient({ height_cm: 160, weight_kg: 80 });
        assert.equal(p.bmi, 31.2);
    });

    it('missing height → bmi stays null', () => {
        const p = makePatient({ weight_kg: 60 });
        assert.equal(p.bmi, null);
    });
});

describe('getFollowUp', () => {
    it('HIGH → 7 items including aspirin compliance', () => {
        const items = getFollowUp('HIGH');
        assert.equal(items.length, 7);
        assert.ok(items.some(i => i.includes('aspirin')));
    });

    it('MODERATE → 4 items', () => {
        const items = getFollowUp('MODERATE');
        assert.equal(items.length, 4);
    });

    it('LOW → 2 items', () => {
        const items = getFollowUp('LOW');
        assert.equal(items.length, 2);
    });
});

describe('screenPatient — full pipeline', () => {
    it('returns complete result object', () => {
        const p = createEmptyPatient();
        p.name = 'Nguyễn Thị H.';
        p.maternal_age = 37;
        p.gestational_age_weeks = 13;
        p.gestational_age_days = 2;
        p.height_cm = 160;
        p.weight_kg = 82;
        p.moderate_risk.nulliparity = true;
        p.moderate_risk.ivf = true;

        const r = screenPatient(p);

        assert.equal(r.acog_category, 'HIGH');
        assert.equal(r.acog_aspirin, true);
        assert.equal(r.nice_category, 'MODERATE');
        assert.equal(r.nice_aspirin, false);
        assert.equal(r.guidelines_agree, false);
        assert.equal(r.aspirin_urgency, 'OPTIMAL');
        assert.ok(r.follow_up_items.length > 0);
        assert.ok(r.warning_signs.length > 0);
        assert.ok(r.discordance_reasons.length > 0);
    });
});

describe('aspirinTiming — edge cases', () => {
    it('not recommended → null', () => {
        assert.equal(aspirinTiming(14, false), null);
    });

    it('null GA → PENDING', () => {
        const t = aspirinTiming(null, true);
        assert.equal(t.urgency, 'PENDING');
    });

    it('GA 10 → PENDING (wait for 12)', () => {
        const t = aspirinTiming(10, true);
        assert.equal(t.urgency, 'PENDING');
    });

    it('GA 30 → QUESTIONABLE', () => {
        const t = aspirinTiming(30, true);
        assert.equal(t.urgency, 'QUESTIONABLE');
    });

    it('CONSIDER is treated as truthy', () => {
        const t = aspirinTiming(14, 'CONSIDER');
        assert.equal(t.urgency, 'OPTIMAL');
    });
});

describe('WARNING_SIGNS', () => {
    it('has 7 warning signs', () => {
        assert.equal(WARNING_SIGNS.length, 7);
    });
});
