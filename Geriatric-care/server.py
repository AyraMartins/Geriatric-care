from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

# --------------------
# APP
# --------------------
app = Flask(__name__)
CORS(app)

# --------------------
# BANCO MYSQL
# --------------------
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="banco_geriatric_care"
)

# --------------------
# BPM ESP32
# --------------------
dados = []

@app.route('/bpm')
def bpm():

    valor = request.args.get('valor')

    if valor:
        dados.append(int(valor))
        print("Recebido BPM:", valor)

    return {"ok": True}

# --------------------
# HOME
# --------------------
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
            INSERT INTO cuidador
            (
                nm_cuidador,
                email_cuidador,
                tel_cuidador,
                cd_tipo
            )
            VALUES (%s, %s, %s, %s)
        """

        valores = (
            data['nome'],
            data['email'],
            data['telefone'],
            1
        )

        cursor.execute(sql, valores)

        db.commit()

        cd_cuidador = cursor.lastrowid

        cursor.close()

        return jsonify({
            "msg": "Cuidador criado com sucesso",
            "cd_cuidador": cd_cuidador
        }), 200

    except Exception as e:

        print("ERRO:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# --------------------
# CADASTRO PACIENTE
# --------------------
# --------------------
# CADASTRO PACIENTE
# --------------------
@app.route('/paciente', methods=['POST'])
def criar_paciente():

    try:

        data = request.json

        cursor = db.cursor()

        sql = """
            INSERT INTO paciente
            (
                nm_paciente,
                dt_nasc,
                cd_cuidador
            )
            VALUES (%s, %s, %s)
        """

        valores = (
            data['nome'],
            data['data_nascimento'],
            data['cd_cuidador']
        )

        cursor.execute(sql, valores)

        db.commit()

        cursor.close()

        return jsonify({
            "msg": "Paciente cadastrado com sucesso"
        }), 200

    except Exception as e:

        print("ERRO:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# --------------------
# START SERVER
# --------------------
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )