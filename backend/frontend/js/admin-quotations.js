let itemCounter = 0;
let currentViewQuotationId = null;

function formatMoney(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  return '₹' + (paise / 100).toFixed(2);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=admin-quotations.html';
    return;
  }
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

// Load customers and templates for dropdowns
async function loadSelectOptions() {
  try {
    // Load customers from auth/users (assuming endpoint exists for admin to list users)
    // For now, we'll load quotations to get unique customers
    const res = await apiRequest('/quotations', 'GET', null, true);
    const quotations = res.data || [];
    
    // Extract unique customer IDs
    const customerIds = [...new Set(quotations.map(q => q.customer_id))];
    
    // TODO: In a real scenario, fetch full customer list with names
    // For now, we'll just show IDs
    const customerSelect = document.getElementById('customerSelect');
    customerIds.forEach(id => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `Customer #${id}`;
      customerSelect.appendChild(option);
    });

    // Load templates
    const templatesRes = await apiRequest('/quotation-templates', 'GET', null, true);
    const templates = templatesRes.data || [];
    
    const templateSelect = document.getElementById('templateSelect');
    templates.forEach((template) => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      templateSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load options:', err);
  }
}

document.getElementById('createQuotationBtn').addEventListener('click', () => {
  itemCounter = 0;
  document.getElementById('createQuotationForm').reset();
  document.getElementById('itemsList').innerHTML = '';
  document.getElementById('formError').textContent = '';
  
  // Add one empty item row
  addItemRow();
  
  document.getElementById('createQuotationModal').style.display = 'flex';
});

function closeCreateQuotationModal() {
  document.getElementById('createQuotationModal').style.display = 'none';
}

function closeViewQuotationModal() {
  document.getElementById('viewQuotationModal').style.display = 'none';
  currentViewQuotationId = null;
}

document.getElementById('addItemBtn').addEventListener('click', (e) => {
  e.preventDefault();
  addItemRow();
});

function addItemRow() {
  const itemId = itemCounter++;
  const itemsList = document.getElementById('itemsList');
  
  const itemDiv = document.createElement('div');
  itemDiv.className = 'quotation-item-row';
  itemDiv.id = `item-${itemId}`;
  itemDiv.innerHTML = `
    <div class="form-row">
      <label>Product ID</label>
      <input type="number" class="product-id" required placeholder="e.g., 10">
    </div>
    <div class="form-row">
      <label>Description</label>
      <input type="text" class="description" required placeholder="e.g., Wedding Tent 20x30">
    </div>
    <div class="form-row">
      <label>Qty</label>
      <input type="number" class="quantity" required placeholder="1" step="1" min="1">
    </div>
    <div class="form-row">
      <label>Unit Price (₹)</label>
      <input type="number" class="unit-price" required placeholder="0" step="1" min="0">
    </div>
    <button type="button" class="danger remove-item-btn" data-item-id="${itemId}">Remove</button>
  `;
  itemsList.appendChild(itemDiv);

  // Attach remove handler
  itemDiv.querySelector('.remove-item-btn').addEventListener('click', (e) => {
    e.preventDefault();
    itemDiv.remove();
  });
}

document.getElementById('createQuotationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const customerId = parseInt(document.getElementById('customerSelect').value, 10);
  const templateId = document.getElementById('templateSelect').value 
    ? parseInt(document.getElementById('templateSelect').value, 10) 
    : null;
  const formError = document.getElementById('formError');

  if (!customerId) {
    formError.textContent = 'Please select a customer.';
    return;
  }

  // Collect items
  const items = [];
  document.querySelectorAll('.quotation-item-row').forEach((row) => {
    const productId = parseInt(row.querySelector('.product-id').value, 10);
    const description = row.querySelector('.description').value.trim();
    const quantity = parseInt(row.querySelector('.quantity').value, 10);
    const unitPrice = parseInt(row.querySelector('.unit-price').value, 10);

    if (!productId || !description || !quantity || unitPrice === undefined) {
      throw new Error('All item fields are required.');
    }

    items.push({
      product_id: productId,
      description,
      quantity,
      unit_price: unitPrice,
    });
  });

  if (!items.length) {
    formError.textContent = 'At least one item is required.';
    return;
  }

  try {
    await apiRequest('/quotations', 'POST', {
      customer_id: customerId,
      template_id: templateId,
      items,
    }, true);
    
    closeCreateQuotationModal();
    loadQuotations();
  } catch (err) {
    formError.textContent = err.message;
  }
});

async function loadQuotations() {
  const pageError = document.getElementById('pageError');
  try {
    const res = await apiRequest('/quotations', 'GET', null, true);
    const quotations = res.data || [];
    renderQuotations(quotations);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderQuotations(quotations) {
  if (!quotations.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('quotationsTable').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('quotationsTable').style.display = '';

  const tbody = document.getElementById('quotationsList');
  tbody.innerHTML = '';

  quotations.forEach((quotation) => {
    const items = quotation.items || [];
    const itemCount = items.length;
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>#${quotation.id}</td>
      <td>Customer #${quotation.customer_id}</td>
      <td>${itemCount} item(s)</td>
      <td><span class="status-badge status-${quotation.status}">${quotation.status}</span></td>
      <td>${formatDate(quotation.created_at)}</td>
      <td>
        <button class="view-btn" data-id="${quotation.id}" style="font-size:12px; padding:4px 8px;">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachQuotationEventListeners();
}

function attachQuotationEventListeners() {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      try {
        const res = await apiRequest(`/quotations/${id}`, 'GET', null, true);
        const quotation = res.data;
        viewQuotation(quotation);
      } catch (err) {
        document.getElementById('pageError').textContent = err.message;
      }
    });
  });
}

function viewQuotation(quotation) {
  currentViewQuotationId = quotation.id;

  document.getElementById('viewQuotationId').textContent = quotation.id;
  document.getElementById('viewCustomerId').textContent = `Customer #${quotation.customer_id}`;
  document.getElementById('viewStatus').textContent = quotation.status;
  document.getElementById('viewCreated').textContent = formatDate(quotation.created_at);

  // Render items
  const itemsList = document.getElementById('viewItemsList');
  itemsList.innerHTML = '';
  let subtotal = 0;

  (quotation.items || []).forEach((item) => {
    const itemTotal = item.unit_price * item.quantity;
    subtotal += itemTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.product_id}</td>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>${formatMoney(item.unit_price)}</td>
      <td>${formatMoney(itemTotal)}</td>
    `;
    itemsList.appendChild(tr);
  });

  document.getElementById('viewSubtotal').textContent = formatMoney(subtotal);

  // Setup action buttons
  const confirmBtn = document.getElementById('confirmQuotationBtn');
  const deleteBtn = document.getElementById('deleteQuotationBtn');

  confirmBtn.onclick = async () => {
    if (quotation.status === 'confirmed') {
      alert('This quotation is already confirmed.');
      return;
    }
    try {
      const res = await apiRequest(`/quotations/${quotation.id}/confirm`, 'PUT', null, true);
      const order = res.data;
      alert(`Quotation confirmed. Order #${order.id} created (total: ${formatMoney(order.total)}).`);
      closeViewQuotationModal();
      loadQuotations();
    } catch (err) {
      alert('Error confirming quotation: ' + err.message);
    }
  };

  deleteBtn.onclick = async () => {
    if (confirm('Delete this quotation? This cannot be undone.')) {
      try {
        await apiRequest(`/quotations/${quotation.id}`, 'DELETE', null, true);
        closeViewQuotationModal();
        loadQuotations();
      } catch (err) {
        alert('Error deleting quotation: ' + err.message);
      }
    }
  };

  document.getElementById('viewQuotationModal').style.display = 'flex';
}

// Close modals on background click
document.getElementById('createQuotationModal').addEventListener('click', (e) => {
  if (e.target.id === 'createQuotationModal') {
    closeCreateQuotationModal();
  }
});

document.getElementById('viewQuotationModal').addEventListener('click', (e) => {
  if (e.target.id === 'viewQuotationModal') {
    closeViewQuotationModal();
  }
});

setupNav();
loadSelectOptions();
loadQuotations();
