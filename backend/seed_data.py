"""
Seed script to populate the database with static doctors and an admin user.
Run: python seed_data.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aihealthcare")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

STATIC_DOCTORS = [
    {
        "name": "Dr. Arjun Sharma",
        "email": "arjun.sharma@aihealthcare.com",
        "specialization": "General Physician",
        "subspecialty": "Internal Medicine",
        "experience_years": 15,
        "qualification": "MBBS, MD (Internal Medicine)",
        "hospital": "Apollo Hospital",
        "location": "Mumbai, Maharashtra",
        "bio": "Dr. Arjun Sharma is a highly experienced general physician with 15 years of practice in internal medicine and preventive healthcare.",
        "consultation_fee": 500,
        "rating": 4.8,
        "total_reviews": 324,
        "profile_image": "https://randomuser.me/api/portraits/men/32.jpg",
        "languages": ["English", "Hindi", "Marathi"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Wednesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "09:00", "end_time": "13:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Priya Mehta",
        "email": "priya.mehta@aihealthcare.com",
        "specialization": "Cardiologist",
        "subspecialty": "Interventional Cardiology",
        "experience_years": 12,
        "qualification": "MBBS, MD, DM (Cardiology)",
        "hospital": "Fortis Healthcare",
        "location": "Delhi, NCR",
        "bio": "Dr. Priya Mehta specializes in interventional cardiology with expertise in complex cardiac interventions and heart failure management.",
        "consultation_fee": 1200,
        "rating": 4.9,
        "total_reviews": 512,
        "profile_image": "https://randomuser.me/api/portraits/women/44.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Tuesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Thursday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Saturday", "start_time": "09:00", "end_time": "14:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Rajesh Kumar",
        "email": "rajesh.kumar@aihealthcare.com",
        "specialization": "Neurologist",
        "subspecialty": "Epilepsy & Movement Disorders",
        "experience_years": 18,
        "qualification": "MBBS, MD, DM (Neurology)",
        "hospital": "AIIMS",
        "location": "Delhi, NCR",
        "bio": "Dr. Rajesh Kumar is a renowned neurologist specializing in epilepsy, Parkinson's disease, and other neurological disorders.",
        "consultation_fee": 1500,
        "rating": 4.9,
        "total_reviews": 689,
        "profile_image": "https://randomuser.me/api/portraits/men/45.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Monday", "start_time": "11:00", "end_time": "17:00", "is_available": True},
            {"day": "Wednesday", "start_time": "11:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Ananya Patel",
        "email": "ananya.patel@aihealthcare.com",
        "specialization": "Dermatologist",
        "subspecialty": "Cosmetic Dermatology",
        "experience_years": 8,
        "qualification": "MBBS, MD (Dermatology)",
        "hospital": "Skin Care Clinic",
        "location": "Ahmedabad, Gujarat",
        "bio": "Dr. Ananya Patel is a skilled dermatologist with expertise in both medical and cosmetic dermatology including acne, eczema, and skin cancer.",
        "consultation_fee": 800,
        "rating": 4.7,
        "total_reviews": 234,
        "profile_image": "https://randomuser.me/api/portraits/women/67.jpg",
        "languages": ["English", "Hindi", "Gujarati"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Tuesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Thursday", "start_time": "09:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Vikram Singh",
        "email": "vikram.singh@aihealthcare.com",
        "specialization": "Orthopedist",
        "subspecialty": "Joint Replacement Surgery",
        "experience_years": 20,
        "qualification": "MBBS, MS (Orthopaedics), Fellowship Joint Replacement",
        "hospital": "Max Healthcare",
        "location": "Gurugram, Haryana",
        "bio": "Dr. Vikram Singh is an orthopedic surgeon with 20 years of experience in joint replacement, sports medicine, and spine surgery.",
        "consultation_fee": 1000,
        "rating": 4.8,
        "total_reviews": 445,
        "profile_image": "https://randomuser.me/api/portraits/men/22.jpg",
        "languages": ["English", "Hindi", "Punjabi"],
        "availability": [
            {"day": "Monday", "start_time": "08:00", "end_time": "16:00", "is_available": True},
            {"day": "Wednesday", "start_time": "08:00", "end_time": "16:00", "is_available": True},
            {"day": "Friday", "start_time": "08:00", "end_time": "16:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Sunita Rao",
        "email": "sunita.rao@aihealthcare.com",
        "specialization": "Gynecologist",
        "subspecialty": "High-Risk Pregnancy",
        "experience_years": 14,
        "qualification": "MBBS, MD, DNB (Obstetrics & Gynaecology)",
        "hospital": "Rainbow Children's Hospital",
        "location": "Hyderabad, Telangana",
        "bio": "Dr. Sunita Rao is an expert gynecologist specializing in high-risk pregnancies, infertility treatment, and minimally invasive surgery.",
        "consultation_fee": 900,
        "rating": 4.9,
        "total_reviews": 567,
        "profile_image": "https://randomuser.me/api/portraits/women/33.jpg",
        "languages": ["English", "Hindi", "Telugu"],
        "availability": [
            {"day": "Tuesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Thursday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Saturday", "start_time": "09:00", "end_time": "13:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Mohammed Ali",
        "email": "mohammed.ali@aihealthcare.com",
        "specialization": "Pulmonologist",
        "subspecialty": "Sleep Medicine & Asthma",
        "experience_years": 10,
        "qualification": "MBBS, MD (Pulmonary Medicine)",
        "hospital": "Medanta Hospital",
        "location": "Lucknow, UP",
        "bio": "Dr. Mohammed Ali is a pulmonologist with expertise in asthma, COPD, sleep disorders, and critical care medicine.",
        "consultation_fee": 700,
        "rating": 4.6,
        "total_reviews": 189,
        "profile_image": "https://randomuser.me/api/portraits/men/56.jpg",
        "languages": ["English", "Hindi", "Urdu"],
        "availability": [
            {"day": "Monday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Wednesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Friday", "start_time": "10:00", "end_time": "15:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Kavita Nair",
        "email": "kavita.nair@aihealthcare.com",
        "specialization": "Psychiatrist",
        "subspecialty": "Depression & Anxiety Disorders",
        "experience_years": 11,
        "qualification": "MBBS, MD (Psychiatry)",
        "hospital": "NIMHANS",
        "location": "Bangalore, Karnataka",
        "bio": "Dr. Kavita Nair is a compassionate psychiatrist specializing in depression, anxiety, bipolar disorder, and addiction medicine.",
        "consultation_fee": 1000,
        "rating": 4.8,
        "total_reviews": 312,
        "profile_image": "https://randomuser.me/api/portraits/women/72.jpg",
        "languages": ["English", "Hindi", "Kannada", "Malayalam"],
        "availability": [
            {"day": "Tuesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Thursday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Saturday", "start_time": "10:00", "end_time": "14:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Suresh Gupta",
        "email": "suresh.gupta@aihealthcare.com",
        "specialization": "Gastroenterologist",
        "subspecialty": "Liver Disease",
        "experience_years": 16,
        "qualification": "MBBS, MD, DM (Gastroenterology)",
        "hospital": "PGIMER",
        "location": "Chandigarh, Punjab",
        "bio": "Dr. Suresh Gupta is a senior gastroenterologist with expertise in liver diseases, inflammatory bowel disease, and endoscopy.",
        "consultation_fee": 1100,
        "rating": 4.7,
        "total_reviews": 398,
        "profile_image": "https://randomuser.me/api/portraits/men/78.jpg",
        "languages": ["English", "Hindi", "Punjabi"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Thursday", "start_time": "09:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Ritu Agarwal",
        "email": "ritu.agarwal@aihealthcare.com",
        "specialization": "Endocrinologist",
        "subspecialty": "Diabetes & Thyroid Disorders",
        "experience_years": 9,
        "qualification": "MBBS, MD (Endocrinology)",
        "hospital": "Sir Ganga Ram Hospital",
        "location": "Delhi, NCR",
        "bio": "Dr. Ritu Agarwal is an endocrinologist specializing in diabetes management, thyroid disorders, and hormonal imbalances.",
        "consultation_fee": 900,
        "rating": 4.8,
        "total_reviews": 276,
        "profile_image": "https://randomuser.me/api/portraits/women/55.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Monday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Wednesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Friday", "start_time": "10:00", "end_time": "15:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Arun Mishra",
        "email": "arun.mishra@aihealthcare.com",
        "specialization": "ENT Specialist",
        "subspecialty": "Head & Neck Surgery",
        "experience_years": 13,
        "qualification": "MBBS, MS (ENT)",
        "hospital": "Safdarjung Hospital",
        "location": "Delhi, NCR",
        "bio": "Dr. Arun Mishra specializes in ear, nose, and throat disorders including hearing loss, sinusitis, and head & neck cancers.",
        "consultation_fee": 750,
        "rating": 4.6,
        "total_reviews": 213,
        "profile_image": "https://randomuser.me/api/portraits/men/88.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Tuesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "09:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Meera Krishnan",
        "email": "meera.krishnan@aihealthcare.com",
        "specialization": "Ophthalmologist",
        "subspecialty": "Retinal Surgery",
        "experience_years": 17,
        "qualification": "MBBS, MS (Ophthalmology), FRCS",
        "hospital": "Aravind Eye Hospital",
        "location": "Chennai, Tamil Nadu",
        "bio": "Dr. Meera Krishnan is a leading ophthalmologist with expertise in retinal diseases, cataract surgery, and LASIK procedures.",
        "consultation_fee": 850,
        "rating": 4.9,
        "total_reviews": 534,
        "profile_image": "https://randomuser.me/api/portraits/women/92.jpg",
        "languages": ["English", "Tamil", "Hindi"],
        "availability": [
            {"day": "Monday", "start_time": "08:00", "end_time": "16:00", "is_available": True},
            {"day": "Wednesday", "start_time": "08:00", "end_time": "16:00", "is_available": True},
            {"day": "Saturday", "start_time": "08:00", "end_time": "12:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Alok Tiwari",
        "email": "alok.tiwari@aihealthcare.com",
        "specialization": "Urologist",
        "subspecialty": "Uro-oncology",
        "experience_years": 14,
        "qualification": "MBBS, MS, MCh (Urology)",
        "hospital": "Tata Memorial Hospital",
        "location": "Mumbai, Maharashtra",
        "bio": "Dr. Alok Tiwari is a urologist specializing in urological cancers, kidney stones, and robotic surgery.",
        "consultation_fee": 1200,
        "rating": 4.7,
        "total_reviews": 287,
        "profile_image": "https://randomuser.me/api/portraits/men/64.jpg",
        "languages": ["English", "Hindi", "Marathi"],
        "availability": [
            {"day": "Tuesday", "start_time": "10:00", "end_time": "17:00", "is_available": True},
            {"day": "Thursday", "start_time": "10:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Pooja Desai",
        "email": "pooja.desai@aihealthcare.com",
        "specialization": "Pediatrician",
        "subspecialty": "Neonatology",
        "experience_years": 12,
        "qualification": "MBBS, MD (Pediatrics), Fellowship Neonatology",
        "hospital": "KEM Hospital",
        "location": "Mumbai, Maharashtra",
        "bio": "Dr. Pooja Desai is a dedicated pediatrician specializing in newborn care, childhood diseases, and developmental disorders.",
        "consultation_fee": 700,
        "rating": 4.9,
        "total_reviews": 621,
        "profile_image": "https://randomuser.me/api/portraits/women/28.jpg",
        "languages": ["English", "Hindi", "Gujarati", "Marathi"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Wednesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "09:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Kiran Reddy",
        "email": "kiran.reddy@aihealthcare.com",
        "specialization": "General Physician",
        "subspecialty": "Preventive Medicine",
        "experience_years": 7,
        "qualification": "MBBS, DNB (Family Medicine)",
        "hospital": "Columbia Asia Hospital",
        "location": "Bangalore, Karnataka",
        "bio": "Dr. Kiran Reddy focuses on preventive medicine, lifestyle diseases, and chronic disease management.",
        "consultation_fee": 450,
        "rating": 4.5,
        "total_reviews": 142,
        "profile_image": "https://randomuser.me/api/portraits/men/34.jpg",
        "languages": ["English", "Hindi", "Telugu", "Kannada"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Tuesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Thursday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "09:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Shobha Jain",
        "email": "shobha.jain@aihealthcare.com",
        "specialization": "Cardiologist",
        "subspecialty": "Preventive Cardiology",
        "experience_years": 22,
        "qualification": "MBBS, MD, DM (Cardiology), FACC",
        "hospital": "Escorts Heart Institute",
        "location": "Delhi, NCR",
        "bio": "Dr. Shobha Jain is a senior cardiologist with 22 years of experience in preventive cardiology, heart failure, and electrophysiology.",
        "consultation_fee": 1500,
        "rating": 4.9,
        "total_reviews": 789,
        "profile_image": "https://randomuser.me/api/portraits/women/38.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Tuesday", "start_time": "10:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "10:00", "end_time": "17:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Sanjay Malhotra",
        "email": "sanjay.malhotra@aihealthcare.com",
        "specialization": "Neurologist",
        "subspecialty": "Stroke & Migraine",
        "experience_years": 11,
        "qualification": "MBBS, MD, DM (Neurology)",
        "hospital": "Manipal Hospital",
        "location": "Bangalore, Karnataka",
        "bio": "Dr. Sanjay Malhotra specializes in stroke management, migraine treatment, and neuro-rehabilitation.",
        "consultation_fee": 1200,
        "rating": 4.7,
        "total_reviews": 345,
        "profile_image": "https://randomuser.me/api/portraits/men/42.jpg",
        "languages": ["English", "Hindi", "Kannada"],
        "availability": [
            {"day": "Monday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Thursday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Saturday", "start_time": "10:00", "end_time": "14:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Nisha Bhatt",
        "email": "nisha.bhatt@aihealthcare.com",
        "specialization": "Psychiatrist",
        "subspecialty": "Child & Adolescent Psychiatry",
        "experience_years": 8,
        "qualification": "MBBS, MD (Psychiatry)",
        "hospital": "NIMHANS",
        "location": "Bangalore, Karnataka",
        "bio": "Dr. Nisha Bhatt specializes in child and adolescent mental health, ADHD, autism spectrum disorders, and family therapy.",
        "consultation_fee": 1000,
        "rating": 4.8,
        "total_reviews": 198,
        "profile_image": "https://randomuser.me/api/portraits/women/50.jpg",
        "languages": ["English", "Hindi", "Kannada", "Bengali"],
        "availability": [
            {"day": "Wednesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Friday", "start_time": "10:00", "end_time": "18:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Ramesh Pillai",
        "email": "ramesh.pillai@aihealthcare.com",
        "specialization": "Gastroenterologist",
        "subspecialty": "Inflammatory Bowel Disease",
        "experience_years": 19,
        "qualification": "MBBS, MD, DM (Gastroenterology), FACG",
        "hospital": "Amrita Institute of Medical Sciences",
        "location": "Kochi, Kerala",
        "bio": "Dr. Ramesh Pillai is a gastroenterologist with expertise in IBD, hepatology, and therapeutic endoscopy.",
        "consultation_fee": 1000,
        "rating": 4.8,
        "total_reviews": 423,
        "profile_image": "https://randomuser.me/api/portraits/men/74.jpg",
        "languages": ["English", "Malayalam", "Hindi"],
        "availability": [
            {"day": "Monday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Wednesday", "start_time": "09:00", "end_time": "17:00", "is_available": True},
            {"day": "Friday", "start_time": "09:00", "end_time": "13:00", "is_available": True}
        ]
    },
    {
        "name": "Dr. Anjali Verma",
        "email": "anjali.verma@aihealthcare.com",
        "specialization": "Endocrinologist",
        "subspecialty": "Obesity & Metabolic Disorders",
        "experience_years": 6,
        "qualification": "MBBS, MD (Endocrinology)",
        "hospital": "BLK Super Speciality Hospital",
        "location": "Delhi, NCR",
        "bio": "Dr. Anjali Verma is an endocrinologist focused on obesity management, PCOS, metabolic syndrome, and hormonal disorders.",
        "consultation_fee": 800,
        "rating": 4.6,
        "total_reviews": 167,
        "profile_image": "https://randomuser.me/api/portraits/women/84.jpg",
        "languages": ["English", "Hindi"],
        "availability": [
            {"day": "Tuesday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Thursday", "start_time": "10:00", "end_time": "18:00", "is_available": True},
            {"day": "Saturday", "start_time": "10:00", "end_time": "14:00", "is_available": True}
        ]
    }
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    print("🌱 Seeding database...")

    # Create admin user
    existing_admin = await db.users.find_one({"email": "admin@aihealthcare.com"})
    if not existing_admin:
        admin_doc = {
            "full_name": "System Admin",
            "email": "admin@aihealthcare.com",
            "password_hash": pwd_context.hash("Admin@123"),
            "role": "admin",
            "phone": "+91-9999999999",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_doc)
        print("✅ Admin user created: admin@aihealthcare.com / Admin@123")
    else:
        print("ℹ️  Admin user already exists")

    # Seed static doctors
    seeded = 0
    for doc_data in STATIC_DOCTORS:
        existing = await db.doctors.find_one({"email": doc_data["email"]})
        if not existing:
            doc_data["user_id"] = None
            doc_data["is_verified"] = True
            doc_data["is_active"] = True
            doc_data["is_static"] = True
            doc_data["created_at"] = datetime.utcnow()
            doc_data["updated_at"] = datetime.utcnow()
            await db.doctors.insert_one(doc_data)
            seeded += 1

    print(f"✅ Seeded {seeded} doctors (skipped {len(STATIC_DOCTORS) - seeded} existing)")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.doctors.create_index("email", unique=True)
    await db.doctors.create_index("specialization")
    await db.appointments.create_index("patient_id")
    await db.appointments.create_index("doctor_id")
    await db.medical_reports.create_index("patient_id")

    print("✅ Database indexes created")
    print("\n🎉 Database seeded successfully!")
    print("\n📋 Test Credentials:")
    print("   Admin: admin@aihealthcare.com / Admin@123")
    print("   Register as Patient or Doctor to test other roles")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
