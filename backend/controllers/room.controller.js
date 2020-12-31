let Rooms = [{ name: "couddddddddddddcou", players: "4/10" }];

exports.getRooms = (req, res, next) => {
  return res.status(200).json({ message: Rooms });
};
