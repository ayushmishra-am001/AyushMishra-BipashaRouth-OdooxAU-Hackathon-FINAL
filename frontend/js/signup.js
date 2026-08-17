const roleSelect = document.getElementById('role');
const adminKeyField = document.getElementById('adminKeyField');

// Admin key field only makes sense (and is only required) when "Admin" is
// picked — keep it hidden and out of the way otherwise.
roleSelect.addEventListener('change', () => {
  adminKeyField.style.display = roleSelect.value === 'admin' ? 'block' : 'none';
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const role = roleSelect.value;
  const adminKey = document.getElementById('adminKey').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = '';
  try {
    const payload = { name, email, phone, password, role };
    if (role === 'admin') payload.adminKey = adminKey;
    const res = await apiRequest('/auth/signup', 'POST', payload, false);
    setToken(res.data.token);
    window.location.href = res.data.user.role === 'admin' ? 'admin-dashboard.html' : 'browse.html';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
