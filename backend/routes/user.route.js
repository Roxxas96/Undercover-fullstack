const express = require("express");
const UserController = require("../controllers/user.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

router.get("/players", Auth, UserController.getConnectedPlayers);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/recover", UserController.recoverPassword);
router.get("/recover/:code", UserController.recoverRequest);
router.post("/recover/:code", UserController.changePassword);
router.get("/logout", UserController.logout);
router.get("", UserController.auth);

module.exports = router;
