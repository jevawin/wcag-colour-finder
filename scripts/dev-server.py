#!/usr/bin/env python3
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = os.path.join(os.path.dirname(__file__), '..', 'public')
    os.chdir(root)
    ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
