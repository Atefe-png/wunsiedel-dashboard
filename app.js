/* ============================================================
   Wunsiedel POI Clustering Dashboard — App Logic
   Master's Thesis: Atefeh Zaeemi, BHT Berlin, 2026
   Clustering methods: K-Means (k=13), DBSCAN (ε=515m), HDBSCAN (mpts=50)
   Data: OpenStreetMap / Geofabrik, Nov 2025 — 2,673 POIs, 107 fclasses
   ============================================================ */

// ── METHOD METADATA ────────────────────────────────────────────────────────
const METHOD_META = {
  km:  { label: 'K-Means',  zones: 13, noise: 0,   noisePct: 0,    wc: '3,320,218', cv: '0.89', param: 'k = 13' },
  db:  { label: 'DBSCAN',   zones: 64, noise: 348,  noisePct: 13.0, wc: '2,712,091', cv: '1.84', param: 'ε = 515 m, MinPts = 5' },
  hdb: { label: 'HDBSCAN',  zones: 11, noise: 904, noisePct: 33.8, wc: '2,300,151', cv: '1.00', param: 'mpts = mclSize = 50' },
};

// ── CATEGORY COLOURS (13 categories) ───────────────────────────────────────
const CAT_COL = {
  Tourism:    '#2e86ab',
  Catering:   '#e07b39',
  Health:     '#c0333a',
  Services:   '#7b3fa0',
  Shops:      '#c8761a',
  School:     '#1a5fa0',
  Education:  '#1a5fa0',
  Leisure:    '#2e8b57',
  Industry:   '#5a6475',
  Retail:     '#a0522d',
  Others:     '#888888',
  Other:      '#888888',
  Gastronomy: '#d4a017',
};

// ── 20-COLOUR CLUSTER PALETTE ───────────────────────────────────────────────
const CL_PAL = [
  '#e6194b','#3cb44b','#4363d8','#f58231','#911eb4',
  '#42d4f4','#f032e6','#bfef45','#469990','#dcbeff',
  '#9a6324','#800000','#aaffc3','#808000','#ffd8b1',
  '#000075','#a9a9a9','#ffe119','#e6beff','#fabebe',
];
const clCol = c => (c < 0 ? '#e84040' : CL_PAL[c % CL_PAL.length]);

// ── GLOBALS ─────────────────────────────────────────────────────────────────
let curMethod = 'km';
let map, renderer, poiLayer;
let poisVisible = true;

// ── INITIALISE ───────────────────────────────────────────────────────────────
window.onload = () => {
  // Map with Canvas renderer for performance (2,673 points)
  map = L.map('map', { center: [50.095, 12.055], zoom: 12, preferCanvas: true });
  renderer = L.canvas({ padding: 0.5 });

  // CartoDB Positron tiles — work without HTTP Referer (local file compatible)
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      opacity: 0.9,
    }
  ).addTo(map);

  poiLayer = L.layerGroup().addTo(map);

  buildDropdowns();
  buildCategoryLegend();
  setMethod('km');

  // Auto-zoom to study area
  setTimeout(() => fitDistrict(), 300);
};

// ── DROPDOWN POPULATION ──────────────────────────────────────────────────────
function buildDropdowns() {
  const fclasses = [...new Set(POI_DATA.map(p => p.fclass))].sort();
  const cats     = [...new Set(POI_DATA.map(p => p.category))].filter(Boolean).sort();

  const sfEl = document.getElementById('sf');
  fclasses.forEach(f => {
    const n = POI_DATA.filter(p => p.fclass === f).length;
    sfEl.innerHTML += `<option value="${f}">${f} (${n})</option>`;
  });

  const scEl = document.getElementById('sc');
  cats.forEach(c => {
    const n = POI_DATA.filter(p => p.category === c).length;
    scEl.innerHTML += `<option value="${c}">${c} (${n})</option>`;
  });
}

// ── CATEGORY LEGEND ──────────────────────────────────────────────────────────
function buildCategoryLegend() {
  const cats = [...new Set(POI_DATA.map(p => p.category))].filter(Boolean).sort();
  const el   = document.getElementById('cleg');
  cats.forEach(c => {
    const n   = POI_DATA.filter(p => p.category === c).length;
    const col = CAT_COL[c] || '#888';
    el.innerHTML += `
      <div class="li">
        <div class="ldot" style="background:${col}"></div>
        <span style="flex:1">${c}</span>
        <span class="ln">${n}</span>
      </div>`;
  });
}

// ── METHOD SWITCH ────────────────────────────────────────────────────────────
function setMethod(m) {
  curMethod = m;
  ['km', 'db', 'hdb'].forEach(k =>
    document.getElementById('t-' + k).classList.toggle('on', k === m)
  );
  const M = METHOD_META[m];
  document.getElementById('sz').textContent  = M.zones;
  document.getElementById('sn').textContent  = M.noise.toLocaleString();
  document.getElementById('snp').textContent = M.noisePct.toFixed(1) + '%';
  document.getElementById('sw').textContent  = M.wc;
  document.getElementById('scv').textContent = M.cv;
  document.getElementById('sp').textContent  = M.param;
  document.getElementById('nb').style.width  = M.noisePct + '%';
  draw();
}

// ── DRAW POINTS ──────────────────────────────────────────────────────────────
function draw() {
  poiLayer.clearLayers();

  const fc        = document.getElementById('sf').value;
  const cat       = document.getElementById('sc').value;
  const byCluster = document.getElementById('cbc').checked;
  const showNoise = document.getElementById('cbn').checked;
  const clKey     = 'cluster_' + curMethod;
  let   count     = 0;

  POI_DATA.forEach(p => {
    if (fc  && p.fclass   !== fc)  return;
    if (cat && p.category !== cat) return;

    const cl = (p[clKey] != null) ? p[clKey] : -1;
    if (!showNoise && cl < 0) return;

    const fillColor = byCluster ? clCol(cl) : (CAT_COL[p.category] || '#888');
    const radius    = cl < 0 ? 3 : 5;
    const opacity   = cl < 0 ? 0.45 : 0.90;

    const mk = L.circleMarker([p.lat, p.lon], {
      renderer,
      radius,
      fillColor,
      color:       'rgba(255,255,255,0.6)',
      weight:      cl < 0 ? 0.3 : 0.7,
      fillOpacity: opacity,
    });

    mk.on('click', () => showInfo(p, cl));
    mk.bindTooltip(
      `<b style="color:#1a2744">${p.name || '(unnamed)'}</b><br>` +
      `<span style="color:#555;font-size:10px">${p.fclass} · ${p.category || ''}</span><br>` +
      `<span style="color:#888;font-size:9px">Cluster: ${cl < 0 ? 'Noise' : cl} · ` +
        `W<sub>c</sub> = ${p.attraction_weight != null ? p.attraction_weight.toFixed(1) : '—'}</span>`,
      { sticky: true, offset: [8, 0] }
    );
    mk.addTo(poiLayer);
    count++;
  });

  document.getElementById('pcnt').textContent = count.toLocaleString() + ' POIs shown';
}

// ── INFO PANEL ───────────────────────────────────────────────────────────────
function showInfo(p, cl) {
  const wc    = p.attraction_weight != null ? p.attraction_weight.toFixed(2) : '—';
  const noise = cl < 0;
  document.getElementById('ibox').innerHTML =
    `<b>${p.name || '(unnamed)'}</b><br>` +
    `<span class="tag">${p.fclass}</span>` +
    `<span class="tag ${noise ? 'tnoise' : ''}">${noise ? 'Noise (−1)' : 'Cluster ' + cl}</span><br>` +
    `<span style="color:#666;font-size:10px">Category:</span> <b>${p.category || '?'}</b><br>` +
    `<span style="color:#666;font-size:10px">W<sub>c</sub>:</span> <b>${wc}</b><br>` +
    `<span style="color:#666;font-size:10px">Method:</span> ${METHOD_META[curMethod].label}`;
}

// ── UI CONTROLS ──────────────────────────────────────────────────────────────
function toggleVis() {
  poisVisible = !poisVisible;
  const btn = document.getElementById('bvis');
  if (poisVisible) {
    poiLayer.addTo(map);
    btn.classList.add('on');
    btn.textContent = '● POIs visible';
  } else {
    map.removeLayer(poiLayer);
    btn.classList.remove('on');
    btn.textContent = '○ POIs hidden';
  }
}

function fitDistrict() {
  map.fitBounds([[49.9774, 11.8456], [50.2217, 12.2523]], { padding: [30, 30] });
}
