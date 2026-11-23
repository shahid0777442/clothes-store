const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const Product = mongoose.model("Product", new mongoose.Schema({
  name: String, category: String, price: Number, image: String, stock: { type: Number, default: 50 }
}));
const Order = mongoose.model("Order", new mongoose.Schema({
  customer: String, items: [{ productId: String, name: String, qty: Number, price: Number }],
  total: Number, createdAt: { type: Date, default: Date.now }
}));

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.get("/api/products", async (_, res) => res.json(await Product.find()));
app.post("/api/products", async (req, res) => res.status(201).json(await Product.create(req.body)));
app.post("/api/orders", async (req, res) => {
  const { customer, items } = req.body;
  if (!customer || !items?.length) return res.status(400).json({ error: "customer and items required" });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  res.status(201).json(await Order.create({ customer, items, total }));
});
app.get("/api/orders", async (_, res) => res.json(await Order.find().sort({ createdAt: -1 })));
// CPU load generator for HPA demo
app.get("/api/load", (_, res) => { let x = 0; for (let i = 0; i < 5e7; i++) x += Math.sqrt(i); res.json({ x }); });

async function start() {
  const url = process.env.MONGO_URL || "mongodb://localhost:27017/clothes";
  for (let i = 0; i < 20; i++) {
    try { await mongoose.connect(url); break; }
    catch (e) { console.log("Mongo wait...", i); await new Promise(r => setTimeout(r, 3000)); }
  }
  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany([
      { name: "Classic White Tee", category: "Men", price: 1500, image: "👕" },
      { name: "Denim Jacket", category: "Men", price: 6500, image: "🧥" },
      { name: "Floral Summer Dress", category: "Women", price: 4800, image: "👗" },
      { name: "Kurta Shalwar", category: "Men", price: 5200, image: "🥻" },
      { name: "Kids Hoodie", category: "Kids", price: 2900, image: "🧶" },
      { name: "Sneakers", category: "Unisex", price: 7900, image: "👟" }
    ]);
  }
  app.listen(3000, () => console.log("Clothes store running on :3000"));
}
start();
