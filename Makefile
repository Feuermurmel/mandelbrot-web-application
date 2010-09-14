all: mandelbrot cache

%.o: %.c
	gcc -O3 -Wall -Werror -std=gnu99 -o $@ -c $<

mandelbrot: mandelbrot.o
	rm -rf cache
	gcc -o $@ $^

cache:
	mkdir cache
	chmod a+rw cache

clean:
	rm -rf mandelbrot cache
