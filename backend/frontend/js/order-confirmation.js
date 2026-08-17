function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function setupNav() {
  document.getElementById('profileLink').style.display = '';
  document.getElementById('cartLink').style.display = '';
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

function getOrderId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  return Number.isNaN(id) ? null : id;
}

async function loadOrder() {
  const orderId = getOrderId();
  if (!orderId) {
    showError('Invalid order ID.');
    return;
  }

  try {
    const res = await apiRequest(`/orders/${orderId}`, 'GET', null, true);
    const order = res.data;
    renderOrder(order);
  } catch (err) {
    showError(err.message);
  }
}

function showError(message) {
  document.getElementById('confirmation-content').style.display = 'none';
  document.getElementById('error-content').style.display = '';
  document.getElementById('errorMessage').textContent = message;
}

function renderOrder(order) {
  document.getElementById('confirmation-content').style.display = '';

  // Order header
  document.getElementById('orderId').textContent = order.id;
  document.getElementById('orderIdDetail').textContent = order.id;
  document.getElementById('orderStatus').textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  
  const deliveryMode = order.delivery_mode === 'ship' ? 'Ship to Address' : 'Store Pickup';
  document.getElementById('orderDeliveryMode').textContent = deliveryMode;
  
  if (order.delivery_address) {
    document.getElementById('orderDeliveryAddress').textContent = order.delivery_address;
  }

  // Order items
  const itemsTable = document.getElementById('orderItemsDetail');
  itemsTable.innerHTML = '';
  (order.order_items || []).forEach((item) => {
    const tr = document.createElement('tr');
    const dateRange = `${item.start_date} to ${item.end_date}`;
    tr.innerHTML = `
      <td>${item.product?.name || 'Unknown'}</td>
      <td>${item.quantity}</td>
      <td>${dateRange}</td>
      <td>${formatMoney(item.unit_price * item.quantity)}</td>
    `;
    itemsTable.appendChild(tr);
  });

  // Payment summary
  const subtotal = order.subtotal || 0;
  const deposit = order.deposit_amount || 0;
  const balance = subtotal - deposit;

  document.getElementById('confirmSubtotal').textContent = formatMoney(subtotal);
  document.getElementById('confirmDeposit').textContent = formatMoney(deposit);
  document.getElementById('confirmBalance').textContent = formatMoney(balance);
}

setupNav();
loadOrder();
