let currentEditTemplateId = null;

function setupNav() {
  const loggedIn = !!getToken();
  if (!loggedIn) {
    window.location.href = 'login.html?redirect=admin-quotation-templates.html';
    return;
  }
  document.getElementById('logoutLink').style.display = '';
}

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

document.getElementById('createTemplateBtn').addEventListener('click', () => {
  currentEditTemplateId = null;
  document.getElementById('modalTitle').textContent = 'Create Template';
  document.getElementById('templateForm').reset();
  document.getElementById('formError').textContent = '';
  document.getElementById('templateModal').style.display = 'flex';
});

document.getElementById('templateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('templateName').value.trim();
  const header_text = document.getElementById('templateHeader').value.trim();
  const footer_text = document.getElementById('templateFooter').value.trim();
  const formError = document.getElementById('formError');

  if (!name) {
    formError.textContent = 'Template name is required.';
    return;
  }

  try {
    if (currentEditTemplateId) {
      // Update
      await apiRequest(`/quotation-templates/${currentEditTemplateId}`, 'PUT', {
        name,
        header_text: header_text || null,
        footer_text: footer_text || null,
      }, true);
    } else {
      // Create
      await apiRequest('/quotation-templates', 'POST', {
        name,
        header_text: header_text || null,
        footer_text: footer_text || null,
      }, true);
    }
    closeTemplateModal();
    loadTemplates();
  } catch (err) {
    formError.textContent = err.message;
  }
});

function closeTemplateModal() {
  document.getElementById('templateModal').style.display = 'none';
  currentEditTemplateId = null;
}

async function loadTemplates() {
  const pageError = document.getElementById('pageError');
  try {
    const res = await apiRequest('/quotation-templates', 'GET', null, true);
    const templates = res.data || [];
    renderTemplates(templates);
  } catch (err) {
    pageError.textContent = err.message;
  }
}

function renderTemplates(templates) {
  if (!templates.length) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('templatesTable').style.display = 'none';
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('templatesTable').style.display = '';

  const tbody = document.getElementById('templatesList');
  tbody.innerHTML = '';

  templates.forEach((template) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${template.name}</td>
      <td class="truncate">${template.header_text || '—'}</td>
      <td class="truncate">${template.footer_text || '—'}</td>
      <td>
        <button class="edit-btn" data-id="${template.id}" style="font-size:12px; padding:4px 8px;">Edit</button>
        <button class="delete-btn danger" data-id="${template.id}" style="font-size:12px; padding:4px 8px;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachTemplateEventListeners();
}

function attachTemplateEventListeners() {
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      const res = await apiRequest(`/quotation-templates/${id}`, 'GET', null, true);
      const template = res.data;

      currentEditTemplateId = id;
      document.getElementById('modalTitle').textContent = 'Edit Template';
      document.getElementById('templateName').value = template.name;
      document.getElementById('templateHeader').value = template.header_text || '';
      document.getElementById('templateFooter').value = template.footer_text || '';
      document.getElementById('formError').textContent = '';
      document.getElementById('templateModal').style.display = 'flex';
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = parseInt(btn.dataset.id, 10);
      if (confirm('Delete this template? This cannot be undone.')) {
        try {
          await apiRequest(`/quotation-templates/${id}`, 'DELETE', null, true);
          loadTemplates();
        } catch (err) {
          document.getElementById('pageError').textContent = err.message;
        }
      }
    });
  });
}

// Close modal on background click
document.getElementById('templateModal').addEventListener('click', (e) => {
  if (e.target.id === 'templateModal') {
    closeTemplateModal();
  }
});

setupNav();
loadTemplates();
