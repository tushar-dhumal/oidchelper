let config = {
  client_id: '',
  client_secret: '',
  redirect_uri: window.location.origin + '/callback.html',
  discovery_endpoint: '',
  token_endpoint: null, 
};

function loadConfig() {
  const savedConfig = localStorage.getItem('oidc_config');
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      config = { ...config, ...parsedConfig };
    } catch (e) {
      console.error('Error parsing saved config:', e);
    }
  }
}

async function fetchOidcConfig() {
  try {
    const response = await fetch(config.discovery_endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch OIDC configuration: ${response.status}`);
    }
    const oidcConfig = await response.json();
    
    config.token_endpoint = oidcConfig.token_endpoint;
    
    console.log('OIDC configuration loaded:', oidcConfig);
    return oidcConfig;
  } catch (error) {
    console.error('Error fetching OIDC configuration:', error);
    document.getElementById('loading').textContent = `Error: Failed to load OIDC configuration: ${error.message}`;
    throw error;
  }
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    error_description: params.get('error_description')
  };
}

async function exchangeCodeForTokens(code, code_verifier) {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.client_id,
    code: code,
    redirect_uri: config.redirect_uri,
    code_verifier: code_verifier
  });
  
  if (config.client_secret) {
    tokenParams.append('client_secret', config.client_secret);
  }

  try {
    const response = await fetch(config.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    const tokenResponse = await response.json();
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    
    const formattedResponse = JSON.stringify(tokenResponse, null, 2);
    document.getElementById('token-response').textContent = formattedResponse;
    
    if (tokenResponse.access_token) {
      localStorage.setItem('access_token', tokenResponse.access_token);
    }
    if (tokenResponse.id_token) {
      localStorage.setItem('id_token', tokenResponse.id_token);
    }
    
    return tokenResponse;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    document.getElementById('loading').textContent = 'Error: ' + error.message;
    throw error;
  }
}

async function handleCallback() {
  const params = getUrlParams();
  
  if (params.error) {
    document.getElementById('loading').textContent = `Error: ${params.error} - ${params.error_description || ''}`;
    return;
  }
  
  if (!params.code) {
    document.getElementById('loading').textContent = 'Error: No authorization code received';
    return;
  }
  
  const savedState = localStorage.getItem('oidc_state');
  if (savedState && params.state !== savedState) {
    document.getElementById('loading').textContent = 'Error: State mismatch, possible CSRF attack';
    return;
  }
  
  const code_verifier = localStorage.getItem('pkce_code_verifier');
  if (!code_verifier) {
    document.getElementById('loading').textContent = 'Error: No code verifier found';
    return;
  }
  
  try {
    await exchangeCodeForTokens(params.code, code_verifier);
    localStorage.removeItem('pkce_code_verifier');
  } catch (error) {
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    loadConfig();
    
    if (!config.token_endpoint) {
      await fetchOidcConfig();
    }
    
    await handleCallback();
  } catch (error) {
    console.error('Callback processing failed:', error);
  }
});

