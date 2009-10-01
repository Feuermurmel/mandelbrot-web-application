#! /usr/bin/env bash

bc50() { echo "scale=50; $1" | bc | sed -r "s/(\.([0-9]*[1-9])?)0+$/\1/"; }

parse_path() {
	echo "$1" | grep -oE "[abcd]" | (
		RE_BIN="."
		IM_BIN="."
		SCALE_BIN="1"
			
		while IFS= read i; do
			[ "$i" == "a" ] || [ "$i" == "c" ] && RE_BIN="${RE_BIN}0"
			[ "$i" == "b" ] || [ "$i" == "d" ] && RE_BIN="${RE_BIN}1"
			
			[ "$i" == "a" ] || [ "$i" == "b" ] && IM_BIN="${IM_BIN}0"
			[ "$i" == "c" ] || [ "$i" == "d" ] && IM_BIN="${IM_BIN}1"
			
			SCALE_BIN="${SCALE_BIN}0"
		done
		
		bc50 "ibase=2; $RE_BIN * 100 - 10"
		bc50 "ibase=2; $IM_BIN * 100 - 10"
		bc50 "ibase=2; 4 / $SCALE_BIN"
	) | tr "\n" "\t"
}

PATH="/Users/michi/usr/bin:/opt/local/bin:/opt/local/sbin:$PATH"
SCRIPT_DIR=$(dirname "$SCRIPT_NAME")
SIZE=256

if echo "$PATH_INFO" | grep -qE "/([abcd])+\.png"; then
	CACHE="cache/$PATH_INFO"
	mkdir -p $(dirname "$CACHE")
	
	if ! [ -e "$CACHE" ]; then
		INFO=$(parse_path "$(echo "$PATH_INFO" | sed -r "s/\.png$//")")
		
		RE=$(echo "$INFO" | cut -f 1)
		IM=$(echo "$INFO" | cut -f 2)
		SCALE=$(echo "$INFO" | cut -f 3)
		
		./mandelbrot "$RE" "$IM" "$SCALE" "$SIZE" 65000 25 2> /dev/null | convert -size "${SIZE}x$SIZE" -depth 8 "RGB:" "$CACHE"
	fi
	
	echo "Location: $SCRIPT_DIR/$CACHE"
	echo
else
	echo "Status: 404 Object not found"
	echo
fi
