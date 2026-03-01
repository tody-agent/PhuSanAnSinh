/**
 * Preeclampsia Risk Screening Engine
 * Deterministic classification based on:
 *   - ACOG/USPSTF 2021 (Practice Advisory 12/2021, Reaffirmed 10/2022)
 *   - NICE NG133 (06/2019, Amended 2023)
 *
 * Zero external dependencies. All logic runs client-side.
 */

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const WARNING_SIGNS = [
    'Đau đầu dữ dội không giảm khi dùng thuốc',
    'Nhìn mờ, thấy đốm sáng hoặc mất thị lực thoáng qua',
    'Đau thượng vị hoặc hạ sườn phải dữ dội',
    'Nôn ói (sau tam cá nguyệt I)',
    'Phù mặt, tay hoặc chân đột ngột',
    'Khó thở hoặc tức ngực',
    'Giảm lượng nước tiểu đột ngột',
];

// ═══════════════════════════════════════════════════════════════
// C1. PREPROCESS
// ═══════════════════════════════════════════════════════════════

/**
 * Auto-calculate derived fields (BMI, age flags)
 * Mutates patient in-place and returns it.
 * @param {object} patient
 * @returns {object} patient with computed fields
 */
export function preprocess(patient) {
    // BMI
    if (patient.height_cm && patient.weight_kg) {
        const hm = patient.height_cm / 100;
        patient.bmi = Math.round((patient.weight_kg / (hm * hm)) * 10) / 10;
    }

    // Age flags
    patient.moderate_risk.age_gte_35 =
        patient.maternal_age != null && patient.maternal_age >= 35;
    patient.moderate_risk.age_gte_40 =
        patient.maternal_age != null && patient.maternal_age >= 40;

    // BMI flags
    patient.moderate_risk.bmi_gt_30 =
        patient.bmi != null && patient.bmi > 30;
    patient.moderate_risk.bmi_gte_35 =
        patient.bmi != null && patient.bmi >= 35;

    return patient;
}

// ═══════════════════════════════════════════════════════════════
// C2. ACOG / USPSTF 2021
// ═══════════════════════════════════════════════════════════════

/**
 * Classify risk per ACOG/USPSTF 2021
 * @param {object} patient (preprocessed)
 * @returns {{ category: string, high_factors: string[], moderate_factors: string[], aspirin: boolean|string }}
 */
export function classifyACOG(patient) {
    const hr = patient.high_risk;
    const mr = patient.moderate_risk;

    // Group A — HIGH risk factors
    const high_factors = [];
    if (hr.history_preeclampsia) high_factors.push('Tiền sử tiền sản giật');
    if (hr.multifetal) high_factors.push('Đa thai');
    if (hr.chronic_hypertension) high_factors.push('Tăng huyết áp mạn');
    if (hr.pregestational_diabetes) high_factors.push('ĐTĐ type 1/2');
    if (hr.chronic_kidney_disease) high_factors.push('Bệnh thận mạn');
    if (hr.autoimmune_disease) high_factors.push('Bệnh tự miễn (SLE/APS)');

    // Group B — MODERATE risk factors
    const mod_factors = [];
    if (mr.nulliparity) mod_factors.push('Con so');
    if (mr.age_gte_35) mod_factors.push(`Tuổi ≥35${patient.maternal_age ? ' (' + patient.maternal_age + ' tuổi)' : ''}`);
    if (mr.bmi_gt_30) mod_factors.push(`BMI >30${patient.bmi ? ' (' + patient.bmi + ')' : ''}`);
    if (mr.family_history_pe) mod_factors.push('Gia đình có PE');
    if (mr.interpregnancy_gt_10y) mod_factors.push('Khoảng cách >10 năm');
    if (mr.ivf) mod_factors.push('IVF');
    if (mr.previous_adverse_outcome) mod_factors.push('Tiền sử kết cục bất lợi');
    if (mr.low_income) mod_factors.push('Thu nhập thấp');

    // Classification
    let category, aspirin;
    if (high_factors.length >= 1) {
        category = 'HIGH';
        aspirin = true;
    } else if (mod_factors.length >= 2) {
        category = 'HIGH';
        aspirin = true;
    } else if (mod_factors.length === 1) {
        category = 'MODERATE';
        // Only "CONSIDER" if it's low_income alone
        aspirin = mr.low_income ? 'CONSIDER' : false;
    } else {
        category = 'LOW';
        aspirin = false;
    }

    return { category, high_factors, moderate_factors: mod_factors, aspirin };
}

// ═══════════════════════════════════════════════════════════════
// C3. NICE NG133
// ═══════════════════════════════════════════════════════════════

/**
 * Classify risk per NICE NG133 2019
 * Key differences from ACOG: age≥40, BMI≥35, multifetal=moderate, no IVF
 * @param {object} patient (preprocessed)
 * @returns {{ category: string, high_factors: string[], moderate_factors: string[], aspirin: boolean }}
 */
export function classifyNICE(patient) {
    const hr = patient.high_risk;
    const mr = patient.moderate_risk;

    const nice_high = [];
    if (hr.history_preeclampsia) nice_high.push('Tiền sử THA thai kỳ');
    if (hr.chronic_kidney_disease) nice_high.push('Bệnh thận mạn');
    if (hr.autoimmune_disease) nice_high.push('Bệnh tự miễn (SLE/APS)');
    if (hr.pregestational_diabetes) nice_high.push('ĐTĐ type 1/2');
    if (hr.chronic_hypertension) nice_high.push('Tăng huyết áp mạn');
    // NICE does NOT include multifetal in high

    const nice_mod = [];
    if (mr.nulliparity) nice_mod.push('Con so');
    if (mr.age_gte_40) nice_mod.push(`Tuổi ≥40${patient.maternal_age ? ' (' + patient.maternal_age + ' tuổi)' : ''}`);
    if (mr.interpregnancy_gt_10y) nice_mod.push('Khoảng cách >10 năm');
    if (mr.bmi_gte_35) nice_mod.push(`BMI ≥35${patient.bmi ? ' (' + patient.bmi + ')' : ''}`);
    if (mr.family_history_pe) nice_mod.push('Gia đình có PE');
    if (hr.multifetal) nice_mod.push('Đa thai'); // NICE puts multifetal in moderate
    // NICE does NOT count IVF, low_income, previous_adverse_outcome

    let category, aspirin;
    if (nice_high.length >= 1) {
        category = 'HIGH';
        aspirin = true;
    } else if (nice_mod.length >= 2) {
        category = 'HIGH';
        aspirin = true;
    } else if (nice_mod.length === 1) {
        category = 'MODERATE';
        aspirin = false;
    } else {
        category = 'LOW';
        aspirin = false;
    }

    return { category, high_factors: nice_high, moderate_factors: nice_mod, aspirin };
}

// ═══════════════════════════════════════════════════════════════
// C4. CONCORDANCE
// ═══════════════════════════════════════════════════════════════

/**
 * Check if ACOG and NICE agree on aspirin recommendation
 * @param {object} acog - result from classifyACOG
 * @param {object} nice - result from classifyNICE
 * @param {object} patient
 * @returns {{ agree: boolean, reasons: string[] }}
 */
export function checkConcordance(acog, nice, patient) {
    const agree = (acog.aspirin === true) === (nice.aspirin === true);
    const reasons = [];

    if (patient.maternal_age != null) {
        if (patient.maternal_age >= 35 && patient.maternal_age < 40) {
            reasons.push(`Tuổi ${patient.maternal_age}: ACOG tính (≥35), NICE không (cần ≥40)`);
        }
    }

    if (patient.bmi != null) {
        if (patient.bmi > 30 && patient.bmi < 35) {
            reasons.push(`BMI ${patient.bmi}: ACOG tính (>30), NICE không (cần ≥35)`);
        }
    }

    if (patient.moderate_risk.ivf) {
        reasons.push('IVF: ACOG tính moderate risk, NICE không liệt kê');
    }

    if (patient.high_risk.multifetal) {
        // Check if multifetal is the only high-risk factor for ACOG
        const otherHigh = acog.high_factors.filter(f => f !== 'Đa thai');
        if (otherHigh.length === 0) {
            reasons.push('Đa thai: ACOG = cao, NICE = trung bình');
        }
    }

    return { agree, reasons };
}

// ═══════════════════════════════════════════════════════════════
// C5. ASPIRIN TIMING
// ═══════════════════════════════════════════════════════════════

/**
 * Determine aspirin urgency based on gestational age
 * @param {number|null} gaWeeks
 * @param {boolean|string} aspirinRecommended
 * @returns {{ urgency: string, text: string }|null}
 */
export function aspirinTiming(gaWeeks, aspirinRecommended) {
    if (!aspirinRecommended || aspirinRecommended === false) return null;

    if (gaWeeks == null) {
        return {
            urgency: 'PENDING',
            text: 'Cần xác định tuổi thai để khuyến cáo thời điểm.',
        };
    }

    if (gaWeeks < 12) {
        return {
            urgency: 'PENDING',
            text: 'Chờ đến tuần 12 để bắt đầu.',
        };
    }

    if (gaWeeks >= 12 && gaWeeks < 16) {
        return {
            urgency: 'OPTIMAL',
            text: 'BẮT ĐẦU NGAY — cửa sổ tối ưu 12–16 tuần.',
        };
    }

    if (gaWeeks >= 16 && gaWeeks <= 28) {
        return {
            urgency: 'LATE_BUT_BENEFICIAL',
            text: 'Bắt đầu ngay dù đã qua 16 tuần. Vẫn có lợi đến 28 tuần.',
        };
    }

    if (gaWeeks > 28 && gaWeeks <= 36) {
        return {
            urgency: 'QUESTIONABLE',
            text: 'Ngoài cửa sổ khuyến cáo ACOG. Cân nhắc lâm sàng.',
        };
    }

    return {
        urgency: 'DO_NOT_START',
        text: 'Không bắt đầu — thai >36 tuần.',
    };
}

// ═══════════════════════════════════════════════════════════════
// C6. FOLLOW-UP & WARNING
// ═══════════════════════════════════════════════════════════════

/**
 * Generate follow-up items based on risk category
 * @param {string} category - "HIGH" | "MODERATE" | "LOW"
 * @returns {string[]}
 */
export function getFollowUp(category) {
    if (category === 'HIGH') {
        return [
            'Đo HA mỗi lần khám (cả 2 tay nếu có thể)',
            'Protein niệu (dipstick) mỗi lần khám',
            'Hỏi triệu chứng cảnh báo mỗi lần khám',
            'CTM + chức năng gan thận khi có chỉ định',
            'Siêu âm tăng trưởng + Doppler ĐM rốn: tuần 28, 32, 36',
            'Kiểm tra tuân thủ aspirin mỗi lần khám',
            'Dừng aspirin ở tuần 36',
        ];
    }
    if (category === 'MODERATE') {
        return [
            'Đo HA mỗi lần khám',
            'Protein niệu nếu HA ≥140/90',
            'Tái đánh giá nếu xuất hiện yếu tố mới',
            'Dặn dò triệu chứng cảnh báo',
        ];
    }
    return [
        'Đo HA theo lịch khám thường quy',
        'Dặn dò triệu chứng cảnh báo',
    ];
}

// ═══════════════════════════════════════════════════════════════
// FULL SCREENING PIPELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run the complete screening pipeline
 * @param {object} patient - raw patient data
 * @returns {object} complete result object
 */
export function screenPatient(patient) {
    preprocess(patient);

    const acog = classifyACOG(patient);
    const nice = classifyNICE(patient);
    const concordance = checkConcordance(acog, nice, patient);

    // Use ACOG aspirin recommendation as primary
    const aspirinRec = acog.aspirin;
    const gaWeeks = patient.gestational_age_weeks;
    const timing = aspirinTiming(gaWeeks, aspirinRec);

    // Use the higher risk category for follow-up
    const highestCategory = acog.category === 'HIGH' || nice.category === 'HIGH'
        ? 'HIGH'
        : acog.category === 'MODERATE' || nice.category === 'MODERATE'
            ? 'MODERATE'
            : 'LOW';

    return {
        acog_category: acog.category,
        acog_high_factors: acog.high_factors,
        acog_moderate_factors: acog.moderate_factors,
        acog_aspirin: acog.aspirin,

        nice_category: nice.category,
        nice_high_factors: nice.high_factors,
        nice_moderate_factors: nice.moderate_factors,
        nice_aspirin: nice.aspirin,

        guidelines_agree: concordance.agree,
        discordance_reasons: concordance.reasons,

        aspirin_dose: aspirinRec ? '81–150 mg/ngày' : null,
        aspirin_timing: timing ? timing.text : null,
        aspirin_urgency: timing ? timing.urgency : null,

        follow_up_items: getFollowUp(highestCategory),
        warning_signs: WARNING_SIGNS,
    };
}

/**
 * Create an empty patient object with defaults
 * @returns {object}
 */
export function createEmptyPatient() {
    return {
        name: '',
        maternal_age: null,
        gestational_age_weeks: null,
        gestational_age_days: null,
        height_cm: null,
        weight_kg: null,
        bmi: null,
        high_risk: {
            history_preeclampsia: false,
            pe_with_adverse_outcome: false,
            multifetal: false,
            chronic_hypertension: false,
            pregestational_diabetes: false,
            chronic_kidney_disease: false,
            autoimmune_disease: false,
            autoimmune_type: null,
        },
        moderate_risk: {
            nulliparity: false,
            age_gte_35: false,
            age_gte_40: false,
            bmi_gt_30: false,
            bmi_gte_35: false,
            family_history_pe: false,
            interpregnancy_gt_10y: false,
            ivf: false,
            previous_adverse_outcome: false,
            low_income: false,
        },
    };
}
