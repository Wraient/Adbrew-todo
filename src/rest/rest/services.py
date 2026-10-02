"""Every Mongo read/write lives here, so the views stay free of driver specifics."""
from datetime import datetime, timezone

COLLECTION = "todos"


def _serialize(document):
    """Turn a raw Mongo document into the JSON shape the frontend consumes."""
    # The client is not tz_aware, so pymongo hands back naive UTC datetimes.
    # Append Z explicitly so the ISO string isn't read as local time.
    return {
        "id": str(document["_id"]),
        "description": document["description"],
        "created_at": document["created_at"].isoformat() + "Z",
    }


def list_todos(db):
    """All todos, oldest first. ObjectIds increase monotonically, so this is
    insertion order."""
    return [_serialize(doc) for doc in db[COLLECTION].find().sort("_id", 1)]


def create_todo(db, description):
    document = {
        "description": description,
        "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
    }
    result = db[COLLECTION].insert_one(document)
    return _serialize({**document, "_id": result.inserted_id})