#! /bin/bash

# start agent
eval "$(ssh-agent -s)"

# add key
ssh-add ../.ssh/github_key

# push to github
git push


