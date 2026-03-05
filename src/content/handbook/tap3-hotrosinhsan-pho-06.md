---
title: "Time-lapse Monitoring — PHO-06"
description: "Chào bạn, với tư cách là Giáo sư đầu ngành về Y học Sinh sản, tôi xin trình bày phác đồ kỹ thuật chi tiết về **Hệ thống theo dõi phôi liên tục (Time-lapse Monit"
pubDate: 2026-03-05
category: ho-tro-sinh-san
tags: ["TLM","CO2","ICSI","PGT"]
author: "Giáo sư Sản Phụ khoa"
readingTime: 7
volume: "Tập 3: Hỗ Trợ Sinh Sản"
---
Chào bạn, với tư cách là Giáo sư đầu ngành về Y học Sinh sản, tôi xin trình bày phác đồ kỹ thuật chi tiết về **Hệ thống theo dõi phôi liên tục (Time-lapse Monitoring - TLM)**. Đây là một bước tiến mang tính cách mạng trong Labo hỗ trợ sinh sản hiện đại, giúp tối ưu hóa việc chọn lọc phôi mà không làm gián đoạn môi trường nuôi cấy.

Dưới đây là nội dung chi tiết theo chuẩn y khoa:

# Time-lapse Monitoring — PHO-06
> **Nhóm:** PHO (Phôi học) | **Mã:** PHO-06 | **Đối tượng:** KTV Phôi (Embryologists)

## 1. ĐỊNH NGHĨA & CHỈ ĐỊNH
### 1.1. Định nghĩa
Time-lapse Monitoring (TLM) là công nghệ nuôi cấy phôi trong tủ ấm tích hợp hệ thống camera và kính hiển vi bên trong, cho phép chụp ảnh phôi ở nhiều tiêu cự với tần suất 5-10 phút/lần. Dữ liệu hình ảnh được xử lý thành video, giúp quan sát toàn bộ quá trình động học của phôi (Morphokinetics) mà không cần mang phôi ra ngoài môi trường tủ ấm.

### 1.2. Chỉ định
- Bệnh nhân có tiền sử thất bại làm tổ nhiều lần (Recurrent Implantation Failure - RIF).
- Bệnh nhân lớn tuổi (>35 tuổi) hoặc dự trữ buồng trứng thấp.
- Các trường hợp cần thực hiện chuyển phôi đơn bắt buộc (Elective Single Embryo Transfer - eSET) để giảm nguy cơ đa thai nhưng vẫn đảm bảo tỷ lệ thành công cao nhất.
- Bệnh nhân có nhu cầu quan sát và lưu trữ video quá trình phát triển của phôi.
- Áp dụng trong nghiên cứu phôi học và đào tạo nhân sự Lab.

## 2. NGUYÊN LÝ KHOA HỌC
- **Sự ổn định môi trường (Disturbance-free culture):** Loại bỏ các tác động tiêu cực từ nhiệt độ, độ ẩm và nồng độ khí (CO2, O2) khi phải đưa phôi ra ngoài để đánh giá định kỳ dưới kính hiển vi soi ngược.
- **Hình thái động học (Morphokinetics):** Thay vì chỉ đánh giá phôi tại các thời điểm tĩnh (static snapshots), TLM cho phép theo dõi các mốc phân chia tế bào (t2, t3, t4, t5...) và các hiện tượng bất thường như phân chia nhanh (Direct Cleavage), đa nhân (Multinucleation), hoặc không phân chia (Reverse cleavage).
- **Thuật toán dự đoán (Algorithms/AI):** Sử dụng các mô hình chấm điểm dựa trên dữ liệu lớn (như KIDScore) để dự đoán khả năng tạo túi phôi (Blastocyst conversion) và khả năng làm tổ (Implantation potential).

## 3. QUY TRÌNH THỰC HIỆN (Step-by-step)
| Bước | Thời điểm | Hành động | Người thực hiện | Lưu ý |
|------|----------|----------|----------------|-------|
| 1. Chuẩn bị đĩa | 24h trước khi chọc hút/ICSI | Chuẩn bị đĩa chuyên dụng (EmbryoSlide/GPS dish). Phủ dầu (Oil overlay) và cân bằng trong tủ ấm. | KTV Phôi | Tránh để lại bọt khí trong các giọt môi trường (Microwells). |
| 2. Nạp phôi | Sau ICSI (D0) hoặc D1 | Chuyển hợp tử/phôi vào các vi hốc (Microwells) trên đĩa. | KTV Phôi | Đảm bảo phôi nằm đúng tâm hốc để camera lấy nét chính xác. |
| 3. Cài đặt hệ thống | Ngay sau khi nạp phôi | Đưa đĩa vào vị trí quy định trong tủ Time-lapse. Thiết lập thông tin bệnh nhân trên phần mềm. | KTV Phôi | Kiểm tra tiêu cự (Focus) của tất cả các phôi trước khi bắt đầu. |
| 4. Theo dõi & Annotation | Từ D1 đến D5/D6 | Đánh giá các mốc phân chia theo phần mềm (t2, t3, t5, t8, tB, tHB). Ghi nhận bất thường. | KTV Phôi/Bác sĩ Embryologist | Sử dụng thuật toán AI để hỗ trợ xếp hạng ưu tiên phôi (Ranking). |
| 5. Lựa chọn phôi | D5/D6 | Kết hợp hình thái học cổ điển và dữ liệu Morphokinetics để chọn phôi chuyển hoặc đông lạnh. | Bác sĩ chuyên khoa & KTV | Ưu tiên phôi có thông số nằm trong khoảng thời gian tối ưu (Optimal time frames). |

## 4. THUỐC & MÔI TRƯỜNG SỬ DỤNG
*Kỹ thuật này chủ yếu sử dụng môi trường nuôi cấy (Culture Media). Việc sử dụng môi trường liên tục (Single Step Media) là tối ưu cho Time-lapse.*

| Thành phần | Loại | Công dụng | Thời gian | Lưu ý |
|-----------|-----|-----------|----------|---------|
| Môi trường nuôi cấy | Single Step Media (vd: G-TL, Continuous Single Culture) | Nuôi cấy phôi từ D0 đến D5/D6 không thay môi trường. | Toàn bộ quá trình | Cần được cân bằng kỹ lưỡng về pH. |
| Dầu phủ | Pharmaceutical grade mineral oil | Ngăn chặn sự bay hơi và thay đổi áp suất thẩm thấu. | Toàn bộ quá trình | Độ nhớt thấp để dễ quan sát dưới camera. |

## 5. THEO DÕI & ĐÁNH GIÁ
- **Thông số động học chính:**
    - **t2:** Thời điểm phân chia thành 2 tế bào (Tối ưu: 22h - 28h sau ICSI).
    - **cc2:** Thời gian chu kỳ tế bào thứ 2 (t3 - t2) (Tối ưu: <12h).
    - **s2:** Sự đồng bộ của lần phân chia thứ 2 (t4 - t3) (Tối ưu: <0.75h).
    - **t5:** Thời điểm đạt 5 tế bào (Tối ưu: 45h - 55h).
- **Phân loại rủi ro:** Phôi có hiện tượng *Direct Cleavage* (phân chia từ 1 thành 3 tế bào trong <5h) có tỷ lệ làm tổ cực thấp.

## 6. BIẾN CHỨNG & XỬ TRÍ
| Biến chứng | Tần suất | Nhận biết | Xử trí |
|-----------|---------|----------|--------|
| Lỗi mất nét (Out of focus) | Thấp | Hình ảnh phôi mờ, không annotation được. | Điều chỉnh tiêu cự thủ công trên phần mềm hoặc kiểm tra vị trí đĩa. |
| Lỗi phần mềm/ổ cứng | Rất thấp | Hệ thống không lưu trữ video hoặc treo máy. | Chuyển đĩa sang tủ ấm dự phòng, đánh giá phôi thủ công theo cách truyền thống. |
| Ngưng phát triển phôi | Theo sinh lý | Phôi không phân chia vượt qua một mốc thời gian nhất định. | Hội chẩn Bác sĩ điều trị để tư vấn cho bệnh nhân. |

## 7. KẾT QUẢ KỲ VỌNG
- Tỷ lệ phôi phát triển lên giai đoạn túi (Blastocyst rate) tăng 10-15% do môi trường ổn định.
- Tăng tỷ lệ có thai lâm sàng (Clinical Pregnancy Rate) thông qua việc loại trừ các phôi có bất thường động học ẩn.
- Giảm thời gian chờ đợi có thai (Time to Pregnancy) cho bệnh nhân.

## 8. TƯ VẤN BỆNH NHÂN
- **Giải thích lợi ích:** "Phôi của anh chị sẽ được nuôi trong một 'nhà trẻ công nghệ cao', nơi chúng tôi quan sát con 24/24 mà không cần làm phiền giấc ngủ của con."
- **Tính minh bạch:** Cung cấp video phát triển của phôi giúp tăng sự tin tưởng và gắn kết của bệnh nhân với quá trình điều trị.
- **Lưu ý:** Time-lapse là công cụ hỗ trợ chọn lọc phôi tốt nhất hiện có, nhưng không thể làm thay đổi bản chất di truyền của phôi nếu phôi đó vốn dĩ đã bất thường.

## 9. CROSS-LINKS
- **PHO-01:** Kỹ thuật Tiêm tinh trùng vào bào tương noãn (ICSI).
- **PHO-04:** Nuôi cấy phôi giai đoạn túi (Blastocyst Culture).
- **DT-01:** Sàng lọc di truyền tiền làm tổ (PGT).

---
*Ghi chú: Mọi quyết định lựa chọn phôi cần dựa trên sự phối hợp giữa dữ liệu Time-lapse, hình thái học cổ điển và lâm sàng của bệnh nhân.*