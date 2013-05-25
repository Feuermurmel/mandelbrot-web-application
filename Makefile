all: bin/mandelbrot

%.o: %.c
	gcc-mp-4.7 -O3 -Wall -Werror -std=gnu99 -o $@ -c $<

bin/mandelbrot: bin/mandelbrot.o
	gcc -L/opt/local/lib/ -lpng -o $@ $^

clean:
	rm -rf bin/mandelbrot{,.o} cache
