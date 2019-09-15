from flask import Flask, jsonify, render_template, request, send_file
from flask_cors import CORS
import sys
from werkzeug.wsgi import LimitedStream
import cv2, numpy as np, random
import os 
import glob 
class StreamConsumingMiddleware(object):

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        stream = LimitedStream(environ['wsgi.input'],
                               int(environ['CONTENT_LENGTH'] or 0))
        environ['wsgi.input'] = stream
        app_iter = self.app(environ, start_response)
        try:
            stream.exhaust()
            for event in app_iter:
                yield event
        finally:
            if hasattr(app_iter, 'close'):
                app_iter.close()
UPLOAD_FOLDER = './'
app = Flask(__name__)
app.wsgi_app = StreamConsumingMiddleware(app.wsgi_app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)
def printS(message):
    #app.logger.info(message)
    print(message, file=sys.stdout)

@app.route('/upload', methods=['POST'])
def upload():   
    file = request.files["file"]
    curChunk = int(request.form.get("curChunk"))
    totalChunks = int(request.form.get("totalChunks"))
    chunk_filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename + str(curChunk))
    file.save(chunk_filename)  
    blobs = glob.glob('./blob*')
    numBlobs = len(blobs)
    printS(len(blobs))
    if numBlobs == totalChunks:
        with open("finalBlob",'ab') as final_blob:
            for i in range(0,len(blobs)):
                with open("./blob"+str(i),'rb') as cur_blob:
                    contents = cur_blob.read()
                    final_blob.write(contents)
        process_video("finalBlob")
        output_filename = os.path.join(app.config['UPLOAD_FOLDER'], "output.mp4")
        os.system("ffmpeg -r 30 -i img%d.png -vb 20M -vcodec mpeg4 -y " + output_filename )
        os.system("rm -f img*")
        os.system("rm -f blob*")

        return send_file(output_filename)
    else:
        return "processed chunk" + str(curChunk)
    
    


@app.route('/')
def index():
    return "hello world"

def nothing(arg): pass

def process_video(filename): 
    # Capture webcam source
    cap = cv2.VideoCapture(filename)
    height = int(cap.get(3))  # float
    width = int(cap.get(4)) # 
    fps = int(cap.get(5))
    #writer = cv2.VideoWriter(output_file, fourcc, fps,(height,width),isColor=True)

    trail_paths, max_trail_length = [], 23
    printS(str(width) + "," + str(height) + "," + str(fps))
    totalFrames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # Iterate though each frame of video
    numFrames = 0
    numWritten = 0
    status = True
    
    while status:
        _, img = cap.read()
        if not _:
            status = False
            continue
        numFrames += 1
        if numFrames%2 == 1:
            continue
        
        printS(numFrames/totalFrames)
        # Get trackbar values
        min_size = 20
        max_size = 10000
        show_trails = 1
        show_lines = False
        show_stars = False
        show_hearts = False
        
        # Read img from the video
        #Get the locations of the ball in the img    
        mask, positions = get_ball_locations(img, 100000, 5)

        # Show the ball trails
        if show_trails==1:
            for position in positions: cv2.circle(img, position, 5, (13,255,123), 5)
        cv2.imwrite('img'+str(numWritten)+'.png',img)
        numWritten += 1
        status = _
    printS("done writing")
    cv2.destroyAllWindows()
    cap.release()

# Takes img and color, returns parts of img that are that color
def only_color(frame, hsv_range):
    (b,r,g,b1,r1,g1) = hsv_range
    # Convert BGR to HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # define range of blue color in HSV
    lower = np.array([b,r,g])
    upper = np.array([b1,r1,g1])
    # Threshold the HSV img to get only blue colors
    mask = cv2.inRange(hsv, lower, upper)
    # Bitwise-AND mask and original img
    res = cv2.bitwise_and(frame,frame, mask= mask)
    return res, mask

# Finds the contours in an img
def get_contours(im):
    imgray = cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    _ ,thresh = cv2.threshold(imgray,0,255,0)
    _, contours, _ = cv2.findContours(thresh,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    return contours

# Finds the center of a contour
def contour_center(c):
    M = cv2.moments(c)
    center = int(M['m10']/M['m00']), int(M['m01']/M['m00'])
    return center

# Takes img, returns location of ball
def get_ball_locations(img,  max_size, min_size):
    h= 0
    s= 50
    v= 50
    h1= 255
    s1= 255
    v1= 255
    # Segment the img by color
    img, mask = only_color(img, (h,s,v,h1,s1,v1))
    # Find the contours in the img
    contours = get_contours(img)
    # If no ball is found, the default position is 0,0
    positions = []
    # Iterate though the contours:
    for contour in contours:
        area = cv2.contourArea(contour)
        if area>min_size and area<max_size: positions.append(contour_center(contour))
    if len(positions)==0: positions.append((-200,-200))
    return img, positions


