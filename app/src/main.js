// Vice Coast Cover Studio — the editor.
//
// Wires the page: photos in (upload or the kit's samples), panels picked by
// clicking the preview and panned with a drag, caption and grade controls,
// and a one-click export of the cover as a PNG. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).

import { drawCoverArt, exportCoverPNG, freshCoverState, layoutPanels, syncPanelStates, GRADES, LAYOUTS, POST_SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const panelInfo = document.getElementById('panelInfo');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');

const state = freshCoverState();
let photos = [];
let selectedPanel = 0;
let fontsReady = false;

/** The export size for the current state. */
export function coverSize() {
  return POST_SIZES[state.size] || POST_SIZES['1080x1080'];
}

/** Redraws the preview canvas at the export size, scaled by CSS. */
export function redrawCover() {
  const size = coverSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  syncPanelStates(state, photos.length);
  drawCoverArt(ctx, size.w, size.h, state, photos);
  drawSelectionOutline();
}

/** Outlines the selected panel on the preview so it can be found. */
export function drawSelectionOutline() {
  if (selectedPanel == null) return;
  const size = coverSize();
  const panels = layoutPanels(state, size.w, size.h);
  const panel = panels[selectedPanel];
  if (!panel) return;
  ctx.save();
  ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
  if (panel.rot) ctx.rotate(panel.rot);
  ctx.translate(-panel.w / 2, -panel.h / 2);
  ctx.lineWidth = Math.max(3, size.w * 0.004);
  ctx.strokeStyle = '#00e5ff';
  ctx.setLineDash([Math.max(8, size.w * 0.012), Math.max(6, size.w * 0.008)]);
  ctx.strokeRect(-4, -4, panel.w + 8, panel.h + 8);
  ctx.restore();
  panelInfo.textContent = `Panel ${selectedPanel + 1} of ${panels.length} — drag to move the photo, scroll to zoom.`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Adds a loaded photo to the tray and gives it a thumbnail button. */
export function addPhoto(img, label) {
  const index = photos.length;
  photos.push(img);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb';
  button.title = `Use ${label} in the selected panel`;
  const thumb = document.createElement('img');
  thumb.alt = label;
  thumb.src = img.src;
  button.appendChild(thumb);
  button.addEventListener('click', () => {
    assignPhotoToPanel(index, selectedPanel);
  });
  tray.appendChild(button);
  syncPanelStates(state, photos.length);
  return index;
}

/** Picks a starting zoom for a photo in a panel: fit mode (zoom under 1, the
 * whole photo shows over a blurred copy of itself) when the photo's shape is
 * far from the panel's, cover mode otherwise. */
export function defaultPanelTransform(panelRect, img) {
  if (!img || !panelRect) return { zoom: 1.15, ox: 0, oy: 0 };
  const panelAspect = panelRect.w / panelRect.h;
  const photoAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
  const ratio = panelAspect / photoAspect;
  if (ratio > 1.45 || ratio < 0.69) return { zoom: 0.85, ox: 0, oy: 0 };
  return { zoom: 1.15, ox: 0, oy: 0 };
}

/** Puts `photoIndex` into panel `panelIndex` and redraws. */
export function assignPhotoToPanel(photoIndex, panelIndex) {
  syncPanelStates(state, photos.length);
  if (!state.panels[panelIndex]) return;
  const size = coverSize();
  const rect = layoutPanels(state, size.w, size.h)[panelIndex];
  const start = defaultPanelTransform(rect, photos[photoIndex]);
  state.panels[panelIndex].photo = photoIndex;
  state.panels[panelIndex].zoom = start.zoom;
  state.panels[panelIndex].ox = start.ox;
  state.panels[panelIndex].oy = start.oy;
  zoomSlider.value = start.zoom;
  zoomValue.textContent = `${start.zoom.toFixed(2)}×`;
  redrawCover();
  status.textContent = `Photo ${photoIndex + 1} is in panel ${panelIndex + 1}.`;
}

/** Fills every panel with the same photo, for a one-photo cover. */
export function fillAllPanelsWithPhoto(photoIndex) {
  syncPanelStates(state, photos.length);
  state.panels.forEach((panel) => {
    panel.photo = photoIndex;
  });
  redrawCover();
  status.textContent = `Every panel now shows photo ${photoIndex + 1}.`;
}

/** Pans the selected panel's photo by fractions of the panel. */
export function panSelectedPanelPhoto(dx, dy) {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.ox = Math.max(-1, Math.min(1, panel.ox + dx));
  panel.oy = Math.max(-1, Math.min(1, panel.oy + dy));
  redrawCover();
}

/** Zooms the selected panel's photo, clamped to a sensible range. */
export function zoomSelectedPanelPhoto(factor) {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.zoom = Math.max(0.5, Math.min(3, panel.zoom * factor));
  zoomSlider.value = panel.zoom;
  zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
  redrawCover();
}

/** Picks a random layout, grade and caption for a fresh idea. */
export function randomizeCover() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  const ideas = [
    ['VICE COAST', 'the sun never sets'],
    ['NEON NIGHTS', 'downtown after dark'],
    ['GOLDEN HOUR', 'pier pressure'],
    ['BOULEVARD QUEEN', 'queen of the coast'],
    ['NIGHT SHIFT', 'vice city never sleeps'],
    ['PALM SHADOWS', 'chasing the sunset'],
  ];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  const idea = ideas[Math.floor(Math.random() * ideas.length)];
  state.title = idea[0];
  state.subtitle = idea[1];
  captionInput.value = idea[0];
  subtitleInput.value = idea[1];
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  redrawCover();
  status.textContent = `Surprise: ${LAYOUTS[state.layout].name} in ${GRADES[state.grade].name}.`;
}

/** Exports the cover at full size as a PNG download. */
export async function exportCover() {
  status.textContent = 'Rendering your cover…';
  const blob = await exportCoverPNG(state, photos);
  if (!blob) {
    status.textContent = 'Export failed — try again.';
    return null;
  }
  const size = coverSize();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60 * 1000);
  status.textContent = `Saved vice-coast-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`;
  window.__lastExport = { width: size.w, height: size.h, bytes: blob.size };
  return blob;
}

// --- Controls -------------------------------------------------------------

document.getElementById('photo').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name);
    } catch {
      status.textContent = `Could not read ${file.name}.`;
    }
  }
  redrawCover();
  e.target.value = '';
});

document.getElementById('fillAll').addEventListener('click', () => {
  if (!photos.length) return;
  const panel = state.panels[selectedPanel];
  fillAllPanelsWithPhoto(panel ? panel.photo : 0);
});

document.getElementById('surprise').addEventListener('click', randomizeCover);
document.getElementById('export').addEventListener('click', exportCover);

captionInput.addEventListener('input', () => {
  state.title = captionInput.value;
  redrawCover();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redrawCover();
});

document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => {
    state.layout = button.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === button));
    redrawCover();
  });
});

document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === button));
    redrawCover();
  });
});

document.querySelectorAll('[data-size]').forEach((button) => {
  button.addEventListener('click', () => {
    state.size = button.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === button));
    redrawCover();
  });
});

document.querySelectorAll('[data-title-style]').forEach((button) => {
  button.addEventListener('click', () => {
    state.titleStyle = button.dataset.titleStyle;
    document.querySelectorAll('[data-title-style]').forEach((b) => b.classList.toggle('active', b === button));
    redrawCover();
  });
});

document.querySelectorAll('[data-effect]').forEach((button) => {
  button.addEventListener('click', () => {
    const effect = button.dataset.effect;
    state.effects[effect] = !state.effects[effect];
    button.classList.toggle('active', state.effects[effect]);
    redrawCover();
  });
});

zoomSlider.addEventListener('input', () => {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  panel.zoom = Number(zoomSlider.value);
  zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
  redrawCover();
});

// --- Picking and panning on the preview -----------------------------------

function panelAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const size = coverSize();
  const px = ((clientX - rect.left) / rect.width) * size.w;
  const py = ((clientY - rect.top) / rect.height) * size.h;
  const panels = layoutPanels(state, size.w, size.h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAtPoint(e.clientX, e.clientY);
  if (hit < 0) return;
  selectedPanel = hit;
  const panel = state.panels[selectedPanel];
  if (panel) {
    zoomSlider.value = panel.zoom;
    zoomValue.textContent = `${panel.zoom.toFixed(2)}×`;
  }
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  redrawCover();
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const size = coverSize();
  const panel = layoutPanels(state, size.w, size.h)[selectedPanel];
  if (!panel) return;
  const dx = ((e.clientX - lastX) / rect.width) * (size.w / panel.w);
  const dy = ((e.clientY - lastY) / rect.height) * (size.h / panel.h);
  lastX = e.clientX;
  lastY = e.clientY;
  panSelectedPanelPhoto(dx, dy);
});

canvas.addEventListener('pointerup', () => {
  dragging = false;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomSelectedPanelPhoto(e.deltaY < 0 ? 1.08 : 1 / 1.08);
}, { passive: false });

// --- Start ------------------------------------------------------------------

/** Loads the display fonts, then the kit's sample photos, then draws. */
export async function startEditor() {
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 100px Pacifico'),
      document.fonts.ready,
    ]);
    fontsReady = true;
  } catch {
    fontsReady = false;
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), {
      state,
      loadImage,
      addPhoto,
      redrawCover,
      photos: () => photos,
      setSelectedPanel: (i) => { selectedPanel = i; },
    });
  } else {
    for (const [name, label] of [['boulevard', 'Boulevard'], ['pier', 'Pier']]) {
      try {
        addPhoto(await loadImage(`samples/${name}.jpg`), label);
      } catch {
        // A missing sample just leaves the tray emptier.
      }
    }
    redrawCover();
  }
  window.__editorReady = true;
}

window.__coverState = state;
window.__coverPhotos = () => photos;
startEditor();
