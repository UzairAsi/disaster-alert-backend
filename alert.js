const admin = require('firebase-admin');
const axios = require('axios');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// const MY_LAT = 19.2100;  // Kandivali West, Mumbai
// const MY_LON = 72.8400;
// const RADIUS_KM = 50;    // Kandivali is dense; 50km is a reasonable radius, can adjust later

const MY_LAT = 19.2125;  // Kandivali East-West midpoint
const MY_LON = 72.8550;
const RADIUS_KM = 50;    // keeps coverage wide enough for both

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function main() {
  const url = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=orange;red';
  const res = await axios.get(url);
  const features = res.data.features || [];
  console.log(`GDACS returned ${features.length} alerts`);

  const nearby = features.filter(f => {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) return false;
    const [lon, lat] = coords;
    const dist = distanceKm(MY_LAT, MY_LON, lat, lon);
    if (dist <= RADIUS_KM) {
      console.log(`  → ${f.properties?.name} @ ${dist.toFixed(1)}km`);
      return true;
    }
    return false;
  });

  console.log(`Alerts within ${RADIUS_KM}km of Kandivali: ${nearby.length}`);

  if (nearby.length > 0) {
    const names = nearby.map(f => f.properties?.name || 'Unknown').join(', ');
    await admin.messaging().send({
      topic: 'disaster-alert',
      notification: {
        title: '⚠️ Disaster Alert Nearby',
        body: names
      }
    });
    console.log('FCM sent successfully');
  } else {
    console.log('No alerts within range, no notification sent');
  }
}

main().catch(console.error);