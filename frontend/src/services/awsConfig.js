/**
 * CloudVault AWS Configuration Manager
 * Reads from Vite environment variables (import.meta.env) or localStorage override.
 * This lets the user configure their deployed AWS stack from the UI or via .env.
 */

const STORAGE_KEY = 'cloudvault_aws_config';

const defaultConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT_URL || '',
  demoMode: false
};

export function getAwsConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultConfig, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse saved AWS config from localStorage', e);
  }
  return { ...defaultConfig };
}

export function saveAwsConfig(newConfig) {
  const merged = { ...getAwsConfig(), ...newConfig };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function isConfigured() {
  const cfg = getAwsConfig();
  return Boolean(cfg.userPoolId && cfg.clientId && cfg.apiEndpoint);
}
