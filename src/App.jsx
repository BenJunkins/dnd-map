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
import regionData from "./regions_smooth.json";
import Footer from "./components/Footer.jsx";

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
  [1500, 2000],
]; // Aspect ratio
const API_URL =
  "https://eipiir7l70.execute-api.us-east-1.amazonaws.com/monsters";
const DEV_MODE = false;

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
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [filters, setFilters] = useState({ low: true, mid: true, high: true });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        const enriched = rawData;

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
    const filtered = allMonsters.filter((monster) => {
      if (monster.cr <= 4 && filters.low) return true;
      if (monster.cr >= 5 && monster.cr <= 10 && filters.mid) return true;
      if (monster.cr >= 11 && filters.high) return true;
      return false;
    });
    setDisplayMonsters(filtered);
  };

  // --- DERIVED DATA ---
  const activeRegion = selectedRegion || hoveredRegion;
  
  // Get monsters specifically for the sidebar list
  const sidebarList = activeRegion
    ? displayMonsters.filter((monster) => {
        //DynamoDB oject to array fix
        let regions = [];
        if (Array.isArray(monster.region)) {
          regions = monster.region;
        } else if (monster.region && monster.region.SS) {
          regions = monster.region.SS;
        } else if (typeof monster.region === "string") {
          regions = [monster.region];
        }
        return regions.includes(activeRegion);
      })
    : [];

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Faerun Monster Atlas</h2>
          <div className="tapered-rule"></div>
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
            <h3>
              {activeRegion || "Map Explorer"}
              {selectedRegion && (
                  <button 
                    onClick={() => setSelectedRegion(null)}
                    style={{ float: "right", background: "none", border: "none", color: "var(--dnd-red-light)", cursor: "pointer", fontFamily: "var(--font-header)", fontSize: "0.6em", fontWeight: "bold" }}
                  >
                    [ CLEAR ]
                  </button>
                )}
            </h3>
            {!activeRegion && (
              <p style={{ color: "#666", fontStyle: "italic", marginTop: "15px" }}>
                Hover or click a region on the map to reveal its local fauna and monstrosities.
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
              : activeRegion && <p>No matching monsters found here. Safe travels...</p>}
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
            const isSelected = selectedRegion === region.properties.name;
            const isActive = isHovered || isSelected;
          
            return (
              <Polygon
                key={idx}
                positions={region.geometry.coordinates}
                pathOptions={{
                    color: isActive ? "var(--dnd-gold)" : "rgba(184, 154, 103, 0.4)", // Gold outline
                    fillColor: isActive ? "var(--dnd-red)" : "transparent", // Crimson fill on hover
                    fillOpacity: isActive ? 0.4 : 0,
                    weight: isActive ? 3 : 1,
                    dashArray: isActive ? null : "4 4", // Dashed cartography lines by default
                }}
                eventHandlers={{
                  mouseover: () => setHoveredRegion(region.properties.name),
                  mouseout: () => setHoveredRegion(null),
                  click: () => setSelectedRegion(isSelected ? null : region.properties.name),
                }}
              >
                <Tooltip sticky direction="top">
                  {region.properties.name}
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>

        <Footer />
      </div>
    </div>
  );
};

export default App;
