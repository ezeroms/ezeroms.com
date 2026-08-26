"use client";

import { useCallback, useRef, type PointerEvent } from "react";

const SWIPE_THRESHOLD_PX = 48;

/**
 * ライトボックスの左右スワイプ（タッチ／ペン）。
 * マウスは矢印ボタンを使うので対象外。
 */
export function useLightboxSwipe(opts: {
  enabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!opts.enabled) return;
      if (event.pointerType === "mouse") return;
      startRef.current = { x: event.clientX, y: event.clientY };
      swipedRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [opts.enabled],
  );

  const finish = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!opts.enabled || !start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      swipedRef.current = true;
      if (dx > 0) opts.onPrevious();
      else opts.onNext();
    },
    [opts.enabled, opts.onNext, opts.onPrevious],
  );

  const onPointerUp = finish;
  const onPointerCancel = useCallback(() => {
    startRef.current = null;
  }, []);

  /** スワイプ直後の click（閉じる）を無視する */
  const didSwipe = useCallback(() => {
    if (!swipedRef.current) return false;
    swipedRef.current = false;
    return true;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel, didSwipe };
}
