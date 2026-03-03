// INIT MAP
const map = L.map('map').setView([-7.98,112.63], 13); // default Malang

// TILE
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors'
}).addTo(map);

// =======================
// LIVE LOCATION
// =======================

let userMarker;
let watchId;

function startLiveLocation(){

    if(!navigator.geolocation){
        alert("Geolocation tidak didukung browser");
        return;
    }

    watchId = navigator.geolocation.watchPosition(position=>{
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if(!userMarker){
            userMarker = L.marker([lat,lng]).addTo(map)
                .bindPopup("📍 Posisi Saya")
                .openPopup();
        }else{
            userMarker.setLatLng([lat,lng]);
        }

        map.setView([lat,lng],15);

    },()=>{
        alert("Izinkan akses lokasi ya 😄");
    },{
        enableHighAccuracy:true
    });
}

// =======================
// ADD MARKER ON CLICK
// =======================

let markers = JSON.parse(localStorage.getItem("nusamarkers")) || [];

function saveMarkers(){
    localStorage.setItem("nusamarkers",JSON.stringify(markers));
}

function loadMarkers(){
    markers.forEach(m=>{
        const marker = L.marker([m.lat,m.lng]).addTo(map)
            .bindPopup(m.name);
    });
}

map.on("click",function(e){
    const name = prompt("Nama lokasi?");
    if(!name) return;

    const marker = L.marker([e.latlng.lat,e.latlng.lng])
        .addTo(map)
        .bindPopup(name);

    markers.push({
        lat:e.latlng.lat,
        lng:e.latlng.lng,
        name:name
    });

    saveMarkers();
});

loadMarkers();

// =======================
// BUTTONS
// =======================

document.getElementById("locateBtn").onclick = ()=>{
    startLiveLocation();
};

document.getElementById("clearBtn").onclick = ()=>{
    if(confirm("Hapus semua marker?")){
        localStorage.removeItem("nusamarkers");
        location.reload();
    }
};