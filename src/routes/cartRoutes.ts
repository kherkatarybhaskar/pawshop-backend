import express from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

// Add to cart
router.post('/add', authMiddleware, async (req, res) => {
    const { userId, productId, quantity } = req.body;

    // Fetch product details to get unit price
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const unitPrice = product.price;
    const totalAmount = unitPrice * quantity;

    let cart = await Cart.findOne({ userId });
    if (cart) {
        // If product already in cart, update quantity and totalAmount
        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
        if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity;
            cart.products[productIndex].totalAmount = cart.products[productIndex].quantity * unitPrice;
        } else {
            cart.products.push({ productId, quantity, unitPrice, totalAmount });
        }
    } else {
        // Create new cart
        cart = new Cart({
            userId,
            products: [{ productId, quantity, unitPrice, totalAmount }]
        });
    }

    await cart.save();
    res.status(200).json(cart);
});

router.post('/remove', authMiddleware, async (req, res) => {
    const { userId, productId } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Product not in cart' });
    }

    const product = cart.products[productIndex];

    if (product.quantity > 1) {
        // ✅ Reduce quantity and update total amount
        product.quantity -= 1;
        product.totalAmount = product.quantity * product.unitPrice;
    } else {
        // ✅ Remove product from cart if quantity is 1
        cart.products.splice(productIndex, 1);
    }

    // ✅ If cart is empty, delete it
    if (cart.products.length === 0) {
        await Cart.findOneAndDelete({ userId });
        return res.status(200).json({ message: 'Cart is empty' });
    }

    await cart.save();
    res.status(200).json(cart);
});


router.post('/delete', authMiddleware, async (req, res) => {
    const { userId, productId } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    // ✅ Use .pull() to remove the product
    cart.products.pull({ productId });

    // ✅ If cart is empty, delete it
    if (cart.products.length === 0) {
        await Cart.deleteOne({ userId });
        return res.status(200).json({ message: 'Cart is empty' });
    }

    await cart.save();
    res.status(200).json(cart);
});




// ✅ Read cart
router.get('/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      const cart = await Cart.findOne({ userId }).populate('products.productId');
  
      if (!cart) {
        return res.status(404).json({ message: 'Cart is empty' });
      }
  
      res.status(200).json(cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      res.status(500).json({ message: 'Server error' });
    }
});



// ✅ Get total count of items in cart
router.get('/count/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(200).json({ totalCount: 0 });
        }

        const totalCount = cart.products.reduce((sum, item) => sum + item.quantity, 0);
        
        res.status(200).json({ totalCount });
    } catch (error) {
        console.error('Failed to fetch cart count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
  

export default router;
  