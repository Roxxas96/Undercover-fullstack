class Player {
  constructor(userId, words, vote, word, voteFor, score) {
    this.userId = userId;
    this.words = words;
    this.vote = vote;
    this.word = word;
    this.voteFor = voteFor;
    this.score = score;
  }
}

module.exports = Player;
