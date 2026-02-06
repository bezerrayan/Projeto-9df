from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Configuração
PORT = 5000
HOST = '0.0.0.0' # Permite acesso na rede local

@app.route('/')
def home():
    """Rota principal que serve o index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    """
    Rota genérica para servir arquivos estáticos (CSS, JS, Imagens, HTMLs secundários).
    Verifica se o arquivo existe antes de enviar.
    """
    if os.path.exists(path):
        return send_from_directory('.', path)
    else:
        return f"Arquivo '{path}' não encontrado.", 404

if __name__ == '__main__':
    print(f"✅ Servidor rodando!")
    print(f"👉 Acesso Local: http://127.0.0.1:{PORT}")
    print(f"👉 Acesso na Rede (Wi-Fi): http://{HOST}:{PORT} (Seu IP local pode variar)")
    print("---------------------------------------------------------")
    app.run(host=HOST, port=PORT, debug=True)
