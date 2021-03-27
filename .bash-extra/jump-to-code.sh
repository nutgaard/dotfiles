CODE_WORKSPACE="/home/nicklas/code"
function jumpToCode() {
  cd $CODE_WORKSPACE/$(ls $CODE_WORKSPACE | fzf -1 -q ${1:-""})
}

alias j="jumpToCode"
