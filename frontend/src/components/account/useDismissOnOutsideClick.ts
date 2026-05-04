import { type RefObject, useEffect } from "react";

/**
 * Calls onDismiss when pointer goes down outside refs (e.g. close a dropdown).
 */
export function useDismissOnOutsideClick(
  isActive: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!isActive) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isActive, rootRef, onDismiss]);
}
