/**
 * Ectopic Pregnancy Clinical Decision Support Calculator
 * Tools: A (Risk Estimation), B (Fernandez Score), C (β-hCG Doubling Time)
 * Pure functions — no side effects
 */

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════

export function validateEctopicInputs(data, toolType) {
    if (toolType === 'A') {
        if (!data.age || data.age < 12 || data.age > 60) {
            return { valid: false, error: 'Tuổi bệnh nhân phải từ 12–60.' };
        }
        if (data.gaWeeks == null || data.gaWeeks < 3 || data.gaWeeks > 20) {
            return { valid: false, error: 'Tuổi thai phải từ 3–20 tuần.' };
        }
        return { valid: true };
    }

    if (toolType === 'B') {
        if (data.gestationalDays == null || data.gestationalDays < 1) {
            return { valid: false, error: 'Số ngày vô kinh phải > 0.' };
        }
        if (data.hcg == null || data.hcg <= 0) {
            return { valid: false, error: 'Giá trị β-hCG phải > 0.' };
        }
        if (data.progesterone == null || data.progesterone < 0) {
            return { valid: false, error: 'Giá trị Progesterone không hợp lệ.' };
        }
        if (!data.pain) {
            return { valid: false, error: 'Vui lòng chọn mức độ đau bụng.' };
        }
        if (data.hematosalpinxCm == null || data.hematosalpinxCm < 0) {
            return { valid: false, error: 'Kích thước hematosalpinx không hợp lệ.' };
        }
        if (data.hemoperitoneumMl == null || data.hemoperitoneumMl < 0) {
            return { valid: false, error: 'Lượng dịch ổ bụng không hợp lệ.' };
        }
        return { valid: true };
    }

    if (toolType === 'C') {
        if (!data.hcg1 || data.hcg1 <= 0) {
            return { valid: false, error: 'β-hCG lần 1 phải > 0.' };
        }
        if (!data.hcg2 || data.hcg2 <= 0) {
            return { valid: false, error: 'β-hCG lần 2 phải > 0.' };
        }
        if (!data.hcg1Date || !data.hcg2Date) {
            return { valid: false, error: 'Vui lòng nhập ngày giờ lấy máu.' };
        }
        if (!data.ultrasoundMethod) {
            return { valid: false, error: 'Vui lòng chọn phương pháp siêu âm.' };
        }
        return { valid: true };
    }

    return { valid: false, error: 'Loại công cụ không hợp lệ.' };
}

// ═══════════════════════════════════════════════════════════
// TOOL A: RISK ESTIMATION
// ═══════════════════════════════════════════════════════════

const RISK_FACTORS = [
    { id: 'A', key: 'previousEctopic', label: 'Tiền sử TNTC trước đó', or: 9, tier: 'VERY_HIGH' },
    { id: 'B', key: 'tubalSurgery', label: 'Phẫu thuật vòi trứng', or: 12, tier: 'VERY_HIGH' },
    { id: 'C', key: 'pid', label: 'Viêm vùng chậu (PID)/Chlamydia/lậu', or: 3, tier: 'HIGH' },
    { id: 'D', key: 'iud', label: 'Mang IUD khi thụ thai', or: 10, tier: 'HIGH' },
    { id: 'E', key: 'ivf', label: 'IVF/ART', or: 3.5, tier: 'HIGH' },
    { id: 'F', key: 'smoking', label: 'Hút thuốc lá', or: 2.5, tier: 'MEDIUM' },
    { id: 'G', key: 'endometriosis', label: 'Lạc nội mạc tử cung', or: 2, tier: 'MEDIUM' },
    { id: 'H', key: 'infertilityHistory', label: 'Tiền sử vô sinh', or: 2.5, tier: 'MEDIUM' },
    { id: 'I', key: 'abdominalSurgery', label: 'Phẫu thuật ổ bụng/vùng chậu', or: 1.5, tier: 'LOW' },
    { id: 'J', key: 'ageOver35', label: 'Tuổi > 35', or: 2, tier: 'LOW' },
    { id: 'K', key: 'multiplePartners', label: 'Nhiều bạn tình / STI khác', or: 1.5, tier: 'LOW' },
];

export function assessRiskFactors(factors) {
    const present = RISK_FACTORS.filter(rf => factors[rf.key]);
    const maxOr = present.length > 0 ? Math.max(...present.map(f => f.or)) : 0;
    const hasVeryHighFactor = present.some(f => f.tier === 'VERY_HIGH');
    const hasHighFactor = present.some(f => f.tier === 'HIGH');
    const hasMediumFactor = present.some(f => f.tier === 'MEDIUM');

    return {
        factors: present,
        totalFactors: present.length,
        maxOr,
        hasVeryHighFactor,
        hasHighFactor,
        hasMediumFactor,
    };
}

// ─── Decision Tree ──────────────────────────────────────────

const DZ_TVUS = 3500;
const DZ_TAS = 6500;

export function evaluateDecisionTree(data) {
    // Step 1: Hemodynamic stability
    if (!data.hemodynamicStable) {
        return { pathway: 'EMERGENCY', description: 'Huyết động KHÔNG ổn định → Nghi vỡ TNTC → PHẪU THUẬT CẤP CỨU', requiresSurgery: true };
    }

    // Step 2: IUP confirmed
    if (data.iupConfirmed) {
        return { pathway: 'EXCLUDE_ECTOPIC', description: 'Túi thai trong tử cung xác nhận → Gần loại trừ TNTC (trừ heterotopic)', requiresSurgery: false };
    }

    // Step 3: Ectopic confirmed on TVUS
    if (data.ectopicConfirmed) {
        const needsSurgery = !!data.fetalHeartbeatOutside;
        return {
            pathway: 'CONFIRMED_ECTOPIC',
            description: data.fetalHeartbeatOutside
                ? 'TNTC xác định + tim thai ngoài TC → Phẫu thuật'
                : 'TNTC xác định → Đánh giá Fernandez Score',
            requiresSurgery: needsSurgery,
        };
    }

    // Step 4: Adnexal mass
    if (data.hasAdnexalMass) {
        return { pathway: 'SUSPECT_HIGH', description: 'Khối phần phụ nghi ngờ → Nghi ngờ CAO TNTC', requiresSurgery: false };
    }

    // Step 5: PUL — compare with discriminatory zone
    if (data.isPUL) {
        const dz = data.ultrasoundMethod === 'tvus' ? DZ_TVUS : DZ_TAS;
        if (data.hcg > dz) {
            return { pathway: 'SUSPECT_HIGH', description: `β-hCG ${data.hcg} > ngưỡng ${dz} + tử cung trống → Nghi ngờ CAO TNTC hoặc sẩy thai`, requiresSurgery: false };
        }
        return { pathway: 'FOLLOW_UP', description: `β-hCG ${data.hcg} < ngưỡng ${dz} → Theo dõi β-hCG mỗi 48h`, requiresSurgery: false };
    }

    return { pathway: 'INDETERMINATE', description: 'Cần thêm dữ liệu để đánh giá', requiresSurgery: false };
}

// ─── Risk Classification ────────────────────────────────────

export function classifyRiskLevel(data) {
    const rf = data.riskFactors || {};

    // VERY_HIGH: ≥1 A-B factor + abnormal hCG + adnexal mass
    if (rf.hasVeryHighFactor && data.hcgAboveDiscriminatoryZone && data.hasAdnexalMass) {
        return { level: 'VERY_HIGH', label: '🔴⚠️ RẤT CAO', color: 'red-urgent' };
    }

    // HIGH: ≥1 C-E factor + empty uterus + hCG above DZ
    if ((rf.hasVeryHighFactor || rf.hasHighFactor) && (data.hcgAboveDiscriminatoryZone || data.emptyUterus)) {
        return { level: 'HIGH', label: '🔴 CAO', color: 'red' };
    }

    // MEDIUM: ≥2 factors + PUL + slow rise
    if ((rf.totalFactors >= 2 || rf.hasMediumFactor) && (data.isPUL || data.slowHcgRise)) {
        return { level: 'MEDIUM', label: '🟠 TRUNG BÌNH', color: 'orange' };
    }

    // LOW
    return { level: 'LOW', label: '🟢 THẤP', color: 'green' };
}

// ═══════════════════════════════════════════════════════════
// TOOL B: FERNANDEZ SCORE
// ═══════════════════════════════════════════════════════════

function scoreGA(days) {
    if (days < 42) return 1;
    if (days <= 49) return 2;
    return 3;
}

function scoreHCG(hcg) {
    if (hcg < 1000) return 1;
    if (hcg <= 5000) return 2;
    return 3;
}

function scoreProgesterone(p) {
    if (p < 5) return 1;
    if (p <= 10) return 2;
    return 3;
}

function scorePain(pain) {
    if (pain === 'none') return 1;
    if (pain === 'induced') return 2;
    return 3; // spontaneous
}

function scoreHematosalpinx(cm) {
    if (cm < 1) return 1;
    if (cm <= 3) return 2;
    return 3;
}

function scoreHemoperitoneum(ml) {
    if (ml === 0) return 1;
    if (ml <= 100) return 2;
    return 3;
}

export function calcFernandezScore({ gestationalDays, hcg, progesterone, pain, hematosalpinxCm, hemoperitoneumMl }) {
    const scores = [
        scoreGA(gestationalDays),
        scoreHCG(hcg),
        scoreProgesterone(progesterone),
        scorePain(pain),
        scoreHematosalpinx(hematosalpinxCm),
        scoreHemoperitoneum(hemoperitoneumMl),
    ];
    return { scores, total: scores.reduce((a, b) => a + b, 0) };
}

export function interpretFernandez(score) {
    if (score <= 8) {
        return {
            severity: 'MILD',
            label: 'Nhẹ',
            management: 'Theo dõi (expectant) hoặc MTX liều đơn',
            successRate: 'Tiên lượng rất tốt cho điều trị bảo tồn',
        };
    }
    if (score <= 12) {
        return {
            severity: 'MODERATE',
            label: 'Trung bình',
            management: 'MTX liều đơn (50 mg/m²) hoặc đa liều',
            successRate: '> 80% thành công với nội khoa',
        };
    }
    if (score <= 15) {
        return {
            severity: 'SEVERE',
            label: 'Nặng',
            management: 'Phẫu thuật nội soi (salpingostomy/salpingectomy)',
            successRate: 'Khả năng thất bại nội khoa cao',
        };
    }
    return {
        severity: 'VERY_SEVERE',
        label: 'Rất nặng',
        management: 'Phẫu thuật — Có thể cần can thiệp cấp cứu',
        successRate: 'Nguy cơ vỡ cao, nội khoa không phù hợp',
    };
}

export function checkMtxContraindications(data) {
    const checks = [
        { key: 'hemodynamicStable', invert: true, label: 'Huyết động không ổn định / sốc' },
        { key: 'fetalHeartbeatOutside', invert: false, label: 'Tim thai ngoài tử cung (+)' },
        { key: 'liverFailure', invert: false, label: 'Suy gan' },
        { key: 'renalFailure', invert: false, label: 'Suy thận' },
        { key: 'leukopenia', invert: false, label: 'Giảm bạch cầu' },
        { key: 'thrombocytopenia', invert: false, label: 'Giảm tiểu cầu' },
        { key: 'activePulmonary', invert: false, label: 'Bệnh phổi hoạt động' },
        { key: 'activeUlcer', invert: false, label: 'Loét dạ dày hoạt động' },
        { key: 'breastfeeding', invert: false, label: 'Đang cho con bú' },
        { key: 'mtxAllergy', invert: false, label: 'Dị ứng MTX' },
    ];

    const contraindications = checks.filter(c => {
        const val = data[c.key];
        return c.invert ? val === false : val === true;
    }).map(c => c.label);

    return {
        eligible: contraindications.length === 0,
        contraindications,
    };
}

// ═══════════════════════════════════════════════════════════
// TOOL C: β-hCG DOUBLING TIME
// ═══════════════════════════════════════════════════════════

export function calcDoublingTime(hcg1, hcg2, deltaHours) {
    if (hcg2 <= hcg1) {
        if (hcg2 === hcg1) return Infinity;
        // Negative doubling time indicates decline
        return deltaHours * Math.LN2 / Math.log(hcg2 / hcg1);
    }
    return deltaHours * Math.LN2 / Math.log(hcg2 / hcg1);
}

export function calcHalfLife(hcg1, hcg2, deltaHours) {
    if (hcg2 >= hcg1) return Infinity;
    return deltaHours * Math.LN2 / Math.log(hcg1 / hcg2);
}

export function calcPercentChange48h(hcg1, hcg2, deltaHours) {
    const ratio = hcg2 / hcg1;
    const normalizedRatio = Math.pow(ratio, 48 / deltaHours);
    return (normalizedRatio - 1) * 100;
}

export function classifyHcgTrend({ doublingTimeHours, percentChange48h, isDecreasing }) {
    // Decreasing hCG
    if (isDecreasing) {
        const absDrop = Math.abs(percentChange48h);
        if (absDrop >= 36) {
            return { classification: 'SUSPECT_MISCARRIAGE', label: 'Phù hợp sẩy thai', description: 'Giảm ≥ 36% / 48h — thai ngừng phát triển tự tiêu' };
        }
        if (absDrop < 21) {
            return { classification: 'SUSPECT_ECTOPIC_DECLINE', label: 'Nghi ngờ TNTC', description: 'Giảm < 21% / 48h — không đủ nhanh cho sẩy thai' };
        }
        return { classification: 'INDETERMINATE_DECLINE', label: 'Chưa xác định', description: 'Giảm 21–35% — cần theo dõi thêm' };
    }

    // Plateau
    if (percentChange48h < 10 && percentChange48h >= 0) {
        return { classification: 'PLATEAU_SUSPECT_ECTOPIC', label: 'Nghi ngờ TNTC (plateau)', description: 'Tăng < 10% / đi ngang — rất bất thường' };
    }

    // Rising
    if (doublingTimeHours >= 31 && doublingTimeHours <= 72) {
        return { classification: 'NORMAL_IUP', label: 'Bình thường', description: 'DT 31–72h — phù hợp IUP sống' };
    }
    if (doublingTimeHours > 72 && doublingTimeHours <= 96) {
        return { classification: 'BORDERLINE', label: 'Ranh giới', description: 'DT 72–96h — cần theo dõi thêm' };
    }
    if (doublingTimeHours > 96) {
        return { classification: 'SUSPECT_ECTOPIC', label: 'Nghi ngờ TNTC', description: 'DT > 96h — tăng chậm bất thường' };
    }

    // Very fast rise (DT < 31h)
    return { classification: 'NORMAL_IUP', label: 'Bình thường (tăng nhanh)', description: 'DT < 31h — tăng nhanh, có thể đa thai' };
}

export function compareDiscriminatoryZone(hcg, method, isDesired, isIvf) {
    let threshold;
    if (method === 'tvus') {
        threshold = isDesired ? 3500 : (isIvf ? 3500 : 1500);
    } else {
        threshold = isIvf ? 7000 : 6500;
    }

    let relation;
    if (hcg >= threshold) {
        relation = 'ABOVE';
    } else {
        relation = 'BELOW';
    }

    return { relation, threshold, hcg, method };
}

export function getMinimumRise(initialHcg) {
    if (initialHcg < 1500) return 49;
    if (initialHcg <= 3000) return 40;
    return 33;
}

// ═══════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════

const PAIN_MAP = { 'none': 'Không đau', 'induced': 'Đau khi khám', 'spontaneous': 'Đau tự phát' };

export function buildPromptA(formData, results) {
    const fd = formData;
    const riskFactorsList = (fd.riskFactors || [])
        .map(f => `- ${f.label} (OR ≈ ${f.or})`)
        .join('\n') || '- Không có yếu tố nguy cơ đặc biệt';

    return `Bạn là chuyên gia Sản phụ khoa. Hãy phân tích ca lâm sàng sau và đánh giá khả năng thai ngoài tử cung, phân loại mức độ nguy cơ, và đề xuất kế hoạch tiếp theo.

═══════════════════════════════════════════
THÔNG TIN BỆNH NHÂN — ĐÁNH GIÁ NGUY CƠ TNTC
═══════════════════════════════════════════

■ TUỔI: ${fd.age || 'N/A'} tuổi
■ TUỔI THAI (LMP): ${fd.gaWeeks || 'N/A'} tuần ${fd.gaDays || 0} ngày
■ PARA: ${fd.para || 'N/A'}

■ YẾU TỐ NGUY CƠ:
${riskFactorsList}

■ TRIỆU CHỨNG LÂM SÀNG:
- Đau bụng: ${fd.painType || 'N/A'} — Vị trí: ${fd.painLocation || 'N/A'}
- Ra huyết âm đạo: ${fd.vaginalBleeding || 'N/A'}
- Chậm kinh: ${fd.amenorrheaDays || 'N/A'} ngày
- Huyết áp: ${fd.bp || 'N/A'} mmHg — Mạch: ${fd.pulse || 'N/A'} lần/phút
- Ấn đau phần phụ: ${fd.adnexalTenderness || 'N/A'}
- Cervical motion tenderness: ${fd.cervicalMotionTenderness || 'N/A'}
- Dấu hiệu sốc: ${fd.shock || 'N/A'}

■ CẬN LÂM SÀNG:
- β-hCG: ${fd.hcg || 'N/A'} mIU/mL
- Progesterone: ${fd.progesterone || 'N/A'} ng/mL
- Hemoglobin: ${fd.hemoglobin || 'N/A'} g/dL

■ SIÊU ÂM:
- Túi thai trong tử cung: ${fd.iupSeen || 'N/A'}
- Khối cạnh tử cung: ${fd.adnexalMass || 'N/A'}
- Dịch ổ bụng: ${fd.freeFluid || 'N/A'}

═══════════════════════════════════════════
KẾT QUẢ PHÂN TÍCH (đã tính toán)
═══════════════════════════════════════════

► ĐÁNH GIÁ CÂY QUYẾT ĐỊNH: ${results.pathway || 'N/A'}
► MỨC NGUY CƠ: ${results.riskLevel || 'N/A'}

═══════════════════════════════════════════
YÊU CẦU PHÂN TÍCH
═══════════════════════════════════════════

1. Đánh giá mức độ nguy cơ TNTC (Rất cao / Cao / Trung bình / Thấp) kèm lý do.
2. So sánh β-hCG với ngưỡng phân biệt (discriminatory zone).
3. Phân tích kết quả siêu âm trong bối cảnh β-hCG.
4. Đề xuất chẩn đoán khả năng nhất và chẩn đoán phân biệt.
5. Kế hoạch tiếp theo (xét nghiệm thêm, siêu âm lại, MTX, phẫu thuật...).
6. Dấu hiệu cần cấp cứu ngay.

LƯU Ý: Đây chỉ là gợi ý hỗ trợ lâm sàng, KHÔNG thay thế phán đoán bác sĩ.`;
}

export function buildPromptB(formData, results) {
    const fd = formData;
    const fern = results.fernandez || {};
    const scores = fern.scores || [];

    return `Bạn là chuyên gia Sản phụ khoa. Hãy phân tích điểm Fernandez và đề xuất phương án điều trị cho ca thai ngoài tử cung dưới đây.

═══════════════════════════════════════════
HỆ THỐNG CHẤM ĐIỂM FERNANDEZ
═══════════════════════════════════════════

Nguồn: Fernandez et al. 1991 (Hum Reprod)
Quy tắc: < 12 điểm → > 80% thành công với nội khoa; ≥ 12–13 → phẫu thuật.

■ 6 TIÊU CHÍ:
1. Tuổi thai: ${fd.gestationalDays || 'N/A'} ngày → ${scores[0] || 'N/A'} điểm
2. β-hCG: ${fd.hcg || 'N/A'} mIU/mL → ${scores[1] || 'N/A'} điểm
3. Progesterone: ${fd.progesterone || 'N/A'} ng/mL → ${scores[2] || 'N/A'} điểm
4. Đau bụng: ${PAIN_MAP[fd.pain] || fd.pain || 'N/A'} → ${scores[3] || 'N/A'} điểm
5. Hematosalpinx: ${fd.hematosalpinxCm || 'N/A'} cm → ${scores[4] || 'N/A'} điểm
6. Hemoperitoneum: ${fd.hemoperitoneumMl || 'N/A'} mL → ${scores[5] || 'N/A'} điểm

■ TỔNG ĐIỂM FERNANDEZ: ${fern.total || 'N/A'} / 18
■ PHÂN LOẠI: ${results.severity || 'N/A'}
■ HƯỚNG XỬ TRÍ ĐỀ XUẤT: ${results.management || 'N/A'}

■ THÔNG TIN BỔ SUNG:
- Huyết động: ${fd.hemodynamicStable !== false ? 'Ổn định' : 'KHÔNG ổn định'}
- Tim thai ngoài TC: ${fd.fetalHeartbeatOutside ? 'CÓ' : 'Không'}
- Mong muốn bảo tồn sinh sản: ${fd.preserveFertility || 'N/A'}
- Chống chỉ định MTX: ${(results.mtxContraindications || []).join(', ') || 'Không có'}

═══════════════════════════════════════════
YÊU CẦU PHÂN TÍCH
═══════════════════════════════════════════

1. Xác nhận điểm số cho từng tiêu chí và tổng điểm.
2. Phân loại mức độ: Nhẹ (6–8) / Trung bình (9–12) / Nặng (13–15) / Rất nặng (16–18).
3. Kiểm tra chống chỉ định MTX.
4. Đề xuất: MTX liều đơn vs đa liều vs Phẫu thuật, lịch theo dõi β-hCG.
5. Kế hoạch theo dõi sau điều trị.
6. Tỷ lệ thành công dự kiến dựa trên β-hCG.
7. Tư vấn khả năng sinh sản sau điều trị.

LƯU Ý: Gợi ý hỗ trợ lâm sàng, KHÔNG thay thế phán đoán bác sĩ.`;
}

export function buildPromptC(formData, results) {
    const fd = formData;

    return `Bạn là chuyên gia Sản phụ khoa. Hãy phân tích động học β-hCG của bệnh nhân để phân biệt giữa thai trong tử cung bình thường, sẩy thai sớm, và thai ngoài tử cung.

═══════════════════════════════════════════
PHÂN TÍCH β-hCG SERIAL — DOUBLING TIME & DISCRIMINATORY ZONE
═══════════════════════════════════════════

■ GIÁ TRỊ β-hCG:
- Lần 1: ${fd.hcg1 || 'N/A'} mIU/mL (${fd.hcg1Date || 'N/A'})
- Lần 2: ${fd.hcg2 || 'N/A'} mIU/mL (${fd.hcg2Date || 'N/A'})
${fd.hcg3 ? `- Lần 3: ${fd.hcg3} mIU/mL (${fd.hcg3Date || 'N/A'})` : ''}

■ SIÊU ÂM:
- Phương pháp: ${fd.ultrasoundMethod === 'tvus' ? 'Đầu dò âm đạo (TVUS)' : 'Qua thành bụng (TAS)'}
- Kết quả: ${fd.ultrasoundResult || 'N/A'}
- Thai kỳ mong muốn: ${fd.desiredPregnancy ? 'Có' : 'Không'}
- IVF/Đa thai: ${fd.ivf ? 'Có' : 'Không'}

═══════════════════════════════════════════
KẾT QUẢ TÍNH TOÁN (đã tính)
═══════════════════════════════════════════

► KHOẢNG CÁCH: ${fd.deltaHours || results.deltaHours || 'N/A'} giờ
► XU HƯỚNG: ${results.isDecreasing ? 'GIẢM' : 'TĂNG'}
► DOUBLING TIME: ${results.doublingTime != null ? results.doublingTime.toFixed(1) + ' giờ' : 'N/A'}
► % THAY ĐỔI / 48h: ${results.percentChange48h != null ? results.percentChange48h.toFixed(1) + '%' : 'N/A'}
► PHÂN LOẠI: ${results.classification || 'N/A'}
► NGƯỠNG PHÂN BIỆT (${fd.ultrasoundMethod === 'tvus' ? 'TVUS' : 'TAS'}): ${results.dzRelation || 'N/A'}

═══════════════════════════════════════════
YÊU CẦU PHÂN TÍCH
═══════════════════════════════════════════

1. Tính toán xác nhận: Doubling time, Half-life, % thay đổi / 48h.
2. So sánh với tiêu chuẩn Barnhart 2016: mức tăng tối thiểu bình thường.
3. Discriminatory zone: β-hCG so với ngưỡng phân biệt → kết luận.
4. Phân biệt: IUP bình thường vs Sẩy thai sớm vs TNTC.
5. Đề xuất kế hoạch tiếp theo.

LƯU Ý QUAN TRỌNG:
- 21% TNTC có β-hCG tăng giống IUP bình thường (Morse 2012)
- 8% TNTC có β-hCG giảm giống sẩy thai
- Đây là gợi ý hỗ trợ, KHÔNG thay thế phán đoán bác sĩ chuyên khoa.`;
}
