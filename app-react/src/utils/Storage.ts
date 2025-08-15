export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, milliseconds = 604800000): void {
  const expires = new Date(Date.now() + milliseconds).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function removeCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getLocalStorage(key: string): string | null {
  return localStorage.getItem(key);
}

export function setLocalStorage(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeLocalStorage(key: string): void {
  localStorage.removeItem(key);
}
