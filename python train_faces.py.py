import cv2
import face_recognition
import os
import pickle

path = 'dataset'
images = []
names = []

for folder in os.listdir(path):
    imgFolder = os.path.join(path, folder)
    for file in os.listdir(imgFolder):
        curImg = cv2.imread(os.path.join(imgFolder, file))
        if curImg is not None:
            images.append(curImg)
            names.append(folder)

def findEncodings(images):
    encodeList = []
    for img in images:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encode = face_recognition.face_encodings(img)[0]
        encodeList.append(encode)
    return encodeList

encodeListKnown = findEncodings(images)
pickle.dump((encodeListKnown, names), open("data.pkl", "wb"))
print(" Training completed and encodings saved.")
