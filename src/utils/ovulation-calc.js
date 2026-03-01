/**
 * Ovulation & Menstrual Cycle Calculator
 * Based on standard luteal phase calculation (14 days before next period)
 *
 * Sources: Hopkins Medicine, Cleveland Clinic, WHO/ACOG guidelines
 * All dates use local timezone. No external dependencies.
 */

import { toLocalDate, formatDateVN } from './due-date-calc.js';

/**
 * Add days to a date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Calculate ovulation day from LMP and cycle length
 * Formula: LMP + (cycleLength - 14) days
 * Luteal phase is ~14 days (constant for most women)
 * @param {Date|string} lmpDate - First day of last menstrual period
 * @param {number} cycleLength - Cycle length in days (21-35)
 * @returns {Date}
 */
export function calculateOvulationDay(lmpDate, cycleLength) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    return addDays(lmp, cycleLength - 14);
}

/**
 * Calculate fertile window (conception window)
 * Sperm survives up to 5 days; egg viable ~24 hours
 * Window: ovulation - 5 days to ovulation + 1 day
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @returns {{ start: Date, end: Date, peak: Date }}
 */
export function calculateFertileWindow(lmpDate, cycleLength) {
    const peak = calculateOvulationDay(lmpDate, cycleLength);
    return {
        start: addDays(peak, -5),
        end: addDays(peak, 1),
        peak,
    };
}

/**
 * Calculate next period date
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @returns {Date}
 */
export function calculateNextPeriod(lmpDate, cycleLength) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    return addDays(lmp, cycleLength);
}

/**
 * Calculate complete cycle info in one call
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @returns {{ lmpDate: Date, cycleLength: number, ovulationDay: Date, fertileWindow: { start: Date, end: Date, peak: Date }, nextPeriod: Date }}
 */
export function calculateFullCycle(lmpDate, cycleLength) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    return {
        lmpDate: lmp,
        cycleLength,
        ovulationDay: calculateOvulationDay(lmp, cycleLength),
        fertileWindow: calculateFertileWindow(lmp, cycleLength),
        nextPeriod: calculateNextPeriod(lmp, cycleLength),
    };
}

/**
 * Generate the 4 main phases of a menstrual cycle
 * 1. Menstruation (days 1-5)
 * 2. Follicular (day 6 to ovulation - 1)
 * 3. Ovulation (ovulation - 2 to ovulation + 1)
 * 4. Luteal (ovulation + 2 to next period - 1)
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @returns {Array<{ name: string, label: string, start: Date, end: Date, description: string }>}
 */
export function generateCyclePhases(lmpDate, cycleLength) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');

    const ovDay = calculateOvulationDay(lmp, cycleLength);
    const nextPeriod = calculateNextPeriod(lmp, cycleLength);

    return [
        {
            name: 'menstruation',
            label: 'Hành kinh',
            start: lmp,
            end: addDays(lmp, 4), // 5 days (day 1-5)
            description: 'Niêm mạc tử cung bong ra. Thường kéo dài 3-7 ngày.',
        },
        {
            name: 'follicular',
            label: 'Nang trứng phát triển',
            start: addDays(lmp, 5), // day 6
            end: addDays(ovDay, -1), // day before ovulation
            description: 'Nang trứng phát triển, estrogen tăng dần. Niêm mạc tử cung dày lên.',
        },
        {
            name: 'ovulation',
            label: 'Rụng trứng',
            start: addDays(ovDay, -2),
            end: addDays(ovDay, 1),
            description: 'Trứng được phóng thích. Đây là thời điểm dễ thụ thai nhất.',
        },
        {
            name: 'luteal',
            label: 'Hoàng thể',
            start: addDays(ovDay, 2),
            end: addDays(nextPeriod, -1),
            description: 'Progesterone tăng cao. Nếu không thụ thai, cơ thể chuẩn bị cho kỳ kinh tiếp.',
        },
    ];
}

/**
 * Validate user input for cycle calculation
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCycleInput(lmpDate, cycleLength) {
    const lmp = toLocalDate(lmpDate);

    if (isNaN(lmp.getTime())) {
        return { valid: false, error: 'Ngày không hợp lệ.' };
    }

    const today = toLocalDate(new Date());
    if (lmp.getTime() > today.getTime()) {
        return { valid: false, error: 'Ngày bắt đầu kỳ kinh không thể trong tương lai.' };
    }

    if (typeof cycleLength !== 'number' || isNaN(cycleLength)) {
        return { valid: false, error: 'Độ dài chu kỳ không hợp lệ.' };
    }

    if (cycleLength < 21) {
        return { valid: false, error: 'Chu kỳ kinh nguyệt thường từ 21 đến 35 ngày. Giá trị quá ngắn.' };
    }

    if (cycleLength > 35) {
        return { valid: false, error: 'Chu kỳ kinh nguyệt thường từ 21 đến 35 ngày. Giá trị quá dài.' };
    }

    return { valid: true };
}

/**
 * Predict multiple future cycles
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @param {number} count - Number of cycles to predict
 * @returns {Array<{ lmpDate: Date, cycleLength: number, ovulationDay: Date, fertileWindow: { start: Date, end: Date, peak: Date }, nextPeriod: Date }>}
 */
export function predictMultipleCycles(lmpDate, cycleLength, count) {
    const cycles = [];
    let currentLmp = toLocalDate(lmpDate);

    for (let i = 0; i < count; i++) {
        const cycle = calculateFullCycle(currentLmp, cycleLength);
        cycles.push(cycle);
        currentLmp = cycle.nextPeriod;
    }

    return cycles;
}
