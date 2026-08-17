const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="165"><rect width="220" height="165" fill="%23e5e7eb"/></svg>';

function formatMoney(paise) {
  if (paise === null || paise === undefined) return '—';
  return '₹' + (paise / 100).toFixed(2);
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

function lowestPrice(pricing) {
  const values = Object.values(pricing || {}).filter((v) => v !== null && v !== undefined);
  if (!values.length) return null;
  return Math.min(...values);
}

async function loadProducts(category) {
  const listError = document.getElementById('listError');
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  listError.textContent = '';
  grid.innerHTML = '';
  emptyState.style.display = 'none';

  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiRequest('/products' + qs, 'GET', null, true);
    const products = res.data || [];

    if (!products.length) {
      emptyState.style.display = '';
      return;
    }

    products.forEach((p) => {
      const a = document.createElement('a');
      a.className = 'product-card';
      a.href = `product-detail.html?id=${p.id}`;
      const price = lowestPrice(p.pricing);
      a.innerHTML = `
        <div class="body">
          <h3>${p.name}</h3>
          <div class="cat">${p.category || 'Uncategorized'}</div>
          <div class="price">${price !== null ? 'From ' + formatMoney(price) : 'Price on request'}</div>
          ${p.active === false ? '<div class="inactive-tag">Inactive</div>' : ''}
        </div>`;

      // Built as a real element (not an HTML string) so the data-URI placeholder's
      // own quote characters can never break the markup, however it's assigned.
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = p.image || PLACEHOLDER_IMG;
      img.alt = p.name;
      img.onerror = function () { this.onerror = null; this.src = PLACEHOLDER_IMG; };
      a.prepend(img);

      grid.appendChild(a);
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

document.getElementById('applyFilterBtn').addEventListener('click', () => {
  const category = document.getElementById('categoryFilter').value.trim();
  loadProducts(category);
});

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.getElementById('categoryFilter').value = '';
  loadProducts();
});

setupNav();
loadProducts();
