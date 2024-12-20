const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        unique: true
    },
    photo:{
        type: String
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: [String],
        enum: ['invigilator', 'user', 'controller'],
        default: ['user']
    },
    approved: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;