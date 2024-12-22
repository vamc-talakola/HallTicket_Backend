const mongoose = require('mongoose');

const InvigilatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Invigilator = mongoose.model('Invigilator', InvigilatorSchema);

module.exports = Invigilator;
  