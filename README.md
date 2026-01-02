# picport — marco's gallery

personal photography portfolio. custom-built for visual focus.

**live:** [pics.pernazza.com](https://pics.pernazza.com)

## about the author
marco pernazza. phd student in catalysis at itq, valencia. exploring visual fleetingness through light, deep shadows, and minimalist geometry.

## features
* **minimalist ui:** customizable dark/light theme, typography-led design with enforced lowercase aesthetics.
* **tech specs display:** automatic parsing of filenames to display camera, iso, aperture, and shutter speed on the grid and lightbox.
* **keyboard navigation:** browse the carousel and lightbox using left/right arrow keys.
* **responsive:** custom hamburger menu, swipe carousel, and centered flex grid.
* **interactive:** spinning logo, smooth scrolling, and lightbox functionality.
* **dynamic palette:** automatic extraction of dominant colors for each image in the lightbox using ColorThief.
* **geographic mapping:** interactive map view showing photo locations based on filename coordinates.
* **automated:** github actions auto-update the gallery from image folders.

## tech stack
* **engine:** [hugo](https://gohugo.io/) (extended version).
* **frontend:** html5, css3 (inter font), and vanilla javascript.
* **libraries:** [colorthief](https://lokeshdhakar.com/projects/color-thief/) for palette extraction and [leaflet.js](https://leafletjs.com/) for mapping.
* **hosting/automation:** github pages and github actions.

## workflow
1. upload photos to `images/MASTER`.
2. push to github.
3. github action builds `gallery.json` and deploys the site automatically.

## contact
* instagram: [@isoperny](https://instagram.com/isoperny)
* email: marco@pernazza.com

copyright 2025 marco pernazza
