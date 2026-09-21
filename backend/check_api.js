// removed require
async function check() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  console.log('LOGIN RESPONSE:', loginData.user);
  
  if (loginData.token) {
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();
    console.log('ME RESPONSE:', meData.user);
  }
}
check();
