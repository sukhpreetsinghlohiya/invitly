import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('public/images/ceremonies', { recursive: true });
const report = [];
for (const id of ['haldi','sangeet','mehndi','reception','baraat']) {
  const source = `artifacts/generated-originals/ceremonies/${id}.png`;
  const original = await sharp(source).metadata();
  if (!original.hasAlpha) throw new Error(`${id} needs genuine transparency.`);
  const target = `public/images/ceremonies/${id}.webp`;
  const result = await sharp(source).resize(600,450,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82,alphaQuality:100,effort:6}).toFile(target);
  const stats = await sharp(target).stats();
  if (stats.channels[3].min !== 0 || stats.channels[3].max !== 255) throw new Error(`${id} lost alpha.`);
  report.push({id,source,target,width:result.width,height:result.height,bytes:result.size,transparent:true});
}
await writeFile('artifacts/generated-originals/ceremonies/asset-sizes.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
