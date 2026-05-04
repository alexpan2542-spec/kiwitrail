import type { Dispatch, SetStateAction } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useHomeAuth } from "../../contexts/HomeAuthContext";
import type { MapItem } from "../home/MapItem";

/**
 * Draft files live in CommentsPanel so map-driven parent re-renders do not drop
 * the native file input / lose the change event after ref.click().
 */
export type AddCommentModalProps = {
  open: boolean;
  onClose: () => void;
  item: MapItem;
  backendUrl: string;
  accessToken: string | null;
  onSuccess: () => void;
  draftFiles: File[];
  onDraftFilesChange: Dispatch<SetStateAction<File[]>>;
};

const MODAL_Z = 1300;
const MAX_IMAGES = 3;

const IMAGE_NAME_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i;

function looksLikeImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  const name = f.name?.trim() ?? "";
  if (name && IMAGE_NAME_EXT.test(name)) return true;
  return false;
}

function resolvePublicUrl(origin: string, pathFromApi: string): string {
  const p = pathFromApi.trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${origin.replace(/\/$/, "")}${p.startsWith("/") ? p : `/${p}`}`;
}

async function uploadImage(
  origin: string,
  file: File,
  accessToken: string | null,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, file.name || "image.jpg");

  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${origin}/upload-image`, {
    method: "POST",
    body: fd,
    headers,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      errText
        ? `Image upload failed (${res.status}): ${errText.slice(0, 160)}`
        : `Image upload failed (${res.status})`,
    );
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url || typeof data.url !== "string") {
    throw new Error("Upload response missing url");
  }
  return resolvePublicUrl(origin, data.url);
}

export default function AddCommentModal({
  open,
  onClose,
  item,
  backendUrl,
  accessToken,
  onSuccess,
  draftFiles: files,
  onDraftFilesChange: setFiles,
}: AddCommentModalProps) {
  const { user } = useHomeAuth();
  const titleId = useId();
  const fileInputId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"upload" | "save">("upload");

  useEffect(() => {
    if (!open) {
      setPreviews([]);
      setSubmitting(false);
      return;
    }
    setBody("");
    setRating(5);
    setSubmitError(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files, open]);

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
      dialogRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
    }
  }, [open]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    setFiles((prev) => {
      const next = [...prev];
      for (let i = 0; i < list.length && next.length < MAX_IMAGES; i++) {
        const f = list[i];
        if (!looksLikeImageFile(f)) continue;
        next.push(f);
      }
      return next.slice(0, MAX_IMAGES);
    });
    e.target.value = "";
  };

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const text = body.trim();
    if (!text && files.length === 0) {
      setSubmitError("Enter a comment and/or add up to 3 images.");
      return;
    }

    const origin = backendUrl.replace(/\/$/, "");
    if (!origin) {
      setSubmitError("Backend URL is not configured.");
      return;
    }

    const userName = (user?.name?.trim() || user?.email?.trim() || "Anonymous").slice(
      0,
      200,
    );

    setSubmitting(true);
    setSubmitPhase(files.length > 0 ? "upload" : "save");
    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(origin, files[i], accessToken);
        imageUrls.push(url);
      }

      setSubmitPhase("save");

      const payload = {
        item_type: item.type,
        item_id: item.id,
        user_name: userName,
        rating,
        comment_text: text,
        image_url_1: imageUrls[0] ?? null,
        image_url_2: imageUrls[1] ?? null,
        image_url_3: imageUrls[2] ?? null,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${origin}/comments/add`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(
          errText
            ? `Comment failed (${res.status}): ${errText.slice(0, 200)}`
            : `Comment failed (${res.status})`,
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not post comment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="register-modal__backdrop"
      style={{ zIndex: MODAL_Z }}
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="register-modal__dialog add-comment-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div
          className="register-modal__content card border-0 bg-white"
          data-bs-theme="light"
        >
          <div className="card-header fw-bold d-flex align-items-center border-bottom py-3 bg-white">
            <h2 className="fs-5 mb-0 flex-grow-1 text-truncate" id={titleId}>
              Add comment
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            />
          </div>
          <form onSubmit={(ev) => void handleSubmit(ev)}>
            <div
              className="card-body py-3"
              style={{ maxHeight: "min(60vh, 520px)", overflowY: "auto" }}
            >
              {submitError && (
                <div
                  className="alert alert-danger border-0 py-2 small mb-3"
                  role="alert"
                >
                  {submitError}
                </div>
              )}
              <p className="small text-muted mb-3 text-truncate" title={item.name}>
                {item.name}
              </p>

              <div className="mb-3">
                <label htmlFor="add-comment-body" className="form-label">
                  Comment
                </label>
                <textarea
                  id="add-comment-body"
                  className="form-control"
                  rows={4}
                  value={body}
                  onChange={(ev) => setBody(ev.target.value)}
                  placeholder="Write your comment…"
                  maxLength={8000}
                  disabled={submitting}
                />
              </div>

              <div className="mb-3">
                <div className="form-label">Rating</div>
                <div
                  className="d-flex align-items-center gap-1"
                  role="radiogroup"
                  aria-label="Star rating"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn btn-sm border-0 rounded-0 px-2 py-1 ${
                        rating >= n ? "text-warning" : "text-secondary"
                      }`}
                      style={{ fontSize: "1.35rem", lineHeight: 1 }}
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setRating(n)}
                      disabled={submitting}
                    >
                      ★
                    </button>
                  ))}
                  <span className="small text-muted ms-1">{rating} / 5</span>
                </div>
              </div>

              <div className="mb-0">
                <span className="form-label d-block">Photos</span>
                <span className="form-text text-muted d-block mb-2">
                  Up to {MAX_IMAGES} images. Post uploads each file first, then saves your
                  comment and rating with the returned image URLs.
                </span>
                <input
                  id={fileInputId}
                  type="file"
                  className="visually-hidden"
                  accept="image/*,.heic,.HEIC,.heif,.HEIF"
                  multiple
                  onChange={onPickFiles}
                  disabled={files.length >= MAX_IMAGES || submitting}
                />
                <label
                  className={`btn btn-outline-secondary btn-sm rounded-0 mb-0 ${
                    files.length >= MAX_IMAGES || submitting ? "disabled" : ""
                  }`}
                  htmlFor={fileInputId}
                  aria-disabled={files.length >= MAX_IMAGES || submitting}
                  style={
                    files.length >= MAX_IMAGES || submitting
                      ? { pointerEvents: "none", opacity: 0.65 }
                      : undefined
                  }
                >
                  {files.length >= MAX_IMAGES ? "Maximum photos added" : "Choose photos"}
                </label>
                {files.length > 0 && (
                  <span className="small text-muted ms-2">{files.length} selected</span>
                )}
                {files.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {files.map((file, i) => (
                      <div
                        key={`${file.name}-${file.size}-${i}`}
                        className="position-relative border bg-light"
                        style={{ width: 88, height: 88 }}
                      >
                        {previews[i] ? (
                          <img
                            src={previews[i]}
                            alt=""
                            className="w-100 h-100 d-block"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="small text-muted p-1 d-flex align-items-center justify-content-center h-100">
                            …
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-dark btn-sm position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center rounded-0"
                          style={{
                            width: 22,
                            height: 22,
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                          aria-label="Remove photo"
                          onClick={() => removeAt(i)}
                          disabled={submitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="card-footer bg-white border-top py-2 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-0"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-0"
                disabled={submitting}
              >
                {submitting
                  ? submitPhase === "upload"
                    ? "Uploading photos…"
                    : "Saving comment…"
                  : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
