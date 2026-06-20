import React, { useEffect, useRef } from "react";

export function LeafletMap({ coords, officeName }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;
    
    // Check if Leaflet is loaded from CDN
    if (!window.L) {
      console.warn("Leaflet.js is not loaded.");
      return;
    }

    const [lat, lng] = coords;

    // If map does not exist, initialize it
    if (!mapInstanceRef.current) {
      try {
        mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([lat, lng], 14);
        
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);

        markerInstanceRef.current = window.L.marker([lat, lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${officeName}</b>`)
          .openPopup();
      } catch (err) {
        console.error("Leaflet initialization failed", err);
      }
    } else {
      // If map already exists, pan to the new coordinates and update the marker
      try {
        mapInstanceRef.current.setView([lat, lng], 14);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
          markerInstanceRef.current.getPopup().setContent(`<b>${officeName}</b>`);
          markerInstanceRef.current.openPopup();
        } else {
          markerInstanceRef.current = window.L.marker([lat, lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>${officeName}</b>`)
            .openPopup();
        }
      } catch (err) {
        console.error("Leaflet update failed", err);
      }
    }

    // Force Leaflet recalculation after rendering to ensure no grey tiles
    const resizeTimeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(resizeTimeout);
  }, [coords, officeName]);

  // Clean up Leaflet instances when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "250px" }} />
    </div>
  );
}

export default LeafletMap;
