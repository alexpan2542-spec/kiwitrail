import type { Feature, Geometry } from "geojson";
import { useEffect, useState } from "react";
import { GeoJSON, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

export type RegionOverviewItem = {
  region_code: string;
  region_name: string;
  geometry: Geometry;
  lat: number;
  lng: number;
  tracks: number;
  huts: number;
  campsites: number;
  item_count: number;
};

const regionLabelIcon = L.divIcon({
  className: "region-overview-label-anchor",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

const dimRegionStyle: L.PathOptions = {
  color: "#6ea8fe",
  weight: 1,
  opacity: 0.35,
  fillColor: "#6ea8fe",
  fillOpacity: 0.03,
};

const litRegionStyle: L.PathOptions = {
  color: "#0d6efd",
  weight: 2,
  opacity: 0.95,
  fillColor: "#0d6efd",
  fillOpacity: 0.22,
};

export type RegionOverviewLayerProps = {
  regions: RegionOverviewItem[];
  onRegionClick: (regionCode: string) => void;
};

export default function RegionOverviewLayer({
  regions,
  onRegionClick,
}: RegionOverviewLayerProps) {
  const [litCount, setLitCount] = useState(0);

  useEffect(() => {
    setLitCount(0);
    if (regions.length === 0) return;

    const timer = window.setInterval(() => {
      setLitCount((prev) => {
        if (prev >= regions.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, [regions]);

  return (
    <>
      {regions.map((region, index) => {
        const isLit = index < litCount;
        const feature: Feature = {
          type: "Feature",
          geometry: region.geometry as Geometry,
          properties: {
            region_code: region.region_code,
            region_name: region.region_name,
          },
        };

        return (
          <GeoJSON
            key={region.region_code}
            data={feature}
            style={() => (isLit ? litRegionStyle : dimRegionStyle)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (isLit) onRegionClick(region.region_code);
              },
            }}
          />
        );
      })}
      {regions.map((region, index) => {
        if (index >= litCount) return null;

        return (
          <Marker
            key={`label-${region.region_code}`}
            position={[region.lat, region.lng]}
            icon={regionLabelIcon}
            interactive={false}
          >
            <Tooltip
              permanent
              direction="center"
              className="region-overview-tooltip"
              opacity={1}
            >
              <div className="region-overview-tooltip__inner">
                <div className="region-overview-tooltip__name">
                  {region.region_name}
                </div>
                <div className="region-overview-tooltip__count">
                  {region.item_count} items
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
