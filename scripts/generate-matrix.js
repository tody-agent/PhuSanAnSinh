import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 7 Pillars
// 1. Mang thai (40) - local
// 2. Sieu am (25) - local 
// 3. Hiem muon nu (35) - national
// 4. Hiem muon nam (20) - national
// 5. Phu khoa (30) - local
// 6. SKSS (20) - mixed
// 7. Local SEO (30) - local

const matrix = [];
let index = 1;

function add(slug, title, keyword, category, type, geoTarget, persona, customTmplParams = {}) {
    matrix.push({
        index: index++,
        slug,
        title,
        description: `Khám phá ngay bài viết về ${keyword.toLowerCase()}. Hướng dẫn chi tiết từ Bác sĩ chuyên khoa tại Phòng khám An Sinh.`,
        category,
        tags: [keyword, category, "phòng khám An Sinh", "bác sĩ giỏi"],
        type,
        geoTarget,
        persona,
        hookLine: `Bạn đang lo lắng về ${keyword.toLowerCase()}? Đừng bỏ qua những thông tin y khoa chuẩn xác dưới đây!`,
        h2_1: `Tổng quan về ${keyword.toLowerCase()}`,
        h2_2: `Những điều cần lưu ý`,
        intro: `Việc tìm hiểu đúng thông tin về ${keyword.toLowerCase()} là bước đầu tiên để bảo vệ sức khỏe của bạn và người thân.`,
        mainContent: `Dưới đây là các thông tin chi tiết và hướng dẫn y khoa:
- Tuân thủ chỉ định của bác sĩ
- Theo dõi các triệu chứng bất thường
- Chăm sóc dinh dưỡng hợp lý`,
        doctorAdvice: `Luôn lắng nghe cơ thể và thăm khám định kỳ để phát hiện sớm các bất thường.`,
        whenToSee: `- Khi các triệu chứng kéo dài\n- Kèm theo đau đớn dữ dội\n- Ảnh hưởng đến sinh hoạt hàng ngày`,
        ctaLine: `Cần tư vấn thêm về ${keyword.toLowerCase()}?`,
        tableSection: `| Tiêu chí | Thông tin |\n|---------|----------|\n| Đối tượng | ${persona} |\n| Lời khuyên | Khám định kỳ |`,
        faqItems: `**Hỏi: ${keyword} có nguy hiểm không?**\n\nĐáp: Tùy tình trạng cụ thể, bạn cần thăm khám sớm.\n\n**Hỏi: Chi phí bao nhiêu?**\n\nĐáp: Vui lòng liên hệ hotline để được báo giá chính xác.`,
        symptoms: `- Đau tức khó chịu\n- Thay đổi thói quen sinh hoạt\n- Mệt mỏi kéo dài`,
        causes: `Do nhiều yếu tố kết hợp, bao gồm di truyền, lối sống và môi trường.`,
        treatment: `Phác đồ cá thể hóa từ bác sĩ chuyên khoa, kết hợp thuốc và thay đổi lối sống.`,
        prevention: `Xây dựng thói quen lành mạnh, khám sức khỏe định kỳ tối thiểu 6 tháng/lần.`,
        localAction: `chăm sóc y tế`,
        localArea: geoTarget !== 'National' ? geoTarget : 'Từ Sơn',
        localReasons: `- Đội ngũ bác sĩ giàu kinh nghiệm\n- Tiện lợi, không cần đi xa\n- Chi phí hợp lý`,
        services: `- Tư vấn chuyên sâu\n- Khám và siêu âm\n- Điều trị hiệu quả`,
        checklistItems: `- [x] Thông tin cơ bản\n- [x] Lịch khám khuyên dùng\n- [x] Lưu ý dinh dưỡng`,
        journeySteps: `1. Tư vấn ban đầu\n2. Khám lâm sàng\n3. Lên phác đồ\n4. Theo dõi định kỳ`,
        ...customTmplParams
    });
}

// 1. Mang Thai (40)
const mangThaiTopics = [
    "Dấu hiệu mang thai sớm", "Trễ kinh mấy ngày thì thử thai", "Que thử thai 2 vạch mờ", "Mang thai tuần đầu đau bụng",
    "Ra máu báo thai hay sảy thai", "Buồn nôn nhiều khi mang thai", "Ốm nghén nặng ăn gì", "Khám thai lần đầu cần chuẩn bị gì",
    "Khám thai ở Từ Sơn Bắc Ninh", "Chi phí khám thai trọn gói", "Tam cá nguyệt thứ 1", "Xét nghiệm Double Test là gì",
    "Độ mờ da gáy bao nhiêu là bình thường", "NIPT hay Triple Test", "Siêu âm hình thái học", "Tiểu đường thai kỳ",
    "Tiền sản giật", "Nhau tiền đạo", "Thai ngôi ngược", "Cách đếm cử máy thai nhi",
    "Mẹ bầu mất ngủ", "Tư thế ngủ tốt cho bà bầu", "Mẹ bầu bị phù chân", "Dinh dưỡng bà bầu 3 tháng đầu",
    "Dinh dưỡng bà bầu 3 tháng cuối", "Thuốc bổ bà bầu cần uống", "Cân nặng thai nhi theo tuần", "Chiều dài xương đùi thai nhi",
    "Nước ối ít phải làm sao", "Nước ối nhiều có nguy hiểm", "Dấu hiệu chuyển dạ thật", "Mẹ bầu bị gò cứng bụng",
    "Sinh thường hay sinh mổ", "Chuẩn bị đồ đi sinh", "Chăm sóc mẹ sau sinh", "Trầm cảm sau sinh",
    "Khám sau sinh khi nào", "Sữa mẹ ít phải làm sao", "Bệnh phụ khoa sau sinh", "Vỡ ối sớm có nguy hiểm"
];
mangThaiTopics.forEach((t, i) => add(`mang-thai-${i + 1}`, `${t}: Hướng dẫn chi tiết cho mẹ bầu`, t, 'mang-thai', 'guide', 'Từ Sơn Bắc Ninh', 'Mẹ bầu 22-38 tuổi'));

// 2. Sieu am (25)
const sieuAmTopics = [
    "Siêu âm 5D là gì", "Siêu âm 2D 3D 4D 5D khác nhau thế nào", "Siêu âm 5D Bắc Ninh ở đâu tốt", "Siêu âm 5D Từ Sơn",
    "Giá siêu âm 5D", "Siêu âm 12 tuần đầu", "Siêu âm đo độ mờ da gáy", "Siêu âm 4 chiều",
    "Siêu âm đầu dò", "Siêu âm ống nước ối", "Siêu âm Doppler mạch máu thai", "Siêu âm tim thai nhi",
    "Siêu âm thai nhiều có hại không", "Siêu âm giới tính", "Cách đọc kết quả siêu âm", "Chỉ số BPD HC AC FL",
    "Siêu âm phụ khoa", "Siêu âm buồng trứng u nang", "Siêu âm tử cung u xơ", "Xem kết quả siêu âm online",
    "Siêu âm thai Yên Phong", "Siêu âm thai Tiên Du", "Siêu âm thai Thuận Thành", "Siêu âm thai TP Bắc Ninh",
    "Siêu âm song thai"
];
sieuAmTopics.forEach((t, i) => add(`sieu-am-${i + 1}`, `${t} an toàn chính xác nhất`, t, 'sieu-am', 'local', 'Từ Sơn Bắc Ninh', 'Mẹ bầu, phụ nữ khu vực'));

// 3. Hiem muon nu (35)
const hiemMuonNuTopics = [
    "Vô sinh nữ là gì", "Bao lâu không có thai thì đi khám", "Tắc ống dẫn trứng", "Buồng trứng đa nang",
    "U xơ tử cung ảnh hưởng thụ thai", "Lạc nội mạc tử cung", "Suy buồng trứng sớm", "Xét nghiệm AMH",
    "Chỉ số AMH theo tuổi", "Xét nghiệm vô sinh nữ", "Chụp HSG tử cung", "Rối loạn phóng noãn",
    "Kích trứng là gì", "Quy trình IUI", "Chi phí IUI", "Tỷ lệ thành công IUI",
    "Quy trình IVF", "Chi phí IVF", "IUI hay IVF", "Chuyển phôi tươi hay đông lạnh",
    "Hiếm muộn thứ phát", "Hiếm muộn tuổi 35", "Áp lực gia đình hiếm muộn", "Tâm lý vợ chồng hiếm muộn",
    "Ăn gì tăng khả năng thụ thai", "Thời điểm quan hệ dễ thụ thai", "Theo dõi phóng noãn bằng siêu âm", "Tác dụng phụ thuốc kích trứng",
    "Hiếm muộn không rõ nguyên nhân", "Sảy thai liên tiếp", "Mang thai sau sảy thai", "Thụ tinh nhân tạo và ống nghiệm",
    "Đông trứng có cần thiết", "Nhật ký điều trị hiếm muộn", "Spa chuyên hiếm muộn"
];
hiemMuonNuTopics.forEach((t, i) => add(`hiem-muon-nu-${i + 1}`, `${t}: Cẩm nang cho phái đẹp`, t, 'hiem-muon', 'journey', 'National', 'Phụ nữ hiếm muộn'));

// 4. Hiem muon nam (20)
const hiemMuonNamTopics = [
    "Vô sinh nam là gì", "Tinh trùng yếu", "Tinh trùng ít", "Xét nghiệm tinh dịch đồ",
    "Chỉ số tinh dịch đồ bình thường", "Giãn tĩnh mạch thừng tinh", "Không có tinh trùng", "Thuốc tăng tinh trùng",
    "Ăn gì tăng tinh trùng", "Thói quen giảm tinh trùng", "Nam giới khám hiếm muộn khi nào", "Yếu sinh lý và vô sinh",
    "Xuất tinh ngược dòng", "Rối loạn cương dương", "Nói chồng đi khám hiếm muộn", "Khám nam khoa hay hiếm muộn",
    "Tuổi tác và vô sinh nam", "Micro-TESE là gì", "Phẫu thuật giãn tĩnh mạch", "Tâm lý chồng hiếm muộn"
];
hiemMuonNamTopics.forEach((t, i) => add(`hiem-muon-nam-${i + 1}`, `${t}: Góc nhìn y khoa nam giới`, t, 'hiem-muon', 'guide', 'National', 'Nam giới hiếm muộn'));

// 5. Phu khoa (30)
const phuKhoaTopics = [
    "Viêm âm đạo triệu chứng", "Khí hư bất thường màu gì", "Viêm lộ tuyến cổ tử cung", "Đốt viêm lộ tuyến có đau không",
    "Rối loạn kinh nguyệt nguyên nhân", "Kinh nguyệt không đều", "Đau bụng kinh dữ dội", "Mất kinh tuổi trẻ",
    "Nhiễm trùng đường tiết niệu", "U nang buồng trứng là gì", "U xơ tử cung triệu chứng", "Polyp cổ tử cung",
    "Viêm vùng chậu", "Xét nghiệm Pap smear", "Xét nghiệm HPV", "Tiêm vắc xin HPV",
    "Nội mạc tử cung dày", "Soi cổ tử cung", "Nấm Candida phụ nữ", "Viêm âm đạo khi mang thai",
    "Khám phụ khoa gồm những gì", "Khi nào nên đi khám phụ khoa", "Khám phụ khoa bao nhiêu tiền", "Ra máu giữa chu kỳ",
    "Đau khi quan hệ", "Viêm lộ tuyến sinh thường được không", "Khô ở vùng kín", "Viêm phụ khoa làm sao hết",
    "Bệnh phụ khoa lây qua quan hệ", "Nước rửa phụ khoa dùng không"
];
phuKhoaTopics.forEach((t, i) => add(`phu-khoa-${i + 1}`, `${t} và các dấu hiệu cảnh báo`, t, 'phu-khoa', 'symptom', 'Từ Sơn Bắc Ninh', 'Phụ nữ độ tuổi 20-45'));

// 6. SKSS (20)
const skssTopics = [
    "Chuẩn bị mang thai", "Khám tiền hôn nhân", "Bổ sung acid folic", "Thuốc tránh thai hàng ngày",
    "Vòng tránh thai", "Tránh thai khẩn cấp 72h", "Que tránh thai", "Tính ngày rụng trứng",
    "Chu kỳ kinh nguyệt 28 ngày", "Bệnh lây truyền qua đường tình dục", "Xét nghiệm TORCH", "Sức khỏe sinh sản nam",
    "Sảy thai tự nhiên", "Thai ngoài tử cung", "Sống chung buồng trứng đa nang", "Bệnh Rubella và mang thai",
    "Ngộ độc thai nghén", "Phá thai an toàn", "Trật tự sinh sản", "Tuổi sinh sản lý tưởng"
];
skssTopics.forEach((t, i) => add(`skss-${i + 1}`, `${t}: Sức khỏe sinh sản toàn diện`, t, 'suc-khoe-sinh-san', 'faq', 'Hỗn hợp', 'Cặp vợ chồng trẻ'));

// 7. Local SEO (30)
const localTopics = [
    "Phòng khám sản Từ Sơn", "Bác sĩ sản khoa Bắc Ninh", "Phòng khám hiếm muộn Bắc Ninh", "Khám thai Yên Phong",
    "Khám phụ khoa Tiên Du", "Khám phụ khoa Thuận Thành", "Khám thai TP Bắc Ninh", "Phòng khám đa khoa Từ Sơn",
    "Đặt lịch khám Từ Sơn", "Siêu âm 5D giá rẻ Bắc Ninh", "Khám nam khoa Từ Sơn", "Bệnh viện hay phòng khám tư",
    "Phòng khám phụ khoa Đồng Nguyên", "Phòng khám mở buổi tối Từ Sơn", "Khám phụ khoa Chủ nhật", "Xét nghiệm thai Bắc Ninh",
    "Phòng khám sản khoa Minh Khai", "Khám tiền hôn nhân Bắc Ninh", "Phòng khám 5 sao Google Từ Sơn", "Khám hiếm muộn ở đâu Bắc Ninh",
    "Sinh con ở Từ Sơn", "Phòng khám An Sinh review", "Bảng giá khám An Sinh", "Khám phụ khoa Đông Anh",
    "Khám thai Quế Võ", "Phòng khám riêng tư phụ khoa", "Bác sĩ nữ khám phụ khoa Từ Sơn", "Khám sản sau giờ làm",
    "Phòng khám Từ Sơn gần KCN", "Hướng dẫn đường đến An Sinh"
];
localTopics.forEach((t, i) => add(`local-seo-${i + 1}`, `${t} tốt nhất hiện nay`, t, 'local-seo', 'local', 'Từ Sơn', 'Cư dân khu vực lân cận'));

fs.writeFileSync(path.join(__dirname, 'content-matrix.json'), JSON.stringify(matrix, null, 2));
console.log(`Generated ${matrix.length} matrix entries.`);
