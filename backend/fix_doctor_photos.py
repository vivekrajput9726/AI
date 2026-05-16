"""
Migration: Ensure all 20 doctors have the correct gender-matched profile photo.
Male names → randomuser.me/men portraits
Female names → randomuser.me/women portraits

Run: python fix_doctor_photos.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL   = os.getenv("MONGODB_URL",   "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aihealthcare")

# email → correct profile_image (gender-matched)
CORRECT_PHOTOS = {
    # ── Male doctors ──────────────────────────────────────────────
    "arjun.sharma@aihealthcare.com":    "https://randomuser.me/api/portraits/men/32.jpg",
    "rajesh.kumar@aihealthcare.com":    "https://randomuser.me/api/portraits/men/45.jpg",
    "vikram.singh@aihealthcare.com":    "https://randomuser.me/api/portraits/men/22.jpg",
    "mohammed.ali@aihealthcare.com":    "https://randomuser.me/api/portraits/men/56.jpg",
    "suresh.gupta@aihealthcare.com":    "https://randomuser.me/api/portraits/men/78.jpg",
    "arun.mishra@aihealthcare.com":     "https://randomuser.me/api/portraits/men/88.jpg",
    "alok.tiwari@aihealthcare.com":     "https://randomuser.me/api/portraits/men/64.jpg",
    "kiran.reddy@aihealthcare.com":     "https://randomuser.me/api/portraits/men/34.jpg",
    "sanjay.malhotra@aihealthcare.com": "https://randomuser.me/api/portraits/men/42.jpg",
    "ramesh.pillai@aihealthcare.com":   "https://randomuser.me/api/portraits/men/74.jpg",

    # ── Female doctors ────────────────────────────────────────────
    "priya.mehta@aihealthcare.com":     "https://randomuser.me/api/portraits/women/44.jpg",
    "ananya.patel@aihealthcare.com":    "https://randomuser.me/api/portraits/women/67.jpg",
    "sunita.rao@aihealthcare.com":      "https://randomuser.me/api/portraits/women/33.jpg",
    "kavita.nair@aihealthcare.com":     "https://randomuser.me/api/portraits/women/72.jpg",
    "ritu.agarwal@aihealthcare.com":    "https://randomuser.me/api/portraits/women/55.jpg",
    "meera.krishnan@aihealthcare.com":  "https://randomuser.me/api/portraits/women/92.jpg",
    "pooja.desai@aihealthcare.com":     "https://randomuser.me/api/portraits/women/28.jpg",
    "shobha.jain@aihealthcare.com":     "https://randomuser.me/api/portraits/women/38.jpg",
    "nisha.bhatt@aihealthcare.com":     "https://randomuser.me/api/portraits/women/50.jpg",
    "anjali.verma@aihealthcare.com":    "https://randomuser.me/api/portraits/women/84.jpg",
}

# Female first-name list to auto-detect any untracked doctors
FEMALE_NAMES = {
    "priya","ananya","sunita","kavita","ritu","meera","pooja","shobha",
    "nisha","anjali","neha","aarti","rekha","deepa","seema","geeta",
    "sonia","swati","divya","radha","maya","lata","usha","asha","puja",
    "nina","rina","tina","lina","mina","kiran","rani","devi","shruti",
    "smita","sneh","hema","sita","gita",
}


def gender_photo(name: str, idx: int) -> str:
    """Fallback: derive photo from first name when email not in CORRECT_PHOTOS."""
    first = name.lower().replace("dr.", "").strip().split()[0]
    if first in FEMALE_NAMES:
        return f"https://randomuser.me/api/portraits/women/{20 + (idx % 80)}.jpg"
    return f"https://randomuser.me/api/portraits/men/{20 + (idx % 80)}.jpg"


async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    doctors = await db.doctors.find({}).to_list(length=None)
    print(f"Found {len(doctors)} doctors\n")

    updated = skipped = 0
    for i, doc in enumerate(doctors):
        email        = doc.get("email", "")
        current_img  = doc.get("profile_image", "")
        correct_img  = CORRECT_PHOTOS.get(email) or gender_photo(doc.get("name", ""), i)

        if current_img == correct_img:
            print(f"  [OK]      {doc.get('name')} — photo already correct")
            skipped += 1
        else:
            await db.doctors.update_one(
                {"_id": doc["_id"]},
                {"$set": {"profile_image": correct_img}}
            )
            gender = "♂ male" if "/men/" in correct_img else "♀ female"
            print(f"  [FIXED]   {doc.get('name')} — {gender} photo applied")
            updated += 1

    print(f"\n{'='*50}")
    print(f"Done — Fixed: {updated} | Already correct: {skipped}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
