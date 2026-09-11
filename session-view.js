const detailContent = document.getElementById('sessionDetailContent');
const spinner = document.getElementById('globalSpinner');

function getSessionIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function formatValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function formatClassName(value) {
  if (!value) return 'No class';
  return value.startsWith('Grade ') ? value : `Grade ${value}`;
}

function renderSession(session) {
  if (!detailContent) return;

  const groupings = Array.isArray(session.groupings) ? session.groupings : [];

  const sections = [
    {
      title: 'Session summary',
      items: [
        ['Center', session.centerName || localStorage.getItem('edu_center_name') || '—'],
        ['Date', formatValue(session.sessioDate || session.date)],
        ['Term', formatValue(session.term)],
        ['Class', formatClassName(session.className || session.classname || session.class)],
        ['Present learners', formatValue(session.presentLearners ?? session.present ?? '0')],
        ['Total learners', formatValue(session.TotalInClass ?? session.total ?? '0')],
        ['Percentage', formatValue(session.totalLearnerPercentage ?? session.percentage ?? '0.0%')],
      ]
    },
    {
      title: 'Tracking',
      items: [
        ['Progress', formatValue(session.progress)],
        ['Progress target', formatValue(session.progressTarget)],
        ['Progress outcome', formatValue(session.progressOutcome)],
        ['Accuracy', formatValue(session.accuracy)],
        ['Accuracy target', formatValue(session.accuracyTarget)],
        ['Accuracy outcome', formatValue(session.accuracyOutcome)],
      ]
    },
    {
      title: 'Notes',
      content: formatValue(session.Notes ?? session.notes, 'No notes added.')
    },
    {
      title: 'Goals',
      content: formatValue(session.Goals ?? session.goals, 'No goals added.')
    },
    {
      title: 'Follow up',
      content: formatValue(session.followUp, 'No follow up added.')
    }
  ];

  detailContent.innerHTML = `
    <div class="detail-topline">
      <div>
        <p class="detail-label">Session</p>
        <h2>${formatClassName(session.className || session.classname || session.class)} — ${formatValue(session.sessioDate || session.date)}</h2>
      </div>
      <button class="secondary" type="button" onclick="window.location.href='sessions.html'">Back</button>
    </div>

    ${sections.map((section) => `
      <section class="detail-section">
        <h3>${section.title}</h3>
        ${section.items
          ? `<div class="detail-grid">
              ${section.items.map(([label, value]) => `
                <div class="detail-item">
                  <span class="detail-item-label">${label}</span>
                  <strong>${value}</strong>
                </div>
              `).join('')}
            </div>`
          : `<p class="detail-content-text">${section.content}</p>`}
      </section>
    `).join('')}

    <section class="detail-section">
      <h3>Groupings</h3>
      ${groupings.length
        ? `<div class="groupings-table-wrap">
            <table class="groupings-table">
              <tbody>
                ${groupings.map((row) => `
                  <tr>
                    ${row.map((cell) => `<td>${formatValue(cell)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
        : `<p class="detail-content-text">No grouping data available.</p>`}
    </section>
  `;
}

async function loadSession() {
  const sessionId = getSessionIdFromUrl();

  if (!sessionId) {
    detailContent.innerHTML = '<div class="empty-state">No session selected.</div>';
    return;
  }

  try {
    spinner?.classList.remove('hidden');
    const res = await fetch(`https://edu-backend-6m32.onrender.com/api/sessions/${encodeURIComponent(sessionId)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || 'Unable to load session');

    renderSession(data);
  } catch (err) {
    console.error(err);
    detailContent.innerHTML = `
      <div class="empty-state error-box">
        <h3>Session unavailable</h3>
        <p>${err.message || 'Could not load this session.'}</p>
        <a href="sessions.html" class="secondary-link">Return to sessions</a>
      </div>
    `;
  } finally {
    spinner?.classList.add('hidden');
  }
}

loadSession();
