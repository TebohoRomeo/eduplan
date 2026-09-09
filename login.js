const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const centerName = document.getElementById('centerName').value.trim();
  const centerCode = document.getElementById('centerCode').value.trim();

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ centerName, centerCode })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Login failed');

    // Save to localStorage and go to planner
    localStorage.setItem('edu_center_name', centerName);
    localStorage.setItem('edu_center_code', centerCode);
    window.location.href = 'index.html';
  } catch (err) {
    alert(err.message || 'Login failed');
  }
});
