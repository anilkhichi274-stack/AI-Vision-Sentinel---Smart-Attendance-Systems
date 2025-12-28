import customtkinter as ctk
import subprocess
import os
from PIL import Image, ImageTk

# Window Setup
app = ctk.CTk()
app.title("Smart Attendance System")
app.geometry("700x500")
app.resizable(False, False)
ctk.set_appearance_mode("dark")  

# Background Image
try:
    bg_image = Image.open("background.jpg")  
    bg_image = bg_image.resize((700, 500))
    bg_photo = ImageTk.PhotoImage(bg_image)
    bg_label = ctk.CTkLabel(app, image=bg_photo, text="")
    bg_label.place(x=0, y=0, relwidth=1, relheight=1)
except:
    app.configure(fg_color="#0b132b")

# Title and Tagline
title = ctk.CTkLabel(app, text="SMART ATTENDANCE SYSTEM", font=("Arial Rounded MT Bold", 24, "bold"), text_color="#00ffff")
title.pack(pady=(30, 10))

tagline = ctk.CTkLabel(app, text="Face Recognition Based Automated Attendance", font=("Arial", 14), text_color="#ffffff")
tagline.pack()
# Button Functions
def start_attendance():
    subprocess.Popen(["python", "main.py"])

def open_csv():
    if os.path.exists("attendance.csv"):
        os.startfile("attendance.csv")
    else:
        ctk.CTkMessagebox(title="Error", message="Attendance file not found!")
def about_project():
    ctk.CTkMessagebox(title="About", message="Developed by Anil Khichi\nAI & DS Department\nSmart Face Attendance System")
# Buttons
frame = ctk.CTkFrame(app, fg_color=("gray10", "gray20"), corner_radius=20)
frame.pack(pady=40, padx=40, fill="both", expand=False)

start_btn = ctk.CTkButton(frame, text=" Start Attendance", command=start_attendance, width=240, height=45, fg_color="#00bfff", hover_color="#0080ff", font=("Arial", 16, "bold"))
start_btn.pack(pady=20)

view_btn = ctk.CTkButton(frame, text=" Show Attendance Sheet", command=open_csv, width=240, height=45, fg_color="#00bfff", hover_color="#0080ff", font=("Arial", 16, "bold"))
view_btn.pack(pady=10)

about_btn = ctk.CTkButton(frame, text="About Project", command=about_project, width=240, height=40, fg_color="#00bfff", hover_color="#0080ff", font=("Arial", 15))
about_btn.pack(pady=10)

exit_btn = ctk.CTkButton(frame, text=" Exit", command=app.destroy, width=240, height=45, fg_color="red", hover_color="#b30000", font=("Arial", 16, "bold"))
exit_btn.pack(pady=20)

footer = ctk.CTkLabel(app, text="© 2025 Smart Attendance Project | Powered by Python", font=("Arial", 12), text_color="gray")
footer.pack(side="bottom", pady=10)
app.mainloop()
