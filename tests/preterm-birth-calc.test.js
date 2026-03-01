import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calcFmfProbPtb37,
    calcFmfCondProb,
    calcFmfRisk,
    stratifyRisk,
    estimateQuippRisk,
    buildPrompt,
    validatePretermInputs,
    formatGaText,
    parseGa,
} from '../src/utils/preterm-birth-calc.js';

// ─── calcFmfProbPtb37 — Step 1: P(PTB < 37wk) ──────────────

describe('calcFmfProbPtb37 — FMF logistic regression for Q', () => {
    it('example case: 31yo, African-Caribbean, BMI 28, non-smoker, prior PTB 24-32w, no cx surgery, CL 18mm → Q ≈ 0.39-0.40', () => {
        const Q = calcFmfProbPtb37({
            maternalAge: 31,
            ethnicity: 'african-caribbean',
            bmi: 28,
            smoker: false,
            obstetricHistory: 'delivery_24_32',
            cervicalSurgery: false,
            cervicalLength: 18,
        });
        assert.ok(Q > 0.30 && Q < 0.50, `Q=${Q} should be ~0.39`);
    });

    it('low-risk nullipara: 25yo, Caucasian, BMI 22, CL 40mm → Q < 0.05', () => {
        const Q = calcFmfProbPtb37({
            maternalAge: 25,
            ethnicity: 'caucasian',
            bmi: 22,
            smoker: false,
            obstetricHistory: 'nullipara',
            cervicalSurgery: false,
            cervicalLength: 40,
        });
        assert.ok(Q < 0.05, `Q=${Q} should be very low`);
    });

    it('smoker with cervical surgery increases risk', () => {
        const base = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: false, obstetricHistory: 'nullipara',
            cervicalSurgery: false, cervicalLength: 30,
        });
        const higher = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: true, obstetricHistory: 'nullipara',
            cervicalSurgery: true, cervicalLength: 30,
        });
        assert.ok(higher > base, `smoker+surgery (${higher}) should be > base (${base})`);
    });

    it('shorter CL increases risk', () => {
        const longCL = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: false, obstetricHistory: 'nullipara',
            cervicalSurgery: false, cervicalLength: 40,
        });
        const shortCL = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: false, obstetricHistory: 'nullipara',
            cervicalSurgery: false, cervicalLength: 10,
        });
        assert.ok(shortCL > longCL, `short CL (${shortCL}) should be > long CL (${longCL})`);
    });

    it('prior PTB history increases risk vs all-term deliveries', () => {
        const allTerm = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: false, obstetricHistory: 'all_term',
            cervicalSurgery: false, cervicalLength: 30,
        });
        const priorPtb = calcFmfProbPtb37({
            maternalAge: 30, ethnicity: 'caucasian', bmi: 24,
            smoker: false, obstetricHistory: 'delivery_24_32',
            cervicalSurgery: false, cervicalLength: 30,
        });
        assert.ok(priorPtb > allTerm, `prior PTB (${priorPtb}) > all term (${allTerm})`);
    });
});

// ─── calcFmfCondProb — Step 2: P(PTB < X wk | PTB) ──────────

describe('calcFmfCondProb — conditional probability', () => {
    it('probability at 37 weeks > probability at 32 weeks', () => {
        const inputs = {
            maternalAge: 31, obstetricHistory: 'delivery_24_32', cervicalLength: 18,
        };
        const p37 = calcFmfCondProb(inputs, 37);
        const p32 = calcFmfCondProb(inputs, 32);
        assert.ok(p37 > p32, `P(37)=${p37} should be > P(32)=${p32}`);
    });

    it('shorter CL increases conditional probability', () => {
        const longCL = calcFmfCondProb({ maternalAge: 30, obstetricHistory: 'nullipara', cervicalLength: 40 }, 34);
        const shortCL = calcFmfCondProb({ maternalAge: 30, obstetricHistory: 'nullipara', cervicalLength: 10 }, 34);
        assert.ok(shortCL > longCL, `short CL (${shortCL}) > long CL (${longCL})`);
    });

    it('returns value between 0 and 1', () => {
        const p = calcFmfCondProb({ maternalAge: 30, obstetricHistory: 'nullipara', cervicalLength: 25 }, 34);
        assert.ok(p >= 0 && p <= 1, `P=${p} should be in [0,1]`);
    });
});

// ─── calcFmfRisk — Combined risk = P(X) × Q ────────────────

describe('calcFmfRisk — combined FMF risk', () => {
    it('example case: risk < 37w should match Q closely', () => {
        const inputs = {
            maternalAge: 31, ethnicity: 'african-caribbean', bmi: 28,
            smoker: false, obstetricHistory: 'delivery_24_32',
            cervicalSurgery: false, cervicalLength: 18,
        };
        const result = calcFmfRisk(inputs);
        assert.ok(result.riskBelow37 > 0, 'risk < 37w should be > 0');
        assert.ok(result.riskBelow32 > 0, 'risk < 32w should be > 0');
        assert.ok(result.riskBelow37 > result.riskBelow32, 'risk <37 > risk <32');
        assert.ok(result.Q > 0.30 && result.Q < 0.50, `Q=${result.Q}`);
    });

    it('low-risk case: all risks should be very small', () => {
        const inputs = {
            maternalAge: 25, ethnicity: 'caucasian', bmi: 22,
            smoker: false, obstetricHistory: 'nullipara',
            cervicalSurgery: false, cervicalLength: 40,
        };
        const result = calcFmfRisk(inputs);
        assert.ok(result.riskBelow37 < 0.05, `risk <37 = ${result.riskBelow37}`);
        assert.ok(result.riskBelow32 < 0.02, `risk <32 = ${result.riskBelow32}`);
    });
});

// ─── stratifyRisk — Integrated 5-level stratification ───────

describe('stratifyRisk — 5-level risk stratification', () => {
    it('VERY_LOW: CL >= 30, fFN < 10, no risk factors', () => {
        const r = stratifyRisk({ cl: 35, ffn: 5, hasRiskFactor: false, hasPreviousPtb32: false });
        assert.equal(r.level, 'VERY_LOW');
        assert.equal(r.color, 'green');
    });

    it('LOW: CL 25-29, no PTB history', () => {
        const r = stratifyRisk({ cl: 27, ffn: 30, hasRiskFactor: false, hasPreviousPtb32: false });
        assert.equal(r.level, 'LOW');
        assert.equal(r.color, 'yellow');
    });

    it('MODERATE: CL 20-24 with fFN < 50', () => {
        const r = stratifyRisk({ cl: 22, ffn: 30, hasRiskFactor: true, hasPreviousPtb32: false });
        assert.equal(r.level, 'MODERATE');
        assert.equal(r.color, 'orange');
    });

    it('HIGH: CL < 15 or fFN 200-499', () => {
        const r = stratifyRisk({ cl: 12, ffn: 80, hasRiskFactor: true, hasPreviousPtb32: false });
        assert.equal(r.level, 'HIGH');
        assert.equal(r.color, 'red');
    });

    it('HIGH: CL < 25 + prior PTB < 32w', () => {
        const r = stratifyRisk({ cl: 20, ffn: 80, hasRiskFactor: true, hasPreviousPtb32: true });
        assert.equal(r.level, 'HIGH');
        assert.equal(r.color, 'red');
    });

    it('VERY_HIGH: CL < 10', () => {
        const r = stratifyRisk({ cl: 8, ffn: 50, hasRiskFactor: true, hasPreviousPtb32: false });
        assert.equal(r.level, 'VERY_HIGH');
        assert.equal(r.color, 'red-urgent');
    });

    it('VERY_HIGH: fFN >= 500', () => {
        const r = stratifyRisk({ cl: 20, ffn: 550, hasRiskFactor: true, hasPreviousPtb32: false });
        assert.equal(r.level, 'VERY_HIGH');
        assert.equal(r.color, 'red-urgent');
    });

    it('VERY_HIGH: CL < 15 + fFN >= 200 + prior PTB', () => {
        const r = stratifyRisk({ cl: 12, ffn: 250, hasRiskFactor: true, hasPreviousPtb32: true });
        assert.equal(r.level, 'VERY_HIGH');
        assert.equal(r.color, 'red-urgent');
    });

    it('handles null fFN (only CL available)', () => {
        const r = stratifyRisk({ cl: 35, ffn: null, hasRiskFactor: false, hasPreviousPtb32: false });
        assert.ok(r.level, 'should return a level');
    });

    it('handles null CL (only fFN available)', () => {
        const r = stratifyRisk({ cl: null, ffn: 5, hasRiskFactor: false, hasPreviousPtb32: false });
        assert.ok(r.level, 'should return a level');
    });
});

// ─── estimateQuippRisk — QUiPP-style risk ───────────────────

describe('estimateQuippRisk — QUiPP-style estimation', () => {
    it('high-risk profile: CL 18, fFN 120, has risk factors → high 7-day risk', () => {
        const r = estimateQuippRisk({
            gaWeeks: 27, gaDays: 4,
            cl: 18, ffn: 120,
            hasRiskFactor: true,
            symptomatic: true,
        });
        assert.ok(r.risk7d > 10, `7d risk=${r.risk7d}% should be > 10%`);
        assert.ok(r.risk14d > r.risk7d, '14d > 7d');
        assert.ok(r.risk28d > r.risk14d, '28d > 14d');
    });

    it('low-risk profile: CL 40, fFN 5, no risk factors → low 7-day risk', () => {
        const r = estimateQuippRisk({
            gaWeeks: 28, gaDays: 0,
            cl: 40, ffn: 5,
            hasRiskFactor: false,
            symptomatic: true,
        });
        assert.ok(r.risk7d < 5, `7d risk=${r.risk7d}% should be < 5%`);
    });

    it('returns clinical action level', () => {
        const r = estimateQuippRisk({
            gaWeeks: 27, gaDays: 0,
            cl: 12, ffn: 300,
            hasRiskFactor: true,
            symptomatic: true,
        });
        assert.ok(r.actionLevel, 'should have an action level');
    });

    it('works with only CL (no fFN)', () => {
        const r = estimateQuippRisk({
            gaWeeks: 28, gaDays: 0,
            cl: 20, ffn: null,
            hasRiskFactor: false,
            symptomatic: false,
        });
        assert.ok(typeof r.risk7d === 'number', 'should return numeric risk');
    });

    it('works with only fFN (no CL)', () => {
        const r = estimateQuippRisk({
            gaWeeks: 28, gaDays: 0,
            cl: null, ffn: 80,
            hasRiskFactor: false,
            symptomatic: true,
        });
        assert.ok(typeof r.risk7d === 'number', 'should return numeric risk');
    });
});

// ─── buildPrompt — Prompt generation ────────────────────────

describe('buildPrompt — generates AI prompt', () => {
    const mockFormData = {
        assessmentType: 'symptomatic',
        gaWeeks: 27, gaDays: 4,
        maternalAge: 31, ethnicity: 'african-caribbean',
        bmi: 28, smoker: false, fetusCount: 1,
        previousPtb: true, earliestPtbWeek: 30,
        previousPprom: false, lateMiscarriage: false,
        cervicalSurgery: false, cerclage: false, progesterone: false,
        cervicalLength: 18, ffn: 120, availableTests: 'cl_ffn',
    };
    const mockRisk = {
        fmf: { Q: 0.395, riskBelow32: 0.08, riskBelow37: 0.35 },
        quipp: { risk7d: 20, risk14d: 30, risk28d: 40, risk30w: 'CAO', risk34w: 'RẤT CAO', risk37w: 40, actionLevel: 'Cao' },
        stratification: { level: 'HIGH', label: '🔴 CAO', color: 'red', reason: 'CL < 25mm + fFN > 50 + tiền sử sinh non < 32 tuần' },
    };

    it('contains patient info section', () => {
        const prompt = buildPrompt(mockFormData, mockRisk);
        assert.ok(prompt.includes('27 tuần'), 'should include GA weeks');
        assert.ok(prompt.includes('31 tuổi'), 'should include maternal age');
    });

    it('contains risk results section', () => {
        const prompt = buildPrompt(mockFormData, mockRisk);
        assert.ok(prompt.includes('QUiPP'), 'should mention QUiPP');
        assert.ok(prompt.includes('FMF'), 'should mention FMF');
    });

    it('contains analysis request section', () => {
        const prompt = buildPrompt(mockFormData, mockRisk);
        assert.ok(prompt.includes('ĐÁNH GIÁ TỔNG QUAN'), 'should have analysis section');
        assert.ok(prompt.includes('QUẢN LÝ ĐỀ XUẤT'), 'should have management section');
    });

    it('contains disclaimer', () => {
        const prompt = buildPrompt(mockFormData, mockRisk);
        assert.ok(prompt.includes('KHÔNG thay thế'), 'should have disclaimer');
    });
});

// ─── validatePretermInputs ──────────────────────────────────

describe('validatePretermInputs', () => {
    it('valid minimal input passes', () => {
        const r = validatePretermInputs({
            gaWeeks: 28, gaDays: 0,
            assessmentType: 'symptomatic',
        });
        assert.ok(r.valid);
    });

    it('GA too low: < 18 weeks fails', () => {
        const r = validatePretermInputs({ gaWeeks: 16, gaDays: 0, assessmentType: 'symptomatic' });
        assert.ok(!r.valid);
        assert.ok(r.error.includes('tuổi thai'));
    });

    it('GA too high: >= 37 weeks fails', () => {
        const r = validatePretermInputs({ gaWeeks: 37, gaDays: 0, assessmentType: 'symptomatic' });
        assert.ok(!r.valid);
    });

    it('invalid CL out of range', () => {
        const r = validatePretermInputs({ gaWeeks: 28, gaDays: 0, assessmentType: 'symptomatic', cervicalLength: -5 });
        assert.ok(!r.valid);
    });

    it('invalid fFN out of range', () => {
        const r = validatePretermInputs({ gaWeeks: 28, gaDays: 0, assessmentType: 'symptomatic', ffn: 600 });
        assert.ok(!r.valid);
    });

    it('valid full input', () => {
        const r = validatePretermInputs({
            gaWeeks: 27, gaDays: 4,
            assessmentType: 'symptomatic',
            cervicalLength: 18, ffn: 120,
            maternalAge: 31, bmi: 28,
        });
        assert.ok(r.valid);
    });
});

// ─── Utility functions ──────────────────────────────────────

describe('formatGaText', () => {
    it('formats weeks and days', () => {
        assert.equal(formatGaText(28, 4), '28 tuần + 4 ngày');
    });
    it('formats zero days', () => {
        assert.equal(formatGaText(30, 0), '30 tuần + 0 ngày');
    });
});

describe('parseGa', () => {
    it('parses weeks + days into total days', () => {
        const r = parseGa(28, 4);
        assert.equal(r.totalDays, 28 * 7 + 4);
        assert.equal(r.weeks, 28);
        assert.equal(r.days, 4);
    });
});
