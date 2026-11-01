# Moonlit terrace

The homepage progressively enhances the existing illustrated hero with a real-time
Three.js scene. `assets/js/terrace.js` builds the architecture, lighting, furniture,
framed memories, and writing table. `assets/css/terrace.css` styles its HTML controls.

Four buttons select camera positions; horizontal dragging adjusts the view.
The writing-table view opens the existing final-letter dialog and uses the same
personal content in `assets/js/config.js`. The gallery currently uses the existing
scenic sample images. The rest of the site's memories, gifts, and letters remain
in HTML below the scene.

Three.js 0.170.0 is served locally from `assets/vendor/three`, with its MIT license.
There is no build step or runtime CDN requirement. Serve the repository with
`python3 -m http.server 8000`; ES modules require HTTP rather than file URLs.

Rendering runs on demand during camera changes and pauses when offscreen or the
document is hidden. Pixel density is capped at 1.6. Reduced-motion preferences
make view changes immediate. Without WebGL, or after context loss, the existing
illustrated hero and all normal website controls remain usable.

The environment is a stylized modeled terrace, not a photogrammetric reconstruction
of the reference villa. It uses geometric objects, procedural material grain,
real-time shadows, and existing site artwork.
