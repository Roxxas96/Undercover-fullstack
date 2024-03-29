const express = require("express");
const RoomController = require("../controllers/room.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

//*-----------------------------------Room Control routes------------------------------
router.get("", Auth, RoomController.getRooms);
router.post("/create", Auth, RoomController.createRoom);
router.post("/:roomName/modify", Auth, RoomController.modifyRoom);
router.get("/:roomName/join", Auth, RoomController.joinRoom);
router.get("/:roomName/quit", Auth, RoomController.quitRoom);
router.get("/:roomName/get", Auth, RoomController.getSingleRoom);

//*-----------------------------------Game Routes--------------------------------------
router.post("/:roomName/word", Auth, RoomController.pushWord);
router.get("/:roomName/vote", Auth, RoomController.playerVote);
router.get("/:roomName/start", Auth, RoomController.startGame);
router.get("/:roomName/abort", Auth, RoomController.abortGame);
router.post("/:roomName/vote", Auth, RoomController.voteFor);
router.post("/:roomName/kick", Auth, RoomController.voteKick);

router.post("/chat", Auth, RoomController.chat);
router.get("/chat", Auth, RoomController.getChat);

module.exports = router;
