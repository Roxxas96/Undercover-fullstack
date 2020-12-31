const Room = require("../models/room.model");

let Rooms = [];

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  return res.status(200).json({ result: Rooms });
};
