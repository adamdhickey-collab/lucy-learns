// The review sheet: one page that shows what was asked for beside what came
// back, at the sizes it will actually be seen at.
//
// The point is not to display the picture — the file is right there. It is to
// put the master, the crops and the 84/56 thumbnails on one screen next to the
// scene's own must-be-true line, so a review is answering a written question
// instead of "does this look nice". Rounds 1-19 were reviewed by eye at full
// size, and the failures that got through were all failures at some other size:
// action drifting out of the 21:9 band, a composition that turned to mush at
// 56px.
//
// A pure function returning a string, so it is testable without a browser.

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function reviewSheet(scene, out, renditions, { generatedAt = '' } = {}) {
  const rel = (p) => esc(p.split('/').pop());
  const crops = renditions.filter((r) => r.kind === 'crop');
  const thumbs = renditions.filter((r) => r.kind === 'thumb');

  const cropCards = crops
    .map(
      (r) => `<figure class="crop">
  <img src="crops/${rel(r.path)}" alt="">
  <figcaption><b>${esc(r.name)}</b><span>${esc(r.note)} · ${r.box.w}×${r.box.h}</span></figcaption>
</figure>`
    )
    .join('\n');

  // Rendered at their true pixel size, unscaled. A thumbnail shown large tells
  // you nothing about whether the thumbnail works.
  const thumbCards = thumbs
    .map((r) => {
      // Square unless the rendition says otherwise. The scene and icon profiles
      // shrink a square, so the name carries the one number; the splash is
      // portrait, and forcing it square here would review a distorted picture.
      const px = Number(r.name.split('-').pop());
      const w = r.size ? r.size.w : px;
      const h = r.size ? r.size.h : px;
      return `<figure class="thumb">
  <img src="crops/${rel(r.path)}" alt="" width="${w}" height="${h}">
  <figcaption><b>${w}${r.size ? `\u00d7${h}` : 'px'}</b><span>${esc(r.note)}</span></figcaption>
</figure>`;
    })
    .join('\n');

  return `<!doctype html><meta charset="utf-8">
<title>${esc(scene.id)} — round ${out.round}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 32px; font: 15px/1.5 ui-sans-serif, system-ui, sans-serif;
         background: #24223a; color: #f5f4f9; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #b6b4c0; font-size: 13px; margin: 0 0 24px; }
  .must { background: #452368; border-left: 3px solid #6a3d94; padding: 12px 16px;
          border-radius: 6px; margin: 0 0 28px; max-width: 70ch; }
  .must b { display: block; font-size: 12px; letter-spacing: .06em; text-transform: uppercase;
            color: #cbb8e4; margin-bottom: 4px; }
  h2 { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #b6b4c0;
       margin: 32px 0 12px; font-weight: 600; }
  img { display: block; max-width: 100%; height: auto; border-radius: 4px; background: #eae7f0; }
  figure { margin: 0; }
  figcaption { font-size: 12px; color: #b6b4c0; margin-top: 6px; }
  figcaption b { color: #f5f4f9; display: block; }
  .master img { max-width: 724px; }
  /* Grid, not flex-wrap: the crops have four different aspect ratios, and a
     wrapping flex row leaves a hole wherever the tallest card lands. */
  .row { display: grid; gap: 24px; align-items: start;
         grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  /* Capped height, contained: the four crops keep their true shapes — that is
     what is being reviewed — but a 5:4 no longer makes its row three times the
     height of the 21:9 beside it. */
  .crop img { width: 100%; max-height: 240px; object-fit: contain; object-position: left top;
              background: transparent; }
  .thumbs { display: flex; gap: 32px; align-items: flex-end; }
  .thumb { text-align: center; }
  .thumb img { border-radius: 6px; margin: 0 auto 6px; }
  .thumb figcaption { margin-top: 0; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #45435c;
           color: #b6b4c0; font-size: 13px; max-width: 70ch; }
</style>
<h1>${esc(scene.title || scene.id)}</h1>
<p class="meta">${esc(scene.id)} · round ${out.round} · brief ${esc(scene.briefId)}${
    generatedAt ? ` · ${esc(generatedAt)}` : ''
  }</p>

<div class="must"><b>Must be true</b>${esc(scene.mustBeTrue)}</div>

<h2>Master</h2>
<figure class="master">
  <img src="${rel(out.master)}" alt="">
  <figcaption><b>${rel(out.master)}</b><span>the shipped size</span></figcaption>
</figure>

<h2>Crops the app takes</h2>
<div class="row">
${cropCards}
</div>

<h2>At the sizes the app renders</h2>
<div class="thumbs">
${thumbCards}
</div>

<footer>
  Drafts. Nothing here is installed, promoted or committed. If this round is
  good, copy the master to <code>art/pilot/approved/</code> yourself and install
  it deliberately — approval is a human step and this pipeline does not take it.
</footer>
`;
}
