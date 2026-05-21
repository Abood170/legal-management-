/* ── Export to Excel (SpreadsheetML) — export-data.js ── */
(function () {

  /* ── inject export button CSS ── */
  var css = document.createElement('style');
  css.textContent =
    '.btn-export{display:inline-flex;align-items:center;gap:.35rem;background:none;border:1px solid rgba(28,94,62,.25);' +
    'color:#1C5E3E;padding:.38rem .85rem;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;' +
    'font-family:"Cairo",sans-serif;transition:all .18s cubic-bezier(.4,0,.2,1);white-space:nowrap;}' +
    '.btn-export:hover{background:rgba(28,94,62,.07);border-color:rgba(28,94,62,.45);transform:translateY(-1px);}' +
    '.btn-export:active{transform:translateY(0);}';
  document.head.appendChild(css);

  /* ── helpers ── */
  function parseRows(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }
  function parseTr(html) {
    return new DOMParser()
      .parseFromString('<table><tbody><tr>' + html + '</tr></tbody></table>', 'text/html')
      .querySelectorAll('td');
  }
  function txt(el) {
    if (!el) return '';
    var clone = el.cloneNode ? el.cloneNode(true) : el;
    /* strip action buttons if any */
    ['.row-btn', '.btn-wa-remind', 'button'].forEach(function (sel) {
      clone.querySelectorAll && clone.querySelectorAll(sel).forEach(function (b) { b.remove(); });
    });
    return clone.textContent ? clone.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function chipName(cell) {
    if (!cell) return '';
    var chip = cell.querySelector ? cell.querySelector('.lawyer-chip') : null;
    if (!chip) return txt(cell);
    var cl = chip.cloneNode(true);
    var av = cl.querySelector('[class*="av"]') || cl.querySelector('[class*="-av"]');
    if (av) av.remove();
    return cl.textContent ? cl.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function amt(cell) {
    if (!cell) return '0';
    var a = cell.getAttribute ? cell.getAttribute('data-amount') : null;
    if (a) return parseFloat(a) || '0';
    /* check child with data-amount */
    var child = cell.querySelector ? cell.querySelector('[data-amount]') : null;
    if (child) return parseFloat(child.getAttribute('data-amount')) || '0';
    var t = txt(cell).replace(/[^\d.]/g, '');
    return parseFloat(t) || '0';
  }
  function escXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── SpreadsheetML builder ── */
  function buildXLS(sheetName, headers, rows, totalsRow) {
    var HEADER_COLOR = '#1C5E3E';   /* brand green */
    var TOTAL_COLOR  = '#0F1419';   /* ink dark    */
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:x="urn:schemas-microsoft-com:office:excel">\n' +
      ' <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">' +
      '<Title>' + escXml(sheetName) + '</Title></DocumentProperties>\n' +
      ' <Styles>\n' +
      '  <Style ss:ID="hdr"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/>' +
        '<Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="9" ss:Name="Cairo"/>' +
        '<Interior ss:Color="' + HEADER_COLOR + '" ss:Pattern="Solid"/>' +
        '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#FFFFFF"/></Borders></Style>\n' +
      '  <Style ss:ID="dat"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/>' +
        '<Font ss:Size="9" ss:Name="Cairo"/>' +
        '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>\n' +
      '  <Style ss:ID="num"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/>' +
        '<Font ss:Size="9" ss:Name="Cairo"/><NumberFormat ss:Format="#,##0.00"/>' +
        '<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>\n' +
      '  <Style ss:ID="tot"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/>' +
        '<Font ss:Bold="1" ss:Size="9" ss:Name="Cairo" ss:Color="' + TOTAL_COLOR + '"/>' +
        '<Interior ss:Color="#F0EDE6" ss:Pattern="Solid"/>' +
        '<Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="' + HEADER_COLOR + '"/></Borders></Style>\n' +
      '  <Style ss:ID="totn"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/>' +
        '<Font ss:Bold="1" ss:Size="9" ss:Name="Cairo" ss:Color="' + HEADER_COLOR + '"/>' +
        '<Interior ss:Color="#F0EDE6" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0.00"/>' +
        '<Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="' + HEADER_COLOR + '"/></Borders></Style>\n' +
      ' </Styles>\n' +
      ' <Worksheet ss:Name="' + escXml(sheetName.substring(0, 30)) + '">\n' +
      '  <Table ss:DefaultRowHeight="18" ss:DefaultColumnWidth="90">\n';

    /* header row */
    xml += '   <Row ss:Height="22">';
    headers.forEach(function (h) {
      xml += '<Cell ss:StyleID="hdr"><Data ss:Type="String">' + escXml(h) + '</Data></Cell>';
    });
    xml += '</Row>\n';

    /* data rows */
    rows.forEach(function (row) {
      xml += '   <Row ss:Height="17">';
      row.forEach(function (cell) {
        var val = cell == null ? '' : cell;
        var isNum = typeof val === 'number' || (typeof val === 'string' && val !== '' && !isNaN(parseFloat(val)) && isFinite(+val));
        if (isNum) {
          xml += '<Cell ss:StyleID="num"><Data ss:Type="Number">' + parseFloat(val) + '</Data></Cell>';
        } else {
          xml += '<Cell ss:StyleID="dat"><Data ss:Type="String">' + escXml(String(val)) + '</Data></Cell>';
        }
      });
      xml += '</Row>\n';
    });

    /* optional totals row */
    if (totalsRow) {
      xml += '   <Row ss:Height="20">';
      totalsRow.forEach(function (cell) {
        var val = cell == null ? '' : cell;
        var isNum = typeof val === 'number' || (typeof val === 'string' && val !== '' && !isNaN(parseFloat(val)) && isFinite(+val));
        if (isNum) {
          xml += '<Cell ss:StyleID="totn"><Data ss:Type="Number">' + parseFloat(val) + '</Data></Cell>';
        } else {
          xml += '<Cell ss:StyleID="tot"><Data ss:Type="String">' + escXml(String(val)) + '</Data></Cell>';
        }
      });
      xml += '</Row>\n';
    }

    xml += '  </Table>\n </Worksheet>\n</Workbook>';
    return xml;
  }

  function downloadFile(content, filename) {
    var bom   = '﻿';
    var blob  = new Blob([bom + content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    var url   = URL.createObjectURL(blob);
    var a     = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 800);
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  function toast(msg) {
    if (window.showToast) { window.showToast(msg); return; }
    /* fallback */
    var t = document.createElement('div');
    t.textContent = '✓ ' + msg;
    Object.assign(t.style, {
      position:'fixed', top:'1.5rem', left:'50%', transform:'translateX(-50%)',
      background:'#1C5E3E', color:'#fff', padding:'.7rem 1.5rem', borderRadius:'8px',
      fontFamily:'"Cairo",sans-serif', fontWeight:'700', fontSize:'.85rem',
      zIndex:'999999', boxShadow:'0 4px 20px rgba(28,94,62,.3)'
    });
    document.body.appendChild(t);
    setTimeout(function () { document.body.removeChild(t); }, 3000);
  }

  /* ══════════════════════════════════════════════
     EXPORTERS
  ══════════════════════════════════════════════ */

  /* ── 1. Invoices ── */
  window.exportInvoices = function () {
    var headers = ['رقم الفاتورة','المعرّف الفريد','الموكل','القضية','الأتعاب (ر.س)','VAT 15% (ر.س)','الإجمالي (ر.س)','تاريخ الإصدار','تاريخ الاستحقاق','الحالة'];
    var totalBase = 0, totalVat = 0, totalAmt = 0;

    var rows = parseRows('invoices_data').map(function (html) {
      var c  = parseTr(html);
      var num   = txt(c[0] && c[0].querySelector ? c[0].querySelector('.case-name') : c[0]) || txt(c[0]);
      var uuid  = txt(c[0] && c[0].querySelector ? c[0].querySelector('.case-id')   : null);
      var cli   = txt(c[1]);
      var cas   = txt(c[2] && c[2].querySelector ? c[2].querySelector('.case-name') : c[2]);
      var base  = +amt(c[3] && c[3].querySelector ? c[3].querySelector('[data-amount]') || c[3] : c[3]);
      var vat   = +amt(c[4]);
      var total = +amt(c[5] && c[5].querySelector ? c[5].querySelector('[data-amount]') || c[5] : c[5]);
      var issue = txt(c[6] && c[6].querySelector ? c[6].querySelector('.date-cell') : c[6]);
      var due   = txt(c[7] && c[7].querySelector ? c[7].querySelector('.date-cell') : c[7]);
      var stat  = txt(c[8] && c[8].querySelector ? c[8].querySelector('.pill')      : c[8]);
      totalBase += base; totalVat += vat; totalAmt += total;
      return [num, uuid, cli, cas, base, vat, total, issue, due, stat];
    });

    var totRow = ['', '', '', 'الإجمالي', totalBase, totalVat, totalAmt, '', '', ''];
    var xls = buildXLS('الفواتير', headers, rows, rows.length ? totRow : null);
    downloadFile(xls, 'فواتير_' + today() + '.xls');
    toast('تم تصدير ' + rows.length + ' فاتورة إلى Excel ✓');
  };

  /* ── 2. Fees ── */
  window.exportFees = function () {
    /*
      fees table columns (0-indexed):
      0:البند  1:الموكل  2:القضية  3:المحامي  4:المبلغ  5:النوع  6:التاريخ  7:الحالة  8:إجراء
    */
    var headers = ['البند','الموكل','القضية','المحامي','المبلغ (ر.س)','النوع','تاريخ التسجيل','الحالة'];
    var totalAmt = 0;

    var rows = parseRows('fees_data').map(function (html) {
      var c     = parseTr(html);
      var item  = txt(c[0]);
      var cli   = txt(c[1]);
      var cas   = txt(c[2] && c[2].querySelector ? c[2].querySelector('.case-name') : c[2]);
      var law   = chipName(c[3]);
      var money = +amt(c[4]);
      var type  = txt(c[5] && c[5].querySelector ? c[5].querySelector('.pill') || c[5] : c[5]);
      var date  = txt(c[6]);
      var stat  = txt(c[7] && c[7].querySelector ? c[7].querySelector('.pill') || c[7] : c[7]);
      totalAmt += money;
      return [item, cli, cas, law, money, type, date, stat];
    });

    var totRow = ['', '', '', 'الإجمالي', totalAmt, '', '', ''];
    var xls = buildXLS('الأتعاب', headers, rows, rows.length ? totRow : null);
    downloadFile(xls, 'أتعاب_' + today() + '.xls');
    toast('تم تصدير ' + rows.length + ' سجل أتعاب إلى Excel ✓');
  };

  /* ── 3. Cases ── */
  window.exportCases = function () {
    /*
      cases table columns:
      0:رقم القضية  1:اسم الموكل  2:نوع القضية  3:المحكمة  4:المحامي  5:تاريخ الجلسة  6:الحالة  7:إجراء
    */
    var headers = ['رقم القضية','الموكل','نوع القضية','المحكمة','المحامي','تاريخ الجلسة القادمة','الحالة'];
    var allRows = parseRows('cases_data').concat(parseRows('dynamicCases'));

    var rows = allRows.map(function (html) {
      var c    = parseTr(html);
      var cnum = txt(c[0] && c[0].querySelector ? c[0].querySelector('.case-name') : c[0]) || txt(c[0]);
      var cid  = txt(c[0] && c[0].querySelector ? c[0].querySelector('.case-id')   : null);
      var cli  = txt(c[1]);
      var type = txt(c[2] && c[2].querySelector ? c[2].querySelector('.case-name') : c[2]) || txt(c[2]);
      var court= txt(c[3]);
      var law  = chipName(c[4]);
      var date = txt(c[5] && c[5].querySelector ? c[5].querySelector('.date-cell') : c[5]);
      var stat = txt(c[6] && c[6].querySelector ? c[6].querySelector('.pill')      : c[6]);
      var label = cnum + (cid ? ' — ' + cid : '');
      return [label, cli, type, court, law, date, stat];
    });

    var xls = buildXLS('الدعاوى', headers, rows, null);
    downloadFile(xls, 'قضايا_' + today() + '.xls');
    toast('تم تصدير ' + rows.length + ' قضية إلى Excel ✓');
  };

  /* ── 4. Sessions ── */
  window.exportSessions = function () {
    /*
      sessions table columns:
      0:التاريخ  1:الوقت  2:القضية  3:المحكمة  4:القاعة  5:المحامي  6:الحالة  7:إجراء
    */
    var headers = ['التاريخ','الوقت','القضية','رقم القضية','المحكمة','القاعة','المحامي','الحالة'];

    var rows = parseRows('sessions_data').map(function (html) {
      var c    = parseTr(html);
      var date = txt(c[0] && c[0].querySelector ? c[0].querySelector('.date-cell') : c[0]);
      var time = txt(c[1] && c[1].querySelector ? c[1].querySelector('.time-cell') || c[1] : c[1]);
      var cnam = txt(c[2] && c[2].querySelector ? c[2].querySelector('.case-name') : c[2]);
      var cid  = txt(c[2] && c[2].querySelector ? c[2].querySelector('.case-id')   : null);
      var court= txt(c[3]);
      var hall = txt(c[4]);
      var law  = chipName(c[5]);
      var stat = txt(c[6] && c[6].querySelector ? c[6].querySelector('.pill')      : c[6]);
      return [date, time, cnam, cid, court, hall, law, stat];
    });

    var xls = buildXLS('الجلسات', headers, rows, null);
    downloadFile(xls, 'جلسات_' + today() + '.xls');
    toast('تم تصدير ' + rows.length + ' جلسة إلى Excel ✓');
  };

})();
