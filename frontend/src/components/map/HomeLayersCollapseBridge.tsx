import { useLeafletContext } from "@react-leaflet/core";
import { useEffect } from "react";

import { registerHomeMapLayersCollapse } from "./homeMapLayersRegistry";

/**
 * Registers the home map’s Layers control so other UI (e.g. account) can call collapse().
 */
export default function HomeLayersCollapseBridge() {
  const { layersControl } = useLeafletContext();

  useEffect(() => {
    if (!layersControl) return;
    const collapse = () => {
      layersControl.collapse();
    };
    registerHomeMapLayersCollapse(collapse);
    return () => registerHomeMapLayersCollapse(null);
  }, [layersControl]);

  return null;
}
