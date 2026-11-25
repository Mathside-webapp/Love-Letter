from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser
os.chdir(Path(__file__).resolve().parent)
with ThreadingHTTPServer(("127.0.0.1",8765), SimpleHTTPRequestHandler) as server:
    print("3D website: http://localhost:8765/ (keep this window open)", flush=True)
    webbrowser.open("http://localhost:8765/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
