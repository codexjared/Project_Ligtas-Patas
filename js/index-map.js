(function () {
    var LS = window.LigtasStorage;
    if (!LS || typeof L === 'undefined') return;

    function getPOIs() { return LS.getPOIs(); }
    function savePOIs(pois) { LS.savePOIs(pois); }

    var STATUS_COLOR = { safe: '#22c55e', moderate: '#f59e0b', dangerous: '#ef4444', unknown: '#64748b' };
    var STATUS_LABEL = { safe: 'Safe', moderate: 'Moderate', dangerous: 'Dangerous', unknown: 'Unknown' };

    function makeIcon(status) {
        var c = STATUS_COLOR[status] || '#64748b';
        var pulse = status === 'dangerous'
            ? '<div style="position:absolute;top:0;left:0;right:0;bottom:0;margin:auto;width:28px;height:28px;border-radius:50%;background:' + c + ';opacity:.3;animation:pulse-ring 1.8s infinite"></div>' : '';
        return L.divIcon({
            html: '<div style="position:relative;width:36px;height:36px">' + pulse + '<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="width:36px;height:36px"><circle cx="18" cy="18" r="10" fill="' + c + '" opacity=".25"/><circle cx="18" cy="18" r="7" fill="' + c + '"/><circle cx="18" cy="18" r="3.5" fill="white"/></svg></div>',
            className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22]
        });
    }

    function badgeClass(s) {
        var map = { safe: 'badge-safe', moderate: 'badge-moderate', dangerous: 'badge-dangerous', unknown: 'badge-unknown' };
        return map[s] || 'badge-unknown';
    }

    function showToast(msg) {
        var t = document.getElementById('admin-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2800);
    }
    window.showToast = showToast;

    var adminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    window.isAdmin = adminLoggedIn; // Ensure global visibility for weather logic

    if (adminLoggedIn) {
        var uv = document.getElementById('user-view');
        var ap = document.getElementById('admin-panel');
        if (uv) uv.style.display = 'none';
        if (ap) ap.style.display = 'block';
        setTimeout(initAdminPanel, 150);
    } else {
        initUserMap();
    }

    function initUserMap() {
        var map = L.map('patas-map', { center: [13.339777, 121.119899], zoom: 15, zoomControl: false});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);
        map.setMaxBounds(L.latLngBounds([13.332701,121.118374],[13.346492,121.123030]).pad(0.05));
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        
        var legend = L.control({ position: 'bottomleft' });
        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = '<h4>Flood Status</h4>' +
                '<div><span class="legend-dot" style="background:#22c55e"></span>Safe</div>' +
                '<div><span class="legend-dot" style="background:#f59e0b"></span>Moderate</div>' +
                '<div><span class="legend-dot" style="background:#ef4444"></span>Dangerous</div>' +
                '<div><span class="legend-dot" style="background:#64748b"></span>Unknown</div>';
            return div;
        };
        legend.addTo(map);

        var uMarkerMap = {};
        function renderMarkers() {
            Object.values(uMarkerMap).forEach(function (m) { map.removeLayer(m); });
            uMarkerMap = {};
            getPOIs().forEach(function (poi) {
                var m = L.marker([poi.lat, poi.lng], { icon: makeIcon(poi.status) })
                    .addTo(map)
                    .bindPopup(
                        '<div style="min-width:200px;padding:4px">' +
                        '<strong style="font-size:14px">' + poi.name + '</strong><br>' +
                        '<span class="popup-badge ' + badgeClass(poi.status) + '">' + STATUS_LABEL[poi.status] + '</span>' +
                        '<p style="font-size:12px;color:#555;margin-bottom:4px">' + poi.desc + '</p>' +
                        '<a class="popup-report-btn" href="./reports.html?loc=' + encodeURIComponent(poi.name) + '">Submit a Report</a>' +
                        '</div>',
                        { maxWidth: 260 }
                    );
                uMarkerMap[poi.id] = m;
            });
        }
        renderMarkers();
        window.addEventListener('storage', function (e) {
            if (e.key === LS.POIS_KEY) renderMarkers();
        });
    }

    var adminMap;
    var aMarkerMap = {};
    var pois = [];

    function initAdminPanel() {
        pois = getPOIs();
        adminMap = L.map('admin-map', { center: [13.339777, 121.119899], zoom: 15, zoomControl: false});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(adminMap);
        adminMap.setMaxBounds(L.latLngBounds([13.332701,121.118374],[13.346492,121.123030]).pad(0.05));
        L.control.zoom({ position: 'bottomright' }).addTo(adminMap);

        var list = document.getElementById('admin-poi-list');
        if (list && !list.dataset.pillBound) {
            list.dataset.pillBound = '1';
            list.addEventListener('click', function (e) {
                var pill = e.target.closest('.pill');
                if (!pill || !pill.dataset.poiId) return;
                e.stopPropagation();
                setStatus(pill.dataset.poiId, pill.dataset.status);
            });
        }
        renderAll();
    }

    function renderAll() {
        renderSidebar();
        renderAdminMarkers();
    }

    function renderSidebar() {
        var list = document.getElementById('admin-poi-list');
        if (!list) return;
        list.innerHTML = '';
        pois.forEach(function (poi) {
            var card = document.createElement('div');
            card.className = 'poi-card';
            card.id = 'card-' + poi.id;
            var pillsHtml = ['safe', 'moderate', 'dangerous', 'unknown'].map(function (s) {
                var active = poi.status === s ? 'active-pill' : '';
                return '<span class="pill pill-' + s + ' ' + active + '" data-poi-id="' + poi.id + '" data-status="' + s + '">' + STATUS_LABEL[s] + '</span>';
            }).join('');
            card.innerHTML =
                '<div class="poi-card-name">' + poi.name + '</div>' +
                '<div class="poi-card-coords">' + poi.lat.toFixed(6) + ', ' + poi.lng.toFixed(6) + '</div>' +
                '<div class="status-pills">' + pillsHtml + '</div>';
            card.addEventListener('click', function () {
                adminMap.flyTo([poi.lat, poi.lng], 17, { duration: 0.8 });
                if (aMarkerMap[poi.id]) aMarkerMap[poi.id].openPopup();
                document.querySelectorAll('.poi-card').forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');
            });
            list.appendChild(card);
        });
    }

    function renderAdminMarkers() {
        Object.values(aMarkerMap).forEach(function (m) { adminMap.removeLayer(m); });
        aMarkerMap = {};
        pois.forEach(function (poi) {
            var m = L.marker([poi.lat, poi.lng], { icon: makeIcon(poi.status) })
                .addTo(adminMap)
                .bindPopup(
                    '<div style="min-width:190px;padding:4px">' +
                    '<strong style="font-size:14px">' + poi.name + '</strong><br>' +
                    '<span class="popup-badge ' + badgeClass(poi.status) + '">' + STATUS_LABEL[poi.status] + '</span>' +
                    '<p style="font-size:12px;color:#555">' + poi.desc + '</p>' +
                    '</div>',
                    { maxWidth: 240 }
                );
            aMarkerMap[poi.id] = m;
        });
    }

    function setStatus(id, status) {
        var prev = pois.find(function (p) { return p.id === id; });
        if (!prev || prev.status === status) return;
        if (LS.addZoneEvent) {
            LS.addZoneEvent({
                id: LS.generateId(),
                poiId: id,
                poiName: prev.name,
                fromStatus: prev.status,
                toStatus: status,
                createdAt: Date.now(),
                timestamp: new Date().toLocaleString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
            });
        }
        pois = pois.map(function (p) { return p.id === id ? Object.assign({}, p, { status: status }) : p; });
        savePOIs(pois);
        renderAll();
        showToast('Status updated → ' + STATUS_LABEL[status]);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    }
})();

// ── WEATHER SYSTEM (OUTSIDE IIFE FOR GLOBAL ACCESS) ──
const weatherState = { user: false, admin: false };
const weatherAnimIds = { user: null, admin: null };

function toggleWeather(which) {
    weatherState[which] = !weatherState[which];
    const btn = document.getElementById(which + '-weather-btn');
    if(!btn) return;

    if (weatherState[which]) {
        btn.textContent = '🌧️ Rain ON';
        btn.style.color = 'lightgreen';
        btn.style.borderColor = 'lightgreen';

        if (which === 'admin') {
            if (typeof showMessage === "function") {
                showMessage("Heavy Rains Successfully Reported", "warning");
            }
        } else {
            if (window.showWeatherWarning) {
                showWeatherWarning("Heavy Rains mode activated. Visualizing current weather conditions.");
            }
        }
        startWeather(which);
    } else {
        btn.textContent = '☀️ Rain OFF';
        btn.style.color = '#f59e0b';
        btn.style.borderColor = '#f59e0b';
        stopWeather(which);
        if (typeof showMessage === "function") {
            showMessage("Heavy Rains Successfully Turned Off", "success");
        }
    }
}

function startWeather(which) {
    const canvas = document.getElementById(which + '-weather-canvas');
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth || 800;
    canvas.height = parent.offsetHeight || 420;

    const ctx = canvas.getContext('2d');
    const drops = createDrops(500, canvas.width, canvas.height);
    
    // Cloud offset logic based on user type
    let cloudYOffset = window.isAdmin ? 20 : 49;
    const clouds = createClouds(25, canvas.width, cloudYOffset);

    function loop() {
        drawFrame(ctx, drops, clouds, canvas.width, canvas.height);
        weatherAnimIds[which] = requestAnimationFrame(loop);
    }
    loop();
}

function stopWeather(which) {
    if (weatherAnimIds[which]) cancelAnimationFrame(weatherAnimIds[which]);
    const canvas = document.getElementById(which + '-weather-canvas');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function createDrops(count, w, h) {
    return Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        speed: 3.5 + Math.random() * 4,
        length: 9 + Math.random() * 10,
        opacity: 0.25 + Math.random() * 0.45,
        wind: 0.8 + Math.random() * 0.6
    }));
}

function createClouds(count, w, yStart) {
    return Array.from({ length: count }, (_, i) => ({
        x: (i * (w / count)) * 1.5 - 100,
        y: yStart + Math.random() * 40,
        speed: 0.15 + Math.random() * 0.25,
        puffs: buildPuffs()
    }));
}

function buildPuffs() {
    return [
        { dx: 0, dy: 0, rx: 55, ry: 28 },
        { dx: 45, dy: -10, rx: 42, ry: 25 },
        { dx: -38, dy: -6, rx: 38, ry: 22 },
        { dx: 80, dy: 5, rx: 35, ry: 20 },
        { dx: 22, dy: 8, rx: 30, ry: 18 },
    ];
}

function drawFrame(ctx, drops, clouds, w, h) {
    ctx.clearRect(0, 0, w, h);
    drops.forEach(drop => {
        ctx.save();
        ctx.globalAlpha = drop.opacity;
        const grad = ctx.createLinearGradient(drop.x, drop.y, drop.x - drop.wind, drop.y + drop.length);
        grad.addColorStop(0, 'rgba(100,180,255,0)');
        grad.addColorStop(0.4, 'rgba(80,160,255,0.95)');
        grad.addColorStop(1, 'rgba(150,150,150,0.8)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.wind, drop.y + drop.length);
        ctx.stroke();
        ctx.restore();
        drop.y += drop.speed;
        drop.x -= drop.wind * 0.4;
        if (drop.y > h + 20) { drop.y = -20; drop.x = Math.random() * w; }
    });

    clouds.forEach(cloud => {
        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 10;
        cloud.puffs.forEach(p => {
            const grad = ctx.createRadialGradient(p.dx, p.dy - 8, 2, p.dx, p.dy, p.rx);
            grad.addColorStop(0, 'rgba(255,255,255,0.98)');
            grad.addColorStop(0.5, 'rgba(235,235,235,0.85)');
            grad.addColorStop(1, 'rgba(210,210,210,0.0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(p.dx, p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        cloud.x += cloud.speed;
        if (cloud.x > w + 140) cloud.x = -250;
    });
}

function showWeatherWarning(msg) {
    const modal = document.getElementById('weather-modal');
    const msgEl = document.getElementById('modal-msg');
    if (!modal || !msgEl) return; 
    if (msg) msgEl.textContent = msg;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('weather-modal');
    if(modal) modal.classList.remove('show');
}

// ── BOOT ──
window.addEventListener('DOMContentLoaded', () => {
    // Show buttons if admin
    if (window.isAdmin) {
        document.querySelectorAll('.weather-toggle-btn').forEach(btn => {
            btn.style.display = 'flex';
        });
    } else {
        // Auto popup for users
        setTimeout(() => {
            if (typeof showWeatherWarning === "function") {
                showWeatherWarning("Warning: Heavy rain is expected in the area. Please stay alert and monitor flood levels.");
            }
        }, 1000);
    }
});
