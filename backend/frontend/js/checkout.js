function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=checkout.html';
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

let currentCart = null;

async function loadCart() {
  const pageError = document.getElementById('pageError');
  try {
    const res = await apiRequest('/cart', 'GET', null, true);
    currentCart = res.data;
    renderCheckout();
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderCheckout() {
  const items = currentCart.items || [];
  
  if (!items.length) {
    document.getElementById('pageError').textContent = 'Cart is empty. Please add items before checkout.';
    document.getElementById('checkoutContent').style.display = 'none';
    return;
  }

  document.getElementById('checkoutContent').style.display = '';

  // Render order items table
  const orderItemsTable = document.getElementById('orderItems');
  orderItemsTable.innerHTML = '';

  items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.product?.name || 'Unknown'}</td>
      <td>${item.quantity}</td>
      <td>${formatMoney(item.price_snapshot * item.quantity)}</td>
    `;
    orderItemsTable.appendChild(tr);
  });

  updateCheckoutSummary();
}

function updateCheckoutSummary() {
  const items = currentCart.items || [];
  let subtotal = 0;

  items.forEach((item) => {
    subtotal += item.price_snapshot * item.quantity;
  });

  const deposit = Math.round(subtotal * 0.3);
  const total = deposit; // Only deposit due now, rest at pickup/delivery

  document.getElementById('summarySubtotal').textContent = formatMoney(subtotal);
  document.getElementById('summaryDeposit').textContent = formatMoney(deposit);
  document.getElementById('summaryTotal').textContent = formatMoney(total);
}

// Delivery mode change handler
document.getElementById('deliveryMode').addEventListener('change', (e) => {
  const mode = e.target.value;
  const addressBlock = document.getElementById('addressBlock');
  const addressInput = document.getElementById('deliveryAddress');

  if (mode === 'ship') {
    addressBlock.style.display = '';
    addressInput.required = true;
  } else {
    addressBlock.style.display = 'none';
    addressInput.required = false;
    addressInput.value = '';
  }
});

// Form submission
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  formError.textContent = '';
  formSuccess.textContent = '';

  const deliveryMode = document.getElementById('deliveryMode').value;
  const deliveryAddress = document.getElementById('deliveryAddress').value.trim();

  if (!deliveryMode) {
    formError.textContent = 'Please select a delivery mode.';
    return;
  }

  if (deliveryMode === 'ship' && !deliveryAddress) {
    formError.textContent = 'Delivery address is required for shipping.';
    return;
  }

  const orderBody = {
    delivery_mode: deliveryMode,
  };

  if (deliveryMode === 'ship') {
    orderBody.address = deliveryAddress;
  }

  try {
    const res = await apiRequest('/orders', 'POST', orderBody, true);
    const order = res.data;
    formSuccess.textContent = 'Order placed successfully!';
    
    setTimeout(() => {
      window.location.href = `order-confirmation.html?id=${order.id}`;
    }, 1000);
  } catch (err) {
    formError.textContent = err.message;
  }
});

setupNav();
loadCart();
