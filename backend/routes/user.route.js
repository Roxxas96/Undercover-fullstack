const express = require("express");
const UserController = require("../controllers/user.controller");

const router = express.Router();

router.get("/get", UserController.getConnectedPlayers);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("", UserController.auth);

module.exports = router;
