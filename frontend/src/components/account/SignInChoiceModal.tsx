import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SignInChoiceModalProps = {
  open: boolean;
  onClose: () => void;
  /** Runs after the modal closes (Google Identity Services OAuth). */
  onGoogleSignIn: () => void;
};

const MODAL_Z = 1200;

function GoogleGIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="flex-shrink-0"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleLogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="flex-shrink-0"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.88-3.08.45-1.09-.39-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.45C3.79 15.25 4.51 8.59 9.17 8.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.55-1.31 3.07-2.65 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

export default function SignInChoiceModal({
  open,
  onClose,
  onGoogleSignIn,
}: SignInChoiceModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [appleStub, setAppleStub] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAppleStub(null);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleGoogle = () => {
    onClose();
    onGoogleSignIn();
  };

  const handleAppleStub = () => {
    setAppleStub("Apple Sign In is not available yet — this is a placeholder.");
  };

  return createPortal(
    <div
      className="register-modal__backdrop"
      style={{ zIndex: MODAL_Z }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="register-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="register-modal__content card border-0 bg-white"
          data-bs-theme="light"
        >
          <div className="card-header fw-bold d-flex align-items-center border-bottom py-3 bg-white">
            <h2 className="fs-5 mb-0 flex-grow-1 text-truncate" id={titleId}>
              Sign in
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <div className="card-body py-4">
            <p className="small text-muted mb-3">
              Choose how you would like to sign in.
            </p>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-primary py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogle}
              >
                <GoogleGIcon />
                <span>Sign in with Google</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary py-2 d-flex align-items-center justify-content-center gap-2 text-dark"
                onClick={handleAppleStub}
              >
                <AppleLogoIcon />
                <span>Sign in with Apple</span>
              </button>
            </div>
            {appleStub && (
              <p className="small text-muted mb-0 mt-3" role="status">
                {appleStub}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
