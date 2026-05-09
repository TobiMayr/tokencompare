// Token Compare — main app logic
// All comparisons happen client-side; no data leaves the browser.

const REFERENCES = [
  { id: 'tweet',       label: 'A tweet (280 chars)',                      tokens: 70,            rough: true, note: 'Assumes 280 chars of typical mixed content. Plain English prose tokenises to ~57 tokens (avg of 5 samples, o200k_base); URLs, hashtags, @mentions and emoji push real tweets toward 80+. 70 is a middle-ground estimate.' },
  { id: 'email',       label: 'A typical email',                          tokens: 155,           rough: true, note: 'Assumes a ~135-word business email. Tokenised 3 representative samples (124–144 words) averaging 155 tokens with o200k_base.' },
  { id: 'a4',          label: 'One A4 page',                              tokens: 520,           rough: true, note: 'Assumes ~400 words of body text at 11pt, single-spaced. A 400-word slice of Pride and Prejudice tokenises to 520 tokens with o200k_base.' },
  { id: 'udhr',        label: 'Universal Declaration of Human Rights',    tokens: 1980,                       note: 'Exact count of the full English text (unicode-org/udhr): 1,747 words → 1,977 tokens with o200k_base, rounded to 1,980.' },
  { id: 'news',        label: 'A news article',                           tokens: 2300,          rough: true, note: 'Assumes a ~1,800-word longform piece. News-style prose tokenises at ~1.27 tok/word (measured on the Wikipedia Apollo 11 article, o200k_base); briefs and features differ by an order of magnitude.' },
  { id: 'magna-carta', label: 'Magna Carta',                              tokens: 5700,                       note: 'Exact count of the G.R.C. Davis English translation (Fordham Internet History Sourcebooks): 4,585 words → 5,690 tokens with o200k_base. Other translations differ in length.' },
  { id: 'paper',       label: 'A research paper',                         tokens: 12000,         rough: true, note: 'Assumes a ~9,000-word peer-reviewed paper. Reference: "Attention Is All You Need" (arxiv 1706.03762) tokenises to 10,140 tokens at 6,141 words; scaling gives ~13K for a 9K-word paper. Venue and field vary widely.' },
  { id: 'manifesto',   label: 'The Communist Manifesto',                  tokens: 15700,                      note: 'Exact count of the 1888 English edition (Project Gutenberg #61): 11,467 words → 15,659 tokens with o200k_base.' },
  { id: 'little-prince', label: 'The Little Prince',                      tokens: 21500,                      note: 'Word-count estimate (no exact text — still in copyright in many jurisdictions). 16,534 words (Reading Length) × literary-prose ratio ~1.3 ≈ 21,500 tokens. Will refine if a public-domain text becomes available.' },
  { id: 'animal-farm', label: 'Animal Farm',                              tokens: 40000,                      note: 'Word-count estimate (no exact text — still in copyright in most jurisdictions). 29,966 words (consistent across sources) × literary-prose ratio 1.337 (Pride & Prejudice baseline, o200k_base) ≈ 40,060 tokens.' },
  { id: 'grundgesetz', label: 'German Grundgesetz',                       tokens: 42500,                      note: 'Exact count of the official consolidated text from gesetze-im-internet.de (BJNR000010949, decoded as ISO-8859-1): 24,950 words → 42,483 tokens with o200k_base. German has a higher tokens/word ratio (~1.77) than English due to compound words and umlauts.' },
  { id: 'gatsby',      label: 'The Great Gatsby',                         tokens: 65000,                      note: 'Exact count of Project Gutenberg #64317 (US public-domain edition, 2021): 48,208 words → 64,919 tokens with o200k_base. Previous estimate of 105K was too high — Gatsby is genuinely short (~50K words).' },
  { id: '1984',        label: '1984',                                     tokens: 119000,                     note: 'Word-count estimate (still in copyright in most jurisdictions). 88,942 words (Reading Length) × literary-prose ratio 1.337 (Pride & Prejudice baseline, o200k_base) ≈ 118,940 tokens.' },
  { id: 'pride',       label: 'Pride and Prejudice',                      tokens: 170000,                     note: 'Exact count of Project Gutenberg #1342: 127,359 words → 170,258 tokens with o200k_base. Used as the baseline for the 1.337 literary-prose tokens/word ratio applied elsewhere.' },
  { id: 'moby-dick',   label: 'Moby-Dick',                                tokens: 305000,                     note: 'Exact count of Project Gutenberg #2701: 212,796 words → 305,431 tokens with o200k_base (1.435 tpw — high because of nautical jargon, Latin, archaic English).' },
  { id: 'lotr',        label: 'The Lord of the Rings (trilogy)',          tokens: 743000,                     note: 'Word-count estimate (still in copyright). Fellowship 177,227 + Two Towers 143,436 + Return of the King 134,462 = 550,147 words (Reading Length via Originality.ai). × 1.35 tpw (slight bump above the 1.337 literary baseline for invented proper nouns: Galadriel, Cirith Ungol, etc.) ≈ 742,700 tokens.' },
  { id: 'war-peace',   label: 'War and Peace',                            tokens: 766000,                     note: 'Exact count of the Maude translation (Project Gutenberg #2600): 563,286 words → 765,705 tokens with o200k_base.' },
  { id: 'bible',       label: 'The Bible (KJV)',                          tokens: 1144000,                    note: 'Exact count of the King James Version (Project Gutenberg #10): 821,496 words → 1,144,343 tokens with o200k_base (1.393 tpw — high because of Hebrew proper names like Mahershalalhashbaz that split into many tokens).' },
  { id: 'shakespeare', label: 'Complete Shakespeare',                     tokens: 1436000,                    note: 'Exact count of the Complete Works (Project Gutenberg #100): 963,460 words → 1,436,260 tokens with o200k_base (1.491 tpw — high because of iambic pentameter, archaic words, character-name tags like ROMEO splitting into multiple tokens).' },
  { id: 'hp',          label: 'Harry Potter (7-book series)',             tokens: 1460000,                    note: 'Word-count estimate (still in copyright). Total 1,084,170 words across all 7 books (76,944 + 85,141 + 107,253 + 190,637 + 257,045 + 168,923 + 198,227 — harrypotterinsider.com / multiple sources). × 1.35 tpw (slight bump above 1.337 literary baseline for invented proper nouns: Hogwarts, Hermione, Quidditch) ≈ 1,463,630 tokens.' },
  { id: 'got',         label: 'Game of Thrones (5-book series)',          tokens: 2480000,                    note: 'Word-count estimate (still in copyright). Total ~1,770,000 words across the 5 published A Song of Ice and Fire books (298K + 326K + 424K + 300K + 422K — wordsrated.com). × 1.40 tpw (higher bump for heavy fantasy proper nouns: Targaryen, Daenerys, Westeros, plus archaic phrasing) ≈ 2,478,000 tokens.' },
  { id: 'britannica',  label: 'Encyclopædia Britannica',                  tokens: 58000000,                   note: 'Word-count estimate. ~44 million words (15th edition, 32 volumes — well-documented across multiple sources including Wikipedia). × 1.32 tpw (encyclopedic prose with many proper nouns, slightly above 1.27 news ratio) ≈ 58,080,000 tokens.' },
  { id: 'gutenberg',   label: 'All Project Gutenberg books',              tokens: 5000000000,                 note: 'Word-count estimate. Standardized PG corpus (Gerlach & Font-Clos 2020, arxiv 1812.08092): 55,905 books, 3 billion word-tokens (2.8B English). Scaled to current ~75K books → ~4B words. × ~1.35 tpw (mixed languages, classical English) ≈ 5B BPE tokens.' },
  { id: 'wikipedia',   label: 'English Wikipedia (May 2026)',             tokens: 6400000000,                 note: 'Word-count estimate. Wikipedia stats (Wikipedia:Size_of_Wikipedia, May 2026): 7.18M articles containing over 5 billion words. × 1.27 tpw (news/encyclopedic prose ratio measured on the Apollo 11 article, o200k_base) ≈ 6.4 billion tokens.' },
  { id: 'github',      label: 'All public code on GitHub',                tokens: 1000000000000,              note: 'Anchored to a published figure rather than truly "all" GitHub. The Stack v1 (BigCode 2022): 6.4TB → 200B training tokens. The Stack v2 (2024): 67.5TB → 900B training tokens. Both are deduplicated and license-filtered. Truly "all public code on GitHub" (incl. non-permissive, forks, old versions) is probably 5–10× larger. Keeping at 1T as a defensible Stack-v2 anchor; bump to 5T+ if you want raw-corpus interpretation.' },
  { id: 'papers',      label: 'All academic papers ever published',       tokens: 2000000000000,              note: 'Estimate. OpenAlex (Nov 2025) indexes 271.3M scholarly works (core), 463M with the xpac expansion. Average paper ~5,000 words × 1.5 tpw (technical prose with citations, equations, proper nouns) ≈ 2T tokens for the core OpenAlex set. Could be 3–4T if using the full xpac figure or longer avg paper length. Wide uncertainty.' },
  { id: 'llama3',      label: 'Llama 3 training corpus',                  tokens: 15000000000000,             note: 'Official Meta figure. Llama 3 (and 3.1) was pretrained on "over 15 trillion tokens" of publicly available data (ai.meta.com/blog/meta-llama-3-1, model card). Exact figure unpublished — 15T is the floor.' },
];

// Window size is computed dynamically from viewport height — see computeWindowSize().
let WINDOW_SIZE = 10;
let MAX_WINDOW_START = REFERENCES.length - WINDOW_SIZE; // last valid window start index
let stepCount = MAX_WINDOW_START; // one scroll step per shift

function windowIds(start) {
  return new Set(REFERENCES.slice(start, start + WINDOW_SIZE).map(r => r.id));
}

// Bar row max-height (50px) + padding-top (7px) — kept in sync with CSS .bar-row.
const BAR_ROW_HEIGHT = 50;
const MIN_WINDOW_SIZE = 5;
// Cap so there are always enough scroll steps to make the chart feel scrollable
// even on very tall viewports.
const MAX_WINDOW_SIZE = Math.min(18, REFERENCES.length - 6);

function computeWindowSize() {
  const barsEl = dom.bars;
  const disclaimer = document.querySelector('.disclaimer');
  if (!barsEl) return WINDOW_SIZE;

  const rootStyles = getComputedStyle(document.documentElement);
  const footerH = parseInt(rootStyles.getPropertyValue('--footer-h'), 10) || 44;
  const mainPadBottomExtra = 16; // the +16 in .main-view padding-bottom: calc(var(--footer-h) + 16px)
  const chartGap = 12;           // gap between .bars and .disclaimer in .chart-section

  const barsTop = barsEl.getBoundingClientRect().top;
  const disclaimerH = disclaimer ? disclaimer.offsetHeight : 50;
  const bottomLimit = window.innerHeight - footerH - mainPadBottomExtra;
  const available = bottomLimit - chartGap - disclaimerH - barsTop;

  const fits = Math.floor(available / BAR_ROW_HEIGHT);
  return Math.max(MIN_WINDOW_SIZE, Math.min(MAX_WINDOW_SIZE, fits));
}

function refreshWindowSize() {
  const next = computeWindowSize();
  if (next === WINDOW_SIZE) return false;
  WINDOW_SIZE = next;
  MAX_WINDOW_START = Math.max(0, REFERENCES.length - WINDOW_SIZE);
  stepCount = MAX_WINDOW_START;
  state.windowStart = Math.min(state.windowStart, MAX_WINDOW_START);
  state.activeBarIds = windowIds(state.windowStart);
  return true;
}

const state = {
  mode: 'paste',
  inputText: '',
  manualCount: 0,
  userTokenCount: null,
  wordCount: 0,
  charCount: 0,
  windowStart: 0,
  activeBarIds: windowIds(0),
  tokeniserReady: false,
  selectedRefId: null,
  secondaryRefId: null,
  userPickedPrimary: false,
  userPickedSecondary: false,
  dropdownOpen: false,
  dropdownTarget: null,           // 'primary' | 'secondary'
};

let encoder = null;

const dom = {
  pasteInput: document.getElementById('paste-input'),
  countInput: document.getElementById('count-input'),
  stats: document.getElementById('stats'),
  comparisonEmpty: document.getElementById('comparison-empty'),
  comparisonContent: document.getElementById('comparison-content'),
  comparisonSecondary: document.getElementById('comparison-secondary'),
  comparisonNumPrimary: document.getElementById('comparison-num-primary'),
  comparisonNumSecondary: document.getElementById('comparison-num-secondary'),
  refChipPrimary: document.getElementById('ref-chip-primary'),
  refChipLabelPrimary: document.getElementById('ref-chip-label-primary'),
  refChipSecondary: document.getElementById('ref-chip-secondary'),
  refChipLabelSecondary: document.getElementById('ref-chip-label-secondary'),
  refPopover: document.getElementById('ref-popover'),
  refList: document.getElementById('ref-list'),
  bars: document.getElementById('bars'),
  driver: document.getElementById('scroll-driver'),
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.tab-panel'),
};

// ----- Tokeniser -----

async function loadTokeniser() {
  const [{ Tiktoken }, ranksMod] = await Promise.all([
    import('https://esm.sh/js-tiktoken@1.0.21/lite'),
    import('https://esm.sh/js-tiktoken@1.0.21/ranks/o200k_base'),
  ]);
  const ranks = ranksMod.default ?? ranksMod;
  encoder = new Tiktoken(ranks);
  state.tokeniserReady = true;
}

function tokenise(text) {
  if (!encoder || !text) return 0;
  return encoder.encode(text).length;
}

// ----- Formatting -----

function trimNum(x) {
  if (x >= 100) return x.toFixed(0);
  if (x >= 10) return x.toFixed(1).replace(/\.0$/, '');
  return x.toFixed(2).replace(/\.?0+$/, '');
}

function formatNumber(n) {
  if (n == null || !isFinite(n)) return '0';
  if (n < 1_000_000) return Math.round(n).toLocaleString('en-US');
  if (n < 1_000_000_000) return trimNum(n / 1_000_000) + 'M';
  if (n < 1_000_000_000_000) return trimNum(n / 1_000_000_000) + 'B';
  return trimNum(n / 1_000_000_000_000) + 'T';
}

function formatRatio(ratio) {
  if (!isFinite(ratio) || ratio <= 0) return '0';
  if (ratio >= 100) return Math.round(ratio).toLocaleString('en-US');
  if (ratio >= 10) return ratio.toFixed(0);
  if (ratio >= 1) return ratio.toFixed(1).replace(/\.0$/, '');
  if (ratio >= 0.1) return ratio.toFixed(2);
  if (ratio >= 0.01) return ratio.toFixed(3);
  // Tiny ratios — show with leading zeros, ~2 significant figures
  const exp = Math.floor(Math.log10(ratio));
  const decimals = -exp + 2;
  return ratio.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
}

function pluralise(label, ratio) {
  // crude pluralisation: append "s" if ratio ≠ 1 and label doesn't already end with s/y
  if (ratio === 1) return label;
  if (/(s|ss)$/i.test(label)) return label;
  if (/y$/.test(label)) return label.slice(0, -1) + 'ies';
  return label + 's';
}

// ----- Reference picker -----

function findClosestRef(count, excludeId) {
  let best = null;
  let bestDist = Infinity;
  for (const r of REFERENCES) {
    if (r.id === excludeId) continue;
    const d = Math.abs(Math.log(count / r.tokens));
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return best;
}

function buildPopover() {
  dom.refList.innerHTML = '';
  for (const ref of REFERENCES) {
    const li = document.createElement('li');
    li.className = 'ref-item';
    li.dataset.refId = ref.id;
    li.setAttribute('role', 'option');
    li.innerHTML = `
      <span class="ref-item-label">${ref.label}</span>
      <span class="ref-item-count">${formatNumber(ref.tokens)}</span>
      <span class="ref-item-ratio" data-ratio>—</span>
    `;
    li.addEventListener('click', () => {
      if (state.dropdownTarget === 'secondary') {
        state.secondaryRefId = ref.id;
        state.userPickedSecondary = true;
      } else {
        state.selectedRefId = ref.id;
        state.userPickedPrimary = true;
      }
      updateSelectedItem();
      renderComparison();
      toggleDropdown(false);
    });
    dom.refList.appendChild(li);
  }
}

function updatePopoverRatios() {
  const count = state.userTokenCount;
  if (!count) return;
  for (const li of dom.refList.children) {
    const ref = REFERENCES.find(r => r.id === li.dataset.refId);
    const ratio = count / ref.tokens;
    li.querySelector('[data-ratio]').textContent = formatRatio(ratio) + '×';
  }
}

function updateSelectedItem() {
  const activeId = state.dropdownTarget === 'secondary'
    ? state.secondaryRefId
    : state.selectedRefId;
  for (const li of dom.refList.children) {
    const sel = li.dataset.refId === activeId;
    li.classList.toggle('is-selected', sel);
    li.setAttribute('aria-selected', sel ? 'true' : 'false');
  }
}

function positionPopover(chip) {
  const r = chip.getBoundingClientRect();
  const margin = 8;
  const popW = dom.refPopover.offsetWidth;
  const popH = dom.refPopover.offsetHeight;
  let left = r.left;
  if (left + popW > window.innerWidth - margin) {
    left = window.innerWidth - popW - margin;
  }
  if (left < margin) left = margin;
  let top = r.bottom + 6;
  if (top + popH > window.innerHeight - margin) {
    top = r.top - popH - 6;
  }
  dom.refPopover.style.left = Math.max(margin, left) + 'px';
  dom.refPopover.style.top = Math.max(margin, top) + 'px';
}

function toggleDropdown(open, target) {
  if (open === undefined) open = !state.dropdownOpen;
  if (!open) target = state.dropdownTarget;
  state.dropdownOpen = open;
  state.dropdownTarget = open ? (target || 'primary') : null;

  dom.refChipPrimary.setAttribute('aria-expanded',
    open && state.dropdownTarget === 'primary' ? 'true' : 'false');
  dom.refChipSecondary.setAttribute('aria-expanded',
    open && state.dropdownTarget === 'secondary' ? 'true' : 'false');
  dom.refPopover.setAttribute('aria-hidden', open ? 'false' : 'true');

  if (open) {
    const chip = state.dropdownTarget === 'secondary'
      ? dom.refChipSecondary
      : dom.refChipPrimary;
    updatePopoverRatios();
    updateSelectedItem();
    dom.refPopover.classList.add('is-open');
    requestAnimationFrame(() => {
      positionPopover(chip);
      const sel = dom.refList.querySelector('.is-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    });
  } else {
    dom.refPopover.classList.remove('is-open');
  }
}

// ----- Rendering -----

function renderStats() {
  if (!state.tokeniserReady) {
    dom.stats.innerHTML = '<span class="stats-loading">Loading tokeniser…</span>';
    return;
  }
  const count = state.userTokenCount;
  if (count == null || count === 0) {
    dom.stats.innerHTML = '&nbsp;';
    return;
  }
  if (state.mode === 'paste') {
    dom.stats.innerHTML =
      `<strong>${formatNumber(count)}</strong> tokens · ` +
      `<strong>${formatNumber(state.wordCount)}</strong> words · ` +
      `<strong>${formatNumber(state.charCount)}</strong> characters`;
  } else {
    dom.stats.innerHTML = `<strong>${count.toLocaleString('en-US')}</strong> tokens`;
  }
}

function renderComparison() {
  const count = state.userTokenCount;
  if (!count || count <= 0) {
    dom.comparisonEmpty.hidden = false;
    dom.comparisonContent.hidden = true;
    state.userPickedPrimary = false;
    state.userPickedSecondary = false;
    state.selectedRefId = null;
    state.secondaryRefId = null;
    toggleDropdown(false);
    return;
  }
  dom.comparisonEmpty.hidden = true;
  dom.comparisonContent.hidden = false;

  if (!state.userPickedPrimary || !state.selectedRefId) {
    state.selectedRefId = findClosestRef(count).id;
  }
  // ensure secondary is set and != primary
  if (!state.userPickedSecondary
      || !state.secondaryRefId
      || state.secondaryRefId === state.selectedRefId) {
    const next = findClosestRef(count, state.selectedRefId);
    state.secondaryRefId = next ? next.id : null;
  }

  const primary = REFERENCES.find(r => r.id === state.selectedRefId);
  const primaryRatio = count / primary.tokens;
  dom.comparisonNumPrimary.textContent = formatRatio(primaryRatio);
  dom.refChipLabelPrimary.textContent = pluralise(primary.label, primaryRatio);

  if (state.secondaryRefId) {
    const secondary = REFERENCES.find(r => r.id === state.secondaryRefId);
    const secondaryRatio = count / secondary.tokens;
    dom.comparisonNumSecondary.textContent = formatRatio(secondaryRatio);
    dom.refChipLabelSecondary.textContent = pluralise(secondary.label, secondaryRatio);
    dom.comparisonSecondary.hidden = false;
  } else {
    dom.comparisonSecondary.hidden = true;
  }

  if (state.dropdownOpen) {
    updatePopoverRatios();
    updateSelectedItem();
  }
}

function colorFor(index, total) {
  const t = total > 1 ? index / (total - 1) : 0;
  const hue = 200 + t * 40;         // 200° (sky blue) → 240° (deep indigo)
  const sat = 60;
  const light = 56 - t * 28;        // 56% (medium sky) → 28% (deep indigo)
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function buildBars() {
  // Render all reference bars + a user bar (hidden when no input)
  dom.bars.innerHTML = '';
  REFERENCES.forEach((ref, idx) => {
    const li = document.createElement('li');
    li.className = 'bar-row is-inactive';
    li.dataset.barId = ref.id;
    li.style.setProperty('--bar-color', colorFor(idx, REFERENCES.length));
    li.innerHTML = `
      <div class="bar-label" title="${ref.label}">${ref.label}</div>
      <div class="bar-track">
        <div class="bar-fill"></div>
        <span class="bar-count">${formatNumber(ref.tokens)}</span>
      </div>
    `;
    dom.bars.appendChild(li);
  });
  const userLi = document.createElement('li');
  userLi.className = 'bar-row is-user is-inactive';
  userLi.dataset.barId = 'user';
  userLi.innerHTML = `
    <div class="bar-label" title="Your input">Your input</div>
    <div class="bar-track">
      <div class="bar-fill"></div>
      <span class="bar-count" data-user-count></span>
    </div>
  `;
  dom.bars.appendChild(userLi);
}

function positionCount(row, item, max) {
  const track = row.querySelector('.bar-track');
  const count = row.querySelector('.bar-count');
  const trackWidth = track.offsetWidth;
  if (!trackWidth) return;
  const fillPx = (item.tokens / max) * trackWidth;
  const countWidth = count.getBoundingClientRect().width;
  const padding = 8;
  let x;
  if (fillPx >= countWidth + padding * 2) {
    x = fillPx - countWidth - padding;
    row.classList.remove('count-outside');
  } else {
    x = fillPx + padding;
    row.classList.add('count-outside');
  }
  count.style.transform = `translate3d(${x}px, -50%, 0)`;
}

function renderChart() {
  const activeRefs = REFERENCES.filter(r => state.activeBarIds.has(r.id));
  const userCount = state.userTokenCount;
  const hasUser = userCount != null && userCount > 0;
  const all = hasUser
    ? [...activeRefs, { id: 'user', tokens: userCount }]
    : activeRefs;
  const activeIds = new Set(all.map(b => b.id));
  const max = all.length ? Math.max(...all.map(b => b.tokens)) : 1;

  // Sort by tokens (smallest -> largest) and assign visual order
  const sorted = [...all].sort((a, b) => a.tokens - b.tokens);
  sorted.forEach((item, i) => {
    const row = dom.bars.querySelector(`[data-bar-id="${item.id}"]`);
    if (!row) return;
    row.style.setProperty('--order', i);
  });

  for (const row of dom.bars.querySelectorAll('.bar-row')) {
    const id = row.dataset.barId;
    if (activeIds.has(id)) {
      row.classList.remove('is-inactive');
      const item = all.find(b => b.id === id);
      const fill = row.querySelector('.bar-fill');
      const pct = (item.tokens / max) * 100;
      fill.style.width = pct + '%';
      if (id === 'user') {
        row.querySelector('[data-user-count]').textContent = formatNumber(userCount);
      }
      positionCount(row, item, max);
    } else {
      row.classList.add('is-inactive');
    }
  }
}

function render() {
  renderStats();
  renderComparison();
  renderChart();
}

// ----- Input handling -----

function countWords(text) {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const onPasteInput = debounce(() => {
  if (state.mode !== 'paste') return;
  const text = dom.pasteInput.value;
  state.inputText = text;
  state.charCount = text.length;
  state.wordCount = countWords(text);
  state.userTokenCount = state.tokeniserReady ? tokenise(text) : null;
  render();
}, 150);

const onCountInput = debounce(() => {
  if (state.mode !== 'count') return;
  const raw = dom.countInput.value.replace(/[^\d]/g, '');
  const n = raw ? parseInt(raw, 10) : 0;
  state.manualCount = n;
  state.userTokenCount = n > 0 ? n : null;
  state.charCount = 0;
  state.wordCount = 0;
  render();
}, 100);

function setMode(mode) {
  state.mode = mode;
  for (const tab of dom.tabs) {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  for (const panel of dom.panels) {
    panel.classList.toggle('is-hidden', panel.dataset.panel !== mode);
  }
  // Input panels have different heights — re-fit the bar window.
  if (refreshWindowSize()) buildDriver();
  updateActiveBars();
  // Recompute count for the now-active input
  if (mode === 'paste') {
    onPasteInput();
  } else {
    onCountInput();
  }
}

// ----- Scroll driver -----

let scrollSteps = [];
let rafPending = false;

function buildDriver() {
  dom.driver.innerHTML = '';
  scrollSteps = [];
  for (let i = 0; i < stepCount; i++) {
    const step = document.createElement('div');
    step.className = 'scroll-step';
    dom.driver.appendChild(step);
    scrollSteps.push(step);
  }
}

function updateActiveBars() {
  const triggerLine = window.innerHeight * 0.5;
  let advanced = 0;
  for (const step of scrollSteps) {
    if (step.getBoundingClientRect().top <= triggerLine) advanced++;
  }
  const newStart = Math.min(advanced, MAX_WINDOW_START);
  if (newStart !== state.windowStart) {
    state.windowStart = newStart;
    state.activeBarIds = windowIds(newStart);
    renderChart();
  }
}

function onScroll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    updateActiveBars();
    rafPending = false;
  });
}

// ----- Init -----

async function init() {
  buildBars();
  buildPopover();
  refreshWindowSize();
  buildDriver();
  render();

  for (const tab of dom.tabs) {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  }
  dom.pasteInput.addEventListener('input', onPasteInput);
  dom.countInput.addEventListener('input', onCountInput);

  const wireChip = (chip, target) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.dropdownOpen && state.dropdownTarget === target) {
        toggleDropdown(false);
      } else {
        toggleDropdown(true, target);
      }
    });
  };
  wireChip(dom.refChipPrimary, 'primary');
  wireChip(dom.refChipSecondary, 'secondary');

  document.addEventListener('click', (e) => {
    if (!state.dropdownOpen) return;
    if (dom.refPopover.contains(e.target)) return;
    if (dom.refChipPrimary.contains(e.target)) return;
    if (dom.refChipSecondary.contains(e.target)) return;
    toggleDropdown(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.dropdownOpen) {
      const chip = state.dropdownTarget === 'secondary'
        ? dom.refChipSecondary
        : dom.refChipPrimary;
      toggleDropdown(false);
      chip.focus();
    }
  });

  updateActiveBars();
  window.addEventListener('scroll', () => {
    onScroll();
    if (state.dropdownOpen) toggleDropdown(false);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (refreshWindowSize()) buildDriver();
    updateActiveBars();
    renderChart();
    if (state.dropdownOpen) {
      const chip = state.dropdownTarget === 'secondary'
        ? dom.refChipSecondary
        : dom.refChipPrimary;
      positionPopover(chip);
    }
  });

  try {
    await loadTokeniser();
  } catch (err) {
    console.error('Failed to load tokeniser:', err);
    dom.stats.innerHTML = '<span class="stats-loading" style="color:#dc2626">Failed to load tokeniser. Reload the page to retry.</span>';
    return;
  }

  // Re-tokenise any text already in the textarea
  if (state.mode === 'paste') onPasteInput();
  else onCountInput();
  render();
}

init();
