const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    name: String,
    language: String,
    caregiverName: String,
    caregiverPhone: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);