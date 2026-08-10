const SCHOOL_KEY = 'edu_school_name';
const DATE_KEY = 'edu_session_date';
const TERM_KEY = 'edu_session_term';
const SESSIONS_KEY = 'edu_saved_sessions';
const ACTIVE_SESSION_KEY = 'edu_active_session_id';

const schoolSelect = document.getElementById('center-names');
const termSelect = document.getElementById('termSelect');
const sessionDate = document.getElementById('sessionDate');
const saveBtn = document.getElementById('saveBtn');
const newSheetBtn = document.getElementById('newSheetBtn');
const classSelect = document.getElementById('classSelect');
const attendanceStatus = document.getElementById('attendanceStatus');
const presentCount = document.getElementById('presentCount');
const totalLearners = document.getElementById('totalLearners');
const attendancePercentage = document.getElementById('attendancePercentage');
const addLearnerBtn = document.getElementById('addLearnerBtn');
const diagnosticTableBody = document.getElementById('diagnosticTableBody');
const sessionTabs = document.getElementById('sessionTabs');

const schoolOptions = [
  'Golden Gardens',
  'Polokong Primary School',
  'Thabeng Primary School',
  'Lindisa Primary School',
  'Setlabotjha Primary School',
  'Mojala-Thuto Primary School',
  'Mqiniswa Primary School',
  'Moloantoa Primary School',
  'Qhoweng Primary School',
  'Pitseng Primary School'
];

const topicOptions = [
  'Common Fractions',
  'Data Cycle',
  'Mass',
  'Transformations',
  'Probability',
  'Properties of 3D Objects',
  'Lengths',
  'Perimeter, Area & Volume',
  'Properties of 2D-Shapes',
  'Symmetry',
  'Properties of 3D-Shapes'
];

const termOptions = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];

let activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || null;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getSavedSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function persistSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function getSessionById(id) {
  return getSavedSessions().find((session) => session.id === id) || null;
}

function populateSelectOptions(select, options, includeEmpty = true) {
  if (!select) return;
  select.innerHTML = '';

  if (includeEmpty) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = select.id === 'termSelect' ? 'Select term' : 'Select a school / center name';
    select.appendChild(placeholder);
  }

  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function createTopicSelect(selectedValue = '') {
  const select = document.createElement('select');
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a topic';
  select.appendChild(placeholder);

  topicOptions.forEach((topic) => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    if (topic === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  return select;
}

function buildDefaultGroupingsRow() {
  const row = document.createElement('tr');
  const firstCell = document.createElement('td');
  firstCell.className = 'group-name';
  firstCell.textContent = 'Topics';
  row.appendChild(firstCell);

  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('td');
    cell.appendChild(createTopicSelect());
    row.appendChild(cell);
  }

  return row;
}

function formatClassLabel(classValue) {
  if (!classValue) return 'No Class';
  return classValue.startsWith('Grade ') ? classValue : `Grade ${classValue}`;
}

function buildSessionLabel(classValue, nextIndex) {
  const classLabel = formatClassLabel(classValue);
  return `Session ${nextIndex} - ${classLabel}`;
}

function setDefaultFormState() {
  if (schoolSelect) schoolSelect.value = '';
  if (termSelect) termSelect.value = '';
  if (sessionDate) sessionDate.value = getToday();
  if (classSelect) classSelect.value = '';
  if (presentCount) presentCount.value = '';
  if (totalLearners) totalLearners.value = '';
  if (attendancePercentage) attendancePercentage.value = '';

  const notesField = document.querySelector('.notes textarea');
  if (notesField) notesField.value = '';

  const goalsField = document.querySelector('.goals textarea');
  if (goalsField) goalsField.value = '';

  const followUpField = document.querySelector('.follow-up textarea');
  if (followUpField) followUpField.value = '';

  if (diagnosticTableBody) {
    diagnosticTableBody.innerHTML = '';
    diagnosticTableBody.appendChild(buildDefaultGroupingsRow());
  }

  calculatePercentage();
}

function calculatePercentage() {
  const present = Number(presentCount?.value || 0) || 0;
  const total = Number(totalLearners?.value || 0) || 0;

  if (!attendancePercentage) return;

  if (total <= 0) {
    attendancePercentage.value = '0.0%';
    return;
  }

  const percent = (present / total) * 100;
  attendancePercentage.value = `${percent.toFixed(1)}%`;
}

function collectGroupingRows() {
  if (!diagnosticTableBody) return [];

  return Array.from(diagnosticTableBody.querySelectorAll('tr')).map((row) => {
    return Array.from(row.querySelectorAll('td')).map((cell) => {
      const input = cell.querySelector('input, select, textarea');
      if (input) return input.value;
      return cell.textContent.trim();
    });
  });
}

function getCurrentSessionSnapshot() {
  const snapshot = {
    id: activeSessionId || `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label: '',
    school: schoolSelect ? schoolSelect.value : '',
    term: termSelect ? termSelect.value : '',
    date: sessionDate ? sessionDate.value || getToday() : getToday(),
    className: classSelect ? classSelect.value : '',
    present: presentCount ? presentCount.value : '0',
    total: totalLearners ? totalLearners.value : '0',
    percentage: attendancePercentage ? attendancePercentage.value : '0.0%',
    notes: document.querySelector('.notes textarea')?.value || '',
    goals: document.querySelector('.goals textarea')?.value || '',
    followUp: document.querySelector('.follow-up textarea')?.value || '',
    tracking: Array.from(document.querySelectorAll('.tracking-panel input')).map((input) => input.value),
    groupings: collectGroupingRows(),
    createdAt: Date.now()
  };

  const sessionCount = getSavedSessions().length + 1;
  snapshot.label = buildSessionLabel(snapshot.className, sessionCount);
  return snapshot;
}

function addLearnerRow() {
  if (!diagnosticTableBody) return;

  const row = document.createElement('tr');
  row.className = 'learner-row';

  const emptyCell = document.createElement('td');
  emptyCell.className = 'learner-column';
  emptyCell.textContent = '';

  const cells = Array.from({ length: 4 }, () => {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Learner name';
    cell.appendChild(input);
    return cell;
  });

  row.appendChild(emptyCell);
  cells.forEach((cell) => row.appendChild(cell));
  diagnosticTableBody.appendChild(row);
}

function recreateGroupingsTable(rows) {
  if (!diagnosticTableBody) return;

  diagnosticTableBody.innerHTML = '';

  rows.forEach((rowValues) => {
    const row = document.createElement('tr');
    const isLearnerRow = rowValues.length >= 5 && rowValues[0] === '';

    if (isLearnerRow) {
      const firstCell = document.createElement('td');
      firstCell.className = 'learner-column';
      firstCell.textContent = '';
      row.appendChild(firstCell);

      rowValues.slice(1).forEach((value) => {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';
        input.placeholder = 'Learner name';
        cell.appendChild(input);
        row.appendChild(cell);
      });
    } else {
      const firstValue = rowValues[0] || 'Topics';
      const firstCell = document.createElement('td');
      firstCell.className = 'group-name';
      firstCell.textContent = firstValue;
      row.appendChild(firstCell);

      rowValues.slice(1).forEach((value) => {
        const cell = document.createElement('td');
        cell.appendChild(createTopicSelect(value));
        row.appendChild(cell);
      });
    }

    diagnosticTableBody.appendChild(row);
  });
}

function applySessionToForm(session) {
  if (!session) return;

  if (schoolSelect) schoolSelect.value = session.school || '';
  if (termSelect) termSelect.value = session.term || '';
  if (sessionDate) sessionDate.value = session.date || getToday();
  if (classSelect) classSelect.value = session.className || '';
  if (presentCount) presentCount.value = session.present || '0';
  if (totalLearners) totalLearners.value = session.total || '0';
  if (attendancePercentage) attendancePercentage.value = session.percentage || '0.0%';

  const notesField = document.querySelector('.notes textarea');
  if (notesField) notesField.value = session.notes || '';

  const goalsField = document.querySelector('.goals textarea');
  if (goalsField) goalsField.value = session.goals || '';

  const followUpField = document.querySelector('.follow-up textarea');
  if (followUpField) followUpField.value = session.followUp || '';

  if (session.groupings && session.groupings.length) {
    recreateGroupingsTable(session.groupings);
  } else if (diagnosticTableBody) {
    diagnosticTableBody.innerHTML = '';
    diagnosticTableBody.appendChild(buildDefaultGroupingsRow());
  }

  calculatePercentage();
}

function renderSessionTabs() {
  if (!sessionTabs) return;

  const sessions = getSavedSessions();
  sessionTabs.innerHTML = '';

  if (!sessions.length) {
    const emptyState = document.createElement('span');
    emptyState.className = 'session-tab';
    emptyState.textContent = 'No saved sessions';
    sessionTabs.appendChild(emptyState);
    return;
  }

  sessions.forEach((session) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `session-tab${session.id === activeSessionId ? ' active' : ''}`;
    button.textContent = session.label || `Session ${sessions.indexOf(session) + 1}`;
    button.addEventListener('click', () => {
      if (activeSessionId && activeSessionId !== session.id) {
        saveCurrentSession();
      }
      activeSessionId = session.id;
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      applySessionToForm(session);
      renderSessionTabs();
    });
    sessionTabs.appendChild(button);
  });
}

function saveSelection() {
  if (schoolSelect) localStorage.setItem(SCHOOL_KEY, schoolSelect.value);
  if (termSelect) localStorage.setItem(TERM_KEY, termSelect.value);
  if (sessionDate) localStorage.setItem(DATE_KEY, sessionDate.value);
}

function saveCurrentSession({ forceNew = false } = {}) {
  const sessions = getSavedSessions();
  const snapshot = getCurrentSessionSnapshot();

  if (forceNew) {
    snapshot.id = `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    snapshot.label = buildSessionLabel(snapshot.className, sessions.length + 1);
    sessions.push(snapshot);
    activeSessionId = snapshot.id;
  } else {
    const existingIndex = sessions.findIndex((session) => session.id === activeSessionId);

    if (existingIndex >= 0) {
      snapshot.id = activeSessionId;
      snapshot.label = buildSessionLabel(snapshot.className, existingIndex + 1);
      sessions[existingIndex] = snapshot;
    } else {
      snapshot.id = `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      snapshot.label = buildSessionLabel(snapshot.className, sessions.length + 1);
      sessions.push(snapshot);
      activeSessionId = snapshot.id;
    }
  }

  persistSessions(sessions);
  localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
  renderSessionTabs();
  return snapshot;
}

function exportAllSessionsToExcel() {
  const sessions = getSavedSessions();

  if (!sessions.length) {
    window.alert('There are no saved sessions to export yet.');
    return;
  }

  const workbook = XLSX.utils.book_new();

  sessions.forEach((session) => {
    const rows = [];
    rows.push({ Section: 'School', Value: session.school || '' });
    rows.push({ Section: 'Term', Value: session.term || '' });
    rows.push({ Section: 'Date', Value: session.date || '' });
    rows.push({ Section: 'Class', Value: formatClassLabel(session.className) || '' });
    rows.push({ Section: 'Present', Value: session.present || '0' });
    rows.push({ Section: 'Total learners', Value: session.total || '0' });
    rows.push({ Section: 'Percentage', Value: session.percentage || '0.0%' });
    rows.push({ Section: 'Notes', Value: session.notes || '' });
    rows.push({ Section: 'Goals', Value: session.goals || '' });
    rows.push({ Section: 'Follow Up', Value: session.followUp || '' });

    if (Array.isArray(session.tracking) && session.tracking.length) {
      rows.push({ Section: 'Tracking', Value: session.tracking.join(' | ') });
    }

    if (Array.isArray(session.groupings) && session.groupings.length) {
      session.groupings.forEach((rowValues, index) => {
        rows.push({ Section: `Group ${index + 1}`, Value: rowValues.join(' | ') });
      });
    }

    const sheet = XLSX.utils.json_to_sheet(rows);
    const sheetName = (session.label || `Session ${sessions.indexOf(session) + 1}`).substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  XLSX.writeFile(workbook, 'all-sessions.xlsx');
}

if (schoolSelect) {
  schoolSelect.addEventListener('change', saveSelection);
}
if (termSelect) {
  termSelect.addEventListener('change', saveSelection);
}
if (sessionDate) {
  sessionDate.addEventListener('change', saveSelection);
}
if (presentCount) {
  presentCount.addEventListener('input', calculatePercentage);
}
if (totalLearners) {
  totalLearners.addEventListener('input', calculatePercentage);
}
if (addLearnerBtn) {
  addLearnerBtn.addEventListener('click', addLearnerRow);
}

if (attendanceStatus) {
  attendanceStatus.addEventListener('change', () => {
    if (attendanceStatus.value === 'Present') {
      attendanceStatus.style.background = '#ecfdf5';
      attendanceStatus.style.color = '#0f766e';
    } else if (attendanceStatus.value === 'Absent') {
      attendanceStatus.style.background = '#fff1f2';
      attendanceStatus.style.color = '#be123c';
    } else {
      attendanceStatus.style.background = '#fff7ed';
      attendanceStatus.style.color = '#c2410c';
    }
  });
}

if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    saveCurrentSession();
    exportAllSessionsToExcel();
  });
}

if (newSheetBtn) {
  newSheetBtn.addEventListener('click', () => {
    saveCurrentSession({ forceNew: true });
    setDefaultFormState();
    activeSessionId = null;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    renderSessionTabs();
  });
}

function loadSavedValues() {
  populateSelectOptions(schoolSelect, schoolOptions);
  populateSelectOptions(termSelect, termOptions);

  const savedSchool = localStorage.getItem(SCHOOL_KEY) || '';
  const savedTerm = localStorage.getItem(TERM_KEY) || '';
  const savedDate = localStorage.getItem(DATE_KEY) || getToday();

  if (schoolSelect && savedSchool && [...schoolSelect.options].some((option) => option.value === savedSchool)) {
    schoolSelect.value = savedSchool;
  }

  if (termSelect && savedTerm && [...termSelect.options].some((option) => option.value === savedTerm)) {
    termSelect.value = savedTerm;
  }

  if (sessionDate) sessionDate.value = savedDate;

  const sessions = getSavedSessions();
  if (sessions.length) {
    const current = sessions.find((session) => session.id === activeSessionId) || sessions[sessions.length - 1];
    activeSessionId = current.id;
    localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    applySessionToForm(current);
  } else {
    setDefaultFormState();
  }

  renderSessionTabs();
  calculatePercentage();
}

loadSavedValues();
if (attendanceStatus) {
  attendanceStatus.dispatchEvent(new Event('change'));
}
