const mongoose = require('mongoose');

const HallTicketSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    hallTicketNumber: { type: String, required: true, unique: true },
    examCenter: { type: String, required: true },
    issuedDate: { type: Date, default: Date.now },
    qrCode: { type: String, required: true },
});

const HallTicket = mongoose.model('HallTicket', HallTicketSchema);

module.exports = HallTicket;