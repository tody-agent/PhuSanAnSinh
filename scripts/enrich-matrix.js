/**
 * enrich-matrix.js — Enriches content-matrix.json with detailed, topic-specific medical content
 * Output: content-matrix-v2.json (1200-1500 words per article)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MATRIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'content-matrix.json'), 'utf-8'));

// Import knowledge modules
import { enrichMangThai } from './knowledge/mang-thai.js';
import { enrichHiemMuonNu } from './knowledge/hiem-muon-nu.js';
import { enrichHiemMuonNam } from './knowledge/hiem-muon-nam.js';
import { enrichPhuKhoa } from './knowledge/phu-khoa.js';
import { enrichSieuAm } from './knowledge/sieu-am.js';
import { enrichSKSS } from './knowledge/skss.js';
import { enrichLocalSEO } from './knowledge/local-seo.js';
import { enrichNamKhoa } from './knowledge/nam-khoa.js';
import { enrichSauSinh } from './knowledge/sau-sinh.js';

const enrichers = {
    'mang-thai': (a) => a.slug.includes('sau-sinh') || a.title.toLowerCase().includes('sau sinh') || a.title.toLowerCase().includes('cho con bú') ? enrichSauSinh(a) : enrichMangThai(a),
    'hiem-muon': (a) => a.slug.includes('-nu-') ? enrichHiemMuonNu(a) : (a.slug.includes('-nam-') ? enrichHiemMuonNam(a) : enrichHiemMuonNu(a)), // Default general to Nu
    'phu-khoa': enrichPhuKhoa,
    'sieu-am': enrichSieuAm,
    'suc-khoe-sinh-san': enrichSKSS,
    'local-seo': (a) => a.title.toLowerCase().includes('nam khoa') || a.title.toLowerCase().includes('tinh dịch') ? enrichNamKhoa(a) : enrichLocalSEO(a),
};

const enriched = MATRIX.map(article => {
    const enricher = enrichers[article.category];
    if (!enricher) return article;
    return { ...article, ...enricher(article) };
});

const outPath = path.join(__dirname, 'content-matrix-v2.json');
fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`✅ Enriched ${enriched.length} articles → ${outPath}`);
