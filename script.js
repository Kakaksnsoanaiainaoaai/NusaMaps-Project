// ================================
// INISIALISASI MAP
// ================================
document.addEventListener('DOMContentLoaded', function() {
    // Koordinat default (Jakarta)
    const defaultLat = -6.2088;
    const defaultLng = 106.8456;

    // Buat map dengan opsi animasi
    const map = L.map('map', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: false, // Kita pakai tombol custom
        fadeAnimation: true,
        zoomAnimation: true
    });

    // Tile layer default (light)
    const lightTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Tile layer dark (CartoDB Dark Matter)
    const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
    });

    // Routing control (disembunyikan panelnya)
    let routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{ color: '#4285F4', opacity: 0.8, weight: 6 }]
        },
        createMarker: function() { return null; } // Hilangkan marker default
    }).addTo(map);
    routingControl.hide(); // Sembunyikan panel rute bawaan

    // ================================
    // VARIABEL GLOBAL
    // ================================
    let currentMarker = null;          // Marker terakhir
    let darkMode = false;              // Status dark mode

    // ================================
    // FUNGSI BANTU
    // ================================
    function showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    function showError(message) {
        const toast = document.getElementById('errorToast');
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // Fungsi menambah marker dengan animasi bounce
    function addMarker(lat, lng, title) {
        // Hapus marker sebelumnya jika ada
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`
            <b>${title}</b><br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lng.toFixed(6)}
        `).openPopup();

        // Animasi bounce
        marker.on('add', function() {
            if (this._icon) {
                this._icon.classList.add('bounce');
                setTimeout(() => this._icon.classList.remove('bounce'), 500);
            }
        });
        currentMarker = marker;
    }

    // Fungsi geocode (pencarian koordinat dari teks)
    async function geocode(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'MapApp/1.0' }
            });
            const data = await response.json();
            if (data.length === 0) return null;
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display: data[0].display_name
            };
        } catch (error) {
            console.error('Geocode error:', error);
            return null;
        }
    }

    // ================================
    // EVENT: KLIK PADA PETA
    // ================================
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        addMarker(lat, lng, 'Lokasi dipilih');
    });

    // ================================
    // SEARCH LOKASI
    // ================================
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length < 3) {
            document.getElementById('search-results').style.display = 'none';
            return;
        }
        searchTimeout = setTimeout(async () => {
            showLoading(true);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'MapApp/1.0' }
                });
                const data = await response.json();
                showLoading(false);
                if (data.length === 0) {
                    showError('Lokasi tidak ditemukan');
                    document.getElementById('search-results').style.display = 'none';
                    return;
                }
                // Tampilkan hasil
                const resultsDiv = document.getElementById('search-results');
                resultsDiv.innerHTML = '';
                data.forEach(place => {
                    const div = document.createElement('div');
                    div.textContent = place.display_name;
                    div.addEventListener('click', () => {
                        const lat = parseFloat(place.lat);
                        const lon = parseFloat(place.lon);
                        map.setView([lat, lon], 16, { animate: true });
                        addMarker(lat, lon, place.display_name);
                        resultsDiv.style.display = 'none';
                        document.getElementById('search-input').value = place.display_name;
                    });
                    resultsDiv.appendChild(div);
                });
                resultsDiv.style.display = 'block';
            } catch (error) {
                showLoading(false);
                showError('Gagal mencari lokasi');
                console.error(error);
            }
        }, 500);
    });

    // Tutup hasil pencarian saat klik di luar
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-results').style.display = 'none';
        }
    });

    // ================================
    // GEOLOKASI
    // ================================
    document.getElementById('geolocateBtn').addEventListener('click', function() {
        if (!navigator.geolocation) {
            showError('Geolokasi tidak didukung');
            return;
        }
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showLoading(false);
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 16, { animate: true });
                addMarker(lat, lng, 'Lokasi Saya');
            },
            (error) => {
                showLoading(false);
                showError('Tidak dapat mengambil lokasi: ' + error.message);
            }
        );
    });

    // ================================
    // ZOOM CUSTOM
    // ================================
    document.getElementById('zoomInBtn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => map.zoomOut());

    // ================================
    // DARK MODE TOGGLE
    // ================================
    document.getElementById('darkModeToggle').addEventListener('click', function() {
        if (darkMode) {
            map.removeLayer(darkTile);
            map.addLayer(lightTile);
            this.textContent = '🌙';
        } else {
            map.removeLayer(lightTile);
            map.addLayer(darkTile);
            this.textContent = '☀️';
        }
        darkMode = !darkMode;
    });

    // ================================
    // PANEL RUTE
    // ================================
    document.getElementById('toggleRouteBtn').addEventListener('click', function() {
        document.getElementById('routePanel').classList.toggle('show');
    });
    document.getElementById('closeRouteBtn').addEventListener('click', function() {
        document.getElementById('routePanel').classList.remove('show');
    });

    document.getElementById('route-btn').addEventListener('click', async function() {
        const start = document.getElementById('start-input').value.trim();
        const end = document.getElementById('end-input').value.trim();
        if (!start || !end) {
            showError('Masukkan lokasi awal dan tujuan');
            return;
        }
        showLoading(true);
        const startCoords = await geocode(start);
        const endCoords = await geocode(end);
        if (!startCoords) {
            showLoading(false);
            showError(`Lokasi awal "${start}" tidak ditemukan`);
            return;
        }
        if (!endCoords) {
            showLoading(false);
            showError(`Lokasi tujuan "${end}" tidak ditemukan`);
            return;
        }
        // Set waypoints
        routingControl.setWaypoints([
            L.latLng(startCoords.lat, startCoords.lon),
            L.latLng(endCoords.lat, endCoords.lon)
        ]);
        // Tampilkan routing, tapi panelnya tetap disembunyikan
        routingControl.show();
        setTimeout(() => routingControl.hide(), 100);
        showLoading(false);

        // Tambahkan marker awal dan tujuan (opsional)
        addMarker(startCoords.lat, startCoords.lon, startCoords.display);
    });
});