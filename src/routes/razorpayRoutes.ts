import express from 'express';
import Razorpay from 'razorpay';
import Order from '../models/Order';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';

const router = express.Router();

const razorpayKeyId = 'rzp_test_XK1F4en52kNZlN';
const razorpayKeySecret = 'AfXiD3xggBlQRf6fPdDcF6Bk';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});


// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { orderId, totalAmount } = req.body;

    const options = {
      amount: totalAmount * 100, // in paise
      currency: 'INR',
      receipt: orderId, // your frontend-generated orderId
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save Razorpay order_id to your Order
    await Order.findOneAndUpdate(
      { orderId },
      { razorpayOrderId: razorpayOrder.id }
    );

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).send('Error creating Razorpay order');
  }
});


router.post('/verify-payment', async (req, res) => {
    console.log('🔔 /verify-payment called with:', req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // const secret = razorpay.key_secret;
    const secret = razorpayKeySecret;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  
    try {
        const isValid = validateWebhookSignature(body, razorpay_signature, secret);
        if (isValid) {
            // Find the order by Razorpay order ID
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                paymentStatus: 'Paid',
                },
                { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

            return res.status(200).json({ status: 'ok' });
        } else {
            return res.status(400).json({ status: 'invalid_signature' });
        }
    } catch (err) {
      console.error('Payment verification failed:', err);
      console.log('Payment verification failed:', err);
      return res.status(500).json({ status: 'error' });
    }
});

export default router;
  