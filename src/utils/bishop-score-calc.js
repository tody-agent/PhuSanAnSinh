/**
 * Bishop Score Calculator + Labor Induction Advisor
 * Based on: Bishop (1964), ACOG PB 107, SOGC 432c (2022), AAFP 2022
 * Pure functions — no side effects
 */

// ─── Bishop Scoring Tables ─────────────────────────────────

const BISHOP_TABLES = {
    dilation: [
        { label: 'Đóng kín', value: 'closed', score: 0 },
        { label: '1–2 cm', value: '1-2', score: 1 },
        { label: '3–4 cm', value: '3-4', score: 2 },
        { label: '≥ 5 cm', value: '>=5', score: 3 },
    ],
    effacement: [
        { label: '0–30%', value: '0-30', score: 0 },
        { label: '40–50%', value: '40-50', score: 1 },
        { label: '60–70%', value: '60-70', score: 2 },
        { label: '≥ 80%', value: '>=80', score: 3 },
    ],
    station: [
        { label: '−3', value: '-3', score: 0 },
        { label: '−2', value: '-2', score: 1 },
        { label: '−1 hoặc 0', value: '-1,0', score: 2 },
        { label: '+1 hoặc +2', value: '+1,+2', score: 3 },
    ],
    consistency: [
        { label: 'Cứng (Firm)', value: 'firm', score: 0 },
        { label: 'Trung bình (Medium)', value: 'medium', score: 1 },
        { label: 'Mềm (Soft)', value: 'soft', score: 2 },
    ],
    position: [
        { label: 'Sau (Posterior)', value: 'posterior', score: 0 },
        { label: 'Trung gian (Middle)', value: 'middle', score: 1 },
        { label: 'Trước (Anterior)', value: 'anterior', score: 2 },
    ],
};

// Parity-based favorable thresholds (CMQCC)
const FAVORABLE_THRESHOLD = {
    nulliparous: 8,
    multiparous: 6,
};

// ─── Score Calculation ─────────────────────────────────────

/**
 * Calculate Bishop Score from 5 cervical parameters
 * @param {Object} inputs - { dilation, effacement, station, consistency, position }
 * @returns {Object} { total, breakdown: { dilation, effacement, station, consistency, position } }
 */
export function calcBishopScore({ dilation, effacement, station, consistency, position }) {
    const getScore = (table, value) => {
        const entry = BISHOP_TABLES[table].find(e => e.value === value);
        return entry ? entry.score : 0;
    };

    const breakdown = {
        dilation: getScore('dilation', dilation),
        effacement: getScore('effacement', effacement),
        station: getScore('station', station),
        consistency: getScore('consistency', consistency),
        position: getScore('position', position),
    };

    const total = breakdown.dilation + breakdown.effacement + breakdown.station
        + breakdown.consistency + breakdown.position;

    return { total, breakdown };
}

// ─── Classification ────────────────────────────────────────

/**
 * Classify Bishop Score with parity adjustment
 * @param {number} score — total Bishop Score (0–13)
 * @param {string} parity — 'nulliparous' | 'multiparous'
 * @returns {Object} { category, label, color, emoji, threshold, meetsThreshold }
 */
export function classifyBishop(score, parity = 'nulliparous') {
    const threshold = FAVORABLE_THRESHOLD[parity] || 8;
    const meetsThreshold = score >= threshold;

    let category, label, color, emoji;

    if (score <= 5) {
        category = 'UNFAVORABLE';
        label = 'Không thuận lợi';
        color = 'red';
        emoji = '🔴';
    } else if (score <= 7) {
        category = 'INTERMEDIATE';
        label = 'Trung gian';
        color = 'yellow';
        emoji = '🟡';
    } else {
        category = 'FAVORABLE';
        label = 'Thuận lợi';
        color = 'green';
        emoji = '✅';
    }

    return { category, label, color, emoji, threshold, meetsThreshold };
}

// ─── Induction Method Recommendations ──────────────────────

/**
 * Get recommended induction methods based on Bishop Score + clinical context
 * @param {Object} params - { score, parity, hasPriorCS, hasROM }
 * @returns {Object} { methods: [], warnings: [], dosageInfo: {} }
 */
export function getInductionMethods({ score, parity, hasPriorCS = false, hasROM = false }) {
    const methods = [];
    const warnings = [];
    const threshold = FAVORABLE_THRESHOLD[parity] || 8;
    const isFavorable = score >= threshold;

    // Prior CS contraindication
    if (hasPriorCS) {
        warnings.push(
            '⚠️ KHÔNG dùng Prostaglandin (Misoprostol, Dinoprostone) — nguy cơ vỡ tử cung khi có sẹo mổ cũ'
        );
    }

    if (isFavorable || score >= 7) {
        // Bishop ≥ 7 → direct induction
        if (!hasPriorCS) {
            methods.push({
                name: 'Oxytocin TM + Bấm ối (Amniotomy)',
                detail: 'SOGC 432c: "IV oxytocin + amniotomy khi Bishop ≥ 7" (Strong, High)',
                priority: 1,
            });
            methods.push({
                name: 'Misoprostol uống (PGE1)',
                detail: 'SOGC: "PGE1 oral khi Bishop ≥ 7"',
                priority: 2,
            });
        } else {
            methods.push({
                name: 'Oxytocin TM liều thấp + Bấm ối',
                detail: 'Phương pháp an toàn cho sẹo mổ cũ. Tránh prostaglandin.',
                priority: 1,
            });
        }
    } else if (score < 6) {
        // Bishop < 6 → cervical ripening first
        if (!hasPriorCS) {
            methods.push({
                name: 'Foley catheter qua cổ tử cung',
                detail: 'Bơm 30–60 mL. An toàn, hiệu quả tương đương prostaglandin.',
                priority: 1,
            });
            methods.push({
                name: 'Misoprostol 25 mcg đặt âm đạo',
                detail: 'Mỗi 3–6 giờ. Hiệu quả, chi phí thấp (~0.5 USD/viên). Cochrane review.',
                priority: 2,
            });
            methods.push({
                name: 'Dinoprostone gel 0.5 mg hoặc insert 10 mg',
                detail: 'Có thể rút ra nếu cần. Chi phí cao hơn (~450 USD).',
                priority: 3,
            });
            methods.push({
                name: 'Kết hợp Foley + Misoprostol',
                detail: 'RCT: giảm thời gian từ khởi phát → sinh.',
                priority: 4,
            });
        } else {
            methods.push({
                name: 'Foley catheter qua cổ tử cung',
                detail: 'Phương pháp an toàn cho sẹo mổ cũ. Bơm 30–60 mL.',
                priority: 1,
            });
            methods.push({
                name: 'Oxytocin TM liều thấp',
                detail: 'Phối hợp Foley. Sẹo mổ cũ → không dùng prostaglandin.',
                priority: 2,
            });
        }
    } else {
        // Bishop 6–7, intermediate
        if (!hasPriorCS) {
            methods.push({
                name: 'Oxytocin TM + Bấm ối',
                detail: 'Có thể khởi phát, xem xét thêm cervical ripening nếu con so.',
                priority: 1,
            });
            methods.push({
                name: 'Foley catheter ± Misoprostol',
                detail: 'Xem xét nếu con so để tăng tỷ lệ thành công.',
                priority: 2,
            });
        } else {
            methods.push({
                name: 'Foley catheter + Oxytocin liều thấp',
                detail: 'An toàn cho sẹo mổ cũ.',
                priority: 1,
            });
        }
    }

    // ROM handling
    if (hasROM) {
        warnings.push(
            '💧 Ối đã vỡ — có thể dùng Oxytocin ngay cả khi Bishop < 7 (SOGC). Tránh đặt thêm Foley khi đã vỡ ối (nguy cơ nhiễm trùng).'
        );
    }

    // Dosage info
    const dosageInfo = {
        oxytocin: {
            lowDose: 'Khởi đầu 0.5–2 mU/phút, tăng 1–2 mU/phút mỗi 15–40 phút (max 32 mU/phút)',
            highDose: 'Khởi đầu 6 mU/phút, tăng 3–6 mU/phút mỗi 15–40 phút (max 40 mU/phút)',
        },
        misoprostol: {
            vaginal: '25 mcg mỗi 3–6 giờ',
            oral: '20–25 mcg mỗi 2 giờ hoặc 50–100 mcg mỗi 4 giờ',
        },
        dinoprostone: {
            gel: '0.5 mg nội cổ tử cung',
            insert: '10 mg âm đạo (rút sau 12 giờ hoặc khi chuyển dạ)',
        },
        safeIntervals: {
            afterDinoprostoneInsert: '≥ 30 phút trước khi bắt đầu Oxytocin',
            afterDinoprostoneGel: '≥ 6 giờ',
            afterMisoprostolOral: '≥ 2 giờ',
            afterMisoprostolVaginal: '≥ 4 giờ',
        },
    };

    return { methods, warnings, dosageInfo };
}

// ─── Prompt Builder ────────────────────────────────────────

const PARITY_MAP = {
    nulliparous: 'Con so',
    multiparous: 'Con rạ',
};

const DILATION_MAP = {
    closed: 'Đóng kín',
    '1-2': '1–2 cm',
    '3-4': '3–4 cm',
    '>=5': '≥ 5 cm',
};

const EFFACEMENT_MAP = {
    '0-30': '0–30%',
    '40-50': '40–50%',
    '60-70': '60–70%',
    '>=80': '≥ 80%',
};

const STATION_MAP = {
    '-3': '−3',
    '-2': '−2',
    '-1,0': '−1 / 0',
    '+1,+2': '+1 / +2',
};

const CONSISTENCY_MAP = {
    firm: 'Cứng',
    medium: 'Trung bình',
    soft: 'Mềm',
};

const POSITION_MAP = {
    posterior: 'Sau',
    middle: 'Trung gian',
    anterior: 'Trước',
};

/**
 * Build structured AI prompt from form data and results
 * @param {Object} formData
 * @param {Object} result - { score, classification, methods }
 * @returns {string}
 */
export function buildBishopPrompt(formData, result) {
    const { score, classification, methods } = result;
    const fd = formData;

    const parityText = PARITY_MAP[fd.parity] || fd.parity;
    const dilationText = DILATION_MAP[fd.dilation] || fd.dilation;
    const effacementText = EFFACEMENT_MAP[fd.effacement] || fd.effacement;
    const stationText = STATION_MAP[fd.station] || fd.station;
    const consistencyText = CONSISTENCY_MAP[fd.consistency] || fd.consistency;
    const positionText = POSITION_MAP[fd.position] || fd.position;

    let prompt = `Tôi là bác sĩ sản khoa. Hãy phân tích trường hợp sau và đưa ra gợi ý lâm sàng dựa trên evidence-based medicine.

=== THÔNG TIN BỆNH NHÂN ===
- Tình trạng sản: ${parityText}`;

    if (fd.gaWeeks) {
        prompt += `\n- Tuổi thai: ${fd.gaWeeks} tuần${fd.gaDays ? ` ${fd.gaDays} ngày` : ''}`;
    }
    if (fd.efw) {
        prompt += `\n- EFW (ước lượng cân nặng thai): ${fd.efw} g`;
    }
    prompt += `\n- Tiền sử mổ lấy thai: ${fd.hasPriorCS ? 'Có' : 'Không'}`;

    if (fd.comorbidity && fd.comorbidity !== 'none') {
        const comorMap = {
            preeclampsia: 'Tiền sản giật',
            gdm: 'Đái tháo đường thai kỳ',
            postterm: 'Thai quá ngày',
            prom: 'Ối vỡ non (PROM)',
            other: 'Khác',
        };
        prompt += `\n- Bệnh lý kèm theo: ${comorMap[fd.comorbidity] || fd.comorbidity}`;
    }

    if (fd.inductionReason) {
        const reasonMap = {
            postterm: 'Thai quá ngày',
            preeclampsia: 'Tiền sản giật',
            prom: 'Ối vỡ non',
            elective: 'Chọn lựa',
            gdm: 'Đái tháo đường thai kỳ',
            other: 'Khác',
        };
        prompt += `\n- Lý do xem xét khởi phát: ${reasonMap[fd.inductionReason] || fd.inductionReason}`;
    }

    prompt += `

=== KHÁM CỔ TỬ CUNG ===
- Độ mở: ${dilationText}
- Độ xóa: ${effacementText}
- Mật độ: ${consistencyText}
- Vị trí: ${positionText}
- Độ lọt ngôi (Station): ${stationText}

=== KẾT QUẢ TÍNH TOÁN ===
- Bishop Score = ${score.total}/13
- Phân loại: ${classification.label} (${classification.category === 'FAVORABLE' ? '≥ 8' : classification.category === 'INTERMEDIATE' ? '6–7' : '≤ 5'})
- Đánh giá theo tình trạng sản: ${parityText} cần ≥ ${classification.threshold} → ${classification.meetsThreshold ? 'Đạt' : 'Chưa đạt'}`;

    if (methods.warnings.length > 0) {
        prompt += `\n- Lưu ý đặc biệt: ${methods.warnings.map(w => w.replace(/^[⚠️💧]\s*/u, '')).join('; ')}`;
    }

    prompt += `

=== YÊU CẦU PHÂN TÍCH ===
1. Đánh giá tiên lượng khởi phát chuyển dạ thành công (sinh đường âm đạo) dựa trên Bishop Score kết hợp ngữ cảnh lâm sàng.
2. Đề xuất phương pháp khởi phát phù hợp (Oxytocin, Misoprostol, Dinoprostone, Foley catheter, hoặc kết hợp) — giải thích lý do.
3. Nếu Bishop Score thấp, đề xuất phương pháp cervical ripening trước khởi phát, kèm liều lượng và thời gian.
4. Lưu ý nếu có chống chỉ định (sẹo mổ cũ → không dùng prostaglandin).
5. Nêu các yếu tố thuận lợi và bất lợi bổ sung (tuổi thai, cân nặng thai, bệnh lý đi kèm).
6. Trích dẫn guideline (ACOG, SOGC, AAFP, WHO) nếu có.

[Lưu ý: Kết quả chỉ mang tính hỗ trợ lâm sàng, KHÔNG thay thế đánh giá của bác sĩ chuyên khoa]

Vui lòng trả lời bằng tiếng Việt, trình bày có cấu trúc rõ ràng, dùng ngôn ngữ y khoa chuyên nghiệp.`;

    return prompt;
}

// ─── Validation ────────────────────────────────────────────

/**
 * Validate Bishop Score inputs
 * @param {Object} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBishopInputs(data) {
    const validValues = {
        dilation: ['closed', '1-2', '3-4', '>=5'],
        effacement: ['0-30', '40-50', '60-70', '>=80'],
        station: ['-3', '-2', '-1,0', '+1,+2'],
        consistency: ['firm', 'medium', 'soft'],
        position: ['posterior', 'middle', 'anterior'],
        parity: ['nulliparous', 'multiparous'],
    };

    if (!data.dilation || !validValues.dilation.includes(data.dilation)) {
        return { valid: false, error: 'Vui lòng chọn độ mở cổ tử cung.' };
    }
    if (!data.effacement || !validValues.effacement.includes(data.effacement)) {
        return { valid: false, error: 'Vui lòng chọn độ xóa cổ tử cung.' };
    }
    if (!data.station || !validValues.station.includes(data.station)) {
        return { valid: false, error: 'Vui lòng chọn độ lọt ngôi thai.' };
    }
    if (!data.consistency || !validValues.consistency.includes(data.consistency)) {
        return { valid: false, error: 'Vui lòng chọn mật độ cổ tử cung.' };
    }
    if (!data.position || !validValues.position.includes(data.position)) {
        return { valid: false, error: 'Vui lòng chọn vị trí cổ tử cung.' };
    }
    if (!data.parity || !validValues.parity.includes(data.parity)) {
        return { valid: false, error: 'Vui lòng chọn tình trạng sản (con so / con rạ).' };
    }

    if (data.gaWeeks != null) {
        const ga = parseInt(data.gaWeeks, 10);
        if (isNaN(ga) || ga < 20 || ga > 42) {
            return { valid: false, error: 'Tuổi thai phải từ 20 đến 42 tuần.' };
        }
    }

    if (data.efw != null && data.efw !== '') {
        const efw = parseInt(data.efw, 10);
        if (isNaN(efw) || efw < 500 || efw > 6000) {
            return { valid: false, error: 'Cân nặng thai ước lượng phải từ 500 đến 6000 g.' };
        }
    }

    return { valid: true };
}

// ─── Exports Table Reference ───────────────────────────────

export { BISHOP_TABLES, FAVORABLE_THRESHOLD };
