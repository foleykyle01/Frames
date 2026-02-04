#!/usr/bin/env node
/**
 * Icon Generation Script for Frame
 * Generates a macOS .icns icon from a programmatically created SVG
 *
 * Usage: node scripts/generate-icon.js
 * Requires: macOS (uses iconutil)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const ICONSET_DIR = path.join(BUILD_DIR, 'icon.iconset');

// SVG template for the Frame icon
// Three overlapping rounded squares offset down-right, amber accent on dark background
function createSVG(size) {
  const pad = size * 0.12;       // outer padding
  const frameW = size * 0.28;    // each frame square size
  const r = size * 0.045;        // corner radius of inner frames
  const outerR = size * 0.22;    // corner radius of background
  const stroke = size * 0.016;   // frame border thickness
  const offset = size * 0.09;    // offset between each frame

  // Three frame positions (back to front), centered within the background
  const f1x = pad + size * 0.12;
  const f1y = pad + size * 0.12;
  const f2x = f1x + offset;
  const f2y = f1y + offset;
  const f3x = f2x + offset;
  const f3y = f2y + offset;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1c"/>
      <stop offset="100%" stop-color="#0f0f10"/>
    </linearGradient>
    <linearGradient id="frame1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8a7050"/>
      <stop offset="100%" stop-color="#6b5540"/>
    </linearGradient>
    <linearGradient id="frame2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c09060"/>
      <stop offset="100%" stop-color="#a07850"/>
    </linearGradient>
    <linearGradient id="frame3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8c088"/>
      <stop offset="100%" stop-color="#d4a574"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="${size * 0.008}" dy="${size * 0.012}" stdDeviation="${size * 0.02}" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background rounded rectangle -->
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${outerR}" ry="${outerR}" fill="url(#bg)"/>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${outerR}" ry="${outerR}" fill="none" stroke="rgba(212,165,116,0.15)" stroke-width="${size * 0.006}"/>

  <!-- Frame 1 (back, dimmest) -->
  <g filter="url(#shadow)">
    <rect x="${f1x}" y="${f1y}" width="${frameW}" height="${frameW}" rx="${r}" ry="${r}" fill="rgba(20,20,22,0.6)" stroke="url(#frame1)" stroke-width="${stroke}"/>
  </g>

  <!-- Frame 2 (middle) -->
  <g filter="url(#shadow)">
    <rect x="${f2x}" y="${f2y}" width="${frameW}" height="${frameW}" rx="${r}" ry="${r}" fill="rgba(22,22,25,0.7)" stroke="url(#frame2)" stroke-width="${stroke}"/>
  </g>

  <!-- Frame 3 (front, brightest) -->
  <g filter="url(#shadow)">
    <rect x="${f3x}" y="${f3y}" width="${frameW}" height="${frameW}" rx="${r}" ry="${r}" fill="rgba(25,25,28,0.8)" stroke="url(#frame3)" stroke-width="${stroke}"/>
  </g>
</svg>`;
}

// Check for required tools
function checkDependencies() {
  try {
    execSync('which sips', { stdio: 'pipe' });
    execSync('which iconutil', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('Error: sips and iconutil are required (macOS only)');
    return false;
  }
}

function generateIcon() {
  if (!checkDependencies()) {
    process.exit(1);
  }

  // Ensure directories exist
  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });
  if (fs.existsSync(ICONSET_DIR)) fs.rmSync(ICONSET_DIR, { recursive: true });
  fs.mkdirSync(ICONSET_DIR);

  // Required icon sizes for macOS .icns
  const sizes = [16, 32, 64, 128, 256, 512, 1024];

  // Generate SVG at 1024px and save as source
  const svgContent = createSVG(1024);
  const svgPath = path.join(BUILD_DIR, 'icon.svg');
  fs.writeFileSync(svgPath, svgContent);

  // We need to convert SVG to PNG. Use sips via a temporary approach:
  // First create a large PNG using the built-in approach
  // Since Node doesn't have canvas built-in, we'll use a different approach:
  // Write SVGs at each size and convert them

  console.log('Generating icon sizes...');

  // Generate the master 1024px PNG first using a temporary HTML approach
  // Actually, let's use the `qlmanage` trick or `sips` with SVG
  // macOS can convert SVG to PNG via various tools

  // Try using `qlmanage` for SVG to PNG conversion
  const masterSvgPath = path.join(BUILD_DIR, 'icon_master.svg');
  fs.writeFileSync(masterSvgPath, createSVG(1024));

  // Use sips to convert - but sips doesn't handle SVG well
  // Instead, use the `rsvg-convert` if available, or fall back to `qlmanage`
  let conversionMethod = null;

  try {
    execSync('which rsvg-convert', { stdio: 'pipe' });
    conversionMethod = 'rsvg';
  } catch {
    // Try python with cairosvg
    try {
      execSync('python3 -c "import cairosvg"', { stdio: 'pipe' });
      conversionMethod = 'cairosvg';
    } catch {
      // Fall back to qlmanage
      conversionMethod = 'qlmanage';
    }
  }

  const masterPngPath = path.join(BUILD_DIR, 'icon.png');

  if (conversionMethod === 'rsvg') {
    console.log('Using rsvg-convert for SVG to PNG...');
    execSync(`rsvg-convert -w 1024 -h 1024 "${masterSvgPath}" -o "${masterPngPath}"`);
  } else if (conversionMethod === 'cairosvg') {
    console.log('Using cairosvg for SVG to PNG...');
    execSync(`python3 -c "import cairosvg; cairosvg.svg2png(url='${masterSvgPath}', write_to='${masterPngPath}', output_width=1024, output_height=1024)"`);
  } else {
    console.log('Using qlmanage for SVG to PNG...');
    const tmpDir = path.join(BUILD_DIR, '_tmp_ql');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    try {
      execSync(`qlmanage -t -s 1024 -o "${tmpDir}" "${masterSvgPath}" 2>/dev/null`);
      // qlmanage creates file with .svg.png extension
      const qlOutput = path.join(tmpDir, 'icon_master.svg.png');
      if (fs.existsSync(qlOutput)) {
        fs.copyFileSync(qlOutput, masterPngPath);
      }
    } catch (e) {
      console.error('qlmanage failed, trying alternative...');
    }
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  }

  if (!fs.existsSync(masterPngPath)) {
    console.error('Failed to generate master PNG. Please install rsvg-convert:');
    console.error('  brew install librsvg');
    process.exit(1);
  }

  console.log('Generated master icon.png (1024x1024)');

  // Generate all required sizes using sips
  const iconsetSizes = [
    { name: 'icon_16x16.png', size: 16 },
    { name: 'icon_16x16@2x.png', size: 32 },
    { name: 'icon_32x32.png', size: 32 },
    { name: 'icon_32x32@2x.png', size: 64 },
    { name: 'icon_128x128.png', size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png', size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png', size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024 }
  ];

  for (const { name, size } of iconsetSizes) {
    const outPath = path.join(ICONSET_DIR, name);
    fs.copyFileSync(masterPngPath, outPath);
    execSync(`sips -z ${size} ${size} "${outPath}" > /dev/null 2>&1`);
    console.log(`  ${name} (${size}x${size})`);
  }

  // Convert iconset to icns
  const icnsPath = path.join(BUILD_DIR, 'icon.icns');
  execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${icnsPath}"`);
  console.log(`\nGenerated ${icnsPath}`);

  // Cleanup
  fs.rmSync(ICONSET_DIR, { recursive: true });
  fs.unlinkSync(masterSvgPath);

  console.log('Done!');
}

generateIcon();
