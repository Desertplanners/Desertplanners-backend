import express from "express";
import { addToCart, getCart, removeItem, clearCart } from "../controllers/cartController.js";
const router = express.Router();

router.post("/add", addToCart);
router.get("/:userId", getCart);
router.delete("/remove/:userId/:itemId", removeItem);
router.delete("/clear/:userId", clearCart);

export default router;
