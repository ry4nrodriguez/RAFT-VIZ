Hey everyone — I built an open-source visualization tool for our Raft
assignment. You add a small amount of instrumentation to your code, run
your tests, and then get an animated replay of your cluster with pixel-art
servers, elections, crashes, and log activity.

Setup:
  curl -o raftviz.go https://raw.githubusercontent.com/YOUR_GITHUB/RAFT-VIZ/main/go/raftviz.go
  [add the instrumentation lines from the README]
  go test -run 3A
  npx raftviz

GitHub: https://github.com/YOUR_GITHUB/RAFT-VIZ
Demo: https://YOUR_GITHUB.github.io/RAFT-VIZ

It is especially helpful for debugging elections, seeing which server timed
out first, and spotting when replication or leadership transitions stop
making sense.
