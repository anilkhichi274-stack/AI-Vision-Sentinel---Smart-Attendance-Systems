#!/usr/bin/env python3
import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    print("Installing required packages...")
    
    requirements = [
        "opencv-python==4.8.1.78",
        "face-recognition==1.3.0",
        "numpy==1.24.3",
        "flask==2.3.3",
        "flask-cors==4.0.0",
        "pillow==10.0.0",
        "python-dotenv==1.0.0",
        "mysql-connector-python==8.1.0"
    ]
    
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"✗ Failed to install {package}")
            return False
    
    return True

def create_directories():
    """Create necessary directories"""
    directories = [
        'student_photos',
        'logs',
        'exports'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✓ Created directory: {directory}")

def check_dependencies():
    """Check if all dependencies are available"""
    try:
        import cv2
        import face_recognition
        import flask
        import mysql.connector
        print("✓ All dependencies are available")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        return False

if __name__ == "__main__":
    print("Setting up Facial Recognition System...")
    print("=" * 50)
    
    if install_requirements():
        create_directories()
        if check_dependencies():
            print("\n🎉 Setup completed successfully!")
            print("\nNext steps:")
            print("1. Start the Python server: python facial_recognition_server.py")
            print("2. Ensure your web server can connect to localhost:5000")
            print("3. Add students with photos through the dashboard")
            print("4. Start taking attendance with facial recognition!")
        else:
            print("\n❌ Setup failed: Dependencies missing")
    else:
        print("\n❌ Setup failed: Could not install requirements")