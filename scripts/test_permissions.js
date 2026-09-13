(async()=>{
  const API = 'http://localhost:3001';
  const mainEmail = 'arunsekar.v2v@gmail.com';
  const mainRole = 'main_admin';
  try {
    let r = await fetch(API + '/api/admin-users', { headers: { 'Authorization': mainRole, 'X-User-Email': mainEmail } });
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch (e) { console.error('Non-JSON response for /api/admin-users:', text); return; }
    console.log('GET /api/admin-users status', r.status);
    const users = d.data;
    if (!users || users.length === 0) { console.error('No users'); process.exit(0); }
    const target = users.find(u => u.role !== 'main_admin');
    if (!target) { console.error('No non-main user found'); console.log(users); process.exit(0); }
    console.log('Target user:', target.email, target.id, target.role);

    r = await fetch(API + '/api/admin-users/' + target.id + '/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': mainRole, 'X-User-Email': mainEmail },
      body: JSON.stringify({ can_manage_blogs: true, can_manage_experiments: false })
    });
    d = await r.json();
    console.log('PUT permissions status', r.status, d);

    r = await fetch(API + '/api/blogs', { headers: { 'Authorization': target.role, 'X-User-Email': target.email } });
    console.log('/api/blogs status', r.status, await r.text());
    r = await fetch(API + '/api/projects', { headers: { 'Authorization': target.role, 'X-User-Email': target.email } });
    console.log('/api/projects status', r.status, await r.text());
  } catch (e) { console.error(e); }
})();
