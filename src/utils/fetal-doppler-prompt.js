/**
 * Fetal Doppler — Prompt Builder
 * Assembles a complete LLM prompt from patient data + engine results.
 * Doctor pastes this into ChatGPT/Claude/Gemini for clinical guidance.
 */

/**
 * Build the full AI prompt
 * @param {object} input - raw form data
 * @param {object} result - from analyzeDoppler()
 * @returns {string}
 */
export function buildDopplerPrompt(input, result) {
    const lines = [];

    // ═══════ INSTRUCTION ═══════
    lines.push(`Bạn là chuyên gia y khoa Sản-Phụ khoa, chuyên sâu về Y học Bào thai (Maternal-Fetal Medicine). Hãy phân tích dữ liệu Doppler thai nhi dưới đây và đưa ra gợi ý lâm sàng.`);

    // ═══════ PATIENT INFO ═══════
    const scenarios = {
        routine: 'Theo dõi thường quy',
        fgr: 'Nghi ngờ FGR (Thai chậm tăng trưởng)',
        rh: 'Bất đồng Rh / Nghi thiếu máu thai',
        preeclampsia: 'Tiền sản giật / Tăng huyết áp thai kỳ',
        postterm: 'Thai quá ngày',
        other: input.otherScenario || 'Khác',
    };

    lines.push(`
═══ THÔNG TIN BỆNH NHÂN ═══
• Tuổi mẹ: ${input.motherAge || 'N/A'} tuổi
• Tuổi thai (GA): ${result.gaText}
• Con số mấy: ${input.parity === 'nullipara' ? 'Nullipara (con so)' : input.parity === 'multipara' ? 'Multipara (con rạ)' : 'N/A'}
• BMI: ${input.bmi || 'N/A'}
• Tình huống lâm sàng: ${scenarios[input.clinicalScenario] || 'Theo dõi thường quy'}
• Tiền sử đặc biệt: ${input.history || 'Không'}
`);

    // ═══════ RAW DOPPLER VALUES ═══════
    lines.push(`═══ KẾT QUẢ DOPPLER ĐO ĐƯỢC ═══`);
    lines.push(`
1. Động mạch rốn (UA):
   • S/D ratio = ${input.uaSd || 'N/A'}
   • RI = ${input.uaRi || 'N/A'}
   • PI = ${input.uaPi || 'N/A'}
   • End-diastolic flow: ${result.endDiastolic === 'present' ? 'Có' : result.endDiastolic === 'AEDF' ? 'Vắng (AEDF)' : 'Đảo ngược (REDF)'}
`);

    if (input.mcaPsv || input.mcaPi) {
        lines.push(`2. Động mạch não giữa (MCA):
   • MCA-PSV = ${input.mcaPsv || 'N/A'} cm/s
   • MCA-PI = ${input.mcaPi || 'N/A'}
`);
    }

    if (result.uta) {
        lines.push(`3. Động mạch tử cung (UtA):
   • UtA-PI trung bình = ${result.uta.piMean}
   • Notching: ${result.uta.notching === 'none' ? 'Không' : result.uta.notching === 'unilateral' ? 'Một bên' : 'Hai bên'}
`);
    }

    // ═══════ CALCULATED RESULTS ═══════
    lines.push(`═══ KẾT QUẢ TÍNH TOÁN (đã tính sẵn) ═══`);

    // A. UA (INTERGROWTH-21st)
    if (result.uaIG21_PI) {
        const r = result.uaIG21_PI;
        const status = r.centile > 95 ? 'Bất thường > 95th' : 'Bình thường';
        lines.push(`
A. UA Doppler (Ref: INTERGROWTH-21st, Drukker 2020):
   • UA-PI: Median kỳ vọng = ${r.median}, Đo = ${input.uaPi}, MoM = ${r.mom}
   • Centile ước tính = ${r.centile}th → ${status}`);
    }
    if (result.uaIG21_RI) {
        lines.push(`   • UA-RI: Median kỳ vọng = ${result.uaIG21_RI.median}, Đo = ${input.uaRi}, MoM = ${result.uaIG21_RI.mom}`);
    }
    if (result.uaIG21_SD) {
        lines.push(`   • UA-S/D: Median kỳ vọng = ${result.uaIG21_SD.median}, Đo = ${input.uaSd}, MoM = ${result.uaIG21_SD.mom}`);
    }

    // B. MCA-PSV (Mari)
    if (result.mcaPsv) {
        const m = result.mcaPsv;
        let classText = '< 1.0 bình thường';
        if (m.anemiaClass === 'SEVERE_MODERATE') classText = '≥ 1.5 thiếu máu trung bình-nặng';
        else if (m.anemiaClass === 'MILD') classText = '1.29-1.5 thiếu máu nhẹ';
        else if (m.mom >= 1.0) classText = '1.0-1.29 theo dõi';
        lines.push(`
B. MCA-PSV (Ref: Mari et al. 2000):
   • Median PSV kỳ vọng = ${m.median} cm/s
   • PSV đo được = ${input.mcaPsv} cm/s
   • MoM = ${m.mom} → ${classText}`);
    }

    // C. FMF (Ciobanu)
    if (result.fmf) {
        const f = result.fmf;
        lines.push(`
C. FMF Doppler (Ref: Ciobanu et al. 2019):
   • UA-PI: Đo = ${f.uaPi_measured}, 50th = ${f.uaPi_50th}, 95th = ${f.uaPi_95th} → ${f.uaPi_status === 'ABNORMAL' ? 'Bất thường' : 'Bình thường'}
   • MCA-PI: Đo = ${f.mcaPi_measured}, 50th = ${f.mcaPi_50th}, 5th = ${f.mcaPi_5th} → ${f.mcaPi_status === 'ABNORMAL' ? 'Brain-sparing < 5th' : 'Bình thường'}
   • CPR = MCA-PI/UA-PI = ${f.cpr}, 50th = ${f.cpr_50th}, 5th = ${f.cpr_5th} → ${f.cpr_status === 'ABNORMAL' ? 'Bất thường < 5th' : 'Bình thường'}`);
    }

    // D. UtA-PI (Gómez)
    if (result.uta) {
        const u = result.uta;
        lines.push(`
D. UtA-PI (Ref: Gómez et al. 2008):
   • UtA-PI đo = ${u.piMean}, Median = ${u.refMean}, 95th = ${u.ref95th}
   • → ${u.status === 'ABNORMAL' ? 'Bất thường > 95th' : 'Bình thường'}
   • Notching: ${u.notching === 'none' ? 'Không' : u.notching === 'unilateral' ? 'Một bên' : 'Hai bên'}`);
    }

    // ═══════ CLASSIFICATION ═══════
    const severityLabels = {
        NORMAL: 'BÌNH THƯỜNG',
        ABNORMAL: 'BẤT THƯỜNG',
        SEVERE: 'NẶNG',
        CRITICAL: 'NGUY KỊCH',
    };
    lines.push(`
═══ ĐÁNH GIÁ TỔNG QUAN ═══
Mức độ: ${severityLabels[result.classification.severity] || result.classification.severity}
${result.classification.alerts.length > 0 ? 'Cảnh báo:\n' + result.classification.alerts.map(a => '⚠ ' + a).join('\n') : 'Không có cảnh báo đặc biệt.'}
${result.classification.fgrStage ? '\nPhân loại FGR: ' + result.classification.fgrStage : ''}
`);

    // ═══════ REQUEST ═══════
    lines.push(`═══ YÊU CẦU PHÂN TÍCH ═══

Dựa trên dữ liệu trên, hãy:

1. **ĐÁNH GIÁ TỔNG QUÁT**: Tóm tắt tình trạng Doppler thai – bình thường hay bất thường? Mức độ nghiêm trọng?

2. **PHÂN TÍCH CHI TIẾT TỪNG CHỈ SỐ**:
   a. UA Doppler: Đánh giá trở kháng nhau thai. Nếu bất thường, phân loại mức độ (PI tăng nhẹ / AEDF / REDF).
   b. MCA-PSV: Đánh giá nguy cơ thiếu máu thai nhi. Nếu MoM ≥ 1.5, bàn luận về chỉ định cordocentesis hoặc truyền máu trong tử cung.
   c. MCA-PI & CPR: Đánh giá hiện tượng brain-sparing effect. Ý nghĩa lâm sàng khi CPR < 5th centile.
   d. UtA-PI: Đánh giá sức cản mạch máu tử cung-nhau thai. Liên quan tiền sản giật / FGR.

3. **PHÂN LOẠI GIAI ĐOẠN** (nếu nghi FGR):
   Dựa trên Delphi consensus classification:
   - Early-onset FGR (< 32 tuần) vs Late-onset FGR (≥ 32 tuần)
   - Stage I (UA-PI > 95th), Stage II (AEDF), Stage III (REDF hoặc DV bất thường)

4. **ĐỀ XUẤT QUẢN LÝ**:
   a. Tần suất theo dõi Doppler khuyến cáo
   b. Thời điểm cân nhắc chấm dứt thai kỳ
   c. Corticosteroid nếu thai < 34 tuần + tiên lượng xấu
   d. Tư vấn chuyển tuyến nếu cần
   e. Các xét nghiệm bổ sung cần làm (NST, BPP, ductus venosus Doppler...)

5. **CẢNH BÁO ĐẶC BIỆT** (nếu có):
   - AEDF/REDF → nhập viện theo dõi sát
   - MCA-PSV MoM ≥ 1.5 → cân nhắc cordocentesis
   - CPR < 5th + UtA-PI > 95th → nguy cơ cao kết cục bất lợi

6. **TÀI LIỆU THAM KHẢO**: Liệt kê các guideline áp dụng (ISUOG, SMFM, FIGO, RCOG).

Lưu ý: Đây chỉ là gợi ý hỗ trợ lâm sàng. Mọi quyết định điều trị phải do bác sĩ chịu trách nhiệm dựa trên toàn bộ bối cảnh lâm sàng.`);

    return lines.join('\n');
}
