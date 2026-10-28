// Generates the Android launcher icons from assets/icon-foreground.svg.
// Run after `npx cap add android`.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const RES = "android/app/src/main/res";
const BG = "#1f4fd6";
if (!fs.existsSync(RES)) { console.error("Run `npx cap add android` first."); process.exit(1); }
const fg = fs.readFileSync("assets/icon-foreground.svg");
const sizes = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };

for (const [d, [legacy, adaptive]] of Object.entries(sizes)) {
  const dir = path.join(RES, `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  await sharp(fg).resize(adaptive, adaptive).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
  const inner = await sharp(fg).resize(Math.round(legacy * 1.5), Math.round(legacy * 1.5)).png().toBuffer();
  const off = Math.round((legacy - legacy * 1.5) / 2);
  const crop = await sharp(inner).extract({ left: -off, top: -off, width: legacy, height: legacy }).toBuffer();
  const sq = await sharp({ create: { width: legacy, height: legacy, channels: 4, background: BG } })
    .composite([{ input: crop }]).png().toBuffer();
  const r = Math.round(legacy * 0.18);
  const roundedMask = Buffer.from(`<svg width="${legacy}" height="${legacy}"><rect width="${legacy}" height="${legacy}" rx="${r}" fill="#fff"/></svg>`);
  const circleMask = Buffer.from(`<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}" fill="#fff"/></svg>`);
  await sharp(sq).composite([{ input: roundedMask, blend: "dest-in" }]).png().toFile(path.join(dir, "ic_launcher.png"));
  await sharp(sq).composite([{ input: circleMask, blend: "dest-in" }]).png().toFile(path.join(dir, "ic_launcher_round.png"));
}
// Splash screens: brand colour with the icon in the middle.
for (const dir of fs.readdirSync(RES).filter(d => d.startsWith("drawable"))) {
  const f = path.join(RES, dir, "splash.png");
  if (!fs.existsSync(f)) continue;
  const { width, height } = await sharp(f).metadata();
  const s = Math.round(Math.min(width, height) * 0.42);
  const logo = await sharp(fg).resize(s, s).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: "center" }]).png().toFile(f + ".tmp");
  fs.renameSync(f + ".tmp", f);
}
const bgFile = path.join(RES, "values", "ic_launcher_background.xml");
fs.mkdirSync(path.dirname(bgFile), { recursive: true });
fs.writeFileSync(bgFile, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);
console.log("Launcher icons generated.");
