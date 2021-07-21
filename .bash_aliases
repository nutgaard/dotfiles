# Shortcut for editing aliases
alias update="source ~/.bashrc"
alias nanosh="nano --syntax=sh $@"

alias cal="ncal -b -w"

# Git aliases
alias gs="git status"
alias gl="git pull"
alias gp="git push"
alias gf="git fetch"
alias gr="git rebase"
alias glg="git glg"
alias lg="git lg"

# Maven aliases
alias mci="mvn clean install"

# Extra
alias clipboard="xclip -sel clip"
alias catc="pygmentize -g"
alias ccat="pygmentize -g"
function rebootWindows() {
  sudo grub-reboot 'Windows Boot Manager (on /dev/nvme1n1p2)'
  echo "Run 'sudo reboot' to reboot from terminal." 
}

# .dotfiles
alias config='/usr/bin/git --git-dir=$HOME/.cfg --work-tree=$HOME'

