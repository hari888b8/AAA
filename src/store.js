let _state = {
  user: JSON.parse(localStorage.getItem('agrihub_user') || 'null'),
  isLoggedIn: !!localStorage.getItem('agrihub_token'),
  roles: JSON.parse(localStorage.getItem('agrihub_roles') || '[]'),
  activeRole: localStorage.getItem('agrihub_active_role') || null,
};
const _listeners = new Set();

export function getState() { return _state; }

export function setState(u) {
  _state = { ..._state, ...u };
  if (u.user !== undefined) {
    if (u.user) localStorage.setItem('agrihub_user', JSON.stringify(u.user));
    else localStorage.removeItem('agrihub_user');
  }
  if (u.roles !== undefined) {
    localStorage.setItem('agrihub_roles', JSON.stringify(u.roles));
  }
  if (u.activeRole !== undefined) {
    if (u.activeRole) localStorage.setItem('agrihub_active_role', u.activeRole);
    else localStorage.removeItem('agrihub_active_role');
  }
  _listeners.forEach(fn => fn(_state));
}

export function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

export function getRole() {
  return _state.activeRole || _state.user?.role || 'farmer';
}

export function getRoles() {
  return _state.roles || [];
}

export function hasRole(role) {
  const roles = getRoles();
  if (roles.length === 0) return getRole() === role;
  return roles.some(r => r.role === role);
}

export function logout() {
  localStorage.removeItem('agrihub_token');
  localStorage.removeItem('agrihub_refresh');
  localStorage.removeItem('agrihub_user');
  localStorage.removeItem('agrihub_roles');
  localStorage.removeItem('agrihub_active_role');
  setState({ user: null, isLoggedIn: false, roles: [], activeRole: null });
}
