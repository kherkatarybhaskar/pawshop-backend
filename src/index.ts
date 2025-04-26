import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import categoriesRoutes from './routes/categoriesRoutes';
import productsRoutes from './routes/productsRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import razorpayRoutes from './routes/razorpayRoutes';

dotenv.config();

const app = express();

// Increase body-parser size limit
app.use(express.json({ limit: '10mb' })); // Adjust the limit as needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors());
app.use(express.json()); // For JSON request body

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/razorpay',razorpayRoutes);


const PORT = process.env.PORT || 5000;

// Sample route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.error('MongoDB connection error:', error));
