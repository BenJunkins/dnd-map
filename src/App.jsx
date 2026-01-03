import React, { useState, useEffect } from "react";
import {
  MapContainer,
  ImageOverlay,
  Polygon,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import regionData from "./regions.json";

// --- VITE ASSET FIXES ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// --- CONFIGURATION ---
const IMAGE_URL = "/faerun_map.jpg";
const IMAGE_BOUNDS = [
  [0, 0],
  [4096, 3072],
]; // Aspect ratio
const API_URL = "YOUR_API_GATEWAY_URL/monsters"; // Replace later
const DEV_MODE = true; // SET TO FALSE when done tracing regions!

// --- HELPER COMPONENT: COORDINATE LOGGER ---
// Use this to trace your regions. Click the map, check the console.
const CoordinateLogger = () => {
  const [coords, setCoords] = useState([]);

  useMapEvents({
    click(e) {
      if (!DEV_MODE) return;
      const { lat, lng } = e.latlng;
      const newPoint = [Math.round(lat), Math.round(lng)];
      const newCoords = [...coords, newPoint];
      setCoords(newCoords);
      console.log("--- Copied to Clipboard (Logic Below) ---");
      console.log(JSON.stringify([newCoords]));
    },
  });
  return null;
};

const App = () => {
  // --- STATE ---
  const [allMonsters, setAllMonsters] = useState([]);
  const [displayMonsters, setDisplayMonsters] = useState([]);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [filters, setFilters] = useState({ low: true, mid: true, high: true });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // MOCK DATA (Use this until your API is ready)
        // Once API is ready, uncomment the fetch lines below:
        // const res = await fetch(API_URL);
        // const rawData = await res.json();

        const rawData = [
          { id: "goblin", name: "Goblin", type: "humanoid", cr: 0.25, hp: 7 },
          { id: "dragon", name: "Red Dragon", type: "dragon", cr: 17, hp: 256 },
          { id: "lich", name: "Lich", type: "undead", cr: 21, hp: 135 },
          { id: "wolf", name: "Dire Wolf", type: "beast", cr: 1, hp: 37 },
        ];

        // Randomly assign regions for demo purposes
        const regionNames = regionData.map((r) => r.properties.name);
        const enriched = rawData.map((m) => ({
          ...m,
          region: regionNames[Math.floor(Math.random() * regionNames.length)],
        }));

        setAllMonsters(enriched);
        setDisplayMonsters(enriched);
      } catch (err) {
        console.error("Failed to load monsters:", err);
      }
    };
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.checked });
  };

  const applyFilters = () => {
    // Filter by CR first
    const filtered = allMonsters.filter((m) => {
      if (m.cr <= 4 && filters.low) return true;
      if (m.cr >= 5 && m.cr <= 10 && filters.mid) return true;
      if (m.cr >= 11 && filters.high) return true;
      return false;
    });
    setDisplayMonsters(filtered);
  };

  // --- DERIVED DATA ---
  // Get monsters specifically for the sidebar list
  const sidebarList = hoveredRegion
    ? displayMonsters.filter((m) => m.region === hoveredRegion)
    : [];

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Faerun Monster Atlas</h2>
        </div>

        <div className="sidebar-content">
          {/* Filter Controls */}
          <div className="filter-group">
            <h4>Filter by CR</h4>
            <label className="filter-label">
              <input
                type="checkbox"
                name="low"
                checked={filters.low}
                onChange={handleFilterChange}
              />{" "}
              Low (0-4)
            </label>
            <label className="filter-label">
              <input
                type="checkbox"
                name="mid"
                checked={filters.mid}
                onChange={handleFilterChange}
              />{" "}
              Mid (5-10)
            </label>
            <label className="filter-label">
              <input
                type="checkbox"
                name="high"
                checked={filters.high}
                onChange={handleFilterChange}
              />{" "}
              High (11+)
            </label>
            <button className="update-btn" onClick={applyFilters}>
              Update Map
            </button>
          </div>

          {/* Monster List */}
          <div className="monster-list">
            <h3>{hoveredRegion || "Map Explorer"}</h3>
            {!hoveredRegion && (
              <p style={{ color: "#666" }}>
                Hover over a region to see its inhabitants.
              </p>
            )}

            {sidebarList.length > 0
              ? sidebarList.map((monster) => (
                  <div key={monster.id} className="monster-card">
                    <a
                      href={`https://www.dnd5eapi.co/api/monsters/${monster.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="monster-name"
                    >
                      {monster.name} ↗
                    </a>
                    <div className="monster-stats">
                      Type: {monster.type} • CR: {monster.cr} • HP: {monster.hp}
                    </div>
                  </div>
                ))
              : hoveredRegion && <p>No matching monsters found here.</p>}
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="map-area">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={IMAGE_BOUNDS}
          center={[500, 500]}
          zoom={-1}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <ImageOverlay url={IMAGE_URL} bounds={IMAGE_BOUNDS} />

          {/* Helper for creating regions */}
          <CoordinateLogger />

          {/* Draw Regions */}
          {regionData.map((region, idx) => {
            const isHovered = hoveredRegion === region.properties.name;
            return (
              <Polygon
                key={idx}
                positions={region.geometry.coordinates}
                pathOptions={{
                  color: isHovered ? "#f1c40f" : "rgba(255, 255, 255, 0.3)", // Yellow if hovered, Dark Blue if not
                  fillColor: isHovered ? "#f1c40f" : "transparent",
                  fillOpacity: isHovered ? 0.3 : 0,
                  weight: isHovered ? 3 : 1,
                }}
                eventHandlers={{
                  mouseover: () => setHoveredRegion(region.properties.name),
                  mouseout: () => setHoveredRegion(null),
                }}
              >
                <Tooltip sticky direction="top">
                  {region.properties.name}
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
