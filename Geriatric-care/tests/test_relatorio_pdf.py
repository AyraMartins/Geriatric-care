import unittest
from unittest.mock import patch

from mysql.connector.cursor import RE_PY_PARAM, _ParamSubstitutor

import server


class FakeCursor:
    def __init__(self, no_records=False):
        self.rows = []
        self.queries = []
        self.executions = []
        self.no_records = no_records

    def execute(self, query, params=()):
        substitutor = _ParamSubstitutor([b"'1'"] * len(params))
        RE_PY_PARAM.sub(substitutor, query.encode("utf-8"))
        if substitutor.remaining:
            raise AssertionError("SQL parameters do not match placeholders")

        self.queries.append(query)
        self.executions.append((query, params))

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
        elif "HOUR(dt_hr_batimentos)" in query:
            self.rows = [{"data": "23/11/2026", "hora": 14, "media": 80}]
        elif "btm_batimentos > 100" in query:
            self.rows = [{
                "data": "23/11/2026",
                "horario": "14:30:45",
                "batimentos": 110,
            }]
        elif "FROM teste_basal" in query:
            self.rows = [
                {"cd_tipo": 1, "media_bpm": 70},
                {"cd_tipo": 2, "media_bpm": 90},
                {"cd_tipo": 3, "media_bpm": 120},
            ]
        elif "FROM batimentos" in query:
            self.rows = [] if self.no_records else [{
                "data": "23/11/2026",
                "media": 80,
                "maximo": 110,
                "minimo": 65,
            }]
        else:
            raise AssertionError(f"Unexpected SQL query: {query}")

    def fetchone(self):
        return self.rows[0] if self.rows else None

    def fetchall(self):
        return self.rows

    def close(self):
        pass


class FakeDatabase:
    def __init__(self, no_records=False):
        self.no_records = no_records
        self.cursors = []

    def cursor(self, dictionary=False):
        cursor = FakeCursor(no_records=self.no_records)
        self.cursors.append(cursor)
        return cursor

    def close(self):
        pass


class ResumoPdfEndpointTests(unittest.TestCase):
    def setUp(self):
        self.client = server.app.test_client()

    def test_resumo_pdf_executes_queries_and_returns_all_report_data(self):
        database = FakeDatabase()
        with patch.object(server, "conectar", return_value=database):
            response = self.client.get(
                "/resumo-pdf/1?data_inicial=2026-11-20&data_final=2026-11-23"
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        payload = response.get_json()
        self.assertEqual(payload["paciente"], "Paciente Teste")
        self.assertEqual(payload["cuidador"], "Cuidador Teste")
        self.assertEqual(payload["total_batimentos_elevados"], 1)
        self.assertEqual(payload["batimentos_elevados"][0]["horario"], "14:30:45")
        self.assertEqual(payload["grafico_horario"][0]["hora"], 14)
        self.assertEqual(payload["grafico_dia_data"], "23/11/2026")
        self.assertEqual(
            payload["testes_basais"],
            [
                {"cd_tipo": 1, "media_bpm": 70},
                {"cd_tipo": 2, "media_bpm": 90},
                {"cd_tipo": 3, "media_bpm": 120},
            ],
        )

        range_queries = [
            execution
            for cursor in database.cursors
            for execution in cursor.executions
            if "FROM batimentos" in execution[0]
        ]
        self.assertEqual(len(range_queries), 3)
        for query, params in range_queries:
            self.assertIn("dt_hr_batimentos >= %s", query)
            self.assertIn("DATE_ADD(%s, INTERVAL 1 DAY)", query)
            self.assertEqual(
                tuple(str(value) for value in params[:3]),
                ("1", "2026-11-20", "2026-11-23"),
            )

        grafico_dia_query = next(
            execution
            for cursor in database.cursors
            for execution in cursor.executions
            if "HOUR(dt_hr_batimentos)" in execution[0]
        )
        self.assertIn(
            "DATE(dt_hr_batimentos) = STR_TO_DATE(%s, '%d/%m/%Y')",
            grafico_dia_query[0],
        )
        self.assertEqual(grafico_dia_query[1][3], "23/11/2026")

        teste_basal_query = next(
            execution
            for cursor in database.cursors
            for execution in cursor.executions
            if "FROM teste_basal" in execution[0]
        )
        self.assertNotIn("dt_hr_batimentos", teste_basal_query[0])
        self.assertEqual(tuple(teste_basal_query[1]), (1,))

    def test_resumo_pdf_requires_valid_non_future_dates(self):
        database = FakeDatabase()
        with patch.object(server, "conectar", return_value=database):
            missing = self.client.get("/resumo-pdf/1")
            reversed_range = self.client.get(
                "/resumo-pdf/1?data_inicial=2026-11-23&data_final=2026-11-20"
            )
            future = self.client.get(
                "/resumo-pdf/1?data_inicial=2099-01-01&data_final=2099-01-02"
            )

        self.assertEqual(missing.status_code, 400)
        self.assertEqual(reversed_range.status_code, 400)
        self.assertEqual(future.status_code, 400)
        self.assertEqual(database.cursors, [])

    def test_resumo_pdf_reports_when_period_has_no_records(self):
        database = FakeDatabase(no_records=True)
        with patch.object(server, "conectar", return_value=database):
            response = self.client.get(
                "/resumo-pdf/1?data_inicial=2026-11-20&data_final=2026-11-23"
            )

        self.assertEqual(response.status_code, 404)
        self.assertIn("Não existem registros", response.get_json()["erro"])

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
