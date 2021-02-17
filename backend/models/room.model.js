class Room {
  constructor(name, max_players, players, gameState, host) {
    //Name : String
    this.name = name;
    //Max_players : Number
    this.max_players = max_players;
    //Players : Player[]
    this.players = players;
    //GameState : Number
    this.gameState = gameState;
    //Host : Player
    this.host = host;
  }
}

module.exports = Room;
