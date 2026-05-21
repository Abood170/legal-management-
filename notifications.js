/* ── Notification Center — notifications.js ── */
(function () {

  /* ── CSS ── */
  var css = document.createElement('style');
  css.textContent = [
    /* panel */
    '.nc-panel{position:fixed;top:62px;left:1.5rem;width:360px;max-height:520px;background:#fff;',
    'border:1px solid rgba(15,20,25,.1);border-radius:14px;box-shadow:0 20px 60px rgba(15,20,25,.18),0 4px 16px rgba(15,20,25,.08);',
    'z-index:99998;display:flex;flex-direction:column;overflow:hidden;',
    'opacity:0;pointer-events:none;transform:translateY(-8px) scale(.98);transition:opacity .18s ease,transform .18s cubic-bezier(.4,0,.2,1)}',
    '.nc-panel.open{opacity:1;pointer-events:auto;transform:translateY(0) scale(1)}',
    /* head */
    '.nc-head{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.1rem .7rem;border-bottom:1px solid rgba(15,20,25,.07);flex-shrink:0}',
    '.nc-head-title{font-size:.82rem;font-weight:700;color:#0F1419;font-family:"Cairo",sans-serif;display:flex;align-items:center;gap:.4rem}',
    '.nc-total-badge{font-size:.56rem;font-weight:700;padding:2px 7px;border-radius:2rem;background:#DC2626;color:#fff;line-height:1.4}',
    '.nc-clear{font-size:.62rem;color:#94A3B8;background:none;border:none;cursor:pointer;font-family:"Cairo",sans-serif;padding:2px 6px;border-radius:4px;transition:all .15s}',
    '.nc-clear:hover{color:#DC2626;background:rgba(220,38,38,.06)}',
    /* body */
    '.nc-body{overflow-y:auto;flex:1;padding:.4rem 0 .5rem}',
    '.nc-body::-webkit-scrollbar{width:3px}.nc-body::-webkit-scrollbar-thumb{background:rgba(15,20,25,.12);border-radius:2px}',
    '.nc-section-lbl{font-size:.56rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;',
    'padding:.5rem 1.1rem .15rem;font-family:"Cairo",sans-serif}',
    '.nc-item{display:flex;align-items:flex-start;gap:.65rem;padding:.55rem 1.1rem;cursor:pointer;transition:background .1s;position:relative}',
    '.nc-item:hover{background:rgba(28,94,62,.05)}',
    '.nc-item-ico{font-size:.9rem;width:18px;text-align:center;flex-shrink:0;margin-top:1px}',
    '.nc-item-body{flex:1;min-width:0}',
    '.nc-item-title{font-size:.76rem;font-weight:600;color:#0F1419;font-family:"Cairo",sans-serif;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}',
    '.nc-item-sub{font-size:.63rem;color:#64748B;font-family:"Cairo",sans-serif;margin-top:2px;',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px}',
    '.nc-dot-red{background:#DC2626}.nc-dot-gold{background:#B8952A}.nc-dot-green{background:#16a34a}.nc-dot-blue{background:#3B82F6}',
    /* divider */
    '.nc-divider{height:1px;background:rgba(15,20,25,.06);margin:.2rem 0}',
    /* empty */
    '.nc-empty{text-align:center;padding:2.5rem 1rem;font-family:"Cairo",sans-serif}',
    '.nc-empty-ico{font-size:1.8rem;margin-bottom:.45rem}',
    '.nc-empty-title{font-size:.8rem;font-weight:700;color:#2D3748;margin-bottom:.25rem}',
    '.nc-empty-sub{font-size:.68rem;color:#94A3B8}',
    /* footer */
    '.nc-foot{border-top:1px solid rgba(15,20,25,.07);padding:.6rem 1.1rem;flex-shrink:0;display:flex;gap:.5rem}',
    '.nc-foot-btn{flex:1;text-align:center;font-size:.68rem;font-weight:600;color:#1C5E3E;background:rgba(28,94,62,.06);',
    'border:1px solid rgba(28,94,62,.15);border-radius:6px;padding:.38rem;cursor:pointer;',
    'font-family:"Cairo",sans-serif;transition:all .15s;text-decoration:none;display:block}',
    '.nc-foot-btn:hover{background:rgba(28,94,62,.12);border-color:rgba(28,94,62,.3)}',
    /* bell badge */
    '.nc-bell-badge{position:absolute;top:-4px;left:-4px;min-width:15px;height:15px;background:#DC2626;',
    'color:#fff;font-size:.52rem;font-weight:700;border-radius:2rem;border:2px solid #fff;',
    'display:flex;align-items:center;justify-content:center;padding:0 3px;font-family:"Cairo",sans-serif;line-height:1;',
    'animation:ncPop .3s cubic-bezier(.4,0,.2,1) both}',
    '@keyframes ncPop{from{transform:scale(0)}to{transform:scale(1)}}',
    /* mobile */
    '@media(max-width:600px){.nc-panel{width:calc(100vw - 2rem);left:1rem;top:60px}}'
  ].join('');
  document.head.appendChild(css);

  /* ── helpers ── */
  var MONTHS_MAP = {
    'يناير':0,'فبراير':1,'مارس':2,'أبريل':3,'مايو':4,'يونيو':5,
    'يوليو':6,'أغسطس':7,'سبتمبر':8,'أكتوبر':9,'نوفمبر':10,'ديسمبر':11
  };
  function parseArabicDate(str) {
    if (!str) return null;
    var p = String(str).trim().split(/\s+/);
    if (p.length < 3) return null;
    var d = parseInt(p[0]), m = MONTHS_MAP[p[1]], y = parseInt(p[2]);
    if (isNaN(d) || m === undefined || isNaN(y)) return null;
    return new Date(y, m, d);
  }
  function daysDiff(date) {
    if (!date) return null;
    var t = new Date(); t.setHours(0,0,0,0);
    var d = new Date(date); d.setHours(0,0,0,0);
    return Math.round((d - t) / 86400000);
  }
  function parseRows(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
  }
  function parseTr(html) {
    return new DOMParser()
      .parseFromString('<table><tbody><tr>' + html + '</tr></tbody></table>', 'text/html')
      .querySelectorAll('td');
  }
  function txt(el) {
    if (!el) return '';
    return el.textContent ? el.textContent.replace(/\s+/g,' ').trim() : '';
  }
  function q(el, sel) { return el && el.querySelector ? el.querySelector(sel) : null; }

  /* ── collect notifications ── */
  function collectItems() {
    var items = [];

    /* ── Sessions today & upcoming ── */
    parseRows('sessions_data').forEach(function (html) {
      var c    = parseTr(html);
      var dateStr = txt(q(c[0],'.date-cell') || c[0]);
      var date    = parseArabicDate(dateStr);
      if (!date) return;
      var diff = daysDiff(date);
      if (diff === null || diff > 7 || diff < 0) return;

      var caseName = txt(q(c[2],'.case-name') || c[2]);
      var caseId   = txt(q(c[2],'.case-id'));
      var time     = txt(q(c[1],'.time-cell') || c[1]);
      var court    = txt(c[3]);

      if (diff === 0) {
        items.push({
          group:'sessions', urgency:1,
          dot:'nc-dot-red', icon:'⚖️',
          title: caseName || 'جلسة اليوم',
          sub: 'اليوم' + (time?' · '+time:'') + (court?' · '+court:'') + (caseId?' · '+caseId:''),
          href:'sessions.html', diff:0
        });
      } else {
        var label = diff===1 ? 'غداً' : 'بعد '+diff+' أيام';
        items.push({
          group:'sessions', urgency:2,
          dot:'nc-dot-gold', icon:'📅',
          title: caseName || 'جلسة قادمة',
          sub: label + ' · ' + dateStr + (court?' · '+court:''),
          href:'sessions.html', diff:diff
        });
      }
    });

    /* ── Overdue invoices ── */
    parseRows('invoices_data').forEach(function (html) {
      var c    = parseTr(html);
      var pill = q(c[8],'.pill') || q(c[8],'.pill-overdue');
      /* check for overdue class */
      var isOverdue = false;
      if (c[8]) {
        var ps = c[8].querySelectorAll ? c[8].querySelectorAll('.pill') : [];
        for (var i=0;i<ps.length;i++) {
          if (ps[i].className.indexOf('overdue') !== -1) { isOverdue=true; break; }
        }
        /* also scan the html string directly */
        if (!isOverdue && html.indexOf('pill-overdue') !== -1) isOverdue=true;
      }
      if (!isOverdue) return;
      var invNum = txt(q(c[0],'.case-name') || c[0]);
      var client = txt(c[1]);
      var total  = txt(q(c[5],'.amount-total') || c[5]);
      var due    = txt(q(c[7],'.date-cell') || c[7]);
      items.push({
        group:'invoices', urgency:1,
        dot:'nc-dot-red', icon:'🧾',
        title: invNum + ' — ' + client,
        sub: 'فاتورة متأخرة' + (due?' · استحقت '+due:'') + (total?' · '+total:''),
        href:'invoices.html', diff:null
      });
    });

    /* ── Pending fees (high value) ── */
    var pendingTotal = 0, pendingCount = 0;
    parseRows('fees_data').forEach(function(html) {
      var c = parseTr(html);
      var stat = txt(q(c[7],'.pill') || c[7]);
      var money = parseFloat((c[4]&&c[4].getAttribute?c[4].getAttribute('data-amount'):null)||0);
      if (stat.indexOf('معلق') !== -1 || stat.indexOf('متأخر') !== -1) {
        pendingTotal += money || 0;
        pendingCount++;
      }
    });
    if (pendingCount > 0) {
      items.push({
        group:'fees', urgency:2,
        dot:'nc-dot-gold', icon:'💰',
        title: pendingCount + ' أتعاب معلقة التحصيل',
        sub: pendingTotal > 0
          ? 'إجمالي: ' + pendingTotal.toLocaleString('en-US', {minimumFractionDigits:2}) + ' ر.س'
          : 'بحاجة لمتابعة',
        href:'fees.html', diff:null
      });
    }

    /* ── Overdue / due-today tasks ── */
    parseRows('tasks_data').forEach(function (html) {
      var c       = parseTr(html);
      var title   = txt(q(c[2],'.case-name') || c[2]);
      var dueStr  = txt(q(c[4],'.date-cell') || c[4]);
      var date    = parseArabicDate(dueStr);
      if (!date) return;
      var diff = daysDiff(date);
      /* skip completed tasks */
      var statTxt = txt(c[0]);
      if (statTxt.indexOf('مكتمل') !== -1 || statTxt.indexOf('منجز') !== -1 || statTxt.indexOf('مغلق') !== -1) return;
      if (diff === null) return;
      if (diff < 0) {
        items.push({
          group:'tasks', urgency:1,
          dot:'nc-dot-red', icon:'📋',
          title: title || 'مهمة متأخرة',
          sub: 'متأخرة ' + Math.abs(diff) + ' يوم · ' + dueStr,
          href:'tasks.html', diff:diff
        });
      } else if (diff === 0) {
        items.push({
          group:'tasks', urgency:2,
          dot:'nc-dot-gold', icon:'📋',
          title: title || 'مهمة اليوم',
          sub: 'موعد التسليم اليوم',
          href:'tasks.html', diff:0
        });
      }
    });

    /* sort: urgency asc, then diff asc */
    items.sort(function(a,b) {
      if (a.urgency !== b.urgency) return a.urgency - b.urgency;
      var da = a.diff != null ? Math.abs(a.diff) : 998;
      var db = b.diff != null ? Math.abs(b.diff) : 998;
      return da - db;
    });

    return items;
  }

  /* ── build panel HTML ── */
  function buildPanelHTML(items) {
    if (!items.length) {
      return '<div class="nc-empty">' +
        '<div class="nc-empty-ico">✅</div>' +
        '<div class="nc-empty-title">لا توجد إشعارات</div>' +
        '<div class="nc-empty-sub">كل شيء على ما يرام — لا جلسات اليوم ولا متأخرات</div>' +
      '</div>';
    }

    var groups = {
      sessions: { label:'📅 الجلسات',   items:[] },
      invoices: { label:'🧾 الفواتير',  items:[] },
      fees:     { label:'💰 الأتعاب',   items:[] },
      tasks:    { label:'📋 المهام',     items:[] }
    };
    items.forEach(function(it) {
      if (groups[it.group]) groups[it.group].items.push(it);
    });

    var h = '';
    var ORDER = ['sessions','invoices','fees','tasks'];
    var first = true;
    ORDER.forEach(function(grp) {
      var g = groups[grp];
      if (!g.items.length) return;
      if (!first) h += '<div class="nc-divider"></div>';
      first = false;
      h += '<div class="nc-section-lbl">' + g.label + '</div>';
      g.items.forEach(function(it, idx) {
        h += '<div class="nc-item" data-href="'+it.href+'" tabindex="0">' +
               '<span class="nc-item-ico">' + it.icon + '</span>' +
               '<div class="nc-item-body">' +
                 '<div class="nc-item-title">' + escHtml(it.title) + '</div>' +
                 '<div class="nc-item-sub">' + escHtml(it.sub) + '</div>' +
               '</div>' +
               '<span class="nc-dot ' + it.dot + '"></span>' +
             '</div>';
      });
    });
    return h;
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── inject panel ── */
  var panel = document.createElement('div');
  panel.className = 'nc-panel';
  panel.id = 'ncPanel';
  panel.innerHTML =
    '<div class="nc-head">' +
      '<span class="nc-head-title">🔔 الإشعارات <span class="nc-total-badge" id="ncTotalBadge" style="display:none">0</span></span>' +
      '<button class="nc-clear" id="ncClearBtn">مسح الكل ✕</button>' +
    '</div>' +
    '<div class="nc-body" id="ncBody"></div>' +
    '<div class="nc-foot">' +
      '<a href="sessions.html" class="nc-foot-btn">📅 الجلسات</a>' +
      '<a href="invoices.html" class="nc-foot-btn">🧾 الفواتير</a>' +
      '<a href="tasks.html" class="nc-foot-btn">📋 المهام</a>' +
    '</div>';
  document.body.appendChild(panel);

  /* ── find & enhance bell icon ── */
  var bellEl = null;
  function findBell() {
    var icons = document.querySelectorAll('.topbar-icon');
    for (var i=0;i<icons.length;i++) {
      if (icons[i].textContent.indexOf('🔔') !== -1) { bellEl = icons[i]; break; }
    }
    if (bellEl) {
      bellEl.style.position = 'relative';
      bellEl.style.cursor   = 'pointer';
      /* remove static notif-dot if present — we'll add our own badge */
      var oldDot = bellEl.querySelector('.notif-dot');
      if (oldDot) oldDot.remove();
    }
  }

  var _dismissed = [];
  try { _dismissed = JSON.parse(localStorage.getItem('nc_dismissed') || '[]'); } catch(e) {}

  var _items = [];

  function updateBadge(count) {
    /* update badge on bell */
    if (bellEl) {
      var existing = bellEl.querySelector('.nc-bell-badge');
      if (count > 0) {
        if (!existing) {
          var b = document.createElement('span');
          b.className = 'nc-bell-badge';
          b.id = 'ncBellBadge';
          bellEl.appendChild(b);
          existing = b;
        }
        existing.textContent = count > 99 ? '99+' : String(count);
        existing.style.display = 'flex';
      } else {
        if (existing) existing.style.display = 'none';
        /* also hide the notif-dot if still present */
        var dot = bellEl.querySelector('.notif-dot');
        if (dot) dot.style.display = 'none';
      }
    }
    /* update badge in panel header */
    var tb = document.getElementById('ncTotalBadge');
    if (tb) {
      if (count > 0) { tb.textContent = String(count); tb.style.display = 'inline-flex'; }
      else { tb.style.display = 'none'; }
    }
  }

  function refresh() {
    _items = collectItems();
    var body = document.getElementById('ncBody');
    if (body) body.innerHTML = buildPanelHTML(_items);
    updateBadge(_items.length);

    /* attach click handlers */
    var itemEls = panel.querySelectorAll('.nc-item[data-href]');
    itemEls.forEach(function(el) {
      el.addEventListener('click', function() {
        var href = el.getAttribute('data-href');
        if (href) window.location.href = href;
        close();
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') el.click();
      });
    });
  }

  /* ── open / close ── */
  var _open = false;
  function open() {
    refresh();
    panel.classList.add('open');
    _open = true;
  }
  function close() {
    panel.classList.remove('open');
    _open = false;
  }
  function toggle() { _open ? close() : open(); }

  /* ── clear all ── */
  document.getElementById('ncClearBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    var body = document.getElementById('ncBody');
    if (body) body.innerHTML =
      '<div class="nc-empty"><div class="nc-empty-ico">✅</div>' +
      '<div class="nc-empty-title">تم مسح الإشعارات</div>' +
      '<div class="nc-empty-sub">ستظهر إشعارات جديدة عند تحديث البيانات</div></div>';
    updateBadge(0);
  });

  /* ── outside click ── */
  document.addEventListener('click', function(e) {
    if (!_open) return;
    if (panel.contains(e.target)) return;
    if (bellEl && bellEl.contains(e.target)) return;
    close();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && _open) close();
  });

  /* ── wire up bell ── */
  function wireBell() {
    if (!bellEl) return;
    bellEl.addEventListener('click', function(e) { e.stopPropagation(); toggle(); });
  }

  /* ── init ── */
  function init() {
    findBell();
    wireBell();
    refresh();
    /* re-check every 3 minutes */
    setInterval(refresh, 3 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* slight delay to let other scripts (demo-data, sidebar-badges) run first */
    setTimeout(init, 350);
  }

  /* expose for manual refresh from other scripts */
  window.refreshNotifications = refresh;

})();
