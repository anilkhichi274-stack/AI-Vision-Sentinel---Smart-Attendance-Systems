from flask import Flask, render_template, Response
import cv2
import numpy as np
import face_recognition
import pickle
import csv
import datetime
import pandas as pd
import os

#  App Setup and Data Loading 
app = Flask(__name__)

# Load known encodings and names
try:
    encodeListKnown, classNames = pickle.load(open("data.pkl", "rb"))
except FileNotFoundError:
    print("Error: data.pkl not found. Run train_faces.py first.")
    encodeListKnown, classNames = [], []

# Load student details from student_data.csv
try:
    # student_data.csv 
    student_data = pd.read_csv("student_data.csv")
    print("Student details loaded successfully.")
except FileNotFoundError:
    print("Error: student_data.csv not found.")

    student_data = pd.DataFrame({'ID': [], 'Name': [], 'Roll_Number': [], 'Branch': [], 'Year': []})
except Exception as e:
    print(f"Error loading student data: {e}")
    student_data = pd.DataFrame({'ID': [], 'Name': [], 'Roll_Number': [], 'Branch': [], 'Year': []})


# Global variable to track marked students for the current session
marked_students = set()

# Attendance marking function (Roll No., Branch, Year)
def markAttendance(name):
    if name in marked_students:
        return 

    # 'Name' column 
    student = student_data[student_data['Name'] == name]
    
    # N/A values default
    roll, branch, year = "N/A", "N/A", "N/A"
    
    if not student.empty:
        # 'student_data.csv' 
        roll = student.iloc[0]['Roll_Number']
        branch = student.iloc[0]['Branch']
        year = student.iloc[0]['Year']

    with open('attendance.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        now = datetime.datetime.now()
        date = now.strftime('%Y-%m-%d')
        time = now.strftime('%H:%M:%S')
        
        # Name, Roll_Number, Branch, Year, Date, Time
        writer.writerow([name, roll, branch, year, date, time])
    
    marked_students.add(name)
    print(f"Attendance marked and saved for: {name} ({roll})")
# Face Recognition and Frame Processing
def process_frame(frame):
    """Processes a single video frame for face recognition."""
    imgSmall = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    imgSmall = cv2.cvtColor(imgSmall, cv2.COLOR_BGR2RGB)

    facesCurFrame = face_recognition.face_locations(imgSmall)
    encodesCurFrame = face_recognition.face_encodings(imgSmall, facesCurFrame)

    for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
        matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        matchIndex = np.argmin(faceDis)
        
        y1, x2, y2, x1 = [v * 4 for v in faceLoc]
        
        name = "Unknown"
        color = (0, 0, 255) # Red

        if len(classNames) > matchIndex and faceDis[matchIndex] < 0.45:
            name = classNames[matchIndex]
            color = (0, 255, 0) # Green
            
            # Mark attendance if not already marked
            if name not in marked_students:
                markAttendance(name)
                display_text = f"{name} - ATTENDANCE MARKED"
            else:
                display_text = f"{name} - ALREADY MARKED"
        else:
            display_text = "Unknown Face"

        # Draw box and text on frame
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.rectangle(frame, (x1, y2 - 35), (x2, y2), color, cv2.FILLED)
        cv2.putText(frame, display_text, (x1 + 6, y2 - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        break # Process only one face per frame for simplicity
    
    return frame

# Video Streaming Generator 
def generate_frames():
    """Continuously captures frames, processes them, and yields JPEG bytes."""
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Process the frame for recognition and marking
        frame = process_frame(frame)
        
        # Encode the frame as JPEG 
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        # Stream the frame 
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    cap.release()

#  Flask Routes (Web Addresses) 

@app.route('/')
def index():
    """Jab user homepage (/) par jaata hai."""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Video stream ko browser par bhejta hai."""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/view_attendance')
def view_attendance():
    """Attendance sheet ko web table ke roop mein dikhata hai."""
    try:

        df = pd.read_csv('attendance.csv') 
        # Pandas DataFrame ko HTML table
        html_table = df.to_html(classes='table table-striped', index=False)
        return render_template('attendance.html', table=html_table)
    except FileNotFoundError:
        return "<h2>Attendance file not found!</h2><p>Please start the attendance system first.</p>"

    except pd.errors.ParserError:
        return "<h2>Error in reading Attendance file!</h2><p>The CSV file format is incorrect. Please check and fix attendance.csv header and data.</p>"
    except Exception as e:
        return f"<h2>An error occurred:</h2><p>{e}</p>"

if __name__ == '__main__':
    # Attendance.csv 
    attendance_path = 'attendance.csv'
    if not os.path.exists(attendance_path) or os.path.getsize(attendance_path) == 0:
        with open(attendance_path, 'w', newline='') as f:
            writer = csv.writer(f)
            # (New Header)
            writer.writerow(['Name', 'Roll_Number', 'Branch', 'Year', 'Date', 'Time'])
            
    app.run(host='0.0.0.0', debug=True, threaded=True) # Web server shuru karna