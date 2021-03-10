class Player {
  constructor(userId, words, vote, word, voteFor, score, kick) {
    //UserId : String
    this.userId = userId;
    //Words : String[]
    this.words = words;
    //Vote : bool
    this.vote = vote;
    //Word : String
    this.word = word;
    //VoteFor : Number[]
    this.voteFor = voteFor;
    //Score : Number
    this.score = score;
    //Kick : Number[]
    this.kick = kick;
  }
}

module.exports = Player;
