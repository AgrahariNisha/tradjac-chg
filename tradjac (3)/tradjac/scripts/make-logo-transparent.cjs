const Jimp = require('jimp');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'Tradjac Logo.jpeg');
const out = path.join(root, 'assets', 'tradjac-logo-transparent.png');

Jimp.read(src).then((img) => {
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r > 242 && g > 242 && b > 242) {
      this.bitmap.data[idx + 3] = 0;
    } else if (r < 22 && g < 22 && b < 22) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
  return img.write(out);
}).then(() => {
  console.log('Wrote', out);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
