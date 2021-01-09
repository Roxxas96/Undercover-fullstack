const express = require("express");
const UserController = require("../controllers/user.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

router.get("/players", Auth, UserController.getConnectedPlayers);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.get("", UserController.auth);

module.exports = router;
