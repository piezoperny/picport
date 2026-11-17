# picport — marco's gallery (v2.5)

personal photography portfolio. custom-built with hugo for visual focus, zero-database metadata parsing, and tactile darkroom aesthetics.

**live:** [pics.pernazza.com](https://pics.pernazza.com)

## about the author
marco pernazza. phd student in catalysis at itq, valencia. exploring visuals through light, deep shadows, and minimalist geometry.

## v2.5 architecture & gui
* **floating pill dock:** desktop-first glassmorphic navigation bar (`archive`, `map`, `about`, `collections ▾` popover, and theme toggle) with an animated hamburger menu (`×` on open), backdrop/escape dismissal, and flicker-free dark/light mode persistence.
* **cinema hud carousel & collection cards:** full-bleed home showcase with blurred ambient backdrops, keyboard/swipe controls, and curated collection entry cards.
* **interactive archive & exposure sliders:** live filtering across collections alongside dual-range exposure sliders for **iso**, **diaphragm (f-stop)**, and **shutter speed**, plus asymmetric list and masonry grid layouts.
* **darkroom lightbox:** immersive viewer featuring ambient color glow, exif tech specs, gps map links, keyboard navigation, and a **click-to-copy hex palette** extracted via colorthief.
* **interactive travelogue map:** leaflet-powered world map with clustered photo markers, region fly-to pills, heatmap layer toggle, and a responsive webp image pipeline.

## filename-as-database convention
every photo's metadata—timestamp, camera body, exposure triangle, and gps coordinates—lives directly in its filename. no external database or sidecar json is required:

```text
YYYYMMDD_HHMMSS-camera_iso_aperture_shutter--lat_lon.jpg
```

| segment | example | parsed into |
| :--- | :--- | :--- |
| `YYYYMMDD_HHMMSS` | `20260622_104342` | capture date & time |
| `camera` | `canon eos rp` | camera body (`📷 canon eos rp`) |
| `iso` | `100` | sensor sensitivity (`iso 100`) |
| `aperture` | `7.1` | diaphragm (`f/7.1`) |
| `shutter` | `1-320` | shutter speed (`1/320 s`) |
| `lat_lon` | `46.195_11.942` | gps coordinates for lightbox & `/map/` |

## tech stack
* **engine:** [hugo](https://gohugo.io/) (extended version) with page bundles & webp processing.
* **frontend:** html5, css3 (`cormorant garamond` + `inter`), and vanilla javascript.
* **libraries:** [colorthief](https://lokeshdhakar.com/projects/color-thief/) for palette extraction and [leaflet.js](https://leafletjs.com/) (+ `leaflet.heat`) for mapping.
* **hosting/automation:** github pages & github actions.

## workflow
1. drop encoded photos into a hugo page bundle under `content/gallery/<collection>/` (e.g. `content/gallery/human element/`).
2. commit and push to `main`.
3. github actions runs `hugo --minify`, generates `/index.json` for the archive and map, and deploys to github pages automatically.

## contact
* instagram: [@isoperny](https://instagram.com/isoperny)
* email: marco@pernazza.com

copyright 2026 marco pernazza
