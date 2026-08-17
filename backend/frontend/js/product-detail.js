const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e5e7eb"/></svg>';
const UNIT_LABELS = { hour: 'Per Hour', day: 'Per Day', week: 'Per Week', month: 'Per Month' };

function formatMoney(paise) {
  if (paise === null || paise === undefined) return '—';
  return '₹' + (paise / 100).toFixed(2);
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);
  return Number.isNaN(id) ? null : id;
}

function setupNav() {
  const loggedIn = !!getToken();
  document.getElementById('cartLink').style.display = loggedIn ? '' : 'none';
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

let currentProduct = null;

async function loadProduct() {
  const id = getProductId();
  const loadError = document.getElementById('loadError');
  if (!id) {
    loadError.textContent = 'Invalid product.';
    return;
  }
  try {
    const res = await apiRequest(`/products/${id}`, 'GET', null, true);
    currentProduct = res.data;
    renderProduct(currentProduct);
  } catch (err) {
    loadError.textContent = err.message;
  }
}

function renderProduct(p) {
  document.getElementById('productContent').style.display = '';
  document.getElementById('productImg').src = p.image || PLACEHOLDER_IMG;
  document.getElementById('productImg').onerror = function () { this.src = PLACEHOLDER_IMG; };
  document.getElementById('productName').textContent = p.name + (p.active === false ? ' (Inactive)' : '');
  document.getElementById('productCategory').textContent = p.category || 'Uncategorized';
  document.getElementById('productDescription').textContent = p.description || '';

  const priceTableBody = document.getElementById('priceTableBody');
  priceTableBody.innerHTML = '';
  Object.keys(UNIT_LABELS).forEach((unit) => {
    const price = p.pricing ? p.pricing[unit] : null;
    if (price === null || price === undefined) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${UNIT_LABELS[unit]}</td><td>${formatMoney(price)}</td>`;
    priceTableBody.appendChild(tr);
  });

  if (p.rental_periods && p.rental_periods.length) {
    document.getElementById('periodsBlock').style.display = '';
    const list = document.getElementById('periodsList');
    list.innerHTML = '';
    p.rental_periods.forEach((rp) => {
      const li = document.createElement('li');
      const max = rp.max_duration ? `–${rp.max_duration}` : '+';
      li.textContent = `${rp.min_duration}${max} ${rp.unit}(s)`;
      list.appendChild(li);
    });
  }

  if (p.variants && p.variants.length) {
    document.getElementById('variantBlock').style.display = '';
    const select = document.getElementById('variantSelect');
    select.innerHTML = '<option value="">None</option>';
    p.variants.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      const deltaText = v.price_delta ? ` (${v.price_delta > 0 ? '+' : ''}${formatMoney(v.price_delta)})` : '';
      opt.textContent = `${v.attribute_name}: ${v.attribute_value}${deltaText}`;
      select.appendChild(opt);
    });
  }
}

document.getElementById('addToCartForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cartError = document.getElementById('cartError');
  const cartSuccess = document.getElementById('cartSuccess');
  cartError.textContent = '';
  cartSuccess.textContent = '';

  if (!getToken()) {
    window.location.href = `login.html?redirect=product-detail.html?id=${getProductId()}`;
    return;
  }

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const qty = parseInt(document.getElementById('qty').value, 10);
  const variantSelect = document.getElementById('variantSelect');
  const variantId = variantSelect && variantSelect.value ? parseInt(variantSelect.value, 10) : null;

  if (!startDate || !endDate) {
    cartError.textContent = 'Please choose start and end dates.';
    return;
  }
  if (startDate >= endDate) {
    cartError.textContent = 'Start date must be before end date.';
    return;
  }

  const body = {
    product_id: currentProduct.id,
    start_date: startDate,
    end_date: endDate,
    qty,
  };
  if (variantId) body.variant_id = variantId;

  try {
    await apiRequest('/cart/items', 'POST', body, true);
    cartSuccess.textContent = 'Added to cart.';
  } catch (err) {
    cartError.textContent = err.message;
  }
});

setupNav();
loadProduct();
