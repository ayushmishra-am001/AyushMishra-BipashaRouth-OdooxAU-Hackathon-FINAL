function formatMoney(paise) {
  if (paise === null || paise === undefined) return '—';
  return '₹' + (paise / 100).toFixed(2);
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=admin-returns.html';
    return;
  }
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

document.getElementById('createReturnBtn').addEventListener('click', () => {
  document.getElementById('createReturnForm').reset();
  document.getElementById('createFormError').textContent = '';
  document.getElementById('createReturnModal').style.display = 'flex';
});

function closeCreateReturnModal() {
  document.getElementById('createReturnModal').style.display = 'none';
}

function closeViewReturnModal() {
  document.getElementById('viewReturnModal').style.display = 'none';
}

document.getElementById('createReturnForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('createFormError');

  const orderId = parseInt(document.getElementById('returnOrderId').value, 10);
  const conditionNotes = document.getElementById('returnConditionNotes').value.trim();
  const damageReported = document.getElementById('returnDamageReported').checked;

  if (!orderId) {
    formError.textContent = 'Order ID is required.';
    return;
  }

  try {
    await apiRequest('/returns', 'POST', {
      order_id: orderId,
      condition_notes: conditionNotes || undefined,
      damage_reported: damageReported,
    }, true);

    closeCreateReturnModal();
    loadReturns();
  } catch (err) {
    formError.textContent = err.message;
  }
});

document.getElementById('applyFilterBtn').addEventListener('click', loadReturns);
document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.getElementById('filterOrderId').value = '';
  loadReturns();
});

async function loadReturns() {
  const pageError = document.getElementById('pageError');
  pageError.textContent = '';
  try {
    const orderId = document.getElementById('filterOrderId').value;
    const params = orderId ? `?order_id=${encodeURIComponent(orderId)}` : '';
    const res = await apiRequest(`/returns${params}`, 'GET', null, true);
    const returns = res.data || [];
    renderReturns(returns);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderReturns(returns) {
  if (!returns.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('returnsTable').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('returnsTable').style.display = '';

  const tbody = document.getElementById('returnsList');
  tbody.innerHTML = '';

  returns.forEach((ret) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${ret.id}</td>
      <td>Order #${ret.order_id}</td>
      <td>${formatDateTime(ret.returned_at)}</td>
      <td>${ret.late_hours}</td>
      <td>${ret.damage_reported ? '<span class="badge-warning">Yes</span>' : '<span class="badge-ok">No</span>'}</td>
      <td>${ret.late_fee_charged === null ? 'Pending' : formatMoney(ret.late_fee_charged)}</td>
      <td>${ret.stock_updated ? 'Yes' : 'No'}</td>
      <td class="deposit-cell" data-order-id="${ret.order_id}">
        <button type="button" class="settle-deposit-btn" data-order-id="${ret.order_id}">Settle Deposit</button>
      </td>
      <td><button class="view-btn" data-id="${ret.id}">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  attachReturnEventListeners(returns);
}

function attachReturnEventListeners(returns) {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      const ret = returns.find((r) => r.id === id);
      if (ret) viewReturn(ret);
    });
  });

  document.querySelectorAll('.settle-deposit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const orderId = parseInt(btn.dataset.orderId, 10);
      settleDeposit(orderId, btn.closest('.deposit-cell'));
    });
  });
}

/**
 * Look up the deposit for this order, then settle it (Step 5.3's
 * POST /deposits/:depositId/settle). GET /api/v1/returns doesn't expose
 * the linked security_deposits.id, so this looks it up on demand via
 * ?order_id= rather than preloading a deposit per row on every page load.
 */
async function settleDeposit(orderId, cell) {
  cell.innerHTML = 'Looking up deposit…';
  let deposit;
  try {
    const res = await apiRequest(`/deposits?order_id=${encodeURIComponent(orderId)}`, 'GET', null, true);
    deposit = (res.data || [])[0];
  } catch (err) {
    cell.innerHTML = `<span class="error">${err.message}</span>`;
    return;
  }

  if (!deposit) {
    cell.innerHTML = '<span class="error">No deposit found</span>';
    return;
  }

  if (deposit.status !== 'held') {
    renderDepositResult(cell, deposit);
    return;
  }

  if (!confirm(`Settle deposit of ${formatMoney(deposit.amount)} for Order #${orderId}?`)) {
    renderSettleButton(cell, orderId);
    return;
  }

  try {
    const res = await apiRequest(`/deposits/${deposit.id}/settle`, 'POST', null, true);
    renderDepositResult(cell, res.data);
  } catch (err) {
    cell.innerHTML = `<span class="error">${err.message}</span>`;
  }
}

function renderDepositResult(cell, deposit) {
  const label = deposit.status === 'refunded' ? 'Refunded' : 'Partially Refunded';
  const badgeClass = deposit.status === 'refunded' ? 'badge-ok' : 'badge-warning';
  cell.innerHTML = `<span class="${badgeClass}">${label}</span><br>${formatMoney(deposit.refunded_amount)}`;
}

function renderSettleButton(cell, orderId) {
  cell.innerHTML = `<button type="button" class="settle-deposit-btn" data-order-id="${orderId}">Settle Deposit</button>`;
  cell.querySelector('.settle-deposit-btn').addEventListener('click', (e) => {
    e.preventDefault();
    settleDeposit(orderId, cell);
  });
}

function viewReturn(ret) {
  document.getElementById('viewReturnId').textContent = ret.id;
  document.getElementById('viewOrderId').textContent = ret.order_id;
  document.getElementById('viewReturnedAt').textContent = formatDateTime(ret.returned_at);
  document.getElementById('viewLateHours').textContent = ret.late_hours;
  document.getElementById('viewDamage').textContent = ret.damage_reported ? 'Yes' : 'No';
  document.getElementById('viewLateFee').textContent = ret.late_fee_charged === null ? 'Not yet charged' : formatMoney(ret.late_fee_charged);
  document.getElementById('viewStockUpdated').textContent = ret.stock_updated ? 'Yes' : 'No';
  document.getElementById('viewConditionNotes').textContent = ret.condition_notes || '—';

  document.getElementById('viewReturnModal').style.display = 'flex';
}

// Close modals on background click
document.getElementById('createReturnModal').addEventListener('click', (e) => {
  if (e.target.id === 'createReturnModal') closeCreateReturnModal();
});
document.getElementById('viewReturnModal').addEventListener('click', (e) => {
  if (e.target.id === 'viewReturnModal') closeViewReturnModal();
});

setupNav();
loadReturns();
