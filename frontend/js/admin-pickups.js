let currentEditPickupId = null;

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Convert an ISO timestamp to the value a <input type="datetime-local"> expects
// (local time, "YYYY-MM-DDTHH:MM") — used to pre-fill the edit form.
function toDateTimeLocalValue(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=admin-pickups.html';
    return;
  }
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

document.getElementById('createPickupBtn').addEventListener('click', () => {
  document.getElementById('createPickupForm').reset();
  document.getElementById('createFormError').textContent = '';
  document.getElementById('createPickupModal').style.display = 'flex';
});

function closeCreatePickupModal() {
  document.getElementById('createPickupModal').style.display = 'none';
}

function closeEditPickupModal() {
  document.getElementById('editPickupModal').style.display = 'none';
  currentEditPickupId = null;
}

document.getElementById('createPickupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('createFormError');

  const orderId = parseInt(document.getElementById('pickupOrderId').value, 10);
  const scheduledAtLocal = document.getElementById('pickupScheduledAt').value;
  const notes = document.getElementById('pickupNotes').value.trim();

  if (!orderId || !scheduledAtLocal) {
    formError.textContent = 'Order ID and scheduled date/time are required.';
    return;
  }

  try {
    await apiRequest('/pickup-schedules', 'POST', {
      order_id: orderId,
      scheduled_at: new Date(scheduledAtLocal).toISOString(),
      notes: notes || undefined,
    }, true);

    closeCreatePickupModal();
    loadPickups();
  } catch (err) {
    formError.textContent = err.message;
  }
});

function currentFilters() {
  const filters = {};
  const date = document.getElementById('filterDate').value;
  const status = document.getElementById('filterStatus').value;
  if (date) filters.date = date;
  if (status) filters.status = status;
  return filters;
}

document.getElementById('filterDate').addEventListener('change', loadPickups);
document.getElementById('filterStatus').addEventListener('change', loadPickups);
document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterStatus').value = '';
  loadPickups();
});

async function loadPickups() {
  const pageError = document.getElementById('pageError');
  pageError.textContent = '';
  try {
    const filters = currentFilters();
    const params = new URLSearchParams(filters).toString();
    const res = await apiRequest(`/pickup-schedules${params ? '?' + params : ''}`, 'GET', null, true);
    const pickups = res.data || [];
    renderPickups(pickups);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderPickups(pickups) {
  if (!pickups.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('pickupsTable').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pickupsTable').style.display = '';

  const tbody = document.getElementById('pickupsList');
  tbody.innerHTML = '';

  pickups.forEach((pickup) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${pickup.id}</td>
      <td>Order #${pickup.order_id}</td>
      <td>${formatDateTime(pickup.scheduled_at)}</td>
      <td><span class="status-badge status-${pickup.status}">${pickup.status}</span></td>
      <td class="truncate">${pickup.notes || ''}</td>
      <td>
        <button class="edit-btn" data-id="${pickup.id}">Edit</button>
        ${pickup.status === 'pending' ? `<button class="mark-done-btn" data-id="${pickup.id}">Mark Done</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachPickupEventListeners(pickups);
}

function attachPickupEventListeners(pickups) {
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      const pickup = pickups.find((p) => p.id === id);
      if (pickup) openEditPickupModal(pickup);
    });
  });

  document.querySelectorAll('.mark-done-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      try {
        await apiRequest(`/pickup-schedules/${id}`, 'PUT', { status: 'done' }, true);
        loadPickups();
      } catch (err) {
        document.getElementById('pageError').textContent = err.message;
      }
    });
  });
}

function openEditPickupModal(pickup) {
  currentEditPickupId = pickup.id;
  document.getElementById('editPickupId').textContent = pickup.id;
  document.getElementById('editScheduledAt').value = toDateTimeLocalValue(pickup.scheduled_at);
  document.getElementById('editStatus').value = pickup.status;
  document.getElementById('editNotes').value = pickup.notes || '';
  document.getElementById('editFormError').textContent = '';
  document.getElementById('editPickupModal').style.display = 'flex';
}

document.getElementById('editPickupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('editFormError');

  const scheduledAtLocal = document.getElementById('editScheduledAt').value;
  const status = document.getElementById('editStatus').value;
  const notes = document.getElementById('editNotes').value.trim();

  const body = { status, notes };
  if (scheduledAtLocal) {
    body.scheduled_at = new Date(scheduledAtLocal).toISOString();
  }

  try {
    await apiRequest(`/pickup-schedules/${currentEditPickupId}`, 'PUT', body, true);
    closeEditPickupModal();
    loadPickups();
  } catch (err) {
    formError.textContent = err.message;
  }
});

// Close modals on background click
document.getElementById('createPickupModal').addEventListener('click', (e) => {
  if (e.target.id === 'createPickupModal') closeCreatePickupModal();
});
document.getElementById('editPickupModal').addEventListener('click', (e) => {
  if (e.target.id === 'editPickupModal') closeEditPickupModal();
});

setupNav();
loadPickups();
