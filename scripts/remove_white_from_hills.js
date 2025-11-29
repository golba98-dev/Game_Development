

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const hillsDir = path.join(__dirname, '../assets/1-Background/2-Game/1-Forest');

fs.readdir(hillsDir, async (err, files) => {
  if (err) throw err;
  const hillFiles = files.filter(f => /^1-hill_.*\.png$/.test(f));
  for (const file of hillFiles) {
    const filePath = path.join(hillsDir, file);
    const image = await Jimp.read(filePath);
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; 
      }
    });
    await image.writeAsync(filePath);
    console.log(`Processed: ${file}`);
  }
  console.log('All hill images processed.');
});

