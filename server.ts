import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";

// Server-side env (Stripe, etc.). Vite still loads GEMINI_API_KEY via vite.config loadEnv for the client bundle.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialize Stripe (only when STRIPE_SECRET_KEY is set)
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API: Create Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { userId, email } = req.body;
      const stripe = getStripe();
      if (!stripe) {
        console.warn("STRIPE_SECRET_KEY is missing; checkout disabled.");
        return res.status(503).json({
          error: "Stripe is not configured",
          url: null,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Cyberhound Pro Subscription",
                description: "Unlock neural deal tracking and prioritized sniffs.",
              },
              unit_amount: 500, // $5.00
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL || "http://localhost:3000"}?payment=success`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}?payment=cancel`,
        customer_email: email,
        metadata: { userId },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(__dirname),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cyberhound Server running on http://localhost:${PORT}`);
  });
}

startServer();
