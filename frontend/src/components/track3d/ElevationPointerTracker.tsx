import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { ElevationSample } from "./track3dElevation";

export type ElevationHoverInfo = {
  x: number;
  y: number;
  elevationM: number;
};

type ElevationPointerTrackerProps = {
  samples: ElevationSample[];
  onHover: (info: ElevationHoverInfo | null) => void;
  /** Max distance from cursor to projected point (px). */
  thresholdPx?: number;
};

export default function ElevationPointerTracker({
  samples,
  onHover,
  thresholdPx = 14,
}: ElevationPointerTrackerProps) {
  const { camera, gl } = useThree();
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const projected = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerMove = (event: PointerEvent) => {
      if (!samples.length) {
        onHoverRef.current(null);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      let bestElev: number | null = null;
      let bestDist = thresholdPx;

      for (const sample of samples) {
        projected.copy(sample.position).project(camera);
        if (projected.z > 1) continue;

        const screenX = (projected.x * 0.5 + 0.5) * rect.width;
        const screenY = (-projected.y * 0.5 + 0.5) * rect.height;
        const dist = Math.hypot(localX - screenX, localY - screenY);

        if (dist < bestDist) {
          bestDist = dist;
          bestElev = sample.elevationM;
        }
      }

      if (bestElev != null) {
        onHoverRef.current({
          x: localX,
          y: localY,
          elevationM: bestElev,
        });
      } else {
        onHoverRef.current(null);
      }
    };

    const handleLeave = () => onHoverRef.current(null);

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handleLeave);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handleLeave);
    };
  }, [camera, gl, samples, projected, thresholdPx]);

  return null;
}
