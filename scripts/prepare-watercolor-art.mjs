import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const ids = ['wedding', 'engagement', 'birthday', 'baby-shower', 'housewarming', 'marigold'];
const sourceDirectory = 'artifacts/generated-originals/watercolor';
const destination = 'public/images/watercolor';
await mkdir(destination, { recursive: true });
const report = [];

for (const id of ids) {
  const source = `${sourceDirectory}/${id}.png`;
  const metadata = await sharp(source).metadata();
  const originalStats = await sharp(source).stats();
  if (!metadata.hasAlpha || originalStats.channels.at(-1).min !== 0) {
    throw new Error(`${id}: the generated original must contain genuine alpha transparency.`);
  }
  const target = `${destination}/${id}.webp`;
  // Keep the generated alpha; normalize only size, breathing room and encoding.
  const output = await sharp(source)
    .resize(736, 552, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 24, bottom: 24, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 86, alphaQuality: 100, effort: 6 })
    .toFile(target);
  const stats = await sharp(target).stats();
  if (stats.channels.at(-1).min !== 0 || stats.channels.at(-1).max !== 255) {
    throw new Error(`${id}: transparency or opaque subject was lost.`);
  }
  report.push({ id, target, width: output.width, height: output.height, bytes: output.size, transparent: true });
}

await writeFile(`${sourceDirectory}/asset-sizes.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
