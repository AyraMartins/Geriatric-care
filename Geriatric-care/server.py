from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import resend
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.widgets.markers import makeMarker
from decimal import Decimal
import base64
import os

resend.api_key = os.getenv("RESEND_API_KEY")

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
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=3306
    )
# ---------------------------------------------------
# GERAR RESUMO DIÁRIO
# ---------------------------------------------------
def salvar_resumo_diario(cd_paciente):

    db = conectar()
    cursor = db.cursor(dictionary=True)

    sql = """
    SELECT
        ROUND(AVG(btm_batimentos), 0) AS media,
        MAX(btm_batimentos) AS maximo,
        MIN(btm_batimentos) AS minimo
    FROM batimentos
    WHERE cd_paciente = %s
    AND DATE(dt_hr_batimentos) = CURDATE()
    """

    cursor.execute(sql, (cd_paciente,))

    resumo = cursor.fetchone()

    sql_delete = """
    DELETE FROM resumo_diario
    WHERE cd_paciente = %s
    AND DATE(dt_resumo_diario) = CURDATE()
    """

    cursor.execute(sql_delete, (cd_paciente,))

    sql_insert = """
    INSERT INTO resumo_diario
    (
        dt_resumo_diario,
        media_bpm,
        max_bpm,
        min_bpm,
        cd_paciente
    )
    VALUES
    (
        NOW(),
        %s,
        %s,
        %s,
        %s
    )
    """

    cursor.execute(sql_insert, (
        resumo['media'],
        resumo['maximo'],
        resumo['minimo'],
        cd_paciente
    ))

    db.commit()

    cursor.close()
    db.close()

# ---------------------------------------------------
# GERAR RESUMO HORÁRIO
# ---------------------------------------------------
def salvar_resumo_horario(cd_paciente):

    db = conectar()
    cursor = db.cursor(dictionary=True)

    sql = """
    SELECT
        ROUND(AVG(btm_batimentos), 0) AS media,
        MAX(btm_batimentos) AS maximo,
        MIN(btm_batimentos) AS minimo
    FROM batimentos
    WHERE cd_paciente = %s
    AND DATE(dt_hr_batimentos) = CURDATE()
    AND HOUR(dt_hr_batimentos) = HOUR(NOW())
    """

    cursor.execute(sql, (cd_paciente,))

    resumo = cursor.fetchone()

    sql_delete = """
    DELETE FROM resumo_horario
    WHERE cd_paciente = %s
    AND data_resumo = CURDATE()
    AND hora_resumo = HOUR(NOW())
    """

    cursor.execute(sql_delete, (cd_paciente,))

    sql_insert = """
    INSERT INTO resumo_horario
    (
        data_resumo,
        hora_resumo,
        media_bpm,
        max_bpm,
        min_bpm,
        cd_paciente
    )
    VALUES
    (
        CURDATE(),
        HOUR(NOW()),
        %s,
        %s,
        %s,
        %s
    )
    """

    cursor.execute(sql_insert, (
        resumo['media'],
        resumo['maximo'],
        resumo['minimo'],
        cd_paciente
    ))

    db.commit()

    cursor.close()
    db.close()

# ---------------------------------------------------
# GERAR RESUMO SEMANAL
# ---------------------------------------------------
def salvar_resumo_semanal(cd_paciente):

    db = conectar()
    cursor = db.cursor(dictionary=True)

    sql = """
    SELECT
        ROUND(AVG(btm_batimentos), 0) AS media,
        MAX(btm_batimentos) AS maximo,
        MIN(btm_batimentos) AS minimo
    FROM batimentos
    WHERE cd_paciente = %s
    AND YEARWEEK(dt_hr_batimentos, 1) = YEARWEEK(NOW(), 1)
    """

    cursor.execute(sql, (cd_paciente,))

    resumo = cursor.fetchone()

    sql_delete = """
    DELETE FROM resumo_semanal
    WHERE cd_paciente = %s
    AND semana_resumo_semanal = WEEK(NOW())
    AND ano_resumo_semanal = YEAR(NOW())
    """

    cursor.execute(sql_delete, (cd_paciente,))

    sql_insert = """
    INSERT INTO resumo_semanal
    (
        semana_resumo_semanal,
        ano_resumo_semanal,
        media_bpm,
        max_bpm,
        min_bpm,
        cd_paciente
    )
    VALUES
    (
        WEEK(NOW()),
        YEAR(NOW()),
        %s,
        %s,
        %s,
        %s
    )
    """

    cursor.execute(sql_insert, (
        resumo['media'],
        resumo['maximo'],
        resumo['minimo'],
        cd_paciente
    ))

    db.commit()

    cursor.close()
    db.close()
# ---------------------------------------------------
# BPM TEMPORÁRIO
# ---------------------------------------------------
dados = []

# ---------------------------------------------------
# CUIDADOR ATUAL
# ---------------------------------------------------
cuidador_atual = None

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
# DEFINIR CUIDADOR ATUAL
# ---------------------------------------------------
@app.route('/set-cuidador/<int:cd>')
def set_cuidador(cd):

    global cuidador_atual

    cuidador_atual = cd

    return jsonify({
        "ok": True,
        "cd_cuidador": cuidador_atual
    })

# ---------------------------------------------------
# RECEBER BPM ESP32
# ---------------------------------------------------
@app.route('/bpm')
def bpm():

    try:

        global cuidador_atual

        valor = request.args.get('valor', '').strip()

        print("RAW RECEBIDO:", valor)
        print("CUIDADOR ATUAL:", cuidador_atual)

        if not valor:
            return jsonify({"erro": "valor vazio"}), 400

        try:
            valor = int(valor)

        except:
            return jsonify({"erro": "valor inválido"}), 400

        db = conectar()

        cursor = db.cursor()

        # -----------------------------------------
        # BUSCAR PACIENTE DO CUIDADOR
        # -----------------------------------------
        sql_paciente = """
        SELECT cd_paciente
        FROM paciente
        WHERE cd_cuidador = %s
        LIMIT 1
        """

        cursor.execute(sql_paciente, (cuidador_atual,))

        paciente = cursor.fetchone()

        if not paciente:

            cursor.close()
            db.close()

            return jsonify({
                "erro": "Paciente não encontrado"
            }), 404

        cd_paciente = paciente[0]

        print("CD PACIENTE:", cd_paciente)

        # -----------------------------------------
        # BPM TEMPORÁRIO
        # -----------------------------------------
        dados.append(valor)

        # -----------------------------------------
        # INSERT BATIMENTOS
        # -----------------------------------------
        sql = """
        INSERT INTO batimentos
        (
            btm_batimentos,
            dt_hr_batimentos,
            cd_paciente
        )
        VALUES
        (
            %s,
            NOW(),
            %s
        )
        """

        cursor.execute(sql, (valor, cd_paciente))

        db.commit()
# -----------------------------------------
# ATUALIZAR RESUMOS
# -----------------------------------------
        salvar_resumo_diario(cd_paciente)
        salvar_resumo_horario(cd_paciente)
        salvar_resumo_semanal(cd_paciente)

        cursor.close()
        db.close()

        return jsonify({
            "ok": True,
            "bpm": valor,
            "cd_paciente": cd_paciente
        })

    except Exception as e:

        print("ERRO BPM:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# CADASTRO CUIDADOR
# ---------------------------------------------------
@app.route('/cuidador', methods=['POST'])
def criar_cuidador():

    try:

        global cuidador_atual

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

        # -----------------------------------------
        # LOGIN AUTOMÁTICO
        # -----------------------------------------
        cuidador_atual = cd_cuidador

        print("CUIDADOR LOGADO AUTOMATICAMENTE:", cuidador_atual)

        cursor.close()
        db.close()

        return jsonify({
            "msg": "Cuidador criado com sucesso",
            "cd_cuidador": cd_cuidador,
            "logado": True
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

        global cuidador_atual

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

            cuidador_atual = cuidador['cd_cuidador']

            print("CUIDADOR LOGADO:", cuidador_atual)

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

        return jsonify({
            "erro": str(e)
        }), 500

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
# LISTAR CUIDADORES EXTRAS
# ---------------------------------------------------
@app.route('/cuidadores-extra/<int:cd_paciente>')
def listar_cuidadores_extra(cd_paciente):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            ce.cd_cuidador_extra,
            ce.nm_cuidador,
            ce.email_cuidador,
            ce.tel_cuidador,
            ce.cd_tipo,
            tc.nm_tipo

        FROM cuidador_extra ce

        INNER JOIN tipo_cuidador tc
        ON tc.cd_tipo = ce.cd_tipo

        WHERE ce.cd_paciente = %s

        ORDER BY ce.cd_cuidador_extra DESC
        """

        cursor.execute(sql, (cd_paciente,))

        dados = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(dados)

    except Exception as e:

        print("ERRO LISTAR CUIDADORES:", e)

        return jsonify({
            "erro": str(e)
        }), 500


# ---------------------------------------------------
# CADASTRAR CUIDADOR EXTRA
# ---------------------------------------------------
@app.route('/cuidadores-extra', methods=['POST'])
def cadastrar_cuidador_extra():

    try:

        data = request.json

        db = conectar()

        cursor = db.cursor()

        sql = """
        INSERT INTO cuidador_extra
        (
            nm_cuidador,
            email_cuidador,
            tel_cuidador,
            cd_tipo,
            cd_paciente
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
            data['cd_tipo'],
            data['cd_paciente']
        )

        cursor.execute(sql, valores)

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "ok": True
        })

    except Exception as e:

        print("ERRO CADASTRAR EXTRA:", e)

        return jsonify({
            "erro": str(e)
        }), 500


# ---------------------------------------------------
# EDITAR CUIDADOR EXTRA
# ---------------------------------------------------
@app.route('/cuidadores-extra/<int:id>', methods=['PUT'])
def editar_cuidador_extra(id):

    try:

        data = request.json

        db = conectar()

        cursor = db.cursor()

        sql = """
        UPDATE cuidador_extra
        SET
            nm_cuidador = %s,
            email_cuidador = %s,
            tel_cuidador = %s,
            cd_tipo = %s
        WHERE cd_cuidador_extra = %s
        """

        valores = (
            data['nome'],
            data['email'],
            data['telefone'],
            data['cd_tipo'],
            id
        )

        cursor.execute(sql, valores)

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "ok": True
        })

    except Exception as e:

        print("ERRO EDITAR EXTRA:", e)

        return jsonify({
            "erro": str(e)
        }), 500


# ---------------------------------------------------
# EXCLUIR CUIDADOR EXTRA
# ---------------------------------------------------
@app.route('/cuidadores-extra/<int:id>', methods=['DELETE'])
def excluir_cuidador_extra(id):

    try:

        db = conectar()

        cursor = db.cursor()

        sql = """
        DELETE FROM cuidador_extra
        WHERE cd_cuidador_extra = %s
        """

        cursor.execute(sql, (id,))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "ok": True
        })

    except Exception as e:

        print("ERRO EXCLUIR EXTRA:", e)

        return jsonify({
            "erro": str(e)
        }), 500

# ---------------------------------------------------
# ENVIAR PDF PARA MÉDICOS
# ---------------------------------------------------
@app.route('/enviar-medicos/<int:cd_paciente>', methods=['POST'])
def enviar_medicos(cd_paciente):

    try:

        data = request.json

        pdf_base64 = data.get('pdf_base64')

        if not pdf_base64:

            return jsonify({
                "erro": "PDF não enviado"
            }), 400

        db = conectar()

        cursor = db.cursor(dictionary=True)

        # -----------------------------------------
        # BUSCAR MÉDICOS
        # -----------------------------------------
        sql_medicos = """
        SELECT
            nm_cuidador,
            email_cuidador
        FROM cuidador_extra
        WHERE cd_paciente = %s
        AND cd_tipo = 4
        """

        cursor.execute(sql_medicos, (cd_paciente,))

        medicos = cursor.fetchall()

        if not medicos:

            cursor.close()
            db.close()

            return jsonify({
                "erro": "Nenhum médico encontrado"
            }), 404

        # -----------------------------------------
        # BUSCAR PACIENTE
        # -----------------------------------------
        sql_paciente = """
        SELECT
            p.nm_paciente
        FROM paciente p
        WHERE p.cd_paciente = %s
        """

        cursor.execute(sql_paciente, (cd_paciente,))

        paciente = cursor.fetchone()

        cursor.close()
        db.close()

        nm_paciente = (
            paciente['nm_paciente']
            if paciente else
            'Paciente'
        )

        enviados = []

        # -----------------------------------------
        # ENVIAR EMAILS
        # -----------------------------------------
        for medico in medicos:

            resend.Emails.send({

                "from": "onboarding@resend.dev",

                "to": medico['email_cuidador'],

                "subject": f"Relatório BPM - {nm_paciente}",

                "html": f"""
                <h2>Relatório BPM</h2>

                <p>
                    O relatório em PDF segue em anexo.
                </p>
                """,

                "attachments": [
                    {
                        "filename": "relatorio-bpm.pdf",
                        "content": pdf_base64
                    }
                ]
            })

            enviados.append(
                medico['email_cuidador']
            )

        return jsonify({
            "ok": True,
            "emails_enviados": enviados
        })

    except Exception as e:

        print("ERRO ENVIAR MÉDICOS:", e)

        return jsonify({
            "erro": str(e)
        }), 500
# ---------------------------------------------------
# ENVIAR AJUDA
# ---------------------------------------------------
@app.route('/enviar-ajuda', methods=['POST'])
def enviar_ajuda():

    try:

        data = request.json

        assunto = data.get('assunto')
        descricao = data.get('descricao')
        email_usuario = data.get('email')

        resend.Emails.send({

            "from": "onboarding@resend.dev",

            "to": "ayramartins0@gmail.com",

            "subject": f"SUPORTE - {assunto}",

            "html": f"""
            <h2>Novo chamado de ajuda</h2>

            <p>
                <b>Email do usuário:</b>
                {email_usuario}
            </p>

            <p>
                <b>Assunto:</b>
                {assunto}
            </p>

            <p>
                <b>Descrição:</b>
                {descricao}
            </p>
            """
        })

        return jsonify({
            "ok": True
        })

    except Exception as e:

        print("ERRO AJUDA:", e)

        return jsonify({
            "erro": str(e)
        }), 500


# ---------------------------------------------------
# BUSCAR DADOS DA CONTA
# ---------------------------------------------------
@app.route('/conta/<int:cd_cuidador>')
def buscar_conta(cd_cuidador):

    try:

        db = conectar()

        cursor = db.cursor(dictionary=True)

        sql = """
        SELECT

            c.nm_cuidador,
            c.email_cuidador,
            c.tel_cuidador,

            p.nm_paciente,
            p.dt_nasc

        FROM cuidador c

        LEFT JOIN paciente p
        ON p.cd_cuidador = c.cd_cuidador

        WHERE c.cd_cuidador = %s

        LIMIT 1
        """

        cursor.execute(sql, (cd_cuidador,))

        dados = cursor.fetchone()

        cursor.close()
        db.close()

        if not dados:

            return jsonify({
                "erro": "Conta não encontrada"
            }), 404

        data_formatada = ''

        if dados['dt_nasc']:

            data_formatada = dados['dt_nasc'].strftime('%Y-%m-%d')

        return jsonify({

            "nome_cuidador":
                dados['nm_cuidador'],

            "email_cuidador":
                dados['email_cuidador'],

            "telefone_cuidador":
                dados['tel_cuidador'],

            "nome_paciente":
                dados['nm_paciente'],

            "data_nascimento":
                data_formatada

        })

    except Exception as e:

        print("ERRO CONTA:", e)

        return jsonify({
            "erro": str(e)
        }), 500


# ---------------------------------------------------
# EDITAR CONTA
# ---------------------------------------------------
@app.route('/conta/<int:cd_cuidador>', methods=['PUT'])
def editar_conta(cd_cuidador):

    try:

        data = request.json

        db = conectar()

        cursor = db.cursor()

        # -----------------------------------------
        # EDITAR CUIDADOR
        # -----------------------------------------
        sql_cuidador = """
        UPDATE cuidador
        SET
            nm_cuidador = %s,
            email_cuidador = %s,
            tel_cuidador = %s
        WHERE cd_cuidador = %s
        """

        valores_cuidador = (

            data['nome_cuidador'],
            data['email_cuidador'],
            data['telefone_cuidador'],
            cd_cuidador

        )

        cursor.execute(
            sql_cuidador,
            valores_cuidador
        )

        # -----------------------------------------
        # EDITAR PACIENTE
        # -----------------------------------------
        sql_paciente = """
        UPDATE paciente
        SET
            nm_paciente = %s,
            dt_nasc = %s
        WHERE cd_cuidador = %s
        """

        valores_paciente = (

            data['nome_paciente'],
            data['data_nascimento'],
            cd_cuidador

        )

        cursor.execute(
            sql_paciente,
            valores_paciente
        )

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "ok": True
        })

    except Exception as e:

        print("ERRO EDITAR CONTA:", e)

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