// ── State
let allItems = [];
let activeFilter = 'all';
let editingId = null;

// ── Init
document.addEventListener('DOMContentLoaded', () => {
  const today = todayStr();
  document.getElementById('dueInput').value = today;
  document.getElementById('dueInput').min = today;
  load(() => { renderAll(); setupListeners(); });
});

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function load(cb) {
  chrome.storage.local.get('followups', r => {
    allItems = r.followups || [];
    cb();
  });
}

function save(cb) {
  chrome.storage.local.set({ followups: allItems }, cb || (() => {}));
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m)-1]}`;
}

function classify(item) {
  if (item.done) return 'done';
  const today = todayStr();
  if (item.due < today) return 'overdue';
  if (item.due === today) return 'today';
  return 'upcoming';
}

function sortByDate(arr) {
  return [...arr].sort((a, b) => a.due > b.due ? 1 : -1);
}

// ── Listeners
function setupListeners() {
  document.getElementById('addBtn').addEventListener('click', addItem);
  document.getElementById('taskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addItem();
  });
  document.getElementById('clientInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('taskInput').focus();
  });
  document.querySelectorAll('.stat').forEach(s => {
    s.addEventListener('click', () => {
      activeFilter = s.dataset.filter;
      syncFilterBtns(); renderList();
    });
  });
  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      syncFilterBtns(); renderList();
    });
  });
  document.getElementById('exportBtn').addEventListener('click', exportCSV);
  document.getElementById('clearDoneBtn').addEventListener('click', clearDone);
}

function syncFilterBtns() {
  document.querySelectorAll('.fbtn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === activeFilter);
  });
}

// ── Add
function addItem() {
  const client   = document.getElementById('clientInput').value.trim();
  const task     = document.getElementById('taskInput').value.trim();
  const due      = document.getElementById('dueInput').value;
  const priority = document.getElementById('priorityInput').value;
  if (!client) { shake('clientInput'); return; }
  if (!task)   { shake('taskInput');   return; }
  if (!due)    { shake('dueInput');    return; }
  allItems.unshift({
    id: Date.now().toString(),
    client, task, due, priority,
    done: false,
    createdAt: Date.now()
  });
  save(() => {
    document.getElementById('clientInput').value = '';
    document.getElementById('taskInput').value = '';
    document.getElementById('dueInput').value = todayStr();
    renderAll();
    showToast('Follow-up logged ✓');
  });
}

function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#E8402A';
  el.focus();
  setTimeout(() => el.style.borderColor = '', 1200);
}

// ── Render
function renderAll() { renderStats(); renderList(); updateHeader(); }

function renderStats() {
  const counts = { overdue: 0, today: 0, upcoming: 0, done: 0 };
  allItems.forEach(i => counts[classify(i)]++);
  document.getElementById('countOverdue').textContent  = counts.overdue;
  document.getElementById('countToday').textContent    = counts.today;
  document.getElementById('countUpcoming').textContent = counts.upcoming;
  document.getElementById('countDone').textContent     = counts.done;
  const overdueEl = document.getElementById('countOverdue');
  if (counts.overdue > 0) {
    overdueEl.classList.add('pulse');
  } else {
    overdueEl.classList.remove('pulse');
  }
}

function updateHeader() {
  const overdue = allItems.filter(i => classify(i) === 'overdue').length;
  const pending = allItems.filter(i => !i.done).length;
  const sub = document.getElementById('headerSub');
  if (overdue > 0) {
    sub.textContent = `⚠️ ${overdue} overdue — act now`;
    sub.style.color = '#E8402A';
  } else if (pending === 0) {
    sub.textContent = '✅ All clear! Great work.';
    sub.style.color = '#16A34A';
  } else {
    sub.textContent = `${pending} pending follow-up${pending !== 1 ? 's' : ''}`;
    sub.style.color = '';
  }
}

function renderList() {
  const el = document.getElementById('listSection');
  const filtered = activeFilter === 'all'
    ? allItems
    : allItems.filter(i => classify(i) === activeFilter);

  if (filtered.length === 0) {
    const msgs = {
      all:      ['📋','Nothing logged yet.','Add your first follow-up above.'],
      overdue:  ['🎉','No overdue items!','You\'re on top of things.'],
      today:    ['☀️','Nothing due today.','Enjoy the breathing room.'],
      upcoming: ['📅','No upcoming items.','Log your next commitment above.'],
      done:     ['✅','No completed items yet.','Mark follow-ups done as you go.'],
    };
    const [icon, title, sub] = msgs[activeFilter] || msgs.all;
    el.innerHTML = `<div class="empty"><span class="e-icon">${icon}</span><strong>${title}</strong><br>${sub}</div>`;
    return;
  }

  if (activeFilter === 'all') {
    const groups = {
      overdue:  sortByDate(filtered.filter(i => classify(i) === 'overdue')),
      today:    sortByDate(filtered.filter(i => classify(i) === 'today')),
      upcoming: sortByDate(filtered.filter(i => classify(i) === 'upcoming')),
      done:     sortByDate(filtered.filter(i => classify(i) === 'done')),
    };
    let html = '';
    if (groups.overdue.length)  html += groupHTML('🔴 Overdue', groups.overdue);
    if (groups.today.length)    html += groupHTML('🟡 Due Today', groups.today);
    if (groups.upcoming.length) html += groupHTML('🔵 Upcoming', groups.upcoming);
    if (groups.done.length) {
      html += `<div class="done-toggle" id="doneToggle">▸ Show ${groups.done.length} completed</div>
               <div id="doneGroup" style="display:none">${itemsHTML(groups.done)}</div>`;
    }
    el.innerHTML = html;
    const tog = document.getElementById('doneToggle');
    if (tog) {
      tog.addEventListener('click', () => {
        const dg = document.getElementById('doneGroup');
        const open = dg.style.display !== 'none';
        dg.style.display = open ? 'none' : 'block';
        tog.textContent = open
          ? `▸ Show ${groups.done.length} completed`
          : `▾ Hide completed`;
      });
    }
  } else {
    el.innerHTML = itemsHTML(sortByDate(filtered));
  }

  wireActions();
}

function groupHTML(label, items) {
  return `<div class="group-label">${label}</div>${itemsHTML(items)}`;
}

function itemsHTML(items) {
  return items.map(item => itemHTML(item)).join('');
}

function itemHTML(item) {
  const cls = classify(item);
  const checked   = item.done ? 'checked' : '';
  const checkIcon = item.done ? '✓' : '';
  const dueLabel = {
    overdue:  `Overdue · ${formatDate(item.due)}`,
    today:    'Due Today',
    upcoming: `Due ${formatDate(item.due)}`,
    done:     `Done · ${formatDate(item.due)}`,
  }[cls];
  const priLabel = { high:'🔴 High', medium:'🟡 Med', low:'🟢 Low' }[item.priority];
  const isEditing = editingId === item.id;

  return `
    <div class="item ${item.done ? 'done-item' : ''}" data-id="${item.id}">
      <div class="item-check ${checked}" data-id="${item.id}">${checkIcon}</div>
      <div class="item-body">
        <div class="item-client">${esc(item.client)}</div>
        <div class="item-task">${esc(item.task)}</div>
        <div class="item-meta">
          <span class="due-badge due-${cls}">${dueLabel}</span>
          <span class="pri-badge pri-${item.priority}">${priLabel}</span>
        </div>
        ${isEditing ? `
        <div class="edit-row" style="flex-direction:column; align-items:stretch;">
          <input
            type="text"
            class="edit-task"
            value="${esc(item.task)}"
            placeholder="Edit commitment..."
            style="width:100%; margin-bottom:6px;"
          />
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <input type="date" class="edit-due" value="${item.due}" style="width:140px" />
            <select class="edit-pri" style="width:110px">
              <option value="high"   ${item.priority==='high'   ?'selected':''}>🔴 High</option>
              <option value="medium" ${item.priority==='medium' ?'selected':''}>🟡 Medium</option>
              <option value="low"    ${item.priority==='low'    ?'selected':''}>🟢 Low</option>
            </select>
            <button class="edit-save" data-id="${item.id}">Save</button>
            <button class="edit-cancel">Cancel</button>
          </div>
        </div>` : ''}
      </div>
      <div class="item-actions">
        <button class="item-btn edit" data-id="${item.id}" title="Edit">✏️</button>
        <button class="item-btn del"  data-id="${item.id}" title="Delete">✕</button>
      </div>
    </div>`;
}

// ── Wire up all button actions after render
function wireActions() {
  document.querySelectorAll('.item-check').forEach(btn => {
    btn.addEventListener('click', () => toggleDone(btn.dataset.id));
  });
  document.querySelectorAll('.item-btn.del').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
  });
  document.querySelectorAll('.item-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = editingId === btn.dataset.id ? null : btn.dataset.id;
      renderList();
    });
  });
  document.querySelectorAll('.edit-save').forEach(btn => {
    btn.addEventListener('click', () => saveEdit(btn.dataset.id));
  });
  document.querySelectorAll('.edit-cancel').forEach(btn => {
    btn.addEventListener('click', () => { editingId = null; renderList(); });
  });
}

// ── Actions
function toggleDone(id) {
  const idx = allItems.findIndex(i => i.id === id);
  if (idx === -1) return;
  allItems[idx].done = !allItems[idx].done;
  save(() => {
    renderAll();
    showToast(allItems[idx].done ? 'Marked complete ✓' : 'Reopened');
  });
}

function deleteItem(id) {
  allItems = allItems.filter(i => i.id !== id);
  save(() => { renderAll(); showToast('Deleted'); });
}

function saveEdit(id) {
  const idx = allItems.findIndex(i => i.id === id);
  if (idx === -1) return;
  const newTask = document.querySelector('.edit-task').value.trim();
  const newDue  = document.querySelector('.edit-due').value;
  const newPri  = document.querySelector('.edit-pri').value;
  if (newTask) allItems[idx].task     = newTask;
  if (newDue)  allItems[idx].due      = newDue;
  allItems[idx].priority = newPri;
  editingId = null;
  save(() => { renderAll(); showToast('Updated ✓'); });
}

function clearDone() {
  const count = allItems.filter(i => i.done).length;
  if (count === 0) { showToast('No completed items to clear'); return; }
  allItems = allItems.filter(i => !i.done);
  save(() => { renderAll(); showToast(`Cleared ${count} completed ✓`); });
}

function exportCSV() {
  if (allItems.length === 0) { showToast('Nothing to export yet'); return; }
  let csv = 'Client,Task,Due Date,Priority,Status,Created\n';
  allItems.forEach(item => {
    const status  = item.done ? 'Done' : classify(item);
    const created = new Date(item.createdAt).toISOString().split('T')[0];
    csv += `"${item.client}","${item.task}","${item.due}","${item.priority}","${status}","${created}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `followup-ticker-${todayStr()}.csv`;
  a.click();
  showToast('Exported as CSV ✓');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}