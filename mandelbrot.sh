#! /usr/bin/env bash

PATH="/Users/michi/usr/bin:/opt/local/bin:/opt/local/sbin:$PATH"
SCRIPT_DIR=$(dirname "$SCRIPT_NAME")

if echo "$PATH_INFO" | grep -qE "/([abcd]/)*i\.png"; then
	CACHE="../cache/$PATH_INFO"
	mkdir -p $(dirname "$CACHE")
	
	if ! [ -e "$CACHE" ]; then
		RE_BIN="."
		IM_BIN="."
		SCALE_BIN="1"
		
		echo "$PATH_INFO" | sed -r "s/i\.png$//" | grep -oE "[^/]+" | (
			while IFS= read i; do
				[ "$i" == "a" ] || [ "$i" == "c" ] && RE_BIN="${RE_BIN}0"
				[ "$i" == "b" ] || [ "$i" == "d" ] && RE_BIN="${RE_BIN}1"
				
				[ "$i" == "a" ] || [ "$i" == "b" ] && IM_BIN="${IM_BIN}0"
				[ "$i" == "c" ] || [ "$i" == "d" ] && IM_BIN="${IM_BIN}1"
				
				SCALE_BIN="${SCALE_BIN}0"
			done
			
			RE_DEC=$(echo "scale=16; ibase=2; $RE_BIN * 100 - 10" | bc)
			IM_DEC=$(echo "scale=16; ibase=2; $IM_BIN * 100 - 10" | bc)
			SCALE_DEC=$(echo "scale=16; ibase=2; 4 / $SCALE_BIN" | bc)
						
			./mandelbrot-bin "$RE_DEC" "$IM_DEC" "$SCALE_DEC" 512 | convert -size "512x512" -depth 8 "RGB:" "PNG:$CACHE"
		)
	fi
	
	echo "Location: $SCRIPT_DIR/$CACHE"
	echo
elif echo "$PATH_INFO" | grep -qxE "/([abcd]/)*"; then
	echo "Location: $SCRIPT_DIR/../mandelbrot.html"
	echo
elif echo "$PATH_INFO" | grep -qEx "[abcd/]*"; then
	echo "Status: 301 Moved Permanently"
	echo "Location: $SCRIPT_NAME/$(echo "$PATH_INFO" | sed -r "s/\///g; s/./\0\//g")"
	echo
else
	echo "Status: 301 Moved Permanently"
	echo "Location: $SCRIPT_NAME/"
	echo
fi
