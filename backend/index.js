require('dotenv').config();
const express = require('express');
const passwordResetRoutes = require('./routes/passwordReset');

const app = express();
app.use(express.json());

app.use('/api', passwordResetRoutes);

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
