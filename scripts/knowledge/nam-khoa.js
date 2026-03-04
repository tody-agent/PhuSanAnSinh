export const enrichNamKhoa = (article) => {
    let mainContent = article.mainContent;
    let doctorAdvice = article.doctorAdvice;
    let treatment = article.treatment;
    let intro = article.intro;

    // Generic fallback for Nam Khoa (Men's Health)
    intro = `Nam khoa là lĩnh vực y tế chuyên về sức khỏe sinh sản và sinh lý nam giới. Tuy nhiên, nhiều nam giới Nam giới Việt Nam vẫn còn e ngại đi khám, dẫn tới phát hiện và điều trị muộn bệnh lý liên quan như yếu sinh lý, rối loạn cương dương, hay vô sinh nam. Bài viết về ${article.title.toLowerCase()} sẽ giúp bạn giải tỏa lo âu này.`;

    if (article.slug.includes('-nam-')) {
        mainContent = `### Các khía cạnh y khoa cần biết:\n\n` +
            `- **Sức khỏe toàn diện:** Sức khỏe sinh dục nam phản ánh sức khỏe hệ tim mạch và tuần hoàn.\n` +
            `- **Dinh dưỡng và sinh hoạt:** Hút thuốc, uống rượu bia nhiều hay thức khuya làm suy giảm chức năng sản xuất tinh trùng.\n` +
            `- **Môi trường làm việc:** Tiếp xúc nhiệt độ cao hoặc hóa chất độc hại ảnh hưởng đến chất lượng tinh binh.\n\n` +
            `Sự chủ động trong thăm khám nam khoa định kỳ sẽ giúp nam giới duy trì bản lĩnh phòng the và sức khỏe sinh sản dài lâu.`;
        doctorAdvice = `Khám nam khoa không đáng sợ. Đừng để tâm lý e ngại tước đi cơ hội làm cha và hạnh phúc gia đình. Tại An Sinh, chúng tôi bảo mật thông tin khách hàng tuyệt đối 100%.`;
        treatment = `- **Nội khoa:** Sử dụng thuốc điều trị rối loạn cương dương, suy giảm testosterone.\n` +
            `- **Ngoại khoa:** Phẫu thuật giãn tĩnh mạch thừng tinh, tắc ống dẫn tinh.\n` +
            `- **Tư vấn lối sống:** Thay đổi thói quen dinh dưỡng, tập thể dục tránh béo phì.`;
    }

    return { intro, mainContent, doctorAdvice, treatment };
};
