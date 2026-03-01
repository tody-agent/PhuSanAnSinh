/**
 * Due Date Calculator — Obstetric Calculation Engine
 * Based on Naegele's Rule and Vietnamese MOH prenatal guidelines
 *
 * All dates use local timezone. No external dependencies.
 */

/**
 * Create a clean date at midnight (strips time component)
 * @param {Date|string} date
 * @returns {Date}
 */
export function toLocalDate(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Calculate Estimated Due Date from Last Menstrual Period
 * Naegele's Rule: LMP + 280 days (40 weeks)
 * @param {Date|string} lmpDate - First day of last menstrual period
 * @returns {Date} Estimated due date
 */
export function calculateDueDate(lmpDate) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    const edd = new Date(lmp);
    edd.setDate(edd.getDate() + 280);
    return edd;
}

/**
 * Calculate Estimated Due Date from Conception Date
 * Conception + 266 days (38 weeks)
 * @param {Date|string} conceptionDate
 * @returns {Date} Estimated due date
 */
export function calculateDueDateFromConception(conceptionDate) {
    const conception = toLocalDate(conceptionDate);
    if (isNaN(conception.getTime())) throw new Error('Invalid conception date');
    const edd = new Date(conception);
    edd.setDate(edd.getDate() + 266);
    return edd;
}

/**
 * Calculate gestational age from LMP to a reference date
 * @param {Date|string} lmpDate
 * @param {Date|string} [referenceDate] - defaults to today
 * @returns {{ weeks: number, days: number, totalDays: number }}
 */
export function calculateGestationalAge(lmpDate, referenceDate) {
    const lmp = toLocalDate(lmpDate);
    const ref = referenceDate ? toLocalDate(referenceDate) : toLocalDate(new Date());
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    if (isNaN(ref.getTime())) throw new Error('Invalid reference date');

    const diffMs = ref.getTime() - lmp.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (totalDays < 0) return { weeks: 0, days: 0, totalDays: 0 };

    return {
        weeks: Math.floor(totalDays / 7),
        days: totalDays % 7,
        totalDays,
    };
}

/**
 * Determine current trimester from gestational weeks
 * T1: weeks 0-13, T2: weeks 14-27, T3: weeks 28+
 * @param {number} weeks
 * @returns {1|2|3}
 */
export function getTrimester(weeks) {
    if (weeks <= 13) return 1;
    if (weeks <= 27) return 2;
    return 3;
}

/**
 * Calculate pregnancy progress as a percentage
 * @param {Date|string} lmpDate
 * @param {Date|string} [referenceDate]
 * @returns {number} 0-100
 */
export function getPregnancyProgress(lmpDate, referenceDate) {
    const { totalDays } = calculateGestationalAge(lmpDate, referenceDate);
    const progress = Math.min(100, Math.max(0, (totalDays / 280) * 100));
    return Math.round(progress * 10) / 10;
}

/**
 * Generate prenatal checkup milestones based on LMP date
 * Following Vietnamese MOH + WHO recommendations
 * @param {Date|string} lmpDate
 * @returns {Array<{ week: number, date: Date, title: string, description: string, tests: string[], icon: string }>}
 */
export function generateCheckupMilestones(lmpDate) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');

    const milestones = [
        {
            week: 8,
            title: 'Khám lần đầu',
            description: 'Xác nhận thai trong tử cung, ước tính tuổi thai và ngày dự sinh.',
            tests: ['Siêu âm đầu dò', 'Xét nghiệm máu tổng quát', 'Nhóm máu, Rh', 'HBsAg, HIV, Rubella'],
            icon: 'stethoscope',
        },
        {
            week: 12,
            title: 'Sàng lọc dị tật — "Mốc vàng"',
            description: 'Đo độ mờ da gáy (NT) sàng lọc hội chứng Down và dị tật nhiễm sắc thể.',
            tests: ['Siêu âm đo độ mờ da gáy', 'Double Test', 'NIPT (nếu cần)'],
            icon: 'baby',
        },
        {
            week: 16,
            title: 'Xét nghiệm tam cá nguyệt 2',
            description: 'Kiểm tra tiếp theo nếu chưa làm Double Test. Đánh giá phát triển thai.',
            tests: ['Triple Test (nếu cần)', 'Siêu âm theo dõi'],
            icon: 'clipboard',
        },
        {
            week: 22,
            title: 'Siêu âm hình thái chi tiết',
            description: 'Siêu âm chi tiết cấu trúc các cơ quan, phát hiện dị tật bẩm sinh.',
            tests: ['Siêu âm 4D/5D hình thái', 'Kiểm tra tim thai', 'Đánh giá cơ quan nội tạng'],
            icon: 'scan',
        },
        {
            week: 26,
            title: 'Tầm soát đái tháo đường thai kỳ',
            description: 'Nghiệm pháp dung nạp đường huyết để phát hiện sớm tiểu đường thai kỳ.',
            tests: ['Nghiệm pháp dung nạp glucose 75g', 'Xét nghiệm máu'],
            icon: 'droplet',
        },
        {
            week: 28,
            title: 'Tiêm phòng uốn ván mũi 1',
            description: 'Bắt đầu tiêm phòng uốn ván cho mẹ. Xét nghiệm thiếu máu lần 2.',
            tests: ['Vắc xin uốn ván mũi 1', 'Xét nghiệm công thức máu', 'Siêu âm theo dõi'],
            icon: 'syringe',
        },
        {
            week: 32,
            title: 'Đánh giá phát triển thai nhi',
            description: 'Kiểm tra ngôi thai, nước ối, bánh rau. Phát hiện bất thường khởi phát muộn.',
            tests: ['Siêu âm phát triển', 'Đánh giá ngôi thai', 'Vắc xin uốn ván mũi 2'],
            icon: 'activity',
        },
        {
            week: 36,
            title: 'Chuẩn bị sinh — Khám hàng tuần',
            description: 'Tầm soát GBS, theo dõi tim thai bằng Non-stress test (NST). Khám mỗi tuần từ đây.',
            tests: ['Tầm soát GBS', 'Non-stress test (NST)', 'Siêu âm đánh giá'],
            icon: 'heart',
        },
        {
            week: 38,
            title: 'Đánh giá tiền sản',
            description: 'Đánh giá sẵn sàng sinh, vị trí thai, lượng nước ối và độ trưởng thành bánh rau.',
            tests: ['Siêu âm Doppler', 'NST', 'Đánh giá Bishop score'],
            icon: 'calendar-check',
        },
        {
            week: 40,
            title: 'Ngày dự sinh ước tính',
            description: 'Theo dõi sát nếu chưa có dấu hiệu chuyển dạ. Đánh giá can thiệp nếu cần.',
            tests: ['NST hàng ngày', 'Siêu âm nước ối', 'Đánh giá lâm sàng'],
            icon: 'star',
        },
    ];

    return milestones.map((m) => ({
        ...m,
        date: addWeeks(lmp, m.week),
    }));
}

/**
 * Get baby development info for a given gestational week
 * @param {number} weeks
 * @returns {{ size: string, weight: string, fruit: string, fruitEmoji: string, description: string }}
 */
export function getBabyDevelopment(weeks) {
    const data = {
        4: { size: '1 mm', weight: '<1 g', fruit: 'Hạt anh túc', fruitEmoji: '🌱', description: 'Phôi thai bắt đầu làm tổ trong tử cung.' },
        5: { size: '2 mm', weight: '<1 g', fruit: 'Hạt vừng', fruitEmoji: '🫘', description: 'Tim thai bắt đầu đập.' },
        6: { size: '5 mm', weight: '<1 g', fruit: 'Hạt đậu', fruitEmoji: '🫘', description: 'Nụ chân tay bắt đầu hình thành.' },
        7: { size: '1 cm', weight: '<1 g', fruit: 'Quả việt quất', fruitEmoji: '🫐', description: 'Não phát triển nhanh, mặt hình thành.' },
        8: { size: '1.6 cm', weight: '1 g', fruit: 'Quả mâm xôi', fruitEmoji: '🫐', description: 'Ngón tay, ngón chân bắt đầu tách.' },
        9: { size: '2.3 cm', weight: '2 g', fruit: 'Quả nho', fruitEmoji: '🍇', description: 'Các cơ quan chính đã hình thành.' },
        10: { size: '3 cm', weight: '4 g', fruit: 'Quả ô liu', fruitEmoji: '🫒', description: 'Bé bắt đầu cử động, xương bắt đầu cứng.' },
        11: { size: '4 cm', weight: '7 g', fruit: 'Quả vải', fruitEmoji: '🍈', description: 'Mặt hoàn thiện, bé có thể nheo mặt.' },
        12: { size: '5.5 cm', weight: '14 g', fruit: 'Quả chanh dây', fruitEmoji: '🍋', description: 'Hệ thần kinh phát triển, phản xạ hình thành.' },
        13: { size: '7 cm', weight: '23 g', fruit: 'Quả đào', fruitEmoji: '🍑', description: 'Vân tay hình thành, bé có thể mút tay.' },
        14: { size: '8.5 cm', weight: '43 g', fruit: 'Quả chanh', fruitEmoji: '🍋', description: 'Bé bắt đầu tiểu vào nước ối.' },
        15: { size: '10 cm', weight: '70 g', fruit: 'Quả táo', fruitEmoji: '🍎', description: 'Bé có thể cảm nhận ánh sáng.' },
        16: { size: '11.5 cm', weight: '100 g', fruit: 'Quả bơ', fruitEmoji: '🥑', description: 'Hệ cơ xương phát triển, bé cử động nhiều hơn.' },
        17: { size: '13 cm', weight: '140 g', fruit: 'Quả lê', fruitEmoji: '🍐', description: 'Mỡ dưới da bắt đầu hình thành.' },
        18: { size: '14 cm', weight: '190 g', fruit: 'Quả ớt chuông', fruitEmoji: '🫑', description: 'Bé bắt đầu nghe được âm thanh.' },
        19: { size: '15 cm', weight: '240 g', fruit: 'Quả xoài nhỏ', fruitEmoji: '🥭', description: 'Lớp phủ bảo vệ da (vernix) hình thành.' },
        20: { size: '16.5 cm', weight: '300 g', fruit: 'Quả chuối', fruitEmoji: '🍌', description: 'Nửa chặng đường! Bé cử động rõ ràng.' },
        22: { size: '19 cm', weight: '430 g', fruit: 'Quả đu đủ nhỏ', fruitEmoji: '🥭', description: 'Mắt và môi phát triển rõ nét.' },
        24: { size: '21 cm', weight: '600 g', fruit: 'Bắp ngô', fruitEmoji: '🌽', description: 'Phổi bắt đầu sản xuất surfactant.' },
        26: { size: '23 cm', weight: '760 g', fruit: 'Củ cải đường', fruitEmoji: '🥕', description: 'Bé mở mắt, phản ứng với âm thanh.' },
        28: { size: '25 cm', weight: '1 kg', fruit: 'Quả bầu nhỏ', fruitEmoji: '🫒', description: 'Não phát triển nhanh, bé mơ khi ngủ.' },
        30: { size: '27 cm', weight: '1.3 kg', fruit: 'Quả bắp cải', fruitEmoji: '🥬', description: 'Bé tăng cân nhanh, tích mỡ dưới da.' },
        32: { size: '29 cm', weight: '1.7 kg', fruit: 'Quả bí ngô nhỏ', fruitEmoji: '🎃', description: 'Phổi gần hoàn thiện, xương cứng hơn.' },
        34: { size: '32 cm', weight: '2.1 kg', fruit: 'Quả dứa', fruitEmoji: '🍍', description: 'Hệ miễn dịch phát triển, bé quay đầu.' },
        36: { size: '34 cm', weight: '2.6 kg', fruit: 'Quả dưa lưới', fruitEmoji: '🍈', description: 'Bé đủ tháng sớm, cơ quan gần hoàn thiện.' },
        38: { size: '35 cm', weight: '3 kg', fruit: 'Quả dưa hấu nhỏ', fruitEmoji: '🍉', description: 'Bé sẵn sàng chào đời!' },
        40: { size: '36 cm', weight: '3.3 kg', fruit: 'Quả dưa hấu', fruitEmoji: '🍉', description: 'Đủ tháng! Bé sẵn sàng gặp mẹ.' },
    };

    // Find closest match (round down to nearest available week)
    const available = Object.keys(data).map(Number).sort((a, b) => a - b);
    if (weeks < available[0]) return null;

    let match = available[0];
    for (const w of available) {
        if (w <= weeks) match = w;
        else break;
    }

    return data[match];
}

/**
 * Get the milestone status relative to current gestational age
 * @param {number} milestoneWeek
 * @param {number} currentWeeks
 * @param {number} currentDays
 * @returns {'past'|'current'|'upcoming'}
 */
export function getMilestoneStatus(milestoneWeek, currentWeeks, currentDays) {
    if (currentWeeks > milestoneWeek + 1) return 'past';
    if (currentWeeks >= milestoneWeek - 1 && currentWeeks <= milestoneWeek + 1) return 'current';
    return 'upcoming';
}

/**
 * Format a Date as Vietnamese locale string (dd/mm/yyyy)
 * @param {Date} date
 * @returns {string}
 */
export function formatDateVN(date) {
    const d = toLocalDate(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Add weeks to a date
 * @param {Date} date
 * @param {number} weeks
 * @returns {Date}
 */
export function addWeeks(date, weeks) {
    const d = new Date(date);
    d.setDate(d.getDate() + weeks * 7);
    return d;
}

/**
 * Validate that an LMP date is reasonable for pregnancy calculation
 * @param {Date|string} lmpDate
 * @param {Date|string} [referenceDate]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateLmpDate(lmpDate, referenceDate) {
    const lmp = toLocalDate(lmpDate);
    const ref = referenceDate ? toLocalDate(referenceDate) : toLocalDate(new Date());

    if (isNaN(lmp.getTime())) return { valid: false, error: 'Ngày không hợp lệ.' };

    const diffDays = Math.floor((ref.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { valid: false, error: 'Ngày kinh cuối không thể trong tương lai.' };
    if (diffDays < 14) return { valid: false, error: 'Cần ít nhất 2 tuần từ ngày kinh cuối.' };
    if (diffDays > 301) return { valid: false, error: 'Ngày kinh cuối quá xa (hơn 43 tuần). Vui lòng kiểm tra lại.' };

    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// ACOG-700 COMPLIANT FUNCTIONS
// Source: ACOG Committee Opinion No. 700 (2017, Reaffirmed 2022)
// ═══════════════════════════════════════════════════════════════

const FULL_TERM_DAYS = 280;       // 40 weeks from LMP
const POST_CONCEPTION_DAYS = 266; // 38 weeks from conception
const DEFAULT_CYCLE = 28;

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
 * Calculate EDD using modified Naegele's rule (adjusts for non-28-day cycles)
 * Formula: LMP + 280 + (cycleLength - 28) days
 * Source: ACOG Committee Opinion No. 700 (2017)
 * @param {Date|string} lmpDate
 * @param {number} [cycleLength=28]
 * @returns {Date}
 */
export function calcEddByLmpModified(lmpDate, cycleLength = DEFAULT_CYCLE) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');
    return addDays(lmp, FULL_TERM_DAYS + (cycleLength - DEFAULT_CYCLE));
}

/**
 * Calculate EDD from IVF/ART transfer date
 * Formula: transferDate + (266 - embryoDay) days
 * Day-5 blastocyst: +261, Day-3 embryo: +263, Day-6: +260
 * Source: ACOG Committee Opinion No. 700 (2017) — ART section
 * @param {Date|string} transferDate
 * @param {number} embryoDay - Age of embryo at transfer (3, 5, 6, or custom)
 * @returns {Date}
 */
export function calcEddByIvf(transferDate, embryoDay) {
    const transfer = toLocalDate(transferDate);
    if (isNaN(transfer.getTime())) throw new Error('Invalid transfer date');
    return addDays(transfer, POST_CONCEPTION_DAYS - embryoDay);
}

/**
 * Calculate gestational age from CRL measurement
 * Robinson & Fleming (1975): GA_days = 8.052 * sqrt(CRL_mm * 1.037) + 23.73
 * Tan et al. (2023): GA_days = 37.31 + 1.39*CRL - 0.014*CRL² + 0.00007*CRL³
 * Valid range: CRL 10-84 mm (~7-14 weeks)
 * Source: Robinson-1975, Tan-2023
 * @param {number} crlMm - Crown-Rump Length in millimeters
 * @param {'robinson'|'tan'} [formula='robinson']
 * @returns {{ weeks: number, days: number, totalDays: number }}
 */
export function calcGaFromCrl(crlMm, formula = 'robinson') {
    if (crlMm < 10 || crlMm > 84) {
        throw new Error(`CRL ${crlMm}mm is out of valid range (10-84 mm)`);
    }

    let gaDays;
    if (formula === 'tan') {
        // Tan et al. (2023): cubic polynomial
        gaDays = 37.31 + (1.39 * crlMm) - (0.014 * crlMm * crlMm) + (0.00007 * crlMm * crlMm * crlMm);
    } else {
        // Robinson & Fleming (1975): square root
        gaDays = 8.052 * Math.sqrt(crlMm * 1.037) + 23.73;
    }

    const totalDays = Math.round(gaDays);
    return {
        weeks: Math.floor(totalDays / 7),
        days: totalDays % 7,
        totalDays,
    };
}

/**
 * Calculate EDD from ultrasound-derived gestational age
 * Formula: usDate + (280 - ga.totalDays) days
 * Source: ACOG Committee Opinion No. 700 (2017)
 * @param {Date|string} ultrasoundDate
 * @param {{ weeks: number, days: number, totalDays: number }} gaAtUltrasound
 * @returns {Date}
 */
export function calcEddFromUltrasoundGa(ultrasoundDate, gaAtUltrasound) {
    const usDate = toLocalDate(ultrasoundDate);
    if (isNaN(usDate.getTime())) throw new Error('Invalid ultrasound date');
    return addDays(usDate, FULL_TERM_DAYS - gaAtUltrasound.totalDays);
}

/**
 * ACOG Redating Decision Engine — Committee Opinion No. 700, Table 1
 * Determines whether to adjust EDD based on ultrasound discrepancy
 *
 * | GA by LMP        | Method   | Redate if discrepancy > |
 * |------------------|----------|-------------------------|
 * | ≤ 8+6 weeks      | CRL      | > 5 days                |
 * | 9+0 – 13+6       | CRL      | > 7 days                |
 * | 14+0 – 15+6      | Biometry | > 7 days                |
 * | 16+0 – 21+6      | Biometry | > 10 days               |
 * | 22+0 – 27+6      | Biometry | > 14 days               |
 * | ≥ 28+0           | Biometry | > 21 days               |
 *
 * @param {number} gaLmpWeeks - GA in weeks per LMP at time of ultrasound
 * @param {number} discrepancyDays - |GA_LMP - GA_US| in days
 * @returns {{ shouldRedate: boolean, threshold: number, gaRange: string, acogCitation: string, warnings: string[] }}
 */
export function shouldRedate(gaLmpWeeks, discrepancyDays) {
    // ACOG-700 Table 1 thresholds
    const REDATE_TABLE = [
        { maxWeeks: 8, threshold: 5, method: 'CRL', range: '≤ 8⁶⁄₇ tuần' },
        { maxWeeks: 13, threshold: 7, method: 'CRL', range: '9⁰⁄₇ – 13⁶⁄₇ tuần' },
        { maxWeeks: 15, threshold: 7, method: 'Biometry', range: '14⁰⁄₇ – 15⁶⁄₇ tuần' },
        { maxWeeks: 21, threshold: 10, method: 'Biometry', range: '16⁰⁄₇ – 21⁶⁄₇ tuần' },
        { maxWeeks: 27, threshold: 14, method: 'Biometry', range: '22⁰⁄₇ – 27⁶⁄₇ tuần' },
        { maxWeeks: Infinity, threshold: 21, method: 'Biometry', range: '≥ 28⁰⁄₇ tuần' },
    ];

    let entry = REDATE_TABLE[REDATE_TABLE.length - 1];
    for (const row of REDATE_TABLE) {
        if (gaLmpWeeks <= row.maxWeeks) {
            entry = row;
            break;
        }
    }

    const warnings = [];
    const doRedate = discrepancyDays > entry.threshold;

    // IUGR warning for T3 redating
    if (gaLmpWeeks >= 28 && doRedate) {
        warnings.push(
            'Cảnh báo: Điều chỉnh EDD trong tam cá nguyệt III có nguy cơ bỏ sót thai chậm tăng trưởng trong tử cung (IUGR). Cần đánh giá lâm sàng toàn diện. (ACOG-700)'
        );
    }

    return {
        shouldRedate: doRedate,
        threshold: entry.threshold,
        gaRange: entry.range,
        acogCitation: 'ACOG Committee Opinion No. 700 (2017, Reaffirmed 2022) — Table 1',
        warnings,
    };
}

/**
 * Reconcile LMP-based and ultrasound-based EDD per full ACOG algorithm
 * Source: ACOG Committee Opinion No. 700 (2017)
 *
 * Algorithm:
 * 1. If ART → use ART-derived EDD, STOP (never redate ART)
 * 2. Calculate EDD_LMP (modified Naegele)
 * 3. Calculate GA_LMP at ultrasound date
 * 4. Compare with GA_US → discrepancy
 * 5. Apply ACOG redating table → decide final EDD
 *
 * @param {Date|string} lmpDate
 * @param {number} cycleLength
 * @param {Date|string} ultrasoundDate
 * @param {{ weeks: number, days: number, totalDays: number }} gaUltrasound
 * @param {boolean} isArt
 * @returns {{ eddLmp: Date, eddUltrasound: Date, eddFinal: Date, discrepancyDays: number, wasRedated: boolean, decision: object, method: string }}
 */
export function reconcileEdd(lmpDate, cycleLength, ultrasoundDate, gaUltrasound, isArt) {
    const eddLmp = calcEddByLmpModified(lmpDate, cycleLength);
    const eddUltrasound = calcEddFromUltrasoundGa(ultrasoundDate, gaUltrasound);

    // ART pregnancies: NEVER redate
    if (isArt) {
        return {
            eddLmp,
            eddUltrasound,
            eddFinal: eddLmp,
            discrepancyDays: 0,
            wasRedated: false,
            decision: null,
            method: 'ART-derived — Không điều chỉnh bằng siêu âm',
        };
    }

    // Calculate GA_LMP at the ultrasound date
    const gaLmpAtUs = calculateGestationalAge(lmpDate, ultrasoundDate);

    // Discrepancy = |GA_LMP - GA_US| in days
    const discrepancyDays = Math.abs(gaLmpAtUs.totalDays - gaUltrasound.totalDays);

    // Apply ACOG redating table
    const decision = shouldRedate(gaLmpAtUs.weeks, discrepancyDays);

    return {
        eddLmp,
        eddUltrasound,
        eddFinal: decision.shouldRedate ? eddUltrasound : eddLmp,
        discrepancyDays,
        wasRedated: decision.shouldRedate,
        decision,
        method: decision.shouldRedate ? 'Siêu âm (đã điều chỉnh theo ACOG-700)' : 'LMP (giữ nguyên theo ACOG-700)',
    };
}

/**
 * Classify term status per ACOG Committee Opinion No. 579
 * Source: ACOG Committee Opinion No. 579 (2013, Reaffirmed 2022)
 * @param {number} weeks
 * @param {number} days
 * @returns {'preterm'|'early-term'|'full-term'|'late-term'|'post-term'}
 */
export function getTermClassification(weeks, days) {
    const totalDays = weeks * 7 + days;
    if (totalDays < 37 * 7) return 'preterm';        // < 37+0
    if (totalDays < 39 * 7) return 'early-term';      // 37+0 to 38+6
    if (totalDays < 41 * 7) return 'full-term';        // 39+0 to 40+6
    if (totalDays < 42 * 7) return 'late-term';        // 41+0 to 41+6
    return 'post-term';                                 // ≥ 42+0
}

/**
 * Generate clinical warnings based on current GA and context
 * Source: ACOG Committee Opinions No. 688 & 700
 * @param {{ weeks: number, days: number }} ga
 * @param {{ hasEarlyUltrasound?: boolean, wasRedatedInT3?: boolean }} [context]
 * @returns {Array<{ type: string, message: string, severity: 'info'|'warning'|'danger' }>}
 */
export function getClinicalWarnings(ga, context = {}) {
    const warnings = [];

    // Post-term warning (≥ 41 weeks)
    if (ga.weeks >= 42) {
        warnings.push({
            type: 'post-term',
            message: 'Thai kỳ đã vượt 42 tuần (post-term). Cần can thiệp y khoa theo chỉ định bác sĩ.',
            severity: 'danger',
        });
    } else if (ga.weeks >= 41) {
        warnings.push({
            type: 'post-term',
            message: 'Thai kỳ đã vượt 41 tuần (late-term). Cần tư vấn bác sĩ về kế hoạch khởi phát chuyển dạ.',
            severity: 'warning',
        });
    }

    // Suboptimal dating (ACOG-688)
    if (context.hasEarlyUltrasound === false) {
        warnings.push({
            type: 'suboptimal-dating',
            message: 'Thai kỳ này được coi là "suboptimally dated" theo ACOG Committee Opinion No. 688. Đề xuất siêu âm xác nhận tuổi thai trước 22 tuần.',
            severity: 'warning',
        });
    }

    // IUGR risk from T3 redating
    if (context.wasRedatedInT3) {
        warnings.push({
            type: 'iugr-risk',
            message: 'Điều chỉnh EDD trong tam cá nguyệt III có nguy cơ bỏ sót thai chậm tăng trưởng trong tử cung (IUGR). Cần đánh giá lâm sàng toàn diện và theo dõi siêu âm tăng trưởng. (ACOG-700)',
            severity: 'danger',
        });
    }

    return warnings;
}
