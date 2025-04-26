import express from 'express';
import Order from '../models/Order';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
}

// Place a new order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId, address, products, totalAmount, paymentStatus } = req.body

    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ error: "Invalid order data" })
    }

    const newOrder = new Order({
      userId,
      products,
      address,
      totalAmount,
      paymentStatus,
      orderId: new Date().toISOString().replace(/[-:.TZ]/g, "") // optional
    })

    await newOrder.save()
    res.status(201).json({ message: "Order placed successfully", order: newOrder, orderId: newOrder.orderId })
  } catch (err) {
    console.error("Error saving order:", err)
    res.status(500).json({ error: "Server error while placing order" })
  }
})

// Get all orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({})
      .select('totalAmount paymentStatus orderStatus razorpayOrderId _id')
      .sort({ createdAt: -1 }); //latest first
    res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error while fetching orders" });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if(!req.user) {
      return res.status(400).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id; // assuming authMiddleware attaches the user to req

    const orders = await Order.find({ userId })
      .select('totalAmount paymentStatus orderStatus razorpayOrderId _id createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching user's orders:", err);
    res.status(500).json({ error: "Server error while fetching user's orders" });
  }
});


// Update order status by ID
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ error: 'Order status is required' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Server error while updating order status" });
  }
});

// Get a single order with populated product details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'products.productId',
        model: 'Product', // Make sure your Product model is exported correctly
        select: 'name image category description price' // Fields you want to fetch from Product
      });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Server error while fetching order' });
  }
});

export default router;
