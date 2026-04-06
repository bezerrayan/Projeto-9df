/**
 * API Service - GEAR 9º DF
 * Centraliza todas as chamadas para o backend Railway.
 */

// URL do backend (permite override por meta ou localStorage)
const metaApiBase = document.querySelector('meta[name="api-base"]')?.getAttribute('content');
const storedApiBase = localStorage.getItem('gear9df_api_base');

const API_BASE_URL = metaApiBase || storedApiBase || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://projeto-9df-production.up.railway.app/api'
);

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Incluir token de autenticação se existir
  const token = localStorage.getItem('gear9df_token');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // Configurações padrão para JSON
  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };
    if (typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Se o token expirou ou é inválido
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('gear9df_token');
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = 'login.html';
        }
      }
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Tornar global para uso nos outros scripts
window.apiFetch = apiFetch;
window.API_BASE_URL = API_BASE_URL;
