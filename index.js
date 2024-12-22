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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

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
      res.json(candidates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.put('/candidate/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const candidate = await Candidate.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      res.json(candidate);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.delete('/candidates/:id', async (req, res) => {
    try {
      const deletedCandidate = await Candidate.findByIdAndDelete(req.params.id);
      if (!deletedCandidate) return res.status(404).json({ error: 'Candidate not found' });
  
      res.status(200).json({ message: 'Candidate deleted successfully' });
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
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.post('/generate-hallticket', async (req, res) => {
    const { candidateId, examCenter } = req.body;
    const candidate = await Candidate.findById(candidateId);
  
    if (!candidate || candidate.hallTicketGenerated)
      return res.status(400).json({ error: 'Invalid candidate or hall ticket already generated' });
  
    const hallTicketNumber = `HT-${Date.now()}`;
    const qrData = JSON.stringify({ candidateId, hallTicketNumber, examCenter });
  
    try {
      const qrCode = await QRCode.toDataURL(qrData);
      const hallTicket = new HallTicket({
        candidateId,
        hallTicketNumber,
        examCenter,
        qrCode
      });
  
      await hallTicket.save();
      candidate.hallTicketGenerated = true;
      await candidate.save();
      res.status(201).json(hallTicket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.get('/hallticket/:id', async (req, res) => {
    const { id } = req.params;
    const hallTicket = await HallTicket.findOne({ candidateId: id }).populate('candidateId');
  
    if (!hallTicket) return res.status(404).json({ error: 'Hall Ticket not found' });
  
    res.json(hallTicket);
});

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
            app.listen(process.env.PORT || 3000, () => {
                console.log("Node.js server is running on port 3000");
            });
            console.log("MongoDB connected");
        })
        .catch((err) => {
            console.log(err);
        });
}



