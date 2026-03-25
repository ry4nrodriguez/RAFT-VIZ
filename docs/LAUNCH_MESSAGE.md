Hey everyone — I built an open-source visualization tool for our Raft
assignment. You add a small amount of instrumentation to your code, run
your tests, and then get an animated replay of your cluster with pixel-art
servers, elections, crashes, and log activity.

Setup:
  curl -o raftvis.go https://raw.githubusercontent.com/YOUR_GITHUB/raftvis/main/go/raftvis.go
  [add the instrumentation lines from the README]
  go test -run 3A
  npx raftvis

GitHub: https://github.com/YOUR_GITHUB/raftvis
Demo: https://YOUR_GITHUB.github.io/raftvis

It is especially helpful for debugging elections, seeing which server timed
out first, and spotting when replication or leadership transitions stop
making sense.

