import { documentToSVG, inlineResources } from 'dom-to-svg';

// Injected into each page (inside the page's own window) by the export driver.
window.__egToSVG = async function (opts) {
  var svgDoc = documentToSVG(document, opts || {});
  await inlineResources(svgDoc.documentElement);
  return new XMLSerializer().serializeToString(svgDoc);
};
