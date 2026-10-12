// Genera los PNG para redes sociales e íconos a partir de los SVG de marca.
// Uso: npm run images
import sharp from 'sharp';

const jobs = [
  { src: 'public/og.svg', out: 'public/og.png', width: 1200, height: 630 },
  { src: 'public/favicon.svg', out: 'public/apple-touch-icon.png', width: 180, height: 180, bg: '#0b0d0c', pad: 18 },
  { src: 'public/favicon.svg', out: 'public/icon-512.png', width: 512, height: 512, bg: '#0b0d0c', pad: 96 },
];

for (const j of jobs) {
  if (j.pad) {
    const inner = await sharp(j.src, { density: 600 }).resize(j.width - j.pad * 2, j.height - j.pad * 2).png().toBuffer();
    await sharp({ create: { width: j.width, height: j.height, channels: 4, background: j.bg } })
      .composite([{ input: inner, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(j.out);
  } else {
    await sharp(j.src, { density: 144 }).resize(j.width, j.height).png({ compressionLevel: 9 }).toFile(j.out);
  }
  console.log('✓', j.out);
}
