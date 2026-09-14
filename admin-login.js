const adminLoginForm = document.getElementById('adminLoginForm');

function showGlobalSpinner() {
  const s = document.getElementById('globalSpinner');
  if (s) s.classList.remove('hidden');
}

function hideGlobalSpinner() {
  const s = document.getElementById('globalSpinner');
  if (s) s.classList.add('hidden');
}

adminLoginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('adminEmail')?.value.trim();
  const password = document.getElementById('adminPassword')?.value.trim();

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    showGlobalSpinner();

    const response = await fetch('https://edu-backend-6m32.onrender.com/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Admin login failed');
    }

    localStorage.setItem('edu_admin_authenticated', 'true');
    localStorage.setItem('edu_admin_email', email);
    localStorage.setItem('edu_admin_name', data?.adminName || 'Admin');

    window.location.href = 'admin-sessions.html';
  } catch (error) {
    alert(error.message || 'Admin login failed');
  } finally {
    hideGlobalSpinner();
  }
});
