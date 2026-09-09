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
const trackingTopicSelect = document.getElementById('trackingTopic');
const presentCount = document.getElementById('presentCount');
const totalLearners = document.getElementById('totalLearners');
const attendancePercentage = document.getElementById('attendancePercentage');
const addLearnerBtn = document.getElementById('addLearnerBtn');
const diagnosticTableBody = document.getElementById('diagnosticTableBody');
const diagnosticHeaderRow = document.getElementById('diagnosticHeaderRow');
const addGroupBtn = document.getElementById('addGroupBtn');
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

// Require center login before using planner
const _center = localStorage.getItem('edu_center_name');
const _centerCode = localStorage.getItem('edu_center_code');
if (!(_center && _centerCode)) {
  // Redirect to login page immediately
  window.location.href = 'login.html';
}

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

  const groupCount = getCurrentGroupNames().length - 1; // exclude first column
  for (let i = 0; i < Math.max(1, groupCount); i++) {
    const cell = document.createElement('td');
    cell.appendChild(createTopicSelect());
    row.appendChild(cell);
  }

  return row;
}

function getDefaultGroupNames() {
  return ['Groupings', 'Failed Concepts', 'Misconceptions', 'Common Wrong Answers', 'Red Flags'];
}

function getGroupNamesForSession(session = null) {
  // If session provided and has groupNames, use them. Otherwise use saved global or defaults.
  if (session && Array.isArray(session.groupNames) && session.groupNames.length) return session.groupNames;
  const saved = JSON.parse(localStorage.getItem('edu_group_names') || 'null');
  if (Array.isArray(saved) && saved.length) return saved;
  return getDefaultGroupNames();
}

function getCurrentGroupNames() {
  return getGroupNamesForSession(getSessionById(activeSessionId));
}

function persistGroupNames(names) {
  localStorage.setItem('edu_group_names', JSON.stringify(names));
}

function renderDiagnosticHeader(names) {
  if (!diagnosticHeaderRow) return;
  diagnosticHeaderRow.innerHTML = '';

  names.forEach((name, idx) => {
    const th = document.createElement('th');
    if (idx === 0) {
      th.className = 'group-name';
      const span = document.createElement('span');
      span.textContent = name;
      th.appendChild(span);
    } else {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '8px';

      const input = document.createElement('input');
      input.className = 'group-name-edit';
      input.value = name;
      input.addEventListener('change', () => {
        const current = getCurrentGroupNames();
        current[idx] = input.value;
        persistGroupNames(current);
        const sessions = getSavedSessions();
        const sidx = sessions.findIndex((s) => s.id === activeSessionId);
        if (sidx >= 0) {
          sessions[sidx].groupNames = current;
          persistSessions(sessions);
        }
        renderSessionTabs();
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'group-remove';
      removeBtn.title = `Remove group ${name}`;
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        removeGroupColumn(idx);
      });

      wrapper.appendChild(input);
      wrapper.appendChild(removeBtn);
      th.appendChild(wrapper);
    }
    diagnosticHeaderRow.appendChild(th);
  });
}

  

// group control handlers
function addGroupColumn() {
  const names = getCurrentGroupNames();
  names.push(`Group ${names.length}`);
  persistGroupNames(names);
  // update active session groupNames if saved
  const sessions = getSavedSessions();
  const sidx = sessions.findIndex((s) => s.id === activeSessionId);
  if (sidx >= 0) {
    sessions[sidx].groupNames = names;
    persistSessions(sessions);
  }
  renderDiagnosticHeader(names);
  // rebuild rows to include new column
  const rows = collectGroupingRows();
  rebuildGroupingsBody(rows);
}

function removeGroupColumn(indexToRemove) {
  const names = getCurrentGroupNames();
  if (names.length <= 2) return; // keep at least grouping + one column

  let idx = typeof indexToRemove === 'number' ? indexToRemove : null;
  if (idx === null) return; // must provide index when removing (per-column buttons)

  if (idx <= 0 || idx >= names.length) return;

  names.splice(idx, 1);
  persistGroupNames(names);

  // update all saved sessions to remove that column and update groupNames
  const sessions = getSavedSessions();
  sessions.forEach((s) => {
    if (Array.isArray(s.groupNames)) s.groupNames = s.groupNames.slice();
    else s.groupNames = getDefaultGroupNames();

    if (Array.isArray(s.groupings)) {
      s.groupings = s.groupings.map((r) => {
        const copy = r.slice();
        if (idx < copy.length) copy.splice(idx, 1);
        return copy;
      });
    }
  });
  persistSessions(sessions);

  renderDiagnosticHeader(names);
  const rows = collectGroupingRows();
  rebuildGroupingsBody(rows.map((r) => r.slice(0, names.length)));
}

function rebuildGroupingsBody(rows) {
  if (!diagnosticTableBody) return;
  diagnosticTableBody.innerHTML = '';

  if (!rows || !rows.length) {
    diagnosticTableBody.appendChild(buildDefaultGroupingsRow());
    return;
  }

  rows.forEach((rowValues) => {
    const row = document.createElement('tr');
    const firstCell = document.createElement('td');
    firstCell.className = 'group-name';
    firstCell.textContent = rowValues[0] || '';
    row.appendChild(firstCell);

    const groupNames = getCurrentGroupNames();
    const cellsCount = Math.max(groupNames.length - 1, rowValues.length - 1);

    for (let i = 0; i < cellsCount; i++) {
      const cell = document.createElement('td');
      const val = rowValues[i + 1] || '';
      // If this row is the topics row, render selects
      if ((rowValues[0] || '').toLowerCase() === 'topics') {
        cell.appendChild(createTopicSelect(val));
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = val;
        input.placeholder = 'Learner name / note';
        cell.appendChild(input);
      }
      row.appendChild(cell);
    }

    diagnosticTableBody.appendChild(row);
  });
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
  if (trackingTopicSelect) trackingTopicSelect.value = '';
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
    topic: trackingTopicSelect ? trackingTopicSelect.value : '',
    tracking: Array.from(document.querySelectorAll('.tracking-panel input')).map((input) => input.value),
    groupings: collectGroupingRows(),
    groupNames: getCurrentGroupNames(),
    createdAt: Date.now()
  };

  const sessionCount = getSavedSessions().length + 1;
  snapshot.label = buildSessionLabel(snapshot.className, sessionCount);
  // keep a temporary id so server can correlate results
  snapshot.tempId = snapshot.id;
  return snapshot;
}

function addLearnerRow() {
  if (!diagnosticTableBody) return;

  const row = document.createElement('tr');
  row.className = 'learner-row';

  const emptyCell = document.createElement('td');
  emptyCell.className = 'learner-column';
  emptyCell.textContent = '';

  // create as many columns as current group configuration (excluding first column)
  const groupNames = getCurrentGroupNames();
  const colCount = Math.max(1, (groupNames.length - 1));

  row.appendChild(emptyCell);
  for (let i = 0; i < colCount; i++) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Learner name';
    cell.appendChild(input);
    row.appendChild(cell);
  }

  diagnosticTableBody.appendChild(row);
}

// (removed duplicate static recreateGroupingsTable; using rebuilt dynamic version)

  // New wrapper that respects dynamic header/group count
  function recreateGroupingsTable(rows) {
    // reuse new rebuild function
    rebuildGroupingsBody(rows);
  }

function applySessionToForm(session) {
  if (!session) return;

  if (schoolSelect) schoolSelect.value = session.school || '';
  if (termSelect) termSelect.value = session.term || '';
  if (trackingTopicSelect) trackingTopicSelect.value = session.topic || '';
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

  // Render header inputs based on group names
  renderDiagnosticHeader(getCurrentGroupNames());

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
    const tab = document.createElement('div');
    tab.className = `session-tab-wrapper`;

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

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'session-close';
    closeBtn.title = 'Remove session';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteSession(session.id);
    });

    tab.appendChild(button);
    tab.appendChild(closeBtn);
    sessionTabs.appendChild(tab);
  });

  // Ensure header reflects currently active session or global
  renderDiagnosticHeader(getCurrentGroupNames());
}

function deleteSession(sessionId) {
  const sessions = getSavedSessions();
  const remaining = sessions.filter((s) => s.id !== sessionId);
  persistSessions(remaining);

  // If deleted session was active, pick another or clear form
  if (activeSessionId === sessionId) {
    if (remaining.length) {
      const next = remaining[Math.max(0, remaining.length - 1)];
      activeSessionId = next.id;
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      applySessionToForm(next);
    } else {
      activeSessionId = null;
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      setDefaultFormState();
    }
  }

  renderSessionTabs();
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
    // mark tempId for server reconciliation
    snapshot.tempId = snapshot.id;
    sessions.push(snapshot);
    activeSessionId = snapshot.id;
  } else {
    const existingIndex = sessions.findIndex((session) => session.id === activeSessionId);

    if (existingIndex >= 0) {
      snapshot.id = activeSessionId;
      snapshot.label = buildSessionLabel(snapshot.className, existingIndex + 1);
      snapshot.tempId = snapshot.id;
      sessions[existingIndex] = snapshot;
    } else {
      snapshot.id = `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      snapshot.label = buildSessionLabel(snapshot.className, sessions.length + 1);
      snapshot.tempId = snapshot.id;
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
    rows.push({ Section: 'Topic', Value: session.topic || '' });
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
if (trackingTopicSelect) {
  trackingTopicSelect.addEventListener('change', saveSelection);
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

if (addGroupBtn) {
  addGroupBtn.addEventListener('click', addGroupColumn);
}

// removal is handled per-column via header buttons

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
  saveBtn.addEventListener('click', async () => {
    // Save current session locally first
    saveCurrentSession();
    // Then attempt to persist all local sessions to the server
    await saveAllLocalSessionsToServer();
    // Also export to excel as a convenience
    exportAllSessionsToExcel();
  });
}

async function saveAllLocalSessionsToServer() {
  const sessions = getSavedSessions();
  if (!sessions.length) return;

  try {
    const centerName = localStorage.getItem('edu_center_name') || '';
    // include tempId so server returns it back and we can reconcile
    const payload = sessions.map((s) => ({ ...s, centerName, tempId: s.tempId || s.id }));
    const res = await fetch('https://edu-backend-6m32.onrender.com/api/sessions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to save to server');

    console.log('Saved sessions to server:', data.count);
    // Update local sessions with returned server ids (reconcile by tempId)
    if (Array.isArray(data.sessions) && data.sessions.length) {
      const local = getSavedSessions();
      data.sessions.forEach((r) => {
        const idx = local.findIndex((ls) => (ls.tempId && r.tempId && ls.tempId === r.tempId) || ls.id === r.tempId || ls.id === r.id);
        if (idx >= 0) {
          local[idx].serverId = r.id;
          local[idx].synced = true;
        }
      });
      persistSessions(local);
      renderSessionTabs();
    }
    return data;
  } catch (err) {
    console.warn('Could not save sessions to server:', err.message);
    // Keep UI smooth: notify the user but don't block
    alert('Warning: could not save sessions to server. They are saved locally and will retry later.');
  }
}

if (newSheetBtn) {
  newSheetBtn.addEventListener('click', () => {
    // Save current to local storage (becomes a saved tab)
    const saved = saveCurrentSession({ forceNew: true });

    // Create a new blank active session (unsaved) with a temp id
    const newActiveId = `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    activeSessionId = newActiveId;
    localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);

    setDefaultFormState();
    renderSessionTabs();
  });
}

function loadSavedValues() {
  populateSelectOptions(schoolSelect, schoolOptions);
  populateSelectOptions(termSelect, termOptions);
  populateSelectOptions(trackingTopicSelect, topicOptions);

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
