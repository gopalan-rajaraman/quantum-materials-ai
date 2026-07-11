export function saveAuth(data) {
  if (data?.access_token) {
    // We no longer store the token in localStorage since we use HTTP-only cookies.
  }
  if (data?.user && typeof data.user === 'object') {
    localStorage.setItem('user', JSON.stringify(data.user));
  } else if (data?.user_id) {
    localStorage.setItem('user', JSON.stringify({ _id: data.user_id }));
  }
}
 
export function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
 
export function getUserDisplayName(user, fallback = 'Researcher') {
  return (
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email?.split('@')[0] ||
    fallback
  );
}
 
export function clearAuth() {
  // localStorage.removeItem('token'); no longer needed
  localStorage.removeItem('user');
  localStorage.removeItem('datasetCount');
  localStorage.removeItem('draftDatasets');
}

export async function logout(navigate) {
  try {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
  clearAuth();
  if (typeof navigate === 'function') {
    navigate('/login');
  } else {
    window.location.href = '/login';
  }
}
 