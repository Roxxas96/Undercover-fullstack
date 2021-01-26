function Room(name, max_players, players, gameInProgress, host) {
  this.name = name;
  this.max_players = max_players;
  this.players = players;
  this.gameInProgress = gameInProgress;
  this.host = host;
}

module.exports = Room;
