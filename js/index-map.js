// ═══════════════════════════════════════════════
//  PRIVATE MAP MODULE
// ═══════════════════════════════════════════════
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

    // --- Toast ---
    function showToast(msg) {
        var t = document.getElementById('admin-toast');
        if (!t) { console.log('Toast:', msg); return; }
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2800);
    }
    window.showToast = showToast;

    // --- View Switching ---
    var adminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

    if (adminLoggedIn) {
        var uv = document.getElementById('user-view');
        var ap = document.getElementById('admin-panel');
        if (uv) uv.style.display = 'none';
        if (ap) ap.style.display = 'block';
        setTimeout(initAdminPanel, 150);
    } else {
        initUserMap();
    }

    // --- User Map ---
    function initUserMap() {
        var userMap = L.map('patas-map', { center: [13.339777, 121.119899], zoom: 15, zoomControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(userMap);
        userMap.setMaxBounds(L.latLngBounds([13.332701, 121.118374], [13.346492, 121.123030]).pad(0.05));
        L.control.zoom({ position: 'bottomright' }).addTo(userMap);

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
        legend.addTo(userMap);

        var userMarkers = {};
        function renderMarkers() {
            Object.values(userMarkers).forEach(function (m) { userMap.removeLayer(m); });
            userMarkers = {};
            getPOIs().forEach(function (poi) {
                var m = L.marker([poi.lat, poi.lng], { icon: makeIcon(poi.status) })
                    .addTo(userMap)
                    .bindPopup(
                        '<div style="min-width:200px;padding:4px">' +
                        '<strong style="font-size:14px">' + poi.name + '</strong><br>' +
                        '<span class="popup-badge ' + badgeClass(poi.status) + '">' + STATUS_LABEL[poi.status] + '</span>' +
                        '<p style="font-size:12px;color:#555;margin-bottom:4px">' + poi.desc + '</p>' +
                        '<a class="popup-report-btn" href="./reports.html?loc=' + encodeURIComponent(poi.name) + '">Submit a Report</a>' +
                        '</div>',
                        { maxWidth: 260 }
                    );
                userMarkers[poi.id] = m;
            });
        }
        renderMarkers();

        window.addEventListener('storage', function (e) {
            if (e.key === LS.POIS_KEY) renderMarkers();
        });
    }

    // --- Admin Map ---
    var adminMap;
    var adminMarkers = {};
    var currentPois = [];

    function initAdminPanel() {
        currentPois = getPOIs();
        adminMap = L.map('admin-map', { center: [13.339777, 121.119899], zoom: 15, zoomControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors', maxZoom: 19
        }).addTo(adminMap);
        adminMap.setMaxBounds(L.latLngBounds([13.332701, 121.118374], [13.346492, 121.123030]).pad(0.05));
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

    function renderAll() { renderSidebar(); renderAdminMarkers(); }

    function renderSidebar() {
        var list = document.getElementById('admin-poi-list');
        if (!list) return;
        list.innerHTML = '';
        currentPois.forEach(function (poi) {
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
                if (adminMarkers[poi.id]) adminMarkers[poi.id].openPopup();
                document.querySelectorAll('.poi-card').forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');
            });
            list.appendChild(card);
        });
    }

    function renderAdminMarkers() {
        Object.values(adminMarkers).forEach(function (m) { adminMap.removeLayer(m); });
        adminMarkers = {};
        currentPois.forEach(function (poi) {
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
            adminMarkers[poi.id] = m;
        });
    }

    function setStatus(id, status) {
        var prev = currentPois.find(function (p) { return p.id === id; });
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
        currentPois = currentPois.map(function (p) {
            return p.id === id ? Object.assign({}, p, { status: status }) : p;
        });
        savePOIs(currentPois);
        renderAll();
        showToast('Status updated → ' + STATUS_LABEL[status]);
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    }
})();
