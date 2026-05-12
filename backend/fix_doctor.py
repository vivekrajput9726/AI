import asyncio
from app.database.connection import connect_db, get_db

async def fix():
    await connect_db()
    db = get_db()
    result = await db.doctors.update_one(
        {"user_id": "6a0306935da7320b66535f0a"},
        {"$set": {"is_active": True, "is_verified": True, "name": "Dr. Sobha Jain"}}
    )
    print("Updated:", result.modified_count)
    doctor = await db.doctors.find_one({"user_id": "6a0306935da7320b66535f0a"})
    print("Doctor:", doctor.get("name"), "| active:", doctor.get("is_active"), "| verified:", doctor.get("is_verified"))

asyncio.run(fix())
