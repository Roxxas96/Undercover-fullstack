class Room {
  constructor(
    name,
    max_players,
    undercovers,
    players,
    gameState,
    host,
    rememberedPlayers
  ) {
    //Name : String
    this.name = name;
    //Max_players : Number
    this.max_players = max_players;
    //Undercovers : Number
    this.undercovers = undercovers;
    //Players : Player[]
    this.players = players;
    //RememberedPlayers : Player[]
    this.rememberedPlayers = rememberedPlayers;
    //GameState : Number
    this.gameState = gameState;
    //Host : Player
    this.host = host;
  }
}

module.exports = Room;
