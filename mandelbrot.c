#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <unistd.h>
#include <math.h>
#include <time.h>
#include <signal.h>

#include "configuration.h"

#ifdef CONFIGURATION_PROGRESS_NONE
#include "progress-none.c"
#endif
#ifdef CONFIGURATION_PROGRESS_SIMPLE
#include "progress-simple.c"
#endif
#ifdef CONFIGURATION_PROGRESS_ETA
#include "progress-eta.c"
#endif

#define until(a) while (!(a))

typedef CONFIGURATION_ITERATION_TYPE iterations_t;

struct complex_d {
	double re;
	double im;
};

struct complex_i {
	int re;
	int im;
};

#define to_range(a, b, c) ((b) < (a) ? (a) : (b) > (c) ? (c) : (b))

#define complex_add(a, b) ((typeof (a)) { (a).re + (b).re, (a).im + (b).im })
#define complex_minus(a) ((typeof (a)) { -(a).re, -(a).im })
#define complex_subt(a, b) complex_add(a, complex_minus(b))
#define complex_mult(a, b) ((typeof (a)) { (a).re * (b).re - (a).im * (b).im, (a).re * (b).im + (a).im * (b).re })
#define complex_scale(a, b) complex_mult(a, ((typeof (a)) { b, 0 }) )
#define complex_square(a) complex_mult(a, a)
#define complex_abs_sq(a) ((a).re * (a).re + (a).im * (a).im)
#define complex_eq(a, b) ((a).re == (b).re && (a).im == (b).im)

iterations_t point(struct complex_d const c, int max_iterations) {
	struct complex_d z = { 0., 0. };
	
	for (iterations_t n = 0; n < max_iterations; n += 1) {
		z = complex_add(complex_square(z), c);
		
		if (complex_abs_sq(z) > 4.)
			return n + 1;
	}
			
	return -1;
}

enum direction {
	direction_right = 0,
	direction_up = 1,
	direction_left = 2,
	direction_down = 3
};

#define direction_left(d) (d = (d + 1) % 4)
#define direction_right(d) (d = (d - 1) % 4)

iterations_t * mandelbrot(int const size, struct complex_d const origin, double const pixel_size, iterations_t const max_iterations) {
	bool * const border = calloc(size * size, sizeof (bool));
	iterations_t * const field = calloc(size * size, sizeof (iterations_t));
	struct complex_i const dir_step[] = { { 1, 0 }, { 0, -1 }, { -1, 0 }, { 0, 1 } };
	iterations_t n_region = point(origin, max_iterations);
	struct complex_i i;
	struct progress pr;
	
	progress_init(&pr, size * size);
	progress_update(&pr, 1);
	
	if (border == NULL || field == NULL)
		goto fail;
		
	field[0] = n_region;
	
	for (i.im = 0; i.im < size; i.im += 1)
		for (i.re = 0; i.re < size; i.re += 1) {
			if (border[size * i.im + i.re])
				n_region = field[size * i.im + i.re];
			else if (field[size * i.im + i.re] == 0) {
				field[size * i.im + i.re] = n_region;
				
				progress_update(&pr, 1);
			} else {
				struct complex_i i_start = complex_subt(i, ((struct complex_i) { 1, 0 }));
				enum direction dir = direction_down;
				
				n_region = field[size * i.im + i.re];
				
				until (complex_eq(i, i_start)) {
					if (false) {
						fprintf(stderr, "i: (%d, %d)\n" "i_start: (%d, %d)\n" "n_region: %d, dir: %d\n", i.im, i.re, i_start.im, i_start.re, n_region, dir);
						
						for (int j = 0; j < size; j += 1) {
							for (int i = 0; i < size; i += 1)
								fprintf(stderr, "%d\t", field[size * j + i]);
							
							fprintf(stderr, "\t");
							for (int i = 0; i < size; i += 1)
								fprintf(stderr, "%d\t", border[size*j + i]);
							
							fprintf(stderr, "\n");
						}
						
						fprintf(stderr, "\n");
					}
					
					if (0 <= i.re && i.re < size && 0 <= i.im && i.im < size) {
						if (field[size * i.im + i.re] == 0) {
							field[size * i.im + i.re] = point(complex_add(origin, complex_scale(((struct complex_d) { i.re, i.im }), pixel_size)), max_iterations);
							
							progress_update(&pr, 1);
						}
						
						if (field[size * i.im + i.re] != n_region)
							goto turn_positive;
						
						border[size * i.im + i.re] = true;
						direction_left(dir);
					} else {
					turn_positive:
						i = complex_subt(i, dir_step[dir]);						
						direction_right(dir);
					}
					
					i = complex_add(i, dir_step[dir]);
				}
			}
		}
	
	free(border);
	progress_end(&pr);
	
	return field;

fail:
	free(border);
	free(field);
	
	return NULL;
}

iterations_t * mandelbrot_reference(int const size, struct complex_d const origin, double const pixel_size, iterations_t const max_iterations) {
	iterations_t * const field = calloc(size * size, sizeof (iterations_t));
	
	if (field == NULL)
		goto fail;
	
	for (int i = 0; i < size * size; i += 1)
		field[i] = point(complex_add(origin, ((struct complex_d) { (i % size) * pixel_size, (i / size) * pixel_size })), max_iterations);
	
	return field;
	
fail:
	free(field);
	
	return NULL;
}

struct color {
	unsigned char __attribute__ ((packed)) r;
	unsigned char __attribute__ ((packed)) g;
	unsigned char __attribute__ ((packed)) b;
};

struct color * gradient(int num) {
	struct color * buf = malloc(sizeof (struct color) * (num + 1));
	double c = num;
	
	if (buf == NULL)
		goto fail;
	
	for (int i = 0; i < num; i += 1) {
		double n = i;
		
		buf[i] = (struct color) {
			to_range(0., 153. + 204. * cos((M_PI * (c - 6. * n)) / (3. * c)), 255.),
			to_range(0., 153. + 204. * cos((2. * M_PI * n) / c), 255.),
			to_range(0., 153. + 204. * cos((M_PI * (c + 6. * n)) / (3. * c)), 255.)
		};
	}
	
	buf[num] = (struct color) { 0, 0, 0 };
	
fail:
	return buf;
}

int main (int argc, char ** const argv) {
	if (argc < 4 || argc > 6) {
		fprintf(stderr,
			"Usage: %s <re> <im> <range> [ <size> [ <iter> ] ]\n"
			"Where:\n"
			"    <size>: Pixel length of one side of the image square.\n"
			"    <range>: Pixel length of one side of the image square.\n"
			"    <re>, <im>: Pixel length of one side of the image square.\n"
			"    <iter>: Pixel length of one side of the image square.\n",
			argv[0]
		);
		return 1;
	} else {
		struct complex_d orig;
		double pixel_size;
		int size = CONFIGURATION_DFAULT_IMAGE_SIZE;
		int grad_colors = CONFIGURATION_DFAULT_GRADIENT_COLORS;
		iterations_t max_iterations = CONFIGURATION_DFAULT_MAX_INTERATIONS;
		
		if (argc > 4)
			size = strtol(argv[4], NULL, 10);
		if (argc > 5)
			max_iterations = strtol(argv[5], NULL, 10);
		
		pixel_size = strtod(argv[3], NULL) / size;
		
		orig = (struct complex_d) {
			strtod(argv[1], NULL) + pixel_size / 2,
			strtod(argv[2], NULL) + pixel_size / 2
		};
		
		{
			struct color * grad = gradient(grad_colors);
			iterations_t * field = mandelbrot(size, orig, pixel_size, max_iterations);
			struct color * image = malloc(sizeof (struct color) * size * size);
			
			if (grad == NULL || field == NULL || image == NULL)
				return 1;
			
			for (int i = 0; i < size * size; i += 1) {
				if (field[i] == (iterations_t) -1)
					image[i] = grad[grad_colors];
				else
					image[i] = grad[field[i] % grad_colors];
			}
			
		//	write(1, field, sizeof (iterations_t) * size * size);
			write(1, image, sizeof (struct color) * size * size);
			
			free(grad);
			free(field);
			free(image);
		}
		
		return 0;
	}
}
