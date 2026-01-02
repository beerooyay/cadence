const icongen = require('icon-gen');
const path = require('path');

icongen(path.join(__dirname, 'icon.png'), __dirname, {
  report: true,
  icns: { name: 'icon', sizes: [16, 32, 64, 128, 256, 512, 1024] }
}).then(results => {
  console.log('icon generated:', results);
}).catch(err => {
  console.error('error:', err);
});
