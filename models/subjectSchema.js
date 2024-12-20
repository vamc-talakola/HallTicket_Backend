const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subcode_name: {
        type: String,
        required: true,
        unique: true
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
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;