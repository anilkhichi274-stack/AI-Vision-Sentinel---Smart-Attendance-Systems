@echo off
title Facial Recognition Server
echo Starting Facial Recognition Server...
echo Make sure you have installed all requirements first!
echo.
python facial_recognition_server.py
if %errorlevel% neq 0 (
    echo.
    echo Error starting server! Check if Python is installed and requirements are met.
    echo Run: pip install -r requirements.txt
)
pause