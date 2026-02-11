"""
Test script to verify MongoDB Atlas connection and collection creation.
Run this to test if face_embeddings and face_registration_logs collections work.
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
print(f"MongoDB URI found: {MONGODB_URI is not None}")

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client["kapit-bisig"]

print("\n=== BEFORE TEST ===")
print(f"Collections: {db.list_collection_names()}")

# Test 1: Insert into face_embeddings
print("\n--- Test 1: Inserting into face_embeddings ---")
test_embedding = {
    "resident_id": f"TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "first_name": "Test",
    "last_name": "User",
    "name": "Test User",
    "date_of_birth": "2000-01-01",
    "gender": "Male",
    "mobile_number": "09123456789",
    "barangay": "San Jose",
    "street_address": "123 Test Street",
    "embedding_vector": [0.1, 0.2, 0.3] * 42 + [0.1, 0.2],  # 128-dim vector
    "face_image_path": "test",
    "created_at": datetime.now()
}
result1 = db.face_embeddings.insert_one(test_embedding)
print(f"Inserted face_embeddings doc ID: {result1.inserted_id}")

# Test 2: Insert into face_registration_logs
print("\n--- Test 2: Inserting into face_registration_logs ---")
test_log = {
    "timestamp": datetime.now().isoformat(),
    "face_detected": True,
    "decision": "ALLOW",
    "similarity": 0.0,
    "threshold": 0.70,
    "best_match_name": "None",
    "best_match_id": None,
    "message": "Test log entry",
    "processing_time_ms": 100,
    "resident_data": {"firstName": "Test", "lastName": "User"}
}
result2 = db.face_registration_logs.insert_one(test_log)
print(f"Inserted face_registration_logs doc ID: {result2.inserted_id}")

print("\n=== AFTER TEST ===")
print(f"Collections: {db.list_collection_names()}")

# Verify
print("\n=== VERIFICATION ===")
face_count = db.face_embeddings.count_documents({})
log_count = db.face_registration_logs.count_documents({})
print(f"face_embeddings count: {face_count}")
print(f"face_registration_logs count: {log_count}")

print("\n✅ Test complete! Check MongoDB Atlas - new collections should be visible.")
print("   Refresh the MongoDB Compass or Atlas UI to see: face_embeddings, face_registration_logs")
