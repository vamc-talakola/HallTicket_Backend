const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    category: { type: String, enum: ["General","EWS","OBC","SC","ST"], required: true },
    temporaryAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    sub_caste:{type:String,required:true},
    maritalStatus: { type: String, required: true, enum: ["UnMarried","Married","Divorced","Widow","Widower","Jidicially Separated"] },
    password: { type: String, required: true },
    contactInfo: {
      mobileNumber: { type: String, unique: true, required: true },
      email: { type: String, unique: true, required: true }
    },
    educationInfo: {
      highSchool: { schoolName: String, rollNo: String, percentage: Number,yearOfPassing:Number },
      intermediate: { schoolName: String, rollNo: String, percentage: Number,stream:String,yearOfPassing:Number },
      graduation: { schoolName: String, rollNo: String, percentage: Number,yearOfPassing:Number },
    },
    examPreferences: {
      state: String,
      cities: [String]
    },
    isDisabled: { type: Boolean,required: true ,default:false},
    disabilityType: { type: String, required: function() { return this.isDisabled; },enum: ["Visual Impairment","Hearing Impairment","Locomotor Disability","Mental Illness","Multiple Disabilities","Others"] },
    nationality: { type: String, required: true },
    photo: { type: String, required: true },
    signature: { type: String, required: true },
    idProof:{type: String, enum: ["Aadhar","Voter","Passport","Driving License"], required: true},
    idProofNumber:{type: String, required: true},
    hallTicketGenerated: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentStatus:{type:Boolean,defalut:false},
    hallticketRequestSent:{type:Boolean,defalut:false},
    reviewedAt: { type: Date },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Controller' }
});
  

const Candidate = mongoose.model('Candidate', CandidateSchema);

module.exports = Candidate;
