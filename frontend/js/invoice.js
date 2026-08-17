function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=invoice.html';
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

function getOrderId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  return Number.isNaN(id) ? null : id;
}

async function loadInvoice() {
  const orderId = getOrderId();
  const pageError = document.getElementById('pageError');

  if (!orderId) {
    pageError.textContent = 'Invalid order ID.';
    return;
  }

  try {
    const res = await apiRequest(`/orders/${orderId}`, 'GET', null, true);
    const order = res.data;
    renderInvoice(order);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

async function fetchCustomerData() {
  try {
    const res = await apiRequest('/auth/me', 'GET', null, true);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch customer data:', err);
    return null;
  }
}

async function renderInvoice(order) {
  // Fetch customer data
  const customer = await fetchCustomerData();

  document.getElementById('invoiceContent').style.display = '';

  // Invoice header
  document.getElementById('invoiceOrderId').textContent = order.id;
  document.getElementById('orderId').textContent = order.id;
  document.getElementById('invoiceDate').textContent = formatDate(order.created_at);
  document.getElementById('orderStatus').textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  
  const deliveryMode = order.delivery_mode === 'ship' ? 'Ship to Address' : 'Store Pickup';
  document.getElementById('deliveryMode').textContent = deliveryMode;

  // Customer info
  if (customer) {
    document.getElementById('customerName').textContent = customer.name || 'Customer';
    document.getElementById('customerEmail').textContent = customer.email || '';
    document.getElementById('customerPhone').textContent = customer.phone || '';
    document.getElementById('customerAddress').textContent = customer.address || (order.delivery_address ? 'Delivery: ' + order.delivery_address : '');
  }

  // Order items
  const itemsTable = document.getElementById('invoiceItems');
  itemsTable.innerHTML = '';
  let subtotal = 0;

  (order.order_items || []).forEach((item) => {
    const itemTotal = item.unit_price * item.quantity;
    subtotal += itemTotal;
    
    const tr = document.createElement('tr');
    const dateRange = `${item.start_date} to ${item.end_date}`;
    tr.innerHTML = `
      <td>${item.product?.name || 'Unknown'}</td>
      <td>${item.quantity}</td>
      <td>${dateRange}</td>
      <td>${formatMoney(item.unit_price)}</td>
      <td>${formatMoney(itemTotal)}</td>
    `;
    itemsTable.appendChild(tr);
  });

  // Summary
  const deposit = order.deposit_amount || 0;
  const total = order.total || 0;

  document.getElementById('invoiceSubtotal').textContent = formatMoney(subtotal);
  document.getElementById('invoiceDeposit').textContent = formatMoney(deposit);
  document.getElementById('invoiceTotal').textContent = formatMoney(total);
}

setupNav();
loadInvoice();
