const Room = require("../models/room.model");

let Rooms = [];

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  return res.status(200).json({ result: Rooms });
};

//Create room, create a room and push it to Rooms array
exports.createRoom = (req, res, next) => {
  //Name must be unique
  if (Rooms.find((val) => val.name === req.body.roomName))
    return res.status(400).json({ error: "Nom de salle déjà pris !" });
  //Not needed in theory
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 2)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  let index = Rooms.length;
  //Push array
  Rooms.push({
    name: req.body.roomName,
    max_players: req.body.maxPlayers,
    players: [],
  });
  //Return index of created room
  return res.status(201).json({ message: "Salle créée !", result: index });
};

exports.joinRoom = (req, res, next) => {
  if (Rooms.find((val) => val.players.userId === req.body.userId))
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  if (!Rooms[req.params.roomId])
    return res.status(400).json({ error: "Cette salle existe déjà !" });
  Rooms[req.params.roomId].players.push({ userId: req.body.userId });
  return res.status(200).json({ message: "Salle rejoint !" });
};
