(function () {
  'use strict';

  var DAYS_AR   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  var MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  function addDays(n) {
    var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + n); return d;
  }

  function arabicDate(d) {
    return DAYS_AR[d.getDay()] + '، ' + d.getDate() + ' ' + MONTHS_AR[d.getMonth()];
  }

  function shortDate(d) {
    return d.getDate() + ' ' + MONTHS_AR[d.getMonth()] + ' ' + d.getFullYear();
  }

  function arabicTime(h, m) {
    var s = h < 12 ? 'ص' : 'م';
    var hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return hh + ':' + (m < 10 ? '0' + m : m) + ' ' + s;
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('');
  }

  function fmtNum(n) {
    return Number(parseFloat(n).toFixed(2)).toLocaleString('en-US');
  }

  /* ── Row / card builders ────────────────────────────────────────── */

  function makeCaseRow(id, type, client, courtLabel, city, lawyerName, regDate) {
    var caseId  = '#' + id;
    var av      = initials(lawyerName);
    return '<td><div class="case-name">قضية ' + type + '</div><div class="case-id">' + caseId + '</div></td>' +
      '<td>' + client + '</td>' +
      '<td>' + type + '</td>' +
      '<td><div>' + courtLabel + '</div><div class="case-id">' + city + '</div></td>' +
      '<td><div class="lawyer-chip"><div class="lawyer-av">' + av + '</div>' + lawyerName + '</div></td>' +
      '<td><div class="date-cell">' + regDate + '</div></td>' +
      '<td><span class="pill pill-active">نشطة</span></td>' +
      '<td><div class="row-actions">' +
        '<button class="row-btn view-case-btn">عرض</button>' +
        '<button class="btn-portal" onclick="openClientPortal(\'' + caseId + '\')">بوابة الموكل</button>' +
        '<button class="row-btn" style="color:#DC2626;border-color:rgba(220,38,38,0.2);background:rgba(220,38,38,0.04)" onclick="deleteCase(this)">حذف</button>' +
      '</div></td>';
  }

  function makeSessionRow(date, h, m, caseName, caseId, court, hall, lawyerName) {
    var av = initials(lawyerName);
    return '<td><div class="date-cell">' + arabicDate(date) + '</div></td>' +
      '<td><div class="time-cell">' + arabicTime(h, m) + '</div></td>' +
      '<td><div class="case-name">' + caseName + '</div><div class="case-id">#' + caseId + '</div></td>' +
      '<td>' + court + '</td>' +
      '<td>' + hall + '</td>' +
      '<td><div class="lawyer-chip"><div class="lawyer-av">' + av + '</div>' + lawyerName + '</div></td>' +
      '<td><span class="pill pill-upcoming">قادمة</span></td>' +
      '<td><div class="row-actions">' +
        '<button class="row-btn view-session-btn">تفاصيل</button>' +
        '<button class="row-btn" style="color:#DC2626;border-color:rgba(220,38,38,0.2);background:rgba(220,38,38,0.04)" onclick="deleteSession(this)">حذف</button>' +
      '</div></td>';
  }

  function makeClientRow(name, id, typeKey, typeLabel, phone, email, dateStr, idx) {
    var typeCls = typeKey === 'company' ? 'type-company' : 'type-individual';
    return '<td><div class="client-name-cell">' + name + '</div><div class="client-id-cell">' + id + '</div></td>' +
      '<td><span class="type-badge ' + typeCls + '">' + typeLabel + '</span></td>' +
      '<td><div class="phone-cell">' + phone + '</div></td>' +
      '<td><div class="email-cell">' + email + '</div></td>' +
      '<td><span class="cases-count no-cases">0</span></td>' +
      '<td><span style="font-size:0.75rem;color:var(--ink-light)">' + dateStr + '</span></td>' +
      '<td><span class="pill pill-active">نشط</span></td>' +
      '<td><button class="row-btn" onclick="openPanel(' + idx + ')">عرض</button></td>';
  }

  function makeLawyerCard(idx, name, title, spec, phone, email, cases, winRate, fees, workPct) {
    var av       = initials(name);
    var wlClass  = workPct >= 70 ? 'wl-high' : (workPct >= 40 ? 'wl-mid' : 'wl-low');
    var inner =
      '<button class="delete-lawyer-btn" onclick="deleteLawyer(this)" title="حذف المحامي">✕</button>' +
      '<div class="lc-top">' +
        '<div class="lc-avatar">' + av + '</div>' +
        '<div class="lc-info">' +
          '<div class="lc-name">' + name + '</div>' +
          '<div class="lc-title">' + title + '</div>' +
          '<div class="lc-spec">⚖️ ' + spec + '</div>' +
        '</div>' +
        '<div class="lc-status"><span class="pill-active">نشط</span></div>' +
      '</div>' +
      '<div class="lc-stats">' +
        '<div class="lc-stat"><div class="lc-stat-val green">' + cases + '</div><div class="lc-stat-lbl">قضية نشطة</div></div>' +
        '<div class="lc-stat"><div class="lc-stat-val">' + winRate + '</div><div class="lc-stat-lbl">نسبة الفوز</div></div>' +
        '<div class="lc-stat"><div class="lc-stat-val gold">' + fees + '</div><div class="lc-stat-lbl">أتعاب ر.س</div></div>' +
      '</div>' +
      '<div class="lc-workload">' +
        '<div class="lc-wl-top"><span class="lc-wl-label">عبء العمل</span><span class="lc-wl-pct">' + workPct + '%</span></div>' +
        '<div class="lc-wl-track"><div class="lc-wl-fill ' + wlClass + '" style="width:' + workPct + '%"></div></div>' +
      '</div>' +
      '<div class="lc-contact">' +
        '<div class="lc-contact-row"><span class="lc-contact-icon">📞</span>' + phone + '</div>' +
        '<div class="lc-contact-row"><span class="lc-contact-icon">✉️</span>' + email + '</div>' +
      '</div>' +
      '<div class="lc-actions">' +
        '<button class="btn-view">عرض الملف</button>' +
        '<button class="btn-assign">تعيين قضية</button>' +
      '</div>';
    return '<div class="lawyer-card" data-idx="' + idx + '">' + inner + '</div>';
  }

  function makeInvoiceRow(invNum, uuid, client, caseType, caseRef, base, service, status, issueDate, dueDate) {
    var vat   = parseFloat((base * 0.15).toFixed(2));
    var total = parseFloat((base + vat).toFixed(2));
    var labels = { paid: 'مدفوعة', pending: 'معلقة', overdue: 'متأخرة' };
    return '<td><div class="case-name">' + invNum + '</div><div class="case-id">' + uuid + '</div></td>' +
      '<td>' + client + '</td>' +
      '<td><div class="case-name">' + caseType + '</div><div class="case-id">' + caseRef + '</div></td>' +
      '<td><div class="amount-cell" data-amount="' + base + '">' + fmtNum(base) + '</div><div class="amount-vat">' + service + '</div></td>' +
      '<td class="amount-cell" data-amount="' + vat + '">' + fmtNum(vat) + ' ر.س</td>' +
      '<td><div class="amount-total" data-amount="' + total + '">' + fmtNum(total) + ' ر.س</div></td>' +
      '<td><div class="date-cell">' + issueDate + '</div></td>' +
      '<td><div class="date-cell">' + dueDate + '</div></td>' +
      '<td><span class="pill pill-' + status + '">' + (labels[status] || 'معلقة') + '</span></td>' +
      '<td><div class="action-pair">' +
        '<button class="row-btn view-invoice-btn">عرض الفاتورة</button>' +
        '<button class="row-btn" style="color:#DC2626;border-color:rgba(220,38,38,0.2);background:rgba(220,38,38,0.04)" onclick="deleteInvoice(this)">حذف</button>' +
      '</div></td>';
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  function hasSeedData() {
    return !!(localStorage.getItem('cases_data') && localStorage.getItem('lawyers_data'));
  }

  function resetDemoData() {
    localStorage.clear();
    sessionStorage.clear();
    var t = document.getElementById('toast');
    if (t) { t.textContent = '✓ تم مسح جميع البيانات'; t.classList.add('show'); }
    setTimeout(function () { location.reload(); }, 1000);
  }

  function seedDemoData() {
    /* firm_data */
    localStorage.setItem('firm_data', JSON.stringify({
      firmName:   'مكتب نموذجي للمحاماة',
      ownerName:  'محمد العتيبي',
      email:      'contact@firm.sa',
      phone:      '0501234567',
      city:       'الرياض',
      officeType: 'مكتب محاماة',
      lawyerCount:'4',
      createdAt:  new Date().toISOString()
    }));

    /* lawyers_data — outerHTML of .lawyer-card elements */
    localStorage.setItem('lawyers_data', JSON.stringify([
      makeLawyerCard(0, 'خالد العتيبي',    'شريك أول',    'قانون تجاري', '0501111111', 'k.otaibi@firm.sa',    '48', '85%', '45,000', 85),
      makeLawyerCard(1, 'سارة القحطاني',   'محامية أول',  'قانون عمالي', '0502222222', 's.qahtani@firm.sa',   '31', '72%', '28,000', 62),
      makeLawyerCard(2, 'محمد الزهراني',   'محامي',       'قانون عقاري', '0503333333', 'm.zahrani@firm.sa',   '19', '68%', '18,500', 38),
      makeLawyerCard(3, 'نورة الشمري',     'محامية',      'قانون إداري', '0504444444', 'n.shammari@firm.sa',  '12', '60%', '12,000', 24)
    ]));

    /* clients_data */
    var regDate = shortDate(new Date());
    localStorage.setItem('clients_data', JSON.stringify([
      makeClientRow('عبدالرحمن المالكي',         'CLT-001', 'individual', 'فرد',   '0505111111', 'a.maliki@email.com', regDate, 0),
      makeClientRow('سلطان الغامدي',             'CLT-002', 'individual', 'فرد',   '0505222222', 's.ghamdi@email.com', regDate, 1),
      makeClientRow('شركة الفارس للتجارة',       'CLT-003', 'company',    'شركة',  '0112233445', 'info@alfares.sa',    regDate, 2),
      makeClientRow('فيصل الشهري',               'CLT-004', 'individual', 'فرد',   '0505333333', 'f.shahri@email.com', regDate, 3),
      makeClientRow('مجموعة النور الاستثمارية',  'CLT-005', 'company',    'شركة',  '0116677889', 'ceo@alnour.sa',      regDate, 4)
    ]));

    /* cases_data */
    localStorage.setItem('cases_data', JSON.stringify([
      makeCaseRow('2026-0001', 'تجارية',  'عبدالرحمن المالكي',        'محكمة التجارة',    'الرياض', 'خالد العتيبي',  shortDate(addDays(-30))),
      makeCaseRow('2026-0002', 'عمالية',  'سلطان الغامدي',            'المحكمة العمالية', 'الرياض', 'سارة القحطاني', shortDate(addDays(-25))),
      makeCaseRow('2026-0003', 'عقارية',  'شركة الفارس للتجارة',      'محكمة الاستئناف',  'جدة',    'محمد الزهراني', shortDate(addDays(-20))),
      makeCaseRow('2026-0004', 'إدارية',  'فيصل الشهري',              'المحكمة الإدارية', 'الرياض', 'نورة الشمري',   shortDate(addDays(-15))),
      makeCaseRow('2026-0005', 'تجارية',  'مجموعة النور الاستثمارية', 'محكمة التجارة',    'الرياض', 'خالد العتيبي',  shortDate(addDays(-10)))
    ]));

    /* sessions_data — dates relative to today (+1, +3, +7) */
    localStorage.setItem('sessions_data', JSON.stringify([
      makeSessionRow(addDays(1), 10, 0,  'قضية تجارية',  '2026-0001', 'محكمة التجارة',    'قاعة 3', 'خالد العتيبي'),
      makeSessionRow(addDays(3),  9, 30, 'قضية عمالية',  '2026-0002', 'المحكمة العمالية', 'قاعة 1', 'سارة القحطاني'),
      makeSessionRow(addDays(7), 11, 0,  'قضية عقارية',  '2026-0003', 'محكمة الاستئناف',  'قاعة 5', 'محمد الزهراني')
    ]));

    /* invoices_data */
    localStorage.setItem('invoices_data', JSON.stringify([
      makeInvoiceRow('INV-2026-0001','a1b2c3d4','عبدالرحمن المالكي',      'تجارية','#2026-0001',5000,'أتعاب استشارة قانونية', 'paid',    shortDate(addDays(-20)),shortDate(addDays(-5))),
      makeInvoiceRow('INV-2026-0002','e5f6a7b8','سلطان الغامدي',           'عمالية','#2026-0002',3500,'أتعاب تمثيل قانوني',    'pending', shortDate(addDays(-10)),shortDate(addDays(5))),
      makeInvoiceRow('INV-2026-0003','c9d0e1f2','شركة الفارس للتجارة',    'عقارية','#2026-0003',8000,'أتعاب قضية عقارية',     'pending', shortDate(addDays(-5)), shortDate(addDays(10))),
      makeInvoiceRow('INV-2026-0004','g3h4i5j6','فيصل الشهري',             'إدارية','#2026-0004',2500,'أتعاب استشارة إدارية',  'overdue', shortDate(addDays(-30)),shortDate(addDays(-5)))
    ]));
    localStorage.setItem('inv_counter', '4');

    /* dynamicCases — keyed with '#' prefix to match openClientPortal() */
    var dynCases = {
      '#2026-0001': { pwd:'1234', client:'عبدالرحمن المالكي',        type:'قضية تجارية', court:'محكمة التجارة',    lawyer:'خالد العتيبي',  next:'سيتم تحديده قريباً' },
      '#2026-0002': { pwd:'1234', client:'سلطان الغامدي',            type:'قضية عمالية', court:'المحكمة العمالية', lawyer:'سارة القحطاني', next:'سيتم تحديده قريباً' },
      '#2026-0003': { pwd:'1234', client:'شركة الفارس للتجارة',      type:'قضية عقارية', court:'محكمة الاستئناف',  lawyer:'محمد الزهراني', next:'سيتم تحديده قريباً' },
      '#2026-0004': { pwd:'1234', client:'فيصل الشهري',              type:'قضية إدارية', court:'المحكمة الإدارية', lawyer:'نورة الشمري',   next:'سيتم تحديده قريباً' },
      '#2026-0005': { pwd:'1234', client:'مجموعة النور الاستثمارية', type:'قضية تجارية', court:'محكمة التجارة',    lawyer:'خالد العتيبي',  next:'سيتم تحديده قريباً' }
    };
    localStorage.setItem('dynamicCases', JSON.stringify(dynCases));
    sessionStorage.setItem('dynamicCases', JSON.stringify(dynCases));

    /* tasks_data — Bug #9 */
    var months = MONTHS_AR;
    function sd(d) { return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); }
    localStorage.setItem('tasks_data', JSON.stringify([
      /* متأخرة · عالية · خالد العتيبي */
      '<td><div class="task-name">تقديم لائحة اعتراض</div><div class="task-case">قضية #2026-0001</div></td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">قضية #2026-0001</td>' +
      '<td><div class="assignee-chip"><div class="av-xs">خع</div> خالد العتيبي</div></td>' +
      '<td><span class="pill pill-high">عالية</span></td>' +
      '<td><div class="date-cell">' + sd(addDays(-3)) + '</div></td>' +
      '<td><span class="pill pill-late">متأخرة</span></td>' +
      '<td><div class="row-actions"><button class="row-btn btn-complete">إتمام</button></div></td>',

      /* قيد التنفيذ · متوسطة · سارة القحطاني */
      '<td><div class="task-name">تحضير مذكرة استئناف</div><div class="task-case">قضية #2026-0002</div></td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">قضية #2026-0002</td>' +
      '<td><div class="assignee-chip"><div class="av-xs">سق</div> سارة القحطاني</div></td>' +
      '<td><span class="pill pill-mid">متوسطة</span></td>' +
      '<td><div class="date-cell">' + sd(addDays(4)) + '</div></td>' +
      '<td><span class="pill pill-progress">قيد التنفيذ</span></td>' +
      '<td><div class="row-actions"><button class="row-btn btn-complete">إتمام</button></div></td>',

      /* جديدة · منخفضة · سارة القحطاني */
      '<td><div class="task-name">اتصال بالموكل — الفارس</div></td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">—</td>' +
      '<td><div class="assignee-chip"><div class="av-xs">سق</div> سارة القحطاني</div></td>' +
      '<td><span class="pill pill-low">منخفضة</span></td>' +
      '<td><div class="date-cell">' + sd(addDays(0)) + '</div></td>' +
      '<td><span class="pill pill-new">جديدة</span></td>' +
      '<td><div class="row-actions"><button class="row-btn btn-complete">إتمام</button></div></td>',

      /* قيد التنفيذ · منخفضة · نورة الشمري */
      '<td><div class="task-name">مراجعة عقد — مجموعة النور</div></td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">—</td>' +
      '<td><div class="assignee-chip"><div class="av-xs">نش</div> نورة الشمري</div></td>' +
      '<td><span class="pill pill-low">منخفضة</span></td>' +
      '<td><div class="date-cell">' + sd(addDays(6)) + '</div></td>' +
      '<td><span class="pill pill-progress">قيد التنفيذ</span></td>' +
      '<td><div class="row-actions"><button class="row-btn btn-complete">إتمام</button></div></td>',

      /* مكتملة · منخفضة · محمد الزهراني */
      '<td><div class="task-name">إيداع رسوم محكمة</div><div class="task-case">قضية #2026-0003</div></td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">قضية #2026-0003</td>' +
      '<td><div class="assignee-chip"><div class="av-xs">مز</div> محمد الزهراني</div></td>' +
      '<td><span class="pill pill-low">منخفضة</span></td>' +
      '<td><div class="date-cell">' + sd(addDays(-5)) + '</div></td>' +
      '<td><span class="pill pill-done">مكتملة</span></td>' +
      '<td><div class="row-actions"><button class="row-btn btn-complete">إتمام</button></div></td>'
    ]));

    /* fees_data — Bug #10 */
    var today = shortDate(new Date());
    localStorage.setItem('fees_data', JSON.stringify([
      /* استشارة قانونية · المالكي · 5000 · خالد · مدفوعة · أتعاب */
      '<td><div class="fee-name">أتعاب محاماة — عبدالرحمن المالكي</div><div class="fee-id">#FEE-1001</div></td>' +
      '<td style="font-size:0.78rem">عبدالرحمن المالكي</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">#2026-0001</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">خع</div> خالد العتيبي</div></td>' +
      '<td data-amount="5000"><div class="amount-cell amount-gold">5,000</div></td>' +
      '<td><span class="type-tag type-fee">أتعاب محاماة</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-paid">مدفوعة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>',

      /* أتعاب تمثيل · الفارس · 12000 · سارة · معلقة · أتعاب */
      '<td><div class="fee-name">أتعاب محاماة — شركة الفارس للتجارة</div><div class="fee-id">#FEE-1002</div></td>' +
      '<td style="font-size:0.78rem">شركة الفارس للتجارة</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">#2026-0003</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">سق</div> سارة القحطاني</div></td>' +
      '<td data-amount="12000"><div class="amount-cell amount-gold">12,000</div></td>' +
      '<td><span class="type-tag type-fee">أتعاب محاماة</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-pending">معلقة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>',

      /* أتعاب استشارة عقارية · الشهري · 3500 · محمد · معلقة · أتعاب */
      '<td><div class="fee-name">أتعاب محاماة — فيصل الشهري</div><div class="fee-id">#FEE-1003</div></td>' +
      '<td style="font-size:0.78rem">فيصل الشهري</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">#2026-0004</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">مز</div> محمد الزهراني</div></td>' +
      '<td data-amount="3500"><div class="amount-cell amount-gold">3,500</div></td>' +
      '<td><span class="type-tag type-fee">أتعاب محاماة</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-pending">معلقة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>',

      /* مصاريف تصوير مستندات · 350 · نثرية · مدفوعة */
      '<td><div class="fee-name">مصاريف نثرية — تصوير مستندات</div><div class="fee-id">#FEE-1004</div></td>' +
      '<td style="font-size:0.78rem">—</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">—</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">—</div> —</div></td>' +
      '<td data-amount="350"><div class="amount-cell amount-gold">350</div></td>' +
      '<td><span class="type-tag type-exp">مصاريف نثرية</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-paid">مدفوعة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>',

      /* رسوم محكمة · 800 · نثرية · مدفوعة */
      '<td><div class="fee-name">مصاريف نثرية — رسوم محكمة</div><div class="fee-id">#FEE-1005</div></td>' +
      '<td style="font-size:0.78rem">—</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">—</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">—</div> —</div></td>' +
      '<td data-amount="800"><div class="amount-cell amount-gold">800</div></td>' +
      '<td><span class="type-tag type-exp">مصاريف نثرية</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-paid">مدفوعة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>',

      /* أتعاب قضية إدارية · النور · 8000 · نورة · مدفوعة · أتعاب */
      '<td><div class="fee-name">أتعاب محاماة — مجموعة النور الاستثمارية</div><div class="fee-id">#FEE-1006</div></td>' +
      '<td style="font-size:0.78rem">مجموعة النور الاستثمارية</td>' +
      '<td style="font-size:0.75rem;color:var(--ink-light)">#2026-0005</td>' +
      '<td><div class="lawyer-chip"><div class="av-xs">نش</div> نورة الشمري</div></td>' +
      '<td data-amount="8000"><div class="amount-cell amount-gold">8,000</div></td>' +
      '<td><span class="type-tag type-fee">أتعاب محاماة</span></td>' +
      '<td style="font-size:0.73rem;color:var(--ink-light)">' + today + '</td>' +
      '<td><span class="pill pill-paid">مدفوعة</span></td>' +
      '<td><button class="row-btn">عرض</button></td>'
    ]));
  }

  window.seedDemoData  = seedDemoData;
  window.resetDemoData = resetDemoData;
  window.hasSeedData   = hasSeedData;
})();
