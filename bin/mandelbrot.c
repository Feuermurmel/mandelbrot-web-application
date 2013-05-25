#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <unistd.h>
#include <string.h>
#include <math.h>
#include <libgen.h>
#include <sys/stat.h>

#include <png.h>

#define until(a) while (!(a))
#define length(array) (sizeof (array) / sizeof (*array))

/* Configurations for mandelbrot application */

/* Iteration count type */
#define CONFIGURATION_ITERATION_TYPE uint16_t

/* Default output image square dimensions */
#define CONFIGURATION_DFAULT_IMAGE_SIZE 512

/* Defalt maximum iteration count */
#define CONFIGURATION_DFAULT_MAX_INTERATIONS 65000

/* Relative length of a color cycle in the coloring gradient. */
#define CONFIGURATION_DFAULT_GRADIENT_INTERVAL 3

/* Inverse speed at which the color cycles become longer. */
#define CONFIGURATION_DFAULT_GRADIENT_SLOPE 100

/* Output directory for images when running as a CGI script. */
#define CONFIGURATION_CGI_CACHE_DIR_PATH "../cache"


typedef CONFIGURATION_ITERATION_TYPE iterations_t;

struct complex_d {
	double re;
	double im;
};

struct complex_i {
	int re;
	int im;
};

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
	
	if (border == NULL || field == NULL)
		goto fail;
		
	field[0] = n_region;
	
	for (i.im = 0; i.im < size; i.im += 1) {
		for (i.re = 0; i.re < size; i.re += 1) {
			if (border[size * i.im + i.re]) {
				n_region = field[size * i.im + i.re];
			} else if (field[size * i.im + i.re] == 0) {
				field[size * i.im + i.re] = n_region;
			} else {
				struct complex_i i_start = complex_subt(i, ((struct complex_i) { 1, 0 }));
				enum direction dir = direction_down;
				
				n_region = field[size * i.im + i.re];
				
				until (complex_eq(i, i_start)) {
					if (0 <= i.re && i.re < size && 0 <= i.im && i.im < size) {
						if (field[size * i.im + i.re] == 0) {
							field[size * i.im + i.re] = point(complex_add(origin, complex_scale(((struct complex_d) { i.re, i.im }), pixel_size)), max_iterations);
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
	}
	
	free(border);
	
	return field;

fail:
	free(border);
	free(field);
	
	return NULL;
}

struct color {
	uint8_t r, g, b;
};

#define to_range(a, b, c) ((b) < (a) ? (a) : (b) > (c) ? (c) : (b))

struct color * gradient(int num) {
	struct color * buf = malloc(sizeof (struct color) * (num + 1));
	double const interval = CONFIGURATION_DFAULT_GRADIENT_INTERVAL;
	double const slope = CONFIGURATION_DFAULT_GRADIENT_SLOPE;
	
	struct color colors[] = { { 255.996, 255.996, 255.996 }, { 230.898, 255.996, 191.746 }, { 164.637, 212.824, 112.438 }, { 81.316, 117.457, 53.203 }, { 46.180, 69.270, 27.105 }, { 33.125, 42.164, 30.117 }, { 36.578, 41.129, 45.578 }, { 58.441, 71.656, 83.172 }, { 125.488, 150.586, 166.648 }, { 190.742, 211.824, 239.934 }, { 231.902, 250.977, 254.992 } };
	
	if (buf == NULL)
		goto fail;
	
	for (int i = 0; i < num; i += 1) {
		double x = log((double) i / slope + 1.) * slope / interval;
		
		int n = floor(x);
		double a2 = x - n;
		double a1 = 1 - a2;
		struct color c1 = colors[n % length(colors)];
		struct color c2 = colors[(n + 1) % length(colors)];
		
		buf[i] = (struct color) {
			a1 * c1.r + a2 * c2.r,
			a1 * c1.g + a2 * c2.g,
			a1 * c1.b + a2 * c2.b
		};
	}
	
	buf[num] = (struct color) { 0, 0, 0 };
	
	return buf;
	
fail:
	free(buf);
	
	return NULL;
}

struct color * colorImage(int const size, struct complex_d const origin, double const range, iterations_t const max_iterations) {
	double pixelSize = range / size;
	struct complex_d shiftedOrigin = complex_add(origin, ((struct complex_d) { pixelSize / 2., pixelSize / 2. }));
	struct color * grad = gradient(max_iterations);
	iterations_t * field = mandelbrot(size, shiftedOrigin, pixelSize, max_iterations);
	struct color * image = malloc(sizeof (struct color) * size * size);
	
	if (grad == NULL || field == NULL || image == NULL)
		goto fail;
	
	for (int i = 0; i < size * size; i += 1)
		if (field[i] == (iterations_t) -1)
			image[i] = grad[max_iterations];
		else
			image[i] = grad[field[i] - 1];
	
	free(grad);
	free(field);
	
	return image;
	
fail:
	free(grad);
	free(field);
	free(image);
	
	return NULL;
}

int main (int argc, char ** const argv) {
	if (argc < 5 || argc > 7) {
		fprintf(stderr,
			"Usage: %s <file> <re> <im> <range> [ <size> [ <iter> ] ]\n"
			"Where:\n"
			"    <file>: File to write the output to. The PNG file format is used."
			"    <re>, <im>: Coordinates of the upper left corner.\n"
			"    <range>: Coordinate range to include in both directions.\n"
			"    <size>: Pixel length of one side of the image square.\n"
			"    <iter>: Maximum number of iterations.\n",
			argv[0]);
		
		return 1;
	} else {
		double range;
		struct complex_d origin;
		int size = CONFIGURATION_DFAULT_IMAGE_SIZE;
		iterations_t max_iterations = CONFIGURATION_DFAULT_MAX_INTERATIONS;
		
		if (argc > 5)
			size = strtol(argv[5], NULL, 10);
		if (argc > 6)
			max_iterations = strtol(argv[6], NULL, 10);
		
		range = strtod(argv[4], NULL);
		
		origin = (struct complex_d) {
			strtod(argv[2], NULL),
			strtod(argv[3], NULL)
		};
		
		char * file_path = argv[1];
		FILE * file = fopen(file_path, "w");
		
		if (file == NULL) {
			fprintf(stderr, "Could not open file: %s", file_path);
			
			return 1;
		}
		
		{
			struct color * image = colorImage(size, origin, range, max_iterations);
			png_infop info_ptr;
			png_structp png_ptr;
			struct color ** rows = malloc(size * sizeof (struct color *));
			
			for (int i = 0; i < size; i += 1)
				rows[i] = image + size * i;
			
			png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
			
			info_ptr = png_create_info_struct(png_ptr);
			
			png_init_io(png_ptr, file);
			png_set_IHDR(png_ptr, info_ptr, size, size, 8, PNG_COLOR_TYPE_RGB, PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);
			png_write_info(png_ptr, info_ptr);
			png_write_image(png_ptr, (png_bytepp) rows);
			png_write_end(png_ptr, NULL);
			
			free(rows);
		}
		
		fclose(file);
		
		return 0;
	}
}
