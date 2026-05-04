/** Minimal typings for Google Identity Services (gsi/client) OAuth2 token client */

export {};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: "" | "none" }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
          revoke: (accessToken: string, done: () => void) => void;
        };
      };
    };
  }
}
