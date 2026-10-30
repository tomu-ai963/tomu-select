'use strict';

/* ==================== Data ====================
   アプリ・棚・法人向け商品は apps.json の1か所で管理する。
   取得中: スケルトン表示 → 取得後: 棚と法人向けグリッドを描画 */
const DATA_URL = 'apps.json';

const ICONS = {
  invoice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z"/><path d="M9.5 12l2 2 3.5-4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2"/><path d="M11 8.5v5M8.5 11h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l4-8 4 5 3-3 5 6"/><path d="M4 21h16"/></svg>',
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 14h4"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/><path d="M13.5 5l-3 14"/></svg>'
};

const MARK_ICONS = {
  mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  offline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>'
};

const PRICE_LABELS = { free: '無料', paid: '有料', both: '無料＋有料', soon: '準備中' };

// 外部データがそのまま流れても安全なよう、テキストはすべて textContent で挿入する。
// innerHTML を使うのはローカル定義の ICONS / MARK_ICONS の値のみ(外部データは鍵としてのみ使用)。
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function own(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key);
}

function setIcon(target, iconKey) {
  target.innerHTML = own(ICONS, iconKey) ? ICONS[iconKey] : '';
}

// リンク先は https のみ許可する(javascript: などをデータから流し込ませない)
function safeUrl(url) {
  return typeof url === 'string' && /^https:\/\//.test(url) ? url : null;
}

const statusEl = document.getElementById('grid-status');
function announce(message) {
  if (statusEl) statusEl.textContent = message;
}

/* ==================== Apps (shelves) ==================== */
const shelfList = document.getElementById('shelf-list');
const shelfNav = document.getElementById('shelf-nav');

function renderAppSkeleton(count = 4) {
  shelfList.setAttribute('aria-busy', 'true');
  const grid = el('div', 'app-grid');
  for (let i = 0; i < count; i++) {
    const card = el('div', 'app-card skeleton');
    card.setAttribute('aria-hidden', 'true');
    ['skel skel-mono', 'skel skel-title', 'skel skel-line', 'skel skel-line short', 'skel skel-cta']
      .forEach((cls) => card.appendChild(el('div', cls)));
    grid.appendChild(card);
  }
  shelfList.replaceChildren(grid);
}

function renderMark(kind, label) {
  const item = el('li');
  item.innerHTML = MARK_ICONS[kind];
  item.appendChild(document.createTextNode(label));
  return item;
}

function renderAppCard(app) {
  const card = el('article', 'app-card');

  const top = el('div', 'app-top');
  const mono = el('span', 'mono', Array.from(app.name)[0] || '');
  mono.setAttribute('aria-hidden', 'true');
  top.appendChild(mono);
  const price = own(PRICE_LABELS, app.price) ? app.price : 'free';
  top.appendChild(el('span', 'badge badge-' + price, PRICE_LABELS[price]));
  card.appendChild(top);

  const body = el('div', 'app-body');
  body.appendChild(el('h3', 'app-name', app.name));
  body.appendChild(el('p', 'app-desc', app.desc));
  card.appendChild(body);

  // 印とボタンは1つの箱にまとめる(パソコン幅は縦に積み、スマホ幅は横に並べる)
  const foot = el('div', 'app-foot');
  if (app.mobile || app.offline) {
    const marks = el('ul', 'marks');
    marks.setAttribute('aria-label', '特徴');
    if (app.mobile) marks.appendChild(renderMark('mobile', 'スマホ向け'));
    if (app.offline) marks.appendChild(renderMark('offline', 'オフラインでも動く'));
    foot.appendChild(marks);
  }

  const href = safeUrl(app.url);
  if (href) {
    const label = app.link === 'github' ? 'GitHub で見る' : price === 'soon' ? '見てみる' : '使ってみる';
    const cta = el('a', 'app-cta', label + ' →');
    cta.href = href;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.appendChild(el('span', 'visually-hidden', '（' + app.name + '・新しいタブで開きます）'));
    foot.appendChild(cta);
  }
  card.appendChild(foot);
  return card;
}

function renderShelves(shelves, apps) {
  shelfList.replaceChildren();
  shelfNav.replaceChildren();
  const footerLinks = document.getElementById('footer-shelf-links');
  if (footerLinks) footerLinks.replaceChildren();

  shelves.forEach((shelf) => {
    const items = apps.filter((app) => app.shelf === shelf.id);
    if (!items.length) return;
    const anchor = 'shelf-' + shelf.id;

    const group = el('section', 'shelf-group');
    group.id = anchor;
    group.setAttribute('aria-labelledby', anchor + '-title');
    const head = el('div', 'shelf-head');
    const title = el('h2', null, shelf.title);
    title.id = anchor + '-title';
    head.appendChild(title);
    head.appendChild(el('span', 'count', items.length + '件'));
    group.appendChild(head);

    const grid = el('div', 'app-grid');
    items.forEach((app) => grid.appendChild(renderAppCard(app)));
    group.appendChild(grid);
    shelfList.appendChild(group);

    const navLink = el('a', null, shelf.title);
    navLink.href = '#' + anchor;
    shelfNav.appendChild(navLink);

    if (footerLinks) {
      const item = el('li');
      const link = el('a', null, shelf.title);
      link.href = '#' + anchor;
      item.appendChild(link);
      footerLinks.appendChild(item);
    }
  });
  shelfList.setAttribute('aria-busy', 'false');
}

/* ==================== Business products ==================== */
const productGrid = document.getElementById('product-grid');
let PRODUCTS = [];

function renderProducts(container, products) {
  container.replaceChildren();
  products.forEach((p) => {
    const card = el('button', 'card');
    card.type = 'button';
    card.setAttribute('data-id', p.id);

    const icon = el('span', 'card-icon');
    icon.setAttribute('aria-hidden', 'true');
    setIcon(icon, p.icon);
    card.appendChild(icon);

    card.appendChild(el('span', 'card-title', p.name));
    card.appendChild(el('span', 'desc', p.desc));

    const foot = el('span', 'card-foot');
    const price = el('span', 'price', p.price);
    price.appendChild(el('span', 'per', p.per));
    foot.appendChild(price);
    foot.appendChild(el('span', 'card-link', '詳細を見る →'));
    card.appendChild(foot);

    container.appendChild(card);
  });
  container.setAttribute('aria-busy', 'false');
}

// クリックはグリッドへのイベント委譲1本で処理する
productGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.card[data-id]');
  if (card) openModal(card.getAttribute('data-id'), card);
});

/* ==================== Load ==================== */
renderAppSkeleton();
announce('アプリの一覧を読み込んでいます…');

fetch(DATA_URL)
  .then((res) => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then((data) => {
    const shelves = Array.isArray(data.shelves) ? data.shelves : [];
    const apps = Array.isArray(data.apps) ? data.apps : [];
    PRODUCTS = Array.isArray(data.business) ? data.business : [];
    renderShelves(shelves, apps);
    renderProducts(productGrid, PRODUCTS);
    announce(apps.length + '件のアプリを表示しました');
    // 棚へのリンク(#shelf-…)で開かれたときは、描画後にその棚へ移動する
    if (location.hash.startsWith('#shelf-')) scrollToHash();
  })
  .catch(() => {
    const message = 'アプリの一覧を読み込めませんでした。ページを再読み込みしてください。';
    shelfList.replaceChildren(el('p', 'load-error', message));
    productGrid.replaceChildren(el('p', 'load-error', message));
    shelfList.setAttribute('aria-busy', 'false');
    productGrid.setAttribute('aria-busy', 'false');
    announce(message);
  });

/* ==================== Tabs ==================== */
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

function selectTab(panelId, focus) {
  tabs.forEach((tab) => {
    const on = tab.getAttribute('aria-controls') === panelId;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
    if (on && focus) tab.focus();
  });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    const id = tab.getAttribute('aria-controls');
    selectTab(id);
    history.replaceState(null, '', '#' + id);
  });
  // 左右キーで隣のタブへ、Home / End で端へ(WAI-ARIA Tabs パターン・自動で切り替える)
  tab.addEventListener('keydown', (e) => {
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    const id = next.getAttribute('aria-controls');
    selectTab(id, true);
    history.replaceState(null, '', '#' + id);
  });
});

// URL のハッシュに合わせてタブを選ぶ。#apps / #business はタブ、#shelf-… はアプリのタブの中の棚
function scrollToHash() {
  const hash = location.hash;
  if (hash === '#apps' || hash === '#business') {
    selectTab(hash.slice(1));
    document.getElementById('shelf').scrollIntoView();
  } else if (hash.startsWith('#shelf-')) {
    selectTab('apps');
    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
  }
}
window.addEventListener('hashchange', scrollToHash);
if (location.hash === '#apps' || location.hash === '#business') scrollToHash();

/* ==================== Modal ==================== */
const overlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
let lastFocused = null;

// モーダル表示中は背景ツリーを inert 化してフォーカス・支援技術の対象から外す。
// 対象は data-inert-target 属性で指定する(CSSクラス名のリネームに影響されない)。
function setBackgroundInert(on) {
  document.querySelectorAll('[data-inert-target]').forEach((node) => {
    if (on) {
      node.setAttribute('inert', '');
      node.setAttribute('aria-hidden', 'true');
    } else {
      node.removeAttribute('inert');
      node.removeAttribute('aria-hidden');
    }
  });
}

function openModal(id, trigger) {
  const p = PRODUCTS.find((item) => item.id === id);
  if (!p) return;
  lastFocused = trigger || document.activeElement;

  setIcon(document.getElementById('modal-icon'), p.icon);
  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-cat').textContent = p.category;
  document.getElementById('modal-desc').textContent = p.fullDesc;
  const priceEl = document.getElementById('modal-price');
  priceEl.textContent = p.price;
  priceEl.appendChild(el('span', 'per', p.per));
  const feat = document.getElementById('modal-features');
  feat.replaceChildren();
  (Array.isArray(p.features) ? p.features : []).forEach((f) => feat.appendChild(el('li', null, f)));

  overlay.classList.add('is-open');
  document.body.classList.add('is-modal-open');
  setBackgroundInert(true);
  modalClose.focus();
}

function closeModal() {
  overlay.classList.remove('is-open');
  document.body.classList.remove('is-modal-open');
  setBackgroundInert(false); // フォーカスを戻す前に inert 解除が必須
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

modalClose.addEventListener('click', closeModal);

// オーバーレイクリックで閉じる判定は mousedown 起点で行う。
// モーダル内テキストを選択してオーバーレイ上でマウスを離したときに
// click がオーバーレイで発火して閉じてしまうのを防ぐ。
let pressStartedOnOverlay = false;
overlay.addEventListener('mousedown', (e) => {
  pressStartedOnOverlay = (e.target === overlay);
});
overlay.addEventListener('click', (e) => {
  if (e.target === overlay && pressStartedOnOverlay) closeModal();
  pressStartedOnOverlay = false;
});

document.addEventListener('keydown', (e) => {
  if (!overlay.classList.contains('is-open')) return;
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  // フォーカストラップ: Tab は常に preventDefault し、移動先をここで完全に管理する。
  if (e.key === 'Tab') {
    e.preventDefault();
    const focusables = Array.from(
      overlay.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    ).filter((node) => !node.disabled && node.getClientRects().length > 0);
    if (!focusables.length) return;
    const idx = focusables.indexOf(document.activeElement);
    let next;
    if (e.shiftKey) {
      next = idx <= 0 ? focusables[focusables.length - 1] : focusables[idx - 1];
    } else {
      next = (idx === -1 || idx === focusables.length - 1) ? focusables[0] : focusables[idx + 1];
    }
    next.focus();
  }
});

/* ==================== Mobile menu ==================== */
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'メニューを開く' : 'メニューを閉じる');
  mobileMenu.classList.toggle('is-open', !isOpen);
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'メニューを開く');
    mobileMenu.classList.remove('is-open');
  });
});
