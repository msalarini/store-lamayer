const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const productRoutes = require('./src/routes/products');
const authMiddleware = require('./src/middleware/auth');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('Store Lamayer API is running');
});

// Routes
app.use('/api/products', authMiddleware, productRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
