const TOKEN_KEY = 'sivi_token';

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function useAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const payload = token ? decodeJwtPayload(token) : null;
  const username = payload?.username ?? payload?.sub ?? 'User';

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
  }

  return { username, token, logout };
}
