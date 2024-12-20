const mongoose = require('mongoose');

const semSchema = new mongoose.Schema({
    sem: {
        type: String,
        required: true,
    },
    branch: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }]
});

const Semester = mongoose.model('Semester', semSchema);

module.exports = Semester;