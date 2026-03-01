import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateOvulationDay,
    calculateFertileWindow,
    calculateNextPeriod,
    calculateFullCycle,
    generateCyclePhases,
    validateCycleInput,
    predictMultipleCycles,
} from '../src/utils/ovulation-calc.js';

// Helper: compare dates by y/m/d only
function sameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// ─── calculateOvulationDay ───────────────────────────────────

describe('calculateOvulationDay — LMP + (cycleLength - 14)', () => {
    it('28-day cycle: LMP 2026-03-01 → ovulation Mar 15', () => {
        const ov = calculateOvulationDay('2026-03-01', 28);
        assert.ok(sameDate(ov, new Date(2026, 2, 15))); // Mar 15
    });

    it('30-day cycle: LMP 2026-03-01 → ovulation Mar 17', () => {
        const ov = calculateOvulationDay('2026-03-01', 30);
        assert.ok(sameDate(ov, new Date(2026, 2, 17))); // Mar 17
    });

    it('26-day cycle: LMP 2026-03-01 → ovulation Mar 13', () => {
        const ov = calculateOvulationDay('2026-03-01', 26);
        assert.ok(sameDate(ov, new Date(2026, 2, 13))); // Mar 13
    });

    it('21-day cycle (minimum): LMP 2026-03-01 → ovulation Mar 8', () => {
        const ov = calculateOvulationDay('2026-03-01', 21);
        assert.ok(sameDate(ov, new Date(2026, 2, 8))); // 21 - 14 = 7 days
    });

    it('35-day cycle (maximum): LMP 2026-03-01 → ovulation Mar 22', () => {
        const ov = calculateOvulationDay('2026-03-01', 35);
        assert.ok(sameDate(ov, new Date(2026, 2, 22))); // 35 - 14 = 21 days
    });

    it('cross-month: LMP 2026-01-25, 28-day → ovulation Feb 8', () => {
        const ov = calculateOvulationDay('2026-01-25', 28);
        // Jan 25 + 14 = Feb 8
        assert.ok(sameDate(ov, new Date(2026, 1, 8)));
    });

    it('cross-year: LMP 2025-12-20, 28-day → ovulation Jan 3, 2026', () => {
        const ov = calculateOvulationDay('2025-12-20', 28);
        // Dec 20 + 14 = Jan 3
        assert.ok(sameDate(ov, new Date(2026, 0, 3)));
    });

    it('leap year: LMP 2024-02-15, 28-day → ovulation Feb 29', () => {
        const ov = calculateOvulationDay('2024-02-15', 28);
        // Feb 15 + 14 = Feb 29 (2024 is leap year)
        assert.ok(sameDate(ov, new Date(2024, 1, 29)));
    });

    it('non-leap year: LMP 2026-02-15, 28-day → ovulation Mar 1', () => {
        const ov = calculateOvulationDay('2026-02-15', 28);
        // Feb 15 + 14 = Mar 1 (2026 is not leap year, Feb has 28 days)
        assert.ok(sameDate(ov, new Date(2026, 2, 1)));
    });

    it('accepts Date object', () => {
        const ov = calculateOvulationDay(new Date(2026, 2, 1), 28);
        assert.ok(sameDate(ov, new Date(2026, 2, 15)));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calculateOvulationDay('invalid', 28), /Invalid/);
    });
});

// ─── calculateFertileWindow ──────────────────────────────────

describe('calculateFertileWindow — 5 days before ovulation to 1 day after', () => {
    it('28-day cycle: fertile window Mar 10 - Mar 16 (peak Mar 15)', () => {
        const fw = calculateFertileWindow('2026-03-01', 28);
        // Ovulation = Mar 15 → start = Mar 10, end = Mar 16
        assert.ok(sameDate(fw.start, new Date(2026, 2, 10)));
        assert.ok(sameDate(fw.end, new Date(2026, 2, 16)));
        assert.ok(sameDate(fw.peak, new Date(2026, 2, 15)));
    });

    it('fertile window is exactly 7 days', () => {
        const fw = calculateFertileWindow('2026-03-01', 28);
        const days = Math.round((fw.end.getTime() - fw.start.getTime()) / (1000 * 60 * 60 * 24));
        assert.equal(days, 6); // 6 days from start to end inclusive = 7 day span
    });

    it('30-day cycle: peak on Mar 17', () => {
        const fw = calculateFertileWindow('2026-03-01', 30);
        assert.ok(sameDate(fw.peak, new Date(2026, 2, 17)));
        assert.ok(sameDate(fw.start, new Date(2026, 2, 12)));
        assert.ok(sameDate(fw.end, new Date(2026, 2, 18)));
    });

    it('cross-month fertile window', () => {
        const fw = calculateFertileWindow('2026-01-25', 28);
        // Ovulation = Feb 8 → start = Feb 3, end = Feb 9
        assert.ok(sameDate(fw.start, new Date(2026, 1, 3)));
        assert.ok(sameDate(fw.end, new Date(2026, 1, 9)));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calculateFertileWindow('xxx', 28), /Invalid/);
    });
});

// ─── calculateNextPeriod ─────────────────────────────────────

describe('calculateNextPeriod — LMP + cycleLength', () => {
    it('28-day cycle: LMP Mar 1 → next period Mar 29', () => {
        const np = calculateNextPeriod('2026-03-01', 28);
        assert.ok(sameDate(np, new Date(2026, 2, 29)));
    });

    it('30-day cycle: LMP Mar 1 → next period Mar 31', () => {
        const np = calculateNextPeriod('2026-03-01', 30);
        assert.ok(sameDate(np, new Date(2026, 2, 31)));
    });

    it('cross-month: LMP Jan 15, 28-day → next period Feb 12', () => {
        const np = calculateNextPeriod('2026-01-15', 28);
        assert.ok(sameDate(np, new Date(2026, 1, 12)));
    });

    it('cross-year: LMP Dec 10, 28-day → next period Jan 7, 2026', () => {
        const np = calculateNextPeriod('2025-12-10', 28);
        assert.ok(sameDate(np, new Date(2026, 0, 7)));
    });

    it('throws on invalid date', () => {
        assert.throws(() => calculateNextPeriod('bad', 28), /Invalid/);
    });
});

// ─── calculateFullCycle ──────────────────────────────────────

describe('calculateFullCycle — complete result object', () => {
    it('returns all expected fields', () => {
        const result = calculateFullCycle('2026-03-01', 28);
        assert.ok(result.ovulationDay instanceof Date);
        assert.ok(result.fertileWindow);
        assert.ok(result.fertileWindow.start instanceof Date);
        assert.ok(result.fertileWindow.end instanceof Date);
        assert.ok(result.fertileWindow.peak instanceof Date);
        assert.ok(result.nextPeriod instanceof Date);
        assert.equal(result.cycleLength, 28);
        assert.ok(result.lmpDate instanceof Date);
    });

    it('ovulation day matches standalone function', () => {
        const full = calculateFullCycle('2026-03-01', 28);
        const standalone = calculateOvulationDay('2026-03-01', 28);
        assert.ok(sameDate(full.ovulationDay, standalone));
    });

    it('fertile window matches standalone function', () => {
        const full = calculateFullCycle('2026-03-01', 30);
        const standalone = calculateFertileWindow('2026-03-01', 30);
        assert.ok(sameDate(full.fertileWindow.start, standalone.start));
        assert.ok(sameDate(full.fertileWindow.end, standalone.end));
    });

    it('next period matches standalone function', () => {
        const full = calculateFullCycle('2026-03-01', 26);
        const standalone = calculateNextPeriod('2026-03-01', 26);
        assert.ok(sameDate(full.nextPeriod, standalone));
    });
});

// ─── generateCyclePhases ─────────────────────────────────────

describe('generateCyclePhases — menstruation, follicular, ovulation, luteal', () => {
    it('returns 4 phases', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        assert.equal(phases.length, 4);
    });

    it('phases are: menstruation, follicular, ovulation, luteal', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        assert.equal(phases[0].name, 'menstruation');
        assert.equal(phases[1].name, 'follicular');
        assert.equal(phases[2].name, 'ovulation');
        assert.equal(phases[3].name, 'luteal');
    });

    it('menstruation phase is days 1-5 (5 days)', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        const mens = phases[0];
        assert.ok(sameDate(mens.start, new Date(2026, 2, 1)));
        assert.ok(sameDate(mens.end, new Date(2026, 2, 5)));
    });

    it('follicular phase is days 6 to ovulation-1', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        const fol = phases[1];
        // Ovulation = day 15 (Mar 15), follicular = Mar 6 to Mar 14
        assert.ok(sameDate(fol.start, new Date(2026, 2, 6)));
        assert.ok(sameDate(fol.end, new Date(2026, 2, 14)));
    });

    it('ovulation phase covers fertile window', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        const ov = phases[2];
        // Ovulation = Mar 15, ovulation phase = Mar 13 to Mar 16 (peak ± a couple days)
        assert.ok(ov.start instanceof Date);
        assert.ok(ov.end instanceof Date);
    });

    it('luteal phase ends at next period', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        const lut = phases[3];
        // Next period = Mar 29, luteal ends Mar 28
        assert.ok(sameDate(lut.end, new Date(2026, 2, 28)));
    });

    it('all phases have required fields', () => {
        const phases = generateCyclePhases('2026-03-01', 28);
        for (const phase of phases) {
            assert.ok(phase.name, 'has name');
            assert.ok(phase.label, 'has label');
            assert.ok(phase.start instanceof Date, 'has start Date');
            assert.ok(phase.end instanceof Date, 'has end Date');
            assert.ok(typeof phase.description === 'string', 'has description');
        }
    });
});

// ─── validateCycleInput ──────────────────────────────────────

describe('validateCycleInput', () => {
    it('valid: normal input', () => {
        const result = validateCycleInput('2026-03-01', 28);
        assert.ok(result.valid);
    });

    it('valid: minimum cycle 21 days', () => {
        const result = validateCycleInput('2026-03-01', 21);
        assert.ok(result.valid);
    });

    it('valid: maximum cycle 35 days', () => {
        const result = validateCycleInput('2026-03-01', 35);
        assert.ok(result.valid);
    });

    it('invalid: cycle too short (< 21)', () => {
        const result = validateCycleInput('2026-03-01', 20);
        assert.ok(!result.valid);
        assert.ok(result.error);
    });

    it('invalid: cycle too long (> 35)', () => {
        const result = validateCycleInput('2026-03-01', 36);
        assert.ok(!result.valid);
        assert.ok(result.error);
    });

    it('invalid: bad date string', () => {
        const result = validateCycleInput('not-a-date', 28);
        assert.ok(!result.valid);
    });

    it('invalid: future date', () => {
        const result = validateCycleInput('2030-01-01', 28);
        assert.ok(!result.valid);
    });

    it('invalid: non-number cycle length', () => {
        const result = validateCycleInput('2026-03-01', NaN);
        assert.ok(!result.valid);
    });
});

// ─── predictMultipleCycles ───────────────────────────────────

describe('predictMultipleCycles', () => {
    it('returns requested number of cycles', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 3);
        assert.equal(cycles.length, 3);
    });

    it('returns 6 cycles when requested', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 6);
        assert.equal(cycles.length, 6);
    });

    it('first cycle starts at given LMP', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 3);
        assert.ok(sameDate(cycles[0].lmpDate, new Date(2026, 2, 1)));
    });

    it('second cycle LMP = first cycle next period', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 3);
        assert.ok(sameDate(cycles[1].lmpDate, cycles[0].nextPeriod));
    });

    it('third cycle LMP = second cycle next period', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 3);
        assert.ok(sameDate(cycles[2].lmpDate, cycles[1].nextPeriod));
    });

    it('each cycle has ovulation day and fertile window', () => {
        const cycles = predictMultipleCycles('2026-03-01', 30, 3);
        for (const c of cycles) {
            assert.ok(c.ovulationDay instanceof Date);
            assert.ok(c.fertileWindow);
            assert.ok(c.fertileWindow.start instanceof Date);
            assert.ok(c.nextPeriod instanceof Date);
        }
    });

    it('28-day cycle: 3 months covers ~84 days', () => {
        const cycles = predictMultipleCycles('2026-03-01', 28, 3);
        const last = cycles[2];
        // 3rd cycle starts at Mar 1 + 56 = Apr 26, next period = Apr 26 + 28 = May 24
        assert.ok(sameDate(last.nextPeriod, new Date(2026, 4, 24)));
    });
});
