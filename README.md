# Wunsiedel POI Clustering Dashboard

**Interactive web map for the Master's Thesis:**
> *"Entwicklung und Vergleich von Clustering-Methoden zur Aggregation und Gewichtung von Zielgelegenheiten aus OpenStreetMap-Daten für vereinfachte Verkehrsnachfragemodelle in ländlichen Räumen – am Beispiel des Landkreises Wunsiedel im Fichtelgebirge"*

**Author:** Atefeh Zaeemi
**Institution:** Berliner Hochschule für Technik (BHT), Fachbereich III
**Year:** 2026

---

## 🗺️ What This Dashboard Shows

An interactive Leaflet.js web map visualising **2,673 POIs** extracted from OpenStreetMap (Geofabrik extract, November 2025) for **Landkreis Wunsiedel im Fichtelgebirge**, Bavaria, Germany.

Three spatial clustering methods are compared side by side:

| Method | Zones | Noise POIs | Noise % | Total W_c | CV |
|--------|-------|-----------|---------|-----------|-----|
| **K-Means** | 13 | 0 | 0.0 % | 3,320,218 | 0.89 |
| **DBSCAN** | 64 | 348 | 13.0 % | 2,712,091 | 1.84 |
| **HDBSCAN** | 11 | 904 | 33.8 % | 2,300,151 | 1.00 |

Each POI carries an **attraction weight W_c** calculated using the German Ver_Bau / Bosserhoff trip generation framework.

---

## 📁 File Structure

```
wunsiedel-dashboard/
├── index.html   ← Main HTML page (structure only)
├── style.css    ← All CSS styles
├── app.js       ← Map logic, filtering, cluster rendering
├── data.js      ← 2,673 POIs with fclass, category, W_c,
│                   cluster_km, cluster_db, cluster_hdb
└── README.md    ← This file
```

---

## 🚀 How to Run Locally

### Option 1 — Direct in browser (simple)
Open `index.html` directly in **Firefox** (Firefox allows local JS file loading).

> **Note for Chrome users:** Chrome blocks local `<script src="data.js">` by default.
> Use Option 2 below.

### Option 2 — Local server (recommended for Chrome)

**Python (recommended):**
```bash
cd wunsiedel-dashboard
python -m http.server 8000
```
Then open: [http://localhost:8000](http://localhost:8000)

**Node.js (alternative):**
```bash
npx serve .
```

### Option 3 — GitHub Pages (online, no install needed)
See deployment section below.

---

## 🌐 Deploy on GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Under **Source**, select `main` branch, folder `/` (root)
4. Click **Save**
5. Your dashboard is live at:
   `https://your-username.github.io/your-repo-name/`

---

## ✨ Dashboard Features

- **3 method tabs** — switch between K-Means / DBSCAN / HDBSCAN instantly
- **Statistics panel** — zones, noise count, noise %, total W_c, CV per method
- **Filter by fclass** — e.g. show only `restaurant`, `school`, `supermarket`
- **Filter by category** — Tourism, Health, Shops, Leisure, etc.
- **Color modes** — color by cluster ID *or* by POI category
- **Noise toggle** — show/hide noise points (cluster = −1)
- **Click info** — click any point to see name, fclass, cluster ID, W_c value
- **Canvas rendering** — fast even with 2,673 points
- **CartoDB Positron basemap** — works offline-friendly, no API key needed

---

## 📊 Data Sources

| Source | Description |
|--------|-------------|
| OpenStreetMap / Geofabrik | POI base data, Bavaria extract, November 2025 |
| Ver_Bau / Bosserhoff framework | Attraction weight W_c calculation |
| EPSG:25832 → EPSG:4326 | Coordinate reprojection (Python/GeoPandas) |

---

## 🛠️ Technologies

- [Leaflet.js 1.9.4](https://leafletjs.com/) — interactive map
- [CartoDB Positron](https://carto.com/basemaps/) — basemap tiles
- [GeoPandas](https://geopandas.org/) — data preparation (Python)
- Plain HTML / CSS / JavaScript — no build tools required

---

## 📝 Citation

If you use this dashboard or the underlying methodology, please cite:

> Zaeemi, A. (2026). *Entwicklung und Vergleich von Clustering-Methoden zur Aggregation und Gewichtung von Zielgelegenheiten aus OpenStreetMap-Daten für vereinfachte Verkehrsnachfragemodelle in ländlichen Räumen.* Master's Thesis, Berliner Hochschule für Technik (BHT), Berlin.

---

*Supervisors: Prof. Dr. Florian Hruby, Nina Thomsen — BHT Berlin, Fachbereich III*
