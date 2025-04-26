import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import authMiddleware from '../middlewares/authMiddleware';


const router = express.Router();

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
}

router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  // console.log(req);
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      userName: user.userName,
      isAdmin: user.isAdmin, // Include isAdmin in response
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/signup', async (req, res) => {
    const { userName, email, password } = req.body;

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
        userName,
        email,
        password: hashedPassword,
        isAdmin: false, // Default to false
      });
  
      await newUser.save();
  
      // Create JWT
      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, isAdmin: newUser.isAdmin },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
  
      res.status(201).json({ token, userId: newUser._id, isAdmin: newUser.isAdmin });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Create JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, isAdmin: user.isAdmin },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );
  
      res.status(200).json({ token, userId: user._id, isAdmin: user.isAdmin });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
});
  

export default router;
