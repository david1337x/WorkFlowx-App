/**
 * NEXUS Task Manager
 * Ultra-premium standalone To-Do application
 * Pure HTML/CSS/JS — no dependencies
 */

'use strict';

/* ================================================================
   STATE
   ================================================================ */
let tasks = [];
let filter = 'all';
let soundEnabled = true;
let editingId = null;
let dragSrc = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/* ================================================================
   AUDIO ENGINE  — all sounds generated via Web Audio API
   ================================================================ */
const SFX = {
  _resume() { if (audioCtx.state === 'suspended') audioCtx.resume(); },
  _play(fn) { if (!soundEnabled) return; this._resume(); try { fn(); } catch (e) {} },

  add() {
    this._play(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(660, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      o.start(); o.stop(audioCtx.currentTime + 0.18);
    });
  },

  complete() {
    this._play(() => {
      [440, 550, 660].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sine';
        const t = audioCtx.currentTime + i * 0.07;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.start(t); o.stop(t + 0.22);
      });
    });
  },

  uncomplete() {
    this._play(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(550, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(380, audioCtx.currentTime + 0.14);
      g.gain.setValueAtTime(0.09, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      o.start(); o.stop(audioCtx.currentTime + 0.18);
    });
  },

  delete() {
    this._play(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
      o.start(); o.stop(audioCtx.currentTime + 0.14);
    });
  },

  click() {
    this._play(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(800, audioCtx.currentTime);
      g.gain.setValueAtTime(0.06, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
      o.start(); o.stop(audioCtx.currentTime + 0.07);
    });
  },

  save() {
    this._play(() => {
      [700, 900].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sine';
        const t = audioCtx.currentTime + i * 0.06;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        o.start(t); o.stop(t + 0.14);
      });
    });
  },

  hover() {
    this._play(() => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(1200, audioCtx.currentTime);
      g.gain.setValueAtTime(0.018, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      o.start(); o.stop(audioCtx.currentTime + 0.05);
    });
  }
};

/* ================================================================
   PERSISTENCE
   ================================================================ */
function saveTasks() {
  try { localStorage.setItem('nexus_tasks_v2', JSON.stringify(tasks)); } catch (e) {}
}
function loadTasks() {
  try {
    const raw = localStorage.getItem('nexus_tasks_v2');
    if (raw) tasks = JSON.parse(raw);
  } catch (e) { tasks = []; }
}
function savePrefs() {
  try { localStorage.setItem('nexus_prefs', JSON.stringify({ soundEnabled, filter })); } catch (e) {}
}
function loadPrefs() {
  try {
    const raw = localStorage.getItem('nexus_prefs');
    if (raw) { const p = JSON.parse(raw); soundEnabled = p.soundEnabled ?? true; filter = p.filter ?? 'all'; }
  } catch (e) {}
}

/* ================================================================
   DATA HELPERS
   ================================================================ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function getFiltered() {
  if (filter === 'active') return tasks.filter(t => !t.done);
  if (filter === 'completed') return tasks.filter(t => t.done);
  return tasks;
}
function countActive() { return tasks.filter(t => !t.done).length; }
function countDone() { return tasks.filter(t => t.done).length; }

/* ================================================================
   DOM REFS
   ================================================================ */
const $ = id => document.getElementById(id);
const taskInput     = $('task-input');
const taskList      = $('task-list');
const emptyState    = $('empty-state');
const addBtn        = $('add-btn');
const filterAll     = $('filter-all');
const filterActive  = $('filter-active');
const filterComp    = $('filter-completed');
const tabIndicator  = $('tab-indicator');
const clearDoneBtn  = $('clear-completed');
const soundToggle   = $('sound-toggle');
const soundIconOn   = $('sound-icon-on');
const soundIconOff  = $('sound-icon-off');
const charCount     = $('input-char-count');
const progressFill  = $('progress-fill');
const progressLabel = $('progress-label');
const headerDate    = $('header-date');
const modalBackdrop = $('modal-backdrop');
const editInput     = $('edit-input');
const modalClose    = $('modal-close');
const modalCancel   = $('modal-cancel');
const modalSave     = $('modal-save');
const exportLink    = $('export-link');
const loader        = $('loader');
const appEl         = $('app');
const cursorGlow    = $('cursor-glow');

/* ================================================================
   STATS UPDATE
   ================================================================ */
const prevStats = { total: -1, active: -1, done: -1, pct: -1 };
function updateStats() {
  const total = tasks.length;
  const done  = countDone();
  const active = countActive();
  const pct   = total ? Math.round((done / total) * 100) : 0;

  function setVal(id, val, prevKey) {
    if (prevStats[prevKey] === val) return;
    prevStats[prevKey] = val;
    const el = $(id);
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    el.textContent = id === 'stat-pct-val' ? val + '%' : val;
  }
  setVal('stat-total-val', total, 'total');
  setVal('stat-active-val', active, 'active');
  setVal('stat-done-val', done, 'done');
  setVal('stat-pct-val', pct, 'pct');

  $('tab-count-all').textContent = tasks.length;
  $('tab-count-active').textContent = countActive();
  $('tab-count-completed').textContent = countDone();

  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${done} of ${total} completed`;

  clearDoneBtn.style.display = done > 0 ? '' : 'none';
}

/* ================================================================
   FILTER TAB INDICATOR
   ================================================================ */
function positionIndicator() {
  const tabs = { all: filterAll, active: filterActive, completed: filterComp };
  const active = tabs[filter];
  if (!active) return;
  const parent = active.parentElement;
  const parentRect = parent.getBoundingClientRect();
  const rect = active.getBoundingClientRect();
  tabIndicator.style.left   = (rect.left - parentRect.left) + 'px';
  tabIndicator.style.width  = rect.width + 'px';
}
function setFilter(f) {
  filter = f;
  [filterAll, filterActive, filterComp].forEach(el => el.classList.toggle('active', el.dataset.filter === f));
  positionIndicator();
  renderTasks();
  updateStats();
  savePrefs();
}

/* ================================================================
   RENDER TASKS
   ================================================================ */
function renderTasks() {
  const filtered = getFiltered();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    const emptyTitle = $('empty-title');
    const emptySub   = $('empty-sub');
    if (filter === 'completed') {
      emptyTitle.textContent = 'Nothing completed yet';
      emptySub.textContent   = 'Finish some tasks to see them here';
    } else if (filter === 'active') {
      emptyTitle.textContent = 'All caught up!';
      emptySub.textContent   = 'No active tasks — great work';
    } else {
      emptyTitle.textContent = 'No tasks yet';
      emptySub.textContent   = 'Add your first task above to get started';
    }
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach((task, index) => {
    const li = createTaskEl(task, index);
    taskList.appendChild(li);
  });
}

function createTaskEl(task, index) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' completed' : '');
  li.dataset.id = task.id;
  li.setAttribute('role', 'listitem');
  li.style.animationDelay = (index * 40) + 'ms';
  li.draggable = true;

  li.innerHTML = `
    <div class="drag-handle" title="Drag to reorder">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="5" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="9" cy="19" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/>
      </svg>
    </div>
    <div class="task-checkbox" role="checkbox" aria-checked="${task.done}" tabindex="0" title="${task.done ? 'Mark incomplete' : 'Mark complete'}">
      <div class="task-checkbox-ripple"></div>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <div class="task-body">
      <div class="task-text">${escapeHtml(task.text)}</div>
      <div class="task-meta">
        <span class="task-date">${formatDate(task.createdAt)}</span>
        ${task.done ? `<span class="task-badge">Done</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="task-btn edit-btn" title="Edit task (E)" data-id="${task.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="task-btn delete-btn" title="Delete task (Del)" data-id="${task.id}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  `;

  /* -- events -- */
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('click', () => toggleTask(task.id, li));
  checkbox.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTask(task.id, li); } });

  li.querySelector('.edit-btn').addEventListener('click', e => { e.stopPropagation(); openEdit(task.id); SFX.click(); });
  li.querySelector('.delete-btn').addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id, li); });

  /* -- drag & drop -- */
  li.addEventListener('dragstart', e => {
    dragSrc = li;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
    dragSrc = null;
  });
  li.addEventListener('dragover', e => {
    e.preventDefault();
    if (dragSrc && dragSrc !== li) {
      document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
      li.classList.add('drag-over');
    }
  });
  li.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragSrc || dragSrc === li) return;
    const srcId = e.dataTransfer.getData('text/plain');
    const tgtId = task.id;
    reorderTasks(srcId, tgtId);
    SFX.click();
  });

  return li;
}

/* ================================================================
   TASK ACTIONS
   ================================================================ */
function addTask(text) {
  text = text.trim();
  if (!text) return;
  const task = { id: uid(), text, done: false, createdAt: Date.now() };
  tasks.unshift(task);
  saveTasks();
  SFX.add();
  taskInput.value = '';
  charCount.textContent = '0/200';
  charCount.classList.remove('warn');
  rippleEffect(addBtn);
  renderTasks();
  updateStats();
}

function toggleTask(id, liEl) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.completedAt = task.done ? Date.now() : null;
  liEl.classList.add('completing');
  setTimeout(() => liEl.classList.remove('completing'), 400);
  task.done ? SFX.complete() : SFX.uncomplete();
  saveTasks();
  setTimeout(() => { renderTasks(); updateStats(); }, 50);
}

function deleteTask(id, liEl) {
  liEl.classList.add('removing');
  SFX.delete();
  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }, 350);
}

function clearCompleted() {
  const done = tasks.filter(t => t.done);
  if (!done.length) return;
  SFX.delete();
  done.forEach(t => {
    const el = taskList.querySelector(`[data-id="${t.id}"]`);
    if (el) el.classList.add('removing');
  });
  setTimeout(() => {
    tasks = tasks.filter(t => !t.done);
    saveTasks();
    renderTasks();
    updateStats();
  }, 360);
}

function reorderTasks(srcId, tgtId) {
  const srcIdx = tasks.findIndex(t => t.id === srcId);
  const tgtIdx = tasks.findIndex(t => t.id === tgtId);
  if (srcIdx < 0 || tgtIdx < 0) return;
  const [moved] = tasks.splice(srcIdx, 1);
  tasks.splice(tgtIdx, 0, moved);
  saveTasks();
  renderTasks();
  updateStats();
}

/* ================================================================
   EDIT MODAL
   ================================================================ */
function openEdit(id) {
  editingId = id;
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editInput.value = task.text;
  modalBackdrop.classList.remove('hidden');
  requestAnimationFrame(() => { editInput.focus(); editInput.select(); });
}
function closeModal() {
  modalBackdrop.classList.add('hidden');
  editingId = null;
  SFX.click();
}
function saveEdit() {
  if (!editingId) return;
  const text = editInput.value.trim();
  if (!text) return;
  const task = tasks.find(t => t.id === editingId);
  if (task) { task.text = text; task.updatedAt = Date.now(); }
  saveTasks();
  closeModal();
  SFX.save();
  renderTasks();
  updateStats();
}

/* ================================================================
   EXPORT
   ================================================================ */
function buildExportUrl() {
  const data = JSON.stringify({ exportedAt: new Date().toISOString(), tasks }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  return URL.createObjectURL(blob);
}
function refreshExportLink() {
  exportLink.href = buildExportUrl();
}

/* ================================================================
   PARTICLES
   ================================================================ */
function initParticles() {
  const canvas = $('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); initParts(); });

  function initParts() {
    particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.22,
      dy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.35 + 0.08,
      hue: Math.random() > 0.6 ? 260 : (Math.random() > 0.5 ? 280 : 240),
    }));
  }
  initParts();

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 72%, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ================================================================
   CURSOR GLOW
   ================================================================ */
function initCursor() {
  let mx = -999, my = -999;
  let cx = -999, cy = -999;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function tick() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursorGlow.style.left = cx + 'px';
    cursorGlow.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  }
  tick();
}

/* ================================================================
   HEADER DATE
   ================================================================ */
function updateDate() {
  const now = new Date();
  headerDate.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ================================================================
   RIPPLE EFFECT
   ================================================================ */
function rippleEffect(btn) {
  btn.classList.remove('ripple');
  void btn.offsetWidth;
  btn.classList.add('ripple');
}

/* ================================================================
   SOUND TOGGLE
   ================================================================ */
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundIconOn.style.display  = soundEnabled ? '' : 'none';
  soundIconOff.style.display = soundEnabled ? 'none' : '';
  soundToggle.classList.toggle('muted', !soundEnabled);
  savePrefs();
  if (soundEnabled) SFX.click();
}

/* ================================================================
   FILTER BUTTON EVENTS
   ================================================================ */
[filterAll, filterActive, filterComp].forEach(btn => {
  btn.addEventListener('click', () => { SFX.click(); setFilter(btn.dataset.filter); });
});

/* ================================================================
   ESCAPE HTML
   ================================================================ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ================================================================
   KEYBOARD SHORTCUTS
   ================================================================ */
document.addEventListener('keydown', e => {
  /* Add on Enter */
  if (e.target === taskInput && e.key === 'Enter') {
    e.preventDefault();
    addTask(taskInput.value);
    return;
  }
  /* Close modal on Escape */
  if (e.key === 'Escape') {
    if (!modalBackdrop.classList.contains('hidden')) { closeModal(); return; }
    taskInput.value = '';
    charCount.textContent = '0/200';
    charCount.classList.remove('warn');
    return;
  }
  /* Save modal on Enter */
  if (e.target === editInput && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); saveEdit(); return;
  }
  /* Ignore if typing */
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === '1') { SFX.click(); setFilter('all'); }
  else if (e.key === '2') { SFX.click(); setFilter('active'); }
  else if (e.key === '3') { SFX.click(); setFilter('completed'); }
  else if (e.key.toLowerCase() === 's') { toggleSound(); }
  else if (e.key === 'n' || e.key === 'N') { taskInput.focus(); }
});

/* ================================================================
   INPUT EVENTS
   ================================================================ */
addBtn.addEventListener('click', () => { addTask(taskInput.value); });

taskInput.addEventListener('input', () => {
  const len = taskInput.value.length;
  charCount.textContent = `${len}/200`;
  charCount.classList.toggle('warn', len > 180);
});

taskInput.addEventListener('focus', () => {
  taskInput.parentElement.parentElement.style.borderColor = 'rgba(124,58,237,0.35)';
  taskInput.parentElement.parentElement.style.boxShadow   = '0 0 0 3px rgba(124,58,237,0.08)';
});
taskInput.addEventListener('blur', () => {
  taskInput.parentElement.parentElement.style.borderColor = '';
  taskInput.parentElement.parentElement.style.boxShadow   = '';
});

clearDoneBtn.addEventListener('click', () => { SFX.click(); clearCompleted(); });
soundToggle.addEventListener('click', toggleSound);

/* ================================================================
   MODAL EVENTS
   ================================================================ */
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalSave.addEventListener('click', () => { rippleEffect(modalSave); saveEdit(); });
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

/* ================================================================
   HOVER SOUND (throttled)
   ================================================================ */
let lastHover = 0;
document.addEventListener('mouseover', e => {
  const now = Date.now();
  if (now - lastHover < 180) return;
  const el = e.target.closest('.filter-tab, .task-btn, .icon-btn');
  if (el) { lastHover = now; SFX.hover(); }
});

/* ================================================================
   EXPORT LINK
   ================================================================ */
exportLink.addEventListener('click', () => { exportLink.href = buildExportUrl(); });

/* ================================================================
   LOADER → APP REVEAL
   ================================================================ */
function reveal() {
  setTimeout(() => {
    loader.classList.add('fade-out');
    appEl.classList.remove('hidden');
    setTimeout(() => {
      loader.style.display = 'none';
      positionIndicator();
    }, 650);
  }, 2000);
}

/* ================================================================
   INIT
   ================================================================ */
function init() {
  loadTasks();
  loadPrefs();
  updateDate();
  setInterval(updateDate, 60000);

  soundIconOn.style.display  = soundEnabled ? '' : 'none';
  soundIconOff.style.display = soundEnabled ? 'none' : '';
  soundToggle.classList.toggle('muted', !soundEnabled);

  [filterAll, filterActive, filterComp].forEach(el => el.classList.toggle('active', el.dataset.filter === filter));

  initParticles();
  initCursor();
  renderTasks();
  updateStats();
  reveal();
  refreshExportLink();

  /* Reposition indicator on resize */
  window.addEventListener('resize', () => {
    setTimeout(positionIndicator, 50);
  });

  /* Focus input after loader */
  setTimeout(() => { taskInput.focus(); }, 2200);
}

document.addEventListener('DOMContentLoaded', init);
