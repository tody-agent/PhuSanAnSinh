/**
 * Preeclampsia Screening — Knowledge Base
 * FAQ database for embedding into LLM prompts.
 * All data is verified from published medical literature.
 */

export const FAQ_DATABASE = [
    {
        q: 'Tiền sản giật là gì?',
        a: 'Tiền sản giật (preeclampsia) là rối loạn tăng huyết áp trong thai kỳ, thường xuất hiện sau tuần 20, đặc trưng bởi HA ≥140/90 mmHg kèm protein niệu (≥0,3g/24h) hoặc tổn thương cơ quan đích. Rối loạn tăng huyết áp gây khoảng 16% tử vong mẹ toàn cầu (~42.000 ca/năm, WHO 2023). Nếu không điều trị có thể tiến triển thành sản giật (co giật), hội chứng HELLP, tổn thương gan thận, và tử vong mẹ-thai.',
    },
    {
        q: 'Aspirin dự phòng có hiệu quả không? Bằng chứng?',
        a: 'Nghiên cứu ASPRE (Rolnik et al., NEJM 2017, n=1.776 thai phụ nguy cơ cao từ 13 bệnh viện, 6 quốc gia) cho thấy aspirin 150mg/ngày bắt đầu trước 16 tuần giảm 62% tiền sản giật sớm (preterm PE, sinh <37 tuần), OR = 0,38 (95% CI: 0,20–0,74). Giảm 82% PE trước 34 tuần. Meta-analysis cho thấy aspirin bắt đầu <16 tuần: RR 0,47 (95% CI: 0,34–0,65); bắt đầu ≥16 tuần: RR 0,81 (không có ý nghĩa thống kê). Được ACOG, NICE, FIGO, USPSTF đồng khuyến cáo.',
    },
    {
        q: 'Liều aspirin bao nhiêu?',
        a: 'ACOG/USPSTF: 81mg/ngày. FIGO/ASPRE: 150mg/ngày. NICE: 75-150mg/ngày. Meta-analysis (AJOG MFM 2023) cho thấy 150-162mg hiệu quả hơn 75-81mg trong giảm preterm PE. Tại Việt Nam dùng viên 81mg hoặc 100mg có sẵn, ưu tiên ≥100mg. Uống buổi tối trước ngủ (theo ASPRE protocol). Bắt đầu 12-16 tuần (tối ưu <16 tuần), dừng ở 36 tuần.',
    },
    {
        q: 'Phân biệt ACOG và NICE trong sàng lọc?',
        a: 'Khác biệt chính: (1) Ngưỡng tuổi — ACOG ≥35, NICE ≥40. (2) Ngưỡng BMI — ACOG >30, NICE ≥35. (3) Đa thai — ACOG xếp nhóm CAO, NICE xếp nhóm TRUNG BÌNH. (4) IVF — ACOG đếm moderate risk, NICE không liệt kê. (5) Liều aspirin — ACOG 81mg, NICE 75-150mg. Cả hai đều dùng nguyên tắc: ≥1 high-risk HOẶC ≥2 moderate-risk → aspirin.',
    },
    {
        q: 'Sàng lọc FMF khác gì phiên bản lâm sàng?',
        a: 'FMF triple test (FMF = Fetal Medicine Foundation) kết hợp: yếu tố mẹ + huyết áp trung bình (MAP) + Doppler động mạch tử cung (UtA-PI) + PlGF huyết thanh. Dữ liệu từ 63.827 thai phụ, validated toàn cầu (châu Âu, Úc, Mỹ, Brazil, châu Á kể cả Việt Nam). Detection rate: 75% preterm PE ở FPR 10% — vượt xa NICE (41%) và ACOG 2013 (5%). Tuy nhiên cần Doppler + xét nghiệm máu, nên phòng khám nhỏ dùng phiên bản lâm sàng (risk factors only) là lựa chọn khả thi nhất.',
    },
    {
        q: 'Thai đã >16 tuần, còn dùng aspirin được không?',
        a: 'ACOG cho phép bắt đầu aspirin đến 28 tuần. Tuy nhiên hiệu quả tối ưu khi <16 tuần (meta-analysis: RR 0,47 vs 0,81). Sau 28 tuần hiệu quả không rõ ràng. Sau 36 tuần KHÔNG bắt đầu (nguy cơ xuất huyết).',
    },
    {
        q: 'Các yếu tố nguy cơ CAO là gì?',
        a: 'Theo ACOG/USPSTF 2021, chỉ cần 1 yếu tố → aspirin: (1) Tiền sử PE/sản giật, (2) Đa thai, (3) THA mạn, (4) ĐTĐ type 1/2 trước thai, (5) Bệnh thận mạn, (6) Bệnh tự miễn (SLE, APS).',
    },
    {
        q: 'Các yếu tố nguy cơ TRUNG BÌNH là gì?',
        a: 'Theo ACOG/USPSTF 2021, cần ≥2 yếu tố → aspirin: (1) Con so, (2) Tuổi ≥35, (3) BMI >30, (4) Gia đình có PE (mẹ/chị em), (5) Khoảng cách >10 năm, (6) IVF, (7) Tiền sử con nhẹ cân/SGA/thai lưu, (8) Thu nhập thấp.',
    },
    {
        q: 'Triệu chứng cảnh báo tiền sản giật?',
        a: 'Theo NICE NG133: đau đầu dữ dội, nhìn mờ/chấm sáng, đau thượng vị/hạ sườn phải, nôn ói (sau tam cá nguyệt I), phù mặt/tay/chân đột ngột, khó thở. Cần đến cơ sở y tế ngay khi có bất kỳ triệu chứng nào.',
    },
    {
        q: 'Nguồn trích dẫn chính?',
        a: '1) Rolnik DL et al. NEJM 2017;377:613-622 (ASPRE trial). 2) ACOG/SMFM Practice Advisory 12/2021 (reaffirmed 10/2022). 3) USPSTF JAMA 2021;326:1186-1191. 4) NICE NG133, 06/2019 (amended 2023). 5) FIGO — Poon LC et al. Int J Gynaecol Obstet 2019;145(S1):1-33. 6) WHO Pre-eclampsia Fact Sheet 12/2025. 7) FMF PE Risk Calculator (63.827 thai phụ).',
    },
];
