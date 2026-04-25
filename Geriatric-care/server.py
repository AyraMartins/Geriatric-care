from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

dados = []

@app.route('/bpm')
def bpm():
    valor = request.args.get('valor')
    if valor:
        dados.append(int(valor))
        print("Recebido:", valor)
    return {"ok": True}

@app.route('/')
def home():
    return jsonify({
        "bpm": dados[-1] if dados else 0,
        "historico": dados[-10:]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)