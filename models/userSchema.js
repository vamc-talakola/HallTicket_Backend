const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    category: { type: String, enum: ['SC', 'ST', 'BC', 'EBC', 'ENS'], required: true },
    maritalStatus: { type: String, required: true },
    password: { type: String, required: true },
    contactInfo: {
      mobileNumber: { type: String, unique: true, required: true },
      email: { type: String, unique: true, required: true }
    },
    educationInfo: {
      highSchool: { schoolName: String, rollNo: String, percentage: Number },
      intermediate: { schoolName: String, rollNo: String, percentage: Number },
      graduation: { schoolName: String, rollNo: String, percentage: Number }
    },
    examPreferences: {
      state: String,
      cities: [String]
    },
    photo: { type: String, required: true },
    signature: { type: String, required: true },
    hallTicketGenerated: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentStatus:{type:Boolean,defalut:false},
    hallticketRequestSent:{type:Boolean,defalut:false},
    reviewedAt: { type: Date },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Controller' }
});
  

const Candidate = mongoose.model('Candidate', CandidateSchema);

module.exports = Candidate;
