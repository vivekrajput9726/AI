from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.jwt_utils import decode_token
from app.database.connection import get_db
from app.utils.helpers import str_to_objectid, serialize_doc

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    db = get_db()
    try:
        user = await db.users.find_one({"_id": str_to_objectid(user_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.get("is_active"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return serialize_doc(user)


async def require_patient(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["patient", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    return current_user


async def require_doctor(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
