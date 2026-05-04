import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { GoogleUserInfo } from "../lib/googleIdentity";

export type HomeAuthContextValue = {
  user: GoogleUserInfo | null;
  accessToken: string | null;
  setSession: (user: GoogleUserInfo | null, accessToken: string | null) => void;
  clearSession: () => void;
  /** Opens the account sign-in choice modal (registered by `HomeAccountMenu`). */
  requestSignIn: () => void;
  registerSignInHandler: (handler: (() => void) | null) => void;
};

const HomeAuthContext = createContext<HomeAuthContextValue | null>(null);

export function HomeAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const signInHandlerRef = useRef<(() => void) | null>(null);

  const registerSignInHandler = useCallback((handler: (() => void) | null) => {
    signInHandlerRef.current = handler;
  }, []);

  const requestSignIn = useCallback(() => {
    signInHandlerRef.current?.();
  }, []);

  const setSession = useCallback(
    (nextUser: GoogleUserInfo | null, token: string | null) => {
      setUser(nextUser);
      setAccessToken(token);
    },
    [],
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    (): HomeAuthContextValue => ({
      user,
      accessToken,
      setSession,
      clearSession,
      requestSignIn,
      registerSignInHandler,
    }),
    [
      user,
      accessToken,
      setSession,
      clearSession,
      requestSignIn,
      registerSignInHandler,
    ],
  );

  return (
    <HomeAuthContext.Provider value={value}>{children}</HomeAuthContext.Provider>
  );
}

export function useHomeAuth(): HomeAuthContextValue {
  const ctx = useContext(HomeAuthContext);
  if (!ctx) {
    throw new Error("useHomeAuth must be used within HomeAuthProvider");
  }
  return ctx;
}
