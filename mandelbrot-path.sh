#! /usr/bin/env bash

PATH_INFO=$1
[ "$2" ] && SIZE=$2 || SIZE=512

echo "$PATH_INFO" | sed -r "s/i\.png$//" | grep -oE "[^/]+" | (
	RE_BIN="."
	IM_BIN="."
	SCALE_BIN="1"
	
	while IFS= read i; do
		if [ "$i" == "a" ]; then
			RE_BIN="$RE_BIN""0"
			IM_BIN="$IM_BIN""0"
		elif [ "$i" == "b" ]; then
			RE_BIN="$RE_BIN""1"
			IM_BIN="$IM_BIN""0"
		elif [ "$i" == "c" ]; then
			RE_BIN="$RE_BIN""0"
			IM_BIN="$IM_BIN""1"
		elif [ "$i" == "d" ]; then
			RE_BIN="$RE_BIN""1"
			IM_BIN="$IM_BIN""1"
		else
			exit 1
		fi
		
		SCALE_BIN="$SCALE_BIN""0"
	done
	
	RE_DEC=$(echo "scale=16; ibase=2; $RE_BIN * 100 - 10" | bc)
	IM_DEC=$(echo "scale=16; ibase=2; $IM_BIN * 100 - 10" | bc)
	SCALE_DEC=$(echo "scale=16; ibase=2; 4 / $SCALE_BIN" | bc)
	
	./mandelbrot "$SIZE" "$SCALE_DEC" "$RE_DEC" "$IM_DEC" 65534 | convert -size ${SIZE}x$SIZE -depth 8 RGB: TIFF:-
)