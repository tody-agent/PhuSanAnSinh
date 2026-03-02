/**
 * Fetal Doppler & Surveillance Calculator
 * Pure functions — no side effects
 *
 * References:
 *   1. Drukker L et al. INTERGROWTH-21st, Am J Obstet Gynecol 2020;222(6):602.e1-15
 *   2. Mari G et al. N Engl J Med 2000;342:9-14
 *   3. Ciobanu A et al. (FMF) Ultrasound Obstet Gynecol 2019;53:465-472
 *   4. Gómez O et al. Ultrasound Obstet Gynecol 2008;32:128-132
 */

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════

/** Standard normal CDF (Abramowitz & Stegun approximation) */
function normalCDF(z) {
    if (z < -8) return 0;
    if (z > 8) return 1;
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// ═══════════════════════════════════════════════════════════════
// B1. UMBILICAL ARTERY (INTERGROWTH-21st, Drukker 2020)
// ═══════════════════════════════════════════════════════════════

const IG21_PARAMS = {
    PI: {
        lambda: -0.0768617,
        mu: (ga) => 1.02944 + 77.7456 * Math.pow(ga, -2) - 0.000004455 * Math.pow(ga, 3),
        sigma: (ga) => -0.00645693 + 254.885 * Math.log(ga) * Math.pow(ga, -2) - 715.949 * Math.pow(ga, -2),
    },
    RI: {
        lambda: 0.0172944,
        mu: (ga) => 0.674914 + 25.3909 * Math.pow(ga, -2) - 0.0000022523 * Math.pow(ga, 3),
        sigma: (ga) => 0.0375921 + 60.7614 * Math.log(ga) * Math.pow(ga, -2) - 183.336 * Math.pow(ga, -2),
    },
    SD: {
        lambda: -0.2752483,
        mu: (ga) => 2.60358 + 445.991 * Math.pow(ga, -2) - 0.0000108754 * Math.pow(ga, 3),
        sigma: (ga) => -0.503202 + 1268.37 * Math.log(ga) * Math.pow(ga, -2) - 3417.37 * Math.pow(ga, -2),
    },
};

/**
 * Calculate z-score using INTERGROWTH-21st LMS method
 * @param {number} observed - measured value
 * @param {string} index - 'PI' | 'RI' | 'SD'
 * @param {number} gaWeeks - gestational age in weeks
 * @returns {{ z: number, centile: number, median: number, mom: number }}
 */
export function calcIG21(observed, index, gaWeeks) {
    const params = IG21_PARAMS[index];
    if (!params) return null;
    const lambda = params.lambda;
    const mu = params.mu(gaWeeks);
    const sigma = params.sigma(gaWeeks);
    // z = (1/λ) × { exp[(y – μ) × λ / σ] – 1 }
    const z = (1 / lambda) * (Math.exp((observed - mu) * lambda / sigma) - 1);
    const centile = normalCDF(z) * 100;
    const mom = observed / mu;
    return { z: +z.toFixed(2), centile: +centile.toFixed(1), median: +mu.toFixed(3), mom: +mom.toFixed(2) };
}

// ═══════════════════════════════════════════════════════════════
// B2. MCA-PSV (Mari et al. 2000)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate MCA-PSV MoM using Mari formula
 * @param {number} psvObserved - measured PSV in cm/s
 * @param {number} gaWeeks - gestational age in weeks
 * @returns {{ median: number, mom: number, anemiaClass: string }}
 */
export function calcMcaPsv(psvObserved, gaWeeks) {
    const median = Math.exp(2.31 + 0.04643 * gaWeeks);
    const mom = psvObserved / median;
    let anemiaClass;
    if (mom >= 1.5) anemiaClass = 'SEVERE_MODERATE';
    else if (mom >= 1.29) anemiaClass = 'MILD';
    else anemiaClass = 'NORMAL';
    return {
        median: +median.toFixed(2),
        mom: +mom.toFixed(2),
        threshold_1_29: +(median * 1.29).toFixed(2),
        threshold_1_50: +(median * 1.50).toFixed(2),
        anemiaClass,
    };
}

// ═══════════════════════════════════════════════════════════════
// B3. FMF DOPPLER (Ciobanu et al. 2019) — UA-PI, MCA-PI, CPR
// ═══════════════════════════════════════════════════════════════

// Quick-lookup tables from Ciobanu 2019 (GA weeks → values)
const FMF_TABLE = {
    20: { uapi50: 1.218, uapi95: 1.553, mcapi5: 1.162, mcapi50: 1.486, mcapi95: 1.901, cpr5: 0.872, cpr50: 1.212, cpr95: 1.686 },
    24: { uapi50: 1.134, uapi95: 1.446, mcapi5: 1.313, mcapi50: 1.705, mcapi95: 2.075, cpr5: 0.935, cpr50: 1.345, cpr95: 1.819 },
    28: { uapi50: 1.045, uapi95: 1.338, mcapi5: 1.405, mcapi50: 1.813, mcapi95: 2.137, cpr5: 1.059, cpr50: 1.515, cpr95: 2.075 },
    30: { uapi50: 1.000, uapi95: 1.282, mcapi5: 1.424, mcapi50: 1.815, mcapi95: 2.122, cpr5: 1.118, cpr50: 1.600, cpr95: 2.191 },
    32: { uapi50: 0.955, uapi95: 1.229, mcapi5: 1.405, mcapi50: 1.790, mcapi95: 2.092, cpr5: 1.130, cpr50: 1.651, cpr95: 2.272 },
    34: { uapi50: 0.910, uapi95: 1.175, mcapi5: 1.327, mcapi50: 1.700, mcapi95: 2.040, cpr5: 1.059, cpr50: 1.603, cpr95: 2.252 },
    36: { uapi50: 0.864, uapi95: 1.119, mcapi5: 1.163, mcapi50: 1.524, mcapi95: 1.908, cpr5: 0.929, cpr50: 1.456, cpr95: 2.122 },
    38: { uapi50: 0.818, uapi95: 1.062, mcapi5: 0.985, mcapi50: 1.300, mcapi95: 1.700, cpr5: 0.828, cpr50: 1.252, cpr95: 1.919 },
    40: { uapi50: 0.772, uapi95: 1.006, mcapi5: 0.808, mcapi50: 1.086, mcapi95: 1.460, cpr5: 0.687, cpr50: 1.093, cpr95: 1.665 },
    42: { uapi50: 0.725, uapi95: 0.948, mcapi5: 0.639, mcapi50: 0.872, mcapi95: 1.192, cpr5: 0.572, cpr50: 0.901, cpr95: 1.382 },
};

/** Linear interpolation between two FMF table entries */
function interpolateFMF(gaWeeks) {
    const keys = Object.keys(FMF_TABLE).map(Number).sort((a, b) => a - b);
    if (gaWeeks <= keys[0]) return FMF_TABLE[keys[0]];
    if (gaWeeks >= keys[keys.length - 1]) return FMF_TABLE[keys[keys.length - 1]];
    let lo, hi;
    for (let i = 0; i < keys.length - 1; i++) {
        if (gaWeeks >= keys[i] && gaWeeks <= keys[i + 1]) {
            lo = keys[i]; hi = keys[i + 1]; break;
        }
    }
    const t = (gaWeeks - lo) / (hi - lo);
    const result = {};
    for (const key of Object.keys(FMF_TABLE[lo])) {
        result[key] = FMF_TABLE[lo][key] + t * (FMF_TABLE[hi][key] - FMF_TABLE[lo][key]);
    }
    return result;
}

/**
 * Calculate FMF Doppler indices (Ciobanu 2019)
 * @param {number} uaPi - measured UA-PI
 * @param {number} mcaPi - measured MCA-PI
 * @param {number} gaWeeks - gestational age in weeks
 * @returns {object}
 */
export function calcFmfDoppler(uaPi, mcaPi, gaWeeks) {
    const ref = interpolateFMF(gaWeeks);
    const cpr = mcaPi / uaPi;

    const uapiStatus = uaPi > ref.uapi95 ? 'ABNORMAL' : 'NORMAL';
    const mcapiStatus = mcaPi < ref.mcapi5 ? 'ABNORMAL' : 'NORMAL';
    const cprStatus = cpr < ref.cpr5 ? 'ABNORMAL' : 'NORMAL';

    return {
        // UA-PI
        uaPi_measured: +uaPi.toFixed(3),
        uaPi_50th: +ref.uapi50.toFixed(3),
        uaPi_95th: +ref.uapi95.toFixed(3),
        uaPi_status: uapiStatus,
        // MCA-PI
        mcaPi_measured: +mcaPi.toFixed(3),
        mcaPi_5th: +ref.mcapi5.toFixed(3),
        mcaPi_50th: +ref.mcapi50.toFixed(3),
        mcaPi_95th: +ref.mcapi95.toFixed(3),
        mcaPi_status: mcapiStatus,
        // CPR
        cpr: +cpr.toFixed(3),
        cpr_5th: +ref.cpr5.toFixed(3),
        cpr_50th: +ref.cpr50.toFixed(3),
        cpr_95th: +ref.cpr95.toFixed(3),
        cpr_status: cprStatus,
    };
}

// ═══════════════════════════════════════════════════════════════
// B4. UtA-PI (Gómez et al. 2008)
// ═══════════════════════════════════════════════════════════════

const UTA_TABLE = {
    11: { mean: 1.79, p95: 2.70 },
    20: { mean: 1.21, p95: 1.54 },
    24: { mean: 1.04, p95: 1.38 },
    28: { mean: 0.87, p95: 1.17 },
    30: { mean: 0.79, p95: 1.09 },
    32: { mean: 0.74, p95: 1.03 },
    34: { mean: 0.70, p95: 0.99 },
    36: { mean: 0.67, p95: 0.96 },
    38: { mean: 0.64, p95: 0.94 },
    40: { mean: 0.62, p95: 0.92 },
};

function interpolateUtA(gaWeeks) {
    const keys = Object.keys(UTA_TABLE).map(Number).sort((a, b) => a - b);
    if (gaWeeks <= keys[0]) return UTA_TABLE[keys[0]];
    if (gaWeeks >= keys[keys.length - 1]) return UTA_TABLE[keys[keys.length - 1]];
    let lo, hi;
    for (let i = 0; i < keys.length - 1; i++) {
        if (gaWeeks >= keys[i] && gaWeeks <= keys[i + 1]) {
            lo = keys[i]; hi = keys[i + 1]; break;
        }
    }
    const t = (gaWeeks - lo) / (hi - lo);
    return {
        mean: UTA_TABLE[lo].mean + t * (UTA_TABLE[hi].mean - UTA_TABLE[lo].mean),
        p95: UTA_TABLE[lo].p95 + t * (UTA_TABLE[hi].p95 - UTA_TABLE[lo].p95),
    };
}

/**
 * Calculate UtA-PI assessment
 * @param {number} piLeft - left UtA-PI
 * @param {number} piRight - right UtA-PI
 * @param {number} gaWeeks
 * @param {string} notching - 'none' | 'unilateral' | 'bilateral'
 * @returns {object}
 */
export function calcUtaPi(piLeft, piRight, gaWeeks, notching) {
    const piMean = (piLeft + piRight) / 2;
    const ref = interpolateUtA(gaWeeks);
    const status = piMean > ref.p95 ? 'ABNORMAL' : 'NORMAL';
    const mom = piMean / ref.mean;
    const highRisk = status === 'ABNORMAL' && notching === 'bilateral';

    return {
        piMean: +piMean.toFixed(3),
        refMean: +ref.mean.toFixed(3),
        ref95th: +ref.p95.toFixed(3),
        mom: +mom.toFixed(2),
        status,
        notching,
        highRisk,
    };
}

// ═══════════════════════════════════════════════════════════════
// OVERALL ASSESSMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Classify overall Doppler severity
 * @param {object} params
 * @returns {{ severity: string, alerts: string[], fgrStage: string|null }}
 */
export function classifyDoppler({ uaIG21, mcaPsv, fmf, uta, endDiastolic, gaWeeks, clinicalScenario }) {
    const alerts = [];
    let severity = 'NORMAL';

    // End-diastolic flow
    if (endDiastolic === 'REDF') {
        severity = 'CRITICAL';
        alerts.push('REDF — Reversed end-diastolic flow: Rất nghiêm trọng, cân nhắc chấm dứt thai kỳ nếu ≥ 28-30 tuần');
    } else if (endDiastolic === 'AEDF') {
        severity = 'SEVERE';
        alerts.push('AEDF — Absent end-diastolic flow: Nhập viện theo dõi sát, corticosteroid, Doppler hàng ngày');
    }

    // UA-PI (IG21)
    if (uaIG21 && uaIG21.centile > 95) {
        if (severity === 'NORMAL') severity = 'ABNORMAL';
        alerts.push(`UA-PI > 95th centile (${uaIG21.centile}th) → Tăng trở kháng nhau thai`);
    }

    // MCA-PSV anemia
    if (mcaPsv && mcaPsv.anemiaClass === 'SEVERE_MODERATE') {
        if (severity !== 'CRITICAL') severity = 'SEVERE';
        alerts.push(`MCA-PSV MoM ≥ 1.5 (${mcaPsv.mom}) → Thiếu máu thai trung bình-nặng, cân nhắc cordocentesis`);
    } else if (mcaPsv && mcaPsv.anemiaClass === 'MILD') {
        if (severity === 'NORMAL') severity = 'ABNORMAL';
        alerts.push(`MCA-PSV MoM 1.29-1.5 (${mcaPsv.mom}) → Thiếu máu thai nhẹ, theo dõi thêm`);
    }

    // FMF CPR
    if (fmf && fmf.cpr_status === 'ABNORMAL') {
        if (severity === 'NORMAL') severity = 'ABNORMAL';
        alerts.push(`CPR < 5th centile (${fmf.cpr}) → Brain-sparing effect, tái phân bố tuần hoàn`);
    }

    // FMF MCA-PI
    if (fmf && fmf.mcaPi_status === 'ABNORMAL') {
        alerts.push(`MCA-PI < 5th centile → Giãn mạch não bù`);
    }

    // UtA-PI
    if (uta && uta.status === 'ABNORMAL') {
        if (severity === 'NORMAL') severity = 'ABNORMAL';
        alerts.push(`UtA-PI > 95th centile (${uta.piMean}) → Tăng trở kháng tử cung-nhau thai`);
        if (uta.highRisk) {
            alerts.push('UtA-PI bất thường + Notching hai bên → Nguy cơ cao tiền sản giật / FGR');
        }
    }

    // FGR staging
    let fgrStage = null;
    if (clinicalScenario === 'fgr' || clinicalScenario === 'all') {
        if (endDiastolic === 'REDF') {
            fgrStage = gaWeeks < 32 ? 'EARLY_ONSET_STAGE_III' : 'LATE_ONSET_STAGE_III';
        } else if (endDiastolic === 'AEDF') {
            fgrStage = gaWeeks < 32 ? 'EARLY_ONSET_STAGE_II' : 'LATE_ONSET_STAGE_II';
        } else if (uaIG21 && uaIG21.centile > 95) {
            fgrStage = gaWeeks < 32 ? 'EARLY_ONSET_STAGE_I' : 'LATE_ONSET_STAGE_I';
        }
    }

    return { severity, alerts, fgrStage };
}

// ═══════════════════════════════════════════════════════════════
// MANAGEMENT SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

export function getManagement(severity, fgrStage, gaWeeks) {
    const items = [];
    switch (severity) {
        case 'CRITICAL':
            items.push('Nhập viện NGAY, theo dõi liên tục NST/BPP');
            items.push('Cân nhắc chấm dứt thai kỳ khẩn nếu thai ≥ 28 tuần');
            if (gaWeeks < 34) items.push('Corticosteroid trưởng thành phổi nếu chưa dùng');
            items.push('Doppler ductus venosus + NST 2-3 lần/ngày');
            items.push('Hội chẩn với chuyên gia Y học bào thai');
            break;
        case 'SEVERE':
            items.push('Nhập viện theo dõi sát');
            items.push('Doppler hàng ngày (UA + MCA + DV)');
            items.push('NST 2 lần/ngày, BPP hàng ngày');
            if (gaWeeks < 34) items.push('Corticosteroid trưởng thành phổi');
            items.push('MgSO4 bảo vệ não nếu thai < 32 tuần và dự kiến chấm dứt thai kỳ');
            items.push('Cân nhắc chuyển tuyến nếu không đủ hồi sức sơ sinh');
            break;
        case 'ABNORMAL':
            items.push('Doppler theo dõi 1-2 lần/tuần');
            items.push('NST 2 lần/tuần');
            items.push('Theo dõi cân nặng thai qua siêu âm mỗi 2 tuần');
            items.push('Đánh giá ductus venosus Doppler nếu có chỉ định');
            items.push('Tái khám sớm nếu có triệu chứng bất thường');
            break;
        default:
            items.push('Doppler theo dõi thường quy theo lịch');
            items.push('Tái khám theo hẹn');
    }
    return items;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * @param {object} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDopplerInputs(data) {
    if (!data.gaWeeks || data.gaWeeks < 18 || data.gaWeeks > 42) {
        return { valid: false, error: 'Tuổi thai phải từ 18 đến 42 tuần.' };
    }
    // At least one Doppler value must be entered
    const hasUA = data.uaPi || data.uaRi || data.uaSd;
    const hasMCA = data.mcaPsv || data.mcaPi;
    const hasUtA = data.utaPiLeft || data.utaPiRight;
    if (!hasUA && !hasMCA && !hasUtA) {
        return { valid: false, error: 'Vui lòng nhập ít nhất một chỉ số Doppler.' };
    }
    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// FULL PIPELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Run the complete Doppler analysis pipeline
 * @param {object} input - form data
 * @returns {object} complete result
 */
export function analyzeDoppler(input) {
    const gaWeeks = parseFloat(input.gaWeeks) + (parseFloat(input.gaDays || 0) / 7);

    let uaIG21_PI = null, uaIG21_RI = null, uaIG21_SD = null;
    let mcaPsvResult = null;
    let fmfResult = null;
    let utaResult = null;

    // UA indices (INTERGROWTH-21st)
    if (input.uaPi) uaIG21_PI = calcIG21(parseFloat(input.uaPi), 'PI', gaWeeks);
    if (input.uaRi) uaIG21_RI = calcIG21(parseFloat(input.uaRi), 'RI', gaWeeks);
    if (input.uaSd) uaIG21_SD = calcIG21(parseFloat(input.uaSd), 'SD', gaWeeks);

    // MCA-PSV (Mari)
    if (input.mcaPsv) {
        mcaPsvResult = calcMcaPsv(parseFloat(input.mcaPsv), gaWeeks);
    }

    // FMF (Ciobanu) — needs both UA-PI and MCA-PI
    if (input.uaPi && input.mcaPi) {
        fmfResult = calcFmfDoppler(parseFloat(input.uaPi), parseFloat(input.mcaPi), gaWeeks);
    }

    // UtA-PI (Gómez)
    if (input.utaPiLeft && input.utaPiRight) {
        utaResult = calcUtaPi(
            parseFloat(input.utaPiLeft),
            parseFloat(input.utaPiRight),
            gaWeeks,
            input.notching || 'none'
        );
    } else if (input.utaPiMean) {
        const mean = parseFloat(input.utaPiMean);
        utaResult = calcUtaPi(mean, mean, gaWeeks, input.notching || 'none');
    }

    // Overall classification
    const classification = classifyDoppler({
        uaIG21: uaIG21_PI,
        mcaPsv: mcaPsvResult,
        fmf: fmfResult,
        uta: utaResult,
        endDiastolic: input.endDiastolic || 'present',
        gaWeeks,
        clinicalScenario: input.clinicalScenario || 'routine',
    });

    const management = getManagement(classification.severity, classification.fgrStage, gaWeeks);

    return {
        gaWeeks: +gaWeeks.toFixed(1),
        gaText: `${parseInt(input.gaWeeks)} tuần ${input.gaDays || 0} ngày`,
        uaIG21_PI,
        uaIG21_RI,
        uaIG21_SD,
        mcaPsv: mcaPsvResult,
        fmf: fmfResult,
        uta: utaResult,
        endDiastolic: input.endDiastolic || 'present',
        classification,
        management,
        clinicalScenario: input.clinicalScenario || 'routine',
    };
}
