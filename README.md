# 🩺 Geriatric Care

Sistema desenvolvido para **monitoramento e acompanhamento de pacientes**, com foco em cuidados geriátricos. O projeto integra uma aplicação mobile, uma API desenvolvida em Python/Flask e um banco de dados MySQL.

## 📌 Sobre o projeto

O **Geriatric Care** foi desenvolvido com o objetivo de auxiliar cuidadores no acompanhamento das informações de saúde de pacientes, permitindo visualizar dados de frequência cardíaca, históricos e relatórios.

O sistema possui comunicação com um dispositivo **ESP32 equipado com sensor de pulso**, responsável por coletar os dados de BPM (batimentos por minuto) e enviá-los para a API.

## 🚀 Funcionalidades

* 👤 Cadastro e gerenciamento de pacientes
* 👨‍⚕️ Cadastro e gerenciamento de cuidadores
* 🔐 Sistema de login
* ❤️ Monitoramento de BPM
* 📊 Histórico de frequência cardíaca
* 📈 Gráficos diários e semanais
* 📋 Resumos das informações coletadas
* 📄 Geração de relatórios em PDF
* 🔄 Atualização dos dados em tempo real
* 🌙 Modo escuro
* 📱 Aplicação mobile desenvolvida com Ionic
* 📡 Comunicação com ESP32
* 🗄️ Armazenamento dos dados em MySQL

## 🏗️ Arquitetura

O projeto é dividido em três partes principais:

```text
┌──────────────────────┐
│       ESP32          │
│  Sensor de Pulso     │
└──────────┬───────────┘
           │ HTTP
           ▼
┌──────────────────────┐
│    API Flask         │
│      Python          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       MySQL          │
│      Database        │
└──────────┬───────────┘
           │ HTTP/JSON
           ▼
┌──────────────────────┐
│    Ionic / Angular   │
│    Aplicação Mobile  │
└──────────────────────┘
```

## 💻 Tecnologias utilizadas

### Front-end / Mobile

* Ionic
* Angular
* TypeScript
* HTML
* CSS
* JavaScript
* Bootstrap
* Chart.js
* jsPDF

### Back-end

* Python
* Flask
* Flask-CORS
* Gunicorn
* MySQL Connector

### Banco de dados

* MySQL

### Hardware

* ESP32
* PulseSensor
* Arduino IDE

### Deploy

* Render

## 📂 Estrutura do projeto

Uma estrutura simplificada do projeto pode ser organizada da seguinte maneira:

```text
Geriatric-Care/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── home/
│   │   │   ├── relatorio/
│   │   │   ├── configuracoes/
│   │   │   ├── login/
│   │   │   └── ...
│   │   └── ...
│
├── esp32/
│   └── geriatric_care.ino
│
└── README.md
```

## 🔌 Principais endpoints da API

A API Flask disponibiliza endpoints para comunicação entre o aplicativo, banco de dados e dispositivo.

| Método | Endpoint                           | Descrição                            |
| ------ | ---------------------------------- | ------------------------------------ |
| `GET`  | `/`                                | Retorna o BPM atual e histórico      |
| `GET`  | `/bpm`                             | Recebe/consulta informações de BPM   |
| `POST` | `/cuidador`                        | Cadastra cuidador                    |
| `POST` | `/validar-login`                   | Valida o login                       |
| `POST` | `/paciente`                        | Cadastra paciente                    |
| `GET`  | `/pacientes`                       | Lista pacientes                      |
| `GET`  | `/grafico-dia/<cd_paciente>`       | Dados do gráfico diário              |
| `GET`  | `/grafico-semana/<cd_paciente>`    | Dados do gráfico semanal             |
| `GET`  | `/resumo-diario/<cd_paciente>`     | Resumo diário                        |
| `GET`  | `/resumo-semanal`                  | Resumo semanal                       |
| `GET`  | `/resumo-pdf/<cd_paciente>`        | Gera relatório em PDF                |
| `GET`  | `/paciente-cuidador/<cd_cuidador>` | Busca paciente associado ao cuidador |

## ❤️ Monitoramento de BPM

O ESP32 coleta os dados do sensor de pulso e envia os valores para a API Flask.

O aplicativo consulta a API periodicamente e apresenta o BPM na tela principal, além de utilizar os dados armazenados para gerar gráficos e relatórios.

## 📊 Relatórios

O sistema permite consultar informações de frequência cardíaca em diferentes períodos, incluindo:

* Dados do dia;
* Dados da semana;
* Média diária;
* Maior valor registrado;
* Menor valor registrado;
* Histórico de medições;
* Relatórios em PDF.

## 🔐 Configuração

As informações sensíveis utilizadas pelo back-end devem ser configuradas por meio de **variáveis de ambiente**, evitando deixar credenciais diretamente no código.

Exemplo:

```env
DB_HOST=seu_host
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=banco_geriatric_care
RESEND_API_KEY=sua_chave
```

## ▶️ Executando o back-end

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute a aplicação:

```bash
python server.py
```

Para produção, o projeto utiliza Gunicorn:

```bash
gunicorn server:app
```

## 📱 Executando o aplicativo

Entre na pasta do projeto Ionic e instale as dependências:

```bash
npm install
```

Depois execute:

```bash
ionic serve
```

Para gerar o aplicativo Android:

```bash
ionic build
npx cap sync
npx cap open android
```

## ☁️ Deploy

O back-end do projeto pode ser hospedado utilizando o **Render**, permitindo que o aplicativo e o ESP32 façam requisições para a API através da internet.

A aplicação Flask é executada em produção utilizando:

```bash
gunicorn server:app
```

## 🎯 Objetivo acadêmico

O Geriatric Care foi desenvolvido como um projeto de **Engenharia da Computação**, envolvendo conceitos de:

* Desenvolvimento de software;
* Desenvolvimento mobile;
* Desenvolvimento de APIs;
* Banco de dados;
* Internet das Coisas (IoT);
* Comunicação entre hardware e software;
* Visualização de dados;
* Geração de relatórios.

## 👩‍💻 Desenvolvimento

Projeto desenvolvido por **Ayra do Nascimento Martins**, como parte dos estudos e projetos na área de **Engenharia da Computação**.

## 📄 Licença

Este projeto possui finalidade acadêmica e de demonstração de conhecimentos em desenvolvimento de sistemas.
