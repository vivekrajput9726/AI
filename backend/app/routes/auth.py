from fastapi import APIRouter
from app.schemas.user_schema import UserRegisterRequest, UserLoginRequest, RefreshTokenRequest
from app.services.auth_service import register_user, login_user, refresh_access_token

router = APIRouter()


@router.post("/register", summary="Register a new user")
async def register(data: UserRegisterRequest):
    return await register_user(data)


@router.post("/login", summary="Login user")
async def login(data: UserLoginRequest):
    return await login_user(data)


@router.post("/refresh", summary="Refresh access token")
async def refresh(data: RefreshTokenRequest):
    return await refresh_access_token(data.refresh_token)
