import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Static pages (tools + landing) to include in search
const STATIC_PAGES = [
    {
        t: 'Tính ngày rụng trứng & Cửa sổ thụ thai',
        d: 'Dự đoán ngày rụng trứng, cửa sổ thụ thai chính xác theo chu kỳ kinh nguyệt.',
        u: '/tinh-ngay-rung-trung',
        c: 'cong-cu',
        k: ['rụng trứng', 'thụ thai', 'chu kỳ kinh', 'ovulation'],
        y: 'tool' as const,
    },
    {
        t: 'Tính ngày dự sinh (EDD)',
        d: 'Tính ngày dự sinh theo công thức Naegele, siêu âm quý 1, hoặc IVF.',
        u: '/cong-cu/tinh-ngay-du-sinh',
        c: 'cong-cu',
        k: ['ngày dự sinh', 'EDD', 'Naegele', 'siêu âm'],
        y: 'tool' as const,
    },
    {
        t: 'Cân nặng thai nhi theo tuần',
        d: 'Tra cứu cân nặng thai nhi chuẩn WHO theo tuổi thai.',
        u: '/can-nang-thai-nhi',
        c: 'cong-cu',
        k: ['cân nặng', 'thai nhi', 'WHO', 'Hadlock'],
        y: 'tool' as const,
    },
    {
        t: 'Dự đoán sinh non',
        d: 'Đánh giá nguy cơ sinh non bằng mô hình QUiPP và FMF.',
        u: '/cong-cu/du-doan-sinh-non',
        c: 'cong-cu',
        k: ['sinh non', 'QUiPP', 'FMF', 'chiều dài cổ tử cung'],
        y: 'tool' as const,
    },
    {
        t: 'Sàng lọc tiền sản giật',
        d: 'Sàng lọc nguy cơ tiền sản giật theo ACOG/USPSTF và NICE.',
        u: '/cong-cu/sang-loc-tien-san-giat',
        c: 'cong-cu',
        k: ['tiền sản giật', 'preeclampsia', 'ACOG', 'NICE', 'huyết áp'],
        y: 'tool' as const,
    },
    {
        t: 'Đái tháo đường thai kỳ (GDM)',
        d: 'Đánh giá nguy cơ đái tháo đường thai kỳ theo FMF và PersonalGDM.',
        u: '/cong-cu/du-doan-dai-thao-duong-thai-ky',
        c: 'cong-cu',
        k: ['đái tháo đường', 'GDM', 'tiểu đường', 'thai kỳ'],
        y: 'tool' as const,
    },
    {
        t: 'Đánh giá khối u buồng trứng (RMI & ROMA)',
        d: 'Tính điểm RMI và ROMA để đánh giá nguy cơ ác tính khối u buồng trứng.',
        u: '/cong-cu/danh-gia-khoi-u-buong-trung',
        c: 'cong-cu',
        k: ['buồng trứng', 'RMI', 'ROMA', 'CA-125', 'HE4'],
        y: 'tool' as const,
    },
    {
        t: 'Bishop Score — Khởi phát chuyển dạ',
        d: 'Đánh giá Bishop Score để tiên lượng khởi phát chuyển dạ.',
        u: '/cong-cu/bishop-score',
        c: 'cong-cu',
        k: ['Bishop', 'chuyển dạ', 'cổ tử cung', 'khởi phát'],
        y: 'tool' as const,
    },
    {
        t: 'Doppler thai nhi',
        d: 'Đánh giá Doppler động mạch rốn, não giữa và CPR.',
        u: '/cong-cu/doppler-thai-nhi',
        c: 'cong-cu',
        k: ['Doppler', 'UA-PI', 'MCA-PSV', 'CPR', 'động mạch rốn'],
        y: 'tool' as const,
    },
    {
        t: 'Thai ngoài tử cung',
        d: 'Bộ công cụ hỗ trợ quyết định lâm sàng cho thai ngoài tử cung.',
        u: '/cong-cu/thai-ngoai-tu-cung',
        c: 'cong-cu',
        k: ['thai ngoài tử cung', 'ectopic', 'β-hCG', 'Fernandez'],
        y: 'tool' as const,
    },
    // Landing pages
    {
        t: 'Siêu âm 5D — Hình ảnh thai nhi sắc nét',
        d: 'Dịch vụ siêu âm 5D thế hệ mới tại Phòng Khám An Sinh.',
        u: '/sieu-am-5d',
        c: 'dich-vu',
        k: ['siêu âm', '5D', '4D', 'thai nhi'],
        y: 'page' as const,
    },
    {
        t: 'Khám thai — Theo dõi thai kỳ toàn diện',
        d: 'Dịch vụ khám thai định kỳ, theo dõi thai kỳ toàn diện.',
        u: '/kham-thai',
        c: 'dich-vu',
        k: ['khám thai', 'thai kỳ', 'theo dõi'],
        y: 'page' as const,
    },
    {
        t: 'Khám phụ khoa',
        d: 'Khám và điều trị bệnh phụ khoa tại Phòng Khám An Sinh.',
        u: '/kham-phu-khoa',
        c: 'dich-vu',
        k: ['phụ khoa', 'viêm nhiễm', 'khám'],
        y: 'page' as const,
    },
    {
        t: 'Nam khoa — Sức khỏe nam giới',
        d: 'Dịch vụ khám và điều trị nam khoa uy tín.',
        u: '/kham-nam-khoa',
        c: 'dich-vu',
        k: ['nam khoa', 'tinh trùng', 'sinh lý'],
        y: 'page' as const,
    },
    {
        t: 'Điều trị vô sinh — Hỗ trợ sinh sản',
        d: 'Dịch vụ điều trị vô sinh, hỗ trợ sinh sản hiện đại.',
        u: '/dieu-tri-vo-sinh',
        c: 'dich-vu',
        k: ['vô sinh', 'hiếm muộn', 'IVF', 'IUI'],
        y: 'page' as const,
    },
    {
        t: 'Tránh thai an toàn',
        d: 'Tư vấn biện pháp tránh thai an toàn, hiệu quả.',
        u: '/tranh-thai-an-toan',
        c: 'dich-vu',
        k: ['tránh thai', 'biện pháp', 'an toàn'],
        y: 'page' as const,
    },
    {
        t: 'Phòng Khám An Sinh — Từ Sơn, Bắc Ninh',
        d: 'Phòng khám sản phụ khoa uy tín tại 416 Minh Khai, Từ Sơn, Bắc Ninh.',
        u: '/phong-kham-tu-son',
        c: 'gioi-thieu',
        k: ['phòng khám', 'Từ Sơn', 'Bắc Ninh', 'địa chỉ'],
        y: 'page' as const,
    },
    {
        t: 'Cảm nhận khách hàng',
        d: 'Đánh giá và chia sẻ từ bệnh nhân tại Phòng Khám An Sinh.',
        u: '/cam-nhan-khach-hang',
        c: 'gioi-thieu',
        k: ['đánh giá', 'review', 'khách hàng', 'cảm nhận'],
        y: 'page' as const,
    },
    {
        t: 'Tư vấn trực tuyến',
        d: 'Đặt lịch tư vấn trực tuyến với bác sĩ chuyên khoa.',
        u: '/tu-van-truc-tuyen',
        c: 'dich-vu',
        k: ['tư vấn', 'trực tuyến', 'online', 'đặt lịch'],
        y: 'page' as const,
    },
];

// Map category slug to Vietnamese label
const CATEGORY_MAP: Record<string, string> = {
    'mang-thai': 'Mang Thai & Sinh Con',
    'phu-khoa': 'Bệnh Phụ Khoa',
    'vo-sinh': 'Điều Trị Vô Sinh',
    'nam-khoa': 'Nam Khoa',
    'suc-khoe-sinh-san': 'Sức Khỏe Sinh Sản',
    'local-seo': 'Phòng Khám',
    'hiem-muon': 'Hiếm Muộn',
    'sieu-am': 'Siêu Âm',
    'cong-cu': 'Công Cụ Y Khoa',
    'dich-vu': 'Dịch Vụ',
    'gioi-thieu': 'Giới Thiệu',
};

export const GET: APIRoute = async () => {
    const posts = await getCollection('blog');

    const blogEntries = posts.map((post) => ({
        t: post.data.title,
        d: post.data.description.slice(0, 120),
        u: `/blog/${post.id.replace(/\.mdx?$/, '')}`,
        c: CATEGORY_MAP[post.data.category] || post.data.category,
        k: post.data.tags || [],
        y: 'blog' as const,
    }));

    const allEntries = [...STATIC_PAGES, ...blogEntries];

    return new Response(JSON.stringify(allEntries), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
