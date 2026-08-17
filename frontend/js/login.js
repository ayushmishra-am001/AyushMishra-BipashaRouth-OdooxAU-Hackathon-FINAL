document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = '';
  try {
    const res = await apiRequest('/auth/login', 'POST', { email, password }, false);
    setToken(res.data.token);
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.location.href = redirect;
    } else if (res.data.user.role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      // Every customer login lands on browse — profile is a page they
      // navigate to on their own, not a stop on the way in.
      window.location.href = 'browse.html';
    }
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
