const API = 'http://localhost:3001';
const mainAdmin = { email: 'arunsekar.v2v@gmail.com', role: 'MAIN_ADMIN' };
const coFounder = { email: 'sivagurunathan.v2v@gmail.com', role: 'CO_FOUNDER' };

async function runTests() {
  console.log("=================== RUNNING TESTS A THROUGH G ===================");

  // Get users list as Main Admin
  let res = await fetch(`${API}/api/admin-users`, {
    headers: { 'Authorization': mainAdmin.role, 'X-User-Email': mainAdmin.email }
  });
  if (!res.ok) {
    console.error("Failed to fetch admin users:", res.status, await res.text());
    process.exit(1);
  }
  const usersData = await res.json();
  const targetUser = usersData.data.find(u => u.email === coFounder.email);
  if (!targetUser) {
    console.error("Target co-founder not found!");
    process.exit(1);
  }
  const targetId = targetUser.id;
  console.log(`Target Co-Founder ID: ${targetId} (${coFounder.email})`);

  // Helper to update permissions via Main Admin
  async function setPerms(blogs, exp) {
    const r = await fetch(`${API}/api/admin-users/${targetId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': mainAdmin.role,
        'X-User-Email': mainAdmin.email
      },
      body: JSON.stringify({ can_manage_blogs: blogs, can_manage_experiments: exp })
    });
    return r.status;
  }

  // Helper to test Co-Founder endpoint access
  async function testAccess() {
    const blogRes = await fetch(`${API}/api/blogs`, {
      headers: { 'Authorization': coFounder.role, 'X-User-Email': coFounder.email }
    });
    const expRes = await fetch(`${API}/api/projects`, {
      headers: { 'Authorization': coFounder.role, 'X-User-Email': coFounder.email }
    });
    return {
      blogs: blogRes.status,
      experiments: expRes.status
    };
  }

  // TEST A: Blog Manager = ON, Experiment Manager = OFF
  console.log("\n--- TEST A: Blog Manager = ON, Experiment Manager = OFF ---");
  await setPerms(true, false);
  let resA = await testAccess();
  console.log(`Blog Manager API Status: ${resA.blogs} (Expected: 200)`);
  console.log(`Experiment Manager API Status: ${resA.experiments} (Expected: 403)`);
  const passA = resA.blogs === 200 && resA.experiments === 403;
  console.log(`RESULT TEST A: ${passA ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST B: Blog Manager = OFF, Experiment Manager = ON
  console.log("\n--- TEST B: Blog Manager = OFF, Experiment Manager = ON ---");
  await setPerms(false, true);
  let resB = await testAccess();
  console.log(`Blog Manager API Status: ${resB.blogs} (Expected: 403)`);
  console.log(`Experiment Manager API Status: ${resB.experiments} (Expected: 200)`);
  const passB = resB.blogs === 403 && resB.experiments === 200;
  console.log(`RESULT TEST B: ${passB ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST C: Both ON
  console.log("\n--- TEST C: Blog Manager = ON, Experiment Manager = ON ---");
  await setPerms(true, true);
  let resC = await testAccess();
  console.log(`Blog Manager API Status: ${resC.blogs} (Expected: 200)`);
  console.log(`Experiment Manager API Status: ${resC.experiments} (Expected: 200)`);
  const passC = resC.blogs === 200 && resC.experiments === 200;
  console.log(`RESULT TEST C: ${passC ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST D: Both OFF
  console.log("\n--- TEST D: Blog Manager = OFF, Experiment Manager = OFF ---");
  await setPerms(false, false);
  let resD = await testAccess();
  console.log(`Blog Manager API Status: ${resD.blogs} (Expected: 403)`);
  console.log(`Experiment Manager API Status: ${resD.experiments} (Expected: 403)`);
  const passD = resD.blogs === 403 && resD.experiments === 403;
  console.log(`RESULT TEST D: ${passD ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST E: Co-founder attempts to change another user's permissions
  console.log("\n--- TEST E: Co-founder attempts to change permissions ---");
  const resE = await fetch(`${API}/api/admin-users/${targetId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': coFounder.role,
      'X-User-Email': coFounder.email
    },
    body: JSON.stringify({ can_manage_blogs: true, can_manage_experiments: true })
  });
  console.log(`Permission Update Status: ${resE.status} (Expected: 403)`);
  const passE = resE.status === 403;
  console.log(`RESULT TEST E: ${passE ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST F: Co-founder manually accesses Blog Manager without permission
  console.log("\n--- TEST F: Co-founder accesses Blog Manager URL without permission ---");
  await setPerms(false, false);
  const resF = await fetch(`${API}/api/blogs`, {
    headers: { 'Authorization': coFounder.role, 'X-User-Email': coFounder.email }
  });
  console.log(`Direct Blog Manager Access Status: ${resF.status} (Expected: 403)`);
  const passF = resF.status === 403;
  console.log(`RESULT TEST F: ${passF ? 'PASSED ✅' : 'FAILED ❌'}`);

  // TEST G: Co-founder directly calls permission-changing or admin user listing API
  console.log("\n--- TEST G: Co-founder directly calls permission/admin user API ---");
  const resG1 = await fetch(`${API}/api/admin-users`, {
    headers: { 'Authorization': coFounder.role, 'X-User-Email': coFounder.email }
  });
  const resG2 = await fetch(`${API}/api/admin-users/${targetId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': coFounder.role,
      'X-User-Email': coFounder.email
    },
    body: JSON.stringify({ role: 'MAIN_ADMIN' })
  });
  console.log(`GET /api/admin-users Status: ${resG1.status} (Expected: 403)`);
  console.log(`PUT /api/admin-users/:id/role Status: ${resG2.status} (Expected: 403)`);
  const passG = resG1.status === 403 && resG2.status === 403;
  console.log(`RESULT TEST G: ${passG ? 'PASSED ✅' : 'FAILED ❌'}`);

  console.log("\n=================== OVERALL SUMMARY ===================");
  const allPassed = passA && passB && passC && passD && passE && passF && passG;
  console.log(`ALL TESTS: ${allPassed ? 'ALL PASSED 🎉' : 'SOME TESTS FAILED ❌'}`);
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
