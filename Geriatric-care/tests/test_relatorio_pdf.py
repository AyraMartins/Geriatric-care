import unittest
from unittest.mock import patch

from mysql.connector.cursor import RE_PY_PARAM, _ParamSubstitutor

import server


class FakeCursor:
    def __init__(self):
        self.rows = []
        self.queries = []

    def execute(self, query, params=()):
        substitutor = _ParamSubstitutor([b"'1'"] * len(params))
        RE_PY_PARAM.sub(substitutor, query.encode("utf-8"))
        if substitutor.remaining:
            raise AssertionError("SQL parameters do not match placeholders")

        self.queries.append(query)

        if "FROM cuidador_extra" in query:
            self.rows = [{
                "nm_cuidador": "Médico Teste",
                "email_cuidador": "medico@example.com",
            }]
        elif "INNER JOIN cuidador" in query:
            self.rows = [{
                "nm_paciente": "Paciente Teste",
                "nm_cuidador": "Cuidador Teste",
            }]
        elif "SELECT nm_paciente" in query:
            self.rows = [{"nm_paciente": "Paciente Teste"}]
        elif "btm_batimentos > 100" in query:
            self.rows = [{
                "data": "23/11/2026",
                "horario": "14:30:45",
                "batimentos": 110,
            }]
        elif "FROM batimentos" in query:
            self.rows = [{
                "data": "23/11/2026",
                "media": 80,
                "maximo": 110,
                "minimo": 65,
            }]
        elif "FROM teste_basal" in query:
            self.rows = [{"cd_tipo": 1, "media_bpm": 70}]
        else:
            raise AssertionError(f"Unexpected SQL query: {query}")

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def fetchall(self):
        return self.rows

    def close(self):
        pass


class FakeDatabase:
    def cursor(self, dictionary=False):
        return FakeCursor()

    def close(self):
        pass


class ResumoPdfEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = server.app.test_client()

    def test_resumo_pdf_executes_queries_and_returns_all_report_data(self):
        with patch.object(server, "conectar", side_effect=FakeDatabase):
            response = self.client.get("/resumo-pdf/1")

        self.assertEqual(response.status_code, 200, response.get_json())
        payload = response.get_json()
        self.assertEqual(payload["paciente"], "Paciente Teste")
        self.assertEqual(payload["cuidador"], "Cuidador Teste")
        self.assertEqual(payload["total_batimentos_elevados"], 1)
        self.assertEqual(payload["batimentos_elevados"][0]["horario"], "14:30:45")

    def test_enviar_medicos_accepts_report_and_uses_provider_mock(self):
        pdf_base64 = "JVBERi0xLjQgdGVzdGU="
        with (
            patch.object(server, "conectar", side_effect=FakeDatabase),
            patch.dict("os.environ", {"RESEND_API_KEY": "test-key"}),
            patch.object(server.resend.Emails, "send", return_value={"id": "test-id"}),
        ):
            response = self.client.post(
                "/enviar-medicos/1",
                json={"pdf_base64": pdf_base64},
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(len(response.get_json()["emails_enviados"]), 1)


if __name__ == "__main__":
    unittest.main()
