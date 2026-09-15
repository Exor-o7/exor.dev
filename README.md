# exor.dev

Personal website and portfolio for Conley Dannels (`Exor`).

Live site: https://exor.dev

## Overview

This repository contains the source for a static personal site focused on:

- systems and infrastructure
- automation and scripting
- homelab documentation
- projects and technical growth

## Pages

- `index.html` — homepage / overview
- `projects.html` — selected projects and active work
- `homelab.html` — homelab overview and infrastructure notes
- `blog/index.html` — writeups and technical posts
- `resume.html` — resume and experience overview
- `404.html` — custom not-found page
- `robots.txt` / `sitemap.xml` — crawler and discovery metadata

## Stack

- HTML
- CSS
- JavaScript
- Inter for body text; JetBrains Mono for terminal details
- GitHub Pages / custom domain

## Notes

This site is intentionally simple and static. The goal is to keep it fast, readable, and easy to update while documenting real work over time.


## Local preview

From the repository folder, run:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 in your browser. No install or build step is required.
Stop the server with Ctrl+C when finished.

## Layout and maintenance

- `index.html` contains the homepage: hero, core skills, one searchable project directory, current focus, experience, and writing.
- `css/style.css` contains the shared visual system and responsive layouts.
- `js/index.js` handles the mobile menu and project search/category filters. All content and navigation remain available without JavaScript.
- Project cards use `data-categories` for filter membership; visible card text and categories are included in search. Set `data-status` to `active`, `wip`, or `released`; cards are ordered Active → WIP → Released. Keep the static HTML in the same order for the no-JavaScript view. Update the initial project count when adding cards.
- Homepage detail links use stable IDs in `projects.html`. Skills and experience links target IDs in `resume.html`.
- The shared header is static HTML. Keep its navigation consistent when editing pages in the root and `blog/` directories.
- The decorative server-room background is an AI-generated WebP asset at `assets/server-room.webp`. Project artwork consists of inline SVG icons and CSS, not product screenshots.
- Existing analytics and external fonts remain in place; fonts have system fallbacks. Local verification excludes production analytics.

### Generated background

Generated with the built-in imagegen tool for this layout. Prompt:

> Use case: photorealistic-natural. Asset type: decorative background for a personal IT portfolio website hero. A realistic premium editorial photograph of a dark modern server room, black server racks with tiny electric blue status LEDs, aisle vanishing into distance, restrained cool blue ceiling lights. Wide landscape 3:2 composition; server equipment details concentrated on right half, left half very dark with subtle silhouettes to allow white website text overlay. Deep midnight navy and black palette, realistic metal and glass texture, atmospheric understated blue light, crisp professional photography. No text, logos, people, watermark or user interface. Output only the background photograph.


## Original theme

The previous terminal design is preserved unchanged in [`themes/original-terminal/`](themes/original-terminal/). See [`themes/README.md`](themes/README.md) for its source commit, preview instructions, and restoration notes.
