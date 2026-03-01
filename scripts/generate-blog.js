import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const MATRIX_FILE = path.join(__dirname, 'content-matrix.json');

// Brand constants
const B = {
    name: 'Phòng Khám An Sinh',
    addr: '416 Minh Khai, Đồng Nguyên, Từ Sơn, Bắc Ninh',
    phone: '0899 268 299',
    drPhone: '0869 935 808',
    hours: 'T2-T7: 17h-22h | CN: 8h-22h',
    bookUrl: 'https://phusanansinh.com/dat-lich-hen-kham.html',
    usp: ['BS chuyên khoa 20+ năm kinh nghiệm', 'Đánh giá 5.0⭐ Google Maps', 'Siêu âm 5D thế hệ mới', 'Kết quả online - tra cứu mọi lúc', 'Bảng giá công khai, minh bạch'],
};

// Content templates by type
const templates = {
    guide: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

${a.tableSection}

## ${a.h2_2}

${a.mainContent}

## Tại ${B.name}

Tại ${B.addr}, chúng tôi cung cấp dịch vụ chất lượng cao:

${B.usp.map(u => `- ✅ **${u}**`).join('\n')}

> **💡 Lời khuyên từ bác sĩ:** ${a.doctorAdvice}

## Khi nào nên đến gặp bác sĩ?

${a.whenToSee}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**
`,

    faq: (a) => `
**${a.hookLine}**

## ${a.title.split(':')[0]}

${a.intro}

${a.tableSection}

## Các câu hỏi thường gặp

${a.faqItems}

## Bác sĩ An Sinh giải đáp

> "${a.doctorAdvice}" — BS. An Sinh

## Tại sao chọn ${B.name}?

${B.usp.map(u => `- 🌟 **${u}**`).join('\n')}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**
`,

    symptom: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

## Dấu hiệu nhận biết

${a.symptoms}

${a.tableSection}

## Nguyên nhân

${a.causes}

## Điều trị tại ${B.name}

${a.treatment}

${B.usp.slice(0, 3).map(u => `- ✅ **${u}**`).join('\n')}

> **💡 Lời khuyên:** ${a.doctorAdvice}

## Phòng ngừa

${a.prevention}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**

*Lưu ý: Bài viết mang tính tham khảo. Vui lòng tham khảo ý kiến bác sĩ chuyên khoa để được tư vấn phù hợp.*
`,

    local: (a) => `
**${a.hookLine}**

## Tại sao nên ${a.localAction} tại ${a.localArea}?

${a.localReasons}

## So sánh ${B.name} vs Bệnh viện tuyến trên

${a.tableSection}

## Dịch vụ tại ${B.name}

${a.services}

## Thông tin phòng khám

- **Địa chỉ:** ${B.addr}
- **Hotline:** ${B.phone}
- **BS tư vấn:** ${B.drPhone}
- **Giờ khám:** ${B.hours}
- **Google Maps:** ⭐ 5.0 — Đánh giá cao nhất khu vực

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Gọi ngay: **${B.phone}**
`,

    comparison: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

## So sánh chi tiết

${a.tableSection}

## ${a.h2_2}

${a.mainContent}

## Lời khuyên từ bác sĩ

> "${a.doctorAdvice}" — BS. An Sinh

## Tại ${B.name}

${B.usp.map(u => `- ✅ **${u}**`).join('\n')}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**
`,

    checklist: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

## Checklist chi tiết

${a.checklistItems}

${a.tableSection}

## Lưu ý quan trọng

${a.mainContent}

> **💡 Bác sĩ khuyên:** ${a.doctorAdvice}

## Tại ${B.name}

${B.usp.map(u => `- ✅ **${u}**`).join('\n')}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**
`,

    journey: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

## ${a.h2_2}

${a.mainContent}

${a.tableSection}

## Hành trình tại ${B.name}

${a.journeySteps}

> "${a.doctorAdvice}" — BS. An Sinh

## Bạn không đơn độc

${B.usp.map(u => `- 💚 **${u}**`).join('\n')}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**
`,

    treatment: (a) => `
**${a.hookLine}**

## ${a.h2_1}

${a.intro}

## Phương pháp điều trị

${a.mainContent}

${a.tableSection}

## Điều trị tại ${B.name}

${a.treatment}

${B.usp.map(u => `- ✅ **${u}**`).join('\n')}

> **💡 Lời khuyên:** ${a.doctorAdvice}

---

**${a.ctaLine}** [Đặt lịch khám](${B.bookUrl}) | Hotline: **${B.phone}**

*Lưu ý: Thông tin mang tính tham khảo. Hãy tham khảo ý kiến bác sĩ chuyên khoa.*
`,
};

function generateFrontmatter(article) {
    const pubDate = generateDate(article.index);
    const readTime = Math.floor(Math.random() * 4) + 5;
    const featured = article.index <= 10 || article.index % 20 === 0;
    return `---
title: "${article.title}"
description: "${article.description}"
pubDate: ${pubDate}
category: "${article.category}"
tags: ${JSON.stringify(article.tags)}
author: "BS. An Sinh"
readingTime: ${readTime}
featured: ${featured}
---`;
}

function generateDate(index) {
    const base = new Date('2026-02-15');
    base.setDate(base.getDate() + Math.floor(index / 3));
    return base.toISOString().split('T')[0];
}

function generateMDX(article) {
    const type = article.type || 'guide';
    const tmpl = templates[type] || templates.guide;
    const fm = generateFrontmatter(article);
    const body = tmpl(article);
    return `${fm}\n${body.trim()}\n`;
}

function main() {
    if (!fs.existsSync(MATRIX_FILE)) {
        console.error('❌ content-matrix.json not found. Run generate-matrix.js first.');
        process.exit(1);
    }

    const articles = JSON.parse(fs.readFileSync(MATRIX_FILE, 'utf-8'));
    if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

    let created = 0, skipped = 0;
    for (const article of articles) {
        const filePath = path.join(BLOG_DIR, `${article.slug}.mdx`);
        if (fs.existsSync(filePath)) {
            skipped++;
            continue;
        }
        const content = generateMDX(article);
        fs.writeFileSync(filePath, content, 'utf-8');
        created++;
    }

    console.log(`\\n✅ Done! Created: \${created} | Skipped (existing): \${skipped} | Total: \${articles.length}`);
}

main();
