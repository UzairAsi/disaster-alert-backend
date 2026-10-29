const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendTest() {
  try {
    const response = await admin.messaging().send({
      topic: 'disaster-alert',
      notification: {
        title: '🚨 EMERGENCY: Flood Warning',
        body: 'Severe waterlogging reported near Poisar Gymkhana. Move to higher ground.'
      },
      data: {
        alertType: 'FLOOD', // Keep values as simple strings
      },
      android: {
        priority: 'high'
      }
    });
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.log('Error sending message:', error);
  }
}

sendTest();