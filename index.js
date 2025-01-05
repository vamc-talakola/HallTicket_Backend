const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Candidate = require('./models/userSchema');
const Invigilator = require('./models/invigilatorSchema');
const Controller = require('./models/controllerSchema');
const HallTicket = require('./models/hallTicketSchema');
const cors = require('cors');
const QRCode = require('qrcode');
const app = express()
dotenv.config();
const jwt = require('jsonwebtoken');
const HallTicketRequest = require('./models/hallticketRequestSchema');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const allowedOrigins = ['http://frontend1.com', 'http://frontend2.com']; // Replace with your actual frontend URLs

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      // Allow requests with no origin (like mobile apps or Postman)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // if you need to send cookies or other credentials
};

app.use(cors(corsOptions));
const nodemailer = require('nodemailer');

const sendEmail = (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your email address
            pass: process.env.EMAIL_PASS  // Your email password
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};


const otps = {};
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes

        // Send email with the OTP
        sendEmail(email, 'Your OTP for Verification', `Your OTP is: ${otp}`);

        res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const record = otps[email];
  if (!record) return res.status(400).json({ error: 'OTP not found' });

  if (record.otp !== parseInt(otp)) return res.status(400).json({ error: 'Invalid OTP' });

  if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });

  delete otps[email];
  res.status(200).json({ message: 'OTP verified successfully' });
});



app.post('/register', async (req, res) => {
    const { name, fatherName,motherName, dob, gender, category,maritalStatus, contactInfo,educationInfo, photo, signature, password,examPreferences } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingCandidate = await Candidate.findOne({ contactInfo });
        if (existingCandidate) {
            return res.status(400).json({ error: 'Candidate already exists' });
        }

        const candidate = new Candidate({
            ...req.body,
            password: hashedPassword
        });

        const savedCandidate = await candidate.save();
        res.status(201).json(savedCandidate);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const candidate = await Candidate.findOne({ 'contactInfo.email': email });
  
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  
    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });
  
    const token = jwt.sign({ id: candidate._id }, 'SECRET_KEY');
    res.json({ token, candidate });
});

app.get('/candidates', async (req, res) => {
    try {
      const candidates = await Candidate.find();
      res.json({data:candidates});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get('/candidate/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const candidate = await Candidate.findById(id);
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json(candidate);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.put('/update-payment-status', async (req, res) => {
    const { id, paymentStatus } = req.body;

    // Validate input
    if (!id || typeof paymentStatus !== 'boolean') {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        // Find the candidate by id and update the paymentStatus
        const candidate = await Candidate.findByIdAndUpdate(
            id,  // MongoDB ObjectId for candidate
            { $set: { paymentStatus } }, // Update operation
            { new: true }  // Return the updated document
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Return the updated candidate data
        res.status(200).json({
            message: 'Payment status updated successfully',
            candidate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/candidate/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, reviewerId } = req.body;

  try {
      // Validate the provided status
      const validStatuses = ['approved', 'rejected']; // Adjust based on your requirements
      if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
      }

      // Find the candidate
      const candidate = await Candidate.findById(id);
      if (!candidate) {
          return res.status(404).json({ error: 'Candidate not found' });
      }

      // Update status, reviewer information, and timestamps
      candidate.status = status;
      candidate.reviewedAt = new Date();
      candidate.reviewerId = reviewerId; // Ensure the reviewerId is provided

      // Send email notification based on status
      const emailSubject = `Your application status has been updated to ${status}`;
      const emailText = status === 'approved'
          ? `Dear ${candidate.name},\n\nYour application has been approved. You can proceed with the next steps.\n\nBest regards,\nThe Team`
          : `Dear ${candidate.name},\n\nYour application has been rejected. If you have questions, please contact us.\n\nBest regards,\nThe Team`;

      sendEmail(candidate.contactInfo.email, emailSubject, emailText);

      if (status === 'rejected') {
          await candidate.deleteOne();
          return res.status(200).json({ message: 'Candidate rejected and deleted' });
      } else {
          await candidate.save();
          return res.status(200).json({ message: `Candidate status updated to ${status}`, candidate });
      }
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});


app.post('/login/:role', async (req, res) => {
    const { role } = req.params;
    const { email, password } = req.body;
    const UserModel = role === 'invigilator' ? Invigilator : Controller;
  
    try {
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(404).json({ error: `${role} not found` });
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });
  
      const token = jwt.sign({ id: user._id, role }, 'SECRET_KEY');
      res.json({ token,user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

//get all hallticketrequests
app.get('/hallticket-requests', async (req, res) => {
    try {
        const requests = await HallTicketRequest.find().populate('candidateId').lean();
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/request-hallticket', async (req, res) => {
    const { candidateId, paymentStatus } = req.body;

    if (!candidateId || paymentStatus === undefined) {
        return res.status(400).json({
            error: 'candidateId and paymentStatus are required fields.'
        });
    }

    try {
        // Check if the hall ticket request already exists
        const existingRequest = await HallTicketRequest.findOne({ candidateId });
        if (existingRequest) {
            return res.status(400).json({ error: 'Hall ticket request already exists' });
        }

        // Create a new hall ticket request
        const newRequest = new HallTicketRequest({ candidateId:candidateId, paymentStatus });
        await newRequest.save();

        // Update the candidate's hallticketRequestSent field to true
        const candidate = await Candidate.findByIdAndUpdate(
            candidateId,
            { $set: { hallticketRequestSent: true } },
            { new: true }  // Return the updated document
        );

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        // Return the success response with the updated candidate data
        res.status(201).json({
            message: 'Hall ticket request submitted successfully',
            request: newRequest,
            candidate
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/approve-hallticket/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { status, reviewerId } = req.body;

  try {
    // Fetch the hall ticket request and populate candidate details
    const request = await HallTicketRequest.findById(requestId).populate('candidateId');
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const candidate = request.candidateId;
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Validate the status field
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update the request's status and other fields
    request.status = status;
    request.reviewedAt = new Date();
    request.reviewerId = reviewerId; // Set the reviewer ID
    await request.save();

    if (status === 'approved') {
      // Send approval email
      const message = `
        Dear ${candidate.name},
        Your hall ticket request has been approved! Your hall ticket will be generated soon.
        Please wait for further communication.
      `;
      sendEmail(candidate.contactInfo.email, 'Hall Ticket Request Approved', message);

      return res.status(200).json({ message: 'Request approved and email sent to candidate' });
    } else if (status === 'rejected') {
      // Update the candidate's hallticketRequestSent field
      await Candidate.findByIdAndUpdate(
        candidate._id,
        { $set: { hallticketRequestSent: false } },
        { new: true } // Return the updated document
      );

      // Delete the hall ticket request
      await request.deleteOne();

      // Send rejection email
      const message = `
        Dear ${candidate.name},
        We regret to inform you that your hall ticket request has been rejected. 
        Please contact support for more information.
      `;
      sendEmail(candidate.contactInfo.email, 'Hall Ticket Request Rejected', message);

      return res.status(200).json({ message: 'Request rejected and email sent to candidate' });
    }
  } catch (err) {
    // Return a server error if an exception occurs
    return res.status(500).json({ error: err.message });
  }
});


app.post('/generate-hallticket', async (req, res) => {
  const { candidateId, examCenter } = req.body;

  try {
      // Correct way to create an ObjectId instance
      const objectIdCandidateId = new mongoose.Types.ObjectId(candidateId); 

      // Find the candidate using the converted ObjectId
      const candidate = await Candidate.findById(objectIdCandidateId);

      if (!candidate || candidate.hallTicketGenerated) {
          return res.status(400).json({ error: 'Invalid candidate or hall ticket already generated' });
      }

      const hallTicketNumber = `HT-${Date.now()}`;
      const qrData = JSON.stringify({ candidateId, hallTicketNumber, examCenter });
      const qrCode = await QRCode.toDataURL(qrData);

      const hallTicket = new HallTicket({
          candidateId,
          hallTicketNumber,
          examCenter,
          qrCode,
      });

      await hallTicket.save();
      candidate.hallTicketGenerated = true;
      await candidate.save();

      // Send email with hall ticket details
      const message = `
          Dear ${candidate.name},
          Your hall ticket has been generated successfully.
          Hall Ticket Number: ${hallTicketNumber}.
          Go to the portal to download the hall ticket.
      `;
      sendEmail(candidate.contactInfo.email, 'Hall Ticket Generated', message);

      res.status(201).json(hallTicket);
  } catch (err) {
      res.status(400).json({ error: err.message });
  }
});

//get hall ticket by hallticketNumber
app.get('/hallticket/:hallTicketNumber', async (req, res) => {
    const { hallTicketNumber } = req.params;
    try {
        const hallTicket = await HallTicket.findOne({ hallTicketNumber });
        if (!hallTicket) return res.status(404).json({ error: 'Hall ticket not found' });
        res.json({hallTicket});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


app.post('/verify-qrcode', async (req, res) => {
    const { qrData } = req.body;
    try {
      const decodedData = JSON.parse(qrData);
      const hallTicket = await HallTicket.findOne({
        candidateId: decodedData.candidateId,
        hallTicketNumber: decodedData.hallTicketNumber
      });
  
      if (!hallTicket) return res.status(404).json({ error: 'Invalid QR Code' });
  
      res.json({ message: 'QR Code is valid', hallTicket });
    } catch (err) {
      res.status(400).json({ error: 'Invalid QR Code format' });
    }
});

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in your .env file.");
} else {
    mongoose
        .connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME
        })
        .then(() => {
            app.listen(process.env.PORT || 4000, () => {
                console.log("Node.js server is running on port 3000");
            });
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.log(err);
        });
}



