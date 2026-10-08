# aqua dream poster

A cute Y2K / frutiger aero poster template for a K-pop idol ad, built with plain HTML, CSS and JavaScript (no build step, no libraries).

The poster is designed at 1080 × 1440 and scales to fit any screen. The photo frame is styled as a glossy media-player window and starts empty, ready for an idol photo.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
```

## What you can do

- **Add a photo:** use *Add photo*, click the empty frame, drop an image on the poster, or paste one. Drag to reposition, scroll to zoom, double-click to replace.
- **Edit the text:** tap the idol name, the title, the Korean tagline, the album type or the date. The name updates everywhere it appears (status tag, userbox, ticker, messenger toasts) and the D-day badge counts down to the date you type.
- **Rearrange stickers:** drag any sticker. Positions and text edits are remembered in this browser; *Reset* (tap twice) restores the original layout.
- **Play with it:** the media player and CD widget work (play/pause, seek, skip through a five-track list), the pill buttons pop messenger toasts, the tiles burst sparkles, hearts and bubbles, and the bubbles pop when tapped.

## Files

- `index.html` – poster structure and the control panel.
- `style.css` – gel buttons, the player frame, bubble lettering and layout.
- `poster.js` – generates the glossy SVG stickers (buddies, hearts, clovers, jelly mascots, fish, globes), runs the glitter and bubble canvas, tilt and parallax, swimming fish, the player, photo handling and text editing.

Motion pauses automatically for visitors who prefer reduced motion, and can be toggled with *Pause motion*.
