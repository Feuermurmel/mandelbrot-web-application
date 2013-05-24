#! /usr/bin/env python3.2

import os, shutil, subprocess, http.server


script_dir = os.path.dirname(__file__)
tile_size = 256


def command(*args):
	proc = subprocess.Popen(args, stdin = subprocess.PIPE, stdout = subprocess.PIPE)
	proc.communicate()
	
	if proc.returncode != 0:
		raise Exception('Command failed: %s' % proc.returncode)


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
				file_path = os.path.join(script_dir, 'cache', path[1])
				
				if not os.path.exists(file_path):
					re = -2.
					im = -2.
					range = 4.
					
					for i in os.path.splitext(path[1])[0]:
						range /= 2.;
						
						if i in 'bd':
							re += range
						
						if i in 'cd':
							im += range
					
					temp_path = file_path + '~'
					
					command(os.path.join(script_dir, 'bin/mandelbrot'), temp_path, str(re), str(im), str(range), str(tile_size))
					os.rename(temp_path, file_path)
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


address = '', 8080

server = http.server.HTTPServer(address, Handler)

print('HTTP server is listening on {} ...'.format(address))

server.serve_forever()
