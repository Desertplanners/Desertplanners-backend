import Cart from "../models/Cart.js";

// Add item to cart
export const addToCart = async (req, res) => {
  const { userId, tourId, date, guests } = req.body;

  try {
    // userId should be a valid ObjectId string (from logged-in user)
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    cart.items.push({ tourId, date, guests });
    await cart.save();

    res.status(200).json({ message: "Added to cart", cart });
  } catch (err) {
    console.error("Cart Add Error:", err);
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
};

// Get user cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate("items.tourId");
    res.status(200).json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart" });
  }
};

// Remove item
export const removeItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    ).populate("items.tourId");
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error removing item" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing cart" });
  }
};
