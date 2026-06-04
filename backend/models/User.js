const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phone: String,
    name: String,
    age: Number,
    disease: String,
});

module.exports = mongoose.model("User", userSchema);