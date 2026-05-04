import { Control, DomEvent } from "leaflet";

import { requestCloseHomeAccountMenu } from "./components/map/homeAccountMenuRegistry";

type LayersProto = {
  _initLayout(this: L.Control.Layers): void;
};

type LayersInstance = L.Control.Layers & {
  _expandSafely: () => void;
  collapse: () => void;
  _container: HTMLElement;
  _layersLink: HTMLAnchorElement;
};

/**
 * Leaflet's layers control expands on hover when collapsed. Remove hover so the
 * list opens only from the toggle click (and keyboard), matching typical menus.
 * Also: second click on the map icon collapses the list (default Leaflet always expands).
 */
const layersProto = Control.Layers.prototype as unknown as LayersProto;
const originalInitLayout = layersProto._initLayout;

layersProto._initLayout = function (this: L.Control.Layers) {
  originalInitLayout.call(this);
  if (!this.options.collapsed) return;
  const self = this as LayersInstance;
  DomEvent.off(self._container, {
    mouseenter: self._expandSafely,
    mouseleave: self.collapse,
  }, self);

  const link = self._layersLink;
  DomEvent.off(link);

  DomEvent.on(
    link,
    "click",
    function (this: LayersInstance, e: Event) {
      DomEvent.preventDefault(e);
      requestCloseHomeAccountMenu();
      if (this._container.classList.contains("leaflet-control-layers-expanded")) {
        this.collapse();
      } else {
        this._expandSafely();
      }
    },
    self,
  );

  DomEvent.on(
    link,
    "keydown",
    function (this: LayersInstance, e: Event) {
      const ke = e as KeyboardEvent;
      if (ke.key !== "Enter" && ke.keyCode !== 13) return;
      DomEvent.preventDefault(e);
      requestCloseHomeAccountMenu();
      if (this._container.classList.contains("leaflet-control-layers-expanded")) {
        this.collapse();
      } else {
        this._expandSafely();
      }
    },
    self,
  );
};
