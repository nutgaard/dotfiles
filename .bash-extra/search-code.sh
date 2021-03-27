#!/bin/bash
SEARCH_PATH="/home/nicklas/code"

function searchCode() {
  while getopts 'd:' OPTION; do
    case "$OPTION" in
      d)
        SEARCH_PATH="$OPTARG"
        ;;
      ?)
        echo "script usage: $(basename $0) [-d dir] <query>" >&2
        exit 1
        ;;
    esac
  done
  shift "$(($OPTIND -1))"
  grep -r "$*" "$SEARCH_PATH" --exclude-dir={node_modules,target,dist,build,.git,.cache,.idea}
}
