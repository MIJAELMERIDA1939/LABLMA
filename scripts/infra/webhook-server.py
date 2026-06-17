import subprocess
import sys
import os
import json
import hmac
import hashlib
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "") or "change-me"
WEBHOOK_PORT = int(os.environ.get("WEBHOOK_PORT", "9000"))

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/webhook/github":
            self.send_response(404)
            self.end_headers()
            return

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len)
        signature = self.headers.get("X-Hub-Signature-256", "")

        if WEBHOOK_SECRET and WEBHOOK_SECRET != "change-me":
            expected = "sha256=" + hmac.new(
                WEBHOOK_SECRET.encode(), body, hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b"Invalid signature")
                return

        event = self.headers.get("X-GitHub-Event", "")
        if event == "push":
            try:
                deploy_script = PROJECT_ROOT / "scripts" / "infra" / "deploy.ps1"
                subprocess.Popen(
                    [
                        "powershell.exe",
                        "-NoProfile",
                        "-ExecutionPolicy", "Bypass",
                        "-File", str(deploy_script),
                    ],
                    cwd=str(PROJECT_ROOT),
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Deploy triggered")
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Error: {e}".encode())
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"Event '{event}' ignored".encode())

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", WEBHOOK_PORT), WebhookHandler)
    print(f"[WEBHOOK] Listening on port {WEBHOOK_PORT}")
    print(f"[WEBHOOK] Endpoint: POST /webhook/github")
    print(f"[WEBHOOK] Health:    GET /health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[WEBHOOK] Shutting down")
        server.server_close()
