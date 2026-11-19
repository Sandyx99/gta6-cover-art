// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, drawn at the window's
// size. Query knobs: layout, grade, size, title, subtitle, photos (a comma
// list of sample names), assign (a comma list of photo indexes, one per
// panel) and zoom (one zoom for every panel). window.__shotReady is set once
// the scene has painted.

import { POST_SIZES, syncPanelStates } from './cover.js';

function readScene(query) {
  return {
    layout: query.get('layout') || 'hero3',
    grade: query.get('grade') || 'vice',
    size: query.get('size') || '1080x1080',
    title: query.get('title') || 'VICE COAST',
    subtitle: query.get('subtitle') || 'the sun never sets',
    photos: (query.get('photos') || 'boulevard,pier').split(',').filter(Boolean),
    assign: (query.get('assign') || '').split(',').filter((v) => v !== '').map(Number),
    zoom: Number(query.get('zoom') || '0'),
    oy: Number(query.get('oy') || '0'),
  };
}

/** Applies a scene to the editor's state and loads its sample photos. */
export async function runShot(shot, query, api) {
  const scene = readScene(query);
  const { state, loadImage, addPhoto, redrawCover, setSelectedPanel } = api;
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.size = scene.size;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  document.getElementById('caption').value = scene.title;
  document.getElementById('subtitle').value = scene.subtitle;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === scene.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === scene.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === scene.size));

  for (const name of scene.photos) {
    try {
      await addPhoto(await loadImage(`samples/${name}.jpg`), name);
    } catch {
      // A missing sample just leaves the tray emptier.
    }
  }
  if (scene.assign.length) {
    syncPanelStates(state, scene.photos.length);
    scene.assign.forEach((photoIndex, panelIndex) => {
      if (state.panels[panelIndex]) state.panels[panelIndex].photo = photoIndex;
    });
  }
  if (scene.zoom > 0) {
    syncPanelStates(state, scene.photos.length);
    state.panels.forEach((panel) => { panel.zoom = scene.zoom; });
  }
  if (scene.oy !== 0) {
    syncPanelStates(state, scene.photos.length);
    state.panels.forEach((panel) => { panel.oy = scene.oy; });
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Draw the cover at the window's own size, so the screenshot is the
    // exported cover at the gate's largest size, drawn by the app itself.
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const { drawCoverArt } = await import('./cover.js');
    drawCoverArt(canvas.getContext('2d'), canvas.width, canvas.height, state, api.photos());
    setSelectedPanel(null);
  } else {
    setSelectedPanel(1);
    redrawCover();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
function apiPhotos(api) {
  return typeof api.photos === 'function' ? api.photos() : [];
}
