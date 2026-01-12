import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite } from "@capacitor-community/sqlite";

const sqlite = new SQLiteConnection(CapacitorSQLite);

export async function getShapesForVisibleRoutes(): Promise<any[]> {
    try {
        await sqlite.copyFromAssets();
        const db = await sqlite.retrieveConnection("gtfs_local", false);
        await db.open();

        const query = `
            SELECT DISTINCT 
                s.shape_id, 
                s.shape_pt_lat, 
                s.shape_pt_lon, 
                s.shape_pt_sequence,
                r.route_color 
            FROM shapes s
            JOIN trips t ON s.shape_id = t.shape_id
            JOIN routes r ON t.route_id = r.route_id
            ORDER BY s.shape_id, s.shape_pt_sequence
        `;

        const res = await db.query(query);
        if (!res.values){
            alert("No hay shapes para mostrar");
        }
        await db.close();
        return res.values || [];
    } catch (e) {
        console.error("Error en SQL Shapes:", e);
        return [];
    }
}


export async function getNearbyStops(lat?: number, lon?: number) {
    try {
        await sqlite.copyFromAssets(); 
        const isConn = await sqlite.isConnection("gtfs_local", false);
        let db: SQLiteDBConnection;
        
        if (isConn.result) {
            db = await sqlite.retrieveConnection("gtfs_local", false);
        } else {
            db = await sqlite.createConnection("gtfs_local", false, "no-encryption", 1, false);
        }

        await db.open();

        let query: string;
        let params: any[] = [];

        if (lat !== undefined && lon !== undefined) {
            // Cargar cercanas (rango de ~1km)
            query = `
                SELECT stop_name, stop_lat, stop_lon 
                FROM stops 
                WHERE stop_lat BETWEEN ? AND ?
                AND stop_lon BETWEEN ? AND ?
            `;
            params = [lat - 0.01, lat + 0.01, lon - 0.01, lon + 0.01];
        } else {
            // Cargar todas (ponemos un LIMIT para que el mapa no explote si hay miles)
            query = `SELECT stop_name, stop_lat, stop_lon FROM stops LIMIT 500`;
        }

        const res = await db.query(query, params);
        await db.close();

        return res.values || [];

    } catch (e) {
        console.error("Error en SQLite:", e);
        return [];
    }
}