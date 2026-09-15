# Preserved themes

## Original terminal theme

`original-terminal/` is a byte-for-byte snapshot of all 17 tracked files from commit `308b799de6c6bc9477e5182198887d68d8d4c942` (`Refresh homepage project showcase`), before the September 2026 redesign.

It preserves the original HTML pages, styles, scripts, favicon, and site configuration. The active design remains at the repository root. Changes to the active site do not change this snapshot.

### Preview the original

From the repository root:

```powershell
python -m http.server 8001 --bind 127.0.0.1 --directory themes/original-terminal
```

Open http://127.0.0.1:8001. Serving this folder as the root preserves the original root-relative navigation. Stop the server with Ctrl+C.

### Restore the original

Copy the files inside `original-terminal/` over their matching paths at the repository root, review the changes, and publish through the normal Git workflow. The original snapshot and commit remain available for comparison.
