import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const photosRoot = path.join(projectRoot, 'public', 'photos');

const args = new Set(process.argv.slice(2));
const widthArg = process.argv.find((a) => a.startsWith('--width='));
const qualityArg = process.argv.find((a) => a.startsWith('--quality='));

const WIDTH = widthArg ? Number(widthArg.split('=')[1]) : 512;
const QUALITY = qualityArg ? Number(qualityArg.split('=')[1]) : 72;
const DRY_RUN = args.has('--dry');
const OVERWRITE = args.has('--overwrite');

if (!Number.isFinite(WIDTH) || WIDTH <= 0) {
  throw new Error(`Invalid --width: ${WIDTH}`);
}
if (!Number.isFinite(QUALITY) || QUALITY <= 0 || QUALITY > 100) {
  throw new Error(`Invalid --quality: ${QUALITY}`);
}

const supportedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const isThumb = (fileName) => fileName.includes('.thumb.');

const toThumbPath = (filePath) => {
  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  return `${base}.thumb${ext}`;
};

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile()) yield fullPath;
  }
}

const formatSize = (bytes) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)}MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)}KB`;
};

const processOne = async (srcPath) => {
  const ext = path.extname(srcPath);
  const extLower = ext.toLowerCase();
  const fileName = path.basename(srcPath);

  if (isThumb(fileName)) return { kind: 'skip', reason: 'already-thumb' };
  if (!supportedExt.has(extLower)) return { kind: 'skip', reason: 'unsupported' };

  const thumbPath = toThumbPath(srcPath);

  try {
    await fs.access(thumbPath);
    if (!OVERWRITE) return { kind: 'skip', reason: 'exists' };
  } catch {
    // doesn't exist
  }

  const before = await fs.stat(srcPath);

  if (DRY_RUN) {
    return { kind: 'dry', srcPath, thumbPath, beforeBytes: before.size };
  }

  const image = sharp(srcPath, { failOn: 'none' }).rotate();
  const resized = image.resize({
    width: WIDTH,
    withoutEnlargement: true,
  });

  if (extLower === '.jpg' || extLower === '.jpeg') {
    await resized
      .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
      .toFile(thumbPath);
  } else if (extLower === '.png') {
    await resized
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(thumbPath);
  } else if (extLower === '.webp') {
    await resized
      .webp({ quality: QUALITY })
      .toFile(thumbPath);
  } else if (extLower === '.avif') {
    await resized
      .avif({ quality: Math.max(1, Math.min(QUALITY, 80)) })
      .toFile(thumbPath);
  } else {
    // Fallback (shouldn't happen due to supportedExt)
    await resized.toFile(thumbPath);
  }

  const after = await fs.stat(thumbPath);
  return {
    kind: 'ok',
    srcPath,
    thumbPath,
    beforeBytes: before.size,
    afterBytes: after.size,
  };
};

const main = async () => {
  console.log(`photos root: ${photosRoot}`);
  console.log(`thumbs: width=${WIDTH}, quality=${QUALITY}, dry=${DRY_RUN}, overwrite=${OVERWRITE}`);

  let made = 0;
  let skipped = 0;
  let savedBytes = 0;

  for await (const filePath of walk(photosRoot)) {
    const res = await processOne(filePath);

    if (res.kind === 'ok') {
      made += 1;
      savedBytes += Math.max(0, res.beforeBytes - res.afterBytes);
      const relSrc = path.relative(projectRoot, res.srcPath);
      const relThumb = path.relative(projectRoot, res.thumbPath);
      console.log(`OK  ${relThumb}  (${formatSize(res.beforeBytes)} -> ${formatSize(res.afterBytes)}) from ${relSrc}`);
      continue;
    }

    if (res.kind === 'dry') {
      made += 1;
      const relThumb = path.relative(projectRoot, res.thumbPath);
      console.log(`DRY ${relThumb}`);
      continue;
    }

    skipped += 1;
  }

  console.log(`\nDone. generated=${made}, skipped=${skipped}, saved≈${formatSize(savedBytes)}`);
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
