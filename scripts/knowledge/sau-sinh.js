export const enrichSauSinh = (article) => {
    let mainContent = article.mainContent;
    let doctorAdvice = article.doctorAdvice;
    let intro = article.intro;
    let checklistItems = article.checklistItems;

    intro = `Giai đoạn hậu sản (sau sinh) là khoảng thời gian tối quan trọng để cơ thể người mẹ hồi phục từ những tổn thương trong suốt 9 tháng mang thai và quá trình vượt cạn. Kiến thức về ${article.title.toLowerCase()} không chỉ giúp cải thiện sức khỏe thể chất mà còn bảo vệ mẹ khỏi bóng đêm trầm cảm sau sinh.`;

    if (article.slug.includes('sau-sinh')) {
        mainContent = `### Những vấn đề mẹ sau sinh thường gặp:\n\n` +
            `- **Trầm cảm (PPD):** Gặp ở hơn 15% phụ nữ sau sinh do sự sụt giảm đột ngột của hormone Estrogen và Progesterone.\n` +
            `- **Khó khăn khi cho con bú:** Tắc tia sữa, viêm tuyến vú, hoặc nứt cổ gà.\n` +
            `- **Phục hồi thể chất:** Cơ sàn chậu suy yếu, sa tử cung, táo bón.\n\n` +
            `Việc chia sẻ gánh nặng chăm sóc bé với gia đình và tìm kiếm hỗ trợ y tế chuyên nghiệp là rất cần thiết.`;
        doctorAdvice = `Hãy theo dõi sản dịch, giữ vệ sinh vùng kín để tránh nhiễm trùng hậu sản. Cần tái khám ngay nếu sản dịch có mùi hôi, mẹ sốt cao, hoặc có suy nghĩ làm hại bản thân hay em bé.`;
        checklistItems = `- [X] Khám sức khỏe tổng quát sau sinh (từ 4-6 tuần hậu sản)\n` +
            `- [X] Ăn đủ chất, uống nhiều nước ấm (2.5 - 3 lít/ngày) để duy trì sữa\n` +
            `- [X] Tập các bài tập Kegel nhẹ nhàng để phòng ngừa sa tạng chậu\n` +
            `- [X] Trò chuyện với người thân khi cảm thấy quá căng thẳng`;
    }

    return { intro, mainContent, doctorAdvice, checklistItems };
};
