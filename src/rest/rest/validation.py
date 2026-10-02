MAX_LENGTH = 280


def parse_todo(data):
    """Validate a request body and return the cleaned description.

    Raises ValueError with a message that is safe to hand back to the client.
    """
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")

    description = data.get("description")
    if not isinstance(description, str):
        raise ValueError("'description' is required and must be a string")

    description = description.strip()
    if not description:
        raise ValueError("'description' must not be empty")
    if len(description) > MAX_LENGTH:
        raise ValueError(f"'description' must be at most {MAX_LENGTH} characters")

    return description