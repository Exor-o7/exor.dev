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
- `projects/janitorfin.html` — Janitorfin case study, with an actual interface capture, workflow, decisions, and source references
- `homelab.html` — lab overview and documentation
- `blog/index.html` — writeups and technical posts
- `resume.html` — resume and experience overview
- `output/pdf/conley-dannels-resume.pdf` — downloadable two-page resume with selectable text
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

- `index.html` contains the final split homepage: supplied portrait artwork, introduction, experience highlights, featured text-only projects, and writing. The experience timeline and technology icons share a two-column section, with roles on the left and the tech stack on the right; they stack vertically on mobile. The full searchable directory lives on `projects.html`.
- `css/style.css` retains the base visual system. `css/ronin.css` implements the final supplied homepage design and shared branding, including responsive layouts and reduced-motion support. `css/inner.css` decorates the nine interior pages and is loaded only by those pages.
- `js/index.js` handles the mobile menu, project search/category filters, directory result counts, and search shortcut. Content and navigation remain available without JavaScript.
- Project cards use `data-categories` for filter membership; visible card text and categories are included in search. Set `data-status` to `active`, `wip`, or `released`; cards are ordered Active → WIP → Released. Keep the static HTML in the same order for the no-JavaScript view. Update the initial Projects page count and homepage project highlight when adding cards; `scripts/check_site.py` checks they agree.
- Homepage detail links use stable IDs in `projects.html`. Skills and experience links target IDs in `resume.html`.
- The shared header is static HTML. Keep its navigation consistent when editing pages in the root and `blog/` directories.
- The supplied ronin portrait, wordmark, and calligraphy are optimized WebP assets. Project cards have no thumbnails; their content remains selectable HTML.
- Existing analytics and external fonts remain in place; fonts have system fallbacks. Local verification excludes production analytics.

### Previous background

Generated with the built-in imagegen tool for this layout. Prompt:

> Use case: photorealistic-natural. Asset type: decorative background for a personal IT portfolio website hero. A realistic premium editorial photograph of a dark modern server room, black server racks with tiny electric blue status LEDs, aisle vanishing into distance, restrained cool blue ceiling lights. Wide landscape 3:2 composition; server equipment details concentrated on right half, left half very dark with subtle silhouettes to allow white website text overlay. Deep midnight navy and black palette, realistic metal and glass texture, atmospheric understated blue light, crisp professional photography. No text, logos, people, watermark or user interface. Output only the background photograph.

### Final supplied design

The completed reference uses a large portrait illustration on the left and an HTML portfolio on the right. On desktop the art stays in view while content scrolls. Below 1100px it becomes a shorter artwork banner above the content. The navigation includes Resume as a primary destination on all screen sizes.

The supplied artwork and branding are used directly, with WebP encoding and a display-size calligraphy variant. No replacement artwork or product screenshots were generated for this implementation.

- `assets/ronin-portrait.webp`: latest supplied illustration with corrected banner lettering, 1122 × 1402, approximately 305 KiB.
- `assets/exor-wordmark.webp`: supplied EXOR.dev wordmark, 2172 × 724, approximately 139 KiB. Its genuine transparency is retained, and CSS frames the original image without changing its lettering.
- `assets/ronin-calligraphy.webp`: supplied 浪人 calligraphy, optimized to 512 × 768, approximately 266 KiB, with transparency retained.
- `assets/server-room.webp`: original background retained for reference.

Featured projects load from the Projects directory and select three cards in this order: work in progress, active, released. Existing featured order breaks ties within a status. The static fallback currently shows Internal Support Workspace, Bluetooth Videophone Remote, and Janitorfin for direct-file, offline, and no-JavaScript previews. Featured cards have no `data-project` attribute, so filters apply only to the full directory. The homepage highlight also refreshes from the directory and stays stable while filtering. The 15+ years highlight is supported by the resume's work history beginning in 2010. Concept-only project names, technologies, and audience metrics are not included.

The earlier content edits remain intact: Bluetooth Videophone Remote and its Kotlin/Android/Bluetooth HID tags, project-specific lifecycle labels, the generic `work in progress` legend, and the Tier 3 resume title and Internal Support Workspace bullet. Existing IDs, project URLs, article and resume content, SEO metadata, and production analytics remain available.

Header branding is shared across all root and blog pages. Keep the static headers and relative asset paths consistent. Shared body text is 18px, homepage copy is at least 16px, and small labels are at least 14px; the homepage hero title keeps its established size. Interior pages share calligraphy, a faint grid, breadcrumbs, numbered headers, and section shortcuts. Projects use a responsive two-column directory with lifecycle accents; the homelab uses subsystem cards and a stack overview with an expandable directory tree; the resume pairs skills with an experience timeline; the blog uses categorized entry cards and articles with a section guide. These layouts collapse for smaller screens, and the resume retains a plain print layout. Footer contact/profile icons and the source repository link remain shared. The homepage introduces featured work, skills, experience, and writing; the full directory and filters are on the Projects page.

For a local preview that omits production analytics, run `python scripts/preview.py` and open http://127.0.0.1:8765/. Append `?nojs=1` to verify navigation and content without JavaScript. Stop the server with Ctrl+C.

Run `python scripts/check_site.py`, `node --check js/index.js`, and `git diff --check` for local structural checks. Also check desktop/mobile appearance, filtering, search, the search shortcut, and mobile keyboard navigation in a browser after changes. No build step or framework dependency is required.

### Case study, writing, and resume

The Janitorfin case study links to the exact public source revision used for its implementation details. Update the cited revision when changing technical claims. Its image shows the installed plugin's Jellyfin interface with the server name removed; connection settings and individual media rows are outside the capture. Project directory cards remain text-only, with a link to the case study.

The automation, homelab, and site-build articles include practical examples, section navigation, related reading, and explicit update dates. Their reading times are editorial estimates at roughly 220 words per minute; refresh them when changing the content. Recovery exercises and proposed testing work are described as recommendations, without claiming measured results.

The downloadable resume is a static PDF, so visitors need no JavaScript or PDF-generation service. Rebuild it with `python scripts/build_resume.py` in an environment with ReportLab installed. Keep the concise content in that script aligned with `resume.html` and the linked project source. Verify that the PDF still has two pages, inspect both rendered pages, and check extracted text before replacing the published copy. The PDF uses one column, standard section names, visible contact links, and selectable text.

## Original theme

The previous terminal design is preserved unchanged in [`themes/original-terminal/`](themes/original-terminal/). See [`themes/README.md`](themes/README.md) for its source commit, preview instructions, and restoration notes.
