let currentPricelistId = null; // pricelist whose items are shown
let editingItemId = null;
let productsList = []; // cache for products

async function guardAdmin() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    const res = await apiRequest('/auth/me', 'GET', null, true);
    if (res.data.role !== 'admin') {
      window.location.href = 'profile.html';
      return false;
    }
    return true;
  } catch (err) {
    clearToken();
    window.location.href = 'login.html';
    return false;
  }
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

// Form field collects rupees (e.g. 499.00); backend stores paise (integer).
function toPaise(value) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? null : Math.round(n * 100);
}
function toRupees(paise) {
  if (paise === null || paise === undefined) return '';
  return (paise / 100).toFixed(2);
}
function formatMoney(paise) {
  if (paise === null || paise === undefined) return '—';
  return '₹' + (paise / 100).toFixed(2);
}

// ---------- Load Products for Dropdown ----------

async function loadProductsList() {
  try {
    const res = await apiRequest('/products', 'GET', null, true);
    productsList = res.data;
  } catch (err) {
    console.error('Failed to load products:', err.message);
  }
}

function populateProductSelect() {
  const select = document.getElementById('productId');
  const current = select.value;
  select.innerHTML = '<option value="">-- Select Product --</option>';
  productsList.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  select.value = current;
}

// ---------- Pricelists ----------

async function loadPricelists() {
  const listError = document.getElementById('listError');
  listError.textContent = '';
  try {
    const res = await apiRequest('/pricelists', 'GET', null, true);
    const tbody = document.getElementById('pricelistsTableBody');
    tbody.innerHTML = '';
    res.data.forEach((pl) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pl.name}</td>
        <td>${pl.is_default ? 'Yes' : 'No'}</td>
        <td>${pl.valid_from || ''}</td>
        <td>${pl.valid_to || ''}</td>
        <td>
          <button type="button" data-action="edit" data-id="${pl.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${pl.id}">Delete</button>
          <button type="button" class="secondary" data-action="items" data-id="${pl.id}" data-name="${pl.name}">Items</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

function resetPricelistForm() {
  document.getElementById('formTitle').textContent = 'Add Price List';
  document.getElementById('pricelistId').value = '';
  document.getElementById('name').value = '';
  document.getElementById('validFrom').value = '';
  document.getElementById('validTo').value = '';
  document.getElementById('isDefault').checked = false;
  document.getElementById('formError').textContent = '';
}

async function startEditPricelist(id) {
  try {
    const res = await apiRequest(`/pricelists/${id}`, 'GET', null, true);
    const pl = res.data;
    document.getElementById('formTitle').textContent = `Edit Price List #${pl.id}`;
    document.getElementById('pricelistId').value = pl.id;
    document.getElementById('name').value = pl.name || '';
    document.getElementById('validFrom').value = pl.valid_from || '';
    document.getElementById('validTo').value = pl.valid_to || '';
    document.getElementById('isDefault').checked = !!pl.is_default;
  } catch (err) {
    document.getElementById('formError').textContent = err.message;
  }
}

document.getElementById('pricelistForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('formError');
  formError.textContent = '';

  const body = {
    name: document.getElementById('name').value.trim(),
    valid_from: document.getElementById('validFrom').value || null,
    valid_to: document.getElementById('validTo').value || null,
    is_default: document.getElementById('isDefault').checked,
  };

  const id = document.getElementById('pricelistId').value;
  try {
    if (id) {
      await apiRequest(`/pricelists/${id}`, 'PUT', body, true);
    } else {
      await apiRequest('/pricelists', 'POST', body, true);
    }
    resetPricelistForm();
    await loadPricelists();
  } catch (err) {
    formError.textContent = err.message;
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetPricelistForm);

document.getElementById('pricelistsTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id, name } = btn.dataset;

  if (action === 'edit') {
    await startEditPricelist(id);
  } else if (action === 'delete') {
    if (!confirm('Delete this price list?')) return;
    try {
      await apiRequest(`/pricelists/${id}`, 'DELETE', null, true);
      await loadPricelists();
      if (currentPricelistId === Number(id)) hideItems();
    } catch (err) {
      document.getElementById('listError').textContent = err.message;
    }
  } else if (action === 'items') {
    await showItems(Number(id), name);
  }
});

// ---------- Items ----------

function hideItems() {
  currentPricelistId = null;
  document.getElementById('itemsCard').style.display = 'none';
}

function resetItemForm() {
  editingItemId = null;
  document.getElementById('itemId').value = '';
  document.getElementById('productId').value = '';
  document.getElementById('unit').value = '';
  document.getElementById('price').value = '';
  document.getElementById('itemFormError').textContent = '';
}

async function showItems(pricelistId, pricelistName) {
  currentPricelistId = pricelistId;
  document.getElementById('itemsCard').style.display = 'block';
  document.getElementById('itemsPricelistName').textContent = pricelistName;
  resetItemForm();
  populateProductSelect();
  await loadItems();
}

async function loadItems() {
  if (!currentPricelistId) return;
  const tbody = document.getElementById('itemsTableBody');
  try {
    const res = await apiRequest(`/pricelists/${currentPricelistId}/items`, 'GET', null, true);
    tbody.innerHTML = '';
    res.data.forEach((item) => {
      const product = productsList.find(p => p.id === item.product_id);
      const productName = product ? product.name : `Product #${item.product_id}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${productName}</td>
        <td>${item.unit}</td>
        <td>${formatMoney(item.price)}</td>
        <td>
          <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${item.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    document.getElementById('itemFormError').textContent = err.message;
  }
}

document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const itemFormError = document.getElementById('itemFormError');
  itemFormError.textContent = '';
  if (!currentPricelistId) return;

  const body = {
    product_id: toInt(document.getElementById('productId').value),
    unit: document.getElementById('unit').value,
    price: toPaise(document.getElementById('price').value),
  };

  if (!body.product_id || !body.unit || body.price === null) {
    itemFormError.textContent = 'All fields are required';
    return;
  }

  try {
    if (editingItemId) {
      await apiRequest(`/pricelists/${currentPricelistId}/items/${editingItemId}`, 'PUT', body, true);
    } else {
      await apiRequest(`/pricelists/${currentPricelistId}/items`, 'POST', body, true);
    }
    resetItemForm();
    await loadItems();
  } catch (err) {
    itemFormError.textContent = err.message;
  }
});

document.getElementById('cancelItemEditBtn').addEventListener('click', resetItemForm);

document.getElementById('itemsTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'delete') {
    if (!confirm('Delete this item?')) return;
    try {
      await apiRequest(`/pricelists/${currentPricelistId}/items/${id}`, 'DELETE', null, true);
      await loadItems();
    } catch (err) {
      document.getElementById('itemFormError').textContent = err.message;
    }
  } else if (action === 'edit') {
    try {
      const res = await apiRequest(`/pricelists/${currentPricelistId}/items/${id}`, 'GET', null, true);
      const item = res.data;
      editingItemId = item.id;
      document.getElementById('itemId').value = item.id;
      document.getElementById('productId').value = item.product_id;
      document.getElementById('unit').value = item.unit;
      document.getElementById('price').value = toRupees(item.price);
    } catch (err) {
      document.getElementById('itemFormError').textContent = err.message;
    }
  }
});

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

(async () => {
  const ok = await guardAdmin();
  if (ok) {
    await loadProductsList();
    await loadPricelists();
  }
})();
