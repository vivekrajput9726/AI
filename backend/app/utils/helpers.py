from bson import ObjectId
from datetime import datetime
from typing import Any, Dict


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result["id" if key == "_id" else key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(v) if isinstance(v, dict) else (str(v) if isinstance(v, ObjectId) else v) for v in value]
        else:
            result[key] = value
    return result


def paginate_query(page: int = 1, limit: int = 10):
    skip = (page - 1) * limit
    return skip, limit


def str_to_objectid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid ID format: {id_str}")
