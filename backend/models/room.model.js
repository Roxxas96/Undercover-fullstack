class Room {
  constructor(name, max_players, players, gameState, host) {
    this.name = name;
    this.max_players = max_players;
    this.players = players;
    this.gameState = gameState;
    this.host = host;
  }
}

module.exports = Room;
