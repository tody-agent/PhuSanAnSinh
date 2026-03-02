/**
 * Vietnamese-Aware Client-Side Search Engine
 * Handles diacritics, fuzzy matching, and ranking.
 * Zero external dependencies.
 */

/**
 * Normalize Vietnamese text: lowercase, remove diacritics, đ→d
 * @param {string} text
 * @returns {string}
 */
export function normalize(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Score a single entry against search tokens
 * @param {Object} entry - Search index entry
 * @param {string[]} tokens - Normalized search tokens
 * @param {string} normalizedQuery - Full normalized query string
 * @returns {number} Score (0 = no match)
 */
function scoreEntry(entry, tokens, normalizedQuery) {
    if (!tokens.length) return 0;

    const title = normalize(entry.t);
    const desc = normalize(entry.d);
    const tags = (entry.k || []).map(normalize);
    const cat = normalize(entry.c);

    // All tokens must appear somewhere in the entry
    const allMatch = tokens.every(
        (tk) =>
            title.includes(tk) ||
            desc.includes(tk) ||
            tags.some((tag) => tag.includes(tk)) ||
            cat.includes(tk)
    );

    if (!allMatch) return 0;

    let score = 1; // Base: matched

    // Title exact contains full query
    if (title.includes(normalizedQuery)) score += 15;

    // Title starts with query
    if (title.startsWith(normalizedQuery)) score += 8;

    // Per-token title match bonus
    tokens.forEach((tk) => {
        if (title.includes(tk)) score += 6;
        if (tags.some((tag) => tag.includes(tk))) score += 3;
        if (cat.includes(tk)) score += 2;
        if (desc.includes(tk)) score += 1;
    });

    // Type bonus: tools rank higher than blog for utility queries
    if (entry.y === 'tool') score += 2;
    if (entry.y === 'page') score += 1;

    return score;
}

/**
 * Search the index with a query string
 * @param {string} query - Raw user query
 * @param {Object[]} index - Search index entries
 * @param {number} [limit=8] - Max results
 * @returns {Object[]} Ranked results with score
 */
export function search(query, index, limit = 8) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    const tokens = normalizedQuery.split(' ').filter(Boolean);
    if (!tokens.length) return [];

    const scored = [];
    for (let i = 0; i < index.length; i++) {
        const s = scoreEntry(index[i], tokens, normalizedQuery);
        if (s > 0) scored.push({ ...index[i], _score: s });
    }

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
}

/**
 * Highlight matched text with <mark> tags
 * @param {string} text - Original text
 * @param {string} query - Raw user query
 * @returns {string} HTML string with highlights
 */
export function highlight(text, query) {
    if (!text || !query) return text || '';
    const normalizedQuery = normalize(query);
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    if (!tokens.length) return text;

    // Build regex from tokens, escaping special chars
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // Match original characters that normalize to our tokens
    let result = text;
    for (const token of escaped) {
        // We match on the normalized version, then highlight the original
        const chars = [];
        let j = 0;
        const normText = normalize(text);
        const starts = [];
        let searchFrom = 0;
        while (true) {
            const idx = normText.indexOf(token, searchFrom);
            if (idx === -1) break;
            starts.push({ start: idx, end: idx + token.length });
            searchFrom = idx + 1;
        }
        // Apply highlights from end to start to preserve indices
        for (let i = starts.length - 1; i >= 0; i--) {
            const { start, end } = starts[i];
            result =
                result.slice(0, start) +
                '<mark>' +
                result.slice(start, end) +
                '</mark>' +
                result.slice(end);
        }
    }
    return result;
}
