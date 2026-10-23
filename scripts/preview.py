"""Local preview with production analytics omitted; add ?nojs=1 to check fallback HTML."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import argparse
import re

ROOT = Path(__file__).resolve().parents[1]


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        target = Path(self.translate_path(self.path))
        if target.is_dir():
            target /= 'index.html'
        if target.suffix == '.html' and target.is_file():
            content = target.read_text(encoding='utf-8')
            content = re.sub(r'<script\b[^>]*src=["\']https://static\.cloudflareinsights\.com/[^>]*>\s*</script>', '', content)
            payload = content.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            if parse_qs(urlsplit(self.path).query).get('nojs') == ['1']:
                self.send_header('Content-Security-Policy', "script-src 'none'")
            self.end_headers()
            return BytesIO(payload)
        return super().send_head()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler)
    print(f'Local preview: http://127.0.0.1:{args.port}/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
