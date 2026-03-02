/**
 * Ovarian Tumor Malignancy Risk Assessment Engine
 * Deterministic calculation based on:
 *   - RMI 1 (Jacobs 1990)
 *   - RMI 2 (Tingulstad 1996)
 *   - RMI 3 (Tingulstad 1999)
 *   - RMI 4 (Yamamoto 2009)
 *   - ROMA (Moore et al. 2009, FDA 510(k) K110433)
 *
 * Zero external dependencies. All logic runs client-side.
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const US_FEATURES = [
    { id: 'multilocular', label: 'Nang đa thùy (multilocular cyst)' },
    { id: 'solid', label: 'Thành phần đặc (solid areas)' },
    { id: 'metastases', label: 'Di căn ổ bụng (metastases)' },
    { id: 'ascites', label: 'Dịch ổ bụng / báng bụng (ascites)' },
    { id: 'bilateral', label: 'Tổn thương hai bên (bilateral lesions)' },
];

export const ROMA_CUTOFFS = {
    roche: {
        premenopausal: 11.4,
        postmenopausal: 29.9,
        label: 'Roche Elecsys',
    },
    abbott: {
        premenopausal: 7.4,
        postmenopausal: 25.3,
        label: 'Abbott Architect',
    },
};

export const LIMITATIONS = {
    false_positive: [
        'Lạc nội mạc tử cung',
        'U xơ tử cung',
        'Viêm vùng chậu',
        'Xơ gan / báng bụng',
        'Suy tim sung huyết',
        'Lao phúc mạc',
        'Thai kỳ (đặc biệt tam cá nguyệt 1)',
        'Kinh nguyệt',
    ],
    false_negative: [
        'U nhầy (mucinous)',
        'U tế bào sáng (clear cell) giai đoạn sớm',
        'U tế bào mầm',
        'U mô đệm',
    ],
    roma_exclusions: [
        'Phụ nữ < 18 tuổi',
        'Đang điều trị ung thư',
        'Đã chẩn đoán ung thư trước đó',
    ],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Count ultrasound features (0–5)
 * @param {object} us - ultrasound features object
 * @returns {number}
 */
export function countUSFeatures(us) {
    let score = 0;
    if (us.multilocular) score++;
    if (us.solid) score++;
    if (us.metastases) score++;
    if (us.ascites) score++;
    if (us.bilateral) score++;
    return score;
}

/**
 * Get U score for a given RMI version
 * @param {number} usScore - 0–5
 * @param {number} version - 1, 2, 3, or 4
 * @returns {number}
 */
function getU(usScore, version) {
    if (usScore === 0) {
        return version === 1 ? 0 : 1;
    }
    if (usScore === 1) {
        return 1;
    }
    // usScore >= 2
    return (version === 2 || version === 4) ? 4 : 3;
}

/**
 * Get M score for a given RMI version
 * @param {boolean} postmenopausal
 * @param {number} version - 1, 2, 3, or 4
 * @returns {number}
 */
function getM(postmenopausal, version) {
    if (!postmenopausal) return 1;
    return (version === 2 || version === 4) ? 4 : 3;
}

/**
 * Get S score (only for RMI 4)
 * @param {number|null} sizeCm
 * @returns {number}
 */
function getS(sizeCm) {
    if (sizeCm == null) return 1;
    return sizeCm >= 7 ? 2 : 1;
}

// ═══════════════════════════════════════════════════════════════
// RMI CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate all 4 RMI versions
 * @param {object} data - patient data
 * @returns {object} { rmi1, rmi2, rmi3, rmi4, usScore, details }
 */
export function calculateRMI(data) {
    const usScore = countUSFeatures(data.ultrasound);
    const ca125 = data.ca125 ?? 0;
    const postmeno = data.postmenopausal;

    const details = {};
    const results = {};

    for (const v of [1, 2, 3, 4]) {
        const U = getU(usScore, v);
        const M = getM(postmeno, v);
        const S = v === 4 ? getS(data.tumorSizeCm) : 1;
        const rmi = U * M * S * ca125;

        details[`rmi${v}`] = { U, M, S, value: rmi };
        results[`rmi${v}`] = rmi;
    }

    return { ...results, usScore, details };
}

/**
 * Stratify RMI risk level
 * @param {number} value
 * @param {number} version - 1, 2, 3, or 4
 * @returns {string} 'LOW' | 'MODERATE' | 'HIGH'
 */
export function stratifyRMI(value, version) {
    const highCutoff = version === 4 ? 450 : 200;
    if (value >= highCutoff) return 'HIGH';
    if (value >= 25) return 'MODERATE';
    return 'LOW';
}

// ═══════════════════════════════════════════════════════════════
// ROMA CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate ROMA score
 * @param {object} data - must contain ca125, he4, postmenopausal
 * @returns {{ pi: number, roma: number }|null} null if HE4 not available
 */
export function calculateROMA(data) {
    if (data.he4 == null || data.he4 <= 0) return null;
    if (data.ca125 == null || data.ca125 <= 0) return null;

    const lnHE4 = Math.log(data.he4);
    const lnCA125 = Math.log(data.ca125);

    let pi;
    if (data.postmenopausal) {
        pi = -8.09 + 1.04 * lnHE4 + 0.732 * lnCA125;
    } else {
        pi = -12.0 + 2.38 * lnHE4 + 0.0626 * lnCA125;
    }

    const expPI = Math.exp(pi);
    const roma = (expPI / (1 + expPI)) * 100;

    return {
        pi: Math.round(pi * 1000) / 1000,
        roma: Math.round(roma * 10) / 10,
    };
}

/**
 * Stratify ROMA score
 * @param {number} roma - ROMA percentage
 * @param {boolean} postmenopausal
 * @param {string} system - 'roche' or 'abbott'
 * @returns {{ category: string, cutoff: number }}
 */
export function stratifyROMA(roma, postmenopausal, system = 'roche') {
    const cutoffs = ROMA_CUTOFFS[system] || ROMA_CUTOFFS.roche;
    const cutoff = postmenopausal ? cutoffs.postmenopausal : cutoffs.premenopausal;
    return {
        category: roma >= cutoff ? 'HIGH' : 'LOW',
        cutoff,
    };
}

// ═══════════════════════════════════════════════════════════════
// FULL SCREENING PIPELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run the complete screening pipeline
 * @param {object} data - patient data
 * @returns {object} complete result object
 */
export function screenPatient(data) {
    const rmiResult = calculateRMI(data);
    const romaResult = calculateROMA(data);

    const rmi1Cat = stratifyRMI(rmiResult.rmi1, 1);
    const rmi2Cat = stratifyRMI(rmiResult.rmi2, 2);
    const rmi3Cat = stratifyRMI(rmiResult.rmi3, 3);
    const rmi4Cat = stratifyRMI(rmiResult.rmi4, 4);

    let romaCat = null;
    let romaCutoff = null;
    if (romaResult) {
        const system = data.he4System || 'roche';
        const strat = stratifyROMA(romaResult.roma, data.postmenopausal, system);
        romaCat = strat.category;
        romaCutoff = strat.cutoff;
    }

    // Overall highest risk
    const allCategories = [rmi1Cat, rmi2Cat, rmi3Cat, rmi4Cat];
    if (romaCat) allCategories.push(romaCat);

    const hasHigh = allCategories.includes('HIGH');
    const hasModerate = allCategories.includes('MODERATE');
    const overallRisk = hasHigh ? 'HIGH' : hasModerate ? 'MODERATE' : 'LOW';

    // Check RMI/ROMA discordance
    let discordance = null;
    if (romaCat) {
        const rmi1IsHigh = rmi1Cat === 'HIGH';
        const romaIsHigh = romaCat === 'HIGH';
        if (rmi1IsHigh !== romaIsHigh) {
            discordance = {
                rmi1: rmi1Cat,
                roma: romaCat,
                action: 'Ưu tiên chỉ số CAO hơn. Thêm MRI + ý kiến chuyên gia. Cân nhắc IOTA ADNEX model.',
            };
        }
    }

    // RMI 1 = 0 warning (US_score = 0 in version 1 → U=0 → product = 0)
    const rmi1ZeroWarning = rmiResult.usScore === 0 && rmiResult.rmi1 === 0 && data.ca125 > 0;

    return {
        usScore: rmiResult.usScore,
        rmi1: rmiResult.rmi1,
        rmi2: rmiResult.rmi2,
        rmi3: rmiResult.rmi3,
        rmi4: rmiResult.rmi4,
        rmiDetails: rmiResult.details,
        rmi1Cat,
        rmi2Cat,
        rmi3Cat,
        rmi4Cat,

        roma: romaResult ? romaResult.roma : null,
        pi: romaResult ? romaResult.pi : null,
        romaCat,
        romaCutoff,
        hasHE4: romaResult != null,

        overallRisk,
        discordance,
        rmi1ZeroWarning,
    };
}

/**
 * Get action recommendation based on risk stratification
 * @param {string} overallRisk - 'LOW' | 'MODERATE' | 'HIGH'
 * @returns {object} { label, actions, urgency }
 */
export function getActionPlan(overallRisk) {
    if (overallRisk === 'HIGH') {
        return {
            label: 'Nguy cơ CAO',
            urgency: 'URGENT',
            actions: [
                'Chuyển tuyến NGAY đến bác sĩ ung thư phụ khoa',
                'CT ngực-bụng-chậu cản quang',
                'Xét nghiệm bổ sung: AFP, beta-hCG, LDH, inhibin (nếu nghi u tế bào mầm/mô đệm)',
                'Phẫu thuật phân giai đoạn toàn diện (staging surgery)',
                'Hội chẩn đa chuyên khoa (MDT)',
            ],
        };
    }
    if (overallRisk === 'MODERATE') {
        return {
            label: 'Nguy cơ trung bình',
            urgency: 'SEMI_URGENT',
            actions: [
                'Đánh giá bởi bác sĩ chuyên khoa phụ khoa',
                'Xem xét MRI vùng chậu có cản quang',
                'Cân nhắc phẫu thuật nội soi thăm dò',
                'Lặp lại CA-125 sau 4–6 tuần',
                'Xem xét IOTA ADNEX model nếu có',
            ],
        };
    }
    return {
        label: 'Nguy cơ thấp',
        urgency: 'LOW',
        actions: [
            'Theo dõi siêu âm mỗi 3–6 tháng × 1 năm',
            'Lặp lại CA-125 sau 3 tháng',
            'Nếu ổn định hoặc giảm kích thước → tiếp tục theo dõi',
            'Hẹn tái khám nếu xuất hiện triệu chứng mới',
        ],
    };
}

/**
 * Create an empty patient data object with defaults
 * @returns {object}
 */
export function createEmptyPatient() {
    return {
        age: null,
        postmenopausal: false,
        ca125: null,
        he4: null,
        hasHE4: false,
        he4System: 'roche',
        tumorSizeCm: null,
        ultrasound: {
            multilocular: false,
            solid: false,
            metastases: false,
            ascites: false,
            bilateral: false,
        },
        symptoms: '',
        familyHistory: '',
        otherNotes: '',
    };
}
