import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    validateEctopicInputs,
    assessRiskFactors,
    evaluateDecisionTree,
    classifyRiskLevel,
    calcFernandezScore,
    interpretFernandez,
    checkMtxContraindications,
    calcDoublingTime,
    calcHalfLife,
    calcPercentChange48h,
    classifyHcgTrend,
    compareDiscriminatoryZone,
    getMinimumRise,
    buildPromptA,
    buildPromptB,
    buildPromptC,
} from '../src/utils/ectopic-calc.js';

// ═══════════════════════════════════════════════════════════
// TOOL A: ECTOPIC PREGNANCY RISK ESTIMATION
// ═══════════════════════════════════════════════════════════

// ─── validateEctopicInputs ──────────────────────────────────

describe('validateEctopicInputs — Tool A', () => {
    it('valid minimal Tool A input passes', () => {
        const r = validateEctopicInputs({
            age: 30,
            gaWeeks: 6,
            gaDays: 0,
        }, 'A');
        assert.ok(r.valid);
    });

    it('missing age fails for Tool A', () => {
        const r = validateEctopicInputs({ gaWeeks: 6, gaDays: 0 }, 'A');
        assert.ok(!r.valid);
        assert.ok(r.error.length > 0);
    });

    it('invalid GA fails for Tool A', () => {
        const r = validateEctopicInputs({ age: 30, gaWeeks: -1 }, 'A');
        assert.ok(!r.valid);
    });
});

describe('validateEctopicInputs — Tool B', () => {
    it('valid Fernandez input passes', () => {
        const r = validateEctopicInputs({
            gestationalDays: 45,
            hcg: 3000,
            progesterone: 7,
            pain: 'induced',
            hematosalpinxCm: 2,
            hemoperitoneumMl: 50,
        }, 'B');
        assert.ok(r.valid);
    });

    it('missing hcg fails for Tool B', () => {
        const r = validateEctopicInputs({
            gestationalDays: 45,
            progesterone: 7,
            pain: 'induced',
            hematosalpinxCm: 2,
            hemoperitoneumMl: 50,
        }, 'B');
        assert.ok(!r.valid);
    });
});

describe('validateEctopicInputs — Tool C', () => {
    it('valid hCG serial input passes', () => {
        const r = validateEctopicInputs({
            hcg1: 500,
            hcg1Date: '2026-01-10T08:00',
            hcg2: 1100,
            hcg2Date: '2026-01-12T08:00',
            ultrasoundMethod: 'tvus',
        }, 'C');
        assert.ok(r.valid);
    });

    it('missing hcg2 fails for Tool C', () => {
        const r = validateEctopicInputs({
            hcg1: 500,
            hcg1Date: '2026-01-10T08:00',
            ultrasoundMethod: 'tvus',
        }, 'C');
        assert.ok(!r.valid);
    });

    it('hcg1 = 0 fails', () => {
        const r = validateEctopicInputs({
            hcg1: 0,
            hcg1Date: '2026-01-10T08:00',
            hcg2: 100,
            hcg2Date: '2026-01-12T08:00',
            ultrasoundMethod: 'tvus',
        }, 'C');
        assert.ok(!r.valid);
    });
});

// ─── assessRiskFactors ──────────────────────────────────────

describe('assessRiskFactors — OR-based risk scoring', () => {
    it('no risk factors → score 0, level LOW', () => {
        const r = assessRiskFactors({});
        assert.equal(r.totalFactors, 0);
    });

    it('previous ectopic (A) → VERY_HIGH factor, OR ≈ 8-10', () => {
        const r = assessRiskFactors({ previousEctopic: true });
        assert.equal(r.totalFactors, 1);
        assert.ok(r.maxOr >= 8);
        assert.ok(r.factors.some(f => f.id === 'A'));
    });

    it('tubal surgery (B) → VERY_HIGH factor', () => {
        const r = assessRiskFactors({ tubalSurgery: true });
        assert.ok(r.maxOr >= 4);
    });

    it('PID (C) + smoking (F) → 2 factors', () => {
        const r = assessRiskFactors({ pid: true, smoking: true });
        assert.equal(r.totalFactors, 2);
    });

    it('IUD at conception (D) → HIGH factor', () => {
        const r = assessRiskFactors({ iud: true });
        assert.ok(r.maxOr >= 2);
    });

    it('multiple risk factors accumulate', () => {
        const r = assessRiskFactors({
            previousEctopic: true,
            pid: true,
            smoking: true,
            ivf: true,
        });
        assert.equal(r.totalFactors, 4);
    });
});

// ─── evaluateDecisionTree ───────────────────────────────────

describe('evaluateDecisionTree — clinical decision pathway', () => {
    it('unstable hemodynamics → EMERGENCY', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: false,
        });
        assert.equal(r.pathway, 'EMERGENCY');
    });

    it('IUP confirmed → EXCLUDE_ECTOPIC', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: true,
            iupConfirmed: true,
        });
        assert.equal(r.pathway, 'EXCLUDE_ECTOPIC');
    });

    it('ectopic confirmed (fetal heartbeat outside uterus) → CONFIRMED_ECTOPIC', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: true,
            iupConfirmed: false,
            ectopicConfirmed: true,
            fetalHeartbeatOutside: true,
        });
        assert.equal(r.pathway, 'CONFIRMED_ECTOPIC');
        assert.ok(r.requiresSurgery);
    });

    it('PUL + hCG above DZ → SUSPECT_HIGH', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: true,
            iupConfirmed: false,
            ectopicConfirmed: false,
            isPUL: true,
            hcg: 4000,
            ultrasoundMethod: 'tvus',
        });
        assert.equal(r.pathway, 'SUSPECT_HIGH');
    });

    it('PUL + hCG below DZ → FOLLOW_UP', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: true,
            iupConfirmed: false,
            ectopicConfirmed: false,
            isPUL: true,
            hcg: 800,
            ultrasoundMethod: 'tvus',
        });
        assert.equal(r.pathway, 'FOLLOW_UP');
    });

    it('adnexal mass → SUSPECT_HIGH', () => {
        const r = evaluateDecisionTree({
            hemodynamicStable: true,
            iupConfirmed: false,
            ectopicConfirmed: false,
            isPUL: false,
            hasAdnexalMass: true,
        });
        assert.equal(r.pathway, 'SUSPECT_HIGH');
    });
});

// ─── classifyRiskLevel ──────────────────────────────────────

describe('classifyRiskLevel — 4-tier classification', () => {
    it('VERY_HIGH: ≥1 A-B factor + abnormal hCG + adnexal mass', () => {
        const r = classifyRiskLevel({
            riskFactors: { maxOr: 9, totalFactors: 1, hasVeryHighFactor: true },
            hcgAboveDiscriminatoryZone: true,
            hasAdnexalMass: true,
        });
        assert.equal(r.level, 'VERY_HIGH');
    });

    it('HIGH: ≥1 C-E factor + empty uterus + hCG above DZ', () => {
        const r = classifyRiskLevel({
            riskFactors: { maxOr: 3, totalFactors: 1, hasHighFactor: true },
            hcgAboveDiscriminatoryZone: true,
            emptyUterus: true,
        });
        assert.equal(r.level, 'HIGH');
    });

    it('MEDIUM: ≥2 F-K factors + PUL + slow hCG rise', () => {
        const r = classifyRiskLevel({
            riskFactors: { maxOr: 2, totalFactors: 2, hasMediumFactor: true },
            isPUL: true,
            slowHcgRise: true,
        });
        assert.equal(r.level, 'MEDIUM');
    });

    it('LOW: no risk factors + IUP confirmed', () => {
        const r = classifyRiskLevel({
            riskFactors: { maxOr: 0, totalFactors: 0 },
            iupConfirmed: true,
        });
        assert.equal(r.level, 'LOW');
    });
});

// ═══════════════════════════════════════════════════════════
// TOOL B: FERNANDEZ SCORE CALCULATOR
// ═══════════════════════════════════════════════════════════

// ─── calcFernandezScore ─────────────────────────────────────

describe('calcFernandezScore — 6 criteria scoring', () => {
    it('all minimum (1 point each) → total 6', () => {
        const r = calcFernandezScore({
            gestationalDays: 35,    // < 42 → 1
            hcg: 500,               // < 1000 → 1
            progesterone: 3,        // < 5 → 1
            pain: 'none',           // no pain → 1
            hematosalpinxCm: 0.5,   // < 1 → 1
            hemoperitoneumMl: 0,    // 0 → 1
        });
        assert.equal(r.total, 6);
        assert.deepEqual(r.scores, [1, 1, 1, 1, 1, 1]);
    });

    it('all maximum (3 points each) → total 18', () => {
        const r = calcFernandezScore({
            gestationalDays: 55,    // > 49 → 3
            hcg: 8000,              // > 5000 → 3
            progesterone: 15,       // > 10 → 3
            pain: 'spontaneous',    // spontaneous → 3
            hematosalpinxCm: 4,     // > 3 → 3
            hemoperitoneumMl: 150,  // > 100 → 3
        });
        assert.equal(r.total, 18);
        assert.deepEqual(r.scores, [3, 3, 3, 3, 3, 3]);
    });

    it('mixed scores → correct total', () => {
        const r = calcFernandezScore({
            gestationalDays: 45,    // 42-49 → 2
            hcg: 3000,              // 1000-5000 → 2
            progesterone: 7,        // 5-10 → 2
            pain: 'induced',        // induced → 2
            hematosalpinxCm: 2,     // 1-3 → 2
            hemoperitoneumMl: 50,   // 1-100 → 2
        });
        assert.equal(r.total, 12);
        assert.deepEqual(r.scores, [2, 2, 2, 2, 2, 2]);
    });

    it('boundary: gestational days = 42 → 2 points', () => {
        const r = calcFernandezScore({
            gestationalDays: 42,
            hcg: 500, progesterone: 3, pain: 'none',
            hematosalpinxCm: 0, hemoperitoneumMl: 0,
        });
        assert.equal(r.scores[0], 2);
    });

    it('boundary: hcg = 1000 → 2 points', () => {
        const r = calcFernandezScore({
            gestationalDays: 35, hcg: 1000, progesterone: 3,
            pain: 'none', hematosalpinxCm: 0, hemoperitoneumMl: 0,
        });
        assert.equal(r.scores[1], 2);
    });

    it('boundary: hcg = 5000 → 2 points (inclusive upper bound)', () => {
        const r = calcFernandezScore({
            gestationalDays: 35, hcg: 5000, progesterone: 3,
            pain: 'none', hematosalpinxCm: 0, hemoperitoneumMl: 0,
        });
        assert.equal(r.scores[1], 2);
    });

    it('boundary: hcg = 5001 → 3 points', () => {
        const r = calcFernandezScore({
            gestationalDays: 35, hcg: 5001, progesterone: 3,
            pain: 'none', hematosalpinxCm: 0, hemoperitoneumMl: 0,
        });
        assert.equal(r.scores[1], 3);
    });
});

// ─── interpretFernandez ─────────────────────────────────────

describe('interpretFernandez — severity classification', () => {
    it('score 6 → mild', () => {
        const r = interpretFernandez(6);
        assert.equal(r.severity, 'MILD');
    });

    it('score 8 → mild', () => {
        const r = interpretFernandez(8);
        assert.equal(r.severity, 'MILD');
    });

    it('score 9 → moderate', () => {
        const r = interpretFernandez(9);
        assert.equal(r.severity, 'MODERATE');
    });

    it('score 12 → moderate', () => {
        const r = interpretFernandez(12);
        assert.equal(r.severity, 'MODERATE');
    });

    it('score 13 → severe', () => {
        const r = interpretFernandez(13);
        assert.equal(r.severity, 'SEVERE');
    });

    it('score 15 → severe', () => {
        const r = interpretFernandez(15);
        assert.equal(r.severity, 'SEVERE');
    });

    it('score 16 → very severe', () => {
        const r = interpretFernandez(16);
        assert.equal(r.severity, 'VERY_SEVERE');
    });

    it('score 18 → very severe', () => {
        const r = interpretFernandez(18);
        assert.equal(r.severity, 'VERY_SEVERE');
    });

    it('returns management recommendation', () => {
        const r = interpretFernandez(10);
        assert.ok(r.management.length > 0);
    });
});

// ─── checkMtxContraindications ──────────────────────────────

describe('checkMtxContraindications — MTX eligibility check', () => {
    it('no contraindications → eligible', () => {
        const r = checkMtxContraindications({
            hemodynamicStable: true,
            fetalHeartbeatOutside: false,
            liverFailure: false,
            renalFailure: false,
            leukopenia: false,
            thrombocytopenia: false,
            activePulmonary: false,
            activeUlcer: false,
            breastfeeding: false,
            mtxAllergy: false,
        });
        assert.ok(r.eligible);
        assert.equal(r.contraindications.length, 0);
    });

    it('unstable hemodynamics → not eligible', () => {
        const r = checkMtxContraindications({
            hemodynamicStable: false,
            fetalHeartbeatOutside: false,
        });
        assert.ok(!r.eligible);
        assert.ok(r.contraindications.length > 0);
    });

    it('fetal heartbeat outside uterus → not eligible', () => {
        const r = checkMtxContraindications({
            hemodynamicStable: true,
            fetalHeartbeatOutside: true,
        });
        assert.ok(!r.eligible);
    });

    it('multiple contraindications → all listed', () => {
        const r = checkMtxContraindications({
            hemodynamicStable: false,
            fetalHeartbeatOutside: true,
            liverFailure: true,
            renalFailure: true,
        });
        assert.ok(!r.eligible);
        assert.ok(r.contraindications.length >= 4);
    });
});

// ═══════════════════════════════════════════════════════════
// TOOL C: β-hCG DOUBLING TIME & DISCRIMINATORY ZONE
// ═══════════════════════════════════════════════════════════

// ─── calcDoublingTime ───────────────────────────────────────

describe('calcDoublingTime — β-hCG doubling time', () => {
    it('exact doubling in 48h → doubling time = 48h', () => {
        const dt = calcDoublingTime(1000, 2000, 48);
        assert.ok(Math.abs(dt - 48) < 0.1, `DT=${dt} should be ~48h`);
    });

    it('quadrupling in 48h → doubling time = 24h', () => {
        const dt = calcDoublingTime(1000, 4000, 48);
        assert.ok(Math.abs(dt - 24) < 0.1, `DT=${dt} should be ~24h`);
    });

    it('slow rise → longer doubling time', () => {
        const dt = calcDoublingTime(1000, 1200, 48);
        assert.ok(dt > 100, `DT=${dt} should be > 100h for slow rise`);
    });

    it('returns Infinity when hcg2 <= hcg1 (no rise)', () => {
        const dt = calcDoublingTime(1000, 1000, 48);
        assert.ok(!isFinite(dt) || dt > 10000, `DT=${dt} should be very large or Infinity`);
    });

    it('returns negative when hcg decreases (indicates decline)', () => {
        const dt = calcDoublingTime(2000, 1000, 48);
        assert.ok(dt < 0, `DT=${dt} should be negative for declining hCG`);
    });
});

// ─── calcHalfLife ───────────────────────────────────────────

describe('calcHalfLife — β-hCG half-life', () => {
    it('halving in 48h → half-life = 48h', () => {
        const hl = calcHalfLife(2000, 1000, 48);
        assert.ok(Math.abs(hl - 48) < 0.1, `HL=${hl} should be ~48h`);
    });

    it('quarter in 48h → half-life = 24h', () => {
        const hl = calcHalfLife(4000, 1000, 48);
        assert.ok(Math.abs(hl - 24) < 0.1, `HL=${hl} should be ~24h`);
    });

    it('slow decline → longer half-life', () => {
        const hl = calcHalfLife(1000, 900, 48);
        assert.ok(hl > 200, `HL=${hl} should be > 200h`);
    });

    it('returns Infinity when hcg not decreasing', () => {
        const hl = calcHalfLife(1000, 1000, 48);
        assert.ok(!isFinite(hl) || hl > 10000, 'should be very large when no decline');
    });
});

// ─── calcPercentChange48h ───────────────────────────────────

describe('calcPercentChange48h — normalized % change', () => {
    it('doubling in 48h → +100%', () => {
        const pct = calcPercentChange48h(1000, 2000, 48);
        assert.ok(Math.abs(pct - 100) < 1, `pct=${pct} should be ~100%`);
    });

    it('doubling in 24h → greater than 100% in 48h equivalent', () => {
        const pct = calcPercentChange48h(1000, 2000, 24);
        assert.ok(pct > 100, `pct=${pct} should be > 100%`);
    });

    it('halving in 48h → -50%', () => {
        const pct = calcPercentChange48h(2000, 1000, 48);
        assert.ok(Math.abs(pct - (-50)) < 1, `pct=${pct} should be ~-50%`);
    });

    it('no change → 0%', () => {
        const pct = calcPercentChange48h(1000, 1000, 48);
        assert.ok(Math.abs(pct) < 1, `pct=${pct} should be ~0%`);
    });
});

// ─── classifyHcgTrend ───────────────────────────────────────

describe('classifyHcgTrend — trend classification', () => {
    it('DT 31-72h → NORMAL_IUP', () => {
        const r = classifyHcgTrend({ doublingTimeHours: 48, percentChange48h: 100, isDecreasing: false });
        assert.equal(r.classification, 'NORMAL_IUP');
    });

    it('DT 72-96h → BORDERLINE', () => {
        const r = classifyHcgTrend({ doublingTimeHours: 80, percentChange48h: 42, isDecreasing: false });
        assert.equal(r.classification, 'BORDERLINE');
    });

    it('DT > 96h → SUSPECT_ECTOPIC', () => {
        const r = classifyHcgTrend({ doublingTimeHours: 120, percentChange48h: 20, isDecreasing: false });
        assert.equal(r.classification, 'SUSPECT_ECTOPIC');
    });

    it('decrease ≥ 36% → SUSPECT_MISCARRIAGE', () => {
        const r = classifyHcgTrend({ doublingTimeHours: null, percentChange48h: -45, isDecreasing: true });
        assert.equal(r.classification, 'SUSPECT_MISCARRIAGE');
    });

    it('decrease < 21% → SUSPECT_ECTOPIC_DECLINE', () => {
        const r = classifyHcgTrend({ doublingTimeHours: null, percentChange48h: -15, isDecreasing: true });
        assert.equal(r.classification, 'SUSPECT_ECTOPIC_DECLINE');
    });

    it('decrease 21-35% → INDETERMINATE_DECLINE', () => {
        const r = classifyHcgTrend({ doublingTimeHours: null, percentChange48h: -28, isDecreasing: true });
        assert.equal(r.classification, 'INDETERMINATE_DECLINE');
    });

    it('plateau (<10% change) → PLATEAU_SUSPECT_ECTOPIC', () => {
        const r = classifyHcgTrend({ doublingTimeHours: 500, percentChange48h: 5, isDecreasing: false });
        assert.equal(r.classification, 'PLATEAU_SUSPECT_ECTOPIC');
    });
});

// ─── compareDiscriminatoryZone ──────────────────────────────

describe('compareDiscriminatoryZone — DZ comparison', () => {
    it('TVUS: hCG 4000 → above DZ', () => {
        const r = compareDiscriminatoryZone(4000, 'tvus', false, false);
        assert.equal(r.relation, 'ABOVE');
    });

    it('TVUS: hCG 1000 → below DZ', () => {
        const r = compareDiscriminatoryZone(1000, 'tvus', false, false);
        assert.equal(r.relation, 'BELOW');
    });

    it('TVUS: hCG 2000 → within zone (1500-3500)', () => {
        const r = compareDiscriminatoryZone(2000, 'tvus', false, false);
        // 2000 is above lower bound 1500, but below upper 3500 — should be "WITHIN" or "ABOVE"
        assert.ok(r.relation === 'ABOVE' || r.relation === 'WITHIN');
    });

    it('TAS: hCG 7000 → above DZ', () => {
        const r = compareDiscriminatoryZone(7000, 'tas', false, false);
        assert.equal(r.relation, 'ABOVE');
    });

    it('TAS: hCG 3000 → below DZ', () => {
        const r = compareDiscriminatoryZone(3000, 'tas', false, false);
        assert.equal(r.relation, 'BELOW');
    });

    it('desired pregnancy uses conservative threshold (3500 for TVUS)', () => {
        const normal = compareDiscriminatoryZone(2000, 'tvus', false, false);
        const desired = compareDiscriminatoryZone(2000, 'tvus', true, false);
        assert.ok(desired.threshold >= normal.threshold);
    });

    it('IVF may use higher threshold', () => {
        const normal = compareDiscriminatoryZone(4000, 'tvus', false, false);
        const ivf = compareDiscriminatoryZone(4000, 'tvus', false, true);
        assert.ok(ivf.threshold >= normal.threshold);
    });
});

// ─── getMinimumRise ─────────────────────────────────────────

describe('getMinimumRise — Barnhart 2016 minimum thresholds', () => {
    it('hCG < 1500 → minimum rise ≥ 49%', () => {
        assert.ok(getMinimumRise(800) >= 49);
    });

    it('hCG 1500-3000 → minimum rise ≥ 40%', () => {
        assert.ok(getMinimumRise(2000) >= 40);
    });

    it('hCG > 3000 → minimum rise ≥ 33%', () => {
        assert.ok(getMinimumRise(5000) >= 33);
    });
});

// ─── buildPrompts ───────────────────────────────────────────

describe('buildPromptA — Risk Estimation prompt', () => {
    it('contains patient info', () => {
        const prompt = buildPromptA(
            { age: 30, gaWeeks: 6, gaDays: 3 },
            { riskLevel: 'HIGH', pathway: 'SUSPECT_HIGH' }
        );
        assert.ok(prompt.includes('30'));
        assert.ok(prompt.includes('6'));
    });

    it('contains analysis request', () => {
        const prompt = buildPromptA(
            { age: 30, gaWeeks: 6, gaDays: 3 },
            { riskLevel: 'HIGH', pathway: 'SUSPECT_HIGH' }
        );
        assert.ok(prompt.includes('PHÂN TÍCH') || prompt.includes('YÊU CẦU'));
    });

    it('contains disclaimer', () => {
        const prompt = buildPromptA(
            { age: 30, gaWeeks: 6, gaDays: 3 },
            { riskLevel: 'LOW' }
        );
        assert.ok(prompt.includes('không thay thế') || prompt.includes('KHÔNG thay thế'));
    });
});

describe('buildPromptB — Fernandez Score prompt', () => {
    it('includes Fernandez total score', () => {
        const prompt = buildPromptB(
            { gestationalDays: 45, hcg: 3000, progesterone: 7, pain: 'induced', hematosalpinxCm: 2, hemoperitoneumMl: 50 },
            { fernandez: { total: 12, scores: [2, 2, 2, 2, 2, 2] }, severity: 'MODERATE', management: 'MTX liều đơn' }
        );
        assert.ok(prompt.includes('12'));
        assert.ok(prompt.includes('Fernandez'));
    });
});

describe('buildPromptC — β-hCG Doubling Time prompt', () => {
    it('includes doubling time value', () => {
        const prompt = buildPromptC(
            { hcg1: 1000, hcg2: 2000, deltaHours: 48 },
            { doublingTime: 48, percentChange48h: 100, classification: 'NORMAL_IUP' }
        );
        assert.ok(prompt.includes('48'));
    });

    it('includes discriminatory zone analysis', () => {
        const prompt = buildPromptC(
            { hcg1: 1000, hcg2: 2000, deltaHours: 48, ultrasoundMethod: 'tvus' },
            { doublingTime: 48, percentChange48h: 100, classification: 'NORMAL_IUP', dzRelation: 'BELOW' }
        );
        assert.ok(prompt.includes('discriminatory') || prompt.includes('ngưỡng') || prompt.includes('phân biệt'));
    });
});
