package raft

import "raftvis"

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

	raftvis.Init(len(peers))
	raftvis.LogStateChange(rf.me, 0, "init", "follower")
	return rf
}

func (rf *Raft) becomeCandidate() {
	oldRole := rf.role
	rf.role = "candidate"
	rf.currentTerm++
	raftvis.LogElectionTimeout(rf.me, rf.currentTerm)
	raftvis.LogStateChange(rf.me, rf.currentTerm, oldRole, "candidate")
}

func (rf *Raft) becomeLeader() {
	oldRole := rf.role
	rf.role = "leader"
	raftvis.LogStateChange(rf.me, rf.currentTerm, oldRole, "leader")
}

func (rf *Raft) stepDown(newTerm int) {
	oldRole := rf.role
	rf.currentTerm = newTerm
	rf.role = "follower"
	raftvis.LogStateChange(rf.me, rf.currentTerm, oldRole, "follower")
}

func (rf *Raft) sendVoteRequest(server int) {
	raftvis.LogVoteRequest(rf.me, server, rf.currentTerm)
}

func (rf *Raft) handleVote(candidateID int, grant bool) {
	if grant {
		raftvis.LogVoteGranted(candidateID, rf.me, rf.currentTerm)
		return
	}
	raftvis.LogVoteDenied(candidateID, rf.me, rf.currentTerm)
}

func (rf *Raft) sendAppend(server int, entryCount int) {
	raftvis.LogAppendEntries(rf.me, server, rf.currentTerm, entryCount)
}

func (rf *Raft) handleAppendResponse(leaderID int, success bool) {
	raftvis.LogAppendResponse(leaderID, rf.me, rf.currentTerm, success)
}

func (rf *Raft) apply(index int, command string) {
	raftvis.LogCommit(rf.me, rf.currentTerm, index, command)
}
