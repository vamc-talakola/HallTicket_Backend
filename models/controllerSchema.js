const mongoose = require('mongoose');

const ControllerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  });

const Controller = mongoose.model('Controller', ControllerSchema);


module.exports = Controller;