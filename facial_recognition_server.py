import os
import cv2
import face_recognition
import numpy as np
import base64
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import mysql.connector
from datetime import datetime
import logging

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app
app = Flask(__name__)
CORS(app)

# ---------------------------
# HOME ROUTE (404 FIX)
# ---------------------------
@app.route("/")
def home():
    return "Face Recognition Attendance Server Running"

# Database config
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'mark_db'
}

# ------------------------------------------------------------
# FACE RECOGNITION CLASS
# ------------------------------------------------------------

class FaceRecognitionSystem:

    def __init__(self):
        self.known_face_encodings = []
        self.known_face_ids = []
        self.known_face_data = []
        self.load_known_faces()

    def load_known_faces(self):
        """Load all faces from database"""
        try:
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT id, enrollment_no, name, year, semester, branch, photo_path 
                FROM students
                WHERE photo_path IS NOT NULL AND photo_path != ''
            """)

            students = cursor.fetchall()

            self.known_face_encodings = []
            self.known_face_ids = []
            self.known_face_data = []

            for student in students:
                path = student["photo_path"]

                if os.path.exists(path):
                    try:
                        img = face_recognition.load_image_file(path)
                        enc = face_recognition.face_encodings(img)

                        if len(enc) > 0:
                            self.known_face_encodings.append(enc[0])
                            self.known_face_ids.append(student["id"])
                            self.known_face_data.append(student)
                            logger.info(f"Loaded: {student['name']}")
                        else:
                            logger.warning(f"No face detected: {path}")

                    except Exception as e:
                        logger.error(f"Error loading {path}: {str(e)}")
                else:
                    logger.warning(f"Image missing: {path}")

            cursor.close()
            conn.close()

            logger.info(f"Total loaded faces: {len(self.known_face_encodings)}")

        except Exception as e:
            logger.error(f"Database error: {str(e)}")

    # ------------------------------------------------------------

    def recognize_face(self, image_data, year_sem=None):
        """Recognize face from image"""

        try:
            if "," in image_data:
                image_data = image_data.split(",")[1]

            img_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_np = np.array(image)

            # Detect faces
            locations = face_recognition.face_locations(img_np)
            encodings = face_recognition.face_encodings(img_np, locations)

            if len(encodings) == 0:
                return {"success": False, "message": "No face detected"}

            face_enc = encodings[0]

            # Compare
            matches = face_recognition.compare_faces(self.known_face_encodings, face_enc)
            distances = face_recognition.face_distance(self.known_face_encodings, face_enc)

            best_match = np.argmin(distances)

            if matches[best_match]:
                student = self.known_face_data[best_match]
                return {
                    "success": True,
                    "student": student
                }

            return {"success": False, "message": "Face not matched"}

        except Exception as e:
            return {"success": False, "message": str(e)}

# ------------------------------------------------------------
# Initiate system
# ------------------------------------------------------------

face_sys = FaceRecognitionSystem()

# ------------------------------------------------------------
# API ROUTES
# ------------------------------------------------------------

@app.route("/recognize", methods=["POST"])
def recognize():
    try:
        data = request.json
        image_data = data.get("image")

        if not image_data:
            return jsonify({"success": False, "message": "Image missing"})

        result = face_sys.recognize_face(image_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ------------------------------------------------------------
# SAVE ATTENDANCE
# ------------------------------------------------------------

@app.route("/save-attendance", methods=["POST"])
def attendance():
    try:
        data = request.json
        student_id = data["student_id"]
        subject = data["subject"]

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO attendance(student_id, subject, timestamp)
            VALUES (%s, %s, %s)
        """, (student_id, subject, datetime.now()))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Attendance Saved"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ------------------------------------------------------------
# RUN SERVER
# ------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
