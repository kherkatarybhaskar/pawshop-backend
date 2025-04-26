import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Store base64 or image URL
  }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
