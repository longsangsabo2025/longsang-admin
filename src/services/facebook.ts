/**
 * Facebook SDK Integration Service
 * Provides utilities for Facebook Login, Share, and Page management
 */

// Facebook SDK Types
declare global {
  interface Window {
    FB: {
      init: (params: FBInitParams) => void;
      login: (callback: (response: FBLoginResponse) => void, params?: FBLoginParams) => void;
      logout: (callback: (response: unknown) => void) => void;
      getLoginStatus: (callback: (response: FBLoginResponse) => void) => void;
      api: (path: string, method: string, params: unknown, callback: (response: unknown) => void) => void;
      ui: (params: FBShareParams, callback?: (response: unknown) => void) => void;
      AppEvents: {
        logPageView: () => void;
        logEvent: (eventName: string, valueToSum?: number, parameters?: Record<string, unknown>) => void;
      };
    };
    fbAsyncInit: () => void;
  }
}

interface FBInitParams {
  appId: string;
  cookie: boolean;
  xfbml: boolean;
  version: string;
}

interface FBLoginParams {
  scope?: string;
  return_scopes?: boolean;
}

interface FBLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
    grantedScopes?: string;
  };
}

interface FBShareParams {
  method: 'share' | 'share_open_graph' | 'send';
  href?: string;
  quote?: string;
  hashtag?: string;
}

// Facebook App Configuration
export const FB_CONFIG = {
  APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '1340824257525630',
  API_VERSION: 'v18.0',
  DEFAULT_SCOPES: 'public_profile,email,pages_show_list,pages_read_engagement',
  PAGE_MANAGEMENT_SCOPES: 'pages_manage_posts,pages_read_engagement,pages_show_list',
};

/**
 * Check if Facebook SDK is loaded
 */
export const isFBSDKLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.FB !== 'undefined';
};

/**
 * Wait for Facebook SDK to be ready
 */
export const waitForFBSDK = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isFBSDKLoaded()) {
      resolve();
      return;
    }
    
    window.addEventListener('fb-sdk-ready', () => resolve(), { once: true });
    
    // Timeout fallback
    setTimeout(() => {
      if (isFBSDKLoaded()) {
        resolve();
      }
    }, 5000);
  });
};

/**
 * Get current Facebook login status
 */
export const getFBLoginStatus = (): Promise<FBLoginResponse> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.getLoginStatus((response) => {
      resolve(response);
    });
  });
};

/**
 * Login with Facebook
 */
export const loginWithFacebook = (scopes?: string): Promise<FBLoginResponse> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.login((response) => {
      if (response.status === 'connected') {
        resolve(response);
      } else {
        reject(new Error('Facebook login failed or cancelled'));
      }
    }, {
      scope: scopes || FB_CONFIG.DEFAULT_SCOPES,
      return_scopes: true,
    });
  });
};

/**
 * Logout from Facebook
 */
export const logoutFromFacebook = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.logout(() => {
      resolve();
    });
  });
};

/**
 * Get user profile from Facebook
 */
export const getFBUserProfile = (): Promise<{
  id: string;
  name: string;
  email?: string;
  picture?: { data: { url: string } };
}> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.api('/me', 'GET', { fields: 'id,name,email,picture' }, (response: unknown) => {
      const res = response as { error?: { message: string }; id: string; name: string; email?: string; picture?: { data: { url: string } } };
      if (res.error) {
        reject(new Error(res.error.message));
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Get user's Facebook Pages
 */
export const getFBPages = (): Promise<{
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
  }>;
}> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.api('/me/accounts', 'GET', {}, (response: unknown) => {
      const res = response as { error?: { message: string }; data: Array<{ id: string; name: string; access_token: string; category: string }> };
      if (res.error) {
        reject(new Error(res.error.message));
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Share content to Facebook
 */
export const shareToFacebook = (params: {
  url: string;
  quote?: string;
  hashtag?: string;
}): Promise<{ post_id?: string }> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    window.FB.ui({
      method: 'share',
      href: params.url,
      quote: params.quote,
      hashtag: params.hashtag,
    }, (response: unknown) => {
      const res = response as { post_id?: string; error_message?: string } | undefined;
      if (res && res.post_id) {
        resolve({ post_id: res.post_id });
      } else if (res && res.error_message) {
        reject(new Error(res.error_message));
      } else {
        // User cancelled
        resolve({});
      }
    });
  });
};

/**
 * Post to a Facebook Page
 */
export const postToFacebookPage = (
  pageId: string,
  pageAccessToken: string,
  message: string,
  link?: string
): Promise<{ id: string }> => {
  return new Promise((resolve, reject) => {
    if (!isFBSDKLoaded()) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }
    
    const params: Record<string, string> = {
      message,
      access_token: pageAccessToken,
    };
    
    if (link) {
      params.link = link;
    }
    
    window.FB.api(`/${pageId}/feed`, 'POST', params, (response: unknown) => {
      const res = response as { error?: { message: string }; id: string };
      if (res.error) {
        reject(new Error(res.error.message));
      } else {
        resolve({ id: res.id });
      }
    });
  });
};

/**
 * Log custom event to Facebook Analytics
 */
export const logFBEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
  if (isFBSDKLoaded()) {
    window.FB.AppEvents.logEvent(eventName, undefined, parameters);
  }
};

export default {
  FB_CONFIG,
  isFBSDKLoaded,
  waitForFBSDK,
  getFBLoginStatus,
  loginWithFacebook,
  logoutFromFacebook,
  getFBUserProfile,
  getFBPages,
  shareToFacebook,
  postToFacebookPage,
  logFBEvent,
};
