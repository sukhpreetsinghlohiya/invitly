import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Package the supplied transparent logo without redrawing or recoloring it.
const logo = await sharp('assets/source/invitly-logo.png').extract({left:384,top:150,width:547,height:970}).png().toBuffer();
await sharp(logo).resize({height:160}).png({compressionLevel:9}).toFile('public/images/brand/invitly-mark.png');
async function icon(size, background = {r:0,g:0,b:0,alpha:0}) {
  return sharp(logo).resize(size,size,{fit:'contain',background}).extend({top:Math.ceil(size*.07),bottom:Math.ceil(size*.07),left:Math.ceil(size*.07),right:Math.ceil(size*.07),background}).resize(size,size).png({compressionLevel:9}).toBuffer();
}
await writeFile('src/app/icon.png',await icon(192));
await writeFile('src/app/apple-icon.png',await icon(180,'#faf7ef'));
const sizes=[16,32,48,64], pngs=await Promise.all(sizes.map(size=>icon(size)));
const header=Buffer.alloc(6+16*sizes.length); header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
pngs.forEach((png,i)=>{const p=6+16*i;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(png.length,p+8);header.writeUInt32LE(offset,p+12);offset+=png.length;});
await writeFile('src/app/favicon.ico',Buffer.concat([header,...pngs]));

// Slice the transparent imagegen sheet by its isolated sprites, preserving the
// existing alpha and pixels. Sprites have uneven bounds, so equal tile crops
// would clip leaves and ribbons. Connected regions identify each whole sprite.
const {data,info}=await sharp('assets/source/occasion-sheet.png').raw().toBuffer({resolveWithObject:true});
const labels=new Uint8Array(info.width*info.height), seen=new Uint8Array(labels.length);
for(let i=0;i<labels.length;i++) {
  if(seen[i]||data[i*4+3]<20) continue;
  const queue=[i]; seen[i]=1; let sumX=0,sumY=0;
  for(let p=0;p<queue.length;p++) {
    const n=queue[p],x=n%info.width,y=Math.floor(n/info.width);sumX+=x;sumY+=y;
    for(const nn of [x>0?n-1:-1,x<info.width-1?n+1:-1,n-info.width,n+info.width]) {
      if(nn>=0&&nn<labels.length&&!seen[nn]&&data[nn*4+3]>=20) {seen[nn]=1;queue.push(nn);}
    }
  }
  const col=Math.min(2,Math.floor(sumX/queue.length/(info.width/3)));
  const row=Math.min(2,Math.floor(sumY/queue.length/(info.height/3)));
  for(const pixel of queue) labels[pixel]=row*3+col+1;
}
// Include the antialiased edges around each sprite, retaining original alpha.
for(let pass=0;pass<6;pass++) {
  const previous=labels.slice();
  for(let i=0;i<labels.length;i++) if(!labels[i]&&data[i*4+3]>0) {
    for(const n of [i-1,i+1,i-info.width,i+info.width]) if(previous[n]) {labels[i]=previous[n];break;}
  }
}
const names=['wedding','engagement','birthday','baby-shower','housewarming','naming','anniversary','remembrance','other'];
for(let index=0;index<names.length;index++) {
  const pixels=Buffer.alloc(data.length);let left=info.width,right=0,top=info.height,bottom=0;
  for(let i=0;i<labels.length;i++) if(labels[i]===index+1) {
    data.copy(pixels,i*4,i*4,i*4+4);const x=i%info.width,y=Math.floor(i/info.width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  const result=await sharp(pixels,{raw:info}).extract({left,top,width:right-left+1,height:bottom-top+1}).resize(480,360,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:82,alphaQuality:100,effort:6}).toFile(`public/images/occasions/${names[index]}.webp`);
  console.log(`${names[index]}: ${(result.size/1024).toFixed(1)} KiB`);
}
