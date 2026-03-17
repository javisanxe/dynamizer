import pytest
from app.models.sala import Sala, Jugador
from app.models.juego import FaseTimesUp
from app.games.times_up.engine import TimesUpEngine
from app.games.times_up.cards import get_default_cards
from app.games.times_up.config import TimesUpConfig


@pytest.fixture
def sala_con_jugadores():
    sala = Sala()
    sala.jugadores = [
        Jugador(nombre="Ana",   emoji="🎉", es_host=True),
        Jugador(nombre="Bob",   emoji="🎮"),
        Jugador(nombre="Carol", emoji="🌟"),
    ]
    sala.host_id = sala.jugadores[0].id
    return sala


@pytest.fixture
def engine():
    return TimesUpEngine()


@pytest.fixture
def estado_inicial(engine, sala_con_jugadores):
    config = TimesUpConfig(cartas_por_jugador=3)
    return engine.inicializar(sala_con_jugadores, config)


class TestCards:
    def test_get_default_cards_devuelve_lista(self):
        cards = get_default_cards()
        assert len(cards) > 0

    def test_cartas_tienen_id_y_texto(self):
        cards = get_default_cards()
        for c in cards:
            assert c.id
            assert c.texto


class TestTimesUpEngine:
    def test_inicializar_crea_estado(self, estado_inicial, sala_con_jugadores):
        assert estado_inicial.sala_id == sala_con_jugadores.id
        assert estado_inicial.fase == FaseTimesUp.RONDA_1
        assert len(estado_inicial.orden_jugadores) == 3
        assert len(estado_inicial.mazo) > 0

    def test_inicializar_puntuaciones_en_cero(self, estado_inicial, sala_con_jugadores):
        for jugador in sala_con_jugadores.jugadores:
            assert estado_inicial.puntuaciones[jugador.id] == 0

    def test_iniciar_turno(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        assert estado.turno_actual is not None
        assert estado.turno_actual.activo is True
        assert estado.turno_actual.jugador_id in estado.orden_jugadores

    def test_carta_adivinada_suma_punto(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        carta_id = estado.mazo[0].id
        jugador_id = estado.turno_actual.jugador_id

        estado = engine.carta_adivinada(estado, carta_id)

        assert estado.puntuaciones[jugador_id] == 1
        assert carta_id not in [c.id for c in estado.mazo]
        assert carta_id in [c.id for c in estado.descartadas]

    def test_carta_adivinada_sin_turno_activo_lanza_error(self, engine, estado_inicial):
        carta_id = estado_inicial.mazo[0].id
        with pytest.raises(ValueError, match="No hay turno activo"):
            engine.carta_adivinada(estado_inicial, carta_id)

    def test_carta_pasada_en_ronda_1(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        carta_id = estado.mazo[0].id
        n_cartas_antes = len(estado.mazo)

        estado = engine.carta_pasada(estado, carta_id)

        assert len(estado.mazo) == n_cartas_antes  # sigue en el mazo
        assert estado.mazo[-1].id == carta_id       # al final
        assert carta_id in estado.turno_actual.cartas_pasadas

    def test_carta_pasada_en_ronda_2_lanza_error(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        estado.fase = FaseTimesUp.RONDA_2
        carta_id = estado.mazo[0].id
        with pytest.raises(ValueError, match="Solo se puede pasar en la ronda 1"):
            engine.carta_pasada(estado, carta_id)

    def test_finalizar_turno_avanza_indice(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        indice_inicial = estado.indice_turno
        estado = engine.finalizar_turno(estado)
        indice_esperado = (indice_inicial + 1) % len(estado.orden_jugadores)
        assert estado.indice_turno == indice_esperado

    def test_leaderboard_ordenado_por_puntos(self, engine, estado_inicial):
        estado = engine.iniciar_turno(estado_inicial)
        # Simular puntuaciones
        jugadores = list(estado.puntuaciones.keys())
        estado.puntuaciones[jugadores[0]] = 5
        estado.puntuaciones[jugadores[1]] = 10
        estado.puntuaciones[jugadores[2]] = 3

        lb = engine.leaderboard(estado)
        assert lb[0]["puntos"] == 10
        assert lb[1]["puntos"] == 5
        assert lb[2]["puntos"] == 3

    def test_avanzar_fase_al_vaciar_mazo(self, engine, sala_con_jugadores):
        config = TimesUpConfig(cartas_por_jugador=1)
        estado = engine.inicializar(sala_con_jugadores, config)
        estado = engine.iniciar_turno(estado)

        # Adivinar todas las cartas
        while estado.mazo:
            carta_id = estado.mazo[0].id
            estado = engine.carta_adivinada(estado, carta_id)

        estado = engine.finalizar_turno(estado)
        assert estado.fase == FaseTimesUp.RONDA_2

    def test_juego_completo_tres_rondas(self, engine, sala_con_jugadores):
        """Test de integración: simula una partida completa hasta el final."""
        config = TimesUpConfig(cartas_por_jugador=1)
        estado = engine.inicializar(sala_con_jugadores, config)

        for _ in range(3):  # 3 rondas
            estado = engine.iniciar_turno(estado)
            while estado.mazo:
                carta_id = estado.mazo[0].id
                estado = engine.carta_adivinada(estado, carta_id)
            estado = engine.finalizar_turno(estado)

        # Después de 3 rondas, el juego debe haber terminado
        assert not estado.mazo
        lb = engine.leaderboard(estado)
        assert len(lb) == 3
