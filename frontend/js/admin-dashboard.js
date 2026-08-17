function formatMoney(paise) {
  if (paise === null || paise === undefined) return '—';
  return '₹' + (paise / 100).toFixed(2);
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=admin-dashboard.html';
    return;
  }
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

document.getElementById('refreshBtn').addEventListener('click', loadSummary);

async function loadSummary() {
  const pageError = document.getElementById('pageError');
  pageError.textContent = '';
  try {
    const res = await apiRequest('/dashboard/summary', 'GET', null, true);
    renderSummary(res.data);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderSummary(summary) {
  document.getElementById('statActiveRentals').textContent = summary.active_rentals;
  document.getElementById('statRentalsDueToday').textContent = summary.rentals_due_today;
  document.getElementById('statUpcomingPickups').textContent = summary.upcoming_pickups;
  document.getElementById('statUpcomingReturns').textContent = summary.upcoming_returns;
  document.getElementById('statOverdueRentals').textContent = summary.overdue_rentals;
  document.getElementById('statRevenue').textContent = formatMoney(summary.revenue_last_30_days);
  document.getElementById('statDepositsHeld').textContent = formatMoney(summary.security_deposits_held);
  document.getElementById('statLateFees').textContent = formatMoney(summary.late_fee_collection);
}

setupNav();
loadSummary();
