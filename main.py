import cv2
import numpy as np
import face_recognition
import pickle
import csv
import datetime
import pyttsx3
import pandas as pd

# Load known encodings and names
encodeListKnown, classNames = pickle.load(open("data.pkl", "rb"))

# Load student details
student_data = pd.read_csv("student_data.csv")

# Text-to-speech setup
engine = pyttsx3.init()
engine.setProperty('rate', 160)

def speak(text):
    engine.say(text)
    engine.runAndWait()

# Attendance marking function
def markAttendance(name):
    student = student_data[student_data['Name'] == name]

    if not student.empty:
        roll = student.iloc[0]['Roll_No']
        branch = student.iloc[0]['Branch']
        year = student.iloc[0]['Year']
    else:
        roll, branch, year = "N/A", "N/A", "N/A"

    with open('attendance.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        now = datetime.datetime.now()
        date = now.strftime('%Y-%m-%d')
        time = now.strftime('%H:%M:%S')
        writer.writerow([name, roll, branch, year, date, time])

# Open camera
cap = cv2.VideoCapture(0)
marked = []

print("Camera started... Press 'Q' to exit")

while True:
    ret, frame = cap.read()
    imgSmall = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    imgSmall = cv2.cvtColor(imgSmall, cv2.COLOR_BGR2RGB)

    facesCurFrame = face_recognition.face_locations(imgSmall)
    encodesCurFrame = face_recognition.face_encodings(imgSmall, facesCurFrame)

    for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
        matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        matchIndex = np.argmin(faceDis)

        y1, x2, y2, x1 = [v * 4 for v in faceLoc]

        if faceDis[matchIndex] < 0.45:
            name = classNames[matchIndex]
            color = (0, 255, 0)
            if name not in marked:
                markAttendance(name)
                speak(f"{name}, your attendance is marked.")
                marked.append(name)
        else:
            name = "Unknown"
            color = (0, 0, 255)

        # Show name only on screen
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.rectangle(frame, (x1, y2 - 35), (x2, y2), color, cv2.FILLED)
        cv2.putText(frame, name, (x1 + 6, y2 - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    cv2.imshow('Smart Attendance System', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
