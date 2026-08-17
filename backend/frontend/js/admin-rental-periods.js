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

// ---------- Rental Periods ----------

async function loadRentalPeriods() {
  const listError = document.getElementById('listError');
  listError.textContent = '';
  try {
    const res = await apiRequest('/rental-periods', 'GET', null, true);
    const tbody = document.getElementById('rentalPeriodsTableBody');
    tbody.innerHTML = '';
    res.data.forEach((rp) => {
      const product = productsList.find(p => p.id === rp.product_id);
      const productName = product ? product.name : `Product #${rp.product_id}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${productName}</td>
        <td>${rp.min_duration}</td>
        <td>${rp.max_duration || ''}</td>
        <td>${rp.unit}</td>
        <td>
          <button type="button" data-action="edit" data-id="${rp.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${rp.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

function resetForm() {
  document.getElementById('formTitle').textContent = 'Add Rental Period';
  document.getElementById('rentalPeriodId').value = '';
  document.getElementById('productId').value = '';
  document.getElementById('minDuration').value = '';
  document.getElementById('maxDuration').value = '';
  document.getElementById('unit').value = '';
  document.getElementById('formError').textContent = '';
}

async function startEditRentalPeriod(id) {
  try {
    const res = await apiRequest(`/rental-periods/${id}`, 'GET', null, true);
    const rp = res.data;
    document.getElementById('formTitle').textContent = `Edit Rental Period #${rp.id}`;
    document.getElementById('rentalPeriodId').value = rp.id;
    document.getElementById('productId').value = rp.product_id;
    document.getElementById('minDuration').value = rp.min_duration;
    document.getElementById('maxDuration').value = rp.max_duration || '';
    document.getElementById('unit').value = rp.unit;
  } catch (err) {
    document.getElementById('formError').textContent = err.message;
  }
}

document.getElementById('rentalPeriodForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('formError');
  formError.textContent = '';

  const productId = toInt(document.getElementById('productId').value);
  const minDuration = toInt(document.getElementById('minDuration').value);
  const maxDuration = document.getElementById('maxDuration').value.trim() 
    ? toInt(document.getElementById('maxDuration').value) 
    : null;
  const unit = document.getElementById('unit').value;

  if (!productId || minDuration === null || !unit) {
    formError.textContent = 'Product, Min Duration, and Unit are required';
    return;
  }

  const body = {
    product_id: productId,
    min_duration: minDuration,
    max_duration: maxDuration,
    unit: unit,
  };

  const id = document.getElementById('rentalPeriodId').value;
  try {
    if (id) {
      await apiRequest(`/rental-periods/${id}`, 'PUT', body, true);
    } else {
      await apiRequest('/rental-periods', 'POST', body, true);
    }
    resetForm();
    await loadRentalPeriods();
  } catch (err) {
    formError.textContent = err.message;
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

document.getElementById('rentalPeriodsTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'edit') {
    await startEditRentalPeriod(id);
  } else if (action === 'delete') {
    if (!confirm('Delete this rental period?')) return;
    try {
      await apiRequest(`/rental-periods/${id}`, 'DELETE', null, true);
      await loadRentalPeriods();
    } catch (err) {
      document.getElementById('listError').textContent = err.message;
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
    populateProductSelect();
    await loadRentalPeriods();
  }
})();
