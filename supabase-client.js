// =============================================================
// Supabase client — auth, data loading, writes, bootstrap React
// =============================================================
// Phase 2c: reads + writes.
//   - Signs user in, loads all data from Supabase on startup.
//   - Exposes window.__SupaStore with methods the React app calls
//     on each edit (editBudget, addTx, deleteTx, addCategory).
//   - Each write also updates a "last edited by" indicator.
// =============================================================

(() => {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg || cfg.url.startsWith('PASTE_') || cfg.publishableKey.startsWith('PASTE_')) {
    showFatal(
      'Supabase config missing',
      'Open <code>config.js</code> and paste your Project URL and Publishable key.'
    );
    return;
  }

  const supabase = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window.__supabase = supabase;

  // ---------------------------------------------------------
  // UI: login overlay
  // ---------------------------------------------------------
  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.innerHTML = `
    <style>
      #auth-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: #faf7f2;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        color: #1f1d1a;
      }
      #auth-overlay .card {
        width: min(400px, 92vw);
        background: #ffffff;
        border: 1px solid #e9e2d5;
        border-radius: 16px;
        padding: 36px 32px 28px;
        box-shadow: 0 4px 24px -8px rgba(30, 25, 20, 0.08);
        animation: card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

      #auth-overlay .brand-row {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 20px;
      }
      #auth-overlay .auth-mark {
        width: 52px; height: 52px; flex-shrink: 0;
      }
      #auth-overlay .brand-text h1 {
        font-family: 'Fraunces', 'Times New Roman', serif;
        font-weight: 500; font-size: 20px; letter-spacing: -0.02em;
        margin: 0 0 2px;
      }
      #auth-overlay .brand-text .greeting {
        color: #857f74; font-size: 13px; font-style: italic;
        font-family: 'Fraunces', serif;
      }

      /* Animated mark paths — each draws itself, dots fade in after */
      #auth-overlay .flow-line {
        stroke-dasharray: 40;
        stroke-dashoffset: 40;
        animation: draw-line 0.8s ease-out forwards;
      }
      #auth-overlay .flow-line-1 { animation-delay: 0.3s; }
      #auth-overlay .flow-line-2 { animation-delay: 0.5s; }
      #auth-overlay .flow-line-3 { animation-delay: 0.7s; }
      @keyframes draw-line { to { stroke-dashoffset: 0; } }

      #auth-overlay .dot {
        opacity: 0;
        animation: dot-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      #auth-overlay .dot-1 { animation-delay: 1.1s; }
      #auth-overlay .dot-2 { animation-delay: 1.3s; }
      #auth-overlay .dot-3 { animation-delay: 1.5s; }
      @keyframes dot-pop { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }

      #auth-overlay .bag-body {
        opacity: 0;
        animation: fade-in 0.4s ease-out 0.1s forwards;
      }
      @keyframes fade-in { to { opacity: 1; } }

      #auth-overlay label {
        display: block; font-size: 11px; text-transform: uppercase;
        letter-spacing: 0.08em; color: #857f74; font-weight: 600;
        margin-bottom: 6px; margin-top: 14px;
      }
      #auth-overlay input {
        width: 100%; padding: 11px 13px;
        border: 1px solid #e9e2d5; border-radius: 8px;
        font-size: 14px; font-family: inherit; color: #1f1d1a;
        background: #faf7f2;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        box-sizing: border-box;
      }
      #auth-overlay input:focus {
        outline: none; border-color: #1f1d1a; background: #fff;
        box-shadow: 0 0 0 3px rgba(100, 130, 180, 0.15);
      }
      #auth-overlay button {
        width: 100%; padding: 12px 14px; margin-top: 22px;
        border: 0; background: #1f1d1a; color: #faf7f2;
        font-family: inherit; font-size: 14px; font-weight: 500;
        border-radius: 8px; cursor: pointer;
        transition: opacity 0.15s, transform 0.08s;
      }
      #auth-overlay button:hover { opacity: 0.88; }
      #auth-overlay button:active { transform: translateY(1px); }
      #auth-overlay button:disabled { opacity: 0.5; cursor: default; }
      #auth-overlay .err {
        color: oklch(0.38 0.07 40); background: oklch(0.94 0.04 40);
        padding: 10px 12px; border-radius: 8px; font-size: 13px;
        margin-top: 14px; display: none;
      }
      #auth-overlay .err.show { display: block; }

      #auth-overlay .footnote {
        margin-top: 22px; padding-top: 18px;
        border-top: 1px solid #f0eade;
        font-family: 'Fraunces', serif;
        font-size: 12px; color: #a29c8f; font-style: italic;
        text-align: center;
        animation: fade-in 0.5s ease-out 0.8s both;
      }

      #auth-overlay .loading-wrap {
        text-align: center; padding: 24px 0;
        color: #857f74; font-size: 13px;
      }
      #auth-overlay .loading-wrap .auth-mark { margin: 0 auto 14px; display: block; }
      #auth-overlay .loading-wrap .loading-text {
        font-family: 'Fraunces', serif; font-style: italic;
        font-size: 15px;
      }
    </style>
    <div class="card">
      <div class="brand-row">
        <svg class="auth-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- dashed flow lines — animated to draw themselves -->
          <path class="flow-line flow-line-1" d="M20 18 Q12 14 6 8"  stroke="#8ab697" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <path class="flow-line flow-line-2" d="M20 18 Q20 10 20 4"  stroke="#8cabcf" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <path class="flow-line flow-line-3" d="M20 18 Q28 14 34 8"  stroke="#d9a441" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <!-- destination dots — pop in after lines draw -->
          <circle class="dot dot-1" cx="6" cy="8"  r="2" fill="#8ab697" style="transform-origin: 6px 8px;"/>
          <circle class="dot dot-2" cx="20" cy="4" r="2" fill="#8cabcf" style="transform-origin: 20px 4px;"/>
          <circle class="dot dot-3" cx="34" cy="8" r="2" fill="#d9a441" style="transform-origin: 34px 8px;"/>
          <!-- bag body fades in first -->
          <g class="bag-body">
            <path d="M15 15 L17 12 L23 12 L25 15 Z" fill="#4a463f"/>
            <path d="M14 16 Q12 18 12 24 Q12 34 20 36 Q28 34 28 24 Q28 18 26 16 Z"
                  fill="#c67f67" stroke="#1f1d1a" stroke-width="0.8" stroke-linejoin="round"/>
            <text x="20" y="29" text-anchor="middle"
                  font-family="Georgia, serif" font-size="11" font-weight="600" fill="#fff">$</text>
          </g>
        </svg>
        <div class="brand-text">
          <h1>The Clements Fam Budget</h1>
          <div class="greeting" id="auth-greeting">Welcome back</div>
        </div>
      </div>
      <form id="auth-form">
        <label for="auth-email">Email</label>
        <input id="auth-email" type="email" autocomplete="email" required />
        <label for="auth-pw">Password</label>
        <input id="auth-pw" type="password" autocomplete="current-password" required />
        <div id="auth-err" class="err"></div>
        <button id="auth-submit" type="submit">Sign in</button>
      </form>
      <div class="footnote" id="auth-footnote"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // The boot loader was shown by index.html before any scripts loaded,
  // to avoid a blank cream screen while CDN scripts downloaded. Now that
  // our overlay is up, remove it.
  document.getElementById('boot-loader')?.remove();

  // Set a time-of-day greeting on the login screen
  (() => {
    const h = new Date().getHours();
    const g = h < 5 ? 'Burning the midnight oil'
            : h < 12 ? 'Good morning'
            : h < 17 ? 'Good afternoon'
            : h < 22 ? 'Good evening'
            : 'Good evening';
    const el = document.getElementById('auth-greeting');
    if (el) el.textContent = g;
  })();

  // Pick a random footnote to rotate through on each page load. These
  // are shown ONLY while logged out, so they don't clutter the app
  // experience. Hand-written rather than data-driven to keep tone warm.
  (() => {
    const notes = [
      'Every dollar has a job.',
      'Small steps, consistent habits.',
      'Built for two.',
      'A quiet corner of the internet, just for us.',
      'Two years of receipts and counting.',
      'Made with care.'
    ];
    const n = notes[Math.floor(Math.random() * notes.length)];
    const el = document.getElementById('auth-footnote');
    if (el) el.textContent = n;
  })();

  function showLoginError(msg) {
    const e = document.getElementById('auth-err');
    e.textContent = msg;
    e.classList.add('show');
  }

  function setLoading(label) {
    overlay.querySelector('.card').innerHTML = `
      <div class="loading-wrap">
        <svg class="auth-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path class="flow-line flow-line-1" d="M20 18 Q12 14 6 8"  stroke="#8ab697" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <path class="flow-line flow-line-2" d="M20 18 Q20 10 20 4"  stroke="#8cabcf" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <path class="flow-line flow-line-3" d="M20 18 Q28 14 34 8"  stroke="#d9a441" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>
          <circle class="dot dot-1" cx="6" cy="8"  r="2" fill="#8ab697"/>
          <circle class="dot dot-2" cx="20" cy="4" r="2" fill="#8cabcf"/>
          <circle class="dot dot-3" cx="34" cy="8" r="2" fill="#d9a441"/>
          <g class="bag-body">
            <path d="M15 15 L17 12 L23 12 L25 15 Z" fill="#4a463f"/>
            <path d="M14 16 Q12 18 12 24 Q12 34 20 36 Q28 34 28 24 Q28 18 26 16 Z"
                  fill="#c67f67" stroke="#1f1d1a" stroke-width="0.8" stroke-linejoin="round"/>
            <text x="20" y="29" text-anchor="middle"
                  font-family="Georgia, serif" font-size="11" font-weight="600" fill="#fff">$</text>
          </g>
        </svg>
        <div class="loading-text">${label || 'Loading…'}</div>
      </div>
    `;
  }

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-pw').value;
    const btn = document.getElementById('auth-submit');
    btn.disabled = true; btn.textContent = 'Signing in…';
    document.getElementById('auth-err').classList.remove('show');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      btn.disabled = false; btn.textContent = 'Sign in';
      showLoginError(error.message);
      return;
    }
    setLoading('Loading your budget…');
    await bootApp();
  });

  // ---------------------------------------------------------
  // Read helpers
  // ---------------------------------------------------------
  async function fetchAllPaginated(table, select) {
    const PAGE = 1000;
    let from = 0;
    const out = [];
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      out.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }

  // Shared cache — refreshed on load + maintained incrementally on writes.
  const cache = {
    categories: [],
    catsByName: {},   // "type|name" -> {id, ...}
    catsById: {},     // id -> {...}
  };

  function rebuildCatIndexes() {
    cache.catsByName = {};
    cache.catsById = {};
    for (const c of cache.categories) {
      cache.catsByName[c.type + '|' + c.name] = c;
      cache.catsById[c.id] = c;
    }
  }

  async function loadBudgetData() {
    const [categories, budgetRows, txRows] = await Promise.all([
      fetchAllPaginated('categories', 'id, name, type, sort_order'),
      fetchAllPaginated('monthly_budgets', 'category_id, year, month, amount'),
      fetchAllPaginated('transactions', 'id, date, type, category_id, amount, details')
    ]);

    cache.categories = categories;
    rebuildCatIndexes();

    const years = [...new Set(budgetRows.map(r => r.year))].sort();
    const budgets = {};
    for (const y of years) budgets[y] = { income: [], expenses: [], savings: [] };

    const orderedCats = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    for (const y of years) {
      const rowsByType = { Income: [], Expenses: [], Savings: [] };
      for (const c of orderedCats) {
        rowsByType[c.type].push({
          name: c.name,
          months: new Array(12).fill(0),
          _catId: c.id
        });
      }
      for (const block of Object.values(rowsByType)) {
        for (const row of block) {
          const matches = budgetRows.filter(
            br => br.category_id === row._catId && br.year === y
          );
          for (const m of matches) {
            row.months[m.month - 1] = parseFloat(m.amount) || 0;
          }
          delete row._catId;
        }
      }
      budgets[y] = {
        income:   rowsByType.Income,
        expenses: rowsByType.Expenses,
        savings:  rowsByType.Savings
      };
    }

    const txs = txRows.map(t => {
      const cat = cache.catsById[t.category_id];
      return {
        id: t.id,
        date: t.date,
        type: t.type,
        category: cat ? cat.name : 'Unknown',
        amount: parseFloat(t.amount) || 0,
        details: t.details || ''
      };
    });
    txs.sort((a, b) => a.date.localeCompare(b.date));

    return { budgets, txs };
  }

  // ---------------------------------------------------------
  // Write API
  // ---------------------------------------------------------
  const SupaStore = {
    async editBudget({ type, categoryName, year, month, amount }) {
      const cat = cache.catsByName[type + '|' + categoryName];
      if (!cat) throw new Error(`Category not found: ${type} / ${categoryName}`);
      const { error } = await supabase
        .from('monthly_budgets')
        .upsert({
          category_id: cat.id,
          year: year,
          month: month,       // 1-12
          amount: amount
        }, { onConflict: 'category_id,year,month' });
      if (error) throw error;
      bumpLastEdited();
    },

    async addTx({ date, type, categoryName, amount, details }) {
      const cat = cache.catsByName[type + '|' + categoryName];
      if (!cat) throw new Error(`Category not found: ${type} / ${categoryName}`);
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          date: date,
          type: type,
          category_id: cat.id,
          amount: amount,
          details: details || '',
          created_by: userData.user?.id
        })
        .select()
        .single();
      if (error) throw error;
      bumpLastEdited();
      return data.id;
    },

    async updateTx({ id, date, type, categoryName, amount, details }) {
      const cat = cache.catsByName[type + '|' + categoryName];
      if (!cat) throw new Error(`Category not found: ${type} / ${categoryName}`);
      const { error } = await supabase
        .from('transactions')
        .update({
          date: date,
          type: type,
          category_id: cat.id,
          amount: amount,
          details: details || ''
        })
        .eq('id', id);
      if (error) throw error;
      bumpLastEdited();
    },

    async deleteTx(id) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      bumpLastEdited();
    },

    async addCategory({ type, name }) {
      const clean = (name || '').trim();
      if (!clean) throw new Error('Category name is empty');
      if (cache.catsByName[type + '|' + clean]) {
        throw new Error(`"${clean}" already exists in ${type}`);
      }
      const sortOrder = cache.categories.length;
      const color = type === 'Income' ? 'sage'
                  : type === 'Savings' ? 'blue'
                  : 'terra';
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: clean,
          type: type,
          color: color,
          glyph: clean[0].toUpperCase(),
          sort_order: sortOrder,
          created_by: userData.user?.id
        })
        .select()
        .single();
      if (error) throw error;
      cache.categories.push(data);
      rebuildCatIndexes();
      bumpLastEdited();
      return data.id;
    }
  };
  window.__SupaStore = SupaStore;

  // ---------------------------------------------------------
  // Last-edited-by pub/sub
  // ---------------------------------------------------------
  let lastEditedAt = null;
  let lastEditedBy = null;
  const lastEditedListeners = new Set();

  function bumpLastEdited() {
    lastEditedAt = new Date();
    lastEditedBy = window.__currentUser?.displayName || 'someone';
    emitLastEdited();
  }

  function emitLastEdited() {
    const state = { at: lastEditedAt, by: lastEditedBy };
    for (const fn of lastEditedListeners) fn(state);
  }

  window.__subscribeLastEdited = (fn) => {
    lastEditedListeners.add(fn);
    fn({ at: lastEditedAt, by: lastEditedBy });
    return () => lastEditedListeners.delete(fn);
  };

  setInterval(() => { if (lastEditedAt) emitLastEdited(); }, 30_000);

  // ---------------------------------------------------------
  // Realtime sync — incremental updates from the other user
  // ---------------------------------------------------------
  // Every write this tab makes also produces an INSERT/UPDATE/DELETE
  // event that comes back through the subscription. We don't want to
  // re-apply our own writes (they'd cause a flicker and potentially
  // overwrite in-progress typing). We track the ids we just wrote and
  // skip events for them until they expire.
  const recentlyWritten = new Map();  // key -> expiration timestamp
  const WRITE_COOLDOWN_MS = 2000;

  function markWritten(key) {
    recentlyWritten.set(key, Date.now() + WRITE_COOLDOWN_MS);
    // Periodic cleanup
    if (recentlyWritten.size > 100) {
      const now = Date.now();
      for (const [k, exp] of recentlyWritten) {
        if (exp < now) recentlyWritten.delete(k);
      }
    }
  }
  function wasRecentlyWritten(key) {
    const exp = recentlyWritten.get(key);
    if (!exp) return false;
    if (exp < Date.now()) { recentlyWritten.delete(key); return false; }
    return true;
  }

  // Wrap the SupaStore methods to mark writes before they complete,
  // so the echo from the subscription can be suppressed.
  const _editBudget = SupaStore.editBudget;
  SupaStore.editBudget = async function(args) {
    const cat = cache.catsByName[args.type + '|' + args.categoryName];
    if (cat) markWritten('budget:' + cat.id + ':' + args.year + ':' + args.month);
    return _editBudget.call(this, args);
  };
  const _addTx = SupaStore.addTx;
  SupaStore.addTx = async function(args) {
    const id = await _addTx.call(this, args);
    markWritten('tx:' + id);
    return id;
  };
  const _updateTx = SupaStore.updateTx;
  SupaStore.updateTx = async function(args) {
    markWritten('tx:' + args.id);
    return _updateTx.call(this, args);
  };
  const _deleteTx = SupaStore.deleteTx;
  SupaStore.deleteTx = async function(id) {
    markWritten('tx:' + id);
    return _deleteTx.call(this, id);
  };
  const _addCategory = SupaStore.addCategory;
  SupaStore.addCategory = async function(args) {
    const id = await _addCategory.call(this, args);
    markWritten('cat:' + id);
    return id;
  };

  // Events that arrive before React has mounted get buffered here.
  // drainPendingEvents() is called from __onReactReady (the React
  // useEffect that sets __reactBridge).
  const pendingEvents = [];
  function drainPendingEvents() {
    const events = pendingEvents.splice(0);
    for (const { handler, row } of events) {
      try { handler(row); }
      catch (e) { console.error('Failed replaying pending event:', e); }
    }
  }
  function queueOrRun(handler, row) {
    if (window.__reactBridge) handler(row);
    else pendingEvents.push({ handler, row });
  }

  function setupRealtime() {
    const channel = supabase.channel('budget-app')
      // Transactions
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'transactions' },
          (payload) => queueOrRun(handleTxInsert, payload.new))
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'transactions' },
          (payload) => queueOrRun(handleTxUpdate, payload.new))
      .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'transactions' },
          (payload) => queueOrRun(handleTxDelete, payload.old))
      // Budgets
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'monthly_budgets' },
          (payload) => queueOrRun(handleBudgetUpsert, payload.new))
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'monthly_budgets' },
          (payload) => queueOrRun(handleBudgetUpsert, payload.new))
      // Categories
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'categories' },
          (payload) => queueOrRun(handleCategoryInsert, payload.new))
      .subscribe();

    // Expose so we can cleanly disconnect on logout (future phases)
    window.__realtimeChannel = channel;
  }

  function handleTxInsert(row) {
    if (wasRecentlyWritten('tx:' + row.id)) return;
    const bridge = window.__reactBridge;
    if (!bridge) return;
    const cat = cache.catsById[row.category_id];
    const tx = {
      id: row.id,
      date: row.date,
      type: row.type,
      category: cat ? cat.name : 'Unknown',
      amount: parseFloat(row.amount) || 0,
      details: row.details || ''
    };
    bridge.setTxs(prev => {
      if (prev.some(t => t.id === tx.id)) return prev;   // already present
      return [...prev, tx];
    });
    bumpRemoteEdit(row.created_by || row.updated_by);
  }

  function handleTxUpdate(row) {
    if (wasRecentlyWritten('tx:' + row.id)) return;
    const bridge = window.__reactBridge;
    if (!bridge) return;
    const cat = cache.catsById[row.category_id];
    bridge.setTxs(prev => prev.map(t => t.id === row.id ? {
      id: row.id,
      date: row.date,
      type: row.type,
      category: cat ? cat.name : t.category,
      amount: parseFloat(row.amount) || 0,
      details: row.details || ''
    } : t));
    bumpRemoteEdit(row.updated_by);
  }

  function handleTxDelete(row) {
    if (wasRecentlyWritten('tx:' + row.id)) return;
    const bridge = window.__reactBridge;
    if (!bridge) return;
    bridge.setTxs(prev => prev.filter(t => t.id !== row.id));
    // DELETE events from postgres don't include updated_by, so just
    // bump without a name — the indicator will show "saved by someone"
    bumpRemoteEdit(null);
  }

  function handleBudgetUpsert(row) {
    const key = 'budget:' + row.category_id + ':' + row.year + ':' + row.month;
    if (wasRecentlyWritten(key)) return;
    const bridge = window.__reactBridge;
    if (!bridge) return;
    const cat = cache.catsById[row.category_id];
    if (!cat) return;
    const blockKey = cat.type === 'Income' ? 'income'
                   : cat.type === 'Savings' ? 'savings'
                   : 'expenses';
    const yKey = String(row.year);
    const mIdx = row.month - 1;

    bridge.setBudgetsByYear(prev => {
      const base = prev[yKey];
      if (!base) return prev;   // year not loaded, nothing to update
      const block = base[blockKey];
      const rowIdx = block.findIndex(r => r.name === cat.name);
      if (rowIdx === -1) return prev;
      // Deep-ish clone only the affected path
      const nextBlock = {
        ...base,
        [blockKey]: block.map((r, i) => i === rowIdx
          ? { ...r, months: r.months.map((m, mi) => mi === mIdx ? parseFloat(row.amount) || 0 : m) }
          : r)
      };
      return { ...prev, [yKey]: nextBlock };
    });
    bumpRemoteEdit(row.updated_by);
  }

  async function handleCategoryInsert(row) {
    if (wasRecentlyWritten('cat:' + row.id)) return;
    // Update local cache
    cache.categories.push(row);
    rebuildCatIndexes();

    const bridge = window.__reactBridge;
    if (!bridge) return;
    const blockKey = row.type === 'Income' ? 'income'
                   : row.type === 'Savings' ? 'savings'
                   : 'expenses';
    // Add the category (with zero months) to every year's block
    bridge.setBudgetsByYear(prev => {
      const next = {};
      for (const [y, base] of Object.entries(prev)) {
        const block = base[blockKey];
        if (block.some(r => r.name === row.name)) {
          next[y] = base;   // already there
          continue;
        }
        next[y] = {
          ...base,
          [blockKey]: [...block, { name: row.name, months: new Array(12).fill(0) }]
        };
      }
      return next;
    });
    bridge.extendCategoryLists(row.type, row.name);
    bumpRemoteEdit(row.created_by || row.updated_by);
  }

  // When the OTHER user makes a change, update the "saved by" indicator.
  // We need to look up their display_name from the profiles table since
  // the event payload only gives us the user id.
  const profileNameCache = new Map();
  async function bumpRemoteEdit(userId) {
    if (!userId) {
      lastEditedAt = new Date();
      lastEditedBy = 'the other session';
      emitLastEdited();
      return;
    }
    if (userId === window.__currentUser?.id) {
      // This was our own echo (even with the dedupe, defensive)
      return;
    }
    let name = profileNameCache.get(userId);
    if (!name) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      name = data?.display_name || 'someone';
      profileNameCache.set(userId, name);
    }
    lastEditedAt = new Date();
    lastEditedBy = name;
    emitLastEdited();
  }

  // ---------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------
  async function bootApp() {
    try {
      const { budgets, txs } = await loadBudgetData();

      const budEl = document.getElementById('imported-budgets');
      const txEl = document.getElementById('imported-tx');
      if (!budEl || !txEl) throw new Error('Missing data script elements');
      budEl.textContent = JSON.stringify(budgets);
      txEl.textContent = JSON.stringify(txs);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      window.__currentUser = {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name || user.email.split('@')[0]
      };

      // Set up realtime subscription BEFORE React mounts. Events that
      // arrive before React is ready will be buffered and replayed
      // once the bridge is set.
      setupRealtime();

      // When the React bridge shows up (via its useEffect), drain any
      // events that arrived during the gap between subscription setup
      // and React mount.
      window.__onReactReady = () => {
        drainPendingEvents();
      };

      document.querySelectorAll('script[type="text/babel-pending"]').forEach(el => {
        const next = document.createElement('script');
        next.type = 'text/babel';
        if (el.dataset.presets) next.dataset.presets = el.dataset.presets;
        next.textContent = el.textContent;
        el.parentNode.replaceChild(next, el);
      });
      if (window.Babel && window.Babel.transformScriptTags) {
        window.Babel.transformScriptTags();
      }

      overlay.remove();
    } catch (err) {
      console.error(err);
      showFatal('Failed to load budget data', err.message || String(err));
    }
  }

  function showFatal(title, message) {
    overlay.querySelector('.card').innerHTML = `
      <h1>${title}</h1>
      <div class="sub">${message}</div>
      <button onclick="location.reload()" style="margin-top:20px">Reload</button>
    `;
  }

  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setLoading('Loading your budget…');
      await bootApp();
    }
  })();
})();
