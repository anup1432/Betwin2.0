require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const depositRoute = require('./routes/deposit');
const withdrawalRoute = require('./routes/withdrawal');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/deposit', depositRoute);
app.use('/api/withdrawal', withdrawalRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
