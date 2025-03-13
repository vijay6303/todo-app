const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const MONGO_URL = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Define MongoDB schemas and models
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  priority: { type: String, default: 'Medium' },
  reminder: {
    enabled: { type: Boolean, default: false },
    notifications: { type: Number, default: 1 },
    interval: { type: Number, default: 5 },
  },
  subtasks: [{ type: String }],
  recurring: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
});

const Task = mongoose.model('Task', taskSchema);

// Routes

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// Add a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, category, priority, reminder, subtasks, recurring } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const newTask = new Task({
      title,
      category,
      priority,
      reminder,
      subtasks,
      recurring,
    });

    await newTask.save();
    res.status(201).json({ message: 'Task added successfully.', task: newTask });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add task.' });
  }
});

// Update a task
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    res.json({ message: 'Task updated successfully.', task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Mark a task as completed
app.post('/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.completed) return res.status(400).json({ error: 'Task is already completed.' });

    task.completed = true;
    await task.save();

    res.json({ message: 'Task marked as completed.', task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark task as completed.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
