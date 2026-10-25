// ============================================================================
// 推理でうめる英単語 - Main Application Logic (app.js)
// ============================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'suiri_eitango_state_v1';

  const SECTIONS = [
    {
      id: 'part1',
      title: 'PART 1 【漢字入力】',
      shortTitle: 'PART 1',
      subtitle: '英語2語の成句から2〜5文字の漢字を推理（全500問）',
      icon: '漢字',
      total: 500
    },
    {
      id: 'part2',
      title: 'PART 2 【英語入力】',
      shortTitle: 'PART 2',
      subtitle: '分野別・漢字と頭文字ヒントから英単語を推理（全500問）',
      icon: '英語',
      total: 500
    },
    {
      id: 'yoji',
      title: '四文字熟語コーナー',
      shortTitle: '四文字熟語',
      subtitle: '英文の意味と漢字パズルから四字熟語を完成（全50問）',
      icon: '四字',
      total: 50
    },
    {
      id: 'abbr',
      title: '略語の解剖コーナー',
      shortTitle: '略語解剖',
      subtitle: 'CD・DNA・NASAなど略語の元の英語を推理（全40問）',
      icon: '略語',
      total: 40
    },
    {
      id: 'katakana',
      title: 'カタカナ英語コーナー',
      shortTitle: 'カタカナ英語',
      subtitle: 'カタカナ語を本物の英語スペルに直す（全20問）',
      icon: 'カナ',
      total: 20
    }
  ];

  const RANKS = [
    { level: 1, title: '見習い探偵', avatar: '🕵️‍♂️', minExp: 0 },
    { level: 2, title: '街角の調査員', avatar: '🔎', minExp: 150 },
    { level: 3, title: '若手推理家', avatar: '📓', minExp: 400 },
    { level: 4, title: '現場の敏腕刑事', avatar: '🚔', minExp: 800 },
    { level: 5, title: '警部補インスペクター', avatar: '🎖️', minExp: 1500 },
    { level: 6, title: '難事件解決スペシャリスト', avatar: '🦅', minExp: 2500 },
    { level: 7, title: '国際ボキャブラリー捜査官', avatar: '🌐', minExp: 4000 },
    { level: 8, title: '王立アカデミー名探偵', avatar: '🎩', minExp: 6000 },
    { level: 9, title: '伝説の頭脳プロファイラー', avatar: '🧠', minExp: 9000 },
    { level: 10, title: 'シャーロック・マスター', avatar: '👑', minExp: 13000 }
  ];

  const BADGES = [
    { id: 'first_solve', icon: '🔍', name: '初推理達成', desc: '最初の1問をクリアする', check: (s, m) => s.totalSolved >= 1 },
    { id: 'no_hint_5', icon: '⚡', name: '閃きの名探偵', desc: 'ノーヒント正解を累計5回達成', check: (s, m) => s.noHintSolves >= 5 },
    { id: 'combo_10', icon: '🔥', name: '10連続コンボ', desc: '10問連続で正解する', check: (s, m) => s.maxCombo >= 10 },
    { id: 'master_10', icon: '🌱', name: '10語マスター', desc: '「覚えた✓」を10問達成', check: (s, m) => m.totalMastered >= 10 },
    { id: 'master_50', icon: '🌿', name: '50語マスター', desc: '「覚えた✓」を50問達成', check: (s, m) => m.totalMastered >= 50 },
    { id: 'master_100', icon: '🌳', name: '100語マスター', desc: '「覚えた✓」を100問達成', check: (s, m) => m.totalMastered >= 100 },
    { id: 'master_300', icon: '🏛️', name: '300語マスター', desc: '「覚えた✓」を300問達成', check: (s, m) => m.totalMastered >= 300 },
    { id: 'master_500', icon: '🌟', name: '500語マスター', desc: '「覚えた✓」を500問達成', check: (s, m) => m.totalMastered >= 500 },
    { id: 'part1_clear', icon: '📘', name: 'PART 1 制覇', desc: 'PART 1 全500問を覚える', check: (s, m) => m.bySection.part1.mastered >= 500 },
    { id: 'part2_clear', icon: '📗', name: 'PART 2 制覇', desc: 'PART 2 全500問を覚える', check: (s, m) => m.bySection.part2.mastered >= 500 },
    { id: 'yoji_clear', icon: '🀄', name: '四字熟語の達人', desc: '四文字熟語コーナー全50問を覚える', check: (s, m) => m.bySection.yoji.mastered >= 50 },
    { id: 'abbr_clear', icon: '🧬', name: '略語解剖ドクター', desc: '略語の解剖コーナー全40問を覚える', check: (s, m) => m.bySection.abbr.mastered >= 40 },
    { id: 'kana_clear', icon: '🔤', name: 'カタカナ英語卒業', desc: 'カタカナ英語全20問を覚える', check: (s, m) => m.bySection.katakana.mastered >= 20 },
    { id: 'streak_3', icon: '📅', name: '三日坊主突破', desc: '3日連続で学習する', check: (s, m) => s.streak >= 3 },
    { id: 'streak_7', icon: '🌈', name: '1週間連続学習', desc: '7日連続で学習する', check: (s, m) => s.streak >= 7 },
    { id: 'time_attack_100', icon: '⏱️', name: 'スピード推理王', desc: '60秒チャレンジで100点以上獲得', check: (s, m) => s.bestTimeAttack >= 100 }
  ];

  // App State persisted in LocalStorage
  let state = {
    items: {}, // key: "part1:1" -> { status: 'mastered' | 'review', attempts: 0, lastSeen: timestamp }
    exp: 0,
    totalSolved: 0,
    noHintSolves: 0,
    maxCombo: 0,
    bestTimeAttack: 0,
    streak: 0,
    lastStudyDate: null,
    dailyHistory: {}, // "YYYY-MM-DD": count
    unlockedBadges: [],
    settings: {
      sound: true,
      darkMode: false,
      autoSpeak: false,
      dailyGoal: 10,
      selectedSection: 'part1',
      selectedStyle: 'card',
      selectedFilter: 'remaining',
      selectedCategory: 'all'
    }
  };

  // Active Quiz Session State
  let quiz = {
    active: false,
    isTimeAttack: false,
    section: 'part1',
    style: 'card',
    questions: [],
    currentIndex: 0,
    combo: 0,
    hintsRevealed: 0,
    charHintCount: 0,
    answeredCurrent: false,
    sessionResults: [], // { key, item, correct, masteredNow }
    sessionExp: 0,
    masteredAtStart: 0,
    timerId: null,
    timeRemaining: 60,
    timeAttackScore: 0
  };

  // Word List Pagination State
  let listPage = 1;
  const LIST_PAGE_SIZE = 25;

  // Web Audio Context
  let audioCtx = null;

  // ============================================================================
  // Initialization
  // ============================================================================
  function init() {
    loadState();
    applyTheme();
    updateStreakOnLoad();
    populatePart2Categories();
    bindEvents();
    refreshAllUI();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign({}, state, parsed);
        state.settings = Object.assign({}, state.settings, parsed.settings || {});
        state.items = parsed.items || {};
        state.dailyHistory = parsed.dailyHistory || {};
        state.unlockedBadges = parsed.unlockedBadges || [];
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getDateOffsetStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function updateStreakOnLoad() {
    const today = getTodayStr();
    const yesterday = getDateOffsetStr(1);
    if (state.lastStudyDate && state.lastStudyDate !== today && state.lastStudyDate !== yesterday) {
      state.streak = 0;
      saveState();
    }
  }

  function recordDailyProgress(countDelta) {
    const today = getTodayStr();
    const yesterday = getDateOffsetStr(1);
    state.dailyHistory[today] = (state.dailyHistory[today] || 0) + countDelta;

    if (state.lastStudyDate !== today) {
      if (state.lastStudyDate === yesterday) {
        state.streak += 1;
      } else {
        state.streak = 1;
      }
      state.lastStudyDate = today;
    }
  }

  // ============================================================================
  // Sound & Speech (Web Audio API & Web Speech API)
  // ============================================================================
  function playTone(type) {
    if (!state.settings.sound) return;
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      if (type === 'correct') {
        playNote(523.25, now, 0.09, 'sine', 0.15);
        playNote(659.25, now + 0.08, 0.14, 'sine', 0.18);
      } else if (type === 'master') {
        playNote(523.25, now, 0.08, 'triangle', 0.15);
        playNote(659.25, now + 0.07, 0.08, 'triangle', 0.15);
        playNote(783.99, now + 0.14, 0.18, 'triangle', 0.18);
      } else if (type === 'wrong') {
        playNote(240, now, 0.12, 'sawtooth', 0.1);
        playNote(190, now + 0.1, 0.18, 'sawtooth', 0.1);
      } else if (type === 'hint') {
        playNote(440, now, 0.06, 'sine', 0.08);
      } else if (type === 'fanfare') {
        playNote(523.25, now, 0.1, 'triangle', 0.16);
        playNote(659.25, now + 0.1, 0.1, 'triangle', 0.16);
        playNote(783.99, now + 0.2, 0.1, 'triangle', 0.16);
        playNote(1046.5, now + 0.3, 0.28, 'triangle', 0.2);
      }
    } catch (e) {}
  }

  function playNote(freq, startTime, duration, wave, gainVal) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function speakEnglish(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[.*?\]/g, '').replace(/_+/g, ' ').trim();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'en-US';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  // ============================================================================
  // Data Helpers & Metrics Calculation
  // ============================================================================
  function getDataset(sectionId) {
    const db = window.SUIRI_DATA || {};
    return db[sectionId] || [];
  }

  function getItemKey(sectionId, id) {
    return `${sectionId}:${id}`;
  }

  function getItemStatus(sectionId, id) {
    const key = getItemKey(sectionId, id);
    const rec = state.items[key];
    return rec ? rec.status : 'unseen'; // 'unseen' | 'review' | 'mastered'
  }

  function setItemStatus(sectionId, id, status) {
    const key = getItemKey(sectionId, id);
    if (status === 'unseen') {
      delete state.items[key];
    } else {
      const prev = state.items[key] || { attempts: 0 };
      state.items[key] = {
        status: status,
        attempts: (prev.attempts || 0) + 1,
        lastSeen: Date.now()
      };
    }
    saveState();
  }

  function computeMetrics() {
    const bySection = {};
    let totalItems = 0;
    let totalMastered = 0;
    let totalReview = 0;

    SECTIONS.forEach((sec) => {
      const list = getDataset(sec.id);
      const count = list.length || sec.total;
      let mastered = 0;
      let review = 0;

      for (let i = 0; i < list.length; i++) {
        const st = getItemStatus(sec.id, list[i].id);
        if (st === 'mastered') mastered++;
        else if (st === 'review') review++;
      }

      const remaining = Math.max(0, count - mastered);
      const percent = count > 0 ? Math.round((mastered / count) * 100) : 0;

      bySection[sec.id] = {
        total: count,
        mastered,
        review,
        remaining,
        percent
      };

      totalItems += count;
      totalMastered += mastered;
      totalReview += review;
    });

    const totalRemaining = Math.max(0, totalItems - totalMastered);
    const totalPercent = totalItems > 0 ? Math.round((totalMastered / totalItems) * 100) : 0;

    return {
      totalItems,
      totalMastered,
      totalReview,
      totalRemaining,
      totalPercent,
      bySection
    };
  }

  function getCurrentRank() {
    let current = RANKS[0];
    let next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (state.exp >= RANKS[i].minExp) {
        current = RANKS[i];
        next = RANKS[i + 1] || null;
      }
    }
    return { current, next };
  }

  function checkAndUnlockBadges(metrics) {
    let newlyUnlocked = [];
    BADGES.forEach((b) => {
      if (!state.unlockedBadges.includes(b.id) && b.check(state, metrics)) {
        state.unlockedBadges.push(b.id);
        newlyUnlocked.push(b);
      }
    });
    if (newlyUnlocked.length > 0) {
      saveState();
      newlyUnlocked.forEach((b) => {
        showToast(`🏆 バッジ獲得！「${b.name}」`);
      });
      playTone('fanfare');
      launchConfetti();
    }
  }

  // ============================================================================
  // UI Rendering & Refresh
  // ============================================================================
  function applyTheme() {
    document.body.classList.toggle('dark-mode', !!state.settings.darkMode);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.textContent = state.settings.darkMode ? '☀️' : '🌙';
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) soundBtn.textContent = state.settings.sound ? '🔊' : '🔇';
  }

  function refreshAllUI() {
    const metrics = computeMetrics();
    checkAndUnlockBadges(metrics);
    const { current, next } = getCurrentRank();

    // Header & Global Progress Bar
    document.getElementById('headerRankBadge').textContent = `${current.title} Lv.${current.level}`;
    document.getElementById('headerStreak').textContent = state.streak;
    document.getElementById('headerExp').textContent = state.exp;

    document.getElementById('globalMasteredCount').textContent = metrics.totalMastered;
    document.getElementById('globalReviewCount').textContent = metrics.totalReview;
    document.getElementById('globalRemainingCount').textContent = metrics.totalRemaining;
    document.getElementById('globalPercent').textContent = `${metrics.totalPercent}%`;
    document.getElementById('globalTotalCount').textContent = metrics.totalItems;

    const mPct = metrics.totalItems > 0 ? (metrics.totalMastered / metrics.totalItems) * 100 : 0;
    const rPct = metrics.totalItems > 0 ? (metrics.totalReview / metrics.totalItems) * 100 : 0;
    document.getElementById('globalMasteredBar').style.width = `${mPct}%`;
    document.getElementById('globalReviewBar').style.width = `${rPct}%`;

    // Hero Card
    document.getElementById('detectiveAvatar').textContent = current.avatar;
    document.getElementById('heroRankTitle').textContent = `Lv.${current.level} ${current.title}`;
    if (next) {
      const span = next.minExp - current.minExp;
      const done = state.exp - current.minExp;
      const pct = Math.min(100, Math.round((done / span) * 100));
      document.getElementById('heroExpBar').style.width = `${pct}%`;
      document.getElementById('heroExpSubtext').textContent = `次の称号「${next.title}」まで あと ${next.minExp - state.exp} EXP`;
    } else {
      document.getElementById('heroExpBar').style.width = '100%';
      document.getElementById('heroExpSubtext').textContent = '最高称号に到達！すべての謎を解き明かす名探偵！';
    }

    // Daily Goal & Calendar
    const today = getTodayStr();
    const todayCount = state.dailyHistory[today] || 0;
    const goal = state.settings.dailyGoal || 10;
    document.getElementById('todaySolvedCount').textContent = todayCount;
    document.getElementById('dailyGoalTarget').textContent = goal;
    document.getElementById('dailyGoalBar').style.width = `${Math.min(100, Math.round((todayCount / goal) * 100))}%`;
    document.getElementById('bestTimeAttackScore').textContent = state.bestTimeAttack || 0;

    renderWeeklyCalendar();
    renderSectionCards(metrics);
    renderStageSelectorPanel(metrics);
    renderWordListView();
    renderStatsView(metrics, current);
  }

  function renderWeeklyCalendar() {
    const wrap = document.getElementById('weeklyCalendar');
    if (!wrap) return;
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    let html = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getDateOffsetStr(i);
      const count = state.dailyHistory[dateStr] || 0;
      const label = i === 0 ? '今日' : days[d.getDay()];
      html += `<div class="week-day-chip ${count > 0 ? 'done' : ''}">
        <div>${label}</div>
        <div>${count > 0 ? `✓${count}` : '・'}</div>
      </div>`;
    }
    wrap.innerHTML = html;
  }

  function renderSectionCards(metrics) {
    const grid = document.getElementById('sectionCardsGrid');
    if (!grid) return;
    let html = '';
    SECTIONS.forEach((sec) => {
      const m = metrics.bySection[sec.id];
      const active = state.settings.selectedSection === sec.id ? 'active' : '';
      html += `
        <div class="mode-card ${active}" data-section="${sec.id}">
          <div class="mode-card-top">
            <span class="mode-card-title">${sec.shortTitle}</span>
            <span class="rank-badge">${m.percent}%</span>
          </div>
          <div class="mode-card-sub">全${m.total}問</div>
          <div class="mode-card-bar">
            <div class="mode-card-bar-fill" style="width:${m.percent}%"></div>
          </div>
          <div class="mode-card-stats">
            <span style="color:var(--success)">✓${m.mastered}</span>
            <span style="color:var(--text-muted)">残${m.remaining}</span>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  function populatePart2Categories() {
    const sel = document.getElementById('part2CategorySelect');
    if (!sel) return;
    const list = getDataset('part2');
    const cats = [];
    list.forEach((item) => {
      if (item.category && !cats.includes(item.category)) {
        cats.push(item.category);
      }
    });
    let html = '<option value="all">すべての分野（全500問）</option>';
    cats.forEach((c) => {
      const count = list.filter((x) => x.category === c).length;
      html += `<option value="${c}">${c}（${count}問）</option>`;
    });
    sel.innerHTML = html;
  }

  function renderStageSelectorPanel(metrics) {
    const secId = state.settings.selectedSection;
    const sec = SECTIONS.find((s) => s.id === secId) || SECTIONS[0];
    document.getElementById('selectedSectionTitle').textContent = sec.title;
    document.getElementById('selectedSectionSub').textContent = sec.subtitle;

    // Show/hide PART 2 category filter
    const catRow = document.getElementById('categoryFilterRow');
    catRow.style.display = secId === 'part2' ? 'block' : 'none';

    // Sync active buttons
    document.querySelectorAll('#styleSelector .seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.style === state.settings.selectedStyle);
    });
    document.querySelectorAll('#filterSelector .seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === state.settings.selectedFilter);
    });

    // Render 10-question units grid
    const list = getDataset(secId);
    const unitsGrid = document.getElementById('unitsGrid');
    let html = '';
    for (let i = 0; i < list.length; i += 10) {
      const slice = list.slice(i, i + 10);
      if (slice.length === 0) continue;
      const startId = slice[0].id;
      const endId = slice[slice.length - 1].id;
      let mCount = 0;
      slice.forEach((item) => {
        if (getItemStatus(secId, item.id) === 'mastered') mCount++;
      });
      const cls = mCount === slice.length ? 'completed' : mCount > 0 ? 'in-progress' : '';
      html += `
        <button class="unit-chip ${cls}" data-start-index="${i}">
          <span class="unit-range">${startId}〜${endId}</span>
          <span class="unit-prog">✓ ${mCount}/${slice.length}</span>
        </button>
      `;
    }
    unitsGrid.innerHTML = html;
  }

  // ============================================================================
  // Quiz Engine
  // ============================================================================
  function startQuizSession(options) {
    const secId = options.section || state.settings.selectedSection;
    const style = options.style || state.settings.selectedStyle;
    const list = getDataset(secId);

    if (!list || list.length === 0) {
      showToast('データの読み込み中です');
      return;
    }

    let pool = list.slice();

    // Category filter for PART 2
    if (secId === 'part2' && options.category && options.category !== 'all') {
      pool = pool.filter((x) => x.category === options.category);
    }

    // Unit slice or Filter
    if (typeof options.unitStartIndex === 'number') {
      pool = list.slice(options.unitStartIndex, options.unitStartIndex + 10);
    } else if (options.customPool) {
      pool = options.customPool;
    } else {
      const filter = options.filter || state.settings.selectedFilter;
      if (filter === 'remaining') {
        pool = pool.filter((x) => getItemStatus(secId, x.id) !== 'mastered');
      } else if (filter === 'review') {
        pool = pool.filter((x) => getItemStatus(secId, x.id) === 'review');
      } else if (filter === 'mastered') {
        pool = pool.filter((x) => getItemStatus(secId, x.id) === 'mastered');
      }

      if (pool.length === 0) {
        showToast('該当する条件の問題がないため、全問題から出題します！');
        pool = list.slice();
      }

      if (options.shuffle) {
        shuffleArray(pool);
      }
      pool = pool.slice(0, options.limit || 10);
    }

    const metricsBefore = computeMetrics();

    quiz = {
      active: true,
      isTimeAttack: !!options.isTimeAttack,
      section: secId,
      style: options.isTimeAttack ? 'choice' : style,
      questions: pool,
      currentIndex: 0,
      combo: 0,
      hintsRevealed: 0,
      charHintCount: 0,
      answeredCurrent: false,
      sessionResults: [],
      sessionExp: 0,
      masteredAtStart: metricsBefore.totalMastered,
      timerId: null,
      timeRemaining: 60,
      timeAttackScore: 0
    };

    switchTab('quiz');
    document.getElementById('questionCard').style.display = 'block';
    document.getElementById('sessionResultCard').style.display = 'none';
    document.getElementById('timeAttackBarWrap').style.display = quiz.isTimeAttack ? 'block' : 'none';

    if (quiz.isTimeAttack) {
      startTimeAttackTimer();
    } else {
      stopTimeAttackTimer();
    }

    renderCurrentQuestion();
  }

  function startSmartSession() {
    // Prioritize 'review' items across all sections, then 'unseen' items in current section
    const secId = state.settings.selectedSection;
    const list = getDataset(secId);
    const reviewItems = list.filter((x) => getItemStatus(secId, x.id) === 'review');
    const unseenItems = list.filter((x) => getItemStatus(secId, x.id) === 'unseen');
    const combined = [...reviewItems, ...unseenItems];
    const pool = (combined.length > 0 ? combined : list).slice(0, 10);
    startQuizSession({
      section: secId,
      customPool: pool
    });
  }

  function startTimeAttack() {
    const secId = state.settings.selectedSection;
    const list = getDataset(secId).slice();
    shuffleArray(list);
    startQuizSession({
      section: secId,
      customPool: list.slice(0, 60),
      isTimeAttack: true
    });
  }

  function startTimeAttackTimer() {
    stopTimeAttackTimer();
    quiz.timeRemaining = 60.0;
    quiz.timeAttackScore = 0;
    updateTimeAttackUI();
    quiz.timerId = setInterval(() => {
      quiz.timeRemaining = Math.max(0, quiz.timeRemaining - 0.1);
      updateTimeAttackUI();
      if (quiz.timeRemaining <= 0) {
        stopTimeAttackTimer();
        finishQuizSession();
      }
    }, 100);
  }

  function stopTimeAttackTimer() {
    if (quiz.timerId) {
      clearInterval(quiz.timerId);
      quiz.timerId = null;
    }
  }

  function updateTimeAttackUI() {
    document.getElementById('timeAttackSeconds').textContent = quiz.timeRemaining.toFixed(1);
    document.getElementById('timeAttackCurrentScore').textContent = quiz.timeAttackScore;
    document.getElementById('timeAttackBar').style.width = `${(quiz.timeRemaining / 60) * 100}%`;
  }

  // ============================================================================
  // Question Rendering per Section & Mode
  // ============================================================================
  function renderCurrentQuestion() {
    if (quiz.currentIndex >= quiz.questions.length) {
      finishQuizSession();
      return;
    }

    const q = quiz.questions[quiz.currentIndex];
    const secId = quiz.section;
    const secMeta = SECTIONS.find((s) => s.id === secId);

    quiz.hintsRevealed = 0;
    quiz.charHintCount = 0;
    quiz.answeredCurrent = false;

    // Header info
    document.getElementById('quizModeBadge').textContent = quiz.isTimeAttack ? '⏱️ 60秒チャレンジ' : secMeta.shortTitle;
    document.getElementById('quizStepCounter').textContent = `${quiz.currentIndex + 1} / ${quiz.questions.length}`;
    document.getElementById('quizComboPill').textContent = `🔥 ${quiz.combo} Combo`;

    // Session dots
    renderSessionDots();

    // Sync style switcher
    document.querySelectorAll('#inQuizStyleSwitch .mini-seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.style === quiz.style);
    });

    // Mastered checkbox state
    syncQuizMasteredCheckbox(q);

    // Populate Question Prompt & Hints depending on section
    document.getElementById('qNumberBadge').textContent = `No. ${q.id}`;
    const subBadge = document.getElementById('qSubBadge');
    const mainPrompt = document.getElementById('qMainPrompt');
    const phoneticEl = document.getElementById('qPhonetic');
    const hintBox1 = document.getElementById('hintBox1');
    const hintBox2 = document.getElementById('hintBox2');
    const hintBox3 = document.getElementById('hintBox3');

    hintBox1.classList.remove('revealed');
    hintBox2.classList.remove('revealed');
    hintBox3.classList.remove('revealed');

    if (secId === 'part1') {
      subBadge.textContent = `${q.version || ''} Version`;
      mainPrompt.textContent = q.english;
      phoneticEl.textContent = q.phonetic || '';
      phoneticEl.style.display = q.phonetic ? 'block' : 'none';

      hintBox1.style.display = 'block';
      document.getElementById('hintContent1').innerHTML = renderKanjiBoxesHTML(q.kanji_hint || '');

      hintBox2.style.display = q.hint ? 'block' : 'none';
      document.getElementById('hintContent2').textContent = q.hint || '';

      hintBox3.style.display = q.vocab ? 'block' : 'none';
      document.getElementById('hintContent3').textContent = q.vocab || '';

      document.getElementById('inputGuideText').textContent = '漢字全体（または□に入る漢字）を入力してください';
    } else if (secId === 'part2') {
      subBadge.textContent = q.category || '分野別';
      mainPrompt.textContent = q.kanji;
      phoneticEl.textContent = `（PART 1 No.${q.part1_id} と連動）`;
      phoneticEl.style.display = 'block';

      hintBox1.style.display = 'block';
      document.getElementById('hintContent1').innerHTML = `<div style="font-size:18px;font-weight:800;color:var(--primary)">${escapeHtml(q.prompt_template)}</div>`;
      // Auto-reveal the cloze template in PART 2 since it is on the main line in the book!
      hintBox1.classList.add('revealed');

      const linkedP1 = findLinkedPart1(q.part1_id);
      hintBox2.style.display = linkedP1 && linkedP1.hint ? 'block' : 'none';
      document.getElementById('hintContent2').textContent = linkedP1 ? linkedP1.hint : '';

      hintBox3.style.display = linkedP1 && linkedP1.phonetic ? 'block' : 'none';
      document.getElementById('hintContent3').textContent = linkedP1 ? `発音ヒント: ${linkedP1.phonetic} / ${linkedP1.vocab || ''}` : '';

      document.getElementById('inputGuideText').textContent = '空欄に入る英単語（または英語2語すべて）を入力してください';
    } else if (secId === 'yoji') {
      subBadge.textContent = '四文字熟語';
      mainPrompt.textContent = q.english;
      phoneticEl.style.display = 'none';

      hintBox1.style.display = 'block';
      document.getElementById('hintContent1').innerHTML = renderKanjiBoxesHTML(q.kanji_hint || '');
      hintBox1.classList.add('revealed');

      hintBox2.style.display = q.vocab ? 'block' : 'none';
      document.getElementById('hintContent2').textContent = q.vocab || '';

      hintBox3.style.display = 'none';
      document.getElementById('inputGuideText').textContent = '四文字熟語全体（または□に入る漢字2文字）を入力してください';
    } else if (secId === 'abbr') {
      subBadge.textContent = q.category || '略語の解剖';
      mainPrompt.textContent = q.abbr;
      phoneticEl.textContent = q.japanese || '';
      phoneticEl.style.display = 'block';

      hintBox1.style.display = 'block';
      document.getElementById('hintContent1').innerHTML = `<div style="font-size:18px;font-weight:800;color:var(--primary)">${escapeHtml(q.prompt_template)}</div>`;
      hintBox1.classList.add('revealed');

      hintBox2.style.display = q.notes ? 'block' : 'none';
      document.getElementById('hintContent2').textContent = q.notes || '';
      hintBox3.style.display = 'none';
      document.getElementById('inputGuideText').textContent = '枠内に入る英単語（またはフルスペル）を入力してください';
    } else if (secId === 'katakana') {
      subBadge.textContent = 'カタカナ英語';
      mainPrompt.textContent = q.katakana;
      phoneticEl.style.display = 'none';

      hintBox1.style.display = 'block';
      document.getElementById('hintContent1').innerHTML = `<div style="font-size:18px;font-weight:800;color:var(--primary)">${escapeHtml(q.prompt_template)}</div>`;
      hintBox1.classList.add('revealed');

      hintBox2.style.display = q.explanation ? 'block' : 'none';
      document.getElementById('hintContent2').textContent = q.explanation || '';

      hintBox3.style.display = q.notes ? 'block' : 'none';
      document.getElementById('hintContent3').textContent = q.notes || '';
      document.getElementById('inputGuideText').textContent = '枠内に入る英単語（または英語全体）を入力してください';
    }

    // Show active interaction panel
    document.getElementById('panelCardMode').style.display = quiz.style === 'card' ? 'block' : 'none';
    document.getElementById('panelInputMode').style.display = quiz.style === 'input' ? 'block' : 'none';
    document.getElementById('panelChoiceMode').style.display = quiz.style === 'choice' ? 'block' : 'none';
    document.getElementById('answerRevealBox').style.display = 'none';

    if (quiz.style === 'input') {
      const inp = document.getElementById('answerTextInput');
      inp.value = '';
      if (!('ontouchstart' in window)) {
        setTimeout(() => inp.focus(), 50);
      }
    } else if (quiz.style === 'choice') {
      renderChoicesForQuestion(q);
    }

    if (state.settings.autoSpeak) {
      const engToSpeak = getQuestionSpeakText(q);
      if (engToSpeak) speakEnglish(engToSpeak);
    }
  }

  function renderKanjiBoxesHTML(hintStr) {
    if (!hintStr) return '';
    const chars = Array.from(hintStr);
    let html = '<div class="kanji-boxes-row">';
    chars.forEach((ch) => {
      const isEmpty = ch === '□' || ch === '●' || ch === '○' || ch === ' ';
      html += `<div class="kanji-cell ${isEmpty ? 'empty' : ''}">${isEmpty ? '？' : escapeHtml(ch)}</div>`;
    });
    html += '</div>';
    return html;
  }

  function findLinkedPart1(part1Id) {
    if (!part1Id) return null;
    const p1 = getDataset('part1');
    return p1.find((x) => x.id === part1Id) || null;
  }

  function getQuestionSpeakText(q) {
    if (quiz.section === 'part1') return q.english;
    if (quiz.section === 'part2') {
      const p1 = findLinkedPart1(q.part1_id);
      return p1 ? p1.english : q.answer_word;
    }
    if (quiz.section === 'yoji') return q.english;
    if (quiz.section === 'abbr') return q.full_english || q.answer_word;
    if (quiz.section === 'katakana') return q.full_english || q.answer_word;
    return '';
  }

  function getPrimaryAnswerText(q) {
    if (quiz.section === 'part1' || quiz.section === 'yoji') return q.answer;
    if (quiz.section === 'part2') return q.answer_word;
    if (quiz.section === 'abbr' || quiz.section === 'katakana') return q.answer_word;
    return '';
  }

  function renderChoicesForQuestion(q) {
    const grid = document.getElementById('choicesGrid');
    const secId = quiz.section;
    const list = getDataset(secId);
    const correctAns = getPrimaryAnswerText(q);

    // Filter plausible distractors (same version/category if possible)
    let candidates = list.filter((x) => x.id !== q.id && getPrimaryAnswerText(x) !== correctAns);
    if (secId === 'part1' && q.version) {
      const sameLen = candidates.filter((x) => x.version === q.version);
      if (sameLen.length >= 3) candidates = sameLen;
    } else if (secId === 'part2' && q.category) {
      const sameCat = candidates.filter((x) => x.category === q.category);
      if (sameCat.length >= 3) candidates = sameCat;
    }

    shuffleArray(candidates);
    const distractors = candidates.slice(0, 3).map((x) => getPrimaryAnswerText(x));
    const options = [correctAns, ...distractors];
    shuffleArray(options);

    let html = '';
    options.forEach((opt, idx) => {
      html += `
        <button class="choice-btn" data-choice="${escapeHtml(opt)}">
          <span class="choice-num">${idx + 1}</span>
          <span>${escapeHtml(opt)}</span>
        </button>
      `;
    });
    grid.innerHTML = html;
  }

  // ============================================================================
  // Answer Validation & Reveal
  // ============================================================================
  function checkTypedAnswer(userInput, q) {
    const cleanInput = (userInput || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!cleanInput) return false;

    const secId = quiz.section;
    if (secId === 'part1' || secId === 'yoji') {
      const rawAns = (q.answer || '').trim();
      // Handle variants like "政局(情)" or "帰国（郷）"
      const variants = buildKanjiVariants(rawAns);
      if (variants.includes(cleanInput)) return true;

      // Also check if user typed only the missing character(s) in kanji_hint!
      if (q.kanji_hint) {
        for (const v of variants) {
          if (v.length === q.kanji_hint.length) {
            let missingOnly = '';
            for (let i = 0; i < v.length; i++) {
              if (q.kanji_hint[i] === '□') missingOnly += v[i];
            }
            if (missingOnly && cleanInput === missingOnly) return true;
          }
        }
      }
      return false;
    } else {
      // English answer validation (part2, abbr, katakana)
      const norm = (s) => (s || '').trim().toLowerCase().replace(/-/g, '').replace(/\s+/g, ' ');
      const ansWord = (q.answer_word || '').trim().toLowerCase();
      if (cleanInput === ansWord || norm(cleanInput) === norm(ansWord)) return true;
      if (ansWord.endsWith('s') && cleanInput === ansWord.slice(0, -1)) return true;
      if (q.full_english && (cleanInput === q.full_english.trim().toLowerCase() || norm(cleanInput) === norm(q.full_english))) return true;
      if (secId === 'part2') {
        const p1 = findLinkedPart1(q.part1_id);
        if (p1) {
          if (cleanInput === p1.english.trim().toLowerCase() || norm(cleanInput) === norm(p1.english)) return true;
          const p1Words = p1.english.trim().toLowerCase().split(/\s+/);
          if (p1Words.includes(cleanInput) || p1Words.map(norm).includes(norm(cleanInput))) return true;
        }
      }
      return false;
    }
  }

  function buildKanjiVariants(ans) {
    const normalized = ans.replace(/（/g, '(').replace(/）/g, ')');
    const variants = new Set([ans, normalized, normalized.replace(/\(.*?\)/g, '')]);
    // e.g. 政局(情) -> 政情
    const m = normalized.match(/^(.*?)([^\(\)])\((.+?)\)(.*)$/);
    if (m) {
      variants.add(m[1] + m[2] + m[4]);
      variants.add(m[1] + m[3] + m[4]);
    }
    return Array.from(variants);
  }

  function revealAnswer(isCorrect, fromCardFlip) {
    if (quiz.answeredCurrent) return;
    quiz.answeredCurrent = true;

    const q = quiz.questions[quiz.currentIndex];
    const secId = quiz.section;

    // Calculate EXP
    let earnedExp = 0;
    if (isCorrect) {
      quiz.combo += 1;
      if (quiz.combo > state.maxCombo) state.maxCombo = quiz.combo;
      earnedExp = quiz.hintsRevealed === 0 ? 25 : Math.max(10, 20 - quiz.hintsRevealed * 5);
      if (quiz.hintsRevealed === 0 && !fromCardFlip) {
        state.noHintSolves = (state.noHintSolves || 0) + 1;
      }
      playTone('correct');
    } else {
      quiz.combo = 0;
      earnedExp = 5;
      playTone('wrong');
    }

    state.exp += earnedExp;
    state.totalSolved += 1;
    quiz.sessionExp += earnedExp;
    recordDailyProgress(1);

    // Time Attack handling
    if (quiz.isTimeAttack) {
      if (isCorrect) {
        quiz.timeAttackScore += 10 + Math.min(20, quiz.combo * 2);
        if (quiz.combo > 0 && quiz.combo % 5 === 0) {
          quiz.timeRemaining = Math.min(60, quiz.timeRemaining + 2.0);
          showToast('⚡ 5コンボボーナス！ +2秒');
        }
      }
      quiz.sessionResults.push({ key: getItemKey(secId, q.id), item: q, correct: isCorrect });
      saveState();
      setTimeout(() => {
        quiz.currentIndex += 1;
        renderCurrentQuestion();
      }, 380);
      return;
    }

    // Show Answer Reveal Box
    const revealBox = document.getElementById('answerRevealBox');
    const banner = document.getElementById('resultBanner');
    revealBox.style.display = 'block';

    if (fromCardFlip) {
      banner.className = 'result-banner ok';
      document.getElementById('resultIcon').textContent = '💡';
      document.getElementById('resultTitle').textContent = '正解を確認してチェックしましょう！';
    } else if (isCorrect) {
      banner.className = 'result-banner ok';
      document.getElementById('resultIcon').textContent = '⭕';
      document.getElementById('resultTitle').textContent = quiz.hintsRevealed === 0 ? 'ノーヒント名推理！大正解！' : '正解！ナイス推理！';
    } else {
      banner.className = 'result-banner ng';
      document.getElementById('resultIcon').textContent = '🔺';
      document.getElementById('resultTitle').textContent = '惜しい！正解を確認して覚えよう';
    }
    document.getElementById('resultExpBadge').textContent = `+${earnedExp} EXP`;

    // Populate Answer Showcase & Details
    const mainAns = document.getElementById('answerMainText');
    const subAns = document.getElementById('answerSubText');
    const detailsBox = document.getElementById('answerDetailsBox');

    if (secId === 'part1') {
      mainAns.textContent = q.answer;
      subAns.textContent = `${q.english} ${q.phonetic || ''}`;
      detailsBox.innerHTML = `
        <div><strong>💡 ヒント文:</strong> ${escapeHtml(q.hint || 'なし')}</div>
        ${q.vocab ? `<div style="margin-top:4px;color:var(--text-muted)"><strong>📖 語注:</strong> ${escapeHtml(q.vocab)}</div>` : ''}
      `;
    } else if (secId === 'part2') {
      const p1 = findLinkedPart1(q.part1_id);
      const fullEng = p1 ? p1.english : `${q.prompt_template.replace('___', q.answer_word)}`;
      mainAns.textContent = q.answer_word;
      subAns.textContent = `${fullEng} ＝ ${q.kanji}`;
      detailsBox.innerHTML = p1
        ? `<div><strong>🔊 発音:</strong> ${escapeHtml(p1.phonetic || '')}</div>
           <div><strong>💡 PART 1 ヒント:</strong> ${escapeHtml(p1.hint || '')}</div>`
        : `<div><strong>分野:</strong> ${escapeHtml(q.category || '')}</div>`;
    } else if (secId === 'yoji') {
      mainAns.textContent = q.answer;
      subAns.textContent = q.english;
      detailsBox.innerHTML = `<div><strong>📖 重要語句:</strong> ${escapeHtml(q.vocab || '')}</div>`;
    } else if (secId === 'abbr') {
      mainAns.textContent = q.answer_word;
      subAns.textContent = `${q.abbr} ＝ ${q.full_english}（${q.japanese}）`;
      detailsBox.innerHTML = q.notes ? `<div><strong>📖 関連語:</strong> ${escapeHtml(q.notes)}</div>` : '';
    } else if (secId === 'katakana') {
      mainAns.textContent = q.answer_word;
      subAns.textContent = `${q.katakana} ＝ ${q.full_english}`;
      detailsBox.innerHTML = `
        <div><strong>💡 解説:</strong> ${escapeHtml(q.explanation || '')}</div>
        ${q.notes ? `<div style="margin-top:4px;color:var(--text-muted)"><strong>📖 関連語:</strong> ${escapeHtml(q.notes)}</div>` : ''}
      `;
    }

    saveState();
    refreshAllUI();
  }

  function handleGradeAndAdvance(newStatus) {
    const q = quiz.questions[quiz.currentIndex];
    const secId = quiz.section;
    setItemStatus(secId, q.id, newStatus);

    if (newStatus === 'mastered') {
      playTone('master');
    }

    quiz.sessionResults.push({
      key: getItemKey(secId, q.id),
      item: q,
      correct: newStatus === 'mastered',
      masteredNow: newStatus === 'mastered'
    });

    refreshAllUI();
    quiz.currentIndex += 1;
    renderCurrentQuestion();
  }

  function finishQuizSession() {
    stopTimeAttackTimer();
    document.getElementById('questionCard').style.display = 'none';
    const resCard = document.getElementById('sessionResultCard');
    resCard.style.display = 'block';

    const metricsNow = computeMetrics();
    const deltaMastered = Math.max(0, metricsNow.totalMastered - quiz.masteredAtStart);

    if (quiz.isTimeAttack) {
      if (quiz.timeAttackScore > (state.bestTimeAttack || 0)) {
        state.bestTimeAttack = quiz.timeAttackScore;
        saveState();
      }
      document.getElementById('srTitle').textContent = `⏱️ 60秒チャレンジ終了！スコア: ${quiz.timeAttackScore}点`;
    } else {
      document.getElementById('srTitle').textContent = `${quiz.questions.length}問セッション完了！ナイス推理！`;
    }

    const okCount = quiz.sessionResults.filter((r) => r.correct).length;
    document.getElementById('srCorrectCount').textContent = `${okCount} / ${quiz.sessionResults.length}`;
    document.getElementById('srMasteredDelta').textContent = `+${deltaMastered}`;
    document.getElementById('srEarnedExp').textContent = `+${quiz.sessionExp}`;

    // Render session review list with instant check toggles!
    const listWrap = document.getElementById('srReviewList');
    let html = '';
    quiz.sessionResults.forEach((r) => {
      const q = r.item;
      const st = getItemStatus(quiz.section, q.id);
      const isMastered = st === 'mastered';
      const titleLeft = q.english || q.kanji || q.abbr || q.katakana;
      const titleRight = getPrimaryAnswerText(q);
      html += `
        <div class="sr-item">
          <div>
            <strong>No.${q.id}</strong> ${escapeHtml(titleLeft)} → <span style="color:var(--primary);font-weight:800">${escapeHtml(titleRight)}</span>
          </div>
          <button class="word-check-btn ${isMastered ? 'mastered' : 'review'}" data-sr-toggle-id="${q.id}" title="タップで覚えた✓切替">
            ${isMastered ? '✓' : '🔄'}
          </button>
        </div>
      `;
    });
    listWrap.innerHTML = html;

    const retryWrongs = quiz.sessionResults.filter((r) => getItemStatus(quiz.section, r.item.id) !== 'mastered');
    const retryBtn = document.getElementById('btnRetryWrongOnly');
    retryBtn.style.display = retryWrongs.length > 0 ? 'block' : 'none';

    playTone('fanfare');
    launchConfetti();
    refreshAllUI();
  }

  function renderSessionDots() {
    const wrap = document.getElementById('sessionDots');
    if (quiz.isTimeAttack) {
      wrap.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 0; i < quiz.questions.length; i++) {
      let cls = '';
      if (i < quiz.sessionResults.length) {
        cls = quiz.sessionResults[i].correct ? 'done-ok' : 'done-review';
      } else if (i === quiz.currentIndex) {
        cls = 'current';
      }
      html += `<div class="s-dot ${cls}"></div>`;
    }
    wrap.innerHTML = html;
  }

  function syncQuizMasteredCheckbox(q) {
    const st = getItemStatus(quiz.section, q.id);
    const cb = document.getElementById('quizMasteredCheckbox');
    const lbl = document.getElementById('quizMasteredToggleLabel');
    cb.checked = st === 'mastered';
    lbl.classList.toggle('checked', st === 'mastered');
  }

  // ============================================================================
  // Word List & Checkbook View
  // ============================================================================
  function getFilteredWordList() {
    const secId = document.getElementById('listSectionSelect').value || 'part1';
    const statusFilter = document.getElementById('listStatusFilter').value || 'all';
    const query = (document.getElementById('listSearchInput').value || '').trim().toLowerCase();

    const list = getDataset(secId);
    return list.filter((item) => {
      const st = getItemStatus(secId, item.id);
      if (statusFilter === 'remaining' && st === 'mastered') return false;
      if (statusFilter === 'review' && st !== 'review') return false;
      if (statusFilter === 'mastered' && st !== 'mastered') return false;

      if (query) {
        const hay = [
          String(item.id),
          item.english,
          item.answer,
          item.kanji,
          item.answer_word,
          item.hint,
          item.vocab,
          item.abbr,
          item.katakana,
          item.full_english,
          item.japanese,
          item.explanation
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }

  function renderWordListView() {
    const secId = document.getElementById('listSectionSelect').value || 'part1';
    const filtered = getFilteredWordList();
    document.getElementById('listFilteredCount').textContent = `表示中: ${filtered.length}件`;

    const totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
    if (listPage > totalPages) listPage = 1;

    const start = (listPage - 1) * LIST_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + LIST_PAGE_SIZE);

    const container = document.getElementById('wordlistContainer');
    let html = '';
    pageItems.forEach((item) => {
      const st = getItemStatus(secId, item.id);
      const checkIcon = st === 'mastered' ? '✓' : st === 'review' ? '🔄' : '';
      let leftText = '';
      let rightText = '';
      let subText = '';

      if (secId === 'part1') {
        leftText = item.english;
        rightText = item.answer;
        subText = item.hint || '';
      } else if (secId === 'part2') {
        leftText = item.kanji;
        rightText = `${item.prompt_template} → ${item.answer_word}`;
        subText = `分野: ${item.category}`;
      } else if (secId === 'yoji') {
        leftText = item.answer;
        rightText = item.kanji_hint;
        subText = item.english;
      } else if (secId === 'abbr') {
        leftText = item.abbr;
        rightText = item.full_english;
        subText = item.japanese;
      } else if (secId === 'katakana') {
        leftText = item.katakana;
        rightText = item.full_english;
        subText = item.explanation;
      }

      html += `
        <div class="word-row-card ${st}">
          <button class="word-check-btn ${st}" data-list-check-sec="${secId}" data-list-check-id="${item.id}" title="タップで覚えた✓を切り替え">
            ${checkIcon}
          </button>
          <div class="word-main-info">
            <div class="word-top-line">
              <span class="word-id-tag">#${item.id}</span>
              <span class="word-eng">${escapeHtml(leftText)}</span>
              <span class="word-kanji">${escapeHtml(rightText)}</span>
            </div>
            <div class="word-hint-preview">${escapeHtml(subText)}</div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html || '<p style="text-align:center;color:var(--text-muted);padding:24px;">該当する問題がありません</p>';

    // Pagination buttons
    const pageBar = document.getElementById('listPaginationBar');
    let pHtml = '';
    if (totalPages > 1) {
      for (let p = 1; p <= totalPages; p++) {
        pHtml += `<button class="page-btn ${p === listPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    }
    pageBar.innerHTML = pHtml;
  }

  // ============================================================================
  // Stats & Badges View
  // ============================================================================
  function renderStatsView(metrics, currentRank) {
    document.getElementById('statTotalMastered').textContent = metrics.totalMastered;
    document.getElementById('statTotalMasteredSub').textContent = `/ ${metrics.totalItems} 問 (${metrics.totalPercent}%)`;
    document.getElementById('statTotalRemaining').textContent = metrics.totalRemaining;
    document.getElementById('statTotalReviewSub').textContent = `うち要復習: ${metrics.totalReview}問`;
    document.getElementById('statStreakDays').textContent = state.streak;
    document.getElementById('statTotalAnsweredSub').textContent = `累計解答: ${state.totalSolved}回`;
    document.getElementById('statTotalExp').textContent = `${state.exp} EXP`;
    document.getElementById('statRankNameSub').textContent = `Lv.${currentRank.level} ${currentRank.title}`;

    // Breakdown list
    const bList = document.getElementById('sectionBreakdownList');
    let bHtml = '';
    SECTIONS.forEach((sec) => {
      const m = metrics.bySection[sec.id];
      bHtml += `
        <div class="breakdown-item">
          <div class="breakdown-head">
            <span>${sec.title}</span>
            <span>覚えた: <strong>${m.mastered}</strong> / 残り: <strong>${m.remaining}</strong> (${m.percent}%)</span>
          </div>
          <div class="multi-progress-track">
            <div class="multi-progress-fill mastered-fill" style="width:${(m.mastered / m.total) * 100}%"></div>
            <div class="multi-progress-fill review-fill" style="width:${(m.review / m.total) * 100}%"></div>
          </div>
        </div>
      `;
    });
    bList.innerHTML = bHtml;

    // Badges grid
    const bGrid = document.getElementById('badgesGrid');
    let badgeHtml = '';
    BADGES.forEach((b) => {
      const unlocked = state.unlockedBadges.includes(b.id);
      badgeHtml += `
        <div class="badge-card ${unlocked ? 'unlocked' : ''}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>
      `;
    });
    bGrid.innerHTML = badgeHtml;

    // Sync settings controls
    document.getElementById('toggleAutoSpeak').checked = !!state.settings.autoSpeak;
    document.getElementById('selectDailyGoal').value = String(state.settings.dailyGoal || 10);
  }

  // ============================================================================
  // Navigation & Event Listeners
  // ============================================================================
  function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach((el) => {
      el.classList.toggle('active', el.id === `view-${tabId}`);
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    if (tabId !== 'quiz') {
      stopTimeAttackTimer();
    } else if (!quiz.active) {
      startQuizSession({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    // Bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('logoHomeBtn').addEventListener('click', () => switchTab('home'));

    // Sound & Theme toggles
    document.getElementById('soundToggleBtn').addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      saveState();
      applyTheme();
      showToast(state.settings.sound ? '🔊 効果音 ON' : '🔇 効果音 OFF');
    });

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      state.settings.darkMode = !state.settings.darkMode;
      saveState();
      applyTheme();
    });

    // Quick Start Buttons
    document.getElementById('btnSmartSession').addEventListener('click', startSmartSession);
    document.getElementById('btnTimeAttack').addEventListener('click', startTimeAttack);

    // Section card selection
    document.getElementById('sectionCardsGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.mode-card');
      if (!card) return;
      state.settings.selectedSection = card.dataset.section;
      saveState();
      refreshAllUI();
    });

    // Style & Filter segmented controls
    document.getElementById('styleSelector').addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.settings.selectedStyle = btn.dataset.style;
      saveState();
      refreshAllUI();
    });

    document.getElementById('filterSelector').addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      state.settings.selectedFilter = btn.dataset.filter;
      saveState();
      refreshAllUI();
    });

    document.getElementById('part2CategorySelect').addEventListener('change', (e) => {
      state.settings.selectedCategory = e.target.value;
      saveState();
    });

    // Start Filtered / Random / Unit Quiz
    document.getElementById('btnStartFilteredQuiz').addEventListener('click', () => {
      startQuizSession({
        section: state.settings.selectedSection,
        style: state.settings.selectedStyle,
        filter: state.settings.selectedFilter,
        category: document.getElementById('part2CategorySelect').value,
        shuffle: false
      });
    });

    document.getElementById('btnStartRandomQuiz').addEventListener('click', () => {
      startQuizSession({
        section: state.settings.selectedSection,
        style: state.settings.selectedStyle,
        filter: state.settings.selectedFilter,
        category: document.getElementById('part2CategorySelect').value,
        shuffle: true
      });
    });

    document.getElementById('unitsGrid').addEventListener('click', (e) => {
      const chip = e.target.closest('.unit-chip');
      if (!chip) return;
      startQuizSession({
        section: state.settings.selectedSection,
        style: state.settings.selectedStyle,
        unitStartIndex: parseInt(chip.dataset.startIndex, 10)
      });
    });

    // Quiz View controls
    document.getElementById('btnQuitQuiz').addEventListener('click', () => switchTab('home'));

    document.getElementById('inQuizStyleSwitch').addEventListener('click', (e) => {
      const btn = e.target.closest('.mini-seg-btn');
      if (!btn) return;
      quiz.style = btn.dataset.style;
      state.settings.selectedStyle = quiz.style;
      saveState();
      renderCurrentQuestion();
    });

    document.getElementById('quizMasteredCheckbox').addEventListener('change', (e) => {
      const q = quiz.questions[quiz.currentIndex];
      if (!q) return;
      const newStatus = e.target.checked ? 'mastered' : 'unseen';
      setItemStatus(quiz.section, q.id, newStatus);
      syncQuizMasteredCheckbox(q);
      if (e.target.checked) {
        playTone('master');
        showToast('✅「覚えた！」にチェックしました');
      }
      refreshAllUI();
    });

    document.getElementById('btnSpeakQuestion').addEventListener('click', () => {
      const q = quiz.questions[quiz.currentIndex];
      if (q) speakEnglish(getQuestionSpeakText(q));
    });

    // Progressive Hint Reveal Buttons
    [1, 2, 3].forEach((num) => {
      document.getElementById(`btnRevealHint${num}`).addEventListener('click', () => {
        document.getElementById(`hintBox${num}`).classList.add('revealed');
        quiz.hintsRevealed += 1;
        playTone('hint');
      });
    });

    // Card Mode: Show Answer
    document.getElementById('btnShowAnswerCard').addEventListener('click', () => {
      revealAnswer(true, true);
    });

    // Input Mode: Form Submit & Helpers
    document.getElementById('answerInputForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (quiz.answeredCurrent) return;
      const q = quiz.questions[quiz.currentIndex];
      const val = document.getElementById('answerTextInput').value;
      const ok = checkTypedAnswer(val, q);
      revealAnswer(ok, false);
    });

    document.getElementById('btnInputCharHint').addEventListener('click', () => {
      const q = quiz.questions[quiz.currentIndex];
      if (!q) return;
      const target = getPrimaryAnswerText(q).replace(/\(.*?\)/g, '');
      quiz.charHintCount = Math.min(target.length, quiz.charHintCount + 1);
      quiz.hintsRevealed += 1;
      const inp = document.getElementById('answerTextInput');
      inp.value = target.slice(0, quiz.charHintCount);
      inp.focus();
      playTone('hint');
    });

    document.getElementById('btnInputGiveUp').addEventListener('click', () => {
      revealAnswer(false, false);
    });

    // 4-Choice Mode Clicks
    document.getElementById('choicesGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('.choice-btn');
      if (!btn || quiz.answeredCurrent) return;
      const q = quiz.questions[quiz.currentIndex];
      const chosen = btn.dataset.choice;
      const correctAns = getPrimaryAnswerText(q);
      const isOk = chosen === correctAns;

      document.querySelectorAll('#choicesGrid .choice-btn').forEach((b) => {
        if (b.dataset.choice === correctAns) b.classList.add('correct');
        else if (b === btn && !isOk) b.classList.add('wrong');
      });

      revealAnswer(isOk, false);
    });

    // Post-Answer Grading Buttons
    document.getElementById('btnGradeReview').addEventListener('click', () => {
      handleGradeAndAdvance('review');
    });

    document.getElementById('btnGradeMaster').addEventListener('click', () => {
      handleGradeAndAdvance('mastered');
    });

    // Session Complete Actions
    document.getElementById('srReviewList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sr-toggle-id]');
      if (!btn) return;
      const id = parseInt(btn.dataset.srToggleId, 10);
      const cur = getItemStatus(quiz.section, id);
      const next = cur === 'mastered' ? 'review' : 'mastered';
      setItemStatus(quiz.section, id, next);
      btn.className = `word-check-btn ${next === 'mastered' ? 'mastered' : 'review'}`;
      btn.textContent = next === 'mastered' ? '✓' : '🔄';
      refreshAllUI();
    });

    document.getElementById('btnContinueNextBatch').addEventListener('click', () => {
      startQuizSession({
        section: quiz.section,
        style: quiz.style,
        filter: 'remaining'
      });
    });

    document.getElementById('btnRetryWrongOnly').addEventListener('click', () => {
      const retryItems = quiz.sessionResults
        .filter((r) => getItemStatus(quiz.section, r.item.id) !== 'mastered')
        .map((r) => r.item);
      if (retryItems.length > 0) {
        startQuizSession({
          section: quiz.section,
          style: quiz.style,
          customPool: retryItems
        });
      }
    });

    document.getElementById('btnBackToHomeFromResult').addEventListener('click', () => switchTab('home'));

    // Word List Controls
    ['listSectionSelect', 'listStatusFilter'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => {
        listPage = 1;
        renderWordListView();
      });
    });

    document.getElementById('listSearchInput').addEventListener('input', () => {
      listPage = 1;
      renderWordListView();
    });

    document.getElementById('wordlistContainer').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-list-check-id]');
      if (!btn) return;
      const secId = btn.dataset.listCheckSec;
      const id = parseInt(btn.dataset.listCheckId, 10);
      const cur = getItemStatus(secId, id);
      const next = cur === 'mastered' ? 'unseen' : 'mastered';
      setItemStatus(secId, id, next);
      if (next === 'mastered') playTone('master');
      refreshAllUI();
    });

    document.getElementById('listPaginationBar').addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn');
      if (!btn) return;
      listPage = parseInt(btn.dataset.page, 10);
      renderWordListView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btnQuizFromListed').addEventListener('click', () => {
      const secId = document.getElementById('listSectionSelect').value || 'part1';
      const filtered = getFilteredWordList();
      if (filtered.length === 0) {
        showToast('表示中の問題がありません');
        return;
      }
      startQuizSession({
        section: secId,
        customPool: filtered.slice(0, 10)
      });
    });

    // Settings & Data Backup
    document.getElementById('toggleAutoSpeak').addEventListener('change', (e) => {
      state.settings.autoSpeak = e.target.checked;
      saveState();
    });

    document.getElementById('selectDailyGoal').addEventListener('change', (e) => {
      state.settings.dailyGoal = parseInt(e.target.value, 10) || 10;
      saveState();
      refreshAllUI();
    });

    document.getElementById('btnExportData').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suiri-eitango-backup-${getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 学習データを書き出しました');
    });

    document.getElementById('inputImportData').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (imported && typeof imported === 'object') {
            state = Object.assign({}, state, imported);
            saveState();
            applyTheme();
            refreshAllUI();
            showToast('📤 学習データを復元しました！');
          }
        } catch (err) {
          showToast('⚠️ ファイルの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('これまでのチェック記録やEXPをすべてリセットしますか？')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });
  }

  // ============================================================================
  // Utilities (Toast, Confetti, Escape, Shuffle)
  // ============================================================================
  function showToast(msg) {
    const wrap = document.getElementById('toastContainer');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2600);
  }

  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      size: 6 + Math.random() * 6,
      vy: 3 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      color: ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)]
    }));

    let frame = 0;
    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      frame++;
      if (frame < 75) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(step);
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
