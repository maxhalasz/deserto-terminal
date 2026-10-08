# Servidor estático local SEM cache e com várias conexões ao mesmo tempo
# (o navegador do app e o Edge sem janela batem juntos; um servidor de uma conexão só travava).
import http.server, sys
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer.allow_reuse_address = True
http.server.ThreadingHTTPServer(('', port), H).serve_forever()
