const loginForm = document.getElementById('loginForm');

function showGlobalSpinner() {
  const s = document.getElementById('globalSpinner');
  if (s) s.classList.remove('hidden');
}
function hideGlobalSpinner() {
  const s = document.getElementById('globalSpinner');
  if (s) s.classList.add('hidden');
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const centerName = document.getElementById('centerName').value.trim();
  const centerCode = document.getElementById('centerCode').value.trim();

  try {
    showGlobalSpinner();
    const res = await fetch('https://edu-backend-6m32.onrender.com/api/auth/login', {
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
  } finally {
    hideGlobalSpinner();
  }
});
