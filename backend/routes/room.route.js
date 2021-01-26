const express = require("express");
const RoomController = require("../controllers/room.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

//*-----------------------------------Room Control routes------------------------------
router.get("", Auth, RoomController.getRooms);
router.post("/create", Auth, RoomController.createRoom);
router.get("/:roomId/join", Auth, RoomController.joinRoom);
router.get("/:roomId/quit", Auth, RoomController.quitRoom);
router.get("/:roomId/get", Auth, RoomController.getSingleRoom);

//*-----------------------------------Game Routes--------------------------------------
router.post("/:roomId/word", Auth, RoomController.pushWord);
router.get("/:roomId/vote", Auth, RoomController.playerVote);
router.get("/:roomId/start", Auth, RoomController.startGame);
router.get("/:roomId/abort", Auth, RoomController.abortGame);

module.exports = router;
