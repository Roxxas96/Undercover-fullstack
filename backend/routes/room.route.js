const express = require("express");
const RoomController = require("../controllers/room.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

router.get("", Auth, RoomController.getRooms);
router.get("/get/:roomId", Auth, RoomController.getSingleRoom);
router.post("/create", Auth, RoomController.createRoom);
router.get("/join/:roomId", Auth, RoomController.joinRoom);
router.get("/quit/:roomId", Auth, RoomController.quitRoom);

module.exports = router;
