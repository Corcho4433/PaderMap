import './style.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

export const setupMap = () => {

    const map = L.map('map').setView([-34.6037, -58.3816], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
    }).addTo(map);


    let userMarker: L.Marker;

    const locateUser = async () => {
        try {
            const coordinates = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
            });

            const { latitude, longitude } = coordinates.coords;
            const latLng: L.LatLngExpression = [latitude, longitude];

            map.setView(latLng, 16);

            if (userMarker) {
                userMarker.setLatLng(latLng);
            } else {
                userMarker = L.marker(latLng).addTo(map)
                    .bindPopup("Tu ubicación");
            }

            return coordinates.coords;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    return { map, locateUser };
}