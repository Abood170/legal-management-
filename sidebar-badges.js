function updateSidebarBadges() {
  try {
    var cases = JSON.parse(localStorage.getItem('cases_data') || '[]').length;
    var casesBadge = document.getElementById('casesBadge');
    if (casesBadge) {
      casesBadge.textContent = cases;
      casesBadge.style.display = cases > 0 ? '' : 'none';
    }
  } catch(e) {}

  try {
    var sessions = JSON.parse(localStorage.getItem('sessions_data') || '[]').length;
    var sessionsBadge = document.getElementById('sessionsBadge');
    if (sessionsBadge) {
      sessionsBadge.textContent = sessions;
      sessionsBadge.style.display = sessions > 0 ? '' : 'none';
    }
  } catch(e) {}

  try {
    var fees = JSON.parse(localStorage.getItem('fees_data') || '[]').length;
    var feesBadge = document.getElementById('feesBadge');
    if (feesBadge) {
      if (fees > 0) {
        feesBadge.textContent = fees + ' معلقة';
        feesBadge.style.display = '';
      } else {
        feesBadge.style.display = 'none';
      }
    }
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', updateSidebarBadges);
