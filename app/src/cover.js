// Vice Coast Cover Studio — the cover renderer.
//
// Draws a GTA-style multi-panel poster cover onto any 2D canvas: photos are
// placed into a layout of panels, a sunset / neon colour grade is washed over
// them, and the caption is lettered in Anton with a Pacifico script subtitle.
// Every measurement is a fraction of the canvas, so the same drawing renders
// the live preview and the full-size exported PNG.

/** The three post sizes the app exports, in pixels. */
export const POST_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** The colour grades: a wash gradient, a multiply tint and a glow colour. */
export const GRADES = {
  vice: {
    name: 'Vice Sunset',
    wash: ['#ff9a3c', '#ff4e7e', '#7b2ff7'],
    tint: 'rgba(255, 90, 60, 0.14)',
    glow: '#ffd166',
    band: ['#2a0a3d', '#12041f'],
  },
  neon: {
    name: 'Neon Nights',
    wash: ['#ff2e88', '#7b2ff7', '#00e5ff'],
    tint: 'rgba(20, 20, 90, 0.22)',
    glow: '#00e5ff',
    band: ['#0d0221', '#05010d'],
  },
  hotpink: {
    name: 'Hot Pink',
    wash: ['#ff5e8a', '#ff2e63', '#c9184a'],
    tint: 'rgba(255, 30, 90, 0.16)',
    glow: '#ffb3c6',
    band: ['#3d0218', '#1c000c'],
  },
  teal: {
    name: 'Teal Noir',
    wash: ['#2ec4b6', '#118ab2', '#073b4c'],
    tint: 'rgba(0, 60, 70, 0.20)',
    glow: '#80ed99',
    band: ['#02222b', '#010d12'],
  },
  golden: {
    name: 'Golden Hour',
    wash: ['#ffd166', '#ff8c42', '#ef476f'],
    tint: 'rgba(255, 170, 40, 0.14)',
    glow: '#fff3b0',
    band: ['#3d1c02', '#170a00'],
  },
};

/**
 * The six panel layouts. Each returns the panels (fractions of the cover) and
 * the title zone for a cover of width W and height H. `g` is the gutter.
 */
export const LAYOUTS = {
  hero3: {
    name: 'Hero + Three',
    panels(w, h) {
      const g = Math.min(w, h) * 0.018;
      const top = g, bottom = h * 0.755;
      return [
        { x: g, y: top, w: w * 0.585 - g * 1.5, h: bottom - top, rot: 0 },
        { x: w * 0.615, y: top, w: w - w * 0.615 - g, h: (bottom - top - g * 2) / 3, rot: 0 },
        { x: w * 0.615, y: top + (bottom - top - g * 2) / 3 + g, w: w - w * 0.615 - g, h: (bottom - top - g * 2) / 3, rot: 0 },
        { x: w * 0.615, y: top + 2 * ((bottom - top - g * 2) / 3 + g), w: w - w * 0.615 - g, h: (bottom - top - g * 2) / 3, rot: 0 },
      ];
    },
    title(w, h) {
      const g = Math.min(w, h) * 0.018;
      return { x: g, y: h * 0.775, w: w - g * 2, h: h * 0.20, align: 'center', kind: 'band' };
    },
  },
  nine: {
    name: 'Nine Panel',
    panels(w, h) {
      const g = Math.min(w, h) * 0.016;
      const top = g, bottom = h * 0.755;
      const cw = (w - g * 4) / 3, ch = (bottom - top - g * 2) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: g + c * (cw + g), y: top + r * (ch + g), w: cw, h: ch, rot: 0 });
        }
      }
      return out;
    },
    title(w, h) {
      const g = Math.min(w, h) * 0.016;
      return { x: g, y: h * 0.775, w: w - g * 2, h: h * 0.20, align: 'center', kind: 'band' };
    },
  },
  duo: {
    name: 'Split Duo',
    panels(w, h) {
      const g = Math.min(w, h) * 0.018;
      const top = g, bottom = h * 0.755;
      return [
        { x: g, y: top, w: (w - g * 3) / 2, h: bottom - top, rot: 0 },
        { x: g * 2 + (w - g * 3) / 2, y: top, w: (w - g * 3) / 2, h: bottom - top, rot: 0 },
      ];
    },
    title(w, h) {
      const g = Math.min(w, h) * 0.018;
      return { x: g, y: h * 0.775, w: w - g * 2, h: h * 0.20, align: 'center', kind: 'band' };
    },
  },
  fullbleed: {
    name: 'Full Bleed',
    panels(w, h) {
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    },
    title(w, h) {
      return { x: w * 0.06, y: h * 0.70, w: w * 0.88, h: h * 0.26, align: 'left', kind: 'scrim' };
    },
  },
  tilted: {
    name: 'Tilted Snapshots',
    panels(w, h) {
      const g = Math.min(w, h) * 0.02;
      return [
        { x: w * 0.06, y: h * 0.10, w: w * 0.42, h: h * 0.52, rot: -0.07 },
        { x: w * 0.50, y: h * 0.07, w: w * 0.42, h: h * 0.52, rot: 0.06 },
        { x: w * 0.28, y: h * 0.52, w: w * 0.44, h: h * 0.34, rot: -0.02 },
      ];
    },
    title(w, h) {
      return { x: w * 0.05, y: h * 0.865, w: w * 0.90, h: h * 0.12, align: 'center', kind: 'plain' };
    },
  },
  fourgrid: {
    name: 'Four Grid',
    panels(w, h) {
      const g = Math.min(w, h) * 0.018;
      const top = g, bottom = h * 0.755;
      const cw = (w - g * 3) / 2, ch = (bottom - top - g) / 2;
      return [
        { x: g, y: top, w: cw, h: ch, rot: 0 },
        { x: g * 2 + cw, y: top, w: cw, h: ch, rot: 0 },
        { x: g, y: top + ch + g, w: cw, h: ch, rot: 0 },
        { x: g * 2 + cw, y: top + ch + g, w: cw, h: ch, rot: 0 },
      ];
    },
    title(w, h) {
      const g = Math.min(w, h) * 0.018;
      return { x: g, y: h * 0.775, w: w - g * 2, h: h * 0.20, align: 'center', kind: 'band' };
    },
  },
};

/** A fresh cover state: the defaults the editor opens with. */
export function freshCoverState() {
  return {
    size: '1080x1080',
    layout: 'hero3',
    grade: 'vice',
    title: 'VICE COAST',
    subtitle: 'the sun never sets',
    titleStyle: 'sunset',
    effects: { grain: true, vignette: true, halftone: true },
    panels: [],
  };
}

/** Panels for the state's layout, sized to a cover of W by H. */
export function layoutPanels(state, w, h) {
  return LAYOUTS[state.layout].panels(w, h);
}

/** Title zone for the state's layout, sized to a cover of W by H. */
export function layoutTitleZone(state, w, h) {
  return LAYOUTS[state.layout].title(w, h);
}

/**
 * Keeps one panel state per panel of the current layout, carrying the photo
 * over from the same index when the layout changes.
 */
export function syncPanelStates(state, photoCount) {
  const count = layoutPanels(state, 100, 100).length;
  const next = [];
  for (let i = 0; i < count; i++) {
    const old = state.panels[i];
    next.push({
      photo: old ? old.photo % Math.max(1, photoCount) : i % Math.max(1, photoCount),
      zoom: old ? old.zoom : 1.15,
      ox: old ? old.ox : 0,
      oy: old ? old.oy : 0,
    });
  }
  state.panels = next;
  return state;
}

let grainTile = null;
/** A small tile of random grey noise, made once and stamped over the cover. */
export function grainPatternTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 110);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

/**
 * Draws one photo into a panel rect, cover-fitting it, then applying the
 * panel's zoom and pan offsets. `rot` tilts the panel like a snapshot.
 */
export function drawPhotoInPanel(ctx, panel, img, transform) {
  const { x, y, w, h, rot } = panel;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = transform.zoom || 1;
    if (zoom < 1) {
      // Fit mode: the photo is smaller than the panel, so a blurred,
      // darkened copy of it fills the panel behind the sharp original.
      const coverScale = Math.max(w / iw, h / ih);
      const bw = iw * coverScale;
      const bh = ih * coverScale;
      ctx.save();
      ctx.filter = `blur(${Math.max(6, w * 0.04)}px) saturate(1.25) brightness(0.7)`;
      ctx.drawImage(img, (w - bw) / 2, (h - bh) / 2, bw, bh);
      ctx.restore();
      const fitScale = Math.min(w / iw, h / ih) * (0.55 + 0.45 * zoom);
      const dw = iw * fitScale;
      const dh = ih * fitScale;
      const dx = (w - dw) / 2 + (transform.ox || 0) * w * 0.45;
      const dy = (h - dh) / 2 + (transform.oy || 0) * h * 0.45;
      ctx.filter = 'saturate(1.14) contrast(1.06)';
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    } else {
      const scale = Math.max(w / iw, h / ih) * zoom;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (w - dw) / 2 + (transform.ox || 0) * w * 0.45;
      const dy = (h - dh) / 2 + (transform.oy || 0) * h * 0.45;
      ctx.filter = 'saturate(1.14) contrast(1.06)';
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#3a2350');
    grad.addColorStop(1, '#12041f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  // A white snapshot border around tilted panels, a hairline elsewhere.
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  ctx.lineWidth = rot ? Math.max(3, w * 0.012) : Math.max(1, w * 0.0015);
  ctx.strokeStyle = rot ? '#f8f4ec' : 'rgba(255, 255, 255, 0.85)';
  ctx.strokeRect(0, 0, w, h);
  ctx.restore();
}

/** Washes the sunset / neon grade over the whole cover. */
export function applySunsetGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(0.55, grade.wash[1]);
  wash.addColorStop(1, grade.wash[2]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Warm light pooling in from the top corner, like a low sun.
  const sun = ctx.createRadialGradient(w * 0.82, -h * 0.08, 0, w * 0.82, -h * 0.08, w * 0.75);
  sun.addColorStop(0, 'rgba(255, 220, 140, 0.30)');
  sun.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

/** Darkens the cover's edges so the middle pops. */
export function drawVignette(ctx, w, h) {
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(10, 2, 20, 0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Stamps film grain over the cover at a low alpha. */
export function drawFilmGrain(ctx, w, h) {
  const tile = grainPatternTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A row of halftone dots along the top edge of the title band. */
export function drawHalftoneDots(ctx, zone, w) {
  const rows = 3;
  const gap = Math.max(10, w * 0.014);
  ctx.save();
  for (let r = 0; r < rows; r++) {
    for (let x = zone.x + gap / 2; x < zone.x + zone.w; x += gap) {
      const radius = (gap * 0.32 * (rows - r)) / rows;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.10 + 0.10 * (rows - r)})`;
      ctx.arc(x, zone.y + 6 + r * gap * 0.8, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A synthwave sun: a striped disc, drawn inside the title band. */
export function drawSynthwaveSun(ctx, cx, cy, radius, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const sun = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(0.55, '#ff7e5f');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = grade.band[1];
  let gap = radius * 0.08;
  for (let y = cy + radius * 0.05; y < cy + radius; y += gap) {
    ctx.fillRect(cx - radius, y, radius * 2, gap * 0.45);
    gap *= 1.35;
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(2, radius * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Shrinks the font until `text` fits `maxWidth`, then returns the size. */
export function fitTitleSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `400 ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(1, Math.floor(size * 0.04));
    ctx.font = `400 ${size}px ${family}`;
  }
  return size;
}

/** Letters the title and subtitle into the title zone. */
export function drawTitleLettering(ctx, zone, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const pad = zone.h * 0.10;
  if (zone.kind === 'band') {
    const band = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
    band.addColorStop(0, grade.band[0]);
    band.addColorStop(1, grade.band[1]);
    ctx.fillStyle = band;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.fillStyle = grade.wash[1];
    ctx.fillRect(zone.x, zone.y, zone.w, Math.max(3, zone.h * 0.03));
    if (state.effects.halftone) drawHalftoneDots(ctx, zone, zone.w);
  } else if (zone.kind === 'scrim') {
    const scrim = ctx.createLinearGradient(0, zone.y - zone.h * 0.3, 0, zone.y + zone.h);
    scrim.addColorStop(0, 'rgba(8, 2, 18, 0)');
    scrim.addColorStop(0.45, 'rgba(8, 2, 18, 0.62)');
    scrim.addColorStop(1, 'rgba(8, 2, 18, 0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, zone.y - zone.h * 0.3, zone.w + zone.x * 2, zone.h * 1.3);
  }

  const sunR = zone.h * 0.30;
  const hasSun = zone.kind === 'band' && zone.w > zone.h * 3.2;
  const textW = hasSun ? zone.w - sunR * 2.6 : zone.w;
  const textX = zone.align === 'left' ? zone.x + pad : zone.x + (zone.w - textW) / 2 + (hasSun ? -sunR : 0);

  if (title) {
    const maxSize = zone.h * (subtitle ? 0.52 : 0.68);
    const size = fitTitleSize(ctx, title, textW - pad * 2, maxSize, 'Anton, sans-serif');
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = zone.align === 'left' ? 'left' : 'center';
    const cy = zone.y + zone.h * (subtitle ? 0.38 : 0.52);
    const cx = zone.align === 'left' ? textX : zone.x + zone.w / 2 + (hasSun ? -sunR * 0.9 : 0);
    ctx.translate(cx, cy);
    ctx.rotate(-0.015);
    ctx.font = `400 ${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = 'rgba(12, 2, 24, 0.9)';
    if (state.titleStyle === 'sunset') {
      const fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      fill.addColorStop(0, '#fff7d6');
      fill.addColorStop(0.45, '#ffd166');
      fill.addColorStop(0.75, '#ff5e7a');
      fill.addColorStop(1, '#c44dff');
      ctx.fillStyle = fill;
    } else if (state.titleStyle === 'neon') {
      ctx.fillStyle = '#ff2e88';
      ctx.shadowColor = '#ff2e88';
      ctx.shadowBlur = size * 0.28;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.strokeText(title, 0, 0);
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  if (subtitle) {
    const size = Math.min(zone.h * 0.20, zone.w * 0.045);
    ctx.save();
    ctx.font = `400 ${size}px Pacifico, cursive`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = zone.align === 'left' ? 'left' : 'center';
    const cx = zone.align === 'left' ? textX : zone.x + zone.w / 2 + (hasSun ? -sunR * 0.9 : 0);
    ctx.fillStyle = grade.glow;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.5;
    ctx.fillText(subtitle, cx, zone.y + zone.h * 0.82);
    ctx.restore();
  }

  if (hasSun) {
    drawSynthwaveSun(ctx, zone.x + zone.w - sunR * 1.15, zone.y + zone.h * 0.5, sunR, grade);
  }
}

/**
 * Draws the whole cover onto `ctx` at the canvas's own size: the paper
 * frame, the panels with their photos, the grade, the title lettering and
 * the finish effects. `photos` is the array of loaded images.
 */
export function drawCoverArt(ctx, w, h, state, photos) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  // The paper frame the panels sit on.
  ctx.fillStyle = state.layout === 'tilted' ? '#1c0f2e' : '#f6f1e7';
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'tilted') {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2a0a3d');
    bg.addColorStop(1, '#12041f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  const panels = layout.panels(w, h);
  panels.forEach((panel, i) => {
    const transform = state.panels[i] || { photo: 0, zoom: 1.15, ox: 0, oy: 0 };
    const img = photos && photos.length ? photos[transform.photo % photos.length] : null;
    drawPhotoInPanel(ctx, panel, img, transform);
  });
  applySunsetGrade(ctx, w, h, grade);
  drawTitleLettering(ctx, layout.title(w, h), state, grade);
  if (state.effects.vignette) drawVignette(ctx, w, h);
  if (state.effects.grain) drawFilmGrain(ctx, w, h);
}

/** Renders the cover at full export size and hands back a PNG blob. */
export function exportCoverPNG(state, photos) {
  const size = POST_SIZES[state.size] || POST_SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCoverArt(canvas.getContext('2d'), size.w, size.h, state, photos);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
