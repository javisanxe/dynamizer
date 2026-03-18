from app.models.game import Card

DEFAULT_CARDS: list[dict] = [
    {"id": "1",  "text": "Albert Einstein",    "category": "science"},
    {"id": "2",  "text": "Cleopatra",           "category": "history"},
    {"id": "3",  "text": "Harry Potter",        "category": "fiction"},
    {"id": "4",  "text": "Lionel Messi",        "category": "sport"},
    {"id": "5",  "text": "Mona Lisa",           "category": "art"},
    {"id": "6",  "text": "Indiana Jones",       "category": "fiction"},
    {"id": "7",  "text": "Marie Curie",         "category": "science"},
    {"id": "8",  "text": "Napoleon Bonaparte",  "category": "history"},
    {"id": "9",  "text": "Darth Vader",         "category": "fiction"},
    {"id": "10", "text": "Cristiano Ronaldo",   "category": "sport"},
    {"id": "11", "text": "The Eiffel Tower",    "category": "places"},
    {"id": "12", "text": "Shakespeare",         "category": "literature"},
    {"id": "13", "text": "Superman",            "category": "fiction"},
    {"id": "14", "text": "Leonardo da Vinci",  "category": "art"},
    {"id": "15", "text": "Freddie Mercury",     "category": "music"},
    {"id": "16", "text": "Sherlock Holmes",     "category": "literature"},
    {"id": "17", "text": "Michael Jordan",      "category": "sport"},
    {"id": "18", "text": "Marilyn Monroe",      "category": "film"},
    {"id": "19", "text": "Don Quixote",         "category": "literature"},
    {"id": "20", "text": "Nikola Tesla",        "category": "science"},
]


def get_default_cards() -> list[Card]:
    return [Card(**c) for c in DEFAULT_CARDS]
