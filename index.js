const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/userSchema');
const HallTicketRequest = require('./models/hallticketRequestSchema');
const HallTicket = require('./models/hallTicketSchema');
const Semester = require('./models/semSchema');
const Subject = require('./models/subjectSchema');
const cors = require('cors');
const QRCode = require('qrcode');
const app = express()
dotenv.config();
const jwt = require('jsonwebtoken');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});

app.post('/api/auth/register', async (req, res) => {
    const { rollNumber, phone, address, name, email, password, role,photo } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            rollNumber,
            phone,
            address,
            name,
            email,
            password: hashedPassword,
            role,
            photo
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login API
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if user is approved if the role is 'user'
        if (user.role.includes('user') && !user.approved) {
            return res.status(403).json({ message: 'Your Account is not approved' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/user/approve', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.approved = true;
        await user.save();

        res.status(200).json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/user/reject', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/semesters', async (req, res) => {
    const { sem, branch, year, subjects } = req.body;

    try {
        // Check if the semester details already exist
        const existingSemester = await Semester.findOne({ sem, branch, year });
        if (existingSemester) {
            return res.status(400).json({ message: 'Semester with the same year, branch, and sem already exists' });
        }

        // Create subjects
        const subjectIds = [];
        for (const subject of subjects) {
            const newSubject = new Subject({
                subcode_name: subject.subcode_name,
                exam_date: subject.exam_date,
                starttime: subject.starttime,
                endtime: subject.endtime
            });
            await newSubject.save();
            subjectIds.push(newSubject._id);
        }

        // Create semester
        const newSemester = new Semester({
            sem,
            branch,
            year,
            subjects: subjectIds
        });

        await newSemester.save();
        res.status(201).json({ message: 'Semester and subjects added successfully', semester: newSemester });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/api/hallticket/requests', async (req, res) => {
    try {
        const requests = await HallTicketRequest.find();
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/api/hallticket/requests/:rollNumber', async (req, res) => {
    const { rollNumber } = req.params;

    try {
        const requests = await HallTicketRequest.find({ rollNumber });
        if (requests.length === 0) {
            return res.status(404).json({ message: 'No hall ticket requests found for this roll number' });
        }
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/hallticket/request', async (req, res) => {
    const { rollNumber, year, sem, branch, feesPaid, referenceNumber } = req.body;

    try {
        // Check if the semester details exist
        const semester = await Semester.findOne({ sem, branch, year });
        if (!semester) {
            return res.status(404).json({ message: 'Semester details not found' });
        }

        const newRequest = new HallTicketRequest({
            rollNumber,
            year,
            sem,
            branch,
            feesPaid,
            referenceNumber
        });

        await newRequest.save();
        res.status(201).json({ message: 'Hall ticket request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/hallticket/approve', async (req, res) => {
    const { requestId, name } = req.body;

    try {
        const request = await HallTicketRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // if (!request.feesPaid) {
        //     return res.status(400).json({ message: 'Fees not paid' });
        // }

        // Find the semester details to get the start date
        request.approved = true;
        await request.save();
        const semester = await Semester.findOne({
            sem: request.sem,
            branch: request.branch,
            year: request.year
        }).populate('subjects');

        if (!semester || !semester.subjects || semester.subjects.length === 0) {
            return res.status(404).json({ message: 'Semester details not found' });
        }

        const startDate = semester.subjects[0].exam_date;

        // Generate QR code
        const qrCodeData = `${request.rollNumber}-${request.sem}`;
        const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

        // Create hall ticket
        const hallTicket = new HallTicket({
            name,
            rollNumber: request.rollNumber,
            branch: request.branch,
            sem: request.sem,
            startDate,
            qrCodeUrl,
            subjects: semester.subjects.map(subject => ({
                subcode_name: subject.subcode_name,
                exam_date: subject.exam_date,
                starttime: subject.starttime,
                endtime: subject.endtime
            }))
        });

        await hallTicket.save();
        res.status(200).json({ message: 'Hall ticket request approved and hall ticket generated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/hallticket/request/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const request = await HallTicketRequest.findByIdAndDelete(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Hall ticket request not found' });
        }

        res.status(200).json({ message: 'Hall ticket request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/hallticket/get', async (req, res) => {
    const { rollNumber, year, sem, branch } = req.body;

    try {
        // Check if the hall ticket request is approved
        const request = await HallTicketRequest.findOne({ rollNumber, year, sem, branch, approved: true });
        if (!request) {
            return res.status(404).json({ message: 'Approved hall ticket request not found' });
        }

        // Find the hall ticket details
        const hallTicket = await HallTicket.findOne({ rollNumber, sem, branch });
        if (!hallTicket) {
            return res.status(404).json({ message: 'Hall ticket not found' });
        }

        res.status(200).json(hallTicket);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/hallticket/verify', async (req, res) => {
    const { qrData } = req.body;

    try {
        // Validate QR data format
        const qrDataPattern = /^[A-Za-z0-9]+-[A-Za-z0-9]+$/;
        if (!qrDataPattern.test(qrData)) {
            return res.status(400).json({ message: 'Invalid Hall Ticket' });
        }

        // Extract roll number and semester from QR data
        const [rollNumber, sem] = qrData.split('-');

        // Find the hall ticket with the matching roll number and semester
        const hallTicket = await HallTicket.findOne({ rollNumber, sem });
        if (!hallTicket) {
            return res.status(404).json({ message: 'Hall ticket not found' });
        }

        res.status(200).json({ message: 'Verification passed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in your .env file.");
} else {
    // Attempt to connect to MongoDB using process.env.MONGODB_URI
    mongoose
        .connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME
        })
        .then(() => {
            app.listen(process.env.PORT || 3000, () => {
                console.log("Node.js server is running on port 3000");
            });
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.log(err);
        });
}



