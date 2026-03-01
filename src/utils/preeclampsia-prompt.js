/**
 * Preeclampsia Screening — Prompt Builder
 * Assembles a complete LLM prompt from patient data, engine results, and FAQ.
 * Doctor pastes this into any LLM (ChatGPT/Claude/Gemini) for detailed explanation.
 */

import { FAQ_DATABASE } from './preeclampsia-knowledge.js';

/**
 * Build a complete prompt string for LLM consultation
 * @param {object} patient - preprocessed patient data
 * @param {object} result - from screenPatient()
 * @param {Array} [faqDatabase] - defaults to FAQ_DATABASE
 * @returns {string}
 */
export function buildPrompt(patient, result, faqDatabase = FAQ_DATABASE) {
    const lines = [];

    // ═══════ PART 1: INSTRUCTION ═══════
    lines.push(`=== HƯỚNG DẪN CHO AI ===

Bạn là trợ lý y khoa sản khoa. Bác sĩ cung cấp dữ liệu bệnh nhân đã được
phần mềm sàng lọc tự động phân loại nguy cơ tiền sản giật.

NGUYÊN TẮC:
1. Kết quả phân loại nguy cơ đã được tính bởi engine — KHÔNG thay đổi phân loại.
2. Nhiệm vụ của bạn: diễn giải kết quả, giải thích cho bác sĩ, tạo báo cáo lâm sàng bằng tiếng Việt.
3. Khi trích dẫn, dùng nguồn có trong phần KNOWLEDGE BASE bên dưới.
4. Luôn kết thúc bằng: "Đây là hỗ trợ lâm sàng. Quyết định cuối cùng thuộc bác sĩ điều trị."
5. Trả lời bằng tiếng Việt.
`);

    // ═══════ PART 2: PATIENT DATA ═══════
    const gaText = patient.gestational_age_weeks != null
        ? `${patient.gestational_age_weeks} tuần${patient.gestational_age_days ? ' ' + patient.gestational_age_days + ' ngày' : ''}`
        : 'Chưa xác định';

    lines.push(`=== DỮ LIỆU BỆNH NHÂN ===

Họ tên: ${patient.name || 'Không có'}
Tuổi mẹ: ${patient.maternal_age || 'Không có'}
Tuổi thai: ${gaText}
BMI trước mang thai: ${patient.bmi || 'Không có'}

Yếu tố nguy cơ CAO phát hiện: ${result.acog_high_factors.length > 0 ? result.acog_high_factors.join(', ') : 'Không có'}
Yếu tố nguy cơ TRUNG BÌNH phát hiện: ${result.acog_moderate_factors.length > 0 ? result.acog_moderate_factors.join(', ') : 'Không có'}
`);

    // ═══════ PART 3: ENGINE RESULTS ═══════
    const aspirinACOG = result.acog_aspirin === true ? 'Có'
        : result.acog_aspirin === 'CONSIDER' ? 'Cân nhắc'
            : 'Không';
    const aspirinNICE = result.nice_aspirin ? 'Có' : 'Không';
    const agreeText = result.guidelines_agree
        ? 'Có'
        : 'KHÔNG — ' + result.discordance_reasons.join('; ');

    lines.push(`=== KẾT QUẢ PHÂN LOẠI (đã tính bởi phần mềm — không thay đổi) ===

Phân loại ACOG/USPSTF 2021: ${result.acog_category}
  Số yếu tố nhóm A: ${result.acog_high_factors.length}
  Số yếu tố nhóm B: ${result.acog_moderate_factors.length}
  Khuyến cáo aspirin (ACOG): ${aspirinACOG}

Phân loại NICE NG133: ${result.nice_category}
  Khuyến cáo aspirin (NICE): ${aspirinNICE}

Hai guideline đồng thuận: ${agreeText}
`);

    if (result.aspirin_dose) {
        lines.push(`Aspirin:
  Liều: ${result.aspirin_dose}
  Thời điểm: ${result.aspirin_timing || 'Chưa xác định'}
  Mức độ khẩn: ${result.aspirin_urgency || 'Chưa xác định'}
`);
    }

    lines.push(`Lịch theo dõi đề xuất:
${result.follow_up_items.map(item => '- ' + item).join('\n')}

Triệu chứng cảnh báo cần dặn bệnh nhân:
${result.warning_signs.map(item => '- ' + item).join('\n')}
`);

    // ═══════ PART 4: KNOWLEDGE BASE ═══════
    lines.push('=== KNOWLEDGE BASE (dùng để trả lời câu hỏi bác sĩ) ===\n');
    for (const faq of faqDatabase) {
        lines.push(`H: ${faq.q}`);
        lines.push(`Đ: ${faq.a}\n`);
    }

    // ═══════ PART 5: OUTPUT REQUEST ═══════
    lines.push(`=== YÊU CẦU ===

Dựa trên dữ liệu trên, hãy:

1. Tóm tắt ngắn gọn hồ sơ bệnh nhân (2-3 câu).
2. Giải thích tại sao được phân loại mức nguy cơ này (liệt kê yếu tố, trích guideline).
3. Nếu có khuyến cáo aspirin: nêu liều, thời điểm bắt đầu, cách dùng, thời điểm dừng, kèm trích dẫn ASPRE trial.
4. Nếu ACOG và NICE không đồng thuận: giải thích sự khác biệt.
5. Liệt kê lịch theo dõi cụ thể cho bệnh nhân này.
6. Liệt kê triệu chứng cảnh báo cần dặn bệnh nhân.
7. Nếu bác sĩ hỏi thêm, trả lời dựa trên KNOWLEDGE BASE ở trên.`);

    return lines.join('\n');
}
