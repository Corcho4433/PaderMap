import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setupMap } from './map';
import { getNearbyStops, getShapesForVisibleRoutes } from './services/gtfs';

const { locateUser, map } = setupMap();

// --- Creación del Botón Material FAB ---
const locateButton = document.createElement('button');

// Usamos un span para el icono de Material
locateButton.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
locateButton.className = 'fab-locate'; // Clase para el CSS
locateButton.onclick = locateUser;

document.body.appendChild(locateButton);

let isLoading = false;
let activePolylines: L.Polyline[] = [];

// --- Lógica de Transporte ---
async function loadTransportData() {
    if (isLoading) return;
    isLoading = true;

    try {
        const center = map.getCenter();
        
        // 1. Traer Paradas cercanas
        const stops = await getNearbyStops(center.lat, center.lng);

        // 3. Traer Shapes SOLO de esas rutas
        const shapePoints = await getShapesForVisibleRoutes();

        // Limpiar capas anteriores
        activePolylines.forEach(p => map.removeLayer(p));
        activePolylines = [];
        map.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker) map.removeLayer(layer);
        });

        // 4. Agrupar y Dibujar
        const shapesGrouped = shapePoints.reduce((acc, point) => {
            if (!acc[point.shape_id]) {
                acc[point.shape_id] = { 
                    points: [], 
                    // Agregamos el # si no lo tiene
                    color: point.route_color ? `#${point.route_color}` : "#3388ff" 
                };
            }
            acc[point.shape_id].points.push([point.shape_pt_lat, point.shape_pt_lon]);
            return acc; 
        }, {} as Record<string, { points: L.LatLngExpression[]; color: string; }>);

        Object.keys(shapesGrouped).forEach(shapeId => {
            const shape = shapesGrouped[shapeId];
            const poly = L.polyline(shape.points, {
                color: shape.color,
                weight: 4,
                opacity: 1,
                smoothFactor: 1.5 // Clave para rendimiento en Android
            }).addTo(map);

            activePolylines.push(poly);
        });

        // 5. Dibujar Paradas
        stops.forEach(s => {
            L.circleMarker([s.stop_lat, s.stop_lon], {
                radius: 6,
                fillColor: "#32db64",
                color: "#fff",
                weight: 2,
                fillOpacity: 0.9
            }).addTo(map).bindPopup(`<b>${s.stop_name}</b>`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        isLoading = false;
    }
}

// --- EVENTOS ---

// 1. Al cargar la app por primera vez
loadTransportData();

// 2. Al terminar de mover el mapa (arrastrar o zoom)
map.on('moveend', () => {
    console.log("El mapa se movió, actualizando paradas...");
    loadTransportData();
});

// 3. Modificamos el click del botón para que no solo ubique, sino que fuerce la carga
locateButton.onclick = async () => {
    await locateUser();
    // loadTransportData se disparará solo gracias al evento 'moveend' 
    // que se activa cuando locateUser hace el map.setView()
};