/**
 * Fetal Weight Tracker — Calculation Engine
 * Based on INTERGROWTH-21st International Fetal Growth Standards (2020)
 * and Hadlock 3 EFW formula (HC + AC + FL)
 *
 * Data sources:
 * - INTERGROWTH-21st EFW percentiles (weeks 22-40): 10th, 50th, 90th
 * - Early pregnancy estimates (weeks 12-21): composite from published literature
 * - Hadlock 3 formula: Hadlock et al. 1985 (HC, AC, FL)
 *
 * No external dependencies.
 */

/**
 * Standard fetal growth data by gestational week
 * weight: grams (p10, p50, p90)
 * length: cm (crown-to-heel from ~20w, CRL before)
 * fruit: Vietnamese fruit comparison for visualization
 *
 * Weeks 22-40: INTERGROWTH-21st EFW Standards (2020 update, Hadlock 3-param)
 * Weeks 12-21: Composite estimates from published obstetric references
 */
export const FETAL_GROWTH_DATA = {
    12: { weight: { p10: 11, p50: 14, p90: 18 }, length: 5.5, fruit: 'Quả chanh dây', fruitEmoji: '🍋', description: 'Hệ thần kinh phát triển, phản xạ hình thành. Bé bắt đầu cử động nhẹ.' },
    13: { weight: { p10: 18, p50: 23, p90: 29 }, length: 7.0, fruit: 'Quả đào', fruitEmoji: '🍑', description: 'Vân tay hình thành, bé có thể mút ngón tay.' },
    14: { weight: { p10: 33, p50: 43, p90: 55 }, length: 8.5, fruit: 'Quả chanh', fruitEmoji: '🍋', description: 'Bé bắt đầu tiểu vào nước ối. Các cơ mặt hoạt động.' },
    15: { weight: { p10: 55, p50: 70, p90: 88 }, length: 10.0, fruit: 'Quả táo', fruitEmoji: '🍎', description: 'Bé có thể cảm nhận ánh sáng qua bụng mẹ.' },
    16: { weight: { p10: 80, p50: 100, p90: 125 }, length: 11.5, fruit: 'Quả bơ', fruitEmoji: '🥑', description: 'Hệ cơ xương phát triển, bé cử động nhiều hơn.' },
    17: { weight: { p10: 110, p50: 140, p90: 175 }, length: 13.0, fruit: 'Quả lê', fruitEmoji: '🍐', description: 'Mỡ dưới da bắt đầu hình thành, giữ ấm cho bé.' },
    18: { weight: { p10: 150, p50: 190, p90: 235 }, length: 14.0, fruit: 'Quả ớt chuông', fruitEmoji: '🫑', description: 'Bé bắt đầu nghe được âm thanh từ bên ngoài.' },
    19: { weight: { p10: 190, p50: 240, p90: 300 }, length: 15.0, fruit: 'Quả xoài nhỏ', fruitEmoji: '🥭', description: 'Lớp phủ bảo vệ da (vernix caseosa) hình thành.' },
    20: { weight: { p10: 240, p50: 300, p90: 370 }, length: 16.5, fruit: 'Quả chuối', fruitEmoji: '🍌', description: 'Nửa chặng đường! Mẹ bắt đầu cảm nhận bé đạp.' },
    21: { weight: { p10: 300, p50: 360, p90: 440 }, length: 18.0, fruit: 'Quả cà rốt', fruitEmoji: '🥕', description: 'Bé nuốt nước ối và hệ tiêu hóa phát triển.' },
    // INTERGROWTH-21st EFW Standards (2020) — verified data
    22: { weight: { p10: 381, p50: 425, p90: 478 }, length: 19.0, fruit: 'Quả đu đủ nhỏ', fruitEmoji: '🥭', description: 'Mắt và môi phát triển rõ nét, lông mày hình thành.' },
    23: { weight: { p10: 438, p50: 492, p90: 558 }, length: 20.0, fruit: 'Quả xoài', fruitEmoji: '🥭', description: 'Phổi bắt đầu tập thở, da vẫn còn nhăn.' },
    24: { weight: { p10: 502, p50: 568, p90: 651 }, length: 21.0, fruit: 'Bắp ngô', fruitEmoji: '🌽', description: 'Phổi sản xuất surfactant, bé phản ứng với âm thanh.' },
    25: { weight: { p10: 575, p50: 656, p90: 757 }, length: 22.0, fruit: 'Quả bưởi', fruitEmoji: '🍈', description: 'Bé có chu kỳ ngủ-thức rõ ràng.' },
    26: { weight: { p10: 657, p50: 756, p90: 880 }, length: 23.0, fruit: 'Củ cải đường', fruitEmoji: '🥕', description: 'Bé mở mắt lần đầu, phản ứng mạnh với ánh sáng.' },
    27: { weight: { p10: 748, p50: 869, p90: 1019 }, length: 24.0, fruit: 'Quả súp lơ', fruitEmoji: '🥦', description: 'Não phát triển nhanh, bé có thể mơ khi ngủ.' },
    28: { weight: { p10: 851, p50: 997, p90: 1177 }, length: 25.0, fruit: 'Quả bầu nhỏ', fruitEmoji: '🫒', description: 'Bé bắt đầu tích mỡ dưới da, nặng gần 1 kg.' },
    29: { weight: { p10: 964, p50: 1139, p90: 1353 }, length: 26.0, fruit: 'Quả bí ngồi', fruitEmoji: '🥒', description: 'Xương cứng hơn, bé đá mạnh hơn.' },
    30: { weight: { p10: 1089, p50: 1296, p90: 1548 }, length: 27.0, fruit: 'Quả bắp cải', fruitEmoji: '🥬', description: 'Não bộ phát triển các nếp nhăn, tăng cân nhanh.' },
    31: { weight: { p10: 1225, p50: 1468, p90: 1761 }, length: 28.0, fruit: 'Quả dừa', fruitEmoji: '🥥', description: 'Bé xoay đầu, tất cả 5 giác quan hoạt động.' },
    32: { weight: { p10: 1372, p50: 1655, p90: 1990 }, length: 29.0, fruit: 'Quả bí ngô nhỏ', fruitEmoji: '🎃', description: 'Phổi gần hoàn thiện, xương tiếp tục cứng hơn.' },
    33: { weight: { p10: 1530, p50: 1854, p90: 2232 }, length: 30.0, fruit: 'Quả dứa', fruitEmoji: '🍍', description: 'Hệ miễn dịch phát triển, bé tích mỡ nhiều hơn.' },
    34: { weight: { p10: 1696, p50: 2062, p90: 2482 }, length: 32.0, fruit: 'Quả bí đỏ', fruitEmoji: '🎃', description: 'Bé bắt đầu quay đầu xuống chuẩn bị sinh.' },
    35: { weight: { p10: 1869, p50: 2278, p90: 2736 }, length: 33.0, fruit: 'Quả dưa lưới', fruitEmoji: '🍈', description: 'Thận và gan đã hoạt động tốt.' },
    36: { weight: { p10: 2046, p50: 2494, p90: 2986 }, length: 34.0, fruit: 'Quả dưa lưới lớn', fruitEmoji: '🍈', description: 'Bé đủ tháng sớm, cơ quan gần hoàn thiện.' },
    37: { weight: { p10: 2223, p50: 2706, p90: 3224 }, length: 35.0, fruit: 'Quả dưa hấu nhỏ', fruitEmoji: '🍉', description: 'Bé sẵn sàng chào đời, phổi hoàn thiện.' },
    38: { weight: { p10: 2396, p50: 2906, p90: 3440 }, length: 35.5, fruit: 'Quả bí đao', fruitEmoji: '🍉', description: 'Bé tiếp tục tích mỡ, trung bình ~2.9 kg.' },
    39: { weight: { p10: 2558, p50: 3086, p90: 3626 }, length: 36.0, fruit: 'Quả dưa hấu', fruitEmoji: '🍉', description: 'Bé chuẩn bị tốt nhất cho quá trình sinh.' },
    40: { weight: { p10: 2705, p50: 3238, p90: 3771 }, length: 36.5, fruit: 'Quả dưa hấu', fruitEmoji: '🍉', description: 'Đủ tháng! Bé trung bình ~3.2-3.4 kg, sẵn sàng gặp mẹ.' },
};

/**
 * Valid week range for the tracker
 */
export const MIN_WEEK = 12;
export const MAX_WEEK = 40;

/**
 * Get fetal growth data for a specific gestational week
 * @param {number} week - Gestational week (12-40)
 * @returns {object|null} Growth data or null if out of range
 */
export function getFetalDataByWeek(week) {
    const w = Math.floor(week);
    if (w < MIN_WEEK || w > MAX_WEEK) return null;
    return FETAL_GROWTH_DATA[w] || null;
}

/**
 * Classify actual fetal weight against standard percentiles
 * @param {number} week - Gestational week (12-40)
 * @param {number} actualWeightGrams - Actual/estimated weight in grams
 * @returns {{ classification: 'SGA'|'NORMAL'|'LGA', label: string, description: string, percentileRange: string }|null}
 */
export function classifyWeight(week, actualWeightGrams) {
    const data = getFetalDataByWeek(week);
    if (!data) return null;
    if (typeof actualWeightGrams !== 'number' || actualWeightGrams <= 0) return null;

    const { p10, p50, p90 } = data.weight;

    if (actualWeightGrams < p10) {
        return {
            classification: 'SGA',
            label: 'Nhỏ hơn tuổi thai',
            description: 'Cân nặng thai nhi dưới bách phân vị thứ 10. Cần theo dõi sát và tham khảo ý kiến bác sĩ.',
            percentileRange: '< P10',
        };
    }

    if (actualWeightGrams > p90) {
        return {
            classification: 'LGA',
            label: 'Lớn hơn tuổi thai',
            description: 'Cân nặng thai nhi trên bách phân vị thứ 90. Mẹ cần kiểm soát đường huyết và chế độ ăn.',
            percentileRange: '> P90',
        };
    }

    return {
        classification: 'NORMAL',
        label: 'Bình thường',
        description: 'Cân nặng thai nhi nằm trong khoảng bình thường (P10-P90).',
        percentileRange: 'P10 – P90',
    };
}

/**
 * Calculate Estimated Fetal Weight using Hadlock 3 formula
 * Hadlock et al. 1985: log10(EFW) = 1.326 - 0.00326·AC·FL + 0.0107·HC + 0.0438·AC + 0.158·FL
 *
 * @param {number} hcCm - Head Circumference in cm
 * @param {number} acCm - Abdominal Circumference in cm
 * @param {number} flCm - Femur Length in cm
 * @returns {number} Estimated fetal weight in grams
 */
export function calculateEFW(hcCm, acCm, flCm) {
    if (typeof hcCm !== 'number' || typeof acCm !== 'number' || typeof flCm !== 'number') {
        throw new Error('All measurements must be numbers');
    }
    if (hcCm <= 0 || acCm <= 0 || flCm <= 0) {
        throw new Error('All measurements must be positive');
    }

    const log10EFW = 1.326
        - 0.00326 * acCm * flCm
        + 0.0107 * hcCm
        + 0.0438 * acCm
        + 0.158 * flCm;

    const efw = Math.pow(10, log10EFW);
    return Math.round(efw);
}

/**
 * Determine trimester from week
 * @param {number} week
 * @returns {1|2|3}
 */
export function getTrimesterFromWeek(week) {
    if (week <= 13) return 1;
    if (week <= 27) return 2;
    return 3;
}

/**
 * Get nutrition advice based on weight classification and trimester
 * @param {'SGA'|'NORMAL'|'LGA'} classification
 * @param {number} week
 * @returns {{ title: string, items: string[], calories: string }}
 */
export function getNutritionAdvice(classification, week) {
    const trimester = getTrimesterFromWeek(week);

    const baseAdvice = {
        1: { calories: '1.800 – 2.000 kcal/ngày' },
        2: { calories: '2.200 – 2.500 kcal/ngày' },
        3: { calories: '2.400 – 2.800 kcal/ngày' },
    };

    if (classification === 'SGA') {
        return {
            title: 'Tăng cường dinh dưỡng cho bé',
            calories: baseAdvice[trimester].calories,
            items: [
                'Tăng protein: thịt nạc, cá, trứng, đậu phụ (mỗi bữa 150-200g)',
                'Bổ sung sắt: thịt bò, gan, rau xanh đậm (phòng thiếu máu)',
                'Omega-3: cá hồi, cá thu, hạt chia (phát triển não bé)',
                'Ăn thêm bữa phụ: sữa bầu, phô mai, hoa quả giữa các bữa',
                'Uống đủ nước: 2-3 lít/ngày',
                'Nghỉ ngơi đầy đủ, tránh căng thẳng',
            ],
        };
    }

    if (classification === 'LGA') {
        return {
            title: 'Kiểm soát dinh dưỡng hợp lý',
            calories: baseAdvice[trimester].calories,
            items: [
                'Giảm tinh bột trắng: cơm trắng, bánh mì trắng, mì',
                'Hạn chế đường: nước ngọt, bánh kẹo, trái cây quá ngọt',
                'Tăng rau xanh và chất xơ để ổn định đường huyết',
                'Protein vừa đủ: 2-3 khẩu phần/ngày',
                'Kiểm tra đường huyết thai kỳ nếu chưa làm',
                'Vận động nhẹ: đi bộ 30 phút/ngày',
            ],
        };
    }

    // NORMAL
    return {
        title: 'Duy trì chế độ dinh dưỡng cân bằng',
        calories: baseAdvice[trimester].calories,
        items: [
            'Ăn đa dạng: thịt, cá, trứng, rau, trái cây mỗi ngày',
            'Canxi: sữa, phô mai, cá nhỏ ăn cả xương (1.000mg/ngày)',
            'Acid folic: rau xanh đậm, đậu, ngũ cốc nguyên hạt',
            'Sắt: thịt đỏ, gan, rau dền (bổ sung viên sắt theo chỉ định)',
            'DHA: cá biển, dầu cá (hỗ trợ phát triển não bé)',
            'Uống đủ 2-3 lít nước/ngày',
        ],
    };
}

/**
 * Get doctor consultation alert based on classification and week
 * @param {'SGA'|'NORMAL'|'LGA'} classification
 * @param {number} week
 * @returns {{ level: 'info'|'warning'|'urgent', title: string, message: string }}
 */
export function getDoctorAlert(classification, week) {
    if (classification === 'SGA') {
        if (week >= 34) {
            return {
                level: 'urgent',
                title: 'Cần khám bác sĩ sớm',
                message: 'Thai nhi nhỏ hơn tuổi thai ở giai đoạn cuối thai kỳ. Cần siêu âm Doppler đánh giá tuần hoàn rau thai và theo dõi sát Non-stress test (NST).',
            };
        }
        return {
            level: 'warning',
            title: 'Nên khám bác sĩ để đánh giá',
            message: 'Thai nhi nhỏ hơn kỳ vọng. Bác sĩ sẽ đánh giá nguyên nhân (dinh dưỡng, tuần hoàn rau thai) và lên kế hoạch theo dõi phù hợp.',
        };
    }

    if (classification === 'LGA') {
        if (week >= 34) {
            return {
                level: 'urgent',
                title: 'Cần khám bác sĩ sớm',
                message: 'Thai nhi lớn hơn tuổi thai ở giai đoạn cuối. Cần kiểm tra đái tháo đường thai kỳ, đánh giá phương pháp sinh phù hợp.',
            };
        }
        return {
            level: 'warning',
            title: 'Nên khám bác sĩ để kiểm tra',
            message: 'Thai nhi lớn hơn kỳ vọng. Cần xét nghiệm đường huyết và điều chỉnh chế độ ăn. Bác sĩ sẽ tư vấn cụ thể.',
        };
    }

    // NORMAL
    return {
        level: 'info',
        title: 'Thai nhi phát triển tốt',
        message: 'Cân nặng trong phạm vi bình thường. Tiếp tục khám thai định kỳ theo lịch hẹn.',
    };
}

/**
 * Validate ultrasound measurements
 * @param {number} hcCm
 * @param {number} acCm
 * @param {number} flCm
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMeasurements(hcCm, acCm, flCm) {
    if (hcCm !== undefined && (typeof hcCm !== 'number' || hcCm <= 0 || hcCm > 50)) {
        return { valid: false, error: 'Chu vi đầu (HC) phải từ 0.1 đến 50 cm.' };
    }
    if (acCm !== undefined && (typeof acCm !== 'number' || acCm <= 0 || acCm > 50)) {
        return { valid: false, error: 'Chu vi bụng (AC) phải từ 0.1 đến 50 cm.' };
    }
    if (flCm !== undefined && (typeof flCm !== 'number' || flCm <= 0 || flCm > 15)) {
        return { valid: false, error: 'Chiều dài xương đùi (FL) phải từ 0.1 đến 15 cm.' };
    }
    return { valid: true };
}
