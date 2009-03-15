
OBJECTS_mandelbrot = mandelbrot.o

PRODUCTS = $(patsubst OBJECTS_%, %, $(filter OBJECTS_%, $(.VARIABLES)))
SHELL := $(shell which bash)
SOURCES := $(patsubst %.o, %.c, $(foreach i, $(PRODUCTS), $(OBJECTS_$(i))))

.DEFAULT_GOAL = all
.PHONY: all
all: $(PRODUCTS)

.PHONY: install
install: www
	@ $(MAKE) -s install-do

.PHONY: install-do
install-do: www/cache www/mandelbrot.html www/cgi-bin/mandelbrot www/cgi-bin/mandelbrot-bin

www/cache:
	@ echo "MKDIR    $@"
	@ mkdir -p $@
	@ echo "CHMOD    a+rwX $@"
	@ chmod a+rwX $@

www/mandelbrot.html: mandelbrot.html
	@ echo "CP       $^ => $@"
	@ cp $^ $@

www/cgi-bin/mandelbrot: mandelbrot.sh
	@ echo "CP       $^ => $@"
	@ cp $^ $@

www/cgi-bin/mandelbrot-bin: mandelbrot
	@ echo "CP       $^ => $@"
	@ cp $^ $@

.PHONY: www
www:
	@ [ -e "www/" ] || { echo "Please create a symlink under www to your httpd folder!"; exit 1; }

.SUFFIXES:
Makefile.deps: $(SOURCES) Makefile
	@ echo "DEPS     $?"
	@ for i in $(SOURCES); do cpp -MM $$i; done > $@
	@ echo "$@: $$(cut -d " " -f 2- < $@ | tr "\n" " ")" >> $@

CLEAN_FILES := *.o $(PRODUCTS) Makefile.deps* Makefile.cache
CLEAN_FILES := $(wildcard $(CLEAN_FILES))

%.o: $(MAKEFILE_LIST)
	@ echo "GCC      $*.c => $@"
	@ gcc -c -std=gnu99 -Wall -O3 -o $@ $*.c

.SECONDEXPANSION:
$(PRODUCTS): INPUTS = $(OBJECTS_$@)
$(PRODUCTS): $$(INPUTS) $(MAKEFILE_LIST)
	@ echo "LD       $(INPUTS) => $@"
	@ gcc -o $@ $(INPUTS)

.PHONY: clean
clean:
ifneq '$(CLEAN_FILES)' ''
	@ echo "CLEAN   " $(CLEAN_FILES)
	@ rm -f $(CLEAN_FILES)
endif

ifeq '$(filter-out clean, $(MAKECMDGOALS))' '$(MAKECMDGOALS)'
  -include Makefile.deps
endif
