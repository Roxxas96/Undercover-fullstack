const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const wordSchema = mongoose.Schema({
  words: { type: String, required: true, unique: true },
  fame: { type: Number, required: true },
}, 'words');

wordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Words_rezo", wordSchema);
