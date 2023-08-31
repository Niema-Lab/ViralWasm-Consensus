import http.server
import socketserver
import subprocess
import argparse
import socket

PORT = 5000
DIRECTORY = "dist"

def kill_port_unix(port):
    command = f"lsof -i :{port} -t"
    try:
        result = subprocess.check_output(command, shell=True).decode("utf-8")
        pids = result.strip().split("\n")
        for pid in pids:
            subprocess.run(f"kill -9 {pid}", shell=True)
    except subprocess.CalledProcessError as e:
        return

def kill_port_windows(port):
    command = f"netstat -ano | findstr :{port}"
    try:
        result = subprocess.check_output(command, shell=True).decode("utf-8").strip().split("\n")
        for line in result:
            pid = line.split()[-1]
            subprocess.run(f"taskkill /F /PID {pid}", shell=True)
    except subprocess.CalledProcessError as e:
        return

# Argument parser setup
parser = argparse.ArgumentParser(description="HTTP Server")
parser.add_argument("--force", help="Force kill existing processes on port", action="store_true")
args = parser.parse_args()

# Only kill port if --force is provided
if args.force:
    kill_port_unix(PORT)
    kill_port_windows(PORT)
else: 
	# Check if port is already in use
	sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	port_in_use = sock.connect_ex(('127.0.0.1', PORT)) == 0
	sock.close()

	# If port is in use, suggest using --force option
	if port_in_use:
		print(f"Port {PORT} is already in use. You can use the --force option to kill existing processes on this port.")
		exit(1)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f'Serving at port {PORT}. Visit http://localhost:{PORT}/index.html')
    httpd.serve_forever()
