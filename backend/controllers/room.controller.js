const Room = require("../models/room.model");

let Rooms = [
  {
    name: "coucou",
    max_players: 8,
    players: [
      {
        userId: "",
      },
    ],
  },
];

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  return res.status(200).json({ result: Rooms });
};

exports.createRoom = (req, res, next) => {
  if (Rooms.find((val) => val.name === req.body.roomName))
    return res.status(400).json({ error: "Nom de salle déjà pris !" });
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 2)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  let index = Rooms.length;
  Rooms.push({
    name: req.body.roomName,
    max_players: req.body.maxPlayers,
    players: [],
  });
  return res.status(201).json({ message: "Salle créée !", result: index });
};
