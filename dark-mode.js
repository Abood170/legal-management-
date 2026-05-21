/* ═══════════════════════════════════════════════════════
   dark-mode.js — منطق تبديل الوضع الليلي
   CSS في dark-mode.css | يُحقن في نهاية <body>
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── تطبيق مبكر لتجنب وميض التحميل ── */
  var saved = localStorage.getItem('theme_pref');
  if (!saved) {
    /* أول استخدام: تحقق من تفضيل النظام */
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme_pref', 'dark');
    }
  } else if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  /* ── حقن زر التبديل في الـ Topbar ── */
  function injectToggleBtn() {
    if (document.getElementById('dm-toggle-btn')) return;

    var topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return;

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var btn = document.createElement('div');
    btn.id = 'dm-toggle-btn';
    btn.className = 'dm-toggle';
    btn.title = 'تبديل الوضع الليلي / النهاري';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'تبديل الوضع الليلي');
    btn.textContent = isDark ? '☀️' : '🌙';

    btn.addEventListener('click', toggleDarkMode);

    /* أدرجه أول عنصر في topbar-right */
    topbarRight.insertBefore(btn, topbarRight.firstChild);
  }

  function toggleDarkMode() {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-theme') === 'dark';
    var btn = document.getElementById('dm-toggle-btn');

    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme_pref', 'light');
      if (btn) btn.textContent = '🌙';
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme_pref', 'dark');
      if (btn) btn.textContent = '☀️';
    }

    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: isDark ? 'light' : 'dark' }
    }));
  }

  /* ── تهيئة بعد تحميل DOM ── */
  function init() {
    injectToggleBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 30);
  }

  /* ── API عام ── */
  window.toggleDarkMode = toggleDarkMode;

})();
