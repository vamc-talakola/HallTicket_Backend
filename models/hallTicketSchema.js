const mongoose = require('mongoose');

const hallTicketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    // photo: {
    //     type: String,
    //     required: true
    // },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    branch: {
        type: String,
        required: true
    },
    sem: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    qrCodeUrl: {
        type: String,
        required: true
    },
    subjects: [{
        subcode_name: {
            type: String,
            required: true
        },
        exam_date: {
            type: Date,
            required: true
        },
        starttime: {
            type: String,
            required: true
        },
        endtime: {
            type: String,
            required: true
        }
    }]
});

const HallTicket = mongoose.model('HallTicket', hallTicketSchema);

module.exports = HallTicket;