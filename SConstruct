import os

DefaultEnvironment()['ENV']['PATH'] = os.environ['PATH']
DefaultEnvironment().Append(CPPPATH = '.')
DefaultEnvironment().Append(CFLAGS = ['-O3', '-Wall', '-Werror', '-std=gnu99'])

Program('mandelbrot', 'mandelbrot.c')
