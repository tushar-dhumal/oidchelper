let config = {
  client_id: '',
  client_secret: '',
  redirect_uri: window.location.origin.replace('http:', 'https:') + '/callback.html',
  discovery_endpoint: '',
  scope: 'openid profile email',
  authorization_endpoint: null, // Will be populated from discovery
  token_endpoint: null, // Will be populated from discovery
};

function saveConfig() {
  localStorage.setItem('oidc_config', JSON.stringify(config));
}

function loadConfig() {
  const savedConfig = localStorage.getItem('oidc_config');
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      config = { ...config, ...parsedConfig };
      
      if (document.getElementById('client_id')) {
        document.getElementById('client_id').value = config.client_id || '';
      }
      if (document.getElementById('client_secret')) {
        document.getElementById('client_secret').value = config.client_secret || '';
      }
      if (document.getElementById('discovery_endpoint')) {
        document.getElementById('discovery_endpoint').value = config.discovery_endpoint || '';
      }
      if (document.getElementById('scope')) {
        document.getElementById('scope').value = config.scope || 'openid profile email';
      }
      if (document.getElementById('state')) {
        document.getElementById('state').value = config.state || '';
      }
    } catch (e) {
      console.error('Error parsing saved config:', e);
    }
  }
}

function updateConfigFromForm() {
  config.client_id = document.getElementById('client_id').value.trim();
  config.client_secret = document.getElementById('client_secret').value.trim(); // Optional
  config.discovery_endpoint = document.getElementById('discovery_endpoint').value.trim();
  config.scope = document.getElementById('scope').value.trim() || 'openid profile email';
  config.state = document.getElementById('state').value.trim(); // Optional
  saveConfig();
  return config.client_id && config.discovery_endpoint;
}

async function fetchOidcConfig() {
  try {
    const response = await fetch(config.discovery_endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch OIDC configuration: ${response.status}`);
    }
    const oidcConfig = await response.json();
    
    config.authorization_endpoint = oidcConfig.authorization_endpoint;
    config.token_endpoint = oidcConfig.token_endpoint;
    
    console.log('OIDC configuration loaded:', oidcConfig);
    return oidcConfig;
  } catch (error) {
    console.error('Error fetching OIDC configuration:', error);
    document.body.innerHTML = `<h1>Error</h1><p>Failed to load OIDC configuration: ${error.message}</p>`;
    throw error;
  }
}

function generateRandomString(length = 64) {
  try {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    
    // Check if crypto API is available
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint8Array(length);
      window.crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
      }
    } else {
      // Fallback for browsers without crypto support
      console.warn('Crypto API not available, using Math.random fallback');
      for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
    }
    return result;
  } catch (error) {
    console.error('Error generating random string:', error);
    // Simple fallback
    let result = '';
    for (let i = 0; i < length; i++) {
      result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[
        Math.floor(Math.random() * 66)
      ];
    }
    return result;
  }
}

async function sha256(plain) {
  try {
    // Check if crypto.subtle is available
    if (!window.crypto || !window.crypto.subtle) {
      console.error('Web Crypto API not available');
      // Fallback to a simple hash for demo purposes
      return btoa(plain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error('SHA-256 hashing failed:', error);
    // Fallback to a simple hash for demo purposes
    return btoa(plain).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

async function login() {
  try {
    if (!updateConfigFromForm()) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!config.authorization_endpoint) {
      await fetchOidcConfig();
    }
    
    const code_verifier = generateRandomString();
    const code_challenge = await sha256(code_verifier);

    localStorage.setItem('pkce_code_verifier', code_verifier);
    
    if (config.state) {
      localStorage.setItem('oidc_state', config.state);
    }
const params = new URLSearchParams({
  response_type: 'code',
  client_id: config.client_id,
  redirect_uri: config.redirect_uri,
  scope: config.scope,
  code_challenge: code_challenge,
  code_challenge_method: 'S256'
});

if (config.client_secret) {
  params.append('client_secret', config.client_secret);
}

if (config.state) {
  params.append('state', config.state);
}

    window.location.href = `${config.authorization_endpoint}?${params.toString()}`;
  } catch (error) {
    console.error('Login failed:', error);
    alert(`Login failed: ${error.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
});
