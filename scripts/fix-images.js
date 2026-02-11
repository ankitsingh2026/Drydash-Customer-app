// scripts/fix-images.js
const sharp = require("sharp");
const fs = require("fs").promises;
const files = [
  "assets/images/hero_onsite.png",
  "assets/images/hero_shoespa.png",
];

(async () => {
  for (const f of files) {
    try {
      await sharp(f)
        .png({ compressionLevel: 9, adaptiveFiltering: false })
        .toFile(f + ".fixed.png");
      await fs.rename(f + ".fixed.png", f);
      console.log("Fixed:", f);
    } catch (e) {
      console.error("Failed to process", f, e.message);
    }
  }
})();
