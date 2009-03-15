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

if echo "$PATH_INFO" | grep -qE "/([abcd]/)*i\.png"; then
	CACHE="../cache/$PATH_INFO"
	mkdir -p $(dirname "$CACHE")
	
	if ! [ -e "$CACHE" ]; then
		INFO=$(parse_path "$(echo "$PATH_INFO" | sed -r "s/i\.png$//")")
		
		RE=$(echo "$INFO" | cut -f 1)
		IM=$(echo "$INFO" | cut -f 2)
		SCALE=$(echo "$INFO" | cut -f 3)
		
		./mandelbrot-bin "$RE" "$IM" "$SCALE" 512 | convert -size "512x512" -depth 8 "RGB:" "$CACHE"
	fi
	
	echo "Location: $SCRIPT_DIR/$CACHE"
	echo
elif echo "$PATH_INFO" | grep -qE "/([abcd]/)*info\.txt"; then
	INFO=$(parse_path "$(echo "$PATH_INFO" | sed -r "s/i\.png$//")")
		
	RE=$(echo "$INFO" | cut -f 1)
	IM=$(echo "$INFO" | cut -f 2)
	SCALE=$(echo "$INFO" | cut -f 3)
	
	echo 'Content-Type: text/plain; charset="utf-8"'
	echo
	echo "View: $(bc50 "$RE + $SCALE * .5") + $(bc50 "$IM + $SCALE * .5") i ± $(bc50 "$SCALE * .5") (i + 1)"
	echo "Command line: ./mandelbrot "$RE" "$IM" "$SCALE" 512 | convert -size 512x512 -depth 8 RGB: i.png"
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
