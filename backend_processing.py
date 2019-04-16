from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import sys
from werkzeug.wsgi import LimitedStream

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
app = Flask(__name__)
app.wsgi_app = StreamConsumingMiddleware(app.wsgi_app)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload():   
    files = request.files
    print("video uploaded ", file=sys.stdout)
    print(files, file=sys.stdout)

    return "video uploaded"


@app.route('/')
def index():
    return "hello world"