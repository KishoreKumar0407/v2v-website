/**
 * Manager Management System — integration tests
 * Run: node scripts/test_dynamic_features.cjs
 * Requires server on http://localhost:3001
 */
const API = 'http://localhost:3001';
const MAIN = { Authorization: 'MAIN_ADMIN', 'X-User-Email': 'arunsekar.v2v@gmail.com', 'Content-Type': 'application/json' };
const COFOUNDER = { Authorization: 'CO_FOUNDER', 'X-User-Email': 'sivaramireddy.v2v@gmail.com', 'Content-Type': 'application/json' };

let passed = 0;
let failed = 0;
const ok = (name, cond) => { if (cond) { console.log('✅', name); passed++; } else { console.log('❌', name); failed++; } };

async function run() {
    console.log('=== Manager Tests ===\n');
    const suffix = Date.now();

    // Test A — Create Manager
    const createRes = await fetch(`${API}/api/managers`, {
        method: 'POST', headers: MAIN,
        body: JSON.stringify({
            name: `Financial Management Test ${suffix}`,
            category: 'Finance',
            project_name: 'Financial Projects',
            description: 'Manage financial projects and records',
            fields: [
                { name: 'Project Name', field_type: 'text', required: false },
                { name: 'Technical Name / Version', field_type: 'text', required: false },
                { name: 'Description', field_type: 'long_text', required: false },
                { name: 'Status', field_type: 'select', required: false, options: ['Planning', 'In Progress', 'Completed'] },
                { name: 'Completion', field_type: 'percentage', required: false },
                { name: 'Author', field_type: 'text', required: false },
            ]
        })
    });
    const created = await createRes.json();
    ok('Test A: Create Manager', createRes.ok && created.data?.slug);
    const slug = created.data?.slug;
    if (!slug) {
        console.error('Create failed:', created.error || created);
        process.exit(1);
    }

    // Test B — Configure Fields (via GET)
    const getRes = await fetch(`${API}/api/managers/${slug}`, { headers: MAIN });
    const got = await getRes.json();
    ok('Test B: Fields saved', got.data?.fields?.length === 6);

    // Grant co-founder access
    const usersRes = await fetch(`${API}/api/admin-users`, { headers: MAIN });
    const users = await usersRes.json();
    const siva = users.data?.find(u => u.email === 'sivaramireddy.v2v@gmail.com');
    if (siva) {
        await fetch(`${API}/api/managers/${slug}/permissions/${siva.id}`, {
            method: 'PUT', headers: MAIN, body: JSON.stringify({ granted: true })
        });
    }

    // Test C — Create Record
    const recRes = await fetch(`${API}/api/managers/${slug}/records`, {
        method: 'POST', headers: MAIN,
        body: JSON.stringify({ values: { 'Project Name': 'Alpha', 'Status': 'Completed', 'Completion': '100', 'Author': 'Ashok' } })
    });
    const rec = await recRes.json();
    ok('Test C: Create Record', recRes.ok && rec.data?.id);
    const recordId = rec.data?.id;

    // Test D — Optional fields empty
    const rec2Res = await fetch(`${API}/api/managers/${slug}/records`, {
        method: 'POST', headers: MAIN,
        body: JSON.stringify({ values: { 'Project Name': 'Beta' } })
    });
    ok('Test D: Optional fields empty', rec2Res.ok);

    // Test E — Required field validation
    const updateFields = await fetch(`${API}/api/managers/${slug}/fields`, {
        method: 'PUT', headers: MAIN,
        body: JSON.stringify({
            fields: got.data.fields.map(f => f.name === 'Project Name' ? { ...f, required: true } : f),
            confirmRemove: true
        })
    });
    ok('Test E setup: mark required', updateFields.ok);

    const failRes = await fetch(`${API}/api/managers/${slug}/records`, {
        method: 'POST', headers: MAIN,
        body: JSON.stringify({ values: { 'Status': 'Planning' } })
    });
    ok('Test E: Required validation blocks', !failRes.ok);

    // Test F — Edit Record
    const editRes = await fetch(`${API}/api/managers/${slug}/records/${recordId}`, {
        method: 'PUT', headers: MAIN,
        body: JSON.stringify({ values: { 'Project Name': 'Alpha Updated', 'Status': 'Completed', 'Completion': '100', 'Author': 'Ashok' } })
    });
    ok('Test F: Edit Record', editRes.ok);

    // Test G — Delete Record
    const delRes = await fetch(`${API}/api/managers/${slug}/records/${recordId}`, {
        method: 'DELETE', headers: MAIN
    });
    ok('Test G: Delete Record', delRes.ok);

    // Test H — HR Management different fields
    const hrRes = await fetch(`${API}/api/managers`, {
        method: 'POST', headers: MAIN,
        body: JSON.stringify({
            name: `HR Management Test ${suffix}`,
            category: 'HR',
            project_name: 'HR Operations',
            description: 'HR records',
            fields: [
                { name: 'Employee Name', field_type: 'text', required: false },
                { name: 'Department', field_type: 'text', required: false },
                { name: 'Joining Date', field_type: 'date', required: false },
            ]
        })
    });
    const hr = await hrRes.json();
    ok('Test H: Different manager works', hrRes.ok && hr.data?.slug);

    // Test I — Blog still works
    const blogRes = await fetch(`${API}/api/blogs`, { headers: MAIN });
    ok('Test I: Blog Manager API intact', blogRes.ok || blogRes.status === 403);

    // Test J — Unauthorized co-founder without permission on new feature
    const hrUnauth = await fetch(`${API}/api/managers/${hr.data?.slug}/records`, { headers: COFOUNDER });
    ok('Test J: Unauthorized blocked', hrUnauth.status === 403);

    // Cleanup — soft delete test features
    if (slug) await fetch(`${API}/api/managers/${slug}`, { method: 'DELETE', headers: MAIN });
    if (hr.data?.slug) await fetch(`${API}/api/managers/${hr.data.slug}`, { method: 'DELETE', headers: MAIN });

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
