function adminQs(sel) {
    return document.querySelector(sel);
}

function adminNormalizeIdString(id) {
    return String(id);
}

function adminSafeJsonArray(value) {
    return Array.isArray(value) ? value : [];
}

function adminParseTags(raw) {
    const s = (raw || '').trim();
    if (!s) return [];
    return s.split(',').map(t => t.trim()).filter(Boolean);
}

function adminFormatTags(tags) {
    return adminSafeJsonArray(tags).join(', ');
}

function adminFormDataToObject(form) {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) {
        obj[k] = v;
    }
    return obj;
}
