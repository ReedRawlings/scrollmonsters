"""Local static server that refreshes the music playlist whenever the game loads."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        if urlsplit(self.path).path == '/assets/music/playlist.js':
            try:
                subprocess.run(['node', str(ROOT / 'scripts/build-music.cjs')], check=True, capture_output=True)
            except subprocess.CalledProcessError:
                self.send_error(500, 'Unable to build music playlist')
                return
        super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
print(f'Game: http://localhost:{port}', flush=True)
ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
