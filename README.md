# Dynamizer

Juegos sociales en tiempo real para grupos. Crea una sala, comparte el QR con tus amigos, y jugad juntos desde el móvil.

---

## Índice

- [¿Qué es Dynamizer?](#qué-es-dynamizer)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del sistema](#arquitectura-del-sistema)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Cómo levantar en local](#cómo-levantar-en-local)
- [Cómo ejecutar los tests](#cómo-ejecutar-los-tests)
- [Flujo de una partida](#flujo-de-una-partida)
- [Eventos WebSocket](#eventos-websocket)
- [Cómo añadir un nuevo juego](#cómo-añadir-un-nuevo-juego)
- [Roadmap](#roadmap)

---

## ¿Qué es Dynamizer?

Dynamizer es una plataforma de juegos sociales diseñada para grupos de amigos en quedadas. El concepto es simple:

1. Una persona crea una sala desde su móvil o PC
2. Comparte el QR generado automáticamente
3. Los demás escanean y se unen con su nombre y un emoji
4. Todos juegan en tiempo real desde sus móviles
5. Al terminar, se muestra el leaderboard final

Los juegos están pensados para ambientes informales — cervezas, risas, competición sana. El primero implementado es **Time's Up**, el juego de adivinar personajes por descripciones, pistas de una palabra y mímica.

No hay cuentas de usuario. Cada jugador entra con su nombre y emoji. Anónimo, rápido, sin fricciones.

---

## Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | App Router, SSR para carga rápida en móvil, tipado compartido con backend |
| **Backend** | Python 3.11 + FastAPI | Async nativo, Pydantic para validación, ecosistema conocido |
| **WebSockets** | python-socketio + socket.io-client | Reconexión automática, rooms, broadcast. Estándar para juegos en tiempo real |
| **Estado en tiempo real** | Redis | Estado efímero de salas activas, Pub/Sub para escalar a múltiples instancias |
| **Base de datos** | PostgreSQL | Persistencia de historial, leaderboards globales (fase futura) |
| **Deploy inicial** | Vercel (frontend) + Railway (backend) | Gratis para empezar, sin configuración de infraestructura |
| **Deploy futuro** | AWS (CloudFront + ECS Fargate + RDS + ElastiCache) | Escalado real cuando haya tráfico |

### Por qué TypeScript en el frontend

El punto crítico de la app son los eventos WebSocket. Con TypeScript, los tipos de cada evento (ver `apps/web/src/types/eventos.ts`) se definen una sola vez y el compilador avisa si el frontend envía algo que no coincide con lo que espera el backend. Evita bugs silenciosos en runtime.

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js (Vercel / CloudFront)            │   │
│  │                                                      │   │
│  │  / (Home)          → crear sala / unirse con código  │   │
│  │  /sala/[id]        → lobby + QR + lista de jugadores │   │
│  │  /sala/[id]/jugar  → vista de juego en tiempo real   │   │
│  │                                                      │   │
│  │  useSocket() ──── socket.io-client ──────────────────┼───┼──┐
│  └──────────────────────────────────────────────────────┘   │  │
└─────────────────────────────────────────────────────────────┘  │
                                                                   │ WebSocket
┌─────────────────────────────────────────────────────────────┐  │
│                        SERVIDOR                              │  │
│                                                              │  │
│  ┌──────────────────────────────────────────────────────┐   │  │
│  │     FastAPI + python-socketio (Railway / ECS)         │◄──┼──┘
│  │                                                      │   │
│  │  REST:    POST /api/salas/      → crear sala         │   │
│  │           GET  /api/salas/{id}  → estado de sala     │   │
│  │                                                      │   │
│  │  Sockets: sala:unirse           → unir jugador       │   │
│  │           sala:salir            → desconectar        │   │
│  │           juego:iniciar         → arrancar partida   │   │
│  │           juego:carta_adivinada → sumar punto        │   │
│  │           juego:carta_pasada    → pasar carta        │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                        │                                      │
│          ┌─────────────┴──────────────┐                      │
│          │                            │                       │
│  ┌───────▼────────┐        ┌──────────▼───────┐              │
│  │  Redis          │        │  PostgreSQL       │              │
│  │  (estado salas) │        │  (historial,      │              │
│  │  TTL: 6 horas   │        │   leaderboards)   │              │
│  └────────────────┘        └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de datos de una sala

- El **estado activo** de cada sala (jugadores conectados, estado del juego, mazo de cartas) vive en **Redis** con TTL de 6 horas. Es rápido y efímero — no necesita persistirse en base de datos.
- Cuando la partida termina, el resultado se guardará en **PostgreSQL** (implementación futura).
- Los eventos WebSocket usan el sistema de **rooms** de Socket.io: cada sala tiene su propio canal, y los eventos solo se emiten a los jugadores de esa sala.

---

## Estructura del repositorio

```
dynamizer/
│
├── apps/
│   ├── web/                          # Frontend — Next.js + TypeScript
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── page.tsx          # Home: crear sala / unirse
│   │   │   │   ├── __tests__/        # Tests de páginas
│   │   │   │   └── sala/
│   │   │   │       └── [id]/
│   │   │   │           ├── page.tsx          # Lobby de sala + QR
│   │   │   │           └── jugar/
│   │   │   │               └── page.tsx      # Vista de juego activo
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts      # Hook de conexión WebSocket
│   │   │   │   ├── useGame.ts        # Hook de estado del juego
│   │   │   │   └── __tests__/        # Tests de hooks
│   │   │   └── types/
│   │   │       ├── sala.ts           # Tipos: Sala, Jugador, EstadoSala
│   │   │       └── eventos.ts        # Tipos de eventos WebSocket
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Backend — FastAPI + Python
│       ├── app/
│       │   ├── main.py               # Entry point: FastAPI + Socket.io montado
│       │   ├── config.py             # Settings via pydantic-settings
│       │   ├── models/
│       │   │   ├── sala.py           # Sala, Jugador, ConfiguracionSala
│       │   │   └── juego.py          # EstadoJuego, Turno, Carta, FaseTimesUp
│       │   ├── routers/
│       │   │   └── salas.py          # REST: POST /salas, GET /salas/{id}
│       │   ├── services/
│       │   │   ├── sala_service.py   # CRUD de salas en Redis
│       │   │   └── juego_service.py  # Orquestación de partidas
│       │   ├── sockets/
│       │   │   ├── sala.py           # Eventos: sala:unirse, sala:salir
│       │   │   └── juego.py          # Eventos: juego:iniciar, carta_adivinada, carta_pasada
│       │   └── games/
│       │       └── times_up/
│       │           ├── engine.py     # Lógica completa de Time's Up
│       │           ├── cards.py      # Mazo de cartas por defecto
│       │           └── config.py     # Configuración del juego
│       ├── tests/
│       │   ├── conftest.py           # Fixtures: client HTTP, mock Redis
│       │   ├── test_health.py        # Test del endpoint /health
│       │   ├── test_salas.py         # Tests de modelos y API REST
│       │   ├── test_times_up.py      # Tests del motor de Time's Up
│       │   └── test_sala_service.py  # Tests del servicio de salas
│       ├── Dockerfile
│       ├── pyproject.toml
│       └── .env.example
│
├── infra/                            # Infraestructura (AWS CDK — fase futura)
├── docker-compose.yml                # Postgres + Redis para desarrollo local
└── .gitignore
```

---

## Cómo levantar en local

### Requisitos previos

- **Docker** y **Docker Compose** instalados
- **Python 3.11+**
- **Node.js 18+** y **npm**

### 1. Clonar el repositorio

```bash
git clone https://github.com/javisanxe/dynamizer.git
cd dynamizer
```

### 2. Levantar Postgres y Redis

```bash
docker-compose up -d
```

Esto arranca:
- PostgreSQL en `localhost:5432` (usuario: `dynamizer`, contraseña: `dynamizer`, db: `dynamizer`)
- Redis en `localhost:6379`

Verificar que están listos:

```bash
docker-compose ps
```

### 3. Levantar el backend (FastAPI)

```bash
cd apps/api

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows

# Instalar dependencias
pip install -e ".[dev]"

# Copiar variables de entorno
cp .env.example .env

# Arrancar el servidor
uvicorn app.main:asgi_app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en:
- API REST: http://localhost:8000
- Docs interactivos: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 4. Levantar el frontend (Next.js)

En otra terminal:

```bash
cd apps/web

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Arrancar en modo desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:3000

---

## Cómo ejecutar los tests

### Tests del backend

```bash
cd apps/api
source .venv/bin/activate

# Todos los tests
pytest

# Con cobertura
pytest --cov=app --cov-report=term-missing

# Un módulo específico
pytest tests/test_times_up.py -v

# Un test específico
pytest tests/test_times_up.py::TestTimesUpEngine::test_carta_adivinada_suma_punto -v
```

Qué cubre cada archivo de test:

| Archivo | Qué testea |
|---|---|
| `test_health.py` | Endpoint `/health` |
| `test_salas.py` | Modelos `Sala`/`Jugador` y endpoints REST de salas |
| `test_times_up.py` | Motor completo de Time's Up: inicialización, turnos, cartas, fases, leaderboard |
| `test_sala_service.py` | Servicio de salas con Redis mockeado |

### Tests del frontend

```bash
cd apps/web

# Todos los tests
npm test

# Modo watch (re-ejecuta en cada cambio)
npm run test:watch

# Con cobertura
npm test -- --coverage
```

Qué cubre cada archivo de test:

| Archivo | Qué testea |
|---|---|
| `hooks/__tests__/useSocket.test.ts` | Hook de conexión WebSocket |
| `hooks/__tests__/useGame.test.ts` | Hook de estado del juego |
| `app/__tests__/page.test.tsx` | Página Home: renderizado y validaciones |

---

## Flujo de una partida

```
1. HOST crea sala
   POST /api/salas/ → { sala_id, jugador_id, qr_url }
   Redirige a /sala/{id}
   Se genera QR con la URL de la sala

2. JUGADORES escanean QR
   Acceden a /sala/{id}
   Introducen nombre + emoji
   Emiten → sala:unirse { sala_id, nombre, emoji }
   Reciben ← sala:unido { jugador_id }  (guardan en localStorage)
   Todos reciben ← sala:actualizada { ...sala }

3. HOST inicia la partida
   (botón visible solo para el host cuando hay ≥2 jugadores)
   Emite → juego:iniciar { sala_id, jugador_id }
   Todos reciben ← juego:iniciado { ...estado_juego }
   Todos redirigen a /sala/{id}/jugar

4. TURNO ACTIVO
   El jugador cuyo turno es describe/actúa
   Por cada carta adivinada:
     Emite → juego:carta_adivinada { sala_id, jugador_id, carta_id }
     Todos reciben ← juego:actualizado
   Por cada carta pasada (solo ronda 1):
     Emite → juego:carta_pasada { sala_id, jugador_id, carta_id }
   Al acabar el tiempo → juego:fin_turno (emitido por el backend via timer)

5. FIN DE RONDA
   Cuando el mazo se vacía → se avanza automáticamente a la siguiente fase
   El mazo se reinicia con todas las cartas de la ronda anterior
   Ronda 1 → Ronda 2 → Ronda 3 → FIN

6. FIN DE PARTIDA
   Todos reciben ← juego:terminado { leaderboard }
   Se muestra clasificación final
```

---

## Eventos WebSocket

### Eventos que emite el CLIENTE

| Evento | Payload | Descripción |
|---|---|---|
| `sala:unirse` | `{ sala_id, nombre, emoji }` | Unirse a una sala existente |
| `sala:salir` | `{ sala_id, jugador_id }` | Abandonar la sala |
| `juego:iniciar` | `{ sala_id, jugador_id }` | Iniciar partida (solo host) |
| `juego:carta_adivinada` | `{ sala_id, jugador_id, carta_id }` | Marcar carta como adivinada |
| `juego:carta_pasada` | `{ sala_id, jugador_id, carta_id }` | Pasar carta al final del mazo (ronda 1) |

### Eventos que recibe el CLIENTE

| Evento | Payload | Descripción |
|---|---|---|
| `sala:unido` | `{ jugador_id }` | Confirmación de que te has unido |
| `sala:actualizada` | `Sala` | Estado actualizado de la sala (jugadores, estado) |
| `juego:iniciado` | `EstadoJuego` | Estado inicial del juego al arrancar |
| `juego:actualizado` | `EstadoJuego` | Estado actualizado tras cada acción |
| `juego:terminado` | `{ leaderboard }` | Fin de partida con clasificación |
| `error` | `{ mensaje }` | Error del servidor |

---

## Cómo añadir un nuevo juego

El sistema está diseñado para ser extensible. Para añadir un nuevo juego:

### 1. Crear el motor del juego

```
apps/api/app/games/
└── mi_juego/
    ├── __init__.py
    ├── engine.py     # Clase MiJuegoEngine con métodos: inicializar(), ...
    ├── config.py     # Configuración específica del juego
    └── cards.py      # Datos del juego (cartas, preguntas, etc.)
```

El motor debe implementar al menos:

```python
class MiJuegoEngine:
    def inicializar(self, sala: Sala, config=None) -> EstadoJuego:
        ...

    def siguiente_turno(self, estado: EstadoJuego) -> EstadoJuego:
        ...

    def leaderboard(self, estado: EstadoJuego) -> list[dict]:
        ...
```

### 2. Registrar el motor

En `apps/api/app/services/juego_service.py`:

```python
from app.games.mi_juego.engine import MiJuegoEngine

JUEGO_ENGINES = {
    "times_up": TimesUpEngine,
    "mi_juego": MiJuegoEngine,   # añadir aquí
}
```

### 3. Añadir componentes de UI en el frontend

```
apps/web/src/components/juegos/
└── mi-juego/
    ├── MiJuegoVista.tsx
    └── MiJuegoTurno.tsx
```

### 4. Escribir tests

```
apps/api/tests/test_mi_juego.py
```

---

## Roadmap

### Fase 1 — MVP (actual)
- [x] Estructura del proyecto
- [x] Motor de Time's Up (3 rondas)
- [x] Salas en tiempo real con WebSocket
- [x] QR para unirse a sala
- [x] Tests unitarios backend y frontend
- [ ] UI completa del juego (turno activo, temporizador, cartas)
- [ ] Leaderboard al final de partida

### Fase 2 — Producto
- [ ] Temporizador de turno gestionado por el servidor
- [ ] Más juegos (¿Quién soy?, Pictionary, Trivial...)
- [ ] Configuración de sala personalizable (tiempo, cartas, equipos)
- [ ] Persistencia de partidas en PostgreSQL
- [ ] Leaderboard histórico global

### Fase 3 — Escala
- [ ] Deploy en AWS (ECS Fargate + RDS + ElastiCache)
- [ ] CI/CD con GitHub Actions
- [ ] Terraform para infraestructura como código
- [ ] Soporte para múltiples instancias del backend via Redis Pub/Sub
- [ ] PWA para instalación en móvil
