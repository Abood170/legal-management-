/* ── Global Search (Ctrl+K) ── */
(function () {
  /* ── inject CSS ── */
  var css = document.createElement('style');
  css.textContent = [
    '.gs-ov{position:fixed;inset:0;z-index:999999;background:rgba(15,20,25,.58);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:flex-start;justify-content:center;padding:7vh 1rem 1rem;opacity:0;pointer-events:none;transition:opacity .18s ease}',
    '.gs-ov.open{opacity:1;pointer-events:auto}',
    '.gs-card{background:#fff;border-radius:14px;width:100%;max-width:600px;box-shadow:0 24px 64px rgba(15,20,25,.22),0 4px 16px rgba(15,20,25,.1);overflow:hidden;transform:translateY(-14px);transition:transform .18s cubic-bezier(.4,0,.2,1)}',
    '.gs-ov.open .gs-card{transform:translateY(0)}',
    '.gs-bar{display:flex;align-items:center;gap:.7rem;padding:.95rem 1.2rem;border-bottom:1px solid rgba(15,20,25,.08)}',
    '.gs-bar-icon{font-size:1.05rem;color:#64748B;flex-shrink:0}',
    '.gs-inp{flex:1;border:none;outline:none;font-family:"Cairo",sans-serif;font-size:.94rem;color:#0F1419;background:transparent;caret-color:#1C5E3E}',
    '.gs-inp::placeholder{color:#94A3B8}',
    '.gs-esc{font-size:.6rem;color:#94A3B8;background:#F7F6F3;border:1px solid rgba(15,20,25,.1);padding:2px 7px;border-radius:4px;font-family:monospace;flex-shrink:0;cursor:pointer}',
    '.gs-res{max-height:400px;overflow-y:auto;padding:.35rem 0}',
    '.gs-empty{text-align:center;padding:2.5rem 1rem;color:#94A3B8;font-family:"Cairo",sans-serif;font-size:.8rem}',
    '.gs-empty-ico{font-size:1.75rem;margin-bottom:.45rem}',
    '.gs-grp{font-size:.57rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;padding:.5rem 1.2rem .18rem;font-family:"Cairo",sans-serif}',
    '.gs-item{display:flex;align-items:center;gap:.7rem;padding:.5rem 1.2rem;cursor:pointer;transition:background .1s;font-family:"Cairo",sans-serif}',
    '.gs-item:hover,.gs-item.gs-active{background:rgba(28,94,62,.07)}',
    '.gs-item-ico{font-size:.92rem;width:20px;text-align:center;flex-shrink:0}',
    '.gs-item-body{flex:1;min-width:0}',
    '.gs-item-ttl{font-size:.8rem;font-weight:600;color:#0F1419;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.gs-item-sub{font-size:.63rem;color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}',
    '.gs-item-bdg{font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:2rem;background:rgba(28,94,62,.09);color:#1C5E3E;flex-shrink:0;border:1px solid rgba(28,94,62,.12)}',
    '.gs-foot{padding:.5rem 1.2rem;border-top:1px solid rgba(15,20,25,.06);display:flex;align-items:center;gap:.9rem;font-size:.6rem;color:#94A3B8;font-family:"Cairo",sans-serif;flex-wrap:wrap}',
    '.gs-fkbd{background:#F7F6F3;border:1px solid rgba(15,20,25,.1);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:.58rem}',
    '.gs-trigger-hint{position:fixed;bottom:1rem;left:1rem;font-size:.65rem;color:#94A3B8;background:rgba(255,255,255,.9);border:1px solid rgba(15,20,25,.1);padding:.3rem .7rem;border-radius:6px;z-index:99990;pointer-events:none;font-family:"Cairo",sans-serif;backdrop-filter:blur(4px);display:none}',
    '@media (max-width:600px){.gs-card{border-radius:14px 14px 0 0;max-width:100%;}.gs-ov{align-items:flex-end;padding:0}}'
  ].join('');
  document.head.appendChild(css);

  /* ── inject HTML ── */
  var ov = document.createElement('div');
  ov.className = 'gs-ov';
  ov.id = 'gsOverlay';
  ov.innerHTML =
    '<div class="gs-card" id="gsCard" role="dialog" aria-label="بحث شامل">' +
      '<div class="gs-bar">' +
        '<span class="gs-bar-icon">🔍</span>' +
        '<input class="gs-inp" id="gsInp" type="text" placeholder="ابحث في القضايا، الموكلين، الفواتير، الجلسات..." autocomplete="off" spellcheck="false">' +
        '<span class="gs-esc" id="gsEscBtn">Esc</span>' +
      '</div>' +
      '<div class="gs-res" id="gsRes"><div class="gs-empty"><div class="gs-empty-ico">🔍</div>ابدأ الكتابة للبحث في النظام...</div></div>' +
      '<div class="gs-foot">' +
        '<span><span class="gs-fkbd">↑</span><span class="gs-fkbd">↓</span> تنقل</span>' +
        '<span><span class="gs-fkbd">↵</span> فتح</span>' +
        '<span><span class="gs-fkbd">Esc</span> إغلاق</span>' +
        '<span style="margin-right:auto"><span class="gs-fkbd">Ctrl</span> + <span class="gs-fkbd">K</span> لفتح البحث</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  var inp    = document.getElementById('gsInp');
  var resEl  = document.getElementById('gsRes');
  var escBtn = document.getElementById('gsEscBtn');
  var flatItems = [];  /* all navigable items in render order */
  var activeIdx = -1;
  var debTimer  = null;

  /* ── helpers ── */
  function parseRows(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }
  function parseTr(html) {
    return new DOMParser()
      .parseFromString('<table><tbody><tr>' + html + '</tr></tbody></table>', 'text/html')
      .querySelectorAll('td');
  }
  function txt(el) { return el ? el.textContent.trim() : ''; }
  function fmtNum(n) {
    var x = parseFloat((+n).toFixed(2));
    return isNaN(x) ? '' : x.toLocaleString('en-US') + ' ر.س';
  }
  function hilite(str, q) {
    if (!q || !str) return str || '';
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return str.replace(re, '<mark style="background:rgba(184,149,42,.25);color:#0F1419;border-radius:2px;padding:0 1px">$1</mark>');
  }

  /* ── data sources ── */
  function searchCases(q) {
    return parseRows('cases_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      /* typical cases table: td0=row#, td1=case# .case-name/.case-id, td2=type, td3=client, td4=court, td5=lawyer, td6=status */
      var caseNum = txt(cells[1] && cells[1].querySelector ? cells[1].querySelector('.case-name') : null) || txt(cells[1]);
      var caseId  = txt(cells[1] && cells[1].querySelector ? cells[1].querySelector('.case-id')   : null);
      var type    = txt(cells[2]);
      var client  = txt(cells[3]);
      var court   = txt(cells[4]);
      var full    = [caseNum, caseId, type, client, court].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'⚖️', title: caseNum || type, sub: client + (court ? ' · ' + court : '') + (caseId ? ' · ' + caseId : ''), badge:'قضية', href:'cases.html' });
      }
      return acc;
    }, []).slice(0, 6);
  }

  function searchDynCases(q) {
    /* dynamicCases is also used */
    return parseRows('dynamicCases').reduce(function(acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      var caseNum = txt(cells[1] && cells[1].querySelector ? cells[1].querySelector('.case-name') : null) || txt(cells[1]);
      var type    = txt(cells[2]);
      var client  = txt(cells[3]);
      var court   = txt(cells[4]);
      var full    = [caseNum, type, client, court].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'⚖️', title: caseNum || type, sub: client + (court ? ' · ' + court : ''), badge:'قضية', href:'cases.html' });
      }
      return acc;
    }, []).slice(0, 4);
  }

  function searchClients(q) {
    return parseRows('clients_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      /* clients: td0=avatar, td1=name .case-name, td2=type, td3=phone, td4=cases count, td5=actions */
      var name  = txt(cells[1] && cells[1].querySelector ? cells[1].querySelector('.case-name') : null) || txt(cells[1]);
      var type  = txt(cells[2]);
      var phone = txt(cells[3]);
      var full  = [name, type, phone].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'👤', title: name, sub: type + (phone ? ' · ' + phone : ''), badge:'موكل', href:'clients.html' });
      }
      return acc;
    }, []).slice(0, 5);
  }

  function searchInvoices(q) {
    return parseRows('invoices_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      var num    = txt(cells[0] && cells[0].querySelector ? cells[0].querySelector('.case-name') : null) || txt(cells[0]);
      var client = txt(cells[1]);
      var total  = txt(cells[5]);
      var status = txt(cells[8]);
      var full   = [num, client, total, status].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'🧾', title: num, sub: client + ' · ' + total, badge:'فاتورة', href:'invoices.html' });
      }
      return acc;
    }, []).slice(0, 5);
  }

  function searchFees(q) {
    return parseRows('fees_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      /* fees: td0=#, td1=date, td2=client, td3=case .case-name/.case-id, td4=amount[data-amount], td5=lawyer-chip, td6=due-date, td7=status-pill */
      var client = txt(cells[2]);
      var cname  = txt(cells[3] && cells[3].querySelector ? cells[3].querySelector('.case-name') : null) || txt(cells[3]);
      var amount = fmtNum(cells[4] ? cells[4].getAttribute('data-amount') : '0');
      var status = txt(cells[7]);
      var full   = [client, cname, amount, status].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'💰', title: client || cname, sub: cname + ' · ' + amount, badge:'أتعاب', href:'fees.html' });
      }
      return acc;
    }, []).slice(0, 4);
  }

  function searchSessions(q) {
    return parseRows('sessions_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      var date  = txt(cells[0] && cells[0].querySelector ? cells[0].querySelector('.date-cell') : null) || txt(cells[0]);
      var time  = txt(cells[1] && cells[1].querySelector ? cells[1].querySelector('.time-cell') : null) || txt(cells[1]);
      var cname = txt(cells[2] && cells[2].querySelector ? cells[2].querySelector('.case-name') : null) || txt(cells[2]);
      var court = txt(cells[3]);
      var full  = [date, time, cname, court].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'📅', title: cname, sub: date + (time ? ' · ' + time : '') + (court ? ' · ' + court : ''), badge:'جلسة', href:'sessions.html' });
      }
      return acc;
    }, []).slice(0, 4);
  }

  function searchTasks(q) {
    return parseRows('tasks_data').reduce(function (acc, html) {
      var cells = parseTr(html);
      if (!cells.length) return acc;
      /* tasks: td0=status, td1=priority, td2=task .case-name, td3=case, td4=due, td5=lawyer, td6=actions */
      var title  = txt(cells[2] && cells[2].querySelector ? cells[2].querySelector('.case-name') : null) || txt(cells[2]);
      var lawyer = txt(cells[5]);
      var due    = txt(cells[4]);
      var full   = [title, lawyer, due].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'📋', title: title, sub: (lawyer ? lawyer + ' · ' : '') + (due ? 'موعد: ' + due : ''), badge:'مهمة', href:'tasks.html' });
      }
      return acc;
    }, []).slice(0, 4);
  }

  function searchLawyers(q) {
    return parseRows('lawyers_data').reduce(function (acc, html) {
      /* lawyers_data stores full card outerHTML */
      var doc  = new DOMParser().parseFromString(html, 'text/html');
      var name = txt(doc.querySelector('.lc-name'));
      var spec = txt(doc.querySelector('.lc-spec'));
      var stat = txt(doc.querySelector('.lc-stat-val'));
      var full = [name, spec, stat].join(' ').toLowerCase();
      if (full.indexOf(q) !== -1) {
        acc.push({ icon:'👨‍💼', title: name, sub: spec || stat, badge:'محامي', href:'lawyers.html' });
      }
      return acc;
    }, []).slice(0, 3);
  }

  /* ── quick nav items (always shown with empty query) ── */
  var NAV_PAGES = [
    { icon:'🏠', title:'لوحة التحكم',   sub:'الإحصائيات والنشاط الأخير',          badge:'صفحة', href:'dashboard.html' },
    { icon:'⚖️', title:'الدعاوى',        sub:'إدارة جميع القضايا القانونية',         badge:'صفحة', href:'cases.html' },
    { icon:'📅', title:'الجلسات',        sub:'جدول الجلسات والمواعيد',              badge:'صفحة', href:'sessions.html' },
    { icon:'👥', title:'الموكلون',       sub:'بيانات العملاء والموكلين',             badge:'صفحة', href:'clients.html' },
    { icon:'📋', title:'المهام',         sub:'تتبع المهام والمسؤوليات',              badge:'صفحة', href:'tasks.html' },
    { icon:'💰', title:'الأتعاب',        sub:'إدارة الأتعاب والمدفوعات',             badge:'صفحة', href:'fees.html' },
    { icon:'🧾', title:'فوترة ZATCA',    sub:'الفواتير الإلكترونية المتوافقة',        badge:'صفحة', href:'invoices.html' },
    { icon:'📊', title:'التقارير',       sub:'التقارير المالية والأداء',              badge:'صفحة', href:'reports.html' },
    { icon:'👨‍💼',title:'المحامون',       sub:'فريق العمل والمحامون',                 badge:'صفحة', href:'lawyers.html' },
    { icon:'⚙️', title:'الإعدادات',      sub:'إعدادات المكتب والنظام',               badge:'صفحة', href:'settings.html' },
  ];

  /* ── search orchestrator ── */
  function runSearch(q) {
    q = q.trim().toLowerCase();
    flatItems = [];

    if (!q) {
      /* show quick-nav */
      flatItems = NAV_PAGES.slice();
      renderSections([{ label: 'الصفحات', items: flatItems }], q);
      return;
    }

    /* filter quick-nav first */
    var pageHits = NAV_PAGES.filter(function(p) {
      return (p.title + ' ' + p.sub).toLowerCase().indexOf(q) !== -1;
    });

    var sections = [];
    if (pageHits.length) sections.push({ label: 'الصفحات', items: pageHits });

    var caseHits = searchCases(q).concat(searchDynCases(q));
    if (caseHits.length) sections.push({ label: 'الدعاوى', items: caseHits.slice(0, 6) });

    var clientHits = searchClients(q);
    if (clientHits.length) sections.push({ label: 'الموكلون', items: clientHits });

    var invHits = searchInvoices(q);
    if (invHits.length) sections.push({ label: 'الفواتير', items: invHits });

    var sessHits = searchSessions(q);
    if (sessHits.length) sections.push({ label: 'الجلسات', items: sessHits });

    var feeHits = searchFees(q);
    if (feeHits.length) sections.push({ label: 'الأتعاب', items: feeHits });

    var taskHits = searchTasks(q);
    if (taskHits.length) sections.push({ label: 'المهام', items: taskHits });

    var lawHits = searchLawyers(q);
    if (lawHits.length) sections.push({ label: 'المحامون', items: lawHits });

    sections.forEach(function(s) { s.items.forEach(function(i) { flatItems.push(i); }); });
    renderSections(sections, q);
  }

  /* ── render ── */
  function renderSections(sections, q) {
    activeIdx = -1;
    if (!sections.length) {
      resEl.innerHTML =
        '<div class="gs-empty"><div class="gs-empty-ico">😔</div>' +
        'لا توجد نتائج لـ "<strong>' + q + '</strong>"<br><span style="font-size:.7rem">جرّب كلمات أخرى أو ابحث برقم القضية</span></div>';
      return;
    }
    var h = '';
    var idx = 0;
    sections.forEach(function (s) {
      h += '<div class="gs-grp">' + s.label + '</div>';
      s.items.forEach(function (item) {
        var titleH = hilite(item.title, q);
        var subH   = hilite(item.sub, q);
        h += '<div class="gs-item" data-idx="' + idx + '" tabindex="-1">' +
               '<span class="gs-item-ico">' + item.icon + '</span>' +
               '<div class="gs-item-body">' +
                 '<div class="gs-item-ttl">' + titleH + '</div>' +
                 (item.sub ? '<div class="gs-item-sub">' + subH + '</div>' : '') +
               '</div>' +
               '<span class="gs-item-bdg">' + item.badge + '</span>' +
             '</div>';
        idx++;
      });
    });
    resEl.innerHTML = h;

    /* attach click handlers */
    resEl.querySelectorAll('.gs-item').forEach(function (el) {
      var i = parseInt(el.getAttribute('data-idx'), 10);
      el.addEventListener('click', function () { navigate(i); });
      el.addEventListener('mouseover', function () { setActive(i, false); });
    });
  }

  function setActive(idx, scroll) {
    var items = resEl.querySelectorAll('.gs-item');
    items.forEach(function (el) { el.classList.remove('gs-active'); });
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('gs-active');
      if (scroll !== false) items[idx].scrollIntoView({ block: 'nearest' });
    }
    activeIdx = (idx >= 0 && idx < items.length) ? idx : -1;
  }

  function navigate(idx) {
    var item = flatItems[idx];
    if (item && item.href) window.location.href = item.href;
    close();
  }

  /* ── open / close ── */
  function open() {
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      inp.focus();
      if (inp.value) inp.select();
      /* show quick nav when nothing typed */
      if (!inp.value.trim()) runSearch('');
    });
  }
  function close() {
    ov.classList.remove('open');
    document.body.style.overflow = '';
    /* do NOT clear input — user may reopen */
    activeIdx = -1;
  }

  /* ── keyboard ── */
  inp.addEventListener('keydown', function (e) {
    var items = resEl.querySelectorAll('.gs-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0) navigate(activeIdx);
      else if (flatItems.length === 1) navigate(0);
    }
  });

  inp.addEventListener('input', function () {
    clearTimeout(debTimer);
    var q = this.value;
    debTimer = setTimeout(function () { runSearch(q); }, 130);
  });

  /* ── global shortcuts ── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (ov.classList.contains('open')) close();
      else open();
    }
    if (e.key === 'Escape' && ov.classList.contains('open')) {
      e.stopPropagation();
      close();
    }
  });

  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  escBtn.addEventListener('click', close);

  /* ── expose for topbar search triggers ── */
  window.openGlobalSearch = open;

  /* ── hook topbar search boxes if present ── */
  document.addEventListener('DOMContentLoaded', function () {
    var bars = document.querySelectorAll('.topbar-search');
    bars.forEach(function (b) {
      b.style.cursor = 'pointer';
      b.addEventListener('click', open);
    });
  });
})();
