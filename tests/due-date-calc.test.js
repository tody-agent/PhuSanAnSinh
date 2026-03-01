import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateDueDate,
    calculateDueDateFromConception,
    calculateGestationalAge,
    getTrimester,
    getPregnancyProgress,
    generateCheckupMilestones,
    getBabyDevelopment,
    getMilestoneStatus,
    formatDateVN,
    validateLmpDate,
    toLocalDate,
    calcEddByLmpModified,
    calcEddByIvf,
    calcGaFromCrl,
    calcEddFromUltrasoundGa,
    shouldRedate,
    reconcileEdd,
    getTermClassification,
    getClinicalWarnings,
} from '../src/utils/due-date-calc.js';

// Helper: compare dates by y/m/d only
function sameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// ─── calculateDueDate (Naegele's Rule) ───────────────────────

describe('calculateDueDate — Naegele\'s Rule (LMP + 280 days)', () => {
    it('classic case: 2026-01-01 → 2026-10-08', () => {
        const edd = calculateDueDate('2026-01-01');
        assert.ok(sameDate(edd, new Date(2026, 9, 8))); // Oct 8
    });

    it('cross-year: 2025-06-15 → 2026-03-22', () => {
        const edd = calculateDueDate('2025-06-15');
        assert.ok(sameDate(edd, new Date(2026, 2, 22))); // Mar 22
    });

    it('leap year handling: 2024-05-28 → 2025-03-04', () => {
        // 2024 is leap year. May 28 + 280 = Mar 4, 2025
        const edd = calculateDueDate('2024-05-28');
        assert.ok(sameDate(edd, new Date(2025, 2, 4)));
    });

    it('accepts Date object', () => {
        const edd = calculateDueDate(new Date(2026, 0, 1)); // Jan 1 2026
        assert.ok(sameDate(edd, new Date(2026, 9, 8)));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calculateDueDate('invalid'), /Invalid LMP date/);
    });
});

// ─── calculateDueDateFromConception ──────────────────────────

describe('calculateDueDateFromConception (Conception + 266 days)', () => {
    it('2026-01-15 conception → 2026-10-08', () => {
        // Jan 15 + 266 = Oct 8
        const edd = calculateDueDateFromConception('2026-01-15');
        assert.ok(sameDate(edd, new Date(2026, 9, 8)));
    });

    it('mid-year conception: 2025-07-01 → 2026-03-24', () => {
        const edd = calculateDueDateFromConception('2025-07-01');
        assert.ok(sameDate(edd, new Date(2026, 2, 24)));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calculateDueDateFromConception(''), /Invalid conception date/);
    });
});

// ─── calculateGestationalAge ─────────────────────────────────

describe('calculateGestationalAge', () => {
    it('exactly 8 weeks + 4 days: LMP 2026-01-01, ref 2026-03-02', () => {
        const ga = calculateGestationalAge('2026-01-01', '2026-03-02');
        // Jan 1 to Mar 2 = 31 + 28 + 2 = 60 days (non-leap 2026)
        assert.equal(ga.totalDays, 60);
        assert.equal(ga.weeks, 8);
        assert.equal(ga.days, 4);
    });

    it('exactly 0 weeks 0 days when same date', () => {
        const ga = calculateGestationalAge('2026-03-01', '2026-03-01');
        assert.equal(ga.weeks, 0);
        assert.equal(ga.days, 0);
        assert.equal(ga.totalDays, 0);
    });

    it('exactly 40 weeks', () => {
        const ga = calculateGestationalAge('2026-01-01', '2026-10-08');
        assert.equal(ga.weeks, 40);
        assert.equal(ga.days, 0);
        assert.equal(ga.totalDays, 280);
    });

    it('returns 0 for future LMP', () => {
        const ga = calculateGestationalAge('2027-01-01', '2026-03-01');
        assert.equal(ga.weeks, 0);
        assert.equal(ga.days, 0);
        assert.equal(ga.totalDays, 0);
    });

    it('1 day difference', () => {
        const ga = calculateGestationalAge('2026-03-01', '2026-03-02');
        assert.equal(ga.totalDays, 1);
        assert.equal(ga.weeks, 0);
        assert.equal(ga.days, 1);
    });
});

// ─── getTrimester ────────────────────────────────────────────

describe('getTrimester', () => {
    it('week 0 → T1', () => assert.equal(getTrimester(0), 1));
    it('week 13 → T1', () => assert.equal(getTrimester(13), 1));
    it('week 14 → T2', () => assert.equal(getTrimester(14), 2));
    it('week 27 → T2', () => assert.equal(getTrimester(27), 2));
    it('week 28 → T3', () => assert.equal(getTrimester(28), 3));
    it('week 40 → T3', () => assert.equal(getTrimester(40), 3));
});

// ─── getPregnancyProgress ────────────────────────────────────

describe('getPregnancyProgress', () => {
    it('0% at start', () => {
        const p = getPregnancyProgress('2026-03-01', '2026-03-01');
        assert.equal(p, 0);
    });

    it('50% at 20 weeks (140 days)', () => {
        const p = getPregnancyProgress('2026-01-01', '2026-05-21');
        // Jan 1 to May 21 = 140 days = 50%
        assert.equal(p, 50);
    });

    it('100% at 40 weeks', () => {
        const p = getPregnancyProgress('2026-01-01', '2026-10-08');
        assert.equal(p, 100);
    });

    it('capped at 100%', () => {
        const p = getPregnancyProgress('2026-01-01', '2026-12-01');
        assert.equal(p, 100);
    });
});

// ─── generateCheckupMilestones ───────────────────────────────

describe('generateCheckupMilestones', () => {
    it('returns 10 milestones', () => {
        const milestones = generateCheckupMilestones('2026-01-01');
        assert.equal(milestones.length, 10);
    });

    it('first milestone at week 8 with correct date', () => {
        const milestones = generateCheckupMilestones('2026-01-01');
        // week 8 = Jan 1 + 56 days = Feb 26
        assert.equal(milestones[0].week, 8);
        assert.ok(sameDate(milestones[0].date, new Date(2026, 1, 26)));
    });

    it('last milestone at week 40 = due date', () => {
        const milestones = generateCheckupMilestones('2026-01-01');
        const last = milestones[milestones.length - 1];
        assert.equal(last.week, 40);
        assert.ok(sameDate(last.date, new Date(2026, 9, 8)));
    });

    it('all milestones have required fields', () => {
        const milestones = generateCheckupMilestones('2026-01-01');
        for (const m of milestones) {
            assert.ok(m.week > 0, 'week > 0');
            assert.ok(m.date instanceof Date, 'has date');
            assert.ok(m.title.length > 0, 'has title');
            assert.ok(m.description.length > 0, 'has description');
            assert.ok(Array.isArray(m.tests), 'has tests array');
            assert.ok(m.tests.length > 0, 'has at least one test');
        }
    });

    it('throws on invalid date', () => {
        assert.throws(() => generateCheckupMilestones('xxx'), /Invalid LMP date/);
    });
});

// ─── getBabyDevelopment ──────────────────────────────────────

describe('getBabyDevelopment', () => {
    it('returns null for weeks < 4', () => {
        assert.equal(getBabyDevelopment(2), null);
        assert.equal(getBabyDevelopment(3), null);
    });

    it('returns data for week 12', () => {
        const dev = getBabyDevelopment(12);
        assert.ok(dev);
        assert.ok(dev.size.length > 0);
        assert.ok(dev.weight.length > 0);
        assert.ok(dev.fruit.length > 0);
        assert.ok(dev.fruitEmoji.length > 0);
        assert.ok(dev.description.length > 0);
    });

    it('rounds down to nearest available week', () => {
        const dev21 = getBabyDevelopment(21);
        const dev20 = getBabyDevelopment(20);
        // 21 rounds down to 20
        assert.deepEqual(dev21, dev20);
    });

    it('returns data for week 40', () => {
        const dev = getBabyDevelopment(40);
        assert.ok(dev);
        assert.ok(dev.fruit.includes('dưa hấu'));
    });
});

// ─── getMilestoneStatus ──────────────────────────────────────

describe('getMilestoneStatus', () => {
    it('"past" when current week is well beyond milestone', () => {
        assert.equal(getMilestoneStatus(12, 20, 0), 'past');
    });

    it('"current" when within ±1 week', () => {
        assert.equal(getMilestoneStatus(12, 12, 0), 'current');
        assert.equal(getMilestoneStatus(12, 11, 3), 'current');
        assert.equal(getMilestoneStatus(12, 13, 0), 'current');
    });

    it('"upcoming" when weeks away', () => {
        assert.equal(getMilestoneStatus(32, 20, 0), 'upcoming');
    });
});

// ─── formatDateVN ────────────────────────────────────────────

describe('formatDateVN', () => {
    it('formats single-digit day/month with leading zero', () => {
        assert.equal(formatDateVN(new Date(2026, 0, 5)), '05/01/2026');
    });

    it('formats double-digit day/month', () => {
        assert.equal(formatDateVN(new Date(2026, 11, 25)), '25/12/2026');
    });
});

// ─── validateLmpDate ─────────────────────────────────────────

describe('validateLmpDate', () => {
    it('valid: 8 weeks ago', () => {
        const result = validateLmpDate('2026-01-01', '2026-03-02');
        assert.ok(result.valid);
    });

    it('invalid: future date', () => {
        const result = validateLmpDate('2027-01-01', '2026-03-02');
        assert.ok(!result.valid);
        assert.ok(result.error.includes('tương lai'));
    });

    it('invalid: too recent (< 14 days)', () => {
        const result = validateLmpDate('2026-03-01', '2026-03-05');
        assert.ok(!result.valid);
        assert.ok(result.error.includes('2 tuần'));
    });

    it('invalid: too far back (> 301 days / 43 weeks)', () => {
        const result = validateLmpDate('2025-01-01', '2026-03-02');
        assert.ok(!result.valid);
        assert.ok(result.error.includes('43 tuần'));
    });

    it('invalid: garbage string', () => {
        const result = validateLmpDate('not-a-date');
        assert.ok(!result.valid);
        assert.ok(result.error.includes('không hợp lệ'));
    });
});

// ═══════════════════════════════════════════════════════════════
// NEW: ACOG-700 COMPLIANT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ─── calcEddByLmpModified (Naegele Modified) ─────────────────

describe('calcEddByLmpModified — Naegele modified for non-28-day cycles', () => {
    // T1: LMP = 01/06/2025, cycle = 28 → EDD = 08/03/2026
    it('T1: cycle 28 = standard Naegele: LMP 2025-06-01 → EDD 2026-03-08', () => {
        const edd = calcEddByLmpModified('2025-06-01', 28);
        assert.ok(sameDate(edd, new Date(2026, 2, 8)));
    });

    // T2: LMP = 01/06/2025, cycle = 35 → EDD = 15/03/2026
    it('T2: cycle 35 = +7 days: LMP 2025-06-01 → EDD 2026-03-15', () => {
        const edd = calcEddByLmpModified('2025-06-01', 35);
        assert.ok(sameDate(edd, new Date(2026, 2, 15)));
    });

    it('cycle 21 = -7 days from standard', () => {
        const edd28 = calcEddByLmpModified('2026-01-01', 28);
        const edd21 = calcEddByLmpModified('2026-01-01', 21);
        const diff = (edd28.getTime() - edd21.getTime()) / (1000 * 60 * 60 * 24);
        assert.equal(diff, 7);
    });

    it('cycle 30 = +2 days from standard', () => {
        const edd28 = calcEddByLmpModified('2026-01-01', 28);
        const edd30 = calcEddByLmpModified('2026-01-01', 30);
        const diff = (edd30.getTime() - edd28.getTime()) / (1000 * 60 * 60 * 24);
        assert.equal(diff, 2);
    });

    it('defaults to cycle 28 when not specified', () => {
        const edd = calcEddByLmpModified('2026-01-01');
        const eddBasic = calculateDueDate('2026-01-01');
        assert.ok(sameDate(edd, eddBasic));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calcEddByLmpModified('invalid'), /Invalid/);
    });
});

// ─── calcEddByIvf (ART method) ──────────────────────────────

describe('calcEddByIvf — IVF/ART: transferDate + (266 - embryoDay)', () => {
    // T4: IVF Day-5, transfer = 13/06/2025 → EDD per formula: Jun 13 + 261 = Mar 1
    it('T4: Day-5 blastocyst: transfer 2025-06-13 → EDD 2026-03-01', () => {
        const edd = calcEddByIvf(new Date(2025, 5, 13), 5);
        assert.ok(sameDate(edd, new Date(2026, 2, 1)));
    });

    // T5: IVF Day-3, transfer = 13/06/2025 → EDD per formula: Jun 13 + 263 = Mar 3
    it('T5: Day-3 embryo: transfer 2025-06-13 → EDD 2026-03-03', () => {
        const edd = calcEddByIvf(new Date(2025, 5, 13), 3);
        assert.ok(sameDate(edd, new Date(2026, 2, 3)));
    });

    it('Day-6 blastocyst: transfer 2025-06-13 → EDD 2026-02-28', () => {
        const edd = calcEddByIvf(new Date(2025, 5, 13), 6);
        // Jun 13 + 260 = Feb 28 (2026 is not leap year)
        assert.ok(sameDate(edd, new Date(2026, 1, 28)));
    });

    it('Day-5 adds exactly 261 days', () => {
        const edd = calcEddByIvf('2026-01-01', 5);
        // Jan 1 + 261 days
        const expected = new Date(2026, 0, 1);
        expected.setDate(expected.getDate() + 261);
        assert.ok(sameDate(edd, expected));
    });

    it('Day-3 adds exactly 263 days', () => {
        const edd = calcEddByIvf('2026-01-01', 3);
        const expected = new Date(2026, 0, 1);
        expected.setDate(expected.getDate() + 263);
        assert.ok(sameDate(edd, expected));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calcEddByIvf('bad', 5), /Invalid/);
    });
});

// ─── calcGaFromCrl (CRL → GA) ───────────────────────────────

describe('calcGaFromCrl — Robinson 1975 & Tan 2023 formulas', () => {
    // T6: CRL = 45mm (Robinson) → GA ≈ 78 days ≈ 11w+1d
    it('T6: CRL 45mm Robinson → GA ≈ 11w+1d (78 days)', () => {
        const ga = calcGaFromCrl(45, 'robinson');
        // 8.052 * sqrt(45 * 1.037) + 23.73 ≈ 8.052 * 6.829 + 23.73 ≈ 78.72
        assert.ok(ga.totalDays >= 77 && ga.totalDays <= 80, `got ${ga.totalDays}`);
        assert.equal(ga.weeks, Math.floor(ga.totalDays / 7));
        assert.equal(ga.days, ga.totalDays % 7);
    });

    it('CRL 10mm Robinson → ~7 weeks', () => {
        const ga = calcGaFromCrl(10, 'robinson');
        assert.ok(ga.weeks >= 6 && ga.weeks <= 8, `got ${ga.weeks}w`);
    });

    it('CRL 84mm Robinson → ~14 weeks', () => {
        const ga = calcGaFromCrl(84, 'robinson');
        assert.ok(ga.weeks >= 13 && ga.weeks <= 15, `got ${ga.weeks}w`);
    });

    it('CRL 45mm Tan → GA ≈ 11w (similar to Robinson)', () => {
        const ga = calcGaFromCrl(45, 'tan');
        // 37.31 + 1.39*45 - 0.014*45² + 0.00007*45³
        // = 37.31 + 62.55 - 28.35 + 6.38 ≈ 77.89
        assert.ok(ga.totalDays >= 76 && ga.totalDays <= 80, `got ${ga.totalDays}`);
    });

    it('defaults to robinson formula', () => {
        const ga = calcGaFromCrl(45);
        const gaR = calcGaFromCrl(45, 'robinson');
        assert.equal(ga.totalDays, gaR.totalDays);
    });

    it('throws on CRL < 10mm', () => {
        assert.throws(() => calcGaFromCrl(5), /range/i);
    });

    it('throws on CRL > 84mm', () => {
        assert.throws(() => calcGaFromCrl(90), /range/i);
    });
});

// ─── calcEddFromUltrasoundGa ────────────────────────────────

describe('calcEddFromUltrasoundGa — usDate + (280 - ga.totalDays)', () => {
    it('GA 10w0d at US date → EDD = usDate + 210 days', () => {
        const ga = { weeks: 10, days: 0, totalDays: 70 };
        const edd = calcEddFromUltrasoundGa('2026-01-15', ga);
        // Jan 15 + (280 - 70) = Jan 15 + 210
        const expected = new Date(2026, 0, 15);
        expected.setDate(expected.getDate() + 210);
        assert.ok(sameDate(edd, expected));
    });

    it('GA 20w0d → EDD = usDate + 140 days', () => {
        const ga = { weeks: 20, days: 0, totalDays: 140 };
        const edd = calcEddFromUltrasoundGa('2026-01-15', ga);
        const expected = new Date(2026, 0, 15);
        expected.setDate(expected.getDate() + 140);
        assert.ok(sameDate(edd, expected));
    });

    it('GA 8w3d → correct EDD', () => {
        const ga = { weeks: 8, days: 3, totalDays: 59 };
        const edd = calcEddFromUltrasoundGa('2026-01-15', ga);
        const expected = new Date(2026, 0, 15);
        expected.setDate(expected.getDate() + (280 - 59));
        assert.ok(sameDate(edd, expected));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calcEddFromUltrasoundGa('bad', { weeks: 10, days: 0, totalDays: 70 }), /Invalid/);
    });
});

// ─── shouldRedate (ACOG-700 Table 1) ────────────────────────

describe('shouldRedate — ACOG Committee Opinion No. 700 Table 1', () => {
    // ≤ 8+6 weeks: redate if > 5 days
    it('≤8+6w: 4-day discrepancy → NO redate', () => {
        const r = shouldRedate(8, 4);
        assert.equal(r.shouldRedate, false);
        assert.equal(r.threshold, 5);
    });

    it('≤8+6w: 6-day discrepancy → REDATE', () => {
        const r = shouldRedate(8, 6);
        assert.equal(r.shouldRedate, true);
    });

    it('≤8+6w: exactly 5 days → NO redate (> not >=)', () => {
        const r = shouldRedate(7, 5);
        assert.equal(r.shouldRedate, false);
    });

    // 9+0 to 13+6: redate if > 7 days
    it('9-13+6w: 7-day discrepancy → NO redate', () => {
        const r = shouldRedate(12, 7);
        assert.equal(r.shouldRedate, false);
        assert.equal(r.threshold, 7);
    });

    it('9-13+6w: 8-day discrepancy → REDATE', () => {
        const r = shouldRedate(10, 8);
        assert.equal(r.shouldRedate, true);
    });

    // T7: GA_LMP=8w0d, GA_US=9w2d, discrepancy = 9 days > 7 → REDATE
    it('T7: 8w+0d LMP, 9-day disc (>5 at ≤8+6w) → REDATE', () => {
        const r = shouldRedate(8, 9);
        assert.equal(r.shouldRedate, true);
    });

    // 14+0 to 15+6: redate if > 7 days
    it('14-15+6w: 7 days → NO redate', () => {
        const r = shouldRedate(15, 7);
        assert.equal(r.shouldRedate, false);
    });

    // 16+0 to 21+6: redate if > 10 days
    // T8: GA_LMP=20w, disc=5d ≤ 10 → KEEP
    it('T8: 20w, 5-day disc → NO redate', () => {
        const r = shouldRedate(20, 5);
        assert.equal(r.shouldRedate, false);
        assert.equal(r.threshold, 10);
    });

    it('16-21+6w: 11-day disc → REDATE', () => {
        const r = shouldRedate(18, 11);
        assert.equal(r.shouldRedate, true);
    });

    // 22+0 to 27+6: redate if > 14 days
    it('22-27+6w: 14 days → NO redate', () => {
        const r = shouldRedate(25, 14);
        assert.equal(r.shouldRedate, false);
        assert.equal(r.threshold, 14);
    });

    it('22-27+6w: 15 days → REDATE', () => {
        const r = shouldRedate(25, 15);
        assert.equal(r.shouldRedate, true);
    });

    // ≥ 28+0: redate if > 21 days + IUGR warning
    // T9: GA_LMP=30w, disc=21d → REDATE + IUGR WARNING
    it('T9: ≥28w, 21 days → NO redate (not >21)', () => {
        const r = shouldRedate(30, 21);
        assert.equal(r.shouldRedate, false);
        assert.equal(r.threshold, 21);
    });

    it('≥28w: 22-day disc → REDATE + IUGR warning', () => {
        const r = shouldRedate(30, 22);
        assert.equal(r.shouldRedate, true);
        assert.ok(r.warnings.some(w => w.includes('IUGR') || w.includes('chậm tăng trưởng')));
    });

    it('always includes ACOG citation', () => {
        const r = shouldRedate(12, 5);
        assert.ok(r.acogCitation.includes('700'));
    });
});

// ─── reconcileEdd ────────────────────────────────────────────

describe('reconcileEdd — full ACOG orchestration', () => {
    // T10: ART case → NEVER redate regardless of US discrepancy
    it('T10: ART case → uses ART-derived EDD, no redate', () => {
        const gaUs = { weeks: 12, days: 0, totalDays: 84 };
        const result = reconcileEdd('2025-06-01', 28, '2025-08-20', gaUs, true);
        assert.equal(result.wasRedated, false);
        assert.ok(result.method.includes('ART') || result.method.includes('art'));
    });

    it('non-ART: small discrepancy at 12w → keep LMP', () => {
        // GA_LMP at US date ~12w, US says 12w3d → disc 3d ≤ 7 → keep
        const lmp = '2025-12-01';
        const usDate = '2026-02-23'; // ~84 days = 12w0d
        const gaUs = { weeks: 12, days: 3, totalDays: 87 }; // disc = 3 days
        const result = reconcileEdd(lmp, 28, usDate, gaUs, false);
        assert.equal(result.wasRedated, false);
    });

    it('non-ART: large discrepancy at 8w → redate to US', () => {
        const lmp = '2026-01-01';
        const usDate = '2026-02-26'; // ~56 days = 8w0d from LMP
        const gaUs = { weeks: 9, days: 2, totalDays: 65 }; // disc = 9 days > 5
        const result = reconcileEdd(lmp, 28, usDate, gaUs, false);
        assert.equal(result.wasRedated, true);
        assert.ok(result.eddFinal instanceof Date);
        assert.ok(result.discrepancyDays >= 9);
    });

    it('returns both eddLmp and eddUltrasound', () => {
        const gaUs = { weeks: 10, days: 0, totalDays: 70 };
        const result = reconcileEdd('2026-01-01', 28, '2026-03-11', gaUs, false);
        assert.ok(result.eddLmp instanceof Date);
        assert.ok(result.eddUltrasound instanceof Date);
        assert.ok(result.eddFinal instanceof Date);
        assert.ok(typeof result.discrepancyDays === 'number');
        assert.ok(typeof result.wasRedated === 'boolean');
    });
});

// ─── getTermClassification ───────────────────────────────────

describe('getTermClassification — ACOG-579', () => {
    it('36w+6d → Preterm', () => {
        assert.equal(getTermClassification(36, 6), 'preterm');
    });

    it('37w+0d → Early term', () => {
        assert.equal(getTermClassification(37, 0), 'early-term');
    });

    it('38w+6d → Early term', () => {
        assert.equal(getTermClassification(38, 6), 'early-term');
    });

    it('39w+0d → Full term', () => {
        assert.equal(getTermClassification(39, 0), 'full-term');
    });

    it('40w+6d → Full term', () => {
        assert.equal(getTermClassification(40, 6), 'full-term');
    });

    it('41w+0d → Late term', () => {
        assert.equal(getTermClassification(41, 0), 'late-term');
    });

    it('41w+6d → Late term', () => {
        assert.equal(getTermClassification(41, 6), 'late-term');
    });

    it('42w+0d → Post-term', () => {
        assert.equal(getTermClassification(42, 0), 'post-term');
    });

    it('20w+0d → Preterm', () => {
        assert.equal(getTermClassification(20, 0), 'preterm');
    });
});

// ─── getClinicalWarnings ─────────────────────────────────────

describe('getClinicalWarnings', () => {
    it('post-term warning when GA ≥ 41w', () => {
        const warnings = getClinicalWarnings({ weeks: 41, days: 2 });
        assert.ok(warnings.some(w => w.type === 'post-term'));
    });

    it('no warning at 30w', () => {
        const warnings = getClinicalWarnings({ weeks: 30, days: 0 });
        const postTerm = warnings.filter(w => w.type === 'post-term');
        assert.equal(postTerm.length, 0);
    });

    it('suboptimal-dating when hasEarlyUltrasound=false', () => {
        const warnings = getClinicalWarnings({ weeks: 30, days: 0 }, { hasEarlyUltrasound: false });
        assert.ok(warnings.some(w => w.type === 'suboptimal-dating'));
    });

    it('IUGR warning when wasRedatedInT3=true', () => {
        const warnings = getClinicalWarnings({ weeks: 30, days: 0 }, { wasRedatedInT3: true });
        assert.ok(warnings.some(w => w.type === 'iugr-risk'));
    });

    it('warning objects have type, message, severity', () => {
        const warnings = getClinicalWarnings({ weeks: 42, days: 0 });
        for (const w of warnings) {
            assert.ok(w.type, 'has type');
            assert.ok(w.message, 'has message');
            assert.ok(w.severity, 'has severity');
        }
    });
});
