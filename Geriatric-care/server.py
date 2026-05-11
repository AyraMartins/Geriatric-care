from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

# ---------------------------------------------------
# APP
# ---------------------------------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------
# CONEXÃO MYSQL
# ---------------------------------------------------
def conectar():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="banco_geriatric_care"
    )

# ---------------------------------------------------
# BPM TEMPORÁRIO
# ---------------------------------------------------
dados = []

# ---------------------------------------------------
# HOME
# ---------------------------------------------------
@app.route('/')
def home():

    return jsonify({
        "bpm": dados[-1] if dados else 0,
        "historico": dados[-10:]
    })

# ---------------------------------------------------
# RECEBER BPM ESP32
# ---------------------------------------------------
@app.route('/bpm')
def bpm():

    try:

        valor = request.args.get('valor', '').strip()

        print("RAW RECEBIDO:", valor)

        if not valor:
            return jsonify({"erro": "valor vazio"}), 400

        try:
            valor = int(valor)
        except:
            return jsonify({"erro": "valor inválido"}), 400

        cd_paciente = 3

        dados.append(valor)

        db = conectar()
        cursor = db.cursor()

        sql = """
        INSERT INTO batimentos
        (btm_batimentos, dt_hr_batimentos, cd_paciente)
        VALUES (%s, NOW(), %s)
        """

        cursor.execute(sql, (valor, cd_paciente))

        db.commit()
        cursor.close()
        db.close()

        return jsonify({"ok": True, "bpm": valor})

    except Exception as e:
        print("ERRO BPM:", e)
        return jsonify({"erro": str(e)}), 500
# ---------------------------------------------------
# CADASTRO CUIDADOR
# ---------------------------------------------------
@app.route('/cuidador', methods=['POST'])
def criar_cuidador():

    try:

        data = request.json

        db = conectar()

        cursor = db.cursor()

        sql = """
        INSERT INTO cuidador
        (
            nm_cuidador,
            email_cuidador,
            tel_cuidador,
            cd_senha,
            cd_tipo
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s
        )
        """

        valores = (
            data['nome'],
            data['email'],
            data['telefone'],
            data['cd_senha'],
            1
        )

        cursor.execute(sql, valores)

        db.commit()

        cd_cuidador = cursor.lastrowid

        cursor.close()
        db.close()

        return jsonify({
            "msg": "Cuidador criado com sucesso",
            "cd_cuidador": cd_cuidador
        })

    except Exception as e:

        print("ERRO CUIDADOR:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# VALIDAR LOGIN
# ---------------------------------------------------
@app.route('/validar-login', methods=['POST'])
def validar_login():

    try:

        data = request.json

        email = data.get('email')
        senha = data.get('senha')

        if not email or not senha:
            return jsonify({
                "valido": False,
                "erro": "Email e senha são obrigatórios"
            }), 400

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT cd_cuidador, nm_cuidador
        FROM cuidador
        WHERE email_cuidador = %s AND cd_senha = %s
        """

        cursor.execute(sql, (email, senha))

        cuidador = cursor.fetchone()

        cursor.close()
        db.close()

        if cuidador:
            return jsonify({
                "valido": True,
                "cd_cuidador": cuidador['cd_cuidador'],
                "nm_cuidador": cuidador['nm_cuidador']
            })
        else:
            return jsonify({
                "valido": False,
                "erro": "Email ou senha inválidos"
            })

    except Exception as e:

        print("ERRO VALIDAR LOGIN:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# CADASTRO PACIENTE
# ---------------------------------------------------
@app.route('/paciente', methods=['POST'])
def criar_paciente():

    try:

        data = request.json

        db = conectar()

        cursor = db.cursor()

        sql = """
        INSERT INTO paciente
        (
            nm_paciente,
            dt_nasc,
            cd_cuidador
        )
        VALUES
        (
            %s,
            %s,
            %s
        )
        """

        valores = (
            data['nome'],
            data['data_nascimento'],
            data['cd_cuidador']
        )

        cursor.execute(sql, valores)

        db.commit()

        cd_paciente = cursor.lastrowid

        cursor.close()
        db.close()

        return jsonify({
            "msg": "Paciente cadastrado com sucesso",
            "cd_paciente": cd_paciente
        })

    except Exception as e:

        print("ERRO PACIENTE:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# LISTAR PACIENTES
# ---------------------------------------------------
@app.route('/pacientes')
def listar_pacientes():

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT *
        FROM paciente
        """

        cursor.execute(sql)

        pacientes = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(pacientes)

    except Exception as e:

        print("ERRO PACIENTES:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# GRÁFICO DIA
# ---------------------------------------------------
@app.route('/grafico-dia/<int:cd_paciente>')
def grafico_dia(cd_paciente):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            HOUR(dt_hr_batimentos) AS hora,

            AVG(btm_batimentos) AS media,

            MAX(btm_batimentos) AS maximo,

            MIN(btm_batimentos) AS minimo

        FROM batimentos

        WHERE DATE(dt_hr_batimentos) = CURDATE()
        AND cd_paciente = %s

        GROUP BY HOUR(dt_hr_batimentos)

        ORDER BY hora
        """

        cursor.execute(sql, (cd_paciente,))

        dados_grafico = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(dados_grafico)

    except Exception as e:

        print("ERRO GRAFICO DIA:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# GRÁFICO SEMANA
# ---------------------------------------------------
@app.route('/grafico-semana/<int:cd_paciente>')
def grafico_semana(cd_paciente):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            DATE_FORMAT(
                DATE(dt_hr_batimentos),
                '%d/%m'
            ) AS dia,

            ROUND(
                AVG(btm_batimentos),
                0
            ) AS media

        FROM batimentos

        WHERE cd_paciente = %s
        AND dt_hr_batimentos >= CURDATE() - INTERVAL 7 DAY

        GROUP BY DATE(dt_hr_batimentos)

        ORDER BY DATE(dt_hr_batimentos) ASC
        """

        cursor.execute(sql, (cd_paciente,))

        dados_grafico = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(dados_grafico)

    except Exception as e:

        print("ERRO GRAFICO SEMANA:", e)

        return jsonify({
            "erro": str(e)
        }), 500
# ---------------------------------------------------
# RESUMO DIÁRIO
# ---------------------------------------------------
@app.route('/resumo-diario/<int:cd_paciente>')
def resumo_diario(cd_paciente):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            DATE_FORMAT(
                DATE(dt_hr_batimentos),
                '%d/%m/%Y'
            ) AS data,

            ROUND(
                AVG(btm_batimentos),
                0
            ) AS media,

            MAX(btm_batimentos) AS maximo,

            MIN(btm_batimentos) AS minimo

        FROM batimentos

        WHERE cd_paciente = %s
        AND DATE(dt_hr_batimentos) = CURDATE()

        GROUP BY DATE(dt_hr_batimentos)
        """

        cursor.execute(sql, (cd_paciente,))

        resumo = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(resumo)

    except Exception as e:

        print("ERRO RESUMO DIARIO:", e)

        return jsonify({
            "erro": str(e)
        }), 500
# ---------------------------------------------------
# RESUMO SEMANAL
# ---------------------------------------------------
@app.route('/resumo-semanal/<int:cd_paciente>')
def resumo_semanal(cd_paciente):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            WEEK(dt_hr_batimentos) AS semana,

            YEAR(dt_hr_batimentos) AS ano,

            AVG(btm_batimentos) AS media,

            MAX(btm_batimentos) AS maximo,

            MIN(btm_batimentos) AS minimo

        FROM batimentos

        WHERE cd_paciente = %s

        GROUP BY
            WEEK(dt_hr_batimentos),
            YEAR(dt_hr_batimentos)

        ORDER BY ano DESC, semana DESC
        """

        cursor.execute(sql, (cd_paciente,))

        resumo = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(resumo)

    except Exception as e:

        print("ERRO RESUMO SEMANAL:", e)

        return jsonify({
            "erro": str(e)
        }), 500



# ---------------------------------------------------
# RESUMO PDF
# ---------------------------------------------------
@app.route('/resumo-pdf/<int:cd_paciente>')
def resumo_pdf(cd_paciente):

    try:

        db = conectar()
        cursor = db.cursor(dictionary=True)

        # -----------------------------------------
        # BUSCAR NOME DO PACIENTE E CUIDADOR
        # -----------------------------------------
        cursor.execute("""
            SELECT
                p.nm_paciente,
                c.nm_cuidador
            FROM paciente p
            INNER JOIN cuidador c ON c.cd_cuidador = p.cd_cuidador
            WHERE p.cd_paciente = %s
        """, (cd_paciente,))

        pessoas = cursor.fetchone()

        nm_paciente = pessoas['nm_paciente'] if pessoas else 'Desconhecido'
        nm_cuidador = pessoas['nm_cuidador'] if pessoas else 'Desconhecido'

        # -----------------------------------------
        # RESUMO DOS DADOS
        # -----------------------------------------
        sql = """
        SELECT
            DATE_FORMAT(DATE(dt_hr_batimentos), '%d/%m/%Y') AS data,
            ROUND(AVG(btm_batimentos), 0) AS media,
            MAX(btm_batimentos) AS maximo,
            MIN(btm_batimentos) AS minimo
        FROM batimentos
        WHERE cd_paciente = %s
        GROUP BY DATE(dt_hr_batimentos)
        ORDER BY DATE(dt_hr_batimentos) DESC
        """

        cursor.execute(sql, (cd_paciente,))
        resumo = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify({
            "paciente": nm_paciente,
            "cuidador": nm_cuidador,
            "dados": resumo
        })

    except Exception as e:
        print("ERRO RESUMO PDF:", e)
        return jsonify({"erro": str(e)}), 500





# ---------------------------------------------------
# PACIENTE DO CUIDADOR
# ---------------------------------------------------
@app.route('/paciente-cuidador/<int:cd_cuidador>')
def paciente_cuidador(cd_cuidador):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT
            cd_paciente,
            nm_paciente
        FROM paciente
        WHERE cd_cuidador = %s
        LIMIT 1
        """

        cursor.execute(sql, (cd_cuidador,))

        paciente = cursor.fetchone()

        cursor.close()
        db.close()

        if paciente:

            return jsonify(paciente)

        return jsonify({
            "erro": "Paciente não encontrado"
        }), 404

    except Exception as e:

        print("ERRO PACIENTE CUIDADOR:", e)

        return jsonify({
            "erro": str(e)
        }), 500
    
# ---------------------------------------------------
# START SERVER
# ---------------------------------------------------
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )