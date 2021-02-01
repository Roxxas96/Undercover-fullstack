class Player {
  constructor(userId, words, vote, word, voteFor) {
    this.userId = userId;
    this.words = words;
    this.vote = vote;
    this.word = word;
    this.voteFor = voteFor;
  }
}

module.exports = Player;
