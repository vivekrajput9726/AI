import asyncio
from app.database.connection import connect_db, get_db
from datetime import datetime

async def fix():
    await connect_db()
    db = get_db()

    # Activate and verify ALL users
    result = await db.users.update_many(
        {"is_active": {"$ne": True}},
        {"$set": {"is_active": True, "is_verified": True, "updated_at": datetime.now()}}
    )
    print(f"Activated {result.modified_count} accounts")

    # Also verify any unverified ones
    result2 = await db.users.update_many(
        {"is_verified": {"$ne": True}},
        {"$set": {"is_verified": True, "updated_at": datetime.now()}}
    )
    print(f"Verified {result2.modified_count} accounts")

    print("\nAll users after fix:")
    async for u in db.users.find({}, {"email":1,"is_active":1,"is_verified":1,"role":1}):
        print(f"  {u['email']} | role={u['role']} | active={u.get('is_active')} | verified={u.get('is_verified')}")

asyncio.run(fix())
