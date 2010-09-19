all: bin/mandelbrot cache

%.o: %.c
	gcc -O3 -Wall -Werror -std=gnu99 -o $@ -c $<

bin/mandelbrot: bin/mandelbrot.o
	rm -rf cache
	gcc -L/opt/local/lib/ -lpng -o $@ $^

cache:
	mkdir cache
	chmod a+rw cache

clean:
	rm -rf bin/mandelbrot cache
