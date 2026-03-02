/**
 * GDM (Gestational Diabetes Mellitus) Risk Calculator
 * Models: FMF (Syngelaki 2014), PersonalGDM Outcomes (Monash 2022), Iowa Nulliparous (Donovan 2019)
 * Pure functions — no side effects
 */

// ─── A. FMF GDM Risk Calculator (Syngelaki/Nicolaides 2014) ────────

/**
 * FMF GDM risk for women WITH previous GDM
 * @param {number} weight - maternal weight in kg
 * @returns {number} predicted risk [0,1]
 */
export function calcFmfPrevGDM(weight) {
    const logOdds = -4.0050 + (0.0206 * (weight - 69));
    return 1 / (1 + Math.exp(-logOdds));
}

/**
 * FMF GDM risk for nulliparous OR parous without previous GDM
 * @param {Object} inputs
 * @returns {{ logOdds: number, risk: number, contributions: Object }}
 */
export function calcFmfGDMRisk(inputs) {
    const {
        age, weight, height, ethnicity, conception,
        familyDM, obsHistory, birthWeightZscore
    } = inputs;

    const contributions = {};

    // Intercept
    let logOdds = -4.0050;
    contributions.baseline = -4.0050;

    // Parous without previous GDM
    const parousNoPrevGDM = obsHistory === 'parous_no_gdm' ? 1 : 0;
    const parousContrib = -0.7885 * parousNoPrevGDM;
    logOdds += parousContrib;
    contributions.parity = parousContrib;

    // Age
    const ageContrib = 0.0807 * (age - 35);
    logOdds += ageContrib;
    contributions.age = ageContrib;

    // Weight
    const weightContrib = 0.0381 * (weight - 69);
    logOdds += weightContrib;
    contributions.weight = weightContrib;

    // Height
    const heightContrib = -0.0591 * (height - 164);
    logOdds += heightContrib;
    contributions.height = heightContrib;

    // Family history
    let fhContrib = 0;
    if (familyDM === 'degree1') {
        fhContrib = 0.9332;
    } else if (familyDM === 'degree2') {
        fhContrib = 0.5869;
    }
    logOdds += fhContrib;
    contributions.familyDM = fhContrib;

    // Conception method
    let conceptionContrib = 0;
    if (conception === 'ovulation_drugs') {
        conceptionContrib = 0.4712;
    }
    logOdds += conceptionContrib;
    contributions.conception = conceptionContrib;

    // Ethnicity
    let ethContrib = 0;
    if (ethnicity === 'afro_caribbean') ethContrib = 0.4562;
    else if (ethnicity === 'east_asian') ethContrib = 1.0727;
    else if (ethnicity === 'south_asian') ethContrib = 0.8401;
    logOdds += ethContrib;
    contributions.ethnicity = ethContrib;

    // Birth weight z-score (parous only)
    let bwContrib = 0;
    if (obsHistory === 'parous_no_gdm' && birthWeightZscore != null) {
        bwContrib = 0.2247 * birthWeightZscore;
    }
    logOdds += bwContrib;
    contributions.birthWeight = bwContrib;

    const risk = 1 / (1 + Math.exp(-logOdds));

    return { logOdds, risk, contributions };
}

/**
 * Stratify FMF GDM risk
 * @param {number} riskPercent
 * @returns {Object} { level, label, color }
 */
export function stratifyFmfRisk(riskPercent) {
    if (riskPercent >= 30) return { level: 'VERY_HIGH', label: '🔴⚠️ RẤT CAO (≥30%)', color: 'red-urgent', action: 'OGTT sớm + theo dõi sát + cân nhắc metformin dự phòng' };
    if (riskPercent >= 15) return { level: 'HIGH', label: '🔴 CAO (15-30%)', color: 'red', action: 'OGTT sớm (16-18 tuần) + can thiệp lối sống tích cực' };
    if (riskPercent >= 5) return { level: 'MODERATE', label: '🟠 TRUNG BÌNH (5-15%)', color: 'orange', action: 'Cân nhắc sàng lọc sớm hơn + tư vấn lối sống' };
    return { level: 'LOW', label: '🟢 THẤP (<5%)', color: 'green', action: 'Sàng lọc GDM thường quy tại 24-28 tuần' };
}

// ─── B3. PersonalGDM Outcomes (Monash/MCHRI 2022) ─────────────────

/**
 * PersonalGDM Outcomes — risk of composite adverse outcome in women ALREADY diagnosed with GDM
 * Based on PeRSonal GDM (PMC9596305)
 * @param {Object} inputs
 * @returns {{ Y: number, risk: number, contributions: Object }}
 */
export function calcPersonalGDMOutcomes(inputs) {
    const {
        bmi, age, fastingGlucose, glucose1h,
        gaAtDiagnosis, ethnicity, nulliparous,
        prevLGA, prevPreeclampsia, familyDM, weightGainPerWeek
    } = inputs;

    const contributions = {};

    let Y = -4.11;
    contributions.baseline = -4.11;

    const bmiContrib = 0.04 * bmi;
    Y += bmiContrib;
    contributions.bmi = bmiContrib;

    const ageContrib = 0.01 * age;
    Y += ageContrib;
    contributions.age = ageContrib;

    const fastingContrib = 0.32 * fastingGlucose;
    Y += fastingContrib;
    contributions.fastingGlucose = fastingContrib;

    const glucose1hContrib = 0.05 * glucose1h;
    Y += glucose1hContrib;
    contributions.glucose1h = glucose1hContrib;

    const gaContrib = -0.02 * gaAtDiagnosis;
    Y += gaContrib;
    contributions.gaAtDiagnosis = gaContrib;

    // Ethnicity
    let ethContrib = 0;
    if (ethnicity === 'south_central_asian') ethContrib = -0.65;
    else if (ethnicity === 'east_asian') ethContrib = -0.14;
    Y += ethContrib;
    contributions.ethnicity = ethContrib;

    const nullipContrib = nulliparous ? 0.17 : 0;
    Y += nullipContrib;
    contributions.nulliparous = nullipContrib;

    const lgaContrib = prevLGA ? 0.53 : 0;
    Y += lgaContrib;
    contributions.prevLGA = lgaContrib;

    const peContrib = prevPreeclampsia ? 0.93 : 0;
    Y += peContrib;
    contributions.prevPreeclampsia = peContrib;

    const wgContrib = 0.54 * weightGainPerWeek;
    Y += wgContrib;
    contributions.weightGainPerWeek = wgContrib;

    const fhContrib = familyDM ? -0.07 : 0;
    Y += fhContrib;
    contributions.familyDM = fhContrib;

    const risk = Math.exp(Y) / (1 + Math.exp(Y));

    return { Y, risk, contributions };
}

/**
 * Stratify PersonalGDM Outcomes risk
 * @param {number} riskPercent
 * @returns {Object}
 */
export function stratifyOutcomesRisk(riskPercent) {
    if (riskPercent >= 50) return { level: 'VERY_HIGH', label: '🔴⚠️ RẤT CAO (≥50%)', color: 'red-urgent', action: 'Quản lý tích cực: Insulin sớm, siêu âm 2-4 tuần/lần, NST hàng tuần từ 32 tuần' };
    if (riskPercent >= 30) return { level: 'HIGH', label: '🔴 CAO (30-50%)', color: 'red', action: 'Theo dõi tăng cường: siêu âm tăng trưởng định kỳ, khám đa chuyên khoa' };
    if (riskPercent >= 15) return { level: 'MODERATE', label: '🟠 TRUNG BÌNH (15-30%)', color: 'orange', action: 'Theo dõi tiêu chuẩn GDM tại bệnh viện' };
    return { level: 'LOW', label: '🟢 THẤP (<15%)', color: 'green', action: 'Quản lý thường quy, có thể theo dõi cộng đồng' };
}

// ─── C. Iowa Nulliparous GDM Risk (Donovan 2019) ──────────────────

/**
 * Approximate natural cubic spline for age (5 df)
 * Based on published risk curves — approximate lookup
 */
function iowaAgeSpline(age) {
    // Approximation based on published Figure 2 curves
    // Knots approximately at: 18, 23, 28, 33, 40
    if (age <= 18) return -1.5;
    if (age <= 20) return -1.3 + (age - 18) * 0.15;
    if (age <= 25) return -1.0 + (age - 20) * 0.2;
    if (age <= 30) return 0.0 + (age - 25) * 0.25;
    if (age <= 35) return 1.25 + (age - 30) * 0.3;
    if (age <= 40) return 2.75 + (age - 35) * 0.28;
    return 4.15 + (age - 40) * 0.15;
}

/**
 * Approximate natural cubic spline for BMI (5 df)
 * Based on published Figure 2 curves
 */
function iowaBmiSpline(bmi) {
    if (bmi <= 18.5) return -0.5;
    if (bmi <= 20) return -0.3 + (bmi - 18.5) * 0.15;
    if (bmi <= 25) return -0.075 + (bmi - 20) * 0.12;
    if (bmi <= 30) return 0.525 + (bmi - 25) * 0.16;
    if (bmi <= 35) return 1.325 + (bmi - 30) * 0.14;
    if (bmi <= 40) return 2.025 + (bmi - 35) * 0.1;
    return 2.525 + (bmi - 40) * 0.06;
}

/**
 * Iowa Nulliparous GDM Risk Calculator
 * @param {Object} inputs
 * @returns {{ t: number, risk: number, contributions: Object }}
 */
export function calcIowaGDMRisk(inputs) {
    const { ethnicity, age, bmi, familyDM, preexistingHTN } = inputs;

    const contributions = {};

    let t = -9.478;
    contributions.baseline = -9.478;

    // Ethnicity
    let ethContrib = 0;
    if (ethnicity === 'hispanic') ethContrib = 0.391;
    else if (ethnicity === 'black') ethContrib = 0.001;
    else if (ethnicity === 'asian') ethContrib = 1.064;
    else if (ethnicity === 'ai_an') ethContrib = 0.180;
    else if (ethnicity === 'hawaiian_pi') ethContrib = 0.644;
    else if (ethnicity === 'other') ethContrib = 0.338;
    // 'white' = reference = 0
    t += ethContrib;
    contributions.ethnicity = ethContrib;

    // Age (spline)
    const ageContrib = iowaAgeSpline(age);
    t += ageContrib;
    contributions.age = ageContrib;

    // BMI (spline)
    const bmiContrib = iowaBmiSpline(bmi);
    t += bmiContrib;
    contributions.bmi = bmiContrib;

    // Family history
    const fhContrib = familyDM ? 0.685 : 0;
    t += fhContrib;
    contributions.familyDM = fhContrib;

    // Pre-existing HTN
    const htnContrib = preexistingHTN ? 0.533 : 0;
    t += htnContrib;
    contributions.preexistingHTN = htnContrib;

    const risk = 1 / (1 + Math.exp(-t));

    return { t, risk, contributions };
}

/**
 * Stratify Iowa risk (threshold: 6%)
 * @param {number} riskPercent
 * @returns {Object}
 */
export function stratifyIowaRisk(riskPercent) {
    if (riskPercent >= 20) return { level: 'VERY_HIGH', label: '🔴 RẤT CAO (≥20%)', color: 'red-urgent', action: 'OGTT sớm (16-18 tuần), can thiệp lối sống tích cực, kiểm soát cân nặng chặt chẽ' };
    if (riskPercent >= 10) return { level: 'HIGH', label: '🔴 CAO (10-20%)', color: 'red', action: 'OGTT sớm + tư vấn dinh dưỡng chuyên biệt' };
    if (riskPercent >= 6) return { level: 'MODERATE', label: '🟠 TRÊN NGƯỠNG (≥6%)', color: 'orange', action: 'Vượt ngưỡng nguy cơ cao (≥6%), cân nhắc sàng lọc sớm' };
    return { level: 'LOW', label: '🟢 DƯỚI NGƯỠNG (<6%)', color: 'green', action: 'Sàng lọc GDM thường quy 24-28 tuần + tư vấn lối sống phòng ngừa' };
}

// ─── Validation ───────────────────────────────────────────────────

export function validateFmfInputs(data) {
    if (data.age == null || data.age < 14 || data.age > 60) {
        return { valid: false, error: 'Vui lòng nhập tuổi mẹ hợp lệ (14-60).' };
    }
    if (data.weight == null || data.weight < 30 || data.weight > 200) {
        return { valid: false, error: 'Vui lòng nhập cân nặng hợp lệ (30-200 kg).' };
    }
    if (data.height == null || data.height < 120 || data.height > 220) {
        return { valid: false, error: 'Vui lòng nhập chiều cao hợp lệ (120-220 cm).' };
    }
    return { valid: true };
}

export function validateOutcomesInputs(data) {
    if (data.age == null || data.age < 14 || data.age > 60) {
        return { valid: false, error: 'Vui lòng nhập tuổi mẹ hợp lệ (14-60).' };
    }
    if (data.bmi == null || data.bmi < 12 || data.bmi > 70) {
        return { valid: false, error: 'BMI phải từ 12 đến 70.' };
    }
    if (data.fastingGlucose == null || data.fastingGlucose <= 0) {
        return { valid: false, error: 'Vui lòng nhập glucose lúc đói.' };
    }
    if (data.glucose1h == null || data.glucose1h <= 0) {
        return { valid: false, error: 'Vui lòng nhập glucose 1 giờ.' };
    }
    if (data.gaAtDiagnosis == null || data.gaAtDiagnosis < 10 || data.gaAtDiagnosis > 40) {
        return { valid: false, error: 'Tuổi thai khi chẩn đoán GDM phải từ 10-40 tuần.' };
    }
    if (data.weightGainPerWeek == null || data.weightGainPerWeek < 0) {
        return { valid: false, error: 'Vui lòng nhập tăng cân/tuần hợp lệ.' };
    }
    return { valid: true };
}

export function validateIowaInputs(data) {
    if (data.age == null || data.age < 14 || data.age > 60) {
        return { valid: false, error: 'Vui lòng nhập tuổi mẹ hợp lệ (14-60).' };
    }
    if (data.bmi == null || data.bmi < 12 || data.bmi > 70) {
        return { valid: false, error: 'BMI phải từ 12 đến 70.' };
    }
    return { valid: true };
}

// ─── Prompt Builders ──────────────────────────────────────────────

const ETHNICITY_LABELS = {
    'caucasian': 'Da trắng (Caucasian)',
    'afro_caribbean': 'Châu Phi/Afro-Caribbean',
    'south_asian': 'Nam Á (South Asian)',
    'east_asian': 'Đông Á (bao gồm Việt Nam)',
    'mixed': 'Hỗn hợp (Mixed)',
    'white': 'White, not Hispanic',
    'hispanic': 'Hispanic',
    'black': 'Black',
    'asian': 'Asian (bao gồm Việt Nam)',
    'ai_an': 'American Indian/Alaska Native',
    'hawaiian_pi': 'Hawaiian/Pacific Islander',
    'other': 'Khác',
    'south_central_asian': 'Trung/Nam Á',
    'caucasian_eu': 'Caucasian/Châu Âu',
    'african': 'Châu Phi',
    'oceanian': 'Châu Đại Dương',
};

export function buildFmfPrompt(formData, result) {
    const bmi = (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1);
    const strat = stratifyFmfRisk(result.risk * 100);

    return `PROMPT — FMF GDM RISK ANALYSIS

Bạn là bác sĩ sản khoa chuyên gia về y học thai nhi. Hãy phân tích nguy cơ đái tháo đường thai kỳ (GDM) dựa trên mô hình FMF (Syngelaki/Nicolaides 2014) cho bệnh nhân sau:

=== DỮ LIỆU BỆNH NHÂN ===
- Tuổi mẹ: ${formData.age} tuổi
- Cân nặng: ${formData.weight} kg
- Chiều cao: ${formData.height} cm → BMI = ${bmi}
- Chủng tộc: ${ETHNICITY_LABELS[formData.ethnicity] || formData.ethnicity}
- Phương pháp thụ thai: ${formData.conception === 'natural' ? 'Tự nhiên' : formData.conception === 'ovulation_drugs' ? 'Thuốc kích trứng' : 'IVF'}
- Tiền sử gia đình ĐTĐ: ${formData.familyDM === 'degree1' ? 'Có — Bậc 1' : formData.familyDM === 'degree2' ? 'Có — Bậc 2' : 'Không'}
- Tiền sử sản khoa: ${formData.obsHistory === 'nulliparous' ? 'Con so' : formData.obsHistory === 'parous_prev_gdm' ? 'Con rạ — CÓ tiền sử GDM' : 'Con rạ — KHÔNG có tiền sử GDM'}
- Hút thuốc: ${formData.smoking ? 'Có' : 'Không'}

=== KẾT QUẢ TÍNH TOÁN ===
- Log-odds = ${result.logOdds.toFixed(4)}
- Predicted Risk = ${(result.risk * 100).toFixed(1)}%
- Phân loại nguy cơ: ${strat.label}

=== YÊU CẦU PHÂN TÍCH ===
1. Đánh giá từng yếu tố nguy cơ đóng góp bao nhiêu % vào tổng nguy cơ
2. So sánh với nguy cơ nền (baseline) của dân số chung (~2-10%)
3. Yếu tố nào CÓ THỂ thay đổi được (modifiable) và gợi ý can thiệp cụ thể
4. Lịch trình sàng lọc và theo dõi phù hợp cho mức nguy cơ này
5. Nếu nguy cơ >15%, đề xuất chiến lược dự phòng theo ACOG/NICE/FIGO
6. Cân nhắc yếu tố chủng tộc Đông Á (OR = 2.92) ảnh hưởng lâm sàng
7. Tư vấn dinh dưỡng và vận động phù hợp cho giai đoạn tam cá nguyệt I

Trả lời bằng tiếng Việt, trình bày có cấu trúc rõ ràng.`;
}

export function buildOutcomesPrompt(formData, result) {
    const strat = stratifyOutcomesRisk(result.risk * 100);

    return `PROMPT — PersonalGDM OUTCOMES ANALYSIS

Bạn là chuyên gia sản khoa và nội tiết sinh sản. Phân tích nguy cơ biến cố bất lợi kết hợp cho thai phụ ĐÃ CHẨN ĐOÁN GDM dựa trên mô hình PeRSonal GDM (Monash University/MCHRI 2022).

=== DỮ LIỆU BỆNH NHÂN ===
- Tuổi mẹ: ${formData.age} tuổi
- BMI trước thai: ${formData.bmi} kg/m²
- Dân tộc: ${ETHNICITY_LABELS[formData.ethnicity] || formData.ethnicity}
- OGTT 75g: Đói = ${formData.fastingGlucose} mmol/L | 1h = ${formData.glucose1h} mmol/L
- Tuổi thai chẩn đoán GDM: ${formData.gaAtDiagnosis} tuần
- Tăng cân/tuần đến lúc chẩn đoán: ${formData.weightGainPerWeek.toFixed(2)} kg/tuần
- Con so: ${formData.nulliparous ? 'Có' : 'Không'}
- Tiền sử LGA: ${formData.prevLGA ? 'Có' : 'Không'}
- Tiền sử tiền sản giật: ${formData.prevPreeclampsia ? 'Có' : 'Không'}
- Tiền sử gia đình ĐTĐ: ${formData.familyDM ? 'Có' : 'Không'}

=== KẾT QUẢ TÍNH TOÁN ===
- Y (log-odds) = ${result.Y.toFixed(4)}
- Nguy cơ biến cố bất lợi kết hợp: ${(result.risk * 100).toFixed(1)}%
- Phân loại: ${strat.label}
- Khuyến cáo: ${strat.action}

Biến cố bất lợi kết hợp: Rối loạn THA thai kỳ, Thai to LGA, Hạ đường huyết sơ sinh cần IV, Kẹt vai, Tử vong chu sinh, Gãy xương/liệt dây TK sơ sinh.

=== YÊU CẦU PHÂN TÍCH ===
1. Phân tích nguy cơ biến cố bất lợi kết hợp — yếu tố nào đóng góp chính?
2. Đề xuất chế độ quản lý phân tầng:
   - Mục tiêu đường huyết (ACOG: <95 mg/dL đói, <140 1h, <120 2h)
   - Khi nào cần insulin vs. chỉ chế độ ăn?
   - Siêu âm tăng trưởng khi nào?
   - Thời điểm và phương pháp chấm dứt thai kỳ
3. So sánh nguy cơ với dân số nền GDM (~27% có biến cố bất lợi)
4. Tư vấn dinh dưỡng GDM chuyên biệt cho phụ nữ Việt Nam/Đông Á
5. Kế hoạch theo dõi sau sinh (nguy cơ ĐTĐ type 2 tương lai)

Trả lời bằng tiếng Việt, có cấu trúc rõ ràng, ghi rõ mức bằng chứng.`;
}

export function buildIowaPrompt(formData, result) {
    const strat = stratifyIowaRisk(result.risk * 100);

    return `PROMPT — IOWA GDM RISK FOR NULLIPAROUS WOMEN

Bạn là bác sĩ sản khoa chuyên về thai kỳ nguy cơ cao. Phân tích nguy cơ GDM cho phụ nữ mang thai CON ĐẦU (nulliparous) theo mô hình University of Iowa (Donovan/Ryckman 2019).

=== DỮ LIỆU BỆNH NHÂN ===
- Dân tộc: ${ETHNICITY_LABELS[formData.ethnicity] || formData.ethnicity}
- Tuổi mẹ: ${formData.age} tuổi
- BMI trước mang thai: ${formData.bmi} (Cân nặng: ${formData.weight || 'N/A'} kg, Chiều cao: ${formData.height || 'N/A'} cm)
- Tiền sử gia đình ĐTĐ: ${formData.familyDM ? 'Có' : 'Không'}
- Tăng huyết áp có từ trước: ${formData.preexistingHTN ? 'Có' : 'Không'}

=== KẾT QUẢ TÍNH TOÁN ===
- t (log-odds) = ${result.t.toFixed(4)}
- Predicted Risk = ${(result.risk * 100).toFixed(1)}%
- Ngưỡng tham chiếu: 6% (high risk cutoff)
- Phân loại: ${strat.label}

=== YÊU CẦU PHÂN TÍCH ===
1. Đánh giá từng yếu tố nguy cơ và mức đóng góp:
   - Chủng tộc Asian có hệ số 1.064 (OR≈2.9) — giải thích ý nghĩa
   - BMI ảnh hưởng phi tuyến — phân tích cho BMI cụ thể
   - Tuổi mẹ ảnh hưởng phi tuyến — phân tích
2. So sánh nguy cơ với nhóm tham chiếu White non-Hispanic cùng tuổi/BMI
3. Vì là con so, chiến lược sàng lọc thay thế?
4. Nếu predicted risk ≥6%: can thiệp lối sống, OGTT sớm, kiểm soát cân nặng
5. Lưu ý đặc biệt cho phụ nữ Việt Nam:
   - Ngưỡng BMI béo phì Châu Á: ≥25 (không phải ≥30)
   - Chế độ ăn nhiều tinh bột → chỉ số GI cao
   - Khuyến cáo dinh dưỡng cụ thể
6. Mô hình chỉ có AUC 0.665 cho Asian (thấp nhất) → hạn chế cần lưu ý

Trả lời bằng tiếng Việt, trình bày có cấu trúc.`;
}

/**
 * Master prompt combining all available results
 */
export function buildMasterPrompt(formData, results) {
    const { fmf, outcomes, iowa } = results;
    const fmfStrat = fmf ? stratifyFmfRisk(fmf.risk * 100) : null;
    const outStrat = outcomes ? stratifyOutcomesRisk(outcomes.risk * 100) : null;
    const iowaStrat = iowa ? stratifyIowaRisk(iowa.risk * 100) : null;

    let prompt = `MASTER PROMPT — PHÂN TÍCH TOÀN DIỆN NGUY CƠ GDM

Bạn là giáo sư sản khoa chuyên sâu về đái tháo đường thai kỳ. Hãy phân tích TOÀN DIỆN cho bệnh nhân dưới đây.

═══════════════════════════════════
DỮ LIỆU BỆNH NHÂN
═══════════════════════════════════
• Tuổi: ${formData.age} tuổi
• Chiều cao: ${formData.height || 'N/A'} cm | Cân nặng: ${formData.weight} kg
• BMI: ${formData.bmi} kg/m²
• Dân tộc: ${ETHNICITY_LABELS[formData.ethnicity] || formData.ethnicity}
• Con thứ mấy: ${formData.parity || 'N/A'}
• Tiền sử gia đình ĐTĐ: ${formData.familyDMLabel || 'N/A'}
• Phương pháp thụ thai: ${formData.conceptionLabel || 'N/A'}
• Hút thuốc: ${formData.smoking ? 'Có' : 'Không'}

═══════════════════════════════════
KẾT QUẢ ĐÃ TÍNH
═══════════════════════════════════`;

    if (fmf) {
        prompt += `
[A] FMF Risk: ${(fmf.risk * 100).toFixed(1)}% — ${fmfStrat.label}`;
    }

    if (iowa) {
        prompt += `
[B] Iowa Nulliparous: ${(iowa.risk * 100).toFixed(1)}% — ${iowaStrat.label}`;
    }

    if (outcomes) {
        prompt += `
[C] PersonalGDM Outcomes: ${(outcomes.risk * 100).toFixed(1)}% — ${outStrat.label}`;
    }

    prompt += `

═══════════════════════════════════
YÊU CẦU PHÂN TÍCH TOÀN DIỆN
═══════════════════════════════════

1. TỔNG HỢP NGUY CƠ: So sánh kết quả từ các mô hình, giải thích nếu không nhất quán
2. PHÂN TÍCH YẾU TỐ NGUY CƠ: Xếp hạng theo mức ảnh hưởng, phân biệt modifiable/non-modifiable
3. KẾ HOẠCH QUẢN LÝ PHÂN TẦNG phù hợp với mức nguy cơ
4. TƯ VẤN DINH DƯỠNG ĐẶC THÙ CHO PHỤ NỮ VIỆT NAM
5. THEO DÕI SAU SINH: OGTT 4-12 tuần, sàng lọc ĐTĐ type 2 định kỳ

Trình bày bằng tiếng Việt, có cấu trúc rõ ràng.`;

    return prompt;
}

// ─── Utility ──────────────────────────────────────────────────────

/** Convert mg/dL to mmol/L */
export function mgdlToMmol(mgdl) {
    return mgdl * 0.0555;
}

/** Convert mmol/L to mg/dL */
export function mmolToMgdl(mmol) {
    return mmol / 0.0555;
}

/** Calculate BMI */
export function calcBMI(weightKg, heightCm) {
    return weightKg / Math.pow(heightCm / 100, 2);
}
