"""
MediVision AI Assistant v2.0 - MongoDB Atlas Database Connector
Handles diagnostic session history and patient records with graceful fallback.
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medivision_db")

DB_NAME = os.environ.get("MONGODB_DB_NAME", "medivision_db")
COLLECTION_NAME = "diagnostic_history"

db_client = None
diagnostic_collection = None
in_memory_history: List[Dict[str, Any]] = []

def init_db():
    global db_client, diagnostic_collection
    mongodb_uri = os.environ.get("MONGODB_URI")
    if mongodb_uri and not mongodb_uri.startswith("your_"):
        try:
            from pymongo import MongoClient
            db_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000)
            # Test connection
            db_client.admin.command('ping')
            db = db_client[DB_NAME]
            diagnostic_collection = db[COLLECTION_NAME]
            logger.info("Successfully connected to MongoDB Atlas!")
            return True
        except Exception as e:
            logger.warning(f"MongoDB Atlas connection failed: {e}. Falling back to in-memory history storage.")
            db_client = None
            diagnostic_collection = None
            return False
    else:
        logger.info("MONGODB_URI not provided or is placeholder. Running with in-memory storage fallback.")
        return False

def save_diagnostic_record(record: Dict[str, Any]) -> Dict[str, Any]:
    record_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "symptoms": record.get("symptoms", ""),
        "transcription": record.get("transcription", ""),
        "doctor_response": record.get("doctor_response", ""),
        "has_image": bool(record.get("has_image", False)),
        "created_at": datetime.utcnow()
    }
    
    if diagnostic_collection is not None:
        try:
            result = diagnostic_collection.insert_one(record_entry)
            record_entry["_id"] = str(result.inserted_id)
            logger.info("Saved diagnostic record to MongoDB Atlas.")
            return record_entry
        except Exception as e:
            logger.error(f"Error saving to MongoDB Atlas: {e}")

    in_memory_history.insert(0, record_entry)
    if len(in_memory_history) > 20:
        in_memory_history.pop()
    return record_entry

def get_diagnostic_history(limit: int = 10) -> List[Dict[str, Any]]:
    if diagnostic_collection is not None:
        try:
            records = list(diagnostic_collection.find().sort("created_at", -1).limit(limit))
            for r in records:
                r["_id"] = str(r["_id"])
                if isinstance(r.get("created_at"), datetime):
                    r["created_at"] = r["created_at"].isoformat()
            return records
        except Exception as e:
            logger.error(f"Error fetching from MongoDB Atlas: {e}")

    return in_memory_history[:limit]
