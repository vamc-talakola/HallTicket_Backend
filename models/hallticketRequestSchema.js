const mongoose = require('mongoose');

const hallTicketRequestSchema = new mongoose.Schema({
    rollNumber: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    sem: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    approved: {
        type: Boolean,
        default: false
    },
    feesPaid: {
        type: Boolean,
        required: true
    },
    referenceNumber: {
        type: String,
        required: function() { return this.feesPaid; }
    }
});

const HallTicketRequest = mongoose.model('HallTicketRequest', hallTicketRequestSchema);

module.exports = HallTicketRequest;