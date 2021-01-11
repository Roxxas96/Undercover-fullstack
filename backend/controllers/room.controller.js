const Room = require("../models/room.model");

const jwt = require("jsonwebtoken");

let Rooms = [];

//Get userId from headers
getUserId = (req) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(
    token,
    "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p"
  );
  const userId = decodedToken.userId;
  return userId;
};

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  return res.status(200).json({ result: Rooms });
};

exports.getSingleRoom = (req, res, next) => {
  return res.status(200).json({ result: Rooms[req.params.roomId] });
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
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  if (
    Rooms[req.params.roomId].players.find((val) => val.userId == getUserId(req))
  )
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  //Not needed in theory
  if (
    Rooms[req.params.roomId].players.length >=
    Rooms[req.params.roomId].max_players
  )
    return res.status(401).json({ error: "La salle est pleine !" });
  Rooms[req.params.roomId].players.push({ userId: getUserId(req), words: [] });
  return res.status(200).json({ message: "Salle rejoint !" });
};

exports.quitRoom = (req, res, next) => {
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  const index = Rooms[req.params.roomId].players
    .map(function (e) {
      return e.userId;
    })
    .indexOf(getUserId(req));
  if (index == -1)
    return res.status(400).json({
      error: "Cet user n'est pas dans la parite !",
      test: Rooms[req.params.roomId].players,
    });
  Rooms[req.params.roomId].players.splice(index, 1);
  return res.status(200).json({ message: "Salle quitée !" });
};
