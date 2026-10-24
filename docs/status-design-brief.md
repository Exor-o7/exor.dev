# ChatGPT dashboard design brief

Historical design brief, superseded by the standalone Exorverse dashboard. See [homelab-dashboard.md](homelab-dashboard.md) for the current design and behavior.

Copy the following prompt into ChatGPT and attach a screenshot of the existing website if available.

---

Design a full homelab monitoring dashboard for my existing website, Exor.dev. Apply its established ronin-inspired visual identity throughout the design. Produce polished desktop and mobile visual mockups that can guide implementation.

## Existing website theme

- Deep navy page background: `#030f18` (base `#040e17`).
- Layered navy surfaces: `#081924`, `#0b2230`, and `#061620`.
- Thin blue-gray borders: `#234353` and `#29495c`.
- Electric blue primary accent: `#41b7ff`; lighter highlight: `#8dd7ff`.
- Near-white text: `#f0f5fa`; muted blue-gray supporting text: `#a4b6c5` and `#b8ccd9`.
- Typography: **Inter** for headings/body and **JetBrains Mono** for labels, measurements, statuses and timestamps. Body copy is generally 18px; supporting labels are at least 14px.
- Retain the existing EXOR.dev wordmark and shared Home / Resume / Projects / Homelab / Blog navigation.
- Restrained terminal details: uppercase mono section labels, faint grids, thin dividers, small 4–6px corner radii and generous spacing.
- Subtle Japanese calligraphy accents are part of the identity. Keep them decorative and understated. The existing site also has ronin portrait artwork; do not let artwork compete with operational information.
- Use electric blue for charts and primary interactions. Add muted green, amber and red for health, always with text labels. Additional chart series may use a restrained purple.

## Dashboard content

- Overall health banner, monitoring connection state and last updated time.
- Summary cards for infrastructure availability, services available, response time and backup freshness.
- CPU and RAM history, network received/sent history, and 1h / 24h / 7d time range controls.
- Proxmox compute, TrueNAS storage and UniFi UDM Pro network cards. Allow unavailable metrics to display as unknown.
- Searchable service list with group filters, a needs-attention filter, response times, observed availability percentages and history strips.
- Services: Caddy, Jellyfin, Seerr, jfa-go, Jellystat, Radarr, Sonarr, Bazarr, Prowlarr, FlareSolverr and Notifiarr.
- Filesystem capacity, backup freshness and last successful runs, plus recent status changes and incidents.
- Distinct operational, degraded, outage, maintenance and unknown states. Clearly differentiate live, stale, disconnected and demo data. Never imply example data is real.

## Interaction and layout

This is a read-only monitoring dashboard. Keep the critical operational summary easy to scan, then provide resource charts and detailed service health. Use accessible labels and visible keyboard focus. Make the service table usable on mobile without widening the entire page. Include thoughtful empty/disconnected states, manual refresh, pause updates and a clearly labeled demo mode. Keep internal addresses, tokens and administration controls out of the public design.

The dashboard has its own `status.html` page. The Homelab page has a compact status overview linking to it, and retains the lab documentation. It should feel like a natural extension of Exor.dev. Preserve the website's branding while giving the dashboard enough room for useful data. Also show the mobile arrangement and a disconnected-state example. Explain the palette, type and spacing choices briefly.
