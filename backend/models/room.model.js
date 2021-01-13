function Room(name, max_players, players, gameTimeout, host) {
  this.name = name;
  this.max_players = max_players;
  this.players = players;
  this.gameTimeout = gameTimeout;
  this.host = host;
}

module.exports = Room;
