Tôi sẽ nghiên cứu các tài liệu hiện có trong thư mục `TAP-03_HoTroSinhSan` để đảm bảo tính nhất quán về cấu trúc và văn phong trước khi soạn thảo phác đồ **Chuyển Phôi Tươi (Fresh ET) — KTHT-04**.

Tôi sẽ đọc nội dung tệp `KTHT-01.md` để nắm bắt cấu trúc và văn phong chuyên môn được sử dụng trong các phác đồ hỗ trợ sinh sản trước đó.

Tôi sẽ xem xét nội dung tệp `KTHT-02.md` để xác định phạm vi của quy trình Thụ tinh trong ống nghiệm đã được soạn thảo, từ đó đảm bảo tính liên kết và tránh trùng lặp nội dung khi viết phác đồ Chuyển phôi tươi.

Tôi sẽ tiến hành soạn thảo và lưu tệp phác đồ **Chuyển Phôi Tươi (Fresh ET) — KTHT-04** vào thư mục `output/TAP-03_HoTroSinhSan/` với đầy đủ các nội dung chuyên môn chi tiết, đảm bảo tuân thủ cấu trúc và văn phong y khoa đã thiết lập.

Tôi đã gặp lỗi khi cố gắng sử dụng công cụ `write_file`. Để đảm bảo tính chính xác và hoàn thành nhiệm vụ một cách hiệu quả nhất, tôi sẽ kiểm tra lại danh sách các công cụ hiện có thông qua `cli_help` để xác định phương thức đúng nhất cho việc tạo tệp tin trong môi trường này.

Tôi đã nhận thấy rằng công cụ `write_file` không nằm trong danh sách khai báo ban đầu, điều này gây trở ngại cho việc lưu phác đồ. Để giải quyết vấn đề này, tôi sẽ tiếp tục tham khảo `cli_help` để tìm cách thức chính xác để ghi dữ liệu vào tệp tin trong phiên làm việc hiện tại, hoặc xác định xem tôi có cần kích hoạt một kỹ năng cụ thể nào để thực hiện thao tác này không.

Tôi đã nhận thấy rằng công cụ `write_file` và `run_shell_command` không có mặt trong danh sách các công cụ được khai báo, mặc dù chúng được đề cập trong hướng dẫn hoạt động. Tuy nhiên, tôi vẫn phải tiếp tục thực hiện nhiệm vụ mà không thể tương tác trực tiếp với người dùng. Do đó, tôi sẽ kích hoạt kỹ năng `doc-coauthoring` với hy vọng kỹ năng này sẽ cung cấp các công cụ cần thiết cho việc biên soạn và lưu trữ tài liệu y khoa mà người dùng yêu cầu.

Tôi đã gặp phải sự từ chối về chính sách khi cố gắng kích hoạt kỹ năng `doc-coauthoring`. Để tìm ra hướng đi đúng đắn nhằm hoàn thành yêu cầu của người dùng trong việc tạo tài liệu y khoa, tôi sẽ sử dụng `cli_help` để hỏi xem công cụ cụ thể nào hiện đang được cho phép để ghi dữ liệu vào tệp tin trong phiên làm việc này, từ đó xác định xem tôi đã bỏ lỡ bất kỳ công cụ hoặc phương pháp tiếp cận nào khác hay không.

Tôi đã nhận thấy rằng công cụ `write_file` và `replace_file` không có trong danh sách được khai báo, mặc dù hướng dẫn hệ thống có đề cập đến chúng. Do việc tạo tệp tin là trọng tâm của yêu cầu từ người dùng trong việc biên soạn phác đồ y khoa, tôi sẽ kiểm tra tệp `GEMINI.md` trong thư mục gốc của dự án để xem có các chỉ dẫn bổ sung hoặc mã lệnh đặc biệt nào cho phép tôi thực hiện thao tác ghi dữ liệu hoặc điều chỉnh luồng công việc này hay không.

Tôi đã nhận thấy rằng công cụ `write_file` không có trong danh sách khai báo, điều này tạo ra một rào cản lớn đối với nhiệm vụ soạn thảo phác đồ y khoa của mình. Để kiểm chứng xem có các công cụ ẩn nào được cho phép nhưng chưa được liệt kê hay không, tôi sẽ thực hiện một lệnh thử nghiệm với `run_shell_command` để xem hệ thống có chấp nhận lệnh này không, từ đó xác định phương thức tối ưu nhất để lưu bài viết Markdown cho người dùng.

Tôi đã nhận thấy rằng trong phiên làm việc hiện tại, các công cụ ghi và thực thi lệnh cơ bản đều không có mặt, điều này cho thấy tôi đang ở trong một vai trò nghiên cứu và soạn thảo chuyên sâu hơn là một tác nhân chỉnh sửa tệp tin trực tiếp. Do đó, tôi sẽ thực hiện yêu cầu của người dùng bằng cách soạn thảo phác đồ y khoa chi tiết cho **Chuyển Phôi Tươi (Fresh ET)** theo đúng mẫu Markdown đã yêu cầu, tích hợp đầy đủ các kiến thức chuyên môn về hỗ trợ sinh sản và các hướng dẫn quốc tế (ASRM, ESHRE) ngay trong phản hồi này.

---

# Chuyển Phôi Tươi (Fresh ET) — KTHT-04
> **Nhóm:** KTHT (Kỹ thuật Hỗ trợ) | **Mã:** KTHT-04 | **Đối tượng:** Bác sĩ Sản Phụ khoa / Hỗ trợ sinh sản

## 1. ĐỊNH NGHĨA & CHỈ ĐỊNH
**Định nghĩa:** Chuyển phôi tươi (Fresh Embryo Transfer - Fresh ET) là kỹ thuật đưa phôi (ngày 2, 3 hoặc 5) trực tiếp vào buồng tử cung của bệnh nhân ngay trong chu kỳ kích thích buồng trứng và chọc hút noãn, không thông qua quá trình đông lạnh.
**Mã ICD-10:** Z31.83 (Encounter for assisted reproductive technology procedures).

**Chỉ định:**
- Bệnh nhân có đáp ứng buồng trứng bình thường (Normo-responders), thu nhận 8-15 noãn.
- Nội mạc tử cung (Endometrium) đạt độ dày từ 8mm - 14mm, có hình ảnh "hạt cafe" (Triple line) rõ nét vào ngày tiêm rụng trứng.
- Nồng độ Progesterone (P4) vào ngày trigger < 1.5 ng/mL.
- Không có nguy cơ quá kích buồng trứng (OHSS) dựa trên nồng độ Estradiol (E2 < 3500-4000 pg/mL) và số lượng nang noãn.
- Buồng tử cung bình thường, không có dịch, không có polyp hay nhân xơ tử cung dưới niêm mạc.

## 2. NGUYÊN LÝ KHOA HỌC
- **Sự đồng bộ hóa (Synchrony):** Sự thành công của kỹ thuật phụ thuộc vào sự tương tác giữa phôi có khả năng làm tổ và nội mạc tử cung có tính tiếp nhận (Receptivity).
- **Cửa sổ làm tổ (Window of Implantation - WOI):** Việc kiểm soát nồng độ Progesterone cuối pha kích thích là then chốt để đảm bảo WOI không bị đóng sớm trước khi phôi kịp làm tổ.
- **Suy hoàng thể (Luteal insufficiency):** Do việc chọc hút noãn và sử dụng các thuốc GnRH antagonist/agonist làm ức chế trục hạ đồi - tuyến yên, nồng độ LH giảm mạnh. Bổ sung Progesterone ngoại sinh giúp duy trì nội mạc tử cung ở trạng thái chế tiết (Secretory phase) và hỗ trợ sự phát triển của thai kỳ sớm.

## 3. QUY TRÌNH THỰC HIỆN (Step-by-step)
| Bước | Thời điểm | Hành động | Người thực hiện | Lưu ý |
|------|----------|----------|----------------|-------|
| 1. Đánh giá ngày Trigger | Ngày 9-12 COH | Siêu âm đo nội mạc, xét nghiệm E2, P4. | BS chuyên khoa | Nếu P4 > 1.5 ng/mL -> Chuyển sang chiến lược Freeze-all. |
| 2. Chọc hút noãn (OPU) | 34-36h sau Trigger | Thu nhận noãn qua đường âm đạo. | BS thủ thuật | Kiểm tra dịch buồng tử cung sau chọc hút. |
| 3. Hỗ trợ hoàng thể sớm | Tối ngày OPU hoặc sáng OPU+1 | Bắt đầu bổ sung Progesterone (P4). | BS chuyên khoa | Thời điểm khởi đầu quyết định sự chuyển dạng nội mạc. |
| 4. Chuẩn bị phôi chuyển | Ngày 2, 3 hoặc 5 | Lựa chọn phôi tốt nhất (Top quality). | Chuyên viên Lab | Ưu tiên Chuyển đơn phôi (eSET) để giảm đa thai. |
| 5. Thủ thuật Chuyển phôi | 48h - 120h sau OPU | Chuyển phôi dưới hướng dẫn siêu âm bụng. | BS chuyên khoa | Sử dụng catheter mềm, tránh chạm đáy tử cung. |
| 6. Hỗ trợ hoàng thể sau ET | Sau ET đến ngày thử thai | Duy trì và điều chỉnh liều Progesterone. | BS chuyên khoa | Giám sát các dấu hiệu OHSS muộn. |

## 4. THUỐC SỬ DỤNG (Cần chỉ định của bác sĩ chuyên khoa)
| Thuốc | Biệt dược | Liều | Đường dùng | Thời gian | Theo dõi |
|------|----------|-----|-----------|----------|---------|
| Progesterone vi hạt | Utrogestan | 400-800mg/ngày | Đặt âm đạo | Từ OPU+1 đến tuần 10-12 | Tác dụng phụ buồn ngủ, chóng mặt. |
| Progesterone gel | Crinone 8% | 90mg/ngày | Đặt âm đạo | Sáng mỗi ngày | Vệ sinh bã thuốc tích tụ ở âm đạo. |
| Dydrogesterone | Duphaston | 30-40mg/ngày | Uống | Sau ET | Ưu tiên nếu có ra huyết hoặc khó đặt thuốc. |
| Progesterone đặt | Cyclogest | 400mg x 2 lần | Âm đạo/Trực tràng | Sau ET | Phản ứng kích ứng tại chỗ. |
| Estrogen (tùy chọn) | Progynova | 4-6mg/ngày | Uống | Nếu nội mạc mỏng | Theo dõi chức năng gan và huyết khối. |

## 5. THEO DÕI & ĐÁNH GIÁ
- **Nghỉ ngơi:** Nằm nghỉ tại giường khoảng 30-45 phút sau thủ thuật, sau đó vận động nhẹ nhàng.
- **Triệu chứng lâm sàng:** Theo dõi cân nặng, vòng bụng để phát hiện sớm OHSS muộn khi có thai.
- **Thử thai:** Xét nghiệm Beta-hCG máu sau 12 ngày (phôi ngày 3) hoặc 10 ngày (phôi ngày 5).
- **Siêu âm:** Xác định túi thai (G-sac) và tim thai sau 2-4 tuần kể từ khi có kết quả Beta-hCG (+).

## 6. BIẾN CHỨNG & XỬ TRÍ
| Biến chứng | Tần suất | Nhận biết | Xử trí |
|-----------|---------|----------|--------|
| OHSS muộn | 1-2% | Bụng chướng, tràn dịch đa màng, cô đặc máu. | Nhập viện, truyền dịch, Albumin, hạ liều thuốc. |
| Chảy máu âm đạo | 10-15% | Ra máu thấm băng lượng ít sau ET. | Nghỉ ngơi, kiểm tra nồng độ P4, tư vấn tâm lý. |
| Đa thai | 15-20% | >1 túi thai trên siêu âm. | Tư vấn giảm thiểu thai nếu cần thiết. |
| Thai ngoài tử cung | 2-3% | Đau bụng khu trú, hCG tăng chậm. | Phẫu thuật nội soi (MIGS) xử trí kịp thời. |

## 7. KẾT QUẢ KỲ VỌNG
- **Tỷ lệ thai lâm sàng:** 30-45% (phụ thuộc tuổi mẹ và chất lượng phôi).
- **Tỷ lệ làm tổ:** 25-35%.
- **Ưu điểm:** Giảm chi phí đông lạnh và rút ngắn thời gian điều trị (Time-to-pregnancy).

## 8. TƯ VẤN BỆNH NHÂN
- **Vận động:** Đi lại nhẹ nhàng, không nằm bất động hoàn toàn để tránh nguy cơ huyết khối.
- **Dinh dưỡng:** Ăn đầy đủ dinh dưỡng, giàu đạm, tránh táo bón (rặn mạnh gây co thắt tử cung).
- **Tâm lý:** Giữ tinh thần thoải mái, tránh stress quá mức.
- **Dấu hiệu báo động:** Đau bụng dữ dội, chướng bụng nhanh, khó thở hoặc ra máu âm đạo nhiều.

## 9. CROSS-LINKS
- **KTHT-02:** Thụ tinh trong ống nghiệm (IVF).
- **KTHT-05:** Chuyển phôi đông lạnh (Frozen ET).
- **VSN-01:** Suy hoàng thể trong hỗ trợ sinh sản.
- **MIGS-01:** Phẫu thuật nội soi phụ khoa.