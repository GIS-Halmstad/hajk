import Draw from "ol/interaction/Draw";
import { Stroke, Style, Circle, Fill } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { extend, createEmpty, isEmpty } from "ol/extent";
import FeatureStyle from "./utils/FeatureStyle";

class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.defaultStyle = this.getDefaultStyle();
    this.drawStyleSettings = this.getDrawStyleSettings();
    this.FeatureStyle = new FeatureStyle(settings.options);
    this.localObserver = settings.localObserver;
    this.initMapLayers();
    this.bindSubscriptions();
  }

  getDefaultStyle = () => {
    const fill = new Fill({
      color: "rgba(255,255,255,0.4)",
    });
    const stroke = new Stroke({
      color: "#3399CC",
      width: 1.25,
    });

    return [
      new Style({
        image: new Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
        fill: fill,
        stroke: stroke,
      }),
    ];
  };

  getDrawStyleSettings = () => {
    const strokeColor =
      this.options.drawStrokeColor ?? "rgba(255, 214, 91, 0.6)";
    const fillColor = this.options.drawFillColor ?? "rgba(255, 214, 91, 0.2)";

    return { strokeColor: strokeColor, fillColor: fillColor };
  };

  getNewVectorSource = () => {
    return new VectorSource({ wrapX: false });
  };

  getNewVectorLayer = (source, style) => {
    return new VectorLayer({
      source: source,
      style: style,
    });
  };

  initMapLayers = () => {
    this.resultSource = this.getNewVectorSource();
    this.resultsLayer = this.getNewVectorLayer(
      this.resultSource,
      this.options.showInMapOnSearchResult ? this.defaultStyle : null
    );
    this.resultsLayer.set("type", "searchResultLayer");
    this.drawSource = this.getNewVectorSource();
    this.drawLayer = this.getNewVectorLayer(
      this.drawSource,
      this.getDrawStyle()
    );
    this.map.addLayer(this.drawLayer);
    this.map.addLayer(this.resultsLayer);
  };

  bindSubscriptions = () => {
    // Local subscriptions
    this.localObserver.subscribe("clearMapView", this.clearMap);
    this.localObserver.subscribe(
      "map.zoomToFeaturesByIds",
      this.zoomToFeatureIds
    );
    this.localObserver.subscribe(
      "map.addFeaturesToResultsLayer",
      this.addFeaturesToResultsLayer
    );
    this.localObserver.subscribe(
      "map.highlightFeaturesByIds",
      this.highlightFeaturesInMap
    );
    this.localObserver.subscribe(
      "map.addAndHighlightFeatureInSearchResultLayer",
      this.addAndHighlightFeatureInSearchResultLayer
    );
    this.localObserver.subscribe(
      "map.resetStyleForFeaturesInResultSource",
      this.resetStyleForFeaturesInResultSource
    );

    // Global subscriptions
    this.app.globalObserver.subscribe(
      "search.spatialSearchActivated",
      (options) => {
        this.toggleDraw(true, options.type);
      }
    );
  };

  fitMapToSearchResult = () => {
    const currentExtent = this.resultSource.getExtent();
    if (currentExtent.map(Number.isFinite).includes(false) === false) {
      this.fitMapToExtent(currentExtent);
    }
  };

  fitMapToExtent = (extent) => {
    this.map.getView().fit(extent, {
      size: this.map.getSize(),
      padding: [20, 20, 20, 20],
      maxZoom: 7,
    });
  };

  addFeaturesToResultsLayer = (features) => {
    this.resultSource.clear();
    this.resultSource.addFeatures(
      features.map((f) => {
        return new GeoJSON().readFeature(f);
      })
    );

    if (this.options.showInMapOnSearchResult) {
      this.fitMapToSearchResult();
    }
  };

  resetStyleForFeaturesInResultSource = () => {
    this.resultSource.getFeatures().map((f) => f.setStyle(null));
  };

  getDrawStyle = () => {
    return new Style({
      stroke: new Stroke({
        color: this.drawStyleSettings.strokeColor,
        width: 4,
      }),
      fill: new Fill({
        color: this.drawStyleSettings.fillColor,
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: this.drawStyleSettings.strokeColor,
          width: 2,
        }),
      }),
    });
  };

  highlightFeaturesInMap = (featuresInfo) => {
    this.resetStyleForFeaturesInResultSource();
    featuresInfo.map((featureInfo) => {
      const feature = this.getFeatureFromResultSourceById(
        featureInfo.featureId
      );
      return feature.setStyle(
        this.FeatureStyle.getHighlightedStyle(
          feature,
          featureInfo.displayFields
        )
      );
    });
  };

  addAndHighlightFeatureInSearchResultLayer = (featureInfo) => {
    const feature = new GeoJSON().readFeature(featureInfo.feature);
    feature.setStyle(
      this.FeatureStyle.getHighlightedStyle(feature, featureInfo.displayFields)
    );
    this.resultSource.addFeature(feature);
    this.fitMapToSearchResult();
  };

  getFeatureFromResultSourceById = (fid) => {
    return this.resultSource.getFeatureById(fid);
  };

  zoomToFeatureIds = (featuresInfo) => {
    let extent = createEmpty();

    //BoundingExtent-function gave wrong coordinates for some
    featuresInfo.forEach((featureInfo) =>
      extend(
        extent,
        this.getFeatureFromResultSourceById(featureInfo.featureId)
          .getGeometry()
          .getExtent()
      )
    );
    const extentToZoomTo = isEmpty(extent)
      ? this.resultSource.getExtent()
      : extent;

    this.fitMapToExtent(extentToZoomTo);
  };

  clearMap = () => {
    if (this.drawSource) {
      this.drawSource.clear();
    }
    if (this.resultSource) {
      this.resultSource.clear();
    }
    this.removeDrawInteraction();
  };

  removeDrawInteraction = () => {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
  };

  toggleDraw = (active, type, freehand = false) => {
    this.localObserver.publish("on-draw-start", type);
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: type === "Circle" ? true : freehand,
        stopClick: true,
        style: this.getDrawStyle(),
      });

      this.map.clickLock.add("search");
      this.map.addInteraction(this.draw);
      this.drawSource.clear();

      this.drawSource.on("addfeature", (e) => {
        this.map.removeInteraction(this.draw);
        this.map.clickLock.delete("search");
        this.localObserver.publish("on-draw-end", e.feature);
      });
    } else {
      this.map.removeInteraction(this.draw);
      this.map.clickLock.delete("search");

      this.drawSource.clear();
    }
  };
}

export default MapViewModel;
