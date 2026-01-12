import { importGtfs } from 'gtfs';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;    
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const FEED_URL = `https://apitransporte.buenosaires.gob.ar/subtes/feed-gtfs?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;

const config = {
    agencies: [
        { 
            url: FEED_URL,
        }
    ],
    sqlitePath: './gtfs_local.db',
};

async function run() {
  try {
    console.log("📥 Descargando datos del GCBA...");
    
    await importGtfs(config);
    
  } catch (err) {
    console.error(err);
  }
}

run();