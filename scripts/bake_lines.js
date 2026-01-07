// Curves straight lines using turf
import * as turf from "@turf/turf";

export const bakeLines = (regions) => {
  return regions.map((region) => {
    // Skip empty regions
    if (
      !region.geometry.coordinates ||
      region.geometry.coordinates.length === 0
    ) {
      return region;
    }

    try {
      // Flip coordinates for turf
      let coords = region.geometry.coordinates[0].map((pt) => [pt[1], pt[0]]);

      // Close polygon ring
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }

      // Apply smoothing
      const polygon = turf.polygon([coords]);
      const smoothed = turf.polygonSmooth(polygon, { iterations: 3 });

      // Flip coords back
      const leafletCoords = smoothed.features[0].geometry.coordinates[0].map(
        (pt) => [pt[1], pt[0]],
      );

      return {
        ...region,
        geometry: {
          ...region.geometry,
          coordinates: [leafletCoords],
        },
      };
    } catch (err) {
      console.warn(`Skipping "${region.properties.name}": ${err.message}`);
      return region; // Return original on error
    }
  });
};
