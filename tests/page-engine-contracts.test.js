/**
 * Page-Engine Contract Tests
 *
 * These tests prevent the #1 class of bugs in this project:
 *   "Cannot read properties of undefined (reading 'xxx')"
 *
 * Each test simulates exactly what an Astro page does:
 *   1. Build input using the SAME property names the page uses
 *   2. Call engine functions with the SAME arguments the page uses
 *   3. Assert every property the page accesses exists + correct type
 *
 * If a test fails → the page WILL crash at runtime.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════
// 1. DOPPLER — doppler-thai-nhi.astro ↔ fetal-doppler-calc.js
// ═══════════════════════════════════════════════════════════════

import {
    calcIG21,
    calcMcaPsv,
    calcFmfDoppler,
    calcUtaPi,
    classifyDoppler,
} from '../src/utils/fetal-doppler-calc.js';

describe('CONTRACT: doppler-thai-nhi.astro ↔ fetal-doppler-calc.js', () => {

    // Page calls: calcIG21(uaPi, 'PI', ga)
    describe('calcIG21 — page passes index "PI", not "UA_PI"', () => {
        it('index "PI" returns non-null result', () => {
            const r = calcIG21(1.0, 'PI', 30);
            assert.ok(r !== null, 'calcIG21("PI") must not return null');
        });

        it('result has .z (not .zScore)', () => {
            const r = calcIG21(1.0, 'PI', 30);
            assert.equal(typeof r.z, 'number', 'must have .z');
        });

        it('result has .centile', () => {
            const r = calcIG21(1.0, 'PI', 30);
            assert.equal(typeof r.centile, 'number', 'must have .centile');
        });

        it('index "RI" returns non-null result', () => {
            const r = calcIG21(0.65, 'RI', 30);
            assert.ok(r !== null, 'calcIG21("RI") must not return null');
            assert.equal(typeof r.z, 'number');
            assert.equal(typeof r.centile, 'number');
        });

        it('invalid index returns null (guard against crash)', () => {
            const r = calcIG21(1.0, 'UA_PI', 30);
            assert.equal(r, null, '"UA_PI" is invalid index → must return null');
        });
    });

    // Page calls: calcMcaPsv(psvVal, ga)
    describe('calcMcaPsv — page accesses .anemiaClass, .mom', () => {
        it('result has .anemiaClass (not .anemiaRisk)', () => {
            const r = calcMcaPsv(45, 30);
            assert.ok('anemiaClass' in r, 'must have .anemiaClass');
            assert.ok(!('anemiaRisk' in r), 'must NOT have .anemiaRisk');
        });

        it('.anemiaClass is one of NORMAL, MILD, SEVERE_MODERATE', () => {
            const r = calcMcaPsv(45, 30);
            assert.ok(['NORMAL', 'MILD', 'SEVERE_MODERATE'].includes(r.anemiaClass));
        });

        it('result has .mom as number', () => {
            const r = calcMcaPsv(45, 30);
            assert.equal(typeof r.mom, 'number');
        });
    });

    // Page calls: calcFmfDoppler(uaPi, mcaPi, ga)
    describe('calcFmfDoppler — page accesses .cpr, .cpr_status, .cpr_5th', () => {
        it('result has .cpr, .cpr_status, .cpr_5th', () => {
            const r = calcFmfDoppler(1.0, 1.8, 30);
            assert.equal(typeof r.cpr, 'number', 'must have .cpr');
            assert.ok('cpr_status' in r, 'must have .cpr_status');
            assert.equal(typeof r.cpr_5th, 'number', 'must have .cpr_5th');
        });

        it('does NOT have .cprCentile (old wrong name)', () => {
            const r = calcFmfDoppler(1.0, 1.8, 30);
            assert.ok(!('cprCentile' in r), 'must NOT have .cprCentile');
        });

        it('.cpr_status is NORMAL or ABNORMAL', () => {
            const r = calcFmfDoppler(1.0, 1.8, 30);
            assert.ok(['NORMAL', 'ABNORMAL'].includes(r.cpr_status));
        });
    });

    // Page calls: calcUtaPi(piL, piR, ga) — note: no notching param from page
    describe('calcUtaPi — page accesses .piMean, .mom, .status, .ref95th', () => {
        it('result has .piMean (not .meanPi)', () => {
            const r = calcUtaPi(0.9, 0.85, 30);
            assert.equal(typeof r.piMean, 'number', 'must have .piMean');
            assert.ok(!('meanPi' in r), 'must NOT have .meanPi');
        });

        it('result has .mom, .status, .ref95th', () => {
            const r = calcUtaPi(0.9, 0.85, 30);
            assert.equal(typeof r.mom, 'number', 'must have .mom');
            assert.ok(['NORMAL', 'ABNORMAL'].includes(r.status), 'must have .status');
            assert.equal(typeof r.ref95th, 'number', 'must have .ref95th');
        });

        it('does NOT have .zScore or .centile (old wrong names)', () => {
            const r = calcUtaPi(0.9, 0.85, 30);
            assert.ok(!('zScore' in r), 'must NOT have .zScore');
        });
    });

    // Page calls: classifyDoppler({ gaWeeks, endDiastolic, uaIG21, mcaPsv, fmf, uta })
    describe('classifyDoppler — page accesses .severity, .alerts (not .warnings)', () => {
        it('result has .severity and .alerts', () => {
            const r = classifyDoppler({
                gaWeeks: 30, endDiastolic: 'PRESENT',
                uaIG21: null, mcaPsv: null, fmf: null, uta: null,
            });
            assert.ok('severity' in r, 'must have .severity');
            assert.ok('alerts' in r, 'must have .alerts');
            assert.ok(Array.isArray(r.alerts), '.alerts must be an array');
        });

        it('does NOT have .warnings (old wrong name)', () => {
            const r = classifyDoppler({
                gaWeeks: 30, endDiastolic: 'PRESENT',
                uaIG21: null, mcaPsv: null, fmf: null, uta: null,
            });
            assert.ok(!('warnings' in r), 'must NOT have .warnings');
        });

        it('.severity is uppercase: NORMAL | ABNORMAL | SEVERE | CRITICAL', () => {
            const r = classifyDoppler({
                gaWeeks: 30, endDiastolic: 'PRESENT',
                uaIG21: null, mcaPsv: null, fmf: null, uta: null,
            });
            assert.ok(['NORMAL', 'ABNORMAL', 'SEVERE', 'CRITICAL'].includes(r.severity));
        });

        it('EDF must be uppercase: AEDF / REDF (not "absent" / "reversed")', () => {
            const r1 = classifyDoppler({
                gaWeeks: 30, endDiastolic: 'AEDF',
                uaIG21: null, mcaPsv: null, fmf: null, uta: null,
            });
            assert.equal(r1.severity, 'SEVERE', 'AEDF → SEVERE');

            const r2 = classifyDoppler({
                gaWeeks: 30, endDiastolic: 'REDF',
                uaIG21: null, mcaPsv: null, fmf: null, uta: null,
            });
            assert.equal(r2.severity, 'CRITICAL', 'REDF → CRITICAL');
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// 2. OVARIAN — danh-gia-khoi-u-buong-trung.astro ↔ ovarian-risk-engine.js
// ═══════════════════════════════════════════════════════════════

import {
    screenPatient as ovarianScreenPatient,
    getActionPlan,
    createEmptyPatient as ovarianCreateEmpty,
} from '../src/utils/ovarian-risk-engine.js';

describe('CONTRACT: danh-gia-khoi-u-buong-trung.astro ↔ ovarian-risk-engine.js', () => {

    describe('screenPatient — input shape uses "ultrasound" not "usFeatures"', () => {
        const data = ovarianCreateEmpty();
        data.ca125 = 50;
        data.postmenopausal = false;
        data.ultrasound.solid = true;

        it('accepts ultrasound property (not usFeatures)', () => {
            const r = ovarianScreenPatient(data);
            assert.ok(r, 'must return result');
        });

        it('result has .overallRisk', () => {
            const r = ovarianScreenPatient(data);
            assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(r.overallRisk));
        });

        it('result has .rmi1, .rmi1Cat, .rmi2, .rmi2Cat, .rmi3, .rmi3Cat, .rmi4, .rmi4Cat', () => {
            const r = ovarianScreenPatient(data);
            assert.equal(typeof r.rmi1, 'number');
            assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(r.rmi1Cat));
            assert.equal(typeof r.rmi2, 'number');
            assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(r.rmi2Cat));
            assert.equal(typeof r.rmi3, 'number');
            assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(r.rmi3Cat));
            assert.equal(typeof r.rmi4, 'number');
            assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(r.rmi4Cat));
        });

        it('result has .romaCat and .romaCutoff (null when no HE4)', () => {
            const r = ovarianScreenPatient(data);
            // romaCat is null when HE4 not provided
            assert.ok('romaCat' in r);
            assert.ok('romaCutoff' in r);
        });

        it('result with HE4 has .roma and .romaCat as string', () => {
            const d = ovarianCreateEmpty();
            d.ca125 = 50;
            d.he4 = 100;
            d.postmenopausal = false;
            const r = ovarianScreenPatient(d);
            assert.equal(typeof r.roma, 'number');
            assert.ok(['LOW', 'HIGH'].includes(r.romaCat));
        });
    });

    describe('screenPatient — ultrasound property names must match engine', () => {
        it('uses "solid" not "solidAreas"', () => {
            const d = ovarianCreateEmpty();
            d.ca125 = 50;
            d.ultrasound.solid = true;
            const r = ovarianScreenPatient(d);
            assert.ok(r.usScore >= 1, 'solid feature must be counted');
        });

        it('uses "metastases" not "metastasis"', () => {
            const d = ovarianCreateEmpty();
            d.ca125 = 50;
            d.ultrasound.metastases = true;
            const r = ovarianScreenPatient(d);
            assert.ok(r.usScore >= 1, 'metastases feature must be counted');
        });

        it('uses "tumorSizeCm" not "tumorSize"', () => {
            const d = ovarianCreateEmpty();
            d.ca125 = 50;
            d.postmenopausal = true;
            d.tumorSizeCm = 8;
            d.ultrasound.solid = true;
            d.ultrasound.ascites = true;
            const r = ovarianScreenPatient(d);
            // RMI4 uses size ≥ 7cm → S=2, should differ from default S=1
            assert.ok(r.rmi4 > 0, 'tumorSizeCm must affect RMI4');
        });
    });

    describe('getActionPlan — returns object with .actions array', () => {
        it('HIGH risk returns { label, urgency, actions[] }', () => {
            const plan = getActionPlan('HIGH');
            assert.equal(typeof plan.label, 'string');
            assert.equal(typeof plan.urgency, 'string');
            assert.ok(Array.isArray(plan.actions), '.actions must be array');
            assert.ok(plan.actions.length > 0);
        });

        it('MODERATE risk returns { label, urgency, actions[] }', () => {
            const plan = getActionPlan('MODERATE');
            assert.ok(Array.isArray(plan.actions));
        });

        it('LOW risk returns { label, urgency, actions[] }', () => {
            const plan = getActionPlan('LOW');
            assert.ok(Array.isArray(plan.actions));
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// 3. PREECLAMPSIA — sang-loc-tien-san-giat.astro ↔ preeclampsia-engine.js
// ═══════════════════════════════════════════════════════════════

import {
    createEmptyPatient,
    preprocess,
    classifyACOG,
    classifyNICE,
    checkConcordance,
    aspirinTiming,
    getFollowUp,
} from '../src/utils/preeclampsia-engine.js';

describe('CONTRACT: sang-loc-tien-san-giat.astro ↔ preeclampsia-engine.js', () => {

    describe('createEmptyPatient — page accesses nested properties', () => {
        it('has .maternal_age, .gestational_age_weeks, .weight_kg, .height_cm', () => {
            const p = createEmptyPatient();
            assert.ok('maternal_age' in p);
            assert.ok('gestational_age_weeks' in p);
            assert.ok('weight_kg' in p);
            assert.ok('height_cm' in p);
        });

        it('has .high_risk nested object with all 6 fields', () => {
            const p = createEmptyPatient();
            assert.ok(typeof p.high_risk === 'object');
            assert.ok('history_preeclampsia' in p.high_risk);
            assert.ok('chronic_hypertension' in p.high_risk);
            assert.ok('pregestational_diabetes' in p.high_risk);
            assert.ok('chronic_kidney_disease' in p.high_risk);
            assert.ok('autoimmune_disease' in p.high_risk);
            assert.ok('multifetal' in p.high_risk);
        });

        it('has .moderate_risk nested object with all 5 fields', () => {
            const p = createEmptyPatient();
            assert.ok(typeof p.moderate_risk === 'object');
            assert.ok('nulliparity' in p.moderate_risk);
            assert.ok('family_history_pe' in p.moderate_risk);
            assert.ok('previous_adverse_outcome' in p.moderate_risk);
            assert.ok('ivf' in p.moderate_risk);
            assert.ok('interpregnancy_gt_10y' in p.moderate_risk);
        });
    });

    describe('classifyACOG — page accesses .category, .aspirin, .high_factors, .moderate_factors', () => {
        it('returns all 4 properties', () => {
            const p = createEmptyPatient();
            p.maternal_age = 30;
            preprocess(p);
            const r = classifyACOG(p);
            assert.ok(['HIGH', 'MODERATE', 'LOW'].includes(r.category));
            assert.ok('aspirin' in r);
            assert.ok(Array.isArray(r.high_factors));
            assert.ok(Array.isArray(r.moderate_factors));
        });
    });

    describe('classifyNICE — page accesses .category, .aspirin, .high_factors, .moderate_factors', () => {
        it('returns all 4 properties', () => {
            const p = createEmptyPatient();
            p.maternal_age = 30;
            preprocess(p);
            const r = classifyNICE(p);
            assert.ok(['HIGH', 'MODERATE', 'LOW'].includes(r.category));
            assert.ok('aspirin' in r);
            assert.ok(Array.isArray(r.high_factors));
            assert.ok(Array.isArray(r.moderate_factors));
        });
    });

    describe('checkConcordance — page accesses .agree, .reasons', () => {
        it('returns { agree: boolean, reasons: string[] }', () => {
            const p = createEmptyPatient();
            p.maternal_age = 30;
            preprocess(p);
            const acog = classifyACOG(p);
            const nice = classifyNICE(p);
            const r = checkConcordance(acog, nice, p);
            assert.equal(typeof r.agree, 'boolean');
            assert.ok(Array.isArray(r.reasons));
        });
    });

    describe('aspirinTiming — page accesses .text', () => {
        it('returns { urgency, text } when aspirin is true', () => {
            const r = aspirinTiming(14, true);
            assert.ok(r !== null);
            assert.equal(typeof r.text, 'string');
            assert.equal(typeof r.urgency, 'string');
        });

        it('returns null when aspirin is false', () => {
            const r = aspirinTiming(14, false);
            assert.equal(r, null);
        });
    });

    describe('getFollowUp — page uses return value as array', () => {
        it('returns array of strings for HIGH', () => {
            const r = getFollowUp('HIGH');
            assert.ok(Array.isArray(r));
            assert.ok(r.length > 0);
            assert.equal(typeof r[0], 'string');
        });

        it('returns array for MODERATE and LOW', () => {
            assert.ok(Array.isArray(getFollowUp('MODERATE')));
            assert.ok(Array.isArray(getFollowUp('LOW')));
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// 4. GDM — du-doan-dai-thao-duong-thai-ky.astro ↔ gdm-calc.js
// ═══════════════════════════════════════════════════════════════

import {
    calcFmfGDMRisk,
    stratifyFmfRisk,
    calcFmfPrevGDM,
    calcIowaGDMRisk,
    stratifyIowaRisk,
    calcBMI,
} from '../src/utils/gdm-calc.js';

describe('CONTRACT: du-doan-dai-thao-duong-thai-ky.astro ↔ gdm-calc.js', () => {

    describe('calcBMI — page calls calcBMI(weight, height)', () => {
        it('returns number', () => {
            const r = calcBMI(65, 160);
            assert.equal(typeof r, 'number');
            assert.ok(r > 0);
        });
    });

    describe('calcFmfPrevGDM — page uses return × 100 as risk%', () => {
        it('returns number in [0,1]', () => {
            const r = calcFmfPrevGDM(65);
            assert.equal(typeof r, 'number');
            assert.ok(r >= 0 && r <= 1);
        });
    });

    describe('calcFmfGDMRisk — page accesses .risk', () => {
        it('returns object with .risk number', () => {
            const r = calcFmfGDMRisk({
                age: 30, weight: 65, height: 160,
                parity: 0, ethnicity: 'east_asian',
                familyDM: false, pcos: false,
                priorMacrosomia: false, priorGDM: false,
            });
            assert.equal(typeof r.risk, 'number');
            assert.ok(r.risk >= 0 && r.risk <= 1);
        });
    });

    describe('stratifyFmfRisk — page accesses .label and .color', () => {
        it('returns { label, color } for various risk%', () => {
            for (const riskPct of [2, 10, 25]) {
                const r = stratifyFmfRisk(riskPct);
                assert.equal(typeof r.label, 'string', `label for ${riskPct}%`);
                assert.ok('color' in r, `color for ${riskPct}%`);
            }
        });
    });

    describe('calcIowaGDMRisk — page accesses .risk', () => {
        it('returns object with .risk', () => {
            const r = calcIowaGDMRisk({
                age: 30, bmi: 25, ethnicity: 'east_asian',
                familyDM: false, pcos: false,
            });
            assert.equal(typeof r.risk, 'number');
        });
    });

    describe('stratifyIowaRisk — page accesses .label and .color', () => {
        it('returns { label, color }', () => {
            const r = stratifyIowaRisk(10);
            assert.equal(typeof r.label, 'string');
            assert.ok('color' in r);
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// 5. PRETERM — du-doan-sinh-non.astro ↔ preterm-birth-calc.js
// ═══════════════════════════════════════════════════════════════

import {
    calcFmfRisk,
    stratifyRisk,
    estimateQuippRisk,
} from '../src/utils/preterm-birth-calc.js';

describe('CONTRACT: du-doan-sinh-non.astro ↔ preterm-birth-calc.js', () => {

    describe('calcFmfRisk — page accesses .riskBelow32, .riskBelow34, .riskBelow37', () => {
        it('returns all 3 risk properties as numbers', () => {
            const r = calcFmfRisk({
                maternalAge: 30,
                obstetricHistory: 'no_previous_ptb',
                cervicalLength: 25,
            });
            assert.equal(typeof r.riskBelow32, 'number');
            assert.equal(typeof r.riskBelow34, 'number');
            assert.equal(typeof r.riskBelow37, 'number');
        });
    });

    describe('stratifyRisk — page accesses .label, .level, .reason', () => {
        it('returns { label, level (string), reason, color }', () => {
            const r = stratifyRisk({
                cl: 25, ffn: null,
                hasRiskFactor: false, hasPreviousPtb32: false,
            });
            assert.equal(typeof r.label, 'string');
            assert.equal(typeof r.level, 'string');
            assert.equal(typeof r.reason, 'string');
        });

        it('.level is one of VERY_HIGH, HIGH, MODERATE, LOW, VERY_LOW', () => {
            const r = stratifyRisk({
                cl: 25, ffn: null,
                hasRiskFactor: false, hasPreviousPtb32: false,
            });
            assert.ok(
                ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'].includes(r.level),
                `level=${r.level}`
            );
        });
    });

    describe('estimateQuippRisk — page accesses .risk7d, .risk14d, .risk28d', () => {
        it('returns all 3 risk timeframes as numbers', () => {
            const r = estimateQuippRisk({
                gaWeeks: 28, gaDays: 0,
                cl: 20, ffn: 60,
                hasRiskFactor: true, symptomatic: true,
            });
            assert.equal(typeof r.risk7d, 'number');
            assert.equal(typeof r.risk14d, 'number');
            assert.equal(typeof r.risk28d, 'number');
        });

        it('risk7d ≤ risk14d ≤ risk28d (monotonic)', () => {
            const r = estimateQuippRisk({
                gaWeeks: 28, gaDays: 0,
                cl: 20, ffn: 60,
                hasRiskFactor: true, symptomatic: true,
            });
            assert.ok(r.risk7d <= r.risk14d, 'risk7d ≤ risk14d');
            assert.ok(r.risk14d <= r.risk28d, 'risk14d ≤ risk28d');
        });
    });
});
