from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

# -------------------
# APP
# -------------------

app = Flask(__name__)
CORS(app)

# -------------------
# MYSQL
# -------------------

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="banco_geriatric_care"
)

# -------------------
# DADOS BPM
# -------------------

dados = []

# -------------------
# RECEBER BPM
# -------------------

@app.route('/bpm')
def bpm():

    valor = request.args.get('valor')

    if valor:

        bpm = int(valor)

        dados.append({
            "valor": bpm,
            "hora": datetime.now().strftime("%H:%M:%S")
        })

        print("BPM:", bpm)

    return jsonify({
        "ok": True
    })

# -------------------
# PEGAR BPM
# -------------------

@app.route('/')
def home():

    ultimo = dados[-1] if dados else {
        "valor": 0,
        "hora": "--:--:--"
    }

    return jsonify({
        "ultimo_bpm": ultimo,
        "historico": dados[-10:]
    })

# -------------------
# CADASTRAR CUIDADOR
# -------------------

@app.route('/cuidador', methods=['POST'])
def criar_cuidador():

    try:

        data = request.json

        cursor = db.cursor()

        sql = """
            INSERT INTO cuidador
            (
                nm_cuidador,
                email_cuidador,
                tel_cuidador,
                cd_tipo
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """

        cursor.execute(sql, (

            data['nome'],
            data['email'],
            data['telefone'],
            1

        ))

        db.commit()

        return jsonify({
            "msg": "Cuidador criado"
        }), 200

    except Exception as e:

        print(e)

        return jsonify({
            "erro": str(e)
        }), 500

# -------------------
# START
# -------------------

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )