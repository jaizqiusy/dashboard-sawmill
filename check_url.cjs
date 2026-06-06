const https = require('https');
https.get('https://storage.googleapis.com/makenew_2385312/cd423e2a-14d2-430b-a3d8-5b128527a20c.jpeg', (res) => {
  console.log(`Status relative to BS1 image: ${res.statusCode}`);
}).on('error', (e) => {
  console.error(e);
});
