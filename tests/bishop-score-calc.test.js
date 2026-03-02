import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calcBishopScore,
    classifyBishop,
    getInductionMethods,
    buildBishopPrompt,
    validateBishopInputs,
    BISHOP_TABLES,
    FAVORABLE_THRESHOLD,
} from '../src/utils/bishop-score-calc.js';

// ─── calcBishopScore ────────────────────────────────────────

describe('calcBishopScore — sum of 5 components', () => {
    it('example: 2cm, 60%, soft, middle, −1 → 8/13', () => {
        const result = calcBishopScore({
            dilation: '1-2',
            effacement: '60-70',
            station: '-1,0',
            consistency: 'soft',
            position: 'middle',
        });
        assert.equal(result.total, 8);
        assert.equal(result.breakdown.dilation, 1);
        assert.equal(result.breakdown.effacement, 2);
        assert.equal(result.breakdown.station, 2);
        assert.equal(result.breakdown.consistency, 2);
        assert.equal(result.breakdown.position, 1);
    });

    it('minimum score: all zeros → 0/13', () => {
        const result = calcBishopScore({
            dilation: 'closed',
            effacement: '0-30',
            station: '-3',
            consistency: 'firm',
            position: 'posterior',
        });
        assert.equal(result.total, 0);
    });

    it('maximum score: all max → 13/13', () => {
        const result = calcBishopScore({
            dilation: '>=5',
            effacement: '>=80',
            station: '+1,+2',
            consistency: 'soft',
            position: 'anterior',
        });
        assert.equal(result.total, 13);
    });

    it('handles unknown value gracefully → 0', () => {
        const result = calcBishopScore({
            dilation: 'unknown',
            effacement: '0-30',
            station: '-3',
            consistency: 'firm',
            position: 'posterior',
        });
        assert.equal(result.breakdown.dilation, 0);
    });
});

// ─── classifyBishop ─────────────────────────────────────────

describe('classifyBishop — parity-adjusted classification', () => {
    it('score 0-5 → UNFAVORABLE', () => {
        const c = classifyBishop(4, 'nulliparous');
        assert.equal(c.category, 'UNFAVORABLE');
        assert.equal(c.color, 'red');
        assert.equal(c.meetsThreshold, false);
    });

    it('score 6-7 → INTERMEDIATE', () => {
        const c = classifyBishop(7, 'nulliparous');
        assert.equal(c.category, 'INTERMEDIATE');
        assert.equal(c.color, 'yellow');
        assert.equal(c.meetsThreshold, false);
    });

    it('score ≥8 → FAVORABLE', () => {
        const c = classifyBishop(8, 'nulliparous');
        assert.equal(c.category, 'FAVORABLE');
        assert.equal(c.color, 'green');
        assert.equal(c.meetsThreshold, true);
    });

    it('nulliparous threshold = 8', () => {
        const c = classifyBishop(7, 'nulliparous');
        assert.equal(c.threshold, 8);
        assert.equal(c.meetsThreshold, false);
    });

    it('multiparous threshold = 6', () => {
        const c = classifyBishop(6, 'multiparous');
        assert.equal(c.threshold, 6);
        assert.equal(c.meetsThreshold, true);
    });

    it('score 6 multiparous → meets threshold (favorable)', () => {
        const c = classifyBishop(6, 'multiparous');
        assert.equal(c.meetsThreshold, true);
    });

    it('score 6 nulliparous → does NOT meet threshold', () => {
        const c = classifyBishop(6, 'nulliparous');
        assert.equal(c.meetsThreshold, false);
    });
});

// ─── getInductionMethods ────────────────────────────────────

describe('getInductionMethods — IOL recommendations', () => {
    it('favorable, no prior CS → includes Oxytocin + Amniotomy', () => {
        const r = getInductionMethods({ score: 8, parity: 'nulliparous', hasPriorCS: false });
        assert.ok(r.methods.some(m => m.name.includes('Oxytocin')));
        assert.equal(r.warnings.length, 0);
    });

    it('unfavorable, no prior CS → includes Foley + Misoprostol', () => {
        const r = getInductionMethods({ score: 3, parity: 'nulliparous', hasPriorCS: false });
        assert.ok(r.methods.some(m => m.name.includes('Foley')));
        assert.ok(r.methods.some(m => m.name.includes('Misoprostol')));
    });

    it('prior CS → warning about prostaglandin', () => {
        const r = getInductionMethods({ score: 3, parity: 'multiparous', hasPriorCS: true });
        assert.ok(r.warnings.some(w => w.includes('prostaglandin') || w.includes('Prostaglandin')));
        assert.ok(!r.methods.some(m => m.name.includes('Misoprostol')));
        assert.ok(!r.methods.some(m => m.name.includes('Dinoprostone')));
    });

    it('prior CS, favorable → Oxytocin only, no prostaglandin', () => {
        const r = getInductionMethods({ score: 9, parity: 'multiparous', hasPriorCS: true });
        assert.ok(r.methods.some(m => m.name.includes('Oxytocin')));
        assert.ok(!r.methods.some(m => m.name.includes('Misoprostol')));
    });

    it('ROM → warning about Foley avoidance', () => {
        const r = getInductionMethods({ score: 3, parity: 'nulliparous', hasROM: true });
        assert.ok(r.warnings.some(w => w.includes('Ối đã vỡ')));
    });

    it('always returns dosageInfo', () => {
        const r = getInductionMethods({ score: 5, parity: 'nulliparous' });
        assert.ok(r.dosageInfo.oxytocin);
        assert.ok(r.dosageInfo.misoprostol);
        assert.ok(r.dosageInfo.safeIntervals);
    });
});

// ─── buildBishopPrompt ──────────────────────────────────────

describe('buildBishopPrompt — AI prompt generation', () => {
    const mockFormData = {
        dilation: '1-2',
        effacement: '60-70',
        station: '-1,0',
        consistency: 'soft',
        position: 'middle',
        parity: 'nulliparous',
        gaWeeks: 39,
        gaDays: 2,
        efw: 3200,
        hasPriorCS: false,
        comorbidity: 'preeclampsia',
        inductionReason: 'preeclampsia',
    };
    const mockResult = {
        score: { total: 8, breakdown: { dilation: 1, effacement: 2, station: 2, consistency: 2, position: 1 } },
        classification: { category: 'FAVORABLE', label: 'Thuận lợi', color: 'green', emoji: '✅', threshold: 8, meetsThreshold: true },
        methods: { methods: [], warnings: [], dosageInfo: {} },
    };

    it('contains patient info', () => {
        const prompt = buildBishopPrompt(mockFormData, mockResult);
        assert.ok(prompt.includes('Con so'));
        assert.ok(prompt.includes('39 tuần'));
        assert.ok(prompt.includes('3200 g'));
    });

    it('contains cervical exam', () => {
        const prompt = buildBishopPrompt(mockFormData, mockResult);
        assert.ok(prompt.includes('1–2 cm'));
        assert.ok(prompt.includes('60–70%'));
        assert.ok(prompt.includes('Mềm'));
    });

    it('contains Bishop Score result', () => {
        const prompt = buildBishopPrompt(mockFormData, mockResult);
        assert.ok(prompt.includes('8/13'));
        assert.ok(prompt.includes('Thuận lợi'));
    });

    it('contains analysis request', () => {
        const prompt = buildBishopPrompt(mockFormData, mockResult);
        assert.ok(prompt.includes('YÊU CẦU PHÂN TÍCH'));
        assert.ok(prompt.includes('evidence-based'));
    });

    it('contains disclaimer', () => {
        const prompt = buildBishopPrompt(mockFormData, mockResult);
        assert.ok(prompt.includes('KHÔNG thay thế'));
    });
});

// ─── validateBishopInputs ───────────────────────────────────

describe('validateBishopInputs', () => {
    const validInput = {
        dilation: '1-2',
        effacement: '60-70',
        station: '-1,0',
        consistency: 'soft',
        position: 'middle',
        parity: 'nulliparous',
    };

    it('valid input passes', () => {
        const r = validateBishopInputs(validInput);
        assert.ok(r.valid);
    });

    it('missing dilation fails', () => {
        const r = validateBishopInputs({ ...validInput, dilation: '' });
        assert.ok(!r.valid);
        assert.ok(r.error.includes('mở'));
    });

    it('missing parity fails', () => {
        const r = validateBishopInputs({ ...validInput, parity: '' });
        assert.ok(!r.valid);
    });

    it('invalid GA too low fails', () => {
        const r = validateBishopInputs({ ...validInput, gaWeeks: 15 });
        assert.ok(!r.valid);
    });

    it('invalid GA too high fails', () => {
        const r = validateBishopInputs({ ...validInput, gaWeeks: 45 });
        assert.ok(!r.valid);
    });

    it('invalid EFW fails', () => {
        const r = validateBishopInputs({ ...validInput, efw: 100 });
        assert.ok(!r.valid);
    });

    it('optional GA/EFW null passes', () => {
        const r = validateBishopInputs(validInput);
        assert.ok(r.valid);
    });
});

// ─── Constants ──────────────────────────────────────────────

describe('BISHOP_TABLES constants', () => {
    it('has 5 parameter tables', () => {
        assert.equal(Object.keys(BISHOP_TABLES).length, 5);
    });

    it('dilation has 4 options (0-3)', () => {
        assert.equal(BISHOP_TABLES.dilation.length, 4);
    });

    it('consistency has 3 options (0-2)', () => {
        assert.equal(BISHOP_TABLES.consistency.length, 3);
    });
});

describe('FAVORABLE_THRESHOLD', () => {
    it('nulliparous = 8', () => {
        assert.equal(FAVORABLE_THRESHOLD.nulliparous, 8);
    });
    it('multiparous = 6', () => {
        assert.equal(FAVORABLE_THRESHOLD.multiparous, 6);
    });
});
