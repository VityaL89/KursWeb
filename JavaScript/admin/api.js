const ADMIN_API_URL = 'http://localhost:3000';

async function adminApiGet(path) {
    const res = await fetch(`${ADMIN_API_URL}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
}

async function adminApiPost(path, data) {
    const res = await fetch(`${ADMIN_API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
}

async function adminApiPut(path, data) {
    const res = await fetch(`${ADMIN_API_URL}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
}

async function adminApiDelete(path) {
    const res = await fetch(`${ADMIN_API_URL}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}
