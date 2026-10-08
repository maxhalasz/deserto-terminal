# Servidor estático local SEM cache (o navegador do app insiste em reaproveitar JS velho).
import http.server, socketserver, sys, os
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', port), H) as s:
    s.serve_forever()
