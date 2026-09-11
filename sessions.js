const container = document.getElementById('sessionsContainer');
const emptyState = document.getElementById('emptyState');
const centerLabel = document.getElementById('centerLabel');
const dateFilter = document.getElementById('sessionsDateFilter');
const classFilter = document.getElementById('sessionsClassFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

let allSessions = [];

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

    allSessions = Array.isArray(data) ? data : [];
    renderSessions(getFilteredSessions());
  } catch (err) {
    console.error(err);
    emptyState.textContent = 'Unable to fetch sessions. Is the backend running?';
  } finally {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.classList.add('hidden');
  }
}

function getFilteredSessions() {
  const selectedDate = dateFilter?.value || '';
  const selectedClass = classFilter?.value || '';

  return allSessions.filter((session) => {
    const sessionDate = session.sessioDate || session.date || '';
    const sessionClass = session.className || session.classname || session.class || '';

    const matchesDate = !selectedDate || sessionDate === selectedDate;
    const matchesClass = !selectedClass || sessionClass === selectedClass;

    return matchesDate && matchesClass;
  });
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
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `session-view.html?id=${encodeURIComponent(s.id)}`;
    });

    const title = document.createElement('h3');
    const dateText = s.sessioDate || s.date || '-';
    title.textContent = `${s.classname || s.className || 'Class'} — ${dateText}`;

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.innerHTML = `
      <div><strong>Present</strong>: ${s.presentlearners ?? s.presentLearners ?? s.present ?? '-'}</div>
      <div><strong>Total</strong>: ${s.totalinclass ?? s.TotalInClass ?? s.total ?? '-'}</div>
      <div><strong>%</strong>: ${s.totallearnerpercentage ?? s.totalLearnerPercentage ?? s.percentage ?? '-'}</div>
    `;

    const notes = document.createElement('p');
    notes.className = 'session-notes';
    notes.textContent = s.notes || s.Notes || '';

    const footer = document.createElement('div');
    footer.className = 'session-card-footer';
    footer.textContent = s.term || 'No term';

    card.appendChild(title);
    card.appendChild(meta);
    if (notes.textContent) card.appendChild(notes);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

if (dateFilter) {
  dateFilter.addEventListener('change', () => {
    renderSessions(getFilteredSessions());
  });
}

if (classFilter) {
  classFilter.addEventListener('change', () => {
    renderSessions(getFilteredSessions());
  });
}

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener('click', () => {
    if (dateFilter) dateFilter.value = '';
    if (classFilter) classFilter.value = '';
    renderSessions(getFilteredSessions());
  });
}

loadSessions();
