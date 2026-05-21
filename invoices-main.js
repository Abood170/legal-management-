  /* ── Dark mode: apply saved theme immediately ── */
  (function(){try{var t=localStorage.getItem('theme_pref');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();
  /* ── Filters ── */
  (function() {
    var countEl = document.getElementById('iCount');
    var search  = document.getElementById('iSearch');
    var status  = document.getElementById('iStatus');
    var lawyer  = document.getElementById('iLawyer');
    var month   = document.getElementById('iMonth');
    var noRes   = document.getElementById('iNoResults');

    function filter() {
      var rows = document.querySelectorAll('#invoicesBody tr[data-search]');
      var q = search.value.trim().toLowerCase();
      var st = status.value, lw = lawyer.value, mo = month.value;
      var visible = 0;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var show = (!q  || r.getAttribute('data-search').toLowerCase().indexOf(q) !== -1)
                && (!st || r.getAttribute('data-status') === st)
                && (!lw || r.getAttribute('data-lawyer') === lw)
                && (!mo || r.getAttribute('data-month')  === mo);
        r.style.display = show ? '' : 'none';
        if (show) visible++;
      }
      noRes.style.display = visible === 0 ? '' : 'none';
      countEl.textContent = visible + ' فاتورة';
    }

    search.addEventListener('input',  filter);
    status.addEventListener('change', filter);
    lawyer.addEventListener('change', filter);
    month.addEventListener('change',  filter);
    document.getElementById('iReset').addEventListener('click', function() {
      search.value = ''; status.value = ''; lawyer.value = ''; month.value = '';
      filter();
    });
    filter();
  })();

  /* ── Utilities ── */
  function fmtNum(n) {
    var x = parseFloat((+n).toFixed(2));
    return x.toLocaleString('en-US');
  }
  function genUUID() {
    var c = '0123456789abcdef', r = '';
    for (var i = 0; i < 8; i++) r += c[Math.floor(Math.random() * 16)];
    return r;
  }
  function genFakeHash(seed) {
    var c = '0123456789abcdef', h = 5381, r = '';
    for (var i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0;
    for (var i = 0; i < 64; i++) { h = ((h * 1664525) + 1013904223) >>> 0; r += c[h % 16]; }
    return r;
  }
  function genQRSvg(seed) {
    var cs = 7, n = 21, W = n * cs;
    var h = 5381;
    for (var i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0;
    function next() { h = ((h * 1664525) + 1013904223) >>> 0; return h / 4294967295; }
    var grid = [], fixed = {};
    for (var i = 0; i < n * n; i++) grid[i] = 0;
    function finder(r0, c0) {
      for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
        var b = r===0||r===6||c===0||c===6, k = r>=2&&r<=4&&c>=2&&c<=4;
        var idx = (r0+r)*n+(c0+c);
        grid[idx] = (b||k) ? 1 : 0; fixed[idx] = 1;
      }
    }
    finder(0,0); finder(0,14); finder(14,0);
    for (var i = 0; i < n*n; i++) if (!fixed[i]) grid[i] = next() > 0.45 ? 1 : 0;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+W+'" viewBox="0 0 '+W+' '+W+'" style="display:block;border-radius:4px">';
    svg += '<rect width="'+W+'" height="'+W+'" fill="#fff"/>';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++)
      if (grid[r*n+c]) svg += '<rect x="'+(c*cs)+'" y="'+(r*cs)+'" width="'+cs+'" height="'+cs+'" fill="#0F1419"/>';
    return svg + '</svg>';
  }
  function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = '✓ ' + msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  }

  /* ── ZATCA TLV Encoder (Phase 2 compliant base64) ── */
  function buildZatcaTlv(sellerName, vatNum, timestamp, totalAmount, vatAmount) {
    function field(tag, val) {
      var s = unescape(encodeURIComponent(String(val)));
      return String.fromCharCode(tag, s.length) + s;
    }
    var tlv = field(1,sellerName) + field(2,vatNum) + field(3,timestamp) +
              field(4,(+totalAmount).toFixed(2)) + field(5,(+vatAmount).toFixed(2));
    try { return btoa(tlv); } catch(e) { return btoa(unescape(encodeURIComponent(tlv))); }
  }

  var _invData = null;

  function printInvoice() {
    if (!_invData) { showToast('افتح الفاتورة أولاً'); return; }
    var d = _invData;
    var win = window.open('', '_blank');
    if (!win) { showToast('الرجاء السماح بفتح النوافذ المنبثقة'); return; }
    var sc = { paid:{bg:'#f0fdf4',col:'#16a34a',bd:'#bbf7d0'}, pending:{bg:'#fffbeb',col:'#B8952A',bd:'#fde68a'}, overdue:{bg:'#fef2f2',col:'#DC2626',bd:'#fecaca'} }[d.statusCls] || {bg:'#fffbeb',col:'#B8952A',bd:'#fde68a'};
    var html = [
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">',
      '<title>فاتورة ' + d.invNum + '</title>',
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">',
      '<style>',
      '*{box-sizing:border-box;margin:0;padding:0}',
      'body{font-family:"Cairo",sans-serif;background:#f4f4f4;color:#0F1419;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '@page{size:A4;margin:0}',
      '@media print{body{background:#fff}.no-print{display:none!important}body{font-size:0.85rem}}',
      '.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff}',
      '.hdr{background:#0F1419;color:#fff;padding:2rem 2.5rem 1.5rem;display:flex;justify-content:space-between;align-items:flex-start}',
      '.firm-name{font-family:"Playfair Display",serif;font-size:1.4rem;font-weight:700;margin-bottom:0.2rem}',
      '.firm-sub{font-size:0.7rem;color:rgba(255,255,255,0.6);margin-bottom:0.6rem}',
      '.badges{display:flex;gap:0.4rem;flex-wrap:wrap}',
      '.badge{font-size:0.55rem;font-weight:700;padding:2px 8px;border-radius:2rem;letter-spacing:0.3px}',
      '.bg{background:rgba(184,149,42,0.25);color:#F0C040;border:1px solid rgba(184,149,42,0.3)}',
      '.bg2{background:rgba(110,231,183,0.12);color:#6EE7B7;border:1px solid rgba(110,231,183,0.25)}',
      '.inv-block{text-align:left;min-width:180px}',
      '.inv-lbl{font-size:0.56rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px}',
      '.inv-val{font-size:1.2rem;font-weight:900;font-family:monospace;letter-spacing:1px;margin-bottom:0.4rem}',
      '.stbadge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;background:'+sc.bg+';color:'+sc.col+';border:1px solid '+sc.bd+'}',
      '.metabar{display:flex;gap:0;border-bottom:2px solid #e2e8f0;background:#f8f9fa}',
      '.mi{padding:0.7rem 1.3rem;border-left:1px solid #e2e8f0;flex:1}.mi:first-child{border-left:none}',
      '.ml{font-size:0.54rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px}',
      '.mv{font-size:0.72rem;font-weight:600;color:#0F1419;font-family:monospace}',
      '.body{padding:1.8rem 2.5rem}',
      '.st{font-size:0.58rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.55rem;padding-bottom:0.3rem;border-bottom:1px solid #e2e8f0}',
      '.parties{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}',
      '.party{background:#f8f9fa;border:1px solid #e2e8f0;border-radius:8px;padding:0.85rem 1rem}',
      '.pr{font-size:0.54rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.3rem}',
      '.pn{font-size:0.9rem;font-weight:700;color:#0F1419;margin-bottom:0.2rem}',
      '.pd{font-size:0.66rem;color:#64748B;line-height:1.7}',
      '.svct{width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:0.73rem}',
      '.svct th{text-align:right;padding:0.45rem 0.7rem;background:#f8f9fa;border:1px solid #e2e8f0;font-size:0.58rem;font-weight:700;color:#64748B}',
      '.svct td{padding:0.55rem 0.7rem;border:1px solid #e2e8f0;color:#2D3748}',
      '.tw{display:flex;justify-content:flex-end;margin-bottom:1.3rem}',
      '.totals{min-width:250px}',
      '.tr2{display:flex;justify-content:space-between;font-size:0.72rem;padding:0.18rem 0;color:#2D3748}',
      '.tr2.grand{border-top:2px solid #0F1419;padding-top:0.45rem;margin-top:0.2rem;font-size:0.95rem;font-weight:900;color:#0F1419}',
      '.bsec{display:flex;gap:1.2rem;align-items:flex-start}',
      '.qrw{display:flex;flex-direction:column;align-items:center;gap:0.4rem;padding:0.8rem;background:#f8f9fa;border:1px solid #e2e8f0;border-radius:8px}',
      '.qrc{font-size:0.56rem;color:#94A3B8;text-align:center;margin-top:2px}',
      '.techb{flex:1;background:rgba(15,20,25,0.03);border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem 1rem}',
      '.trow{display:flex;gap:0.5rem;font-size:0.58rem;margin-bottom:0.18rem;align-items:flex-start}',
      '.tl{color:#94A3B8;flex-shrink:0;min-width:110px}',
      '.tv{color:#64748B;font-family:monospace;word-break:break-all}',
      '.tlvval{font-size:0.48rem;color:#94A3B8;word-break:break-all;margin-top:0.25rem;font-family:monospace;line-height:1.5;background:#f8f9fa;padding:0.3rem 0.4rem;border-radius:4px;border:1px solid #e2e8f0}',
      '.foot{margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e2e8f0;text-align:center;font-size:0.58rem;color:#94A3B8;line-height:1.9}',
      '.print-topbar{background:#1C5E3E;padding:0.6rem 1.5rem;display:flex;align-items:center;gap:1rem;justify-content:center}',
      '.print-btn{padding:0.5rem 1.8rem;background:#fff;color:#1C5E3E;border:none;border-radius:6px;font-family:"Cairo",sans-serif;font-size:0.85rem;font-weight:700;cursor:pointer}',
      '.print-btn:hover{background:#f0fdf4}',
      '.print-hint{color:rgba(255,255,255,0.75);font-family:"Cairo",sans-serif;font-size:0.72rem}',
      '</style></head><body>',
      '<div class="no-print print-topbar">',
        '<button class="print-btn" onclick="window.print()">🖨 طباعة / حفظ PDF</button>',
        '<span class="print-hint">للحفظ كـ PDF: اختر «حفظ كـ PDF» من قائمة الطابعة</span>',
      '</div>',
      '<div class="page">',
        '<div class="hdr">',
          '<div>',
            '<div class="firm-name">' + d.firmName + '</div>',
            '<div class="firm-sub">فاتورة ضريبية إلكترونية · مكتب محاماة</div>',
            '<div class="badges">',
              '<span class="badge bg">🔒 موقّعة رقمياً</span>',
              '<span class="badge bg2">✓ متوافقة مع ZATCA Phase 2</span>',
            '</div>',
          '</div>',
          '<div class="inv-block">',
            '<div class="inv-lbl">رقم الفاتورة</div>',
            '<div class="inv-val">' + d.invNum + '</div>',
            '<span class="stbadge">' + d.statusText + '</span>',
          '</div>',
        '</div>',
        '<div class="metabar">',
          '<div class="mi"><div class="ml">المعرّف الفريد</div><div class="mv">' + d.uuid + '</div></div>',
          '<div class="mi"><div class="ml">تاريخ الإصدار</div><div class="mv">' + d.issueDate + '</div></div>',
          '<div class="mi"><div class="ml">تاريخ الاستحقاق</div><div class="mv">' + d.dueDate + '</div></div>',
          '<div class="mi"><div class="ml">الرقم الضريبي</div><div class="mv">' + d.taxNum + '</div></div>',
        '</div>',
        '<div class="body">',
          '<div class="st" style="margin-bottom:0.55rem">أطراف العقد</div>',
          '<div class="parties">',
            '<div class="party"><div class="pr">المُصدِر</div><div class="pn">' + d.firmName + '</div><div class="pd">الرقم الضريبي: ' + d.taxNum + '<br>المدينة: ' + d.firmCity + '<br>الجوال: ' + d.firmPhone + '</div></div>',
            '<div class="party"><div class="pr">المُستلِم</div><div class="pn">' + d.client + '</div><div class="pd">نوع الموكل: فرد<br>القضية: ' + d.caseType + '<br>المرجع: ' + (d.caseId||'—') + '</div></div>',
          '</div>',
          '<div class="st">تفاصيل الخدمة</div>',
          '<table class="svct">',
            '<thead><tr><th>البيان</th><th>الكمية</th><th>سعر الوحدة (ر.س)</th><th>الإجمالي (ر.س)</th></tr></thead>',
            '<tbody><tr><td>' + d.service + '</td><td>1</td><td>' + fmtNum(d.base) + '</td><td>' + fmtNum(d.base) + '</td></tr></tbody>',
          '</table>',
          '<div class="tw"><div class="totals">',
            '<div class="tr2"><span>المجموع الفرعي</span><span>' + fmtNum(d.base) + ' ر.س</span></div>',
            '<div class="tr2"><span>ضريبة القيمة المضافة (15%)</span><span>' + fmtNum(d.vat) + ' ر.س</span></div>',
            '<div class="tr2 grand"><span>الإجمالي النهائي</span><span>' + fmtNum(d.total) + ' ر.س</span></div>',
          '</div></div>',
          '<div class="bsec">',
            '<div class="qrw">' + d.qrSvg + '<div class="qrc">امسح للتحقق<br>من الفاتورة</div></div>',
            '<div class="techb">',
              '<div class="st" style="margin-bottom:0.4rem">بيانات تقنية ZATCA</div>',
              '<div class="trow"><span class="tl">الرقم التسلسلي:</span><span class="tv">' + d.uuid + '</span></div>',
              '<div class="trow"><span class="tl">وقت الإصدار:</span><span class="tv">' + d.timestamp + '</span></div>',
              '<div class="trow"><span class="tl">توقيع رقمي:</span><span class="tv" style="font-size:0.5rem">' + d.fakeHash + '</span></div>',
              '<div class="trow" style="flex-direction:column;gap:2px"><span class="tl">QR — TLV Base64:</span><div class="tlvval">' + d.tlvBase64 + '</div></div>',
            '</div>',
          '</div>',
          '<div class="foot">',
            d.firmName + ' · ' + d.firmCity + ' · الجوال: ' + d.firmPhone + '<br>',
            'الرقم الضريبي: ' + d.taxNum + '<br>',
            'هذه الفاتورة مُنشأة إلكترونياً وموقّعة رقمياً وفق متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) — المرحلة الثانية',
          '</div>',
        '</div>',
      '</div>',
      '</body></html>'
    ].join('');
    win.document.write(html);
    win.document.close();
    showToast('جاري فتح نافذة الطباعة...');
  }

  /* ── KPI update ── */
  function updateInvoiceKPIs() {
    var paid = 0, pending = 0, overdue = 0, count = 0;
    document.querySelectorAll('#invoicesBody tr').forEach(function(tr) {
      if (tr.id === 'iNoResults') return;
      var pill = tr.querySelector('.pill'); if (!pill) return;
      var totalEl = tr.querySelector('.amount-total');
      var amount = totalEl ? parseFloat(totalEl.getAttribute('data-amount') || '0') : 0;
      count++;
      if (pill.classList.contains('pill-paid'))    paid    += amount;
      else if (pill.classList.contains('pill-overdue'))  overdue  += amount;
      else if (pill.classList.contains('pill-pending'))  pending  += amount;
    });
    function fmt(n) { return n > 0 ? fmtNum(n) + ' ر.س' : '٠ ر.س'; }
    var pEl = document.getElementById('kpiPaidVal');
    var dEl = document.getElementById('kpiPendingVal');
    var oEl = document.getElementById('kpiOverdueVal');
    if (pEl) pEl.textContent = fmt(paid);
    if (dEl) dEl.textContent = fmt(pending);
    if (oEl) oEl.textContent = fmt(overdue);
    var phSub = document.querySelector('.ph-sub');
    if (phSub) phSub.textContent = 'إجمالي ' + count + ' فاتورة';
  }

  /* ── Save / Load ── */
  function saveInvoices() {
    var rows = [];
    document.querySelectorAll('#invoicesBody tr').forEach(function(tr) {
      if (tr.id !== 'iNoResults' && !tr.querySelector('.no-results')) rows.push(tr.innerHTML);
    });
    localStorage.setItem('invoices_data', JSON.stringify(rows));
    if (typeof updateSidebarBadges === 'function') updateSidebarBadges();
  }
  function loadInvoices() {
    var saved = localStorage.getItem('invoices_data');
    if (!saved) { updateInvoiceKPIs(); return; }
    try {
      var rows = JSON.parse(saved);
      if (rows.length > 0) {
        var tbody = document.getElementById('invoicesBody');
        var noRes = document.getElementById('iNoResults');
        rows.forEach(function(html) {
          var tr = document.createElement('tr');
          tr.innerHTML = html;
          var pill = tr.querySelector('.pill');
          if (pill) {
            var st = pill.classList.contains('pill-paid') ? 'paid' : pill.classList.contains('pill-overdue') ? 'overdue' : 'pending';
            tr.setAttribute('data-status', st);
          }
          if (!tr.getAttribute('data-search')) {
            var nm = tr.querySelector('.case-name');
            tr.setAttribute('data-search', nm ? nm.textContent.trim() : '');
          }
          tr.querySelectorAll('.row-btn').forEach(function(b) {
            if (b.textContent.trim() === 'عرض') { b.textContent = 'عرض الفاتورة'; b.classList.add('view-invoice-btn'); }
          });
          tbody.appendChild(tr);
        });
        if (noRes) noRes.style.display = 'none';
      }
    } catch(e) {}
    updateInvoiceKPIs();
  }
  window.addEventListener('load', loadInvoices);

  /* ── Delete invoice ── */
  function deleteInvoice(btn) {
    var tr = btn.closest ? btn.closest('tr') : btn.parentNode.parentNode.parentNode;
    if (!tr) return;
    tr.style.transition = 'opacity 0.3s';
    tr.style.opacity = '0';
    setTimeout(function() {
      tr.remove();
      var rows = document.querySelectorAll('#invoicesBody tr[data-search]');
      if (rows.length === 0) document.getElementById('iNoResults').style.display = '';
      saveInvoices();
      updateInvoiceKPIs();
    }, 300);
  }

  /* ── Event delegation (view button) ── */
  document.getElementById('invoicesBody').addEventListener('click', function(e) {
    if (e.target.classList.contains('view-invoice-btn')) {
      var tr = e.target.closest ? e.target.closest('tr') : e.target.parentNode.parentNode.parentNode;
      if (tr) openInvoiceView(tr);
    }
  });

  /* ── Invoice View Modal ── */
  function openInvoiceView(tr) {
    var cells = tr.querySelectorAll('td');
    var nameEl   = cells[0].querySelector('.case-name');
    var invNum   = nameEl ? nameEl.textContent.trim() : '—';
    var uuidEl   = cells[0].querySelector('.case-id');
    var uuid     = uuidEl ? uuidEl.textContent.trim() : genUUID();
    var client   = cells[1].textContent.trim();
    var ctEl     = cells[2].querySelector('.case-name');
    var caseType = ctEl ? ctEl.textContent.trim() : '';
    var ciEl     = cells[2].querySelector('.case-id');
    var caseId   = ciEl ? ciEl.textContent.trim() : '';
    var baseEl   = cells[3].querySelector('.amount-cell');
    var base     = baseEl ? parseFloat(baseEl.getAttribute('data-amount') || '0') : 0;
    var svcEl    = cells[3].querySelector('.amount-vat');
    var service  = svcEl ? svcEl.textContent.trim() : 'أتعاب محاماة';
    var vat      = parseFloat(cells[4].getAttribute('data-amount') || (base * 0.15).toFixed(2));
    var totEl    = cells[5].querySelector('.amount-total');
    var total    = totEl ? parseFloat(totEl.getAttribute('data-amount') || '0') : (base + vat);
    var issueDateEl = cells[6].querySelector('.date-cell');
    var issueDate   = issueDateEl ? issueDateEl.textContent.trim() : '—';
    var dueDateEl   = cells[7].querySelector('.date-cell');
    var dueDate     = dueDateEl ? dueDateEl.textContent.trim() : '—';
    var statusPill  = cells[8].querySelector('.pill');
    var statusText  = statusPill ? statusPill.textContent.trim() : 'معلقة';
    var statusCls   = statusPill
      ? (statusPill.className.indexOf('paid') !== -1 ? 'paid'
        : statusPill.className.indexOf('overdue') !== -1 ? 'overdue' : 'pending')
      : 'pending';

    var firmData = null;
    try { firmData = JSON.parse(localStorage.getItem('firm_data') || 'null'); } catch(e) {}
    var firmName  = (firmData && firmData.firmName) ? firmData.firmName : 'نظام إدارة المحاماة';
    var firmCity  = (firmData && firmData.city)     ? firmData.city     : 'الرياض';
    var firmPhone = (firmData && firmData.phone)    ? firmData.phone    : '05XXXXXXXX';
    var taxNum    = '3XXXXXXXXXXXXX3';

    var timestamp = new Date().toISOString();
    var fakeHash  = genFakeHash(invNum + uuid);
    var tlvBase64 = buildZatcaTlv(firmName, taxNum, timestamp, total, vat);
    var qrSvg     = genQRSvg(tlvBase64);
    _invData = { invNum:invNum, uuid:uuid, client:client, caseType:caseType, caseId:caseId,
                 base:base, service:service, vat:vat, total:total,
                 issueDate:issueDate, dueDate:dueDate, statusText:statusText, statusCls:statusCls,
                 firmName:firmName, firmCity:firmCity, firmPhone:firmPhone, taxNum:taxNum,
                 timestamp:timestamp, fakeHash:fakeHash, tlvBase64:tlvBase64, qrSvg:qrSvg };

    document.getElementById('invViewContent').innerHTML = [
      '<div class="inv-head-banner">',
        '<div class="inv-firm-name">' + firmName + '</div>',
        '<div class="inv-type-lbl">فاتورة ضريبية إلكترونية</div>',
        '<div class="inv-hdg-badges">',
          '<span class="inv-badge inv-badge-gold">🔒 موقّعة رقمياً</span>',
          '<span class="inv-badge inv-badge-green">✓ متوافقة مع معايير ZATCA Phase 2</span>',
        '</div>',
      '</div>',
      '<div class="inv-meta-strip">',
        '<div class="inv-meta-item"><div class="inv-meta-lbl">رقم الفاتورة</div><div class="inv-meta-val">' + invNum + '</div></div>',
        '<div class="inv-meta-item"><div class="inv-meta-lbl">المعرّف الفريد</div><div class="inv-meta-val">' + uuid + '</div></div>',
        '<div class="inv-meta-item"><div class="inv-meta-lbl">تاريخ الإصدار</div><div class="inv-meta-val">' + issueDate + '</div></div>',
        '<div class="inv-meta-item"><div class="inv-meta-lbl">تاريخ الاستحقاق</div><div class="inv-meta-val">' + dueDate + '</div></div>',
        '<div class="inv-meta-item"><div class="inv-meta-lbl">الحالة</div><div class="inv-meta-val"><span class="pill pill-' + statusCls + '">' + statusText + '</span></div></div>',
      '</div>',
      '<div class="inv-body">',
        '<div>',
          '<div class="inv-section-title">أطراف العقد</div>',
          '<div class="inv-parties">',
            '<div class="inv-party">',
              '<div class="inv-party-role">المُصدِر</div>',
              '<div class="inv-party-name">' + firmName + '</div>',
              '<div class="inv-party-detail">الرقم الضريبي: ' + taxNum + '<br>المدينة: ' + firmCity + '<br>الجوال: ' + firmPhone + '</div>',
            '</div>',
            '<div class="inv-party">',
              '<div class="inv-party-role">المُستلِم</div>',
              '<div class="inv-party-name">' + client + '</div>',
              '<div class="inv-party-detail">نوع الموكل: فرد<br>القضية: ' + caseType + '<br>المرجع: ' + (caseId || '—') + '</div>',
            '</div>',
          '</div>',
        '</div>',
        '<div>',
          '<div class="inv-section-title">تفاصيل الخدمة</div>',
          '<table class="inv-svc-table">',
            '<thead><tr><th>البيان</th><th>الكمية</th><th>سعر الوحدة (ر.س)</th><th>الإجمالي (ر.س)</th></tr></thead>',
            '<tbody><tr><td>' + service + '</td><td>1</td><td>' + fmtNum(base) + '</td><td>' + fmtNum(base) + '</td></tr></tbody>',
          '</table>',
          '<div style="display:flex;justify-content:flex-end;margin-top:0.8rem">',
            '<div class="inv-totals">',
              '<div class="inv-total-row"><span>المجموع الفرعي</span><span>' + fmtNum(base) + ' ر.س</span></div>',
              '<div class="inv-total-row"><span>ضريبة القيمة المضافة (15%)</span><span>' + fmtNum(vat) + ' ر.س</span></div>',
              '<div class="inv-total-row grand"><span>الإجمالي النهائي</span><span>' + fmtNum(total) + ' ر.س</span></div>',
            '</div>',
          '</div>',
        '</div>',
        '<div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap">',
          '<div class="inv-qr-wrap">' + qrSvg + '<div class="inv-qr-caption">امسح للتحقق من الفاتورة</div></div>',
          '<div class="inv-tech">',
            '<div class="inv-section-title">بيانات تقنية</div>',
            '<div class="inv-tech-row"><span class="inv-tech-lbl">الرقم التسلسلي:</span><span class="inv-tech-val">' + uuid + '</span></div>',
            '<div class="inv-tech-row"><span class="inv-tech-lbl">تاريخ الإصدار:</span><span class="inv-tech-val">' + timestamp + '</span></div>',
            '<div class="inv-tech-row"><span class="inv-tech-lbl">توقيع رقمي:</span><span class="inv-tech-val" style="font-size:0.55rem">' + fakeHash + '</span></div>',
            '<div class="inv-tech-row" style="flex-direction:column;gap:3px;margin-top:0.25rem"><span class="inv-tech-lbl">QR — TLV Base64:</span><span class="inv-tech-val" style="font-size:0.5rem;background:var(--off-white);padding:3px 5px;border-radius:4px;border:1px solid var(--border);display:block;line-height:1.5">' + tlvBase64 + '</span></div>',
            '<div class="inv-tech-row" style="margin-top:0.5rem"><span style="color:var(--accent);font-size:0.6rem;line-height:1.5">✓ تنسيق متوافق مع الفوترة الإلكترونية — جاهز للإرسال عبر Fatoora في النسخة الإنتاجية</span></div>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');

    var _vm = document.getElementById('invViewModal');
    _vm.classList.add('open');
    _vm.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeViewModal() {
    document.getElementById('invViewModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('invViewClose').addEventListener('click', closeViewModal);
  document.getElementById('invViewModal').addEventListener('click', function(e) { if (e.target === this) closeViewModal(); });

  /* ── New Invoice Modal ── */
  (function() {
    var overlay = document.getElementById('iModal');

    function dateFmt(d) {
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }
    function arabicDate(val) {
      var d = new Date(val + 'T00:00:00');
      var m = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
    }
    function setDefaults() {
      var today = new Date(), due = new Date(today);
      due.setDate(due.getDate() + 30);
      document.getElementById('ifIssueDate').value = dateFmt(today);
      document.getElementById('ifDueDate').value   = dateFmt(due);
    }

    document.getElementById('ifAmount').addEventListener('input', function() {
      var base = parseFloat(this.value) || 0;
      var vat  = Math.round(base * 15) / 100;
      var tot  = parseFloat((base + vat).toFixed(2));
      document.getElementById('pvBase').textContent  = base ? fmtNum(base) + ' ر.س' : '— ر.س';
      document.getElementById('pvVat').textContent   = base ? fmtNum(vat)  + ' ر.س' : '— ر.س';
      document.getElementById('pvTotal').textContent = base ? fmtNum(tot)  + ' ر.س' : '— ر.س';
    });

    function openModal() { setDefaults(); overlay.classList.add('open'); overlay.scrollTop = 0; document.body.style.overflow = 'hidden'; }
    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      ['ifClient','ifService','ifNotes'].forEach(function(id) { document.getElementById(id).value = ''; });
      document.getElementById('ifClient').style.borderColor = '';
      document.getElementById('ifAmount').value = '';
      document.getElementById('ifAmount').style.borderColor = '';
      document.getElementById('ifStatus').value = 'pending';
      document.getElementById('ifCase').selectedIndex = 0;
      document.getElementById('pvBase').textContent  = '— ر.س';
      document.getElementById('pvVat').textContent   = '— ر.س';
      document.getElementById('pvTotal').textContent = '— ر.س';
    }

    document.getElementById('btnNewInvoice').addEventListener('click',  openModal);
    document.getElementById('btnNewInvoice2').addEventListener('click', openModal);
    document.getElementById('iModalClose').addEventListener('click',  closeModal);
    document.getElementById('iModalCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('invViewModal').classList.contains('open')) closeViewModal();
        else if (overlay.classList.contains('open')) closeModal();
      }
    });

    var invCounter = parseInt(localStorage.getItem('inv_counter') || '1', 10);

    document.getElementById('iFormSubmit').addEventListener('click', function() {
      var clientSel = document.getElementById('ifClient');
      var amountEl  = document.getElementById('ifAmount');
      var valid = true;
      if (!clientSel.value) { clientSel.style.borderColor = 'var(--red)'; valid = false; } else { clientSel.style.borderColor = ''; }
      if (!amountEl.value || parseFloat(amountEl.value) <= 0) { amountEl.style.borderColor = 'var(--red)'; valid = false; } else { amountEl.style.borderColor = ''; }
      if (!valid) return;

      var btn = this;
      btn.disabled = true;
      btn.innerHTML = 'جاري الحفظ <span class="loading-dots">...</span>';
      btn.classList.add('btn-loading');

      var client    = clientSel.value;
      var caseSel   = document.getElementById('ifCase');
      var caseId    = caseSel.options[caseSel.selectedIndex].getAttribute('data-id') || '';
      var caseType  = caseSel.options[caseSel.selectedIndex].value || 'قضية';
      var service   = document.getElementById('ifService').value.trim() || 'أتعاب محاماة';
      var base      = parseFloat(amountEl.value);
      var vat       = Math.round(base * 15) / 100;
      var total     = parseFloat((base + vat).toFixed(2));
      var statusVal = document.getElementById('ifStatus').value;
      var statusLabels = { paid: 'مدفوعة', pending: 'معلقة', overdue: 'متأخرة' };
      var statusLabel  = statusLabels[statusVal] || 'معلقة';
      var issueVal  = document.getElementById('ifIssueDate').value;
      var dueVal    = document.getElementById('ifDueDate').value;
      var uuid      = genUUID();
      var year      = new Date().getFullYear();
      var invNum    = 'INV-' + year + '-' + String(invCounter).padStart(4, '0');
      invCounter++;
      localStorage.setItem('inv_counter', String(invCounter));
      var months     = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      var issueMonth = issueVal ? months[new Date(issueVal+'T00:00:00').getMonth()] : months[new Date().getMonth()];
      var issueFmt   = issueVal ? arabicDate(issueVal) : arabicDate(dateFmt(new Date()));
      var dueFmt     = dueVal   ? arabicDate(dueVal)   : arabicDate(dateFmt(new Date(Date.now()+30*86400000)));

      setTimeout(function() {
        var tbody = document.getElementById('invoicesBody');
        var tr = document.createElement('tr');
        tr.setAttribute('data-search', client + ' ' + invNum);
        tr.setAttribute('data-status', statusVal);
        tr.setAttribute('data-lawyer', 'khalid');
        tr.setAttribute('data-month',  issueMonth);
        tr.innerHTML =
          '<td><div class="case-name">' + invNum + '</div><div class="case-id">' + uuid + '</div></td>' +
          '<td>' + client + '</td>' +
          '<td><div class="case-name" style="font-size:0.75rem">' + caseType + '</div><div class="case-id">' + caseId + '</div></td>' +
          '<td><div class="amount-cell" data-amount="' + base + '">' + fmtNum(base) + '</div><div class="amount-vat">' + service + '</div></td>' +
          '<td class="amount-cell" data-amount="' + vat + '">' + fmtNum(vat) + '</td>' +
          '<td><div class="amount-total" data-amount="' + total + '">' + fmtNum(total) + ' ر.س</div></td>' +
          '<td><div class="date-cell">' + issueFmt + '</div></td>' +
          '<td><div class="date-cell">' + dueFmt + '</div></td>' +
          '<td><span class="pill pill-' + statusVal + '">' + statusLabel + '</span></td>' +
          '<td><div class="action-pair"><button class="row-btn view-invoice-btn">عرض الفاتورة</button><button class="row-btn" style="color:var(--red)" onclick="deleteInvoice(this)">حذف</button></div></td>';

        document.getElementById('iNoResults').style.display = 'none';
        tbody.insertBefore(tr, tbody.firstChild);
        saveInvoices();
        updateInvoiceKPIs();

        btn.disabled = false;
        btn.innerHTML = 'إصدار الفاتورة';
        btn.classList.remove('btn-loading');
        closeModal();
        showToast('تم إصدار الفاتورة ' + invNum + ' بنجاح');
      }, 800);
    });
  })();
