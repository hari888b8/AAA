let _state = {
  user: JSON.parse(localStorage.getItem('agrihub_user') || 'null'),
  isLoggedIn: !!localStorage.getItem('agrihub_token'),
};
const _listeners = new Set();

export function getState() { return _state; }

export function setState(u) {
  _state = { ..._state, ...u };
  if (u.user !== undefined) {
    if (u.user) localStorage.setItem('agrihub_user', JSON.stringify(u.user));
    else localStorage.removeItem('agrihub_user');
  }
  _listeners.forEach(fn => fn(_state));
}

export function subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

export function getRole() { return _state.user?.role || 'farmer'; }

export function logout() {
  localStorage.removeItem('agrihub_token');
  localStorage.removeItem('agrihub_refresh');
  localStorage.removeItem('agrihub_user');
  setState({ user: null, isLoggedIn: false });
}
