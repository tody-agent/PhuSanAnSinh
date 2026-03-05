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

const enrichers = {
    'mang-thai': enrichMangThai,
    'hiem-muon': (a) => a.slug.includes('-nu-') ? enrichHiemMuonNu(a) : enrichHiemMuonNam(a),
    'phu-khoa': enrichPhuKhoa,
    'sieu-am': enrichSieuAm,
    'suc-khoe-sinh-san': enrichSKSS,
    'local-seo': enrichLocalSEO,
};

const enriched = MATRIX.map(article => {
    const enricher = enrichers[article.category];
    if (!enricher) return article;
    return { ...article, ...enricher(article) };
});

const outPath = path.join(__dirname, 'content-matrix-v2.json');
fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`✅ Enriched ${enriched.length} articles → ${outPath}`);
