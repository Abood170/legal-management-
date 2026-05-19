function applyFirmName() {
  var firmData = null;
  try { firmData = JSON.parse(localStorage.getItem('firm_data') || 'null'); } catch(e) {}
  var name = (firmData && firmData.firmName) ? firmData.firmName : 'نظام إدارة المحاماة';

  document.querySelectorAll('.firm-name-target').forEach(function(el) {
    el.textContent = name;
  });

  document.querySelectorAll('.firm-name-input').forEach(function(el) {
    el.value = name;
  });
}
document.addEventListener('DOMContentLoaded', applyFirmName);
