from app.models.juego import Carta

DEFAULT_CARDS: list[dict] = [
    {"id": "1",  "texto": "Albert Einstein",    "categoria": "ciencia"},
    {"id": "2",  "texto": "Cleopatra",           "categoria": "historia"},
    {"id": "3",  "texto": "Harry Potter",        "categoria": "ficcion"},
    {"id": "4",  "texto": "Lionel Messi",        "categoria": "deporte"},
    {"id": "5",  "texto": "La Mona Lisa",        "categoria": "arte"},
    {"id": "6",  "texto": "Indiana Jones",       "categoria": "ficcion"},
    {"id": "7",  "texto": "Marie Curie",         "categoria": "ciencia"},
    {"id": "8",  "texto": "Napoleón Bonaparte",  "categoria": "historia"},
    {"id": "9",  "texto": "Darth Vader",         "categoria": "ficcion"},
    {"id": "10", "texto": "Cristiano Ronaldo",   "categoria": "deporte"},
    {"id": "11", "texto": "La Torre Eiffel",     "categoria": "lugares"},
    {"id": "12", "texto": "Shakespeare",         "categoria": "literatura"},
    {"id": "13", "texto": "Superman",            "categoria": "ficcion"},
    {"id": "14", "texto": "Leonardo da Vinci",  "categoria": "arte"},
    {"id": "15", "texto": "Freddie Mercury",     "categoria": "musica"},
    {"id": "16", "texto": "Sherlock Holmes",     "categoria": "literatura"},
    {"id": "17", "texto": "Michael Jordan",      "categoria": "deporte"},
    {"id": "18", "texto": "Marilyn Monroe",      "categoria": "cine"},
    {"id": "19", "texto": "El Quijote",          "categoria": "literatura"},
    {"id": "20", "texto": "Nikola Tesla",        "categoria": "ciencia"},
]


def get_default_cards() -> list[Carta]:
    return [Carta(**c) for c in DEFAULT_CARDS]
