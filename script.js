// ELEMENT
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const cityInput = document.getElementById("cityInput");

const weatherCard = document.getElementById("weatherCard");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const desc = document.getElementById("desc");
const wind = document.getElementById("wind");
const humidity = document.getElementById("humidity");
const windDir = document.getElementById("windDir");
const dateTime = document.getElementById("dateTime");

// ========================
// JAM REALTIME
// ========================
function updateTime() {
  const now = new Date();
  dateTime.innerText = now.toLocaleString("id-ID", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}
setInterval(updateTime, 1000);
updateTime();

// ========================
// HELPER UI
// ========================
function showLoading() {
  loading.classList.remove("hidden");
  weatherCard.classList.add("hidden");
  errorBox.classList.add("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showError(msg = "❌ Kota tidak ditemukan") {
  errorBox.innerText = msg;
  errorBox.classList.remove("hidden");
}

function showWeather() {
  weatherCard.classList.remove("hidden");
}

// ========================
// KONVERSI ARAH ANGIN
// ========================
function getWindDirection(deg) {
  const directions = ["Utara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

// ========================
// KONVERSI WEATHER CODE
// ========================
function getWeatherDesc(code) {
  if (code === 0) return "Cerah ☀️";
  if (code <= 3) return "Berawan ⛅";
  if (code <= 48) return "Berkabut 🌫️";
  if (code <= 67) return "Hujan 🌧️";
  if (code <= 77) return "Salju ❄️";
  if (code <= 99) return "Badai ⛈️";
  return "Tidak diketahui";
}

// ========================
// FETCH CUACA
// ========================
async function fetchWeather(lat, lon, city = "Lokasi Kamu") {
  showLoading();

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`;

    const res = await fetch(url);
    const data = await res.json();

    const weather = data.current_weather;

    // AMBIL HUMIDITY DARI HOURLY
    const humidityData = data.hourly.relativehumidity_2m[0];

    // UPDATE UI
    cityName.innerText = city;
    temp.innerText = `${weather.temperature}°C`;
    desc.innerText = getWeatherDesc(weather.weathercode);
    wind.innerText = `${weather.windspeed} km/h`;
    windDir.innerText = getWindDirection(weather.winddirection);
    humidity.innerText = `${humidityData}%`;

    // SIMPAN KE LOCAL
    localStorage.setItem("lastWeather", JSON.stringify({ lat, lon, city }));

    hideLoading();
    showWeather();

  } catch (err) {
    console.log(err);
    hideLoading();
    showError("❌ Gagal ambil data cuaca");
  }
}

// ========================
// GPS
// ========================
function getLocation() {
  if (navigator.geolocation) {
    showLoading();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchWeather(lat, lon);
      },
      () => {
        hideLoading();
        showError("❌ Izin lokasi ditolak");
      }
    );
  }
}

// ========================
// SEARCH KOTA (GEOCODING)
// ========================
async function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return;

  showLoading();

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
    const res = await fetch(geoUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      hideLoading();
      showError();
      return;
    }

    const place = data.results[0];

    fetchWeather(place.latitude, place.longitude, place.name);

  } catch (err) {
    console.log(err);
    hideLoading();
    showError("❌ Error cari kota");
  }
}

// ========================
// EVENT
// ========================
searchBtn.addEventListener("click", searchCity);
locBtn.addEventListener("click", getLocation);

// ENTER = SEARCH
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchCity();
});

// ========================
// AUTO LOAD TERAKHIR
// ========================
window.onload = () => {
  const last = JSON.parse(localStorage.getItem("lastWeather"));

  if (last) {
    fetchWeather(last.lat, last.lon, last.city);
  } else {
    getLocation();
  }
};