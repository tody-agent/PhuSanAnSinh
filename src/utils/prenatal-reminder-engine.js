/**
 * Prenatal Reminder Engine — Checkup Schedule & Calendar Export
 * 
 * Pure JS engine. No framework dependencies.
 * Designed as standalone module for SaaS extraction.
 * 
 * Medical data sourced from:
 * - WHO 8-contact ANC model (2016, updated 2024)
 * - ACOG Prenatal Care Guidelines (2025)
 * - Vietnamese MOH Circular 34/2016/TT-BYT
 */

// ═══════════════════════════════════════════════
// MILESTONE DATA — 13 visits with medical tiers
// ═══════════════════════════════════════════════

const PRENATAL_MILESTONES = [
    {
        id: 'visit-01',
        week: 8,
        windowStart: 6,
        windowEnd: 10,
        title: 'Khám lần đầu',
        tier: 'critical',
        urgencyNote: 'Xác nhận thai trong tử cung, loại trừ thai ngoài tử cung. Nếu phát hiện muộn sẽ nguy hiểm tính mạng.',
        description: 'Xác nhận thai, đánh giá toàn diện sức khỏe mẹ, phân tầng nguy cơ, thiết lập kế hoạch chăm sóc.',
        tests: ['Siêu âm đầu dò', 'Xét nghiệm máu tổng quát', 'Nhóm máu ABO + Rh', 'HBsAg, HIV, Rubella IgG', 'Tổng phân tích nước tiểu'],
        icon: '🩺',
        calendarDescription: 'Khám thai lần đầu tại Phòng Khám An Sinh.\nXét nghiệm: Siêu âm, máu tổng quát, HBsAg, HIV, Rubella.\nMang theo: CMND/CCCD, sổ khám bệnh.',
    },
    {
        id: 'visit-02',
        week: 12,
        windowStart: 11,
        windowEnd: 13,
        title: 'Sàng lọc dị tật — "Mốc Vàng"',
        tier: 'critical',
        urgencyNote: 'CHỈ thực hiện được tuần 11-13⁶⁄₇. Bỏ lỡ = mất cơ hội phát hiện Down syndrome sớm nhất (sensitivity 83-99%).',
        description: 'Đo độ mờ da gáy (NT) sàng lọc hội chứng Down và dị tật nhiễm sắc thể. Thời điểm duy nhất để sàng lọc chính xác nhất.',
        tests: ['Siêu âm đo độ mờ da gáy (NT)', 'Double Test (PAPP-A + free β-hCG)', 'NIPT / cfDNA (nếu cần)'],
        icon: '👶',
        calendarDescription: 'Sàng lọc dị tật tam cá nguyệt 1 — MỐC VÀNG.\nĐo NT + Double Test. Chỉ làm được 11-13 tuần 6 ngày.\nNHỊN ĂN SÁNG trước khi đến (nếu có xét nghiệm máu).',
    },
    {
        id: 'visit-03',
        week: 16,
        windowStart: 15,
        windowEnd: 18,
        title: 'Xét nghiệm tam cá nguyệt 2',
        tier: 'recommended',
        urgencyNote: 'Triple/Quad test bổ sung nếu chưa làm NIPT. Đánh giá cổ tử cung cho thai phụ có tiền sử sinh non.',
        description: 'Kiểm tra phát triển thai, xét nghiệm bổ sung Triple/Quad test nếu chưa làm sàng lọc trước đó.',
        tests: ['Triple Test / Quad Test (nếu chưa NIPT)', 'Siêu âm theo dõi', 'Đo chiều dài cổ tử cung (nếu cần)'],
        icon: '📋',
        calendarDescription: 'Khám thai định kỳ tuần 16.\nXét nghiệm bổ sung nếu cần. Kiểm tra phát triển thai.',
    },
    {
        id: 'visit-04',
        week: 22,
        windowStart: 18,
        windowEnd: 22,
        title: 'Siêu âm hình thái chi tiết',
        tier: 'critical',
        urgencyNote: 'Siêu âm CHI TIẾT NHẤT trong thai kỳ. Phát hiện 80% dị tật bẩm sinh: tim, não, cột sống. Không có xét nghiệm nào thay thế được.',
        description: 'Đánh giá toàn diện cấu trúc giải phẫu thai nhi — tim, não, cột sống, chi, cơ quan nội tạng. Lần siêu âm quan trọng nhất.',
        tests: ['Siêu âm 4D/5D hình thái', 'Kiểm tra tim thai 4 buồng + đường ra', 'Đánh giá não, cột sống, chi', 'Đo nước ối, vị trí nhau'],
        icon: '📷',
        calendarDescription: 'Siêu âm hình thái chi tiết — QUAN TRỌNG NHẤT.\nKiểm tra toàn bộ cấu trúc: tim, não, cột sống.\nThời gian: ~45 phút. Uống nước đầy đủ trước khi đến.',
    },
    {
        id: 'visit-05',
        week: 26,
        windowStart: 24,
        windowEnd: 28,
        title: 'Tầm soát tiểu đường thai kỳ',
        tier: 'critical',
        urgencyNote: 'GDM không phát hiện → bé quá to, khó sinh, nguy cơ mổ. Ảnh hưởng TRỰC TIẾP sức khoẻ bé sau sinh.',
        description: 'Nghiệm pháp dung nạp glucose — sàng lọc đái tháo đường thai kỳ. BẮT BUỘC cho tất cả thai phụ.',
        tests: ['Nghiệm pháp dung nạp glucose 75g (OGTT)', 'Xét nghiệm máu đường huyết', 'CBC đánh giá thiếu máu'],
        icon: '🩸',
        calendarDescription: 'Tầm soát tiểu đường thai kỳ — BẮT BUỘC.\n⚠️ NHỊN ĂN TỐI THIỂU 8 GIỜ trước khi đến.\nThời gian xét nghiệm: ~2-3 giờ tại phòng khám.',
    },
    {
        id: 'visit-06',
        week: 28,
        windowStart: 28,
        windowEnd: 30,
        title: 'Tiêm phòng + Đánh giá thiếu máu',
        tier: 'recommended',
        urgencyNote: 'Tiêm Tdap bảo vệ bé khỏi ho gà — nguyên nhân hàng đầu tử vong trẻ sơ sinh. Anti-D cho mẹ Rh âm.',
        description: 'Tiêm vắc xin Tdap (ho gà), tiêm Anti-D nếu Rh âm. Bắt đầu đếm cử động thai hàng ngày.',
        tests: ['Vắc xin Tdap (uốn ván-bạch hầu-ho gà)', 'Anti-D immune globulin (nếu Rh âm)', 'CBC lần 2', 'Siêu âm theo dõi'],
        icon: '💉',
        calendarDescription: 'Tiêm phòng Tdap + kiểm tra thiếu máu.\nTiêm Anti-D nếu mẹ Rh âm.\nBắt đầu đếm cử động thai hàng ngày từ mốc này.',
    },
    {
        id: 'visit-07',
        week: 32,
        windowStart: 31,
        windowEnd: 33,
        title: 'Đánh giá phát triển thai nhi',
        tier: 'recommended',
        urgencyNote: 'Phát hiện bất thường khởi phát muộn: ngôi mông, nước ối bất thường, thai chậm tăng trưởng.',
        description: 'Kiểm tra ngôi thai, nước ối, bánh rau. Phát hiện bất thường khởi phát muộn. Chuẩn bị cho giai đoạn cuối.',
        tests: ['Siêu âm phát triển + nước ối', 'Đánh giá ngôi thai (Leopold)', 'Vắc xin uốn ván mũi 2'],
        icon: '📊',
        calendarDescription: 'Đánh giá phát triển thai nhi tuần 32.\nKiểm tra ngôi thai, nước ối, tăng trưởng.\nThảo luận kế hoạch sinh.',
    },
    {
        id: 'visit-08',
        week: 34,
        windowStart: 34,
        windowEnd: 35,
        title: 'Đánh giá ngôi thai',
        tier: 'monitoring',
        urgencyNote: 'Xác nhận ngôi thai. Nếu ngôi mông → thảo luận ngoại xoay thai (ECV) tại tuần 36-37.',
        description: 'Nghiệm pháp Leopold đánh giá ngôi thai. Nếu ngôi mông → cân nhắc ngoại xoay thai.',
        tests: ['Nghiệm pháp Leopold', 'Siêu âm xác nhận ngôi (nếu cần)', 'Huyết áp + protein niệu'],
        icon: '🔄',
        calendarDescription: 'Khám thai tuần 34 — Đánh giá ngôi thai.\nNếu bé quay mông: thảo luận ngoại xoay thai.',
    },
    {
        id: 'visit-09',
        week: 36,
        windowStart: 36,
        windowEnd: 37,
        title: 'Sàng lọc GBS + Chuẩn bị sinh',
        tier: 'recommended',
        urgencyNote: '25% mẹ mang GBS. Không phát hiện → trẻ sơ sinh có thể nhiễm trùng huyết, viêm màng não ngay sau sinh.',
        description: 'Tầm soát Streptococcus nhóm B (GBS). Bắt đầu khám HÀNG TUẦN từ mốc này. Non-stress test (NST).',
        tests: ['Tầm soát GBS (phết âm đạo-trực tràng)', 'Non-stress test (NST)', 'Siêu âm đánh giá cuối kỳ'],
        icon: '❤️',
        calendarDescription: 'Tầm soát GBS + NST — KHÁM HÀNG TUẦN từ đây.\nPhát hiện GBS sớm để dùng kháng sinh khi chuyển dạ.\nBắt đầu chuẩn bị đồ sinh, túi đi sinh.',
    },
    {
        id: 'visit-10',
        week: 37,
        windowStart: 37,
        windowEnd: 37,
        title: 'Theo dõi hàng tuần — Tuần 37',
        tier: 'monitoring',
        urgencyNote: 'Thai đủ tháng sớm (early-term). Đánh giá ngôi thai cuối cùng và kế hoạch sinh chi tiết.',
        description: 'Khám lâm sàng, đánh giá ngôi thai, thảo luận kế hoạch sinh: tự nhiên, khởi phát, hay mổ.',
        tests: ['Huyết áp + tim thai + protein niệu', 'Đánh giá ngôi thai', 'Thảo luận kế hoạch sinh'],
        icon: '📋',
        calendarDescription: 'Khám thai hàng tuần — tuần 37.\nThảo luận kế hoạch sinh chi tiết với bác sĩ.',
    },
    {
        id: 'visit-11',
        week: 38,
        windowStart: 38,
        windowEnd: 38,
        title: 'Đánh giá tiền sản — Tuần 38',
        tier: 'monitoring',
        urgencyNote: 'Đánh giá sẵn sàng sinh. Theo dõi dấu hiệu chuyển dạ. Biết khi nào cần nhập viện.',
        description: 'Đánh giá sẵn sàng sinh, vị trí thai, nước ối. Tư vấn dấu hiệu chuyển dạ và khi nào nhập viện.',
        tests: ['Siêu âm Doppler', 'NST', 'Đánh giá Bishop Score (nếu cần)'],
        icon: '📅',
        calendarDescription: 'Đánh giá tiền sản tuần 38.\nKiểm tra sẵn sàng sinh. Ghi nhớ dấu hiệu chuyển dạ.',
    },
    {
        id: 'visit-12',
        week: 39,
        windowStart: 39,
        windowEnd: 39,
        title: 'Thai đủ tháng — Tuần 39',
        tier: 'monitoring',
        urgencyNote: 'Thai đủ tháng (full-term). Cân nhắc khởi phát chuyển dạ theo ARRIVE Trial — giảm tỷ lệ mổ.',
        description: 'Khám cổ tử cung nếu cần. Thảo luận khởi phát chuyển dạ tự chọn (ARRIVE Trial).',
        tests: ['Bishop Score', 'NST', 'Đánh giá lâm sàng'],
        icon: '🏥',
        calendarDescription: 'Khám thai tuần 39 — Thai đủ tháng.\nThảo luận khởi phát chuyển dạ vs chờ tự nhiên.',
    },
    {
        id: 'visit-13',
        week: 40,
        windowStart: 40,
        windowEnd: 41,
        title: 'Ngày dự sinh — Theo dõi sát',
        tier: 'critical',
        urgencyNote: 'Thai > 41 tuần tăng nguy cơ thai chết lưu, suy thai. Cần theo dõi NST hàng ngày và đánh giá can thiệp.',
        description: 'Theo dõi sát nếu chưa chuyển dạ. NST hàng ngày, đánh giá nước ối. Can thiệp nếu cần.',
        tests: ['NST hàng ngày', 'Siêu âm nước ối (AFI)', 'Đánh giá lâm sàng'],
        icon: '⭐',
        calendarDescription: 'NGÀY DỰ SINH — Theo dõi sát tại Phòng Khám An Sinh.\nNếu chưa có dấu hiệu chuyển dạ → đến khám.\nNST và đánh giá nước ối.',
    },
];

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const TIMEZONE = 'Asia/Ho_Chi_Minh';
const TIMEZONE_OFFSET = '+07:00';
const CLINIC_NAME = 'Phòng Khám Phú Sản An Sinh';
const CLINIC_ADDRESS = '416 Minh Khai, Đồng Nguyên, Từ Sơn, Bắc Ninh';
const CLINIC_PHONE = '0899 268 299';

const TIME_SLOTS = {
    morning: { hour: 8, minute: 0, label: 'Sáng (8:00)' },
    afternoon: { hour: 14, minute: 0, label: 'Chiều (14:00)' },
    evening: { hour: 18, minute: 0, label: 'Tối (18:00)' },
};

const TIER_CONFIG = {
    critical: { emoji: '🔴', label: 'Quan trọng — Không thể bỏ qua', color: '#DC2626' },
    recommended: { emoji: '🟡', label: 'Khuyến nghị — Nên đi để yên tâm', color: '#D97706' },
    monitoring: { emoji: '🟢', label: 'Theo dõi — Khám hàng tuần giai đoạn cuối', color: '#059669' },
};

// ═══════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Create a clean date at midnight
 * @param {Date|string} date
 * @returns {Date}
 */
function toLocalDate(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

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
 * Calculate gestational age from LMP
 * @param {Date|string} lmpDate
 * @param {Date|string} [refDate]
 * @returns {{ weeks: number, days: number, totalDays: number }}
 */
function calcGestationalAge(lmpDate, refDate) {
    const lmp = toLocalDate(lmpDate);
    const ref = refDate ? toLocalDate(refDate) : toLocalDate(new Date());
    const totalDays = Math.floor((ref - lmp) / (1000 * 60 * 60 * 24));
    if (totalDays < 0) return { weeks: 0, days: 0, totalDays: 0 };
    return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, totalDays };
}

/**
 * Calculate the actual appointment date for a milestone,
 * adjusting for day preference (weekday vs Sunday) and time slot.
 * 
 * @param {Date|string} lmpDate
 * @param {number} milestoneWeek - target gestational week
 * @param {'weekday'|'sunday'} dayPref - 'weekday' = next Mon-Sat, 'sunday' = next Sunday
 * @param {'morning'|'afternoon'|'evening'} timePref - time slot
 * @returns {Date}
 */
export function calculateMilestoneDate(lmpDate, milestoneWeek, dayPref = 'weekday', timePref = 'morning') {
    const lmp = toLocalDate(lmpDate);
    const baseDate = addDays(lmp, milestoneWeek * 7);

    let appointmentDate = new Date(baseDate);
    const dayOfWeek = appointmentDate.getDay(); // 0=Sunday

    if (dayPref === 'sunday') {
        // Move to next Sunday (or keep if already Sunday)
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        appointmentDate = addDays(appointmentDate, daysUntilSunday);
    } else {
        // Move to next weekday Mon-Sat (skip Sunday)
        if (dayOfWeek === 0) {
            appointmentDate = addDays(appointmentDate, 1); // Sunday → Monday
        }
    }

    // Apply time slot
    const slot = TIME_SLOTS[timePref] || TIME_SLOTS.morning;
    appointmentDate.setHours(slot.hour, slot.minute, 0, 0);

    return appointmentDate;
}

/**
 * Generate reminder schedule — only FUTURE milestones based on current gestational age.
 * 
 * @param {Date|string} lmpDate
 * @param {Date|string} [currentDate] - defaults to today
 * @returns {Array<Object>} filtered milestones with calculated dates
 */
export function generateReminderSchedule(lmpDate, currentDate) {
    const lmp = toLocalDate(lmpDate);
    if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date');

    const ga = calcGestationalAge(lmpDate, currentDate);

    return PRENATAL_MILESTONES
        .filter(m => m.week > ga.weeks || (m.week === ga.weeks && ga.days <= 2))
        .map(m => ({
            ...m,
            baseDate: addDays(lmp, m.week * 7),
            tierConfig: TIER_CONFIG[m.tier],
        }));
}

/**
 * Get all 13 milestones (for display purposes, e.g. full timeline)
 * @returns {Array<Object>}
 */
export function getAllMilestones() {
    return PRENATAL_MILESTONES.map(m => ({ ...m, tierConfig: TIER_CONFIG[m.tier] }));
}

// ═══════════════════════════════════════════════
// ICS CALENDAR GENERATION (RFC 5545)
// ═══════════════════════════════════════════════

/**
 * Format date as ICS datetime string (local time with TZID)
 * @param {Date} date
 * @returns {string} YYYYMMDDTHHmmss
 */
export function formatIcsDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}00`;
}

/**
 * Generate a unique UID for ICS events
 * @param {string} milestoneId
 * @param {Date} date
 * @returns {string}
 */
function generateUid(milestoneId, date) {
    return `${milestoneId}-${date.getTime()}@phusanansinh.vn`;
}

/**
 * Escape text for ICS format
 * @param {string} text
 * @returns {string}
 */
function escapeIcs(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

/**
 * Generate ICS calendar file content for selected milestones.
 * 
 * @param {Array<Object>} milestones - from generateReminderSchedule
 * @param {Object} options
 * @param {Date|string} options.lmpDate
 * @param {'weekday'|'sunday'} options.dayPref
 * @param {'morning'|'afternoon'|'evening'} options.timePref
 * @param {number} options.reminderHours - 24 or 8
 * @param {string} [options.clinicName]
 * @returns {string} ICS file content
 */
export function generateIcsCalendar(milestones, options) {
    const {
        lmpDate,
        dayPref = 'weekday',
        timePref = 'morning',
        reminderHours = 24,
        clinicName = CLINIC_NAME,
    } = options;

    const events = milestones.map(m => {
        const apptDate = calculateMilestoneDate(lmpDate, m.week, dayPref, timePref);
        const endDate = new Date(apptDate);
        endDate.setHours(endDate.getHours() + 1);

        const tierLabel = TIER_CONFIG[m.tier]?.emoji || '';
        const summary = `${tierLabel} Tuần ${m.week}: ${m.title}`;
        const description = [
            m.calendarDescription || m.description,
            '',
            `Xét nghiệm: ${m.tests.join(', ')}`,
            '',
            `☎️ Đặt lịch: ${CLINIC_PHONE}`,
            `📍 ${clinicName} — ${CLINIC_ADDRESS}`,
        ].join('\\n');

        return [
            'BEGIN:VEVENT',
            `UID:${generateUid(m.id, apptDate)}`,
            `DTSTART;TZID=${TIMEZONE}:${formatIcsDate(apptDate)}`,
            `DTEND;TZID=${TIMEZONE}:${formatIcsDate(endDate)}`,
            `SUMMARY:${escapeIcs(summary)}`,
            `DESCRIPTION:${escapeIcs(description)}`,
            `LOCATION:${escapeIcs(`${clinicName}\\, ${CLINIC_ADDRESS}`)}`,
            `STATUS:CONFIRMED`,
            `BEGIN:VALARM`,
            `TRIGGER:-PT${reminderHours}H`,
            `ACTION:DISPLAY`,
            `DESCRIPTION:${escapeIcs(`Nhắc lịch khám thai: ${m.title} — ${clinicName}`)}`,
            `END:VALARM`,
            'END:VEVENT',
        ].join('\r\n');
    });

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Phu San An Sinh//Prenatal Reminder//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:Lịch Khám Thai — ${clinicName}`,
        `X-WR-TIMEZONE:${TIMEZONE}`,
        // VTIMEZONE for Asia/Ho_Chi_Minh
        'BEGIN:VTIMEZONE',
        `TZID:${TIMEZONE}`,
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0700',
        'TZOFFSETTO:+0700',
        'TZNAME:ICT',
        'END:STANDARD',
        'END:VTIMEZONE',
        ...events,
        'END:VCALENDAR',
    ].join('\r\n');
}

// ═══════════════════════════════════════════════
// GOOGLE CALENDAR DEEP LINK
// ═══════════════════════════════════════════════

/**
 * Generate Google Calendar event creation URL.
 * 
 * @param {Object} milestone
 * @param {Object} options
 * @param {Date|string} options.lmpDate
 * @param {'weekday'|'sunday'} options.dayPref
 * @param {'morning'|'afternoon'|'evening'} options.timePref
 * @param {number} options.reminderHours
 * @returns {string} Google Calendar URL
 */
export function generateGoogleCalendarUrl(milestone, options) {
    const {
        lmpDate,
        dayPref = 'weekday',
        timePref = 'morning',
    } = options;

    const apptDate = calculateMilestoneDate(lmpDate, milestone.week, dayPref, timePref);
    const endDate = new Date(apptDate);
    endDate.setHours(endDate.getHours() + 1);

    // Google Cal uses UTC format: YYYYMMDDTHHmmssZ
    const formatGcal = (d) => {
        const utc = new Date(d.getTime() - 7 * 60 * 60 * 1000); // Convert ICT → UTC
        return formatIcsDate(utc) + 'Z';
    };

    const tierLabel = TIER_CONFIG[milestone.tier]?.emoji || '';
    const title = `${tierLabel} Tuần ${milestone.week}: ${milestone.title}`;
    const details = [
        milestone.calendarDescription || milestone.description,
        '',
        `Xét nghiệm: ${milestone.tests.join(', ')}`,
        `☎️ ${CLINIC_PHONE}`,
    ].join('\n');

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${formatGcal(apptDate)}/${formatGcal(endDate)}`,
        details: details,
        location: `${CLINIC_NAME}, ${CLINIC_ADDRESS}`,
        ctz: TIMEZONE,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Google Calendar URL for ALL selected milestones (batch — opens first event)
 * Note: Google Calendar doesn't support batch creation via URL. This opens the first event.
 * For multiple events, use ICS download instead.
 * 
 * @param {Array<Object>} milestones
 * @param {Object} options
 * @returns {string} URL for first milestone
 */
export function generateGoogleCalendarBatchUrl(milestones, options) {
    if (milestones.length === 0) return '';
    return generateGoogleCalendarUrl(milestones[0], options);
}

// ═══════════════════════════════════════════════
// DOWNLOAD HELPERS
// ═══════════════════════════════════════════════

/**
 * Trigger ICS file download in the browser.
 * 
 * @param {string} icsContent - from generateIcsCalendar
 * @param {string} [filename='lich-kham-thai-an-sinh.ics']
 */
export function downloadIcsFile(icsContent, filename = 'lich-kham-thai-an-sinh.ics') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Detect platform and open calendar appropriately.
 * - iOS: Download .ics (opens in Apple Calendar)
 * - Android: Open Google Calendar URL or download .ics
 * - Desktop: Download .ics
 * 
 * @param {Array<Object>} milestones
 * @param {Object} options
 */
export function saveToCalendar(milestones, options) {
    const icsContent = generateIcsCalendar(milestones, options);

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /android/i.test(ua);

    if (isAndroid) {
        // Android: Try Google Calendar URL for first event, download ICS for all
        if (milestones.length === 1) {
            window.open(generateGoogleCalendarUrl(milestones[0], options), '_blank');
        } else {
            downloadIcsFile(icsContent);
        }
    } else {
        // iOS, macOS, Windows: Download .ics file
        downloadIcsFile(icsContent);
    }
}

// ═══════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════

export {
    PRENATAL_MILESTONES,
    TIER_CONFIG,
    TIME_SLOTS,
    CLINIC_NAME,
    CLINIC_ADDRESS,
    CLINIC_PHONE,
    toLocalDate,
    addDays,
    calcGestationalAge,
};
