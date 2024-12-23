const mongoose = require('mongoose');

const HallTicketRequestSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate', // Reference to the Candidate schema
        required: true
    },
    paymentStatus: {
        type: Boolean, // Indicates whether the payment has been completed
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'], // Track the status of the request
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Controller' // Reference to the Controller who reviewed the request
    }
});

module.exports = mongoose.model('HallTicketRequest', HallTicketRequestSchema);
