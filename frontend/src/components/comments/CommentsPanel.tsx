import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useHomeAuth } from "../../contexts/HomeAuthContext";
import type { MapItem } from "../home/MapItem";

import AddCommentModal from "./AddCommentModal";

export type CommentsPanelProps = {
  item: MapItem;
  top: number;
  left: number;
  width?: number;
  height?: number;
  /** API origin (e.g. `import.meta.env.VITE_BACKEND_URL`). Trailing slash stripped. */
  backendUrl?: string;
  /** If set, invoked instead of opening the built-in add-comment modal. */
  onAddComment?: () => void;
};

/** Loose shape so different backend JSON layouts still render. */
export type CommentRecord = {
  id?: number | string;
  body?: string;
  text?: string;
  content?: string;
  comment_text?: string;
  author?: string;
  user_name?: string;
  user?: string;
  created_at?: string;
  createdAt?: string;
  image_url_1?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
};

function normalizeCommentsPayload(data: unknown): CommentRecord[] {
  if (Array.isArray(data)) return data as CommentRecord[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["comments", "items", "data", "results"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as CommentRecord[];
    }
  }
  return [];
}

function commentBody(c: CommentRecord): string {
  return (c.body ?? c.text ?? c.content ?? c.comment_text ?? "").trim();
}

function resolveCommentAssetUrl(origin: string, pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = origin.replace(/\/$/, "");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

function commentImageSrcs(c: CommentRecord): string[] {
  const out: string[] = [];
  for (const key of ["image_url_1", "image_url_2", "image_url_3"] as const) {
    const u = c[key];
    if (typeof u === "string" && u.trim()) out.push(u.trim());
  }
  return out;
}

function commentAuthor(c: CommentRecord): string {
  const a = c.author ?? c.user_name ?? c.user;
  return typeof a === "string" && a.trim() ? a.trim() : "Anonymous";
}

function commentTime(c: CommentRecord): string | null {
  const t = c.created_at ?? c.createdAt;
  if (!t || typeof t !== "string") return null;
  try {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return t;
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return t;
  }
}

function buildCommentsUrl(base: string, item: MapItem): string {
  const origin = base.replace(/\/$/, "");
  const type = encodeURIComponent(item.type);
  const id = encodeURIComponent(String(item.id));
  return `${origin}/comments/${type}/${id}`;
}

/** Flat index of an image inside `comments[commentIndex]` (0-based slot in that comment). */
function flatIndexForImage(
  comments: CommentRecord[],
  commentIndex: number,
  imageSlotInComment: number,
): number {
  let k = 0;
  for (let i = 0; i < commentIndex; i++) {
    k += commentImageSrcs(comments[i]).length;
  }
  return k + imageSlotInComment;
}

function buildAllCommentGalleryUrls(
  comments: CommentRecord[],
  apiOrigin: string,
): string[] {
  if (!apiOrigin) return [];
  const out: string[] = [];
  for (const c of comments) {
    const raw = commentImageSrcs(c);
    for (const ru of raw) {
      const url = resolveCommentAssetUrl(apiOrigin, ru);
      if (url) out.push(url);
    }
  }
  return out;
}

const GALLERY_Z = 1400;
/** Fixed modal frame; image scales inside without shrinking the dialog. */
const GALLERY_MODAL_W = "min(96vw, 1100px)";

/** All images for this item; left/right wrap. */
function CommentImageGalleryModal({
  items,
  index,
  onClose,
  onGoPrev,
  onGoNext,
}: {
  items: string[];
  index: number;
  onClose: () => void;
  onGoPrev: () => void;
  onGoNext: () => void;
}) {
  const titleId = useId();
  const n = items.length;
  const current = items[index] ?? "";
  const wrap = n > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!wrap) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onGoPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onGoNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onGoPrev, onGoNext, wrap]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="register-modal__backdrop"
      style={{ zIndex: GALLERY_Z }}
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="register-modal__content card border-0 bg-white d-flex flex-column"
        data-bs-theme="light"
        style={{
          width: GALLERY_MODAL_W,
          height: "min(75vh, 640px, 92vh)",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className="card-header fw-bold d-flex align-items-center border-bottom py-2 px-3 bg-white flex-shrink-0">
          <h2 className="fs-6 mb-0 flex-grow-1 text-truncate text-dark" id={titleId}>
            {n > 0 ? `Photo ${index + 1} of ${n}` : "Photos"}
          </h2>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div
          className="card-body py-2 px-3 d-flex flex-column flex-grow-1"
          style={{ minHeight: 0 }}
        >
        <div
          className="position-relative flex-grow-1 d-flex align-items-center justify-content-center w-100 overflow-hidden bg-white rounded-0"
          style={{ minHeight: 0 }}
        >
          {wrap && (
            <button
              type="button"
              className="btn btn-outline-secondary rounded-circle position-absolute shadow-sm d-flex align-items-center justify-content-center"
              style={{
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                zIndex: 2,
                fontSize: "1.35rem",
                lineHeight: 1,
                padding: 0,
              }}
              aria-label="Previous image"
              onClick={onGoPrev}
            >
              ‹
            </button>
          )}
          {wrap && (
            <button
              type="button"
              className="btn btn-outline-secondary rounded-circle position-absolute shadow-sm d-flex align-items-center justify-content-center"
              style={{
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                zIndex: 2,
                fontSize: "1.35rem",
                lineHeight: 1,
                padding: 0,
              }}
              aria-label="Next image"
              onClick={onGoNext}
            >
              ›
            </button>
          )}
          {current ? (
            <img
              src={current}
              alt=""
              className="d-block"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          ) : null}
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Side panel aligned with {@link WeatherWidgetPanel}; loads `/comments/{item_type}/{item_id}`. */
export default function CommentsPanel({
  item,
  top,
  left,
  width = 340,
  height = 470,
  backendUrl: backendUrlProp,
  onAddComment,
}: CommentsPanelProps) {
  const { user, requestSignIn, accessToken } = useHomeAuth();
  const [addCommentOpen, setAddCommentOpen] = useState(false);
  /** Lifted out of AddCommentModal so map-driven parent re-renders do not lose file input / change. */
  const [commentDraftFiles, setCommentDraftFiles] = useState<File[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = (backendUrlProp ?? import.meta.env.VITE_BACKEND_URL ?? "")
    .toString()
    .trim();

  const apiOrigin = backendUrl.replace(/\/$/, "");

  const allGalleryUrls = useMemo(
    () => buildAllCommentGalleryUrls(comments, apiOrigin),
    [comments, apiOrigin],
  );

  const galleryGoPrev = useCallback(() => {
    setGalleryIndex((idx) => {
      if (idx === null) return idx;
      const n = allGalleryUrls.length;
      if (n <= 1) return idx;
      return (idx - 1 + n) % n;
    });
  }, [allGalleryUrls.length]);

  const galleryGoNext = useCallback(() => {
    setGalleryIndex((idx) => {
      if (idx === null) return idx;
      const n = allGalleryUrls.length;
      if (n <= 1) return idx;
      return (idx + 1) % n;
    });
  }, [allGalleryUrls.length]);

  useEffect(() => {
    const base = backendUrl.replace(/\/$/, "");
    if (!base) {
      setLoading(false);
      setError("Backend URL is not configured (set VITE_BACKEND_URL).");
      setComments([]);
      return;
    }

    const url = buildCommentsUrl(base, item);
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data: unknown = await res.json();
        setComments(normalizeCommentsPayload(data));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load comments.");
        setComments([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [backendUrl, item.id, item.type, refetchToken]);

  useEffect(() => {
    setCommentDraftFiles([]);
    setGalleryIndex(null);
  }, [item.id, item.type]);

  useEffect(() => {
    if (galleryIndex === null) return;
    if (allGalleryUrls.length === 0) {
      setGalleryIndex(null);
      return;
    }
    if (galleryIndex >= allGalleryUrls.length) {
      setGalleryIndex(allGalleryUrls.length - 1);
    }
  }, [galleryIndex, allGalleryUrls.length]);

  const handleAddComment = () => {
    if (onAddComment) {
      onAddComment();
      return;
    }
    setAddCommentOpen(true);
  };

  return (
    <>
      <div
        className="detail-popup"
        style={{
          position: "absolute",
          top,
          left,
          width,
          height,
          zIndex: 1000,
        }}
      >
        <div
          className="card h-100 d-flex flex-column overflow-hidden"
          data-bs-theme="light"
          style={{ minHeight: 0 }}
        >
          <div
            className="card-header fw-bold text-truncate flex-shrink-0"
            title={item.name}
          >
            Comments · {item.name}
          </div>
          <div
            className="card-body small flex-grow-1"
            style={{ overflowY: "auto", minHeight: 0, flexBasis: 0 }}
          >
            {loading && <p className="text-muted mb-0">Loading comments…</p>}
            {!loading && error && <p className="text-danger mb-0">{error}</p>}
            {!loading && !error && comments.length === 0 && (
              <p className="text-muted mb-0">No comments yet.</p>
            )}
            {!loading && !error && comments.length > 0 && (
              <ul className="list-unstyled mb-0">
                {comments.map((c, index) => {
                  const body = commentBody(c);
                  const rawImages = commentImageSrcs(c);
                  const imageSrcs =
                    apiOrigin && rawImages.length > 0
                      ? rawImages.map((u) =>
                          resolveCommentAssetUrl(apiOrigin, u),
                        )
                      : [];
                  const key =
                    c.id !== undefined && c.id !== null
                      ? String(c.id)
                      : `c-${index}-${body.slice(0, 24)}`;
                  return (
                    <li
                      key={key}
                      className="border-bottom pb-2 mb-2 text-body-secondary"
                    >
                      <div className="d-flex justify-content-between gap-2 align-items-baseline mb-1">
                        <span className="fw-semibold text-dark">
                          {commentAuthor(c)}
                        </span>
                        {commentTime(c) && (
                          <span
                            className="text-muted text-nowrap"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {commentTime(c)}
                          </span>
                        )}
                      </div>
                      {body ? (
                        <p
                          className="mb-0 card-text small"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {body}
                        </p>
                      ) : imageSrcs.length > 0 ? null : (
                        <p
                          className="mb-0 font-monospace text-muted"
                          style={{ fontSize: "0.65rem" }}
                        >
                          {JSON.stringify(c)}
                        </p>
                      )}
                      {imageSrcs.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {imageSrcs.map((src, i) => (
                            <button
                              key={`${src}-${i}`}
                              type="button"
                              className="d-inline-block border bg-light p-0 rounded-0"
                              style={{
                                maxWidth: 120,
                                maxHeight: 120,
                                cursor: "pointer",
                              }}
                              aria-label={`Open photo ${flatIndexForImage(comments, index, i) + 1} of all`}
                              onClick={() =>
                                setGalleryIndex(
                                  flatIndexForImage(comments, index, i),
                                )
                              }
                            >
                              <img
                                src={src}
                                alt=""
                                className="d-block"
                                style={{
                                  maxWidth: 120,
                                  maxHeight: 120,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="card-footer bg-white border-top py-2 px-2 flex-shrink-0">
            {user ? (
              <button
                type="button"
                className="btn btn-primary w-100 rounded-0"
                onClick={handleAddComment}
              >
                Add comment
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-primary w-100 rounded-0"
                onClick={requestSignIn}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
      {galleryIndex !== null &&
        allGalleryUrls.length > 0 &&
        galleryIndex < allGalleryUrls.length && (
          <CommentImageGalleryModal
            items={allGalleryUrls}
            index={galleryIndex}
            onClose={() => setGalleryIndex(null)}
            onGoPrev={galleryGoPrev}
            onGoNext={galleryGoNext}
          />
        )}
      <AddCommentModal
        open={addCommentOpen}
        onClose={() => {
          setAddCommentOpen(false);
          setCommentDraftFiles([]);
        }}
        item={item}
        backendUrl={backendUrl}
        accessToken={accessToken}
        onSuccess={() => setRefetchToken((t) => t + 1)}
        draftFiles={commentDraftFiles}
        onDraftFilesChange={setCommentDraftFiles}
      />
    </>
  );
}
