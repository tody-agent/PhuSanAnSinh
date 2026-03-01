/**
 * Preterm Birth Risk Calculator
 * Based on: FMF (To et al. 2006) & QUiPP-style estimation
 * Pure functions — no side effects
 */

// ─── FMF Model — Step 1: P(PTB < 37 weeks) ─────────────────

/**
 * Calculates Q = probability of spontaneous preterm birth < 37 weeks
 * Using logistic regression from To et al. 2006 (Table 2)
 * @param {Object} inputs
 * @returns {number} Q in [0,1]
 */
export function calcFmfProbPtb37(inputs) {
    const { maternalAge, ethnicity, bmi, smoker, obstetricHistory, cervicalSurgery, cervicalLength } = inputs;

    // Ethnicity coefficients
    const ethCoeff = (ethnicity === 'african-caribbean' || ethnicity === 'asian' || ethnicity === 'other') ? 0.219 : 0;

    // Obstetric history coefficients
    const obsCoeffMap = {
        'nullipara': 0,           // reference: nullipara or only miscarriage < 16wk
        'all_term': -0.344,       // all prior deliveries >= 37wk
        'delivery_33_36': 0.919,  // >=1 delivery at 33-36+6 wk
        'delivery_24_32': 1.296,  // >=1 delivery at 24-32+6 wk
        'delivery_16_23': 0.796,  // >=1 delivery at 16-23+6 wk
    };
    const obsCoeff = obsCoeffMap[obstetricHistory] ?? 0;

    // BMI contribution: 200.6 × (1/BMI) - 87.5 × (1/BMI) × ln(BMI)
    const invBmi = 1 / bmi;
    const bmiContrib = 200.6 * invBmi - 87.5 * invBmi * Math.log(bmi);

    // CL contribution: 5.00 × exp(-0.05 × CL)
    const clContrib = 5.00 * Math.exp(-0.05 * cervicalLength);

    const logitQ = -1.031
        + 0.0096 * maternalAge
        + ethCoeff
        + bmiContrib
        + (smoker ? 0.371 : 0)
        + obsCoeff
        + (cervicalSurgery ? 0.332 : 0)
        + clContrib;

    return 1 / (1 + Math.exp(-logitQ));
}

// ─── FMF Model — Step 2: P(PTB < X weeks | PTB) ────────────

/**
 * Quadratic coefficient tables from To et al. 2006 (Table 3)
 * β(X) = constant + linear × (X-32) + quadratic × (X-32)²
 */
const FMF_COEFFICIENTS = {
    intercept: { constant: -4.5572, linear: 0.476371, quadratic: 0.059861 },
    ageInv2: { constant: 0.5254, linear: -0.007444, quadratic: -0.014886 },
    delivery_16_23: { constant: 0.5544, linear: -0.026112, quadratic: -0.030793 },
    delivery_24_32: { constant: 1.5015, linear: -0.044014, quadratic: -0.039841 },
    delivery_33_36: { constant: 0.1770, linear: 0.133579, quadratic: -0.017738 },
    all_term: { constant: 0.2490, linear: 0.02056, quadratic: -0.026021 },
    clExp: { constant: 5.0147, linear: -0.281457, quadratic: -0.010549 },
};

function betaAtX(coeffSet, x) {
    const d = x - 32;
    return coeffSet.constant + coeffSet.linear * d + coeffSet.quadratic * d * d;
}

/**
 * Conditional probability: P(PTB < X weeks | PTB)
 * @param {Object} inputs - { maternalAge, obstetricHistory, cervicalLength }
 * @param {number} targetWeek - target gestational week (e.g. 32, 34, 37)
 * @returns {number} P(X) in [0,1]
 */
export function calcFmfCondProb(inputs, targetWeek) {
    const { maternalAge, obstetricHistory, cervicalLength } = inputs;
    const x = targetWeek;

    const ageInv2 = Math.pow(maternalAge / 30, -2);
    const clExp = Math.exp(-0.05 * cervicalLength);

    let logitP = betaAtX(FMF_COEFFICIENTS.intercept, x)
        + ageInv2 * betaAtX(FMF_COEFFICIENTS.ageInv2, x)
        + clExp * betaAtX(FMF_COEFFICIENTS.clExp, x);

    // Obstetric history dummies
    if (obstetricHistory === 'delivery_16_23') {
        logitP += betaAtX(FMF_COEFFICIENTS.delivery_16_23, x);
    } else if (obstetricHistory === 'delivery_24_32') {
        logitP += betaAtX(FMF_COEFFICIENTS.delivery_24_32, x);
    } else if (obstetricHistory === 'delivery_33_36') {
        logitP += betaAtX(FMF_COEFFICIENTS.delivery_33_36, x);
    } else if (obstetricHistory === 'all_term') {
        logitP += betaAtX(FMF_COEFFICIENTS.all_term, x);
    }
    // nullipara = reference = 0

    return 1 / (1 + Math.exp(-logitP));
}

// ─── FMF Combined Risk ─────────────────────────────────────

/**
 * Combined FMF risk: P(sPTB < X) = P(X|PTB) × Q
 * @param {Object} inputs - full FMF input object
 * @returns {Object} { Q, riskBelow32, riskBelow34, riskBelow37 }
 */
export function calcFmfRisk(inputs) {
    const Q = calcFmfProbPtb37(inputs);
    const condInputs = {
        maternalAge: inputs.maternalAge,
        obstetricHistory: inputs.obstetricHistory,
        cervicalLength: inputs.cervicalLength,
    };

    return {
        Q,
        riskBelow32: calcFmfCondProb(condInputs, 32) * Q,
        riskBelow34: calcFmfCondProb(condInputs, 34) * Q,
        riskBelow37: calcFmfCondProb(condInputs, 37) * Q,
    };
}

// ─── Integrated Risk Stratification ─────────────────────────

/**
 * 5-level risk stratification based on CL, fFN, and history
 * @param {Object} params - { cl, ffn, hasRiskFactor, hasPreviousPtb32 }
 * @returns {Object} { level, label, color, reason }
 */
export function stratifyRisk({ cl, ffn, hasRiskFactor, hasPreviousPtb32 }) {
    const hasCL = cl !== null && cl !== undefined;
    const hasFFN = ffn !== null && ffn !== undefined;

    // VERY_HIGH checks
    if ((hasCL && cl < 10) ||
        (hasFFN && ffn >= 500) ||
        (hasCL && cl < 15 && hasFFN && ffn >= 200 && hasPreviousPtb32)) {
        return { level: 'VERY_HIGH', label: '🔴⚠️ RẤT CAO', color: 'red-urgent', reason: buildReason(cl, ffn, hasPreviousPtb32) };
    }

    // HIGH checks
    if ((hasCL && cl < 15) ||
        (hasFFN && ffn >= 200 && ffn < 500) ||
        (hasCL && cl < 25 && hasPreviousPtb32) ||
        (hasCL && cl < 20 && hasFFN && ffn >= 50 && hasRiskFactor)) {
        return { level: 'HIGH', label: '🔴 CAO', color: 'red', reason: buildReason(cl, ffn, hasPreviousPtb32) };
    }

    // MODERATE checks
    if ((hasCL && cl >= 15 && cl < 25) ||
        (hasFFN && ffn >= 50 && ffn < 200) ||
        (hasRiskFactor && ((hasCL && cl < 30) || (hasFFN && ffn >= 10)))) {
        return { level: 'MODERATE', label: '🟠 TRUNG BÌNH', color: 'orange', reason: buildReason(cl, ffn, hasPreviousPtb32) };
    }

    // LOW checks
    if ((hasCL && cl >= 25 && cl < 30) ||
        (hasFFN && ffn >= 10 && ffn < 50)) {
        return { level: 'LOW', label: '🟡 THẤP', color: 'yellow', reason: buildReason(cl, ffn, hasPreviousPtb32) };
    }

    // VERY_LOW — default
    return { level: 'VERY_LOW', label: '🟢 RẤT THẤP', color: 'green', reason: 'Không có yếu tố nguy cơ đáng kể' };
}

function buildReason(cl, ffn, hasPreviousPtb32) {
    const parts = [];
    if (cl !== null && cl !== undefined) parts.push(`CL = ${cl}mm`);
    if (ffn !== null && ffn !== undefined) parts.push(`fFN = ${ffn} ng/mL`);
    if (hasPreviousPtb32) parts.push('tiền sử sinh non < 32 tuần');
    return parts.join(' + ') || 'Dựa trên thông tin lâm sàng';
}

// ─── QUiPP-style Risk Estimation ────────────────────────────

/**
 * Estimates QUiPP-style risk percentages using clinically-informed
 * lookup approach (exact coefficients are unpublished).
 * @param {Object} params
 * @returns {Object} { risk7d, risk14d, risk28d, actionLevel }
 */
export function estimateQuippRisk({ gaWeeks, gaDays, cl, ffn, hasRiskFactor, symptomatic }) {
    // Base risk from CL
    let clRisk = 0;
    if (cl !== null && cl !== undefined) {
        if (cl < 10) clRisk = 35;
        else if (cl < 15) clRisk = 20;
        else if (cl < 20) clRisk = 12;
        else if (cl < 25) clRisk = 6;
        else if (cl < 30) clRisk = 3;
        else clRisk = 0.5;
    }

    // Risk from fFN
    let ffnRisk = 0;
    if (ffn !== null && ffn !== undefined) {
        if (ffn >= 500) ffnRisk = 40;
        else if (ffn >= 200) ffnRisk = 25;
        else if (ffn >= 50) ffnRisk = 10;
        else if (ffn >= 10) ffnRisk = 3;
        else ffnRisk = 0.3;
    }

    // Combined risk (weighted)
    const hasCL = cl !== null && cl !== undefined;
    const hasFFN = ffn !== null && ffn !== undefined;

    let baseRisk7d;
    if (hasCL && hasFFN) {
        baseRisk7d = Math.max(clRisk, ffnRisk) * 0.7 + Math.min(clRisk, ffnRisk) * 0.3;
    } else if (hasCL) {
        baseRisk7d = clRisk;
    } else if (hasFFN) {
        baseRisk7d = ffnRisk;
    } else {
        baseRisk7d = hasRiskFactor ? 5 : 1;
    }

    // Modifiers
    if (hasRiskFactor) baseRisk7d *= 1.3;
    if (symptomatic) baseRisk7d *= 1.2;

    // Earlier GA → slightly higher risk per time window
    const gaFactor = gaWeeks < 28 ? 1.1 : gaWeeks < 32 ? 1.0 : 0.9;
    baseRisk7d *= gaFactor;

    // Cap at 95%
    const risk7d = Math.min(Math.round(baseRisk7d * 10) / 10, 95);
    const risk14d = Math.min(Math.round(risk7d * 1.5 * 10) / 10, 95);
    const risk28d = Math.min(Math.round(risk7d * 2.2 * 10) / 10, 95);

    // Action level based on 7-day risk
    let actionLevel;
    if (risk7d < 1) actionLevel = 'Rất thấp';
    else if (risk7d < 5) actionLevel = 'Thấp';
    else if (risk7d < 10) actionLevel = 'Trung bình (ngưỡng hành động)';
    else if (risk7d < 25) actionLevel = 'Cao';
    else actionLevel = 'Rất cao';

    return { risk7d, risk14d, risk28d, actionLevel };
}

// ─── Prompt Builder ─────────────────────────────────────────

const ETHNICITY_MAP = {
    'caucasian': 'Caucasian',
    'african-caribbean': 'African-Caribbean',
    'asian': 'Asian',
    'other': 'Khác',
};

const ASSESSMENT_MAP = {
    'symptomatic': 'CÓ TRIỆU CHỨNG',
    'asymptomatic': 'KHÔNG TRIỆU CHỨNG',
};

const TESTS_MAP = {
    'cl_only': 'Chỉ CL',
    'ffn_only': 'Chỉ fFN',
    'cl_ffn': 'CL + fFN',
    'none': 'Không có',
};

/**
 * Generates structured prompt for AI analysis
 * @param {Object} formData
 * @param {Object} riskResults
 * @returns {string} prompt text
 */
export function buildPrompt(formData, riskResults) {
    const fd = formData;
    const fmf = riskResults.fmf;
    const quipp = riskResults.quipp;
    const strat = riskResults.stratification;

    return `Bạn là một chuyên gia y khoa sản khoa (Maternal-Fetal Medicine specialist) với kinh nghiệm sâu về dự đoán và quản lý sinh non.

Hãy phân tích trường hợp lâm sàng sau và cung cấp gợi ý lâm sàng chi tiết.

═══════════════════════════════════════════
THÔNG TIN BỆNH NHÂN — DỰ ĐOÁN SINH NON
═══════════════════════════════════════════

■ LOẠI ĐÁNH GIÁ: ${ASSESSMENT_MAP[fd.assessmentType] || fd.assessmentType}
■ TUỔI THAI HIỆN TẠI: ${fd.gaWeeks} tuần + ${fd.gaDays} ngày
■ TUỔI MẸ: ${fd.maternalAge} tuổi
■ DÂN TỘC: ${ETHNICITY_MAP[fd.ethnicity] || fd.ethnicity || 'N/A'}
■ BMI: ${fd.bmi || 'N/A'} kg/m²
■ HÚT THUỐC: ${fd.smoker ? 'Có' : 'Không'}
■ SỐ THAI: ${fd.fetusCount === 1 ? 'Đơn thai' : 'Song thai'}

■ TIỀN SỬ SẢN KHOA:
  - Sinh non tự phát trước đây: ${fd.previousPtb ? 'CÓ' : 'Không'} ${fd.previousPtb && fd.earliestPtbWeek ? `→ tuổi thai sớm nhất: ${fd.earliestPtbWeek} tuần` : ''}
  - PPROM trước đây: ${fd.previousPprom ? 'Có' : 'Không'}
  - Sẩy thai muộn (16–24 tuần): ${fd.lateMiscarriage ? 'Có' : 'Không'}
  - Phẫu thuật CTC (LEEP/cone): ${fd.cervicalSurgery ? 'Có' : 'Không'}
  - Cerclage hiện tại: ${fd.cerclage ? 'Có' : 'Không'}
  - Progesterone dự phòng: ${fd.progesterone ? 'Có' : 'Không'}

■ KẾT QUẢ XÉT NGHIỆM:
  - Chiều dài CTC (CL): ${fd.cervicalLength != null ? fd.cervicalLength + ' mm' : 'Không có'}
  - Fetal Fibronectin (qfFN): ${fd.ffn != null ? fd.ffn + ' ng/mL' : 'Không có'}
  - Xét nghiệm khả dụng: ${TESTS_MAP[fd.availableTests] || fd.availableTests || 'N/A'}

═══════════════════════════════════════════
KẾT QUẢ PHÂN TÍCH NGUY CƠ (đã tính toán)
═══════════════════════════════════════════

► MÔ HÌNH QUiPP-STYLE:
  - Nguy cơ sinh trong 7 ngày: ${quipp.risk7d}%
  - Nguy cơ sinh trong 14 ngày: ${quipp.risk14d}%
  - Nguy cơ sinh trong 28 ngày: ${quipp.risk28d}%
  - Mức hành động lâm sàng: ${quipp.actionLevel}

► MÔ HÌNH FMF-STYLE:${fmf ? `
  - Prob sinh non < 37 tuần (Q): ${(fmf.Q * 100).toFixed(1)}%
  - Prob sinh non < 34 tuần: ${(fmf.riskBelow34 * 100).toFixed(1)}%
  - Prob sinh non < 32 tuần: ${(fmf.riskBelow32 * 100).toFixed(1)}%` : '\n  - Không đủ dữ liệu (cần CL ở 20-26 tuần)'}

► PHÂN TẦNG NGUY CƠ TỔNG HỢP: ${strat.label}
  Lý do: ${strat.reason}

═══════════════════════════════════════════
YÊU CẦU PHÂN TÍCH
═══════════════════════════════════════════

Dựa trên dữ liệu trên, hãy cung cấp:

1. ĐÁNH GIÁ TỔNG QUAN: Nhận xét mức nguy cơ, các yếu tố chính đóng góp vào nguy cơ, so sánh với quần thể chung.

2. QUẢN LÝ ĐỀ XUẤT:
   a) Nhập viện hay theo dõi ngoại trú?
   b) Corticosteroid (betamethasone/dexamethasone): Có chỉ định không? Thời điểm?
   c) Tocolytic: Loại nào? Có chỉ định không?
   d) MgSO4 bảo vệ thần kinh: Có chỉ định không? (nếu <30 tuần)
   e) Chuyển tuyến (in-utero transfer): Cần không? Cấp NICU nào?
   f) Kháng sinh dự phòng GBS?

3. KẾ HOẠCH THEO DÕI:
   a) Tần suất đo CL tiếp theo?
   b) Khi nào lặp lại fFN?
   c) Monitoring thai: NST/CTG tần suất?
   d) Dấu hiệu cần tái đánh giá khẩn?

4. CAN THIỆP DỰ PHÒNG:
   a) Progesterone (vaginal/IM): chỉ định và liều?
   b) Cerclage: có chỉ định không?
   c) Pessary: có phù hợp không?

5. THAM VẤN BỆNH NHÂN: Gợi ý cách truyền đạt nguy cơ cho bệnh nhân một cách dễ hiểu và trấn an phù hợp.

6. BẰNG CHỨNG & GUIDELINE: Trích dẫn guideline liên quan (NICE, ACOG, RCOG, FIGO, WHO) hỗ trợ cho các khuyến cáo.

Lưu ý: Đây là gợi ý hỗ trợ quyết định lâm sàng, KHÔNG thay thế phán đoán của bác sĩ điều trị. Mọi quyết định cần dựa trên bối cảnh lâm sàng cụ thể và nguồn lực sẵn có.`;
}

// ─── Validation ─────────────────────────────────────────────

/**
 * Validates preterm birth calculator inputs
 * @param {Object} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePretermInputs(data) {
    const { gaWeeks, gaDays, assessmentType, cervicalLength, ffn, maternalAge, bmi } = data;

    if (gaWeeks == null || gaWeeks < 18 || gaWeeks > 36 || (gaWeeks === 36 && (gaDays || 0) > 6)) {
        return { valid: false, error: 'Vui lòng nhập tuổi thai hợp lệ (18+0 đến 36+6 tuần).' };
    }

    if (!assessmentType) {
        return { valid: false, error: 'Vui lòng chọn loại đánh giá.' };
    }

    if (cervicalLength != null && (cervicalLength < 0 || cervicalLength > 80)) {
        return { valid: false, error: 'Chiều dài CTC phải từ 0 đến 80 mm.' };
    }

    if (ffn != null && (ffn < 0 || ffn > 500)) {
        return { valid: false, error: 'Nồng độ fFN phải từ 0 đến 500 ng/mL.' };
    }

    if (maternalAge != null && (maternalAge < 14 || maternalAge > 60)) {
        return { valid: false, error: 'Tuổi mẹ phải từ 14 đến 60.' };
    }

    if (bmi != null && (bmi < 12 || bmi > 70)) {
        return { valid: false, error: 'BMI phải từ 12 đến 70.' };
    }

    return { valid: true };
}

// ─── Utility ────────────────────────────────────────────────

export function formatGaText(weeks, days) {
    return `${weeks} tuần + ${days} ngày`;
}

export function parseGa(weeks, days) {
    return {
        weeks,
        days,
        totalDays: weeks * 7 + days,
    };
}
