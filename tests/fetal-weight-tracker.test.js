import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    FETAL_GROWTH_DATA,
    MIN_WEEK,
    MAX_WEEK,
    getFetalDataByWeek,
    classifyWeight,
    calculateEFW,
    getTrimesterFromWeek,
    getNutritionAdvice,
    getDoctorAlert,
    validateMeasurements,
} from '../src/utils/fetal-weight-tracker.js';

// ─── FETAL_GROWTH_DATA Validation ────────────────────────────

describe('FETAL_GROWTH_DATA — Data Integrity', () => {
    it('contains data for all weeks 12-40', () => {
        for (let w = 12; w <= 40; w++) {
            assert.ok(FETAL_GROWTH_DATA[w], `Missing data for week ${w}`);
        }
    });

    it('each week has required fields', () => {
        for (let w = 12; w <= 40; w++) {
            const d = FETAL_GROWTH_DATA[w];
            assert.ok(d.weight, `week ${w}: missing weight`);
            assert.ok(typeof d.weight.p10 === 'number', `week ${w}: p10 not number`);
            assert.ok(typeof d.weight.p50 === 'number', `week ${w}: p50 not number`);
            assert.ok(typeof d.weight.p90 === 'number', `week ${w}: p90 not number`);
            assert.ok(typeof d.length === 'number', `week ${w}: length not number`);
            assert.ok(typeof d.fruit === 'string', `week ${w}: fruit not string`);
            assert.ok(typeof d.fruitEmoji === 'string', `week ${w}: fruitEmoji not string`);
            assert.ok(typeof d.description === 'string', `week ${w}: description not string`);
        }
    });

    it('weight percentiles are monotonically increasing: p10 < p50 < p90', () => {
        for (let w = 12; w <= 40; w++) {
            const { p10, p50, p90 } = FETAL_GROWTH_DATA[w].weight;
            assert.ok(p10 < p50, `week ${w}: p10 (${p10}) >= p50 (${p50})`);
            assert.ok(p50 < p90, `week ${w}: p50 (${p50}) >= p90 (${p90})`);
        }
    });

    it('weight increases with gestational age (p50 non-decreasing)', () => {
        let prevP50 = 0;
        for (let w = 12; w <= 40; w++) {
            const p50 = FETAL_GROWTH_DATA[w].weight.p50;
            assert.ok(p50 > prevP50, `week ${w}: p50 (${p50}) not increasing from prev (${prevP50})`);
            prevP50 = p50;
        }
    });

    it('length increases with gestational age (non-decreasing)', () => {
        let prevLen = 0;
        for (let w = 12; w <= 40; w++) {
            const len = FETAL_GROWTH_DATA[w].length;
            assert.ok(len >= prevLen, `week ${w}: length (${len}) decreased from prev (${prevLen})`);
            prevLen = len;
        }
    });

    // Cross-validate INTERGROWTH-21st data (weeks 22-40, verified values)
    it('week 22 matches INTERGROWTH-21st: p10~381-481, p50~425-525', () => {
        const d = FETAL_GROWTH_DATA[22];
        assert.ok(d.weight.p10 >= 350 && d.weight.p10 <= 500, `p10=${d.weight.p10} out of range`);
        assert.ok(d.weight.p50 >= 400 && d.weight.p50 <= 550, `p50=${d.weight.p50} out of range`);
    });

    it('week 30 matches INTERGROWTH-21st range', () => {
        const d = FETAL_GROWTH_DATA[30];
        assert.ok(d.weight.p50 >= 1200 && d.weight.p50 <= 1500, `p50=${d.weight.p50} out of range`);
    });

    it('week 40 p50 is approximately 3.2-3.4 kg', () => {
        const d = FETAL_GROWTH_DATA[40];
        assert.ok(d.weight.p50 >= 3100 && d.weight.p50 <= 3500, `p50=${d.weight.p50} out of expected range`);
    });
});

// ─── getFetalDataByWeek ──────────────────────────────────────

describe('getFetalDataByWeek', () => {
    it('returns data for week 20', () => {
        const d = getFetalDataByWeek(20);
        assert.ok(d);
        assert.equal(d.weight.p50, 300);
        assert.equal(d.length, 16.5);
    });

    it('returns data for week 12 (minimum)', () => {
        const d = getFetalDataByWeek(12);
        assert.ok(d);
        assert.equal(d.weight.p50, 14);
    });

    it('returns data for week 40 (maximum)', () => {
        const d = getFetalDataByWeek(40);
        assert.ok(d);
        assert.ok(d.weight.p50 > 3000);
    });

    it('returns null for week 11 (below range)', () => {
        assert.equal(getFetalDataByWeek(11), null);
    });

    it('returns null for week 41 (above range)', () => {
        assert.equal(getFetalDataByWeek(41), null);
    });

    it('returns null for week 0', () => {
        assert.equal(getFetalDataByWeek(0), null);
    });

    it('floors fractional weeks: 20.7 → week 20', () => {
        const d = getFetalDataByWeek(20.7);
        assert.ok(d);
        assert.equal(d.weight.p50, 300);
    });
});

// ─── classifyWeight ──────────────────────────────────────────

describe('classifyWeight', () => {
    // Week 30: p10=1089, p50=1296, p90=1548

    it('SGA: weight below p10', () => {
        const result = classifyWeight(30, 1000);
        assert.ok(result);
        assert.equal(result.classification, 'SGA');
        assert.equal(result.label, 'Nhỏ hơn tuổi thai');
    });

    it('NORMAL: weight at p10 boundary', () => {
        const result = classifyWeight(30, 1089);
        assert.ok(result);
        assert.equal(result.classification, 'NORMAL');
    });

    it('NORMAL: weight at p50', () => {
        const result = classifyWeight(30, 1296);
        assert.ok(result);
        assert.equal(result.classification, 'NORMAL');
    });

    it('NORMAL: weight at p90 boundary', () => {
        const result = classifyWeight(30, 1548);
        assert.ok(result);
        assert.equal(result.classification, 'NORMAL');
    });

    it('LGA: weight above p90', () => {
        const result = classifyWeight(30, 1600);
        assert.ok(result);
        assert.equal(result.classification, 'LGA');
        assert.equal(result.label, 'Lớn hơn tuổi thai');
    });

    it('SGA: weight just below p10 by 1g', () => {
        const result = classifyWeight(30, 1088);
        assert.ok(result);
        assert.equal(result.classification, 'SGA');
    });

    it('LGA: weight just above p90 by 1g', () => {
        const result = classifyWeight(30, 1549);
        assert.ok(result);
        assert.equal(result.classification, 'LGA');
    });

    it('returns null for invalid week', () => {
        assert.equal(classifyWeight(5, 100), null);
    });

    it('returns null for zero weight', () => {
        assert.equal(classifyWeight(30, 0), null);
    });

    it('returns null for negative weight', () => {
        assert.equal(classifyWeight(30, -500), null);
    });

    it('returns null for non-number weight', () => {
        assert.equal(classifyWeight(30, '1000'), null);
    });
});

// ─── calculateEFW (Hadlock 3) ────────────────────────────────

describe('calculateEFW — Hadlock 3 Formula (HC + AC + FL)', () => {
    it('known value: HC=30, AC=28, FL=6 → reasonable EFW ~1600-2100g', () => {
        const efw = calculateEFW(30, 28, 6);
        assert.ok(efw >= 1600 && efw <= 2100, `EFW=${efw} outside expected range`);
    });

    it('known value: HC=34, AC=34, FL=7.5 → reasonable EFW ~2500-3500g', () => {
        const efw = calculateEFW(34, 34, 7.5);
        assert.ok(efw >= 2500 && efw <= 3500, `EFW=${efw} outside expected range`);
    });

    it('small fetus: HC=20, AC=18, FL=3 → EFW ~300-600g', () => {
        const efw = calculateEFW(20, 18, 3);
        assert.ok(efw >= 200 && efw <= 700, `EFW=${efw} outside expected range`);
    });

    it('larger AC yields higher EFW', () => {
        const efw1 = calculateEFW(30, 25, 6);
        const efw2 = calculateEFW(30, 30, 6);
        assert.ok(efw2 > efw1, `Larger AC should yield higher EFW: ${efw2} > ${efw1}`);
    });

    it('larger FL yields higher EFW (within practical range)', () => {
        const efw1 = calculateEFW(30, 28, 5);
        const efw2 = calculateEFW(30, 28, 7);
        assert.ok(efw2 > efw1, `Larger FL should yield higher EFW: ${efw2} > ${efw1}`);
    });

    it('returns integer', () => {
        const efw = calculateEFW(30, 28, 6);
        assert.ok(Number.isInteger(efw));
    });

    it('throws on non-number input', () => {
        assert.throws(() => calculateEFW('30', 28, 6), /must be numbers/);
    });

    it('throws on zero input', () => {
        assert.throws(() => calculateEFW(0, 28, 6), /must be positive/);
    });

    it('throws on negative input', () => {
        assert.throws(() => calculateEFW(30, -5, 6), /must be positive/);
    });
});

// ─── getTrimesterFromWeek ────────────────────────────────────

describe('getTrimesterFromWeek', () => {
    it('week 12 → T1', () => assert.equal(getTrimesterFromWeek(12), 1));
    it('week 13 → T1', () => assert.equal(getTrimesterFromWeek(13), 1));
    it('week 14 → T2', () => assert.equal(getTrimesterFromWeek(14), 2));
    it('week 27 → T2', () => assert.equal(getTrimesterFromWeek(27), 2));
    it('week 28 → T3', () => assert.equal(getTrimesterFromWeek(28), 3));
    it('week 40 → T3', () => assert.equal(getTrimesterFromWeek(40), 3));
});

// ─── getNutritionAdvice ──────────────────────────────────────

describe('getNutritionAdvice', () => {
    it('SGA advice has correct title', () => {
        const advice = getNutritionAdvice('SGA', 30);
        assert.ok(advice.title.includes('Tăng cường'));
    });

    it('LGA advice has correct title', () => {
        const advice = getNutritionAdvice('LGA', 30);
        assert.ok(advice.title.includes('Kiểm soát'));
    });

    it('NORMAL advice has correct title', () => {
        const advice = getNutritionAdvice('NORMAL', 30);
        assert.ok(advice.title.includes('Duy trì'));
    });

    it('all classifications return items array with ≥ 3 items', () => {
        for (const cls of ['SGA', 'NORMAL', 'LGA']) {
            const advice = getNutritionAdvice(cls, 30);
            assert.ok(advice.items.length >= 3, `${cls}: only ${advice.items.length} items`);
        }
    });

    it('all classifications return calories string', () => {
        for (const cls of ['SGA', 'NORMAL', 'LGA']) {
            const advice = getNutritionAdvice(cls, 30);
            assert.ok(advice.calories.includes('kcal'));
        }
    });

    it('T1 calories differ from T3 calories', () => {
        const t1 = getNutritionAdvice('NORMAL', 12);
        const t3 = getNutritionAdvice('NORMAL', 35);
        assert.notEqual(t1.calories, t3.calories);
    });
});

// ─── getDoctorAlert ──────────────────────────────────────────

describe('getDoctorAlert', () => {
    it('SGA early (week 25) → warning', () => {
        const alert = getDoctorAlert('SGA', 25);
        assert.equal(alert.level, 'warning');
    });

    it('SGA late (week 36) → urgent', () => {
        const alert = getDoctorAlert('SGA', 36);
        assert.equal(alert.level, 'urgent');
    });

    it('LGA early (week 28) → warning', () => {
        const alert = getDoctorAlert('LGA', 28);
        assert.equal(alert.level, 'warning');
    });

    it('LGA late (week 38) → urgent', () => {
        const alert = getDoctorAlert('LGA', 38);
        assert.equal(alert.level, 'urgent');
    });

    it('NORMAL any week → info', () => {
        assert.equal(getDoctorAlert('NORMAL', 20).level, 'info');
        assert.equal(getDoctorAlert('NORMAL', 36).level, 'info');
    });

    it('boundary: SGA at week 34 → urgent', () => {
        assert.equal(getDoctorAlert('SGA', 34).level, 'urgent');
    });

    it('boundary: SGA at week 33 → warning', () => {
        assert.equal(getDoctorAlert('SGA', 33).level, 'warning');
    });

    it('all alerts have title and message', () => {
        for (const cls of ['SGA', 'NORMAL', 'LGA']) {
            for (const week of [20, 34, 40]) {
                const alert = getDoctorAlert(cls, week);
                assert.ok(alert.title.length > 0, `${cls} week ${week}: empty title`);
                assert.ok(alert.message.length > 0, `${cls} week ${week}: empty message`);
            }
        }
    });
});

// ─── validateMeasurements ────────────────────────────────────

describe('validateMeasurements', () => {
    it('valid measurements', () => {
        const result = validateMeasurements(30, 28, 6);
        assert.ok(result.valid);
    });

    it('invalid HC (too large)', () => {
        const result = validateMeasurements(55, 28, 6);
        assert.ok(!result.valid);
        assert.ok(result.error.includes('HC'));
    });

    it('invalid AC (negative)', () => {
        const result = validateMeasurements(30, -5, 6);
        assert.ok(!result.valid);
        assert.ok(result.error.includes('AC'));
    });

    it('invalid FL (too large)', () => {
        const result = validateMeasurements(30, 28, 20);
        assert.ok(!result.valid);
        assert.ok(result.error.includes('FL'));
    });

    it('undefined values are valid (optional fields)', () => {
        const result = validateMeasurements(undefined, undefined, undefined);
        assert.ok(result.valid);
    });
});
