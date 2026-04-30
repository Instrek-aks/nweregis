import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_olympiad';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Student Schema ---
const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  position: { type: Number, required: true },
  user_type: { type: String, required: true },
  courses: [{ type: String }],
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  institution: { type: String, required: true },
  pincode: { type: String, required: true },
  cohort: { type: String, default: 'June 2026' },
  joined_at: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// --- API Routes ---

// Get all students (Admin)
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ joined_at: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit waitlist entry
app.post('/api/students', async (req, res) => {
  try {
    const count = await Student.countDocuments();
    const position = count + 1;
    
    const newStudent = new Student({
      ...req.body,
      position
    });

    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get aggregate counts
app.get('/api/counts', async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const litigation = await Student.countDocuments({ courses: 'litigation' });
    const drafting = await Student.countDocuments({ courses: 'drafting' });
    const judgment = await Student.countDocuments({ courses: 'judgment' });
    const bundle = await Student.countDocuments({ courses: 'bundle' });

    res.json({
      total,
      litigation,
      drafting,
      judgment,
      bundle
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all students (Admin Only - Use with caution)
app.delete('/api/students', async (req, res) => {
  try {
    await Student.deleteMany({});
    res.json({ message: 'All student records have been cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
