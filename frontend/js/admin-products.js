let currentProductId = null; // product whose variants are shown
let editingVariantId = null;

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

// Form fields collect rupees (e.g. 499.00); backend stores paise (integer).
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

// ---------- Products ----------

async function loadProducts() {
  const listError = document.getElementById('listError');
  listError.textContent = '';
  try {
    const res = await apiRequest('/products', 'GET', null, true);
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    res.data.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category || ''}</td>
        <td>${p.sku || ''}</td>
        <td>${formatMoney(p.base_price)}</td>
        <td>${p.active ? 'Yes' : 'No'}</td>
        <td>
          <button type="button" data-action="edit" data-id="${p.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${p.id}">Delete</button>
          <button type="button" class="secondary" data-action="variants" data-id="${p.id}" data-name="${p.name}">Variants</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

document.getElementById('imageFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const uploadError = document.getElementById('imageUploadError');
  uploadError.textContent = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const res = await apiRequest('/uploads/image', 'POST', { image_base64: reader.result }, true);
      document.getElementById('image').value = res.data.url;
      const preview = document.getElementById('imagePreview');
      preview.src = res.data.url;
      preview.style.display = '';
    } catch (err) {
      uploadError.textContent = err.message;
    }
  };
  reader.onerror = () => { uploadError.textContent = 'Could not read that file.'; };
  reader.readAsDataURL(file);
});

function resetProductForm() {
  document.getElementById('formTitle').textContent = 'Add Product';
  document.getElementById('productId').value = '';
  document.getElementById('name').value = '';
  document.getElementById('sku').value = '';
  document.getElementById('category').value = '';
  document.getElementById('basePrice').value = '';
  document.getElementById('description').value = '';
  document.getElementById('image').value = '';
  document.getElementById('active').checked = true;
  document.getElementById('formError').textContent = '';
  document.getElementById('imageFile').value = '';
  document.getElementById('imageUploadError').textContent = '';
  document.getElementById('imagePreview').style.display = 'none';
}

async function startEditProduct(id) {
  try {
    const res = await apiRequest(`/products/${id}`, 'GET', null, true);
    const p = res.data;
    document.getElementById('formTitle').textContent = `Edit Product #${p.id}`;
    document.getElementById('productId').value = p.id;
    document.getElementById('name').value = p.name || '';
    document.getElementById('sku').value = p.sku || '';
    document.getElementById('category').value = p.category || '';
    document.getElementById('basePrice').value = toRupees(p.base_price);
    document.getElementById('description').value = p.description || '';
    document.getElementById('image').value = p.image || '';
    document.getElementById('active').checked = !!p.active;
    const preview = document.getElementById('imagePreview');
    if (p.image) {
      preview.src = p.image;
      preview.style.display = '';
    } else {
      preview.style.display = 'none';
    }
  } catch (err) {
    document.getElementById('formError').textContent = err.message;
  }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('formError');
  formError.textContent = '';

  const body = {
    name: document.getElementById('name').value.trim(),
    sku: document.getElementById('sku').value.trim() || null,
    category: document.getElementById('category').value.trim() || null,
    base_price: toPaise(document.getElementById('basePrice').value),
    description: document.getElementById('description').value.trim() || null,
    image: document.getElementById('image').value.trim() || null,
    active: document.getElementById('active').checked,
  };

  const id = document.getElementById('productId').value;
  try {
    if (id) {
      await apiRequest(`/products/${id}`, 'PUT', body, true);
    } else {
      await apiRequest('/products', 'POST', body, true);
    }
    resetProductForm();
    await loadProducts();
  } catch (err) {
    formError.textContent = err.message;
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetProductForm);

document.getElementById('productsTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id, name } = btn.dataset;

  if (action === 'edit') {
    await startEditProduct(id);
  } else if (action === 'delete') {
    if (!confirm('Delete this product?')) return;
    try {
      await apiRequest(`/products/${id}`, 'DELETE', null, true);
      await loadProducts();
      if (currentProductId === Number(id)) hideVariants();
    } catch (err) {
      document.getElementById('listError').textContent = err.message;
    }
  } else if (action === 'variants') {
    await showVariants(Number(id), name);
  }
});

// ---------- Variants ----------

function hideVariants() {
  currentProductId = null;
  document.getElementById('variantsCard').style.display = 'none';
}

function resetVariantForm() {
  editingVariantId = null;
  document.getElementById('variantId').value = '';
  document.getElementById('variantAttributeName').value = '';
  document.getElementById('variantAttributeValue').value = '';
  document.getElementById('variantPriceDelta').value = '0';
  document.getElementById('variantStockQty').value = '0';
  document.getElementById('variantFormError').textContent = '';
}

async function showVariants(productId, productName) {
  currentProductId = productId;
  document.getElementById('variantsCard').style.display = 'block';
  document.getElementById('variantsProductName').textContent = productName;
  resetVariantForm();
  await loadVariants();
}

async function loadVariants() {
  if (!currentProductId) return;
  const tbody = document.getElementById('variantsTableBody');
  try {
    const res = await apiRequest(`/products/${currentProductId}/variants`, 'GET', null, true);
    tbody.innerHTML = '';
    res.data.forEach((v) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.attribute_name}</td>
        <td>${v.attribute_value}</td>
        <td>${formatMoney(v.price_delta)}</td>
        <td>${v.stock_qty}</td>
        <td>
          <button type="button" data-action="edit" data-id="${v.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${v.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    document.getElementById('variantFormError').textContent = err.message;
  }
}

document.getElementById('variantForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const variantFormError = document.getElementById('variantFormError');
  variantFormError.textContent = '';
  if (!currentProductId) return;

  const body = {
    attribute_name: document.getElementById('variantAttributeName').value.trim(),
    attribute_value: document.getElementById('variantAttributeValue').value.trim(),
    price_delta: toPaise(document.getElementById('variantPriceDelta').value) ?? 0,
    stock_qty: toInt(document.getElementById('variantStockQty').value) ?? 0,
  };

  try {
    if (editingVariantId) {
      await apiRequest(`/products/${currentProductId}/variants/${editingVariantId}`, 'PUT', body, true);
    } else {
      await apiRequest(`/products/${currentProductId}/variants`, 'POST', body, true);
    }
    resetVariantForm();
    await loadVariants();
  } catch (err) {
    variantFormError.textContent = err.message;
  }
});

document.getElementById('cancelVariantEditBtn').addEventListener('click', resetVariantForm);

document.getElementById('variantsTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'delete') {
    if (!confirm('Delete this variant?')) return;
    try {
      await apiRequest(`/products/${currentProductId}/variants/${id}`, 'DELETE', null, true);
      await loadVariants();
    } catch (err) {
      document.getElementById('variantFormError').textContent = err.message;
    }
  } else if (action === 'edit') {
    try {
      const res = await apiRequest(`/products/${currentProductId}/variants/${id}`, 'GET', null, true);
      const v = res.data;
      editingVariantId = v.id;
      document.getElementById('variantId').value = v.id;
      document.getElementById('variantAttributeName').value = v.attribute_name;
      document.getElementById('variantAttributeValue').value = v.attribute_value;
      document.getElementById('variantPriceDelta').value = toRupees(v.price_delta);
      document.getElementById('variantStockQty').value = v.stock_qty;
    } catch (err) {
      document.getElementById('variantFormError').textContent = err.message;
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
  if (ok) await loadProducts();
})();
