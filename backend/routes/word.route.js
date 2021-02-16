const express = require("express");
const WordController = require("../controllers/word.controller");
const Auth = require("../middleware/Auth");

const router = express.Router();

router.post("", Auth, WordController.proposeWord);
router.post("/like/:like", Auth, WordController.likeWords);

module.exports = router;
