const express = require("express");
const RoomController = require("../controllers/room.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

//*-----------------------------------Room Control routes------------------------------
router.get("", Auth, RoomController.getRooms);
router.post("/create", Auth, RoomController.createRoom);
router.get("/:roomName/join", Auth, RoomController.joinRoom);
router.get("/:roomName/quit", Auth, RoomController.quitRoom);
router.get("/:roomName/get", Auth, RoomController.getSingleRoom);

//*-----------------------------------Game Routes--------------------------------------
router.post("/:roomName/word", Auth, RoomController.pushWord);
router.get("/:roomName/vote", Auth, RoomController.playerVote);
router.get("/:roomName/start", Auth, RoomController.startGame);
router.get("/:roomName/abort", Auth, RoomController.abortGame);
router.post("/:roomName/vote", Auth, RoomController.voteFor);

module.exports = router;
