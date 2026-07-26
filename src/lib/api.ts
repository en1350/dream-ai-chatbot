const TOKEN_KEY = "auth_token";

export function authToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

/**
 * Обёртка над fetch, автоматически добавляющая токен вошедшего пользователя
 * в заголовок X-Auth-Token — чтобы бэкенд отдавал данные именно этого аккаунта.
 */
export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("X-Auth-Token", token);
  return fetch(url, { ...options, headers });
}
