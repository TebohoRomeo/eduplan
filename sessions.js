const container = document.getElementById('sessionsContainer');
const emptyState = document.getElementById('emptyState');
const centerLabel = document.getElementById('centerLabel');

async function loadSessions() {
  const centerName = localStorage.getItem('edu_center_name');
  const centerCode = localStorage.getItem('edu_center_code');

  if (!centerName || !centerCode) {
    // Redirect to login
    window.location.href = 'login.html';
    return;
  }

  centerLabel.textContent = `${centerName} — ${centerCode}`;

  try {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.classList.remove('hidden');
    const res = await fetch(`https://edu-backend-6m32.onrender.com/api/sessions?centerName=${encodeURIComponent(centerName)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch sessions');

    renderSessions(data || []);
  } catch (err) {
    console.error(err);
    emptyState.textContent = 'Unable to fetch sessions. Is the backend running?';
  } finally {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.classList.add('hidden');
  }
}

function renderSessions(sessions) {
  container.innerHTML = '';
  if (!sessions || !sessions.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  sessions.forEach((s) => {
    const card = document.createElement('article');
    card.className = 'session-card';

    const title = document.createElement('h3');
    title.textContent = `${s.classname || s.className || 'Class'} — ${new Date(s.sessioDate || s.sessioDate).toLocaleDateString?.() || s.sessioDate}`;

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.innerHTML = `<div><strong>Present</strong>: ${s.presentlearners ?? s.presentLearners ?? s.present ?? '-'}</div>
                      <div><strong>Total</strong>: ${s.totalinclass ?? s.TotalInClass ?? s.total ?? '-'}</div>
                      <div><strong>%</strong>: ${s.totallearnerpercentage ?? s.totalLearnerPercentage ?? s.percentage ?? '-'}</div>`;

    const notes = document.createElement('p');
    notes.className = 'session-notes';
    notes.textContent = s.notes || s.Notes || '';

    card.appendChild(title);
    card.appendChild(meta);
    if (notes.textContent) card.appendChild(notes);

    container.appendChild(card);
  });
}

loadSessions();
