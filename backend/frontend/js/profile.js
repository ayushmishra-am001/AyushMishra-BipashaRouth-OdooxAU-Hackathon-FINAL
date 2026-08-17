const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84"><rect width="84" height="84" fill="%23e5e7eb"/></svg>';

let pendingImageBase64 = null;

async function loadProfile() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }
  try {
    const res = await apiRequest('/auth/me', 'GET', null, true);
    const u = res.data;
    document.getElementById('name').value = u.name || '';
    document.getElementById('email').value = u.email || '';
    document.getElementById('phone').value = u.phone || '';
    document.getElementById('address').value = u.address || '';
    document.getElementById('avatarImg').src = u.profile_image || DEFAULT_AVATAR;
    if (u.role === 'admin') {
      document.getElementById('adminLink').style.display = '';
    }
  } catch (err) {
    clearToken();
    window.location.href = 'login.html';
  }
}

document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingImageBase64 = reader.result;
    document.getElementById('avatarImg').src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  errorMsg.textContent = '';
  successMsg.textContent = '';
  try {
    const body = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
    };
    if (pendingImageBase64) body.profile_image_base64 = pendingImageBase64;
    await apiRequest('/auth/profile', 'PUT', body, true);
    successMsg.textContent = 'Profile updated.';
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  window.location.href = 'login.html';
});

loadProfile();
