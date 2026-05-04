from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

# --------------------
# APP PRIMEIRO
# --------------------
app = Flask(__name__)
CORS(app)

# --------------------
# BANCO XAMPP (MySQL)
# --------------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="banco_geriatric_care"
)

# --------------------
# BPM (ESP32)
# --------------------
dados = []

@app.route('/bpm')
def bpm():
    valor = request.args.get('valor')
    if valor:
        dados.append(int(valor))
        print("Recebido BPM:", valor)

    return {"ok": True}

@app.route('/')
def home():
    return jsonify({
        "bpm": dados[-1] if dados else 0,
        "historico": dados[-10:]
    })

# --------------------
# CADASTRO CUIDADOR
# --------------------
@app.route('/cuidador', methods=['POST'])
def criar_cuidador():
    try:
        data = request.json

        cursor = db.cursor()

        sql = """
            INSERT INTO cuidador (nm_cuidador, email_cuidador, tel_cuidador, cd_tipo)
            VALUES (%s, %s, %s, %s)
        """

        cursor.execute(sql, (
            data['nome'],
            data['email'],
            data['telefone'],
            1
        ))

        db.commit()

        return jsonify({"msg": "Cuidador criado com sucesso"}), 200

    except Exception as e:
        print("ERRO:", e)
        return jsonify({"erro": str(e)}), 500

# --------------------
# START SERVER
# --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)