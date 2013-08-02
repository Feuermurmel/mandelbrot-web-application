#! /usr/bin/env python3.2

import sys, os, shutil, subprocess, socketserver, http.server


script_dir = os.path.dirname(__file__)
tile_size = 256
max_iterations = 65000


def command(*args):
	proc = subprocess.Popen(args, stdin = subprocess.PIPE, stdout = subprocess.PIPE)
	proc.communicate()
	
	if proc.returncode != 0:
		raise Exception('Command failed: %s' % proc.returncode)


def makedirs(path):
	# os.makedirs sometimes tries to create a directory even if it already exists.
	if not os.path.exists(path):
		os.makedirs(path, exist_ok = True)


def mandelbrot(image_name):
	file_path = os.path.join(script_dir, 'cache', image_name + '.png')
	
	if not os.path.exists(file_path):
		re = -2.
		im = -2.
		range = 4.
		
		for i in image_name:
			range /= 2.
			
			if i in 'bd':
				re += range
			
			if i in 'cd':
				im += range
		
		temp_path = file_path + '~'
		
		makedirs(os.path.dirname(file_path))
		command(os.path.join(script_dir, 'bin/mandelbrot'), temp_path, str(re), str(im), str(range), str(tile_size), str(max_iterations))
		os.rename(temp_path, file_path)
	
	return file_path


class Handler(http.server.BaseHTTPRequestHandler):
	mime_types = {
		'.js': 'application/javascript',
		'.xhtml': 'application/xhtml+xml',
		'.png': 'image/png',
		'.css': 'text/css',
		'.js': 'text/javascript' }
	
	def do_GET(self):
		path = [i for i in self.path.split('/') if i]
		norm_path = '/' + '/'.join(path)
		
		if self.path != norm_path:
			self.send_response(301)
			self.send_header('location', norm_path)
			self.end_headers()
		else:
			if len(path) == 2 and path[0] == 'mandelbrot':
				file_path = mandelbrot(path[1])
			else:
				if path == []:
					path = ['index.xhtml']
				
				file_path = os.path.join(script_dir, 'www', *path)
			
			if os.path.isfile(file_path):
				extension = os.path.splitext(file_path)[1]
				type = self.mime_types.get(extension, 'application/octet-stream')
				
				self.send_response(200)
				self.send_header('content-type', type)
				self.end_headers()
				
				with open(file_path, 'rb') as file:
					shutil.copyfileobj(file, self.wfile)
				
				self.wfile.flush()
			else:
				self.send_response(404)
				self.end_headers()


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
	pass


def main(port = 8080):
	address = '', int(port)
	
	server = Server(address, Handler)
	
	print('HTTP server is listening on {} ...'.format(address))
	
	server.serve_forever()


main(*sys.argv[1:])
