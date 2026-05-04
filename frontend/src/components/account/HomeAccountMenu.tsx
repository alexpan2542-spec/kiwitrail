import { useCallback, useEffect, useRef, useState } from "react";

import { useHomeAuth } from "../../contexts/HomeAuthContext";
import {
  fetchGoogleUserInfo,
  GOOGLE_OAUTH_CLIENT_ID,
  loadGoogleIdentityScript,
  revokeGoogleAccessToken,
} from "../../lib/googleIdentity";
import { registerCloseHomeAccountMenu } from "../map/homeAccountMenuRegistry";
import { requestCollapseHomeMapLayers } from "../map/homeMapLayersRegistry";

import AccountUserIcon from "./AccountUserIcon";
import SignInChoiceModal from "./SignInChoiceModal";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";

const OVERLAY_Z = 1100;

export default function HomeAccountMenu() {
  const { user, accessToken, setSession, clearSession, registerSignInHandler } =
    useHomeAuth();
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismissOnOutsideClick(menuOpen, rootRef, closeMenu);

  useEffect(() => {
    registerCloseHomeAccountMenu(closeMenu);
    return () => registerCloseHomeAccountMenu(null);
  }, [closeMenu]);

  useEffect(() => {
    registerSignInHandler(() => setSignInModalOpen(true));
    return () => registerSignInHandler(null);
  }, [registerSignInHandler]);

  const runGoogleSignIn = useCallback(async () => {
    if (!GOOGLE_OAUTH_CLIENT_ID) {
      console.error("Missing Google OAuth client ID");
      return;
    }
    setSigningIn(true);
    try {
      await loadGoogleIdentityScript();
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2?.initTokenClient) {
        throw new Error("Google Identity Services OAuth2 is unavailable");
      }

      const client = oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              console.error(
                tokenResponse.error,
                tokenResponse.error_description,
              );
              return;
            }
            const token = tokenResponse.access_token;
            if (!token) return;
            const info = await fetchGoogleUserInfo(token);
            setSession(info, token);
            closeMenu();
          } catch (e) {
            console.error(e);
          } finally {
            setSigningIn(false);
          }
        },
      });

      client.requestAccessToken({ prompt: "" });
    } catch (e) {
      console.error(e);
      setSigningIn(false);
    }
  }, [closeMenu, setSession]);

  const runSignOut = useCallback(() => {
    if (accessToken) {
      revokeGoogleAccessToken(accessToken, () => {
        clearSession();
      });
    } else {
      clearSession();
    }
    closeMenu();
  }, [accessToken, clearSession, closeMenu]);

  return (
    <>
      <div
        ref={rootRef}
        className="kiwi-home-account-wrap position-absolute top-0 end-0"
        style={{ zIndex: OVERLAY_Z }}
      >
        <div className="position-relative">
          <button
            type="button"
            className="btn btn-dark border-0 d-flex align-items-center justify-content-center overflow-hidden p-0 rounded-3"
            style={{ width: 40, height: 40 }}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label={
              user ? `Signed in as ${user.email}` : "Account menu"
            }
            title={user ? user.email : "Account"}
            onClick={() => {
              requestCollapseHomeMapLayers();
              setMenuOpen((open) => !open);
            }}
          >
            <AccountUserIcon
              googlePhotoUrl={user?.picture}
              signedInWithGoogle={Boolean(user)}
            />
          </button>
          {menuOpen && (
            <ul
              className="dropdown-menu show shadow"
              style={{
                position: "absolute",
                top: 0,
                right: "100%",
                left: "auto",
                marginTop: 0,
                marginRight: "0.25rem",
                minWidth: "12rem",
              }}
            >
              {user ? (
                <>
                  <li>
                    <div className="dropdown-item-text small text-muted text-truncate">
                      {user.name}
                    </div>
                    <div className="dropdown-item-text small text-muted text-truncate px-3 pb-2">
                      {user.email}
                    </div>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        closeMenu();
                      }}
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={runSignOut}
                    >
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    disabled={signingIn}
                    onClick={() => {
                      closeMenu();
                      setSignInModalOpen(true);
                    }}
                  >
                    {signingIn ? "Signing in…" : "Sign in"}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <SignInChoiceModal
        open={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onGoogleSignIn={() => {
          void runGoogleSignIn();
        }}
      />
    </>
  );
}
