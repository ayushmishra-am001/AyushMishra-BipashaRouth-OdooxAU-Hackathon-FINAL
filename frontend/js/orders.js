function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=orders.html';
    return;
  }
  document.getElementById('profileLink').style.display = '';
  document.getElementById('cartLink').style.display = '';
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

async function loadOrders() {
  const pageError = document.getElementById('pageError');
  try {
    const res = await apiRequest('/orders', 'GET', null, true);
    const orders = res.data || [];
    renderOrders(orders);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('ordersContent').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('ordersContent').style.display = '';

  const ordersList = document.getElementById('ordersList');
  ordersList.innerHTML = '';

  orders.forEach((order) => {
    const tr = document.createElement('tr');
    const statusClass = `status-${order.status}`;
    const deliveryMode = order.delivery_mode === 'ship' ? 'Ship' : 'Pickup';
    
    tr.innerHTML = `
      <td>#${order.id}</td>
      <td>${formatDate(order.created_at)}</td>
      <td><span class="status-badge ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
      <td>${deliveryMode}</td>
      <td>${formatMoney(order.total)}</td>
      <td>
        <button class="view-btn" data-order-id="${order.id}">View</button>
        <button class="invoice-btn" data-order-id="${order.id}">Invoice</button>
      </td>
    `;
    ordersList.appendChild(tr);
  });

  attachOrderEventListeners();
}

function attachOrderEventListeners() {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const orderId = btn.dataset.orderId;
      window.location.href = `order-confirmation.html?id=${orderId}`;
    });
  });

  document.querySelectorAll('.invoice-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const orderId = btn.dataset.orderId;
      window.location.href = `invoice.html?id=${orderId}`;
    });
  });
}

setupNav();
loadOrders();
