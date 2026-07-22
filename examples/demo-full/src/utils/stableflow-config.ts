export function isTestMode(): boolean {
  return new URLSearchParams(window.location.search).get('test') === '1';
}

export function getStableflowApiConfig() {
  if (isTestMode()) {
    return {
      apiUrl: import.meta.env.VITE_STABLEFLOW_TEST_API_URL || 'https://api.stableflow.ai',
      jwtToken: import.meta.env.VITE_STABLEFLOW_TEST_JWT_TOKEN,
    };
  }
  return {
    apiUrl: import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai',
    jwtToken: import.meta.env.VITE_STABLEFLOW_JWT_TOKEN,
  };
}
