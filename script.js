// ================= MAP =================
const map = L.map('map').setView([-6.200000, 106.816666], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker([-6.200000, 106.816666])
  .addTo(map)
  .bindPopup('Ini Jakarta!')
  .openPopup();


// ================= USER LOCATION =================
let userLatLng = null;
let routingControl = null;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    userLatLng = L.latLng(
      position.coords.latitude,
      position.coords.longitude
    );

    L.marker(userLatLng)
      .addTo(map)
      .bindPopup("Lokasi Saya");

    map.setView(userLatLng, 14);
  }, () => {
    console.log("User menolak akses lokasi");
  });
}


// ================= CREATE ROUTE =================
function createRoute(destinationLat, destinationLng) {

  if (!userLatLng) {
    alert("Aktifkan lokasi dulu bro 📍");
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      userLatLng,
      L.latLng(destinationLat, destinationLng)
    ],
    routeWhileDragging: false,
    showAlternatives: true,
    lineOptions: {
      styles: [{ color: '#22c55e', weight: 6 }]
    },
    createMarker: function () { return null; }
  }).addTo(map);
}


// ================= NAVBAR SCROLL =================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});


// ================= HAMBURGER =================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}


// ================= AUTOCOMPLETE SEARCH =================
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");

let debounceTimer;

if (searchInput) {

  searchInput.addEventListener("input", function () {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

      const query = this.value.trim();

      if (query.length < 3) {
        suggestionsBox.style.display = "none";
        return;
      }

      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&addressdetails=1&limit=7`)
      .then(res => res.json())
      .then(data => {

        suggestionsBox.innerHTML = "";

        if (data.length === 0) {
          suggestionsBox.style.display = "none";
          return;
        }

        suggestionsBox.style.display = "block";

        data.forEach(place => {

          const div = document.createElement("div");
          div.classList.add("suggestion-item");
          div.textContent = place.display_name;

          div.addEventListener("click", () => {

            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);

            map.setView([lat, lon], 16);

            if (marker) {
              map.removeLayer(marker);
            }

            marker = L.marker([lat, lon])
              .addTo(map)
              .bindPopup(`<b>${place.display_name}</b>`)
              .openPopup();

            // 🔥 AUTO BUAT RUTE
            createRoute(lat, lon);

            suggestionsBox.style.display = "none";
            searchInput.value = place.display_name;

          });

          suggestionsBox.appendChild(div);

        });

      })
      .catch(err => {
        console.error("Search error:", err);
        suggestionsBox.style.display = "none";
      });

    }, 400);

  });

}


// ================= KLIK LUAR SEARCH =================
document.addEventListener("click", function (e) {

  const searchContainer = document.querySelector(".search-container");

  if (searchContainer && !searchContainer.contains(e.target)) {
    suggestionsBox.style.display = "none";
  }

});