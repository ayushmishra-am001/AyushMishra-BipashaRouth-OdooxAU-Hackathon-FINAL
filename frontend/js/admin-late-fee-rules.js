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
  select.innerHTML = '<option value="">-- Global (no specific product) --</option>';
  productsList.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  select.value = current;
}

// ---------- Late Fee Rules ----------

async function loadLateFeeRules() {
  const listError = document.getElementById('listError');
  listError.textContent = '';
  try {
    const res = await apiRequest('/late-fee-rules', 'GET', null, true);
    const tbody = document.getElementById('lateFeeRulesTableBody');
    tbody.innerHTML = '';
    res.data.forEach((rule) => {
      const product = productsList.find(p => p.id === rule.product_id);
      const productName = rule.product_id ? (product ? product.name : `Product #${rule.product_id}`) : 'Global (all products)';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${productName}</td>
        <td>${rule.rate_type}</td>
        <td>${rule.rate_amount}</td>
        <td>${rule.grace_period_hours}</td>
        <td>${rule.max_fee != null ? rule.max_fee : ''}</td>
        <td>
          <button type="button" data-action="edit" data-id="${rule.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${rule.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

function resetForm() {
  document.getElementById('formTitle').textContent = 'Add Late Fee Rule';
  document.getElementById('lateFeeRuleId').value = '';
  document.getElementById('productId').value = '';
  document.getElementById('rateType').value = '';
  document.getElementById('rateAmount').value = '';
  document.getElementById('gracePeriodHours').value = '';
  document.getElementById('maxFee').value = '';
  document.getElementById('formError').textContent = '';
}

async function startEditLateFeeRule(id) {
  try {
    const res = await apiRequest(`/late-fee-rules/${id}`, 'GET', null, true);
    const rule = res.data;
    document.getElementById('formTitle').textContent = `Edit Late Fee Rule #${rule.id}`;
    document.getElementById('lateFeeRuleId').value = rule.id;
    document.getElementById('productId').value = rule.product_id || '';
    document.getElementById('rateType').value = rule.rate_type;
    document.getElementById('rateAmount').value = rule.rate_amount;
    document.getElementById('gracePeriodHours').value = rule.grace_period_hours;
    document.getElementById('maxFee').value = rule.max_fee != null ? rule.max_fee : '';
  } catch (err) {
    document.getElementById('formError').textContent = err.message;
  }
}

document.getElementById('lateFeeRuleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('formError');
  formError.textContent = '';

  const productId = document.getElementById('productId').value.trim()
    ? toInt(document.getElementById('productId').value)
    : null;
  const rateType = document.getElementById('rateType').value;
  const rateAmount = toInt(document.getElementById('rateAmount').value);
  const gracePeriodHours = document.getElementById('gracePeriodHours').value.trim()
    ? toInt(document.getElementById('gracePeriodHours').value)
    : 0;
  const maxFee = document.getElementById('maxFee').value.trim()
    ? toInt(document.getElementById('maxFee').value)
    : null;

  if (!rateType || rateAmount === null) {
    formError.textContent = 'Rate Type and Rate Amount are required';
    return;
  }

  const body = {
    product_id: productId,
    rate_type: rateType,
    rate_amount: rateAmount,
    grace_period_hours: gracePeriodHours,
    max_fee: maxFee,
  };

  const id = document.getElementById('lateFeeRuleId').value;
  try {
    if (id) {
      await apiRequest(`/late-fee-rules/${id}`, 'PUT', body, true);
    } else {
      await apiRequest('/late-fee-rules', 'POST', body, true);
    }
    resetForm();
    await loadLateFeeRules();
  } catch (err) {
    formError.textContent = err.message;
  }
});

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

document.getElementById('lateFeeRulesTableBody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'edit') {
    await startEditLateFeeRule(id);
  } else if (action === 'delete') {
    if (!confirm('Delete this late fee rule?')) return;
    try {
      await apiRequest(`/late-fee-rules/${id}`, 'DELETE', null, true);
      await loadLateFeeRules();
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
    await loadLateFeeRules();
  }
})();
