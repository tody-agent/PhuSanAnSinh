/**
 * Ovarian Tumor Risk — Prompt Builder
 * Assembles a complete LLM prompt from patient data and engine results.
 * Doctor pastes this into any LLM (ChatGPT/Claude/Gemini) for detailed analysis.
 */

/**
 * Build a complete prompt string for LLM consultation
 * @param {object} data - patient data
 * @param {object} result - from screenPatient()
 * @returns {string}
 */
export function buildPrompt(data, result) {
    const lines = [];

    const menoStatus = data.postmenopausal ? 'Hậu mãn kinh' : 'Tiền mãn kinh';
    const he4Text = data.hasHE4 && data.he4 ? `${data.he4} pmol/L` : 'Không có';
    const systemLabel = data.he4System === 'abbott' ? 'Abbott Architect' : 'Roche Elecsys';

    const riskLabel = { HIGH: 'CAO', MODERATE: 'TRUNG BÌNH', LOW: 'THẤP' };

    // ═══ INSTRUCTION ═══
    lines.push(`Bạn là chuyên gia tư vấn ung thư phụ khoa. Hãy phân tích ca lâm sàng dưới đây 
và đưa ra gợi ý xử trí dựa trên hướng dẫn RCOG Green-top Guideline No. 62, 
NICE CG122, và ACOG Practice Bulletin.`);

    // ═══ PATIENT DATA ═══
    lines.push(`
═══ DỮ LIỆU BỆNH NHÂN ═══
• Tuổi: ${data.age || 'Không rõ'}
• Tình trạng kinh nguyệt: ${menoStatus}
• CA-125: ${data.ca125 || 'Không rõ'} U/mL
• HE4: ${he4Text}
• Hệ thống xét nghiệm HE4: ${data.hasHE4 ? systemLabel : 'Không áp dụng'}`);

    // ═══ ULTRASOUND ═══
    const usYN = (val) => val ? 'Có' : 'Không';
    lines.push(`
═══ SIÊU ÂM ═══
• Kích thước khối u: ${data.tumorSizeCm || 'Không rõ'} cm
• Nang đa thùy: ${usYN(data.ultrasound.multilocular)}
• Thành phần đặc: ${usYN(data.ultrasound.solid)}
• Di căn ổ bụng: ${usYN(data.ultrasound.metastases)}
• Dịch ổ bụng: ${usYN(data.ultrasound.ascites)}
• Tổn thương hai bên: ${usYN(data.ultrasound.bilateral)}`);

    // ═══ CALCULATED RESULTS ═══
    lines.push(`
═══ KẾT QUẢ TÍNH TOÁN ═══
• Tổng điểm siêu âm: ${result.usScore}/5
• RMI 1 = ${result.rmi1.toLocaleString()} → Phân loại: ${riskLabel[result.rmi1Cat]}
• RMI 2 = ${result.rmi2.toLocaleString()} → Phân loại: ${riskLabel[result.rmi2Cat]}
• RMI 3 = ${result.rmi3.toLocaleString()} → Phân loại: ${riskLabel[result.rmi3Cat]}
• RMI 4 = ${result.rmi4.toLocaleString()} → Phân loại: ${riskLabel[result.rmi4Cat]}`);

    if (result.hasHE4) {
        lines.push(`• ROMA = ${result.roma}% → Phân loại: ${riskLabel[result.romaCat]} (Ngưỡng: ≥${result.romaCutoff}%)`);
    } else {
        lines.push(`• ROMA: Không tính được (thiếu HE4)`);
    }

    if (result.discordance) {
        lines.push(`
⚠ LƯU Ý: Bất đồng giữa RMI (${riskLabel[result.discordance.rmi1]}) và ROMA (${riskLabel[result.discordance.roma]}).
→ ${result.discordance.action}`);
    }

    if (result.rmi1ZeroWarning) {
        lines.push(`
⚠ LƯU Ý: RMI 1 = 0 do không có đặc điểm siêu âm nào (U=0 trong phiên bản 1). 
Điều này KHÔNG có nghĩa an toàn 100%. Nên tham khảo RMI 2/3/4 hoặc ROMA.`);
    }

    // ═══ ADDITIONAL INFO ═══
    if (data.symptoms || data.familyHistory || data.otherNotes) {
        lines.push(`
═══ THÔNG TIN BỔ SUNG ═══`);
        if (data.symptoms) lines.push(`• Triệu chứng: ${data.symptoms}`);
        if (data.familyHistory) lines.push(`• Tiền sử gia đình: ${data.familyHistory}`);
        if (data.otherNotes) lines.push(`• Khác: ${data.otherNotes}`);
    }

    // ═══ ANALYSIS REQUEST ═══
    lines.push(`
═══ YÊU CẦU PHÂN TÍCH ═══
1. Đánh giá tổng hợp nguy cơ ác tính dựa trên TẤT CẢ chỉ số trên.
2. Nêu mức độ phù hợp/bất phù hợp giữa các chỉ số (nếu có).
3. Liệt kê CHẨN ĐOÁN PHÂN BIỆT (ung thư biểu mô thanh dịch, nhầy, 
   dạng nội mạc tử cung, tế bào sáng, u tế bào mầm, u mô đệm, 
   di căn từ nơi khác, u lành tính...).
4. ĐỀ XUẤT BƯỚC TIẾP THEO cụ thể:
   a) Cần xét nghiệm bổ sung gì? (HE4 nếu chưa có, AFP, beta-hCG, 
      LDH, inhibin nếu nghi u tế bào mầm/mô đệm)
   b) Cần hình ảnh bổ sung gì? (MRI vùng chậu, CT ngực-bụng-chậu)
   c) Chuyển tuyến hay theo dõi? Nếu chuyển, mức độ khẩn cấp?
   d) Hướng phẫu thuật đề xuất (nội soi vs mổ mở, bảo tồn vs triệt để)?
5. Nêu rõ CÁC HẠN CHẾ cần lưu ý:
   - CA-125 có thể tăng giả trong: lạc nội mạc tử cung, u xơ tử cung, 
     viêm vùng chậu, xơ gan, suy tim, lao phúc mạc, thai kỳ.
   - RMI/ROMA kém hiệu quả hơn với u nhầy, u tế bào mầm, u mô đệm, 
     u giáp biên (borderline).
   - Kết quả này KHÔNG thay thế được mô bệnh học.
6. Nếu nguy cơ THẤP: đề xuất lịch theo dõi siêu âm và CA-125 
   (khoảng cách, thời gian).
7. Nếu nguy cơ CAO: đề xuất quy trình chuyển tuyến cụ thể.

Hãy trả lời bằng tiếng Việt, sử dụng định dạng rõ ràng, có đánh số. 
Lưu ý: đây là công cụ hỗ trợ quyết định, KHÔNG thay thế phán đoán 
lâm sàng của bác sĩ.`);

    return lines.join('\n');
}
