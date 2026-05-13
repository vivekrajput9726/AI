from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.config.settings import settings
from app.database.connection import connect_db, disconnect_db
from app.routes import auth, users, doctors, appointments, ai_routes, admin, video, chat, health_records, prescription_ai, meetings, whatsapp, emergency, family, wellness, extras


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Healthcare API...")
    await connect_db()
    yield
    await disconnect_db()
    logger.info("AI Healthcare API stopped.")


app = FastAPI(
    title="AI Healthcare Platform API",
    description="Production-ready AI-powered healthcare platform with symptom analysis and doctor recommendations",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI Services"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(video.router, prefix="/api/video", tags=["Video Sessions"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(health_records.router, prefix="/api/health-records", tags=["Health Records"])
app.include_router(prescription_ai.router, prefix="/api/ai", tags=["AI Services"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Instant Meetings"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp Bot"])
app.include_router(emergency.router, prefix="/api/emergency", tags=["Emergency SOS"])
app.include_router(family.router, prefix="/api/family", tags=["Family Health"])
app.include_router(wellness.router, prefix="/api/wellness", tags=["Wellness"])
app.include_router(extras.router, prefix="/api/extras", tags=["Extras"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "app": settings.APP_NAME}


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to AI Healthcare Platform API", "docs": "/docs"}
