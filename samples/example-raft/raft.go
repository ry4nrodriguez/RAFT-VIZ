package raft

import "raftviz"

type Raft struct {
	me          int
	currentTerm int
	role        string
}

func Make(peers []int, me int) *Raft {
	rf := &Raft{
		me:   me,
		role: "follower",
	}

	raftviz.Init(len(peers))
	raftviz.LogStateChange(rf.me, 0, "init", "follower")
	return rf
}

func (rf *Raft) becomeCandidate() {
	oldRole := rf.role
	rf.role = "candidate"
	rf.currentTerm++
	raftviz.LogElectionTimeout(rf.me, rf.currentTerm)
	raftviz.LogStateChange(rf.me, rf.currentTerm, oldRole, "candidate")
}

func (rf *Raft) becomeLeader() {
	oldRole := rf.role
	rf.role = "leader"
	raftviz.LogStateChange(rf.me, rf.currentTerm, oldRole, "leader")
}

func (rf *Raft) stepDown(newTerm int) {
	oldRole := rf.role
	rf.currentTerm = newTerm
	rf.role = "follower"
	raftviz.LogStateChange(rf.me, rf.currentTerm, oldRole, "follower")
}

func (rf *Raft) sendVoteRequest(server int) {
	raftviz.LogVoteRequest(rf.me, server, rf.currentTerm)
}

func (rf *Raft) handleVote(candidateID int, grant bool) {
	if grant {
		raftviz.LogVoteGranted(candidateID, rf.me, rf.currentTerm)
		return
	}
	raftviz.LogVoteDenied(candidateID, rf.me, rf.currentTerm)
}

func (rf *Raft) sendAppend(server int, entryCount int) {
	raftviz.LogAppendEntries(rf.me, server, rf.currentTerm, entryCount)
}

func (rf *Raft) handleAppendResponse(leaderID int, success bool) {
	raftviz.LogAppendResponse(leaderID, rf.me, rf.currentTerm, success)
}

func (rf *Raft) apply(index int, command string) {
	raftviz.LogCommit(rf.me, rf.currentTerm, index, command)
}
