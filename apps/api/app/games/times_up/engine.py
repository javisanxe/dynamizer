import random
from app.models.juego import EstadoJuego, FaseTimesUp, Turno
from app.models.sala import Sala
from app.games.times_up.cards import get_default_cards
from app.games.times_up.config import TimesUpConfig


class TimesUpEngine:
    """
    Motor de juego para Times Up.

    Fases:
      Ronda 1 — describir con palabras (se pueden pasar cartas)
      Ronda 2 — una sola palabra (sin pasar)
      Ronda 3 — mímica (sin palabras)

    Al final de cada ronda el mazo se reinicia con todas las cartas.
    Las puntuaciones se acumulan entre rondas.
    """

    def inicializar(self, sala: Sala, config: TimesUpConfig = TimesUpConfig()) -> EstadoJuego:
        cartas = get_default_cards()
        n_cartas = config.cartas_por_jugador * len(sala.jugadores)
        mazo = random.sample(cartas, min(n_cartas, len(cartas)))

        orden = [j.id for j in sala.jugadores]
        random.shuffle(orden)

        return EstadoJuego(
            sala_id=sala.id,
            fase=FaseTimesUp.RONDA_1,
            orden_jugadores=orden,
            indice_turno=0,
            mazo=mazo,
            puntuaciones={j.id: 0 for j in sala.jugadores},
            ronda_puntuaciones={j.id: 0 for j in sala.jugadores},
        )

    def iniciar_turno(self, estado: EstadoJuego) -> EstadoJuego:
        jugador_id = estado.orden_jugadores[estado.indice_turno]
        estado.turno_actual = Turno(jugador_id=jugador_id, activo=True)
        return estado

    def carta_adivinada(self, estado: EstadoJuego, carta_id: str) -> EstadoJuego:
        turno = estado.turno_actual
        if not turno or not turno.activo:
            raise ValueError("No hay turno activo")

        carta = next((c for c in estado.mazo if c.id == carta_id), None)
        if not carta:
            raise ValueError(f"Carta {carta_id} no encontrada en el mazo")

        estado.mazo.remove(carta)
        carta.adivinada = True
        estado.descartadas.append(carta)
        turno.cartas_adivinadas.append(carta_id)

        jugador_id = turno.jugador_id
        estado.puntuaciones[jugador_id] = estado.puntuaciones.get(jugador_id, 0) + 1
        estado.ronda_puntuaciones[jugador_id] = estado.ronda_puntuaciones.get(jugador_id, 0) + 1

        return estado

    def carta_pasada(self, estado: EstadoJuego, carta_id: str) -> EstadoJuego:
        if estado.fase != FaseTimesUp.RONDA_1:
            raise ValueError("Solo se puede pasar en la ronda 1")

        turno = estado.turno_actual
        if not turno or not turno.activo:
            raise ValueError("No hay turno activo")

        carta = next((c for c in estado.mazo if c.id == carta_id), None)
        if not carta:
            raise ValueError(f"Carta {carta_id} no encontrada")

        estado.mazo.remove(carta)
        estado.mazo.append(carta)
        turno.cartas_pasadas.append(carta_id)
        return estado

    def finalizar_turno(self, estado: EstadoJuego) -> EstadoJuego:
        if estado.turno_actual:
            estado.turno_actual.activo = False

        if not estado.mazo:
            return self._avanzar_fase(estado)

        estado.indice_turno = (estado.indice_turno + 1) % len(estado.orden_jugadores)
        return estado

    def _avanzar_fase(self, estado: EstadoJuego) -> EstadoJuego:
        fases = [FaseTimesUp.RONDA_1, FaseTimesUp.RONDA_2, FaseTimesUp.RONDA_3]
        indice_actual = fases.index(estado.fase)

        if indice_actual >= len(fases) - 1:
            estado.turno_actual = None
            return estado

        for carta in estado.descartadas:
            carta.adivinada = False
        estado.mazo = estado.descartadas.copy()
        random.shuffle(estado.mazo)
        estado.descartadas = []
        estado.ronda_puntuaciones = {k: 0 for k in estado.puntuaciones}
        estado.fase = fases[indice_actual + 1]
        estado.indice_turno = 0
        return estado

    def siguiente_turno(self, estado: EstadoJuego) -> EstadoJuego:
        estado = self.finalizar_turno(estado)
        if estado.mazo:
            estado = self.iniciar_turno(estado)
        return estado

    def leaderboard(self, estado: EstadoJuego) -> list[dict]:
        return sorted(
            [{"jugador_id": k, "puntos": v} for k, v in estado.puntuaciones.items()],
            key=lambda x: x["puntos"],
            reverse=True,
        )
