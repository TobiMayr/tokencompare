// Token Compare — main app logic
// All comparisons happen client-side; no data leaves the browser.

const REFERENCES = [
  { id: 'tweet',       label: 'A tweet (280 chars)',                      tokens: 70,            rough: true, note: 'Assumes 280 chars of typical mixed content. Plain English prose tokenises to ~57 tokens; URLs, hashtags, @mentions and emoji push real tweets toward 80+. 70 is a middle-ground estimate.' },
  { id: 'email',       label: 'A typical email',                          tokens: 155,           rough: true, note: 'Assumes a ~135-word business email. Tokenised 3 representative samples (124–144 words) averaging 155 tokens.' },
  { id: 'a4',          label: 'One A4 page',                              tokens: 520,           rough: true, note: 'Assumes ~400 words of body text at 11pt, single-spaced. A 400-word slice of Pride and Prejudice tokenises to ~520 tokens.' },
  { id: 'udhr',        label: 'Universal Declaration of Human Rights',    tokens: 1980,                       note: 'Exact count of the full English text: 1,747 words → 1,977 tokens, rounded to 1,980. <a href="https://www.un.org/en/about-us/universal-declaration-of-human-rights">UN.org</a>' },
  { id: 'news',        label: 'A news article',                           tokens: 2300,          rough: true, note: 'Assumes a ~1,800-word longform piece × ~1.3 ≈ 2,300 tokens. Briefs and features differ by an order of magnitude.' },
  { id: 'magna-carta', label: 'Magna Carta',                              tokens: 5700,                       note: 'Exact count of the G.R.C. Davis English translation: 4,585 words → 5,690 tokens. Other translations differ in length. <a href="https://sourcebooks.fordham.edu/source/magnacarta.asp">Fordham Sourcebooks</a>' },
  { id: 'paper',       label: 'A research paper',                         tokens: 12000,         rough: true, note: 'Assumes a ~9,000-word peer-reviewed paper. Reference: <a href="https://arxiv.org/abs/1706.03762">"Attention Is All You Need"</a> tokenises to 10,140 tokens at 6,141 words; scaling gives ~13K for a 9K-word paper. Venue and field vary widely.' },
  { id: 'manifesto',   label: 'The Communist Manifesto',                  tokens: 15700,                      note: 'Exact count of the 1888 English edition: 11,467 words → 15,659 tokens. <a href="https://www.gutenberg.org/ebooks/61">Project Gutenberg #61</a>' },
  { id: 'little-prince', label: 'The Little Prince',                      tokens: 21500,                      note: 'Estimate (still in copyright in many jurisdictions). 16,534 words × ~1.3 ≈ 21,500 tokens. <a href="https://en.wikipedia.org/wiki/The_Little_Prince">Wikipedia</a>' },
  { id: 'animal-farm', label: 'Animal Farm',                              tokens: 40000,                      note: 'Estimate (still in copyright in most jurisdictions). 29,966 words × ~1.3 ≈ 40,000 tokens. <a href="https://en.wikipedia.org/wiki/Animal_Farm">Wikipedia</a>' },
  { id: 'grundgesetz', label: 'German Grundgesetz',                       tokens: 42500,                      note: 'Exact count of the official consolidated text: 24,950 words → 42,483 tokens. German has a higher tokens/word ratio (~1.77) than English due to compound words and umlauts. <a href="https://www.gesetze-im-internet.de/gg/">gesetze-im-internet.de</a>' },
  { id: 'gatsby',      label: 'The Great Gatsby',                         tokens: 65000,                      note: 'Exact count of the 2021 US public-domain edition: 48,208 words → 64,919 tokens. Gatsby is genuinely short (~50K words). <a href="https://www.gutenberg.org/ebooks/64317">Project Gutenberg #64317</a>' },
  { id: '1984',        label: '1984',                                     tokens: 119000,                     note: 'Estimate (still in copyright in most jurisdictions). 88,942 words × ~1.3 ≈ 119,000 tokens. <a href="https://en.wikipedia.org/wiki/Nineteen_Eighty-Four">Wikipedia</a>' },
  { id: 'quran',       label: 'The Quran',                                tokens: 168000,                     note: 'Estimate. Original Arabic Quran is ~77,430 words; English translations expand to ~119K (Pickthall) — ~125K (Sahih International) to convey nuance. Using ~120K English words × ~1.4 ≈ 168,000 tokens; Arabic transliterations (Allah, Muhammad, Ibrahim, Musa) tokenize heavily. <a href="https://www.quranprogress.com/en/blog/how-many-words-in-the-quran/">quranprogress</a>' },
  { id: 'pride',       label: 'Pride and Prejudice',                      tokens: 170000,                     note: 'Exact count: 127,359 words → 170,258 tokens. <a href="https://www.gutenberg.org/ebooks/1342">Project Gutenberg #1342</a>' },
  { id: 'torah',       label: 'The Torah (Pentateuch)',                   tokens: 220000,                     note: 'Estimate. The Torah is the first five books of the Hebrew Bible (Genesis, Exodus, Leviticus, Numbers, Deuteronomy). KJV English: ~156,000 words × ~1.4 ≈ 220,000 tokens (same Hebrew-name penalty as the full Bible). Original Hebrew is denser: 79,976 words / 304,805 letters by traditional count. <a href="https://en.wikipedia.org/wiki/Statistics_of_the_Hebrew_Bible">Statistics of the Hebrew Bible</a>' },
  { id: 'moby-dick',   label: 'Moby-Dick',                                tokens: 305000,                     note: 'Exact count: 212,796 words → 305,431 tokens. Nautical jargon, Latin and archaic English push the ratio above typical literary prose. <a href="https://www.gutenberg.org/ebooks/2701">Project Gutenberg #2701</a>' },
  { id: 'lotr',        label: 'The Lord of the Rings (trilogy)',          tokens: 664000,                     note: 'Estimate (still in copyright). Trilogy main text: 481,103 words — Fellowship 187,790 + Two Towers 156,198 + Return of the King 137,115 (these sum correctly, unlike the ~550K figure online which slips in The Hobbit or appendices). × ~1.4 ≈ 664,000 tokens; invented Elvish names push the ratio up. <a href="https://en.wikipedia.org/wiki/The_Lord_of_the_Rings">Wikipedia</a>' },
  { id: 'war-peace',   label: 'War and Peace',                            tokens: 766000,                     note: 'Exact count of the Maude translation: 563,286 words → 765,705 tokens. <a href="https://www.gutenberg.org/ebooks/2600">Project Gutenberg #2600</a>' },
  { id: 'context-1m',  label: 'Frontier LLM context window (1M)',         tokens: 1000000,                    note: 'As of May 2026, all four top frontier-model families converged on a ~1M-token context window — <a href="https://claude.com/blog/1m-context-ga">Claude Opus 4.7 &amp; Sonnet 4.6</a>, <a href="https://openai.com/index/introducing-gpt-5-5/">GPT-5.5</a> (API; Codex caps at 400K), <a href="https://deepmind.google/models/model-cards/gemini-3-1-pro/">Gemini 3.1 Pro</a> and <a href="https://api-docs.deepseek.com/news/news260424">DeepSeek V4</a>. Enough to fit War and Peace, but stops just shy of the full KJV Bible — bigger texts need chunking or summarisation.' },
  { id: 'bible',       label: 'The Bible (KJV)',                          tokens: 1104000,                    note: 'Estimate. KJV main verse text: 783,137 words (OT 602,587 + NT 180,550). Bibles look compact in print because of thin paper and small dense fonts — by word count the KJV is ~1.6× the LOTR trilogy. × ~1.4 ≈ 1,104,000 tokens; Hebrew proper names like Mahershalalhashbaz split into many tokens. <a href="https://lightandgospel.com/how-many-words-are-in-the-kjv-bible/">Source</a>' },
  { id: 'shakespeare', label: 'Complete Shakespeare',                     tokens: 1436000,                    note: 'Exact count of the Complete Works: 963,460 words → 1,436,260 tokens. Iambic pentameter, archaic words and character-name tags like ROMEO push the ratio up. <a href="https://www.gutenberg.org/ebooks/100">Project Gutenberg #100</a>' },
  { id: 'hp',          label: 'Harry Potter (7-book series)',             tokens: 1460000,                    note: 'Estimate (still in copyright). 1,084,170 words across all 7 books (76,944 + 85,141 + 107,253 + 190,637 + 257,045 + 168,923 + 198,227). × ~1.35 ≈ 1,460,000 tokens; invented proper nouns (Hogwarts, Hermione, Quidditch) push the ratio up slightly. <a href="https://en.wikipedia.org/wiki/Harry_Potter">Wikipedia</a>' },
  { id: 'got',         label: 'Game of Thrones (5-book series)',          tokens: 2480000,                    note: 'Estimate (still in copyright). ~1,770,000 words across the 5 published A Song of Ice and Fire books (298K + 326K + 424K + 300K + 422K). × ~1.4 ≈ 2,478,000 tokens; heavy fantasy proper nouns (Targaryen, Daenerys, Westeros) plus archaic phrasing push the ratio up. <a href="https://wordsrated.com/number-of-words-in-game-of-thrones-books/">wordsrated</a>' },
  { id: 'britannica',  label: 'Encyclopædia Britannica',                  tokens: 58000000,                   note: 'Estimate. ~44 million words (15th edition, 32 volumes). × ~1.3 ≈ 58 million tokens. <a href="https://en.wikipedia.org/wiki/Encyclop%C3%A6dia_Britannica">Wikipedia</a>' },
  { id: 'gutenberg',   label: 'All Project Gutenberg books',              tokens: 5000000000,                 note: 'Estimate. Standardized PG corpus (Gerlach & Font-Clos 2020): 55,905 books, ~3 billion words (2.8B English). Scaled to current ~75K books → ~4B words → ~5B tokens. Mix of languages and classical English. <a href="https://arxiv.org/abs/1812.08092">arxiv 1812.08092</a>' },
  { id: 'wikipedia',   label: 'English Wikipedia (Sept 2025)',             tokens: 6400000000,                 note: 'Estimate (English Wikipedia, September 2025). 7.18M articles containing over 5 billion words → ~6.4 billion tokens. <a href="https://en.wikipedia.org/wiki/Wikipedia:Size_of_Wikipedia">Wikipedia:Size_of_Wikipedia</a>' },
  { id: 'gpt3',        label: 'GPT-3 training corpus (2020)',             tokens: 300000000000,               note: 'The only pretraining figure OpenAI has ever published. GPT-3 (2020) was trained on ~300 billion tokens, weighted across Common Crawl (filtered), WebText2, Books1, Books2 and Wikipedia. No GPT-4 / 4o / 5 figures have ever been released. <a href="https://arxiv.org/abs/2005.14165">Language Models are Few-Shot Learners</a>' },
  { id: 'github',      label: 'All public code on GitHub',                tokens: 1000000000000,              note: 'Anchored to published figures rather than truly "all" GitHub. The Stack v1 (2022): 6.4TB → 200B training tokens. The Stack v2 (2024): 67.5TB → 900B tokens — both deduplicated and license-filtered. Raw "all public code" (incl. non-permissive, forks, old versions) is probably 5–10× larger. 1T is a defensible Stack-v2 anchor. <a href="https://huggingface.co/datasets/bigcode/the-stack-v2">The Stack v2</a>' },
  { id: 'papers',      label: 'All academic papers ever published',       tokens: 2000000000000,              note: 'Estimate. OpenAlex (Nov 2025) indexes 271.3M scholarly works (core), 463M with the xpac expansion. Average ~5,000 words/paper × ~1.5 (technical prose with citations, equations) ≈ 2T tokens for the core set. Could be 3–4T using the full xpac figure or longer papers. <a href="https://openalex.org/">OpenAlex</a>' },
  { id: 'llama3',      label: 'Llama 3 training corpus',                  tokens: 15000000000000,             note: 'Official Meta figure. Llama 3 (and 3.1, 3.3) was pretrained on "over 15 trillion tokens" of publicly available text. Llama 3.3 is instruction-tuned on the same 3.1 base — no fresh pretrain. Exact figure unpublished; 15T is the floor. <a href="https://ai.meta.com/blog/meta-llama-3-1/">Meta announcement</a>' },
  { id: 'deepseek-v4', label: 'DeepSeek V4 training corpus',              tokens: 33000000000000,             note: 'Official DeepSeek figure (April 2026): both V4-Pro and V4-Flash were pretrained on ~33 trillion tokens — a ~2.2× jump over DeepSeek V3 (14.8T, Dec 2024). DeepSeek and Qwen are the open-weights labs outside Meta that consistently publish their corpus sizes; OpenAI, Anthropic, Google and Mistral do not. <a href="https://api-docs.deepseek.com/news/news260424">DeepSeek V4 release</a>' },
  { id: 'llama4',      label: 'Llama 4 Scout training corpus',            tokens: 40000000000000,             note: 'Official Meta figure (April 2025). Llama 4 Scout was pretrained on ~40 trillion tokens of multimodal data (text, image, video). Llama 4 Maverick used ~22T; the overall Llama 4 mixture exceeds 30T — roughly 2× the Llama 3 corpus, in just one model generation. <a href="https://ai.meta.com/blog/llama-4-multimodal-intelligence/">Meta announcement</a>' },
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
  lastAutoTarget = null;
  return true;
}

// Pick the windowStart that places the user bar as second-largest visible.
// Returns null when there's no user count to position around.
function desiredWindowStartForCount(count) {
  if (count == null || count <= 0) return null;
  const i = REFERENCES.findIndex(r => r.tokens > count);
  if (i === -1) return MAX_WINDOW_START;     // user larger than all refs
  if (i === 0) return 0;                      // user smaller than all refs
  // Place the smallest-bigger ref at the top of the window so user lands second.
  return Math.max(0, Math.min(MAX_WINDOW_START, i - WINDOW_SIZE + 1));
}

let lastAutoTarget = null;

function scrollToWindowStart(target) {
  target = Math.max(0, Math.min(MAX_WINDOW_START, target));
  let scrollY;
  if (target <= 0) {
    scrollY = 0;
  } else {
    const stepEl = scrollSteps[target - 1];
    if (!stepEl) return;
    const stepTopDoc = stepEl.getBoundingClientRect().top + window.scrollY;
    scrollY = stepTopDoc - window.innerHeight * 0.5 + 2;
  }
  window.scrollTo({ top: scrollY, behavior: 'smooth' });
}

function autoScrollToUserBar() {
  const target = desiredWindowStartForCount(state.userTokenCount);
  if (target == null) {
    lastAutoTarget = null;
    return;
  }
  if (target === lastAutoTarget) return;
  lastAutoTarget = target;
  scrollToWindowStart(target);
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
  userBarLabel: 'Your input',
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
  infoTooltip: document.getElementById('info-tooltip'),
  shareBtn: document.getElementById('share-btn'),
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.tab-panel'),
};

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const _stripDiv = document.createElement('div');
function stripHtml(s) {
  _stripDiv.innerHTML = String(s);
  return _stripDiv.textContent || '';
}

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
      updateUrl();
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

// ----- Info tooltip -----

let pinnedInfoId = null;
let activeInfoBtn = null;
let infoHideTimer = null;

function clearInfoHideTimer() {
  if (infoHideTimer) {
    clearTimeout(infoHideTimer);
    infoHideTimer = null;
  }
}

function scheduleInfoHide() {
  clearInfoHideTimer();
  infoHideTimer = setTimeout(() => hideInfoTooltip(), 150);
}

function positionInfoTooltip(anchor) {
  const r = anchor.getBoundingClientRect();
  const margin = 8;
  const w = dom.infoTooltip.offsetWidth;
  const h = dom.infoTooltip.offsetHeight;
  // Prefer placing to the right of the icon, vertically centered.
  let left = r.right + 8;
  let top = r.top + r.height / 2 - h / 2;
  if (left + w > window.innerWidth - margin) {
    // Not enough room on the right — drop below the icon instead.
    left = r.left;
    top = r.bottom + 6;
  }
  left = Math.max(margin, Math.min(window.innerWidth - w - margin, left));
  top = Math.max(margin, Math.min(window.innerHeight - h - margin, top));
  dom.infoTooltip.style.left = left + 'px';
  dom.infoTooltip.style.top = top + 'px';
}

function showInfoTooltip(btn) {
  const refId = btn.dataset.noteId;
  const ref = REFERENCES.find(r => r.id === refId);
  if (!ref || !ref.note) return;
  clearInfoHideTimer();
  if (activeInfoBtn && activeInfoBtn !== btn) {
    activeInfoBtn.setAttribute('aria-expanded', 'false');
  }
  dom.infoTooltip.innerHTML = ref.note;
  dom.infoTooltip.querySelectorAll('a').forEach(a => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  dom.infoTooltip.classList.add('is-open');
  dom.infoTooltip.setAttribute('aria-hidden', 'false');
  btn.setAttribute('aria-expanded', 'true');
  activeInfoBtn = btn;
  // Position after layout so width/height are known.
  requestAnimationFrame(() => positionInfoTooltip(btn));
}

function hideInfoTooltip() {
  clearInfoHideTimer();
  if (!activeInfoBtn && !pinnedInfoId) return;
  dom.infoTooltip.classList.remove('is-open');
  dom.infoTooltip.setAttribute('aria-hidden', 'true');
  if (activeInfoBtn) activeInfoBtn.setAttribute('aria-expanded', 'false');
  activeInfoBtn = null;
  pinnedInfoId = null;
}

function onBarsOver(e) {
  const btn = e.target.closest('.bar-info');
  if (!btn) return;
  if (pinnedInfoId) return; // pinned takes precedence over hover
  showInfoTooltip(btn);
}

function onBarsOut(e) {
  const btn = e.target.closest('.bar-info');
  if (!btn) return;
  if (pinnedInfoId) return;
  // Don't hide if focus is still on the button (keyboard user).
  if (document.activeElement === btn) return;
  // Delay so the cursor can move into the tooltip to click a link.
  scheduleInfoHide();
}

function onBarsClick(e) {
  const btn = e.target.closest('.bar-info');
  if (!btn) return;
  e.stopPropagation();
  const id = btn.dataset.noteId;
  if (pinnedInfoId === id) {
    hideInfoTooltip();
  } else {
    pinnedInfoId = id;
    showInfoTooltip(btn);
  }
}

function onBarsFocusIn(e) {
  const btn = e.target.closest('.bar-info');
  if (!btn) return;
  if (pinnedInfoId) return;
  showInfoTooltip(btn);
}

function onBarsFocusOut(e) {
  const btn = e.target.closest('.bar-info');
  if (!btn) return;
  if (pinnedInfoId) return;
  hideInfoTooltip();
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

const BAR_COLORS = [
  { fill: '#98c1d9', tone: 'light' },  // powder blue
  { fill: '#3d5a80', tone: 'dark' },   // dusk blue
];

function colorFor(index) {
  return BAR_COLORS[index % BAR_COLORS.length];
}

function buildBars() {
  // Render all reference bars + a user bar (hidden when no input)
  dom.bars.innerHTML = '';
  REFERENCES.forEach((ref, idx) => {
    const li = document.createElement('li');
    li.className = 'bar-row is-inactive';
    li.dataset.barId = ref.id;
    const { fill, tone } = colorFor(idx);
    li.style.setProperty('--bar-color', fill);
    li.dataset.barTone = tone;
    const infoBtn = ref.note
      ? `<button class="bar-info" type="button" data-note-id="${ref.id}" aria-label="${escapeAttr(stripHtml(ref.note))}" aria-expanded="false">i</button>`
      : '';
    li.innerHTML = `
      <div class="bar-label">
        <span class="bar-label-text" title="${escapeAttr(ref.label)}">${ref.label}</span>
        ${infoBtn}
      </div>
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
    <div class="bar-label">
      <span class="bar-label-text user-editable" contenteditable="plaintext-only" spellcheck="false" title="Click to rename"></span>
    </div>
    <div class="bar-track">
      <div class="bar-fill"></div>
      <span class="bar-count" data-user-count></span>
    </div>
  `;
  const userLabel = userLi.querySelector('.bar-label-text');
  userLabel.textContent = state.userBarLabel;
  wireUserLabelEditing(userLabel);
  dom.bars.appendChild(userLi);
}

function wireUserLabelEditing(labelEl) {
  labelEl.addEventListener('focus', () => {
    // Select all on focus so the user can immediately overtype.
    const range = document.createRange();
    range.selectNodeContents(labelEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  labelEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      labelEl.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      labelEl.textContent = state.userBarLabel;
      labelEl.blur();
    }
  });
  labelEl.addEventListener('blur', () => {
    const next = labelEl.textContent.replace(/\s+/g, ' ').trim() || 'Your input';
    state.userBarLabel = next;
    labelEl.textContent = next;
    labelEl.setAttribute('title', next === 'Your input' ? 'Click to rename' : next);
    updateUrl();
  });
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
  updateShareButton();
  updateUrl();
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
  autoScrollToUserBar();
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
  autoScrollToUserBar();
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

// ----- URL params -----

// Reads ?title=&tokens=&text=&ref1=&ref2= and seeds state + DOM inputs.
// Returns the mode to switch to ('paste' | 'count') if params imply one, else null.
function applyUrlParamsToState() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) return null;

  const refIds = new Set(REFERENCES.map(r => r.id));

  const title = params.get('title');
  if (title) {
    const t = title.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (t) state.userBarLabel = t;
  }

  const ref1 = params.get('ref1');
  if (ref1 && refIds.has(ref1)) {
    state.selectedRefId = ref1;
    state.userPickedPrimary = true;
  }

  const ref2 = params.get('ref2');
  if (ref2 && refIds.has(ref2) && ref2 !== state.selectedRefId) {
    state.secondaryRefId = ref2;
    state.userPickedSecondary = true;
  }

  const text = params.get('text');
  if (text) {
    state.inputText = text;
    state.charCount = text.length;
    state.wordCount = countWords(text);
    dom.pasteInput.value = text;
    return 'paste';
  }

  const tokensRaw = params.get('tokens');
  if (tokensRaw) {
    const n = parseInt(tokensRaw.replace(/[^\d]/g, ''), 10);
    if (n > 0 && isFinite(n)) {
      state.manualCount = n;
      state.userTokenCount = n;
      dom.countInput.value = n.toLocaleString('en-US');
      return 'count';
    }
  }

  return null;
}

// Build a shareable URL from current state. Returns the bare base URL when
// nothing meaningful is set.
function buildShareUrl() {
  const params = new URLSearchParams();
  if (state.userBarLabel && state.userBarLabel !== 'Your input') {
    params.set('title', state.userBarLabel);
  }
  if (state.mode === 'paste' && state.inputText) {
    params.set('text', state.inputText);
  } else if (state.mode === 'count' && state.manualCount > 0) {
    params.set('tokens', String(state.manualCount));
  }
  if (state.selectedRefId) params.set('ref1', state.selectedRefId);
  if (state.secondaryRefId) params.set('ref2', state.secondaryRefId);

  const qs = params.toString();
  const base = window.location.origin + window.location.pathname;
  return qs ? `${base}?${qs}` : base;
}

function updateUrl() {
  const next = buildShareUrl();
  if (window.location.href === next) return;
  history.replaceState(null, '', next);
}

function updateShareButton() {
  const hasContent = state.userTokenCount && state.userTokenCount > 0;
  dom.shareBtn.hidden = !hasContent;
}

let shareResetTimer = null;
async function onShareClick() {
  const url = buildShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    dom.shareBtn.textContent = '✓ Copied!';
    dom.shareBtn.classList.add('is-success');
  } catch (err) {
    console.error('Failed to copy share URL:', err);
    dom.shareBtn.textContent = 'Copy failed';
  }
  clearTimeout(shareResetTimer);
  shareResetTimer = setTimeout(() => {
    dom.shareBtn.textContent = 'Share link';
    dom.shareBtn.classList.remove('is-success');
  }, 2000);
}

// ----- Init -----

async function init() {
  const urlMode = applyUrlParamsToState();
  if (state.userBarLabel && state.userBarLabel !== 'Your input') {
    document.title = `${state.userBarLabel} — Token Compare`;
  }

  buildBars();
  buildPopover();
  refreshWindowSize();
  buildDriver();
  if (urlMode === 'count') setMode('count');
  render();

  for (const tab of dom.tabs) {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  }
  dom.pasteInput.addEventListener('input', onPasteInput);
  dom.countInput.addEventListener('input', onCountInput);
  dom.shareBtn.addEventListener('click', onShareClick);

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
    if (state.dropdownOpen
        && !dom.refPopover.contains(e.target)
        && !dom.refChipPrimary.contains(e.target)
        && !dom.refChipSecondary.contains(e.target)) {
      toggleDropdown(false);
    }
    if (pinnedInfoId && !dom.infoTooltip.contains(e.target)) {
      hideInfoTooltip();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (pinnedInfoId || activeInfoBtn) {
      const btn = activeInfoBtn;
      hideInfoTooltip();
      if (btn) btn.focus();
      return;
    }
    if (state.dropdownOpen) {
      const chip = state.dropdownTarget === 'secondary'
        ? dom.refChipSecondary
        : dom.refChipPrimary;
      toggleDropdown(false);
      chip.focus();
    }
  });

  dom.bars.addEventListener('mouseover', onBarsOver);
  dom.bars.addEventListener('mouseout', onBarsOut);
  dom.bars.addEventListener('click', onBarsClick);
  dom.bars.addEventListener('focusin', onBarsFocusIn);
  dom.bars.addEventListener('focusout', onBarsFocusOut);

  dom.infoTooltip.addEventListener('mouseenter', clearInfoHideTimer);
  dom.infoTooltip.addEventListener('mouseleave', () => {
    if (pinnedInfoId) return;
    hideInfoTooltip();
  });

  updateActiveBars();
  window.addEventListener('scroll', () => {
    onScroll();
    if (state.dropdownOpen) toggleDropdown(false);
    if (activeInfoBtn || pinnedInfoId) hideInfoTooltip();
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
    if (activeInfoBtn) hideInfoTooltip();
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
