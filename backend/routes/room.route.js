const express = require("express");
const RoomController = require("../controllers/room.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

router.get("", Auth, RoomController.getRooms);

module.exports = router;
