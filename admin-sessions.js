const container = document.getElementById('adminSessionsContainer');
const emptyState = document.getElementById('adminEmptyState');
const dateFilter = document.getElementById('adminSessionsDateFilter');
const centerFilter = document.getElementById('adminSessionsCenterFilter');
const classFilter = document.getElementById('adminSessionsClassFilter');
const clearFiltersBtn = document.getElementById('clearAdminFiltersBtn');
const adminUserLabel = document.getElementById('adminUserLabel');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');

let allSessions = [];

function isAdminAuthenticated() {
  return localStorage.getItem('edu_admin_authenticated') === 'true';
}

function redirectToAdminLogin() {
  window.location.href = 'admin-login.html';
}

function loadAdminUserLabel() {
  const name = localStorage.getItem('edu_admin_name') || 'Admin';
  if (adminUserLabel) adminUserLabel.textContent = name;
}

function getFilteredSessions() {
  const selectedDate = dateFilter?.value || '';
  const selectedCenter = centerFilter?.value || '';
  const selectedClass = classFilter?.value || '';

  return allSessions.filter((session) => {
    const sessionDate = session.sessioDate || session.date || '';
    const sessionCenter = session.centerName || session.centername || '';
    const sessionClass = session.className || session.classname || session.class || '';

    const matchesDate = !selectedDate || sessionDate === selectedDate;
    const matchesCenter = !selectedCenter || sessionCenter === selectedCenter;
    const matchesClass = !selectedClass || sessionClass === selectedClass;

    return matchesDate && matchesCenter && matchesClass;
  });
}

function populateCenterFilter() {
  if (!centerFilter) return;

  const centers = [...new Set(allSessions
    .map((session) => session.centerName || session.centername || '')
    .filter(Boolean))].sort();

  const selectedCenter = centerFilter.value || '';

  centerFilter.innerHTML = '<option value="">All centers</option>';
  centers.forEach((center) => {
    const option = document.createElement('option');
    option.value = center;
    option.textContent = center;
    if (center === selectedCenter) option.selected = true;
    centerFilter.appendChild(option);
  });
}

function renderSessions(sessions) {
  container.innerHTML = '';

  if (!sessions || !sessions.length) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  sessions.forEach((session) => {
    const card = document.createElement('article');
    card.className = 'session-card admin-session-card';
    card.style.cursor = 'pointer';

    card.addEventListener('click', () => {
      window.location.href = `session-view.html?id=${encodeURIComponent(session.id)}`;
    });

    const title = document.createElement('h3');
    const dateText = session.sessioDate || session.date || '-';
    title.textContent = `${session.className || session.classname || session.class || 'Class'} — ${dateText}`;

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.innerHTML = `
      <div><strong>Center</strong>: ${session.centerName || session.centername || '-'}</div>
      <div><strong>Present</strong>: ${session.presentlearners ?? session.presentLearners ?? session.present ?? '-'}</div>
      <div><strong>Total</strong>: ${session.totalinclass ?? session.TotalInClass ?? session.total ?? '-'}</div>
      <div><strong>%</strong>: ${session.totallearnerpercentage ?? session.totalLearnerPercentage ?? session.percentage ?? '-'}</div>
    `;

    const notes = document.createElement('p');
    notes.className = 'session-notes';
    notes.textContent = session.notes || session.Notes || '';

    const footer = document.createElement('div');
    footer.className = 'session-card-footer';
    footer.textContent = session.term || 'No term';

    card.appendChild(title);
    card.appendChild(meta);
    if (notes.textContent) card.appendChild(notes);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

async function loadSessions() {
  if (!isAdminAuthenticated()) {
    redirectToAdminLogin();
    return;
  }

  loadAdminUserLabel();

  try {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.classList.remove('hidden');

    const res = await fetch('https://edu-backend-6m32.onrender.com/api/sessions/all');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to fetch all sessions');
    }

    allSessions = Array.isArray(data) ? data : [];
    populateCenterFilter();
    renderSessions(getFilteredSessions());
  } catch (error) {
    console.error(error);
    emptyState.textContent = error.message || 'Unable to load admin sessions.';
    emptyState.style.display = 'block';
  } finally {
    const spinner = document.getElementById('globalSpinner');
    if (spinner) spinner.classList.add('hidden');
  }
}

if (dateFilter) {
  dateFilter.addEventListener('change', () => {
    renderSessions(getFilteredSessions());
  });
}

if (centerFilter) {
  centerFilter.addEventListener('change', () => {
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
    if (centerFilter) centerFilter.value = '';
    if (classFilter) classFilter.value = '';
    renderSessions(getFilteredSessions());
  });
}

if (logoutAdminBtn) {
  logoutAdminBtn.addEventListener('click', () => {
    localStorage.removeItem('edu_admin_authenticated');
    localStorage.removeItem('edu_admin_email');
    localStorage.removeItem('edu_admin_name');
    redirectToAdminLogin();
  });
}

loadSessions();
