#!/usr/bin/env node
/**
 * inject-frontmatter.mjs
 * Reads raw .md files from knowledge/ directory, extracts title + description,
 * prepends YAML frontmatter, and writes as .mdx to src/content/handbook/.
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = process.cwd();
const KNOWLEDGE_DIR = join(ROOT, 'knowledge');
const OUTPUT_DIR = join(ROOT, 'src', 'content', 'handbook');

// TAP folder → category slug mapping
const TAP_CATEGORY_MAP = {
    'TAP-01_NenTang': 'nen-tang',
    'TAP-02_VoSinh': 'vo-sinh-hiem-muon',
    'TAP-03_HoTroSinhSan': 'ho-tro-sinh-san',
    'TAP-04_DiTruyen': 'di-truyen',
    'TAP-05_PhuKhoa': 'phu-khoa',
    'TAP-06_SanKhoa': 'san-khoa',
    'TAP-07_HauSan': 'hau-san',
};

const TAP_VOLUME_MAP = {
    'TAP-01_NenTang': 'Tập 1: Nền Tảng Y Khoa',
    'TAP-02_VoSinh': 'Tập 2: Vô Sinh & Hiếm Muộn',
    'TAP-03_HoTroSinhSan': 'Tập 3: Hỗ Trợ Sinh Sản',
    'TAP-04_DiTruyen': 'Tập 4: Di Truyền Học',
    'TAP-05_PhuKhoa': 'Tập 5: Phụ Khoa',
    'TAP-06_SanKhoa': 'Tập 6: Sản Khoa',
    'TAP-07_HauSan': 'Tập 7: Hậu Sản',
};

/**
 * Extract the first # heading as title
 */
function extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    if (match) return match[1].trim();
    // Fallback: first non-empty line
    const lines = content.split('\n').filter((l) => l.trim());
    return lines[0]?.slice(0, 100) || 'Bài viết y khoa';
}

/**
 * Extract first meaningful paragraph as description
 */
function extractDescription(content) {
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip headings, empty lines, blockquotes, tables, separators
        if (
            !trimmed ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('>') ||
            trimmed.startsWith('|') ||
            trimmed.startsWith('---') ||
            trimmed.startsWith('**Giáo sư') ||
            trimmed.startsWith('*(Bài viết')
        ) {
            continue;
        }
        // Clean markdown formatting
        const clean = trimmed
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            .slice(0, 160);
        if (clean.length > 30) return clean;
    }
    return 'Kiến thức y khoa chuyên sâu từ Sản Phụ Khoa An Sinh';
}

/**
 * Escape YAML special characters in strings
 */
function yamlString(str) {
    // Replace problematic chars and wrap in quotes
    const escaped = str.replace(/"/g, '\\"').replace(/\n/g, ' ');
    return `"${escaped}"`;
}

/**
 * Estimate reading time (Vietnamese: ~200 words/min)
 */
function estimateReadingTime(content) {
    const words = content.split(/\s+/).length;
    return Math.max(3, Math.ceil(words / 200));
}

/**
 * Generate slug from filename
 */
function generateSlug(tapFolder, filename) {
    const name = basename(filename, extname(filename));
    const tapPrefix = tapFolder.replace('TAP-0', 'tap').replace('_', '-').toLowerCase();
    return `${tapPrefix}-${name}`.toLowerCase();
}

/**
 * Extract tags from content (look for ICD codes and key medical terms)
 */
function extractTags(content, category) {
    const tags = new Set();

    // Extract ICD-10 codes
    const icdMatches = content.match(/ICD-10:\s*([A-Z]\d+(?:\.\d+)?)/g);
    if (icdMatches) {
        icdMatches.forEach((m) => {
            tags.add(m.replace('ICD-10: ', '').trim());
        });
    }

    // Common medical keywords
    const keywords = [
        'siêu âm', 'IVF', 'IUI', 'PCOS', 'GDM', 'HPV', 'Pap smear',
        'thai ngoài tử cung', 'tiền sản giật', 'vô sinh', 'hiếm muộn',
        'phẫu thuật', 'nội soi', 'chuyển dạ', 'sinh non',
    ];
    for (const kw of keywords) {
        if (content.toLowerCase().includes(kw.toLowerCase())) {
            tags.add(kw);
        }
    }

    // Limit to 6
    return [...tags].slice(0, 6);
}

async function main() {
    console.log('🔬 Inject Frontmatter — Sản Phụ Handbook\n');

    // Clean output dir
    if (existsSync(OUTPUT_DIR)) {
        await rm(OUTPUT_DIR, { recursive: true });
    }
    await mkdir(OUTPUT_DIR, { recursive: true });

    const tapFolders = (await readdir(KNOWLEDGE_DIR, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && d.name.startsWith('TAP-'))
        .sort((a, b) => a.name.localeCompare(b.name));

    let totalFiles = 0;
    let totalErrors = 0;
    const pubDate = '2026-03-05';

    for (const tapDir of tapFolders) {
        const tapName = tapDir.name;
        const category = TAP_CATEGORY_MAP[tapName];
        const volume = TAP_VOLUME_MAP[tapName];

        if (!category) {
            console.warn(`  ⚠️  Unknown TAP folder: ${tapName}, skipping`);
            continue;
        }

        const tapPath = join(KNOWLEDGE_DIR, tapName);
        const files = (await readdir(tapPath))
            .filter((f) => f.endsWith('.md'))
            .sort();

        console.log(`📁 ${tapName} (${files.length} files) → ${category}`);

        for (const file of files) {
            try {
                const content = await readFile(join(tapPath, file), 'utf-8');
                const title = extractTitle(content);
                const description = extractDescription(content);
                const readingTime = estimateReadingTime(content);
                const slug = generateSlug(tapName, file);
                const tags = extractTags(content, category);

                const frontmatter = [
                    '---',
                    `title: ${yamlString(title)}`,
                    `description: ${yamlString(description)}`,
                    `pubDate: ${pubDate}`,
                    `category: ${category}`,
                    `tags: [${tags.map((t) => yamlString(t)).join(', ')}]`,
                    `author: "Giáo sư Sản Phụ khoa"`,
                    `readingTime: ${readingTime}`,
                    `volume: ${yamlString(volume)}`,
                    '---',
                    '',
                ].join('\n');

                const outputContent = frontmatter + content;
                const outputFile = join(OUTPUT_DIR, `${slug}.md`);
                await writeFile(outputFile, outputContent, 'utf-8');
                totalFiles++;
            } catch (err) {
                console.error(`  ❌ Error processing ${file}: ${err.message}`);
                totalErrors++;
            }
        }
    }

    console.log(`\n✅ Done! ${totalFiles} files written to src/content/handbook/`);
    if (totalErrors > 0) {
        console.log(`⚠️  ${totalErrors} errors occurred.`);
    }
}

main().catch(console.error);
