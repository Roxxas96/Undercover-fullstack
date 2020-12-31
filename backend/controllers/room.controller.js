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
