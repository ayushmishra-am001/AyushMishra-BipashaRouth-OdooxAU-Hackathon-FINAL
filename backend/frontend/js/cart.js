const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e5e7eb"/></svg>';

function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function setupNav() {
  const loggedIn = !!getToken();
  document.getElementById('ordersLink').style.display = loggedIn ? '' : 'none';
  document.getElementById('profileLink').style.display = loggedIn ? '' : 'none';
  document.getElementById('loginLink').style.display = loggedIn ? 'none' : '';
  document.getElementById('logoutLink').style.display = loggedIn ? '' : 'none';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

let currentCart = null;

async function loadCart() {
  const pageError = document.getElementById('pageError');
  if (!getToken()) {
    pageError.textContent = 'Please log in to view your cart.';
    window.location.href = 'login.html?redirect=cart.html';
    return;
  }

  try {
    const res = await apiRequest('/cart', 'GET', null, true);
    currentCart = res.data;
    renderCart();
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderCart() {
  const items = currentCart.items || [];
  
  if (!items.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('cartContent').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('cartContent').style.display = '';

  const cartItemsTable = document.getElementById('cartItems');
  cartItemsTable.innerHTML = '';

  items.forEach((item) => {
    const tr = document.createElement('tr');
    const variantName = item.variant_id 
      ? `${item.variant?.attribute_name}: ${item.variant?.attribute_value}` 
      : 'None';
    
    tr.innerHTML = `
      <td>${item.product?.name || 'Unknown'}</td>
      <td>${variantName}</td>
      <td>${item.start_date}</td>
      <td>${item.end_date}</td>
      <td>
        <input type="number" class="qty-edit" value="${item.quantity}" min="1" data-item-id="${item.id}">
      </td>
      <td>${formatMoney(item.price_snapshot)}</td>
      <td>
        <button class="edit-btn" data-item-id="${item.id}" style="font-size:12px; padding:4px 8px;">Edit</button>
        <button class="delete-btn danger" data-item-id="${item.id}" style="font-size:12px; padding:4px 8px;">Delete</button>
      </td>
    `;
    cartItemsTable.appendChild(tr);
  });

  updateCartSummary();
  attachCartEventListeners();
}

function updateCartSummary() {
  const items = currentCart.items || [];
  let subtotal = 0;

  items.forEach((item) => {
    subtotal += item.price_snapshot * item.quantity;
  });

  const deposit = Math.round(subtotal * 0.3);
  const total = subtotal + deposit;

  document.getElementById('subtotal').textContent = formatMoney(subtotal);
  document.getElementById('deposit').textContent = formatMoney(deposit);
  document.getElementById('total').textContent = formatMoney(total);
}

function attachCartEventListeners() {
  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const itemId = parseInt(btn.dataset.itemId, 10);
      openEditModal(itemId);
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const itemId = parseInt(btn.dataset.itemId, 10);
      if (confirm('Remove this item from cart?')) {
        await deleteItem(itemId);
      }
    });
  });
}

function openEditModal(itemId) {
  const item = (currentCart.items || []).find((i) => i.id === itemId);
  if (!item) return;

  const newQty = prompt(`Update quantity (currently ${item.quantity}):`, item.quantity);
  if (newQty === null) return;

  const newStartDate = prompt(`Update start date (currently ${item.start_date}):`, item.start_date);
  if (newStartDate === null) return;

  const newEndDate = prompt(`Update end date (currently ${item.end_date}):`, item.end_date);
  if (newEndDate === null) return;

  const actionError = document.getElementById('actionError');
  const actionSuccess = document.getElementById('actionSuccess');
  actionError.textContent = '';
  actionSuccess.textContent = '';

  updateItem(itemId, parseInt(newQty, 10), newStartDate, newEndDate);
}

async function updateItem(itemId, qty, startDate, endDate) {
  const actionError = document.getElementById('actionError');
  const actionSuccess = document.getElementById('actionSuccess');

  try {
    await apiRequest(`/cart/items/${itemId}`, 'PUT', {
      quantity: qty,
      start_date: startDate,
      end_date: endDate,
    }, true);
    actionSuccess.textContent = 'Item updated.';
    setTimeout(() => loadCart(), 500);
  } catch (err) {
    actionError.textContent = err.message;
  }
}

async function deleteItem(itemId) {
  const actionError = document.getElementById('actionError');
  const actionSuccess = document.getElementById('actionSuccess');

  try {
    await apiRequest(`/cart/items/${itemId}`, 'DELETE', null, true);
    actionSuccess.textContent = 'Item removed.';
    setTimeout(() => loadCart(), 500);
  } catch (err) {
    actionError.textContent = err.message;
  }
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

setupNav();
loadCart();
