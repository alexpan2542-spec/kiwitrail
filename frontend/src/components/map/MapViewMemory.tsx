import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export type MapViewSnapshot = {
  lat: number;
  lng: number;
  zoom: number;
};

export type MapViewRestoreOptions = {
  /** Override saved zoom (e.g. fixed level when leaving a track). */
  zoom?: number;
};

export type MapViewMemoryHandle = {
  save: () => void;
  restore: (options?: MapViewRestoreOptions) => void;
};

type MapViewMemoryProps = {
  memoryRef: RefObject<MapViewMemoryHandle | null>;
};

/** Saves / restores Leaflet center+zoom around item selection. */
export default function MapViewMemory({ memoryRef }: MapViewMemoryProps) {
  const map = useMap();
  const snapshotRef = useRef<MapViewSnapshot | null>(null);

  useEffect(() => {
    memoryRef.current = {
      save: () => {
        const center = map.getCenter();
        snapshotRef.current = {
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        };
      },
      restore: (options) => {
        const snapshot = snapshotRef.current;
        if (!snapshot) return;
        map.flyTo([snapshot.lat, snapshot.lng], options?.zoom ?? snapshot.zoom, {
          duration: 0.8,
        });
        snapshotRef.current = null;
      },
    };

    return () => {
      memoryRef.current = null;
    };
  }, [map, memoryRef]);

  return null;
}
