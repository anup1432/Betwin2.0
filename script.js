const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const depositRoute = require('./routes/deposit');
const withdrawRoute = require('./routes/withdraw');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/deposit', depositRoute);
app.use('/api/withdraw', withdrawRoute);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected!"))
.catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
