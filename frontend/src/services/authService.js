import { getAwsConfig } from './awsConfig.js';
import { mockAuth } from './mockAwsService.js';

const AUTH_STORAGE_KEY = 'cloudvault_auth_session';

/**
 * Amazon Cognito User Pool Authentication Service
 * Communicates directly with AWS Cognito Identity Provider endpoint.
 * Zero external library dependencies, 100% lightweight and reliable.
 */

async function callCognito(target, payload) {
  const config = getAwsConfig();
  const region = config.region || 'us-east-1';
  const url = `https://cognito-idp.${region}.amazonaws.com/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.__type ? `${data.__type.split('#').pop()}: ${data.message}` : (data.message || 'Cognito error');
    throw new Error(errorMsg);
  }
  return data;
}

export const authService = {
  /**
   * Register a new user in Amazon Cognito User Pool
   */
  async signUp(email, password) {
    const config = getAwsConfig();
    if (config.demoMode || !config.userPoolId) {
      return mockAuth.signUp(email, password);
    }

    return await callCognito('SignUp', {
      ClientId: config.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email }
      ]
    });
  },

  /**
   * Confirm sign-up with 6-digit verification code sent to user email
   */
  async confirmSignUp(email, confirmationCode) {
    const config = getAwsConfig();
    if (config.demoMode || !config.userPoolId) {
      return mockAuth.confirmSignUp(email, confirmationCode);
    }

    return await callCognito('ConfirmSignUp', {
      ClientId: config.clientId,
      Username: email,
      ConfirmationCode: confirmationCode
    });
  },

  /**
   * Sign in using USER_PASSWORD_AUTH flow
   */
  async signIn(email, password) {
    const config = getAwsConfig();
    if (config.demoMode || !config.userPoolId) {
      const mockResult = await mockAuth.signIn(email, password);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockResult));
      return mockResult;
    }

    const result = await callCognito('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const authResult = result.AuthenticationResult;
    const session = {
      email,
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresAt: Date.now() + (authResult.ExpiresIn * 1000)
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Sign out current user
   */
  signOut() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Get currently authenticated session
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) return null;
      const session = JSON.parse(saved);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        // Expired
        this.signOut();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Get active JWT IdToken for API Gateway Bearer authorization
   */
  getIdToken() {
    const user = this.getCurrentUser();
    return user ? user.idToken : null;
  }
};
