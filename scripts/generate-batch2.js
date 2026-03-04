import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MATRIX_FILE = path.join(__dirname, 'content-matrix.json');

const newArticles = [
    // 🤰 Pillar 1: MANG THAI (201-220)
    { slug: "mang-thai-41", title: "Mang thai 3 tháng đầu nên ăn gì kiêng gì", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-42", title: "Thai 12 tuần phát triển như thế nào", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-43", title: "Thai 20 tuần phát triển và các mốc khám quan trọng", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-44", title: "Thai 32 tuần: Chuẩn bị gì cho giai đoạn cuối", type: "checklist", category: "mang-thai" },
    { slug: "mang-thai-45", title: "Chuẩn bị đồ đi sinh: Checklist đầy đủ cho mẹ bầu", type: "checklist", category: "mang-thai" },
    { slug: "mang-thai-46", title: "Dấu hiệu chuyển dạ thật và giả", type: "comparison", category: "mang-thai" },
    { slug: "mang-thai-47", title: "Sinh thường hay sinh mổ: So sánh ưu nhược điểm", type: "comparison", category: "mang-thai" },
    { slug: "mang-thai-48", title: "Gây tê ngoài màng cứng khi sinh: An toàn không", type: "treatment", category: "mang-thai" },
    { slug: "mang-thai-49", title: "Thiếu máu khi mang thai: Nguyên nhân và cách bổ sung", type: "symptom", category: "mang-thai" },
    { slug: "mang-thai-50", title: "Tăng cân thai kỳ bao nhiêu là đủ theo BMI", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-51", title: "Bầu bị cảm cúm uống thuốc gì an toàn", type: "faq", category: "mang-thai" },
    { slug: "mang-thai-52", title: "Chăm sóc sau sinh: 42 ngày vàng cho mẹ", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-53", title: "Trầm cảm sau sinh: Dấu hiệu và cách vượt qua", type: "symptom", category: "mang-thai" },
    { slug: "mang-thai-54", title: "Cho con bú và cách kích sữa hiệu quả", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-55", title: "Tập thể dục khi mang thai: Bài tập an toàn cho bà bầu", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-56", title: "Mang thai ngoài ý muốn: Lựa chọn và hỗ trợ", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-57", title: "Ăn dặm cho bé 6 tháng: Lịch trình và thực đơn", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-58", title: "Mang thai đôi: Lưu ý và theo dõi đặc biệt", type: "guide", category: "mang-thai" },
    { slug: "mang-thai-59", title: "Vỡ ối sớm: Dấu hiệu và cách xử lý khẩn cấp", type: "symptom", category: "mang-thai" },
    { slug: "mang-thai-60", title: "Sàng lọc sơ sinh: Xét nghiệm gót chân cho bé", type: "guide", category: "mang-thai" },

    // 🩺 Pillar 2: PHỤ KHOA (221-235)
    { slug: "phu-khoa-31", title: "Tiền mãn kinh: Dấu hiệu và cách quản lý", type: "symptom", category: "phu-khoa" },
    { slug: "phu-khoa-32", title: "Mãn kinh sớm: Nguyên nhân và điều trị", type: "treatment", category: "phu-khoa" },
    { slug: "phu-khoa-33", title: "Rối loạn nội tiết tố nữ: Triệu chứng và xét nghiệm", type: "symptom", category: "phu-khoa" },
    { slug: "phu-khoa-34", title: "Đặt vòng tránh thai hay uống thuốc: So sánh chi tiết", type: "comparison", category: "phu-khoa" },
    { slug: "phu-khoa-35", title: "Ung thư cổ tử cung: Tầm soát và phòng ngừa", type: "guide", category: "phu-khoa" },
    { slug: "phu-khoa-36", title: "Viêm nhiễm phụ khoa mùa hè: Phòng tránh hiệu quả", type: "guide", category: "phu-khoa" },
    { slug: "phu-khoa-37", title: "Nội soi buồng tử cung: Khi nào cần thực hiện", type: "treatment", category: "phu-khoa" },
    { slug: "phu-khoa-38", title: "Cắt polyp cổ tử cung: Quy trình và hồi phục", type: "treatment", category: "phu-khoa" },
    { slug: "phu-khoa-39", title: "Thụt rửa vùng kín: Nên hay không nên", type: "faq", category: "phu-khoa" },
    { slug: "phu-khoa-40", title: "Đau vùng chậu mạn tính ở phụ nữ", type: "symptom", category: "phu-khoa" },
    { slug: "phu-khoa-41", title: "Checklist khám phụ khoa định kỳ theo độ tuổi", type: "checklist", category: "phu-khoa" },
    { slug: "phu-khoa-42", title: "Lạc nội mạc tử cung có mang thai được không", type: "faq", category: "phu-khoa" },
    { slug: "phu-khoa-43", title: "Viêm tuyến Bartholin: Nguyên nhân và điều trị", type: "treatment", category: "phu-khoa" },
    { slug: "phu-khoa-44", title: "Huyết trắng ra nhiều: Khi nào cần lo lắng", type: "symptom", category: "phu-khoa" },
    { slug: "phu-khoa-45", title: "Soi cổ tử cung hay Pap smear: Nên làm cái nào", type: "comparison", category: "phu-khoa" },

    // 👶 Pillar 3: HIẾM MUỘN (236-250)
    { slug: "hiem-muon-nu-36", title: "Dự trữ buồng trứng thấp: Còn cơ hội mang thai không", type: "faq", category: "hiem-muon" },
    { slug: "hiem-muon-nu-37", title: "Bơm tinh trùng IUI thất bại: Nguyên nhân và bước tiếp", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-nu-38", title: "Chuyển phôi thất bại nhiều lần: Giải pháp", type: "treatment", category: "hiem-muon" },
    { slug: "hiem-muon-nu-39", title: "Yoga và hiếm muộn: Bài tập hỗ trợ thụ thai", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-nu-40", title: "Thai sinh hóa là gì: Nguyên nhân và cách phòng tránh", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-nam-21", title: "Tinh trùng dị dạng: Có thể cải thiện được không", type: "faq", category: "hiem-muon" },
    { slug: "hiem-muon-nam-22", title: "Testosterone thấp ảnh hưởng sinh sản nam", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-nam-23", title: "Hút thuốc lá và chất lượng tinh trùng", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-nam-24", title: "So sánh IUI và quan hệ tự nhiên tỷ lệ thành công", type: "comparison", category: "hiem-muon" },
    { slug: "hiem-muon-nam-25", title: "Checklist xét nghiệm hiếm muộn cho cặp vợ chồng", type: "checklist", category: "hiem-muon" },
    { slug: "hiem-muon-56", title: "Châm cứu hỗ trợ điều trị hiếm muộn", type: "treatment", category: "hiem-muon" },
    { slug: "hiem-muon-57", title: "Chi phí điều trị hiếm muộn: Bảng giá chi tiết 2026", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-58", title: "Hành trình vượt qua hiếm muộn: Câu chuyện thực tế", type: "journey", category: "hiem-muon" },
    { slug: "hiem-muon-59", title: "Mang thai sau 40 tuổi: Rủi ro và cơ hội", type: "guide", category: "hiem-muon" },
    { slug: "hiem-muon-60", title: "Xét nghiệm di truyền phôi PGT: Có cần thiết", type: "faq", category: "hiem-muon" },

    // 🔬 Pillar 4: SIÊU ÂM (251-260)
    { slug: "sieu-am-26", title: "Siêu âm đầu dò âm đạo: Khi nào cần làm", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-27", title: "Siêu âm Doppler mạch máu: Ý nghĩa kết quả", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-28", title: "So sánh siêu âm 2D 3D 4D 5D: Nên chọn loại nào", type: "comparison", category: "sieu-am" },
    { slug: "sieu-am-29", title: "Đọc kết quả siêu âm thai: Hướng dẫn cho mẹ bầu", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-30", title: "Siêu âm tim thai: Khi nào và tại sao cần làm", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-31", title: "Siêu âm ổ bụng tổng quát: Checklist chuẩn bị", type: "checklist", category: "sieu-am" },
    { slug: "sieu-am-32", title: "Siêu âm phụ khoa phát hiện được bệnh gì", type: "faq", category: "sieu-am" },
    { slug: "sieu-am-33", title: "Siêu âm theo dõi nang trứng trong điều trị hiếm muộn", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-34", title: "Giá siêu âm 5D thai nhi tại Bắc Ninh 2026", type: "guide", category: "sieu-am" },
    { slug: "sieu-am-35", title: "Siêu âm tuyến vú: Tầm soát ung thư vú sớm", type: "guide", category: "sieu-am" },

    // 💚 Pillar 5: SỨC KHỎE SINH SẢN (261-275)
    { slug: "skss-21", title: "Tuổi dậy thì nữ: Thay đổi cơ thể và tâm lý", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-22", title: "Kinh nguyệt lần đầu: Hướng dẫn cho con gái", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-23", title: "Quan hệ tình dục an toàn: Hướng dẫn toàn diện", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-24", title: "Các phương pháp tránh thai: So sánh hiệu quả", type: "comparison", category: "suc-khoe-sinh-san" },
    { slug: "skss-25", title: "Viêm gan B và mang thai: Những điều cần biết", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-26", title: "HIV và sinh sản: Có thể có con khỏe mạnh", type: "faq", category: "suc-khoe-sinh-san" },
    { slug: "skss-27", title: "Sức khỏe sinh sản sau 35 tuổi: Checklist kiểm tra", type: "checklist", category: "suc-khoe-sinh-san" },
    { slug: "skss-28", title: "Rối loạn kinh nguyệt tuổi teen: Khi nào cần khám", type: "symptom", category: "suc-khoe-sinh-san" },
    { slug: "skss-29", title: "Hormone FSH LH Estradiol: Ý nghĩa xét nghiệm", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-30", title: "Hội chứng buồng trứng đa nang PCOS: Điều trị mới 2026", type: "treatment", category: "suc-khoe-sinh-san" },
    { slug: "skss-31", title: "Dinh dưỡng cho phụ nữ chuẩn bị mang thai", type: "guide", category: "suc-khoe-sinh-san" },
    { slug: "skss-32", title: "Mụn trứng cá do nội tiết: Khi nào cần khám phụ khoa", type: "faq", category: "suc-khoe-sinh-san" },
    { slug: "skss-33", title: "Checklist sức khỏe trước khi kết hôn", type: "checklist", category: "suc-khoe-sinh-san" },
    { slug: "skss-34", title: "Tiêm phòng trước khi mang thai: Danh sách vaccine", type: "checklist", category: "suc-khoe-sinh-san" },
    { slug: "skss-35", title: "Tác dụng phụ của thuốc tránh thai và cách xử lý", type: "faq", category: "suc-khoe-sinh-san" },

    // 📍 Pillar 6: LOCAL SEO (276-300)
    { slug: "local-seo-31", title: "Khám phụ khoa ở Gia Lâm: Địa chỉ uy tín gần Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-32", title: "Phòng khám sản phụ khoa Bắc Giang gần Từ Sơn", type: "local", category: "local-seo" },
    { slug: "local-seo-33", title: "Khám hiếm muộn Lạng Giang Bắc Giang", type: "local", category: "local-seo" },
    { slug: "local-seo-34", title: "Siêu âm thai Sóc Sơn: Gần nhất ở đâu", type: "local", category: "local-seo" },
    { slug: "local-seo-35", title: "Khám nam khoa Bắc Ninh uy tín chi phí rõ ràng", type: "local", category: "local-seo" },
    { slug: "local-seo-36", title: "Phòng khám phụ khoa Từ Sơn khám ngoài giờ", type: "local", category: "local-seo" },
    { slug: "local-seo-37", title: "Khám thai định kỳ ở Yên Phong chi phí bao nhiêu", type: "local", category: "local-seo" },
    { slug: "local-seo-38", title: "Siêu âm 5D Từ Sơn: Mẹ bầu cần biết gì", type: "local", category: "local-seo" },
    { slug: "local-seo-39", title: "IUI ở Bắc Ninh: Quy trình và chi phí", type: "local", category: "local-seo" },
    { slug: "local-seo-40", title: "Khám sản gần KCN VSIP Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-41", title: "Khám phụ khoa Lim Tiên Du gần Từ Sơn", type: "local", category: "local-seo" },
    { slug: "local-seo-42", title: "Phòng khám có bác sĩ nữ Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-43", title: "Khám tinh dịch đồ Từ Sơn Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-44", title: "Đặt vòng tránh thai ở Bắc Ninh an toàn", type: "local", category: "local-seo" },
    { slug: "local-seo-45", title: "Tiêm HPV Từ Sơn Bắc Ninh giá bao nhiêu", type: "local", category: "local-seo" },
    { slug: "local-seo-46", title: "Khám thai cuối tuần Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-47", title: "Xét nghiệm NIPT ở Bắc Ninh: Giá và địa chỉ", type: "local", category: "local-seo" },
    { slug: "local-seo-48", title: "Khám vô sinh nam ở đâu Bắc Ninh uy tín", type: "local", category: "local-seo" },
    { slug: "local-seo-49", title: "Phòng khám sản Đình Bảng Từ Sơn", type: "local", category: "local-seo" },
    { slug: "local-seo-50", title: "Khám thai gần Samsung Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-51", title: "So sánh phòng khám tư và bệnh viện công Bắc Ninh", type: "comparison", category: "local-seo" },
    { slug: "local-seo-52", title: "Đốt viêm lộ tuyến ở Từ Sơn an toàn không", type: "local", category: "local-seo" },
    { slug: "local-seo-53", title: "Xét nghiệm máu thai sản tại Bắc Ninh", type: "local", category: "local-seo" },
    { slug: "local-seo-54", title: "Phòng khám An Sinh có BHYT không", type: "faq", category: "local-seo" },
    { slug: "local-seo-55", title: "Chỉ đường đến An Sinh từ Bắc Giang", type: "local", category: "local-seo" }
];

function generateDefaults(item, index) {
    const defaults = {
        index: index,
        description: `Khám phá ngay bài viết về ${item.title.toLowerCase()}. Hướng dẫn chi tiết từ Bác sĩ chuyên khoa tại Phòng khám An Sinh.`,
        tags: [item.title, item.category, "phòng khám An Sinh", "bác sĩ giỏi"],
        geoTarget: ["local-seo", "sieu-am"].includes(item.category) ? "Từ Sơn Bắc Ninh" : "Việt Nam",
        persona: "Bệnh nhân/Mẹ bầu",
        hookLine: `Bạn đang tìm hiểu về ${item.title.toLowerCase()}? Đừng bỏ qua những thông tin y khoa chuẩn xác dưới đây!`,
        h2_1: `Tổng quan về ${item.title.toLowerCase()}`,
        h2_2: "Những điều cần lưu ý quan trọng",
        intro: `Việc cung cấp và cập nhật đúng thông tin về ${item.title.toLowerCase()} sẽ giúp bạn có cái nhìn tổng quan và khoa học nhất.`,
        mainContent: "Đang cập nhật nội dung y khoa chuyên sâu từ chuyên gia...\n\n- Tuân thủ chỉ định của bác sĩ\n- Thăm khám sức khỏe định kỳ\n- Cập nhật thông tin y khoa",
        doctorAdvice: "Mọi thông tin trên mạng chỉ mang tính chất tham khảo. Bạn cần đến trực tiếp phòng khám để được chẩn đoán chính xác.",
        whenToSee: "- Khi thấy có dấu hiệu bất thường\n- Đau tức khó chịu quá mức chịu đựng\n- Được bác sĩ chuyên khoa chỉ định",
        ctaLine: `Cần tư vấn thêm về ${item.title.toLowerCase()}?`,
        tableSection: "| Tiêu chí | Cần lưu ý |\n|---------|----------|\n| Đối tượng | Mọi người |\n| Khuyến nghị | Khám định kỳ |",
        faqItems: `**Hỏi: Tình trạng này có nguy hiểm không?**\n\nĐáp: Cần đến bác sĩ chuyên khoa đánh giá trực tiếp.\n\n**Hỏi: Chi phí thăm khám tham khảo là bao nhiêu?**\n\nĐáp: Vui lòng liên hệ trực tiếp đến hotline phòng khám.`,
        symptoms: "- Đau mỏi bất thường\n- Cảm thấy khó chịu, mệt nhọc", // Cho symptom template
        causes: "Nguyên nhân có thể do sinh lý, bệnh lý hoặc thói quen sinh hoạt chưa phù hợp.",
        treatment: "Bác sĩ sẽ tuỳ theo từng bệnh án để đưa ra phác đồ điều trị thích hợp.",
        prevention: "Bổ sung dinh dưỡng, tập thể dục nhẹ nhàng và có chế độ sinh hoạt điều độ.",
        localAction: "thăm khám",
        localArea: "Từ Sơn Bắc Ninh",
        localReasons: "- Có đội ngũ bác sĩ chuyên khoa giỏi\n- Hệ thống máy siêu âm tốt\n- Tư vấn tận tâm",
        services: "- Siêu âm thai nhi\n- Khám phụ khoa\n- Tư vấn hiếm muộn",
        checklistItems: "- [x] Mang theo sổ khám bệnh cũ (nếu có)\n- [x] Lên danh sách các câu hỏi cần bác sĩ tư vấn\n- [x] Sắp xếp thời gian đi khám", // Cho checklist template
        journeySteps: "1. Đặt lịch khám qua hotline/website\n2. Đến trực tiếp phòng khám theo giờ hẹn\n3. Trực tiếp trao đổi với bác sĩ" // Cho journey template
    };

    return { ...defaults, ...item };
}

const main = () => {
    const existing = JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf-8'));
    console.log(`Found ${existing.length} existing articles in content-matrix.json`);

    // Only add logic
    let added = 0;
    const currentSlugs = new Set(existing.map(a => a.slug));

    for (const item of newArticles) {
        if (!currentSlugs.has(item.slug)) {
            const nextIndex = existing.length > 0 ? existing[existing.length - 1].index + 1 : 1;
            existing.push(generateDefaults(item, nextIndex));
            added++;
        }
    }

    fs.writeFileSync(MATRIX_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    console.log(`Added ${added} new articles to content-matrix.json. New total: ${existing.length}`);
};

main();
