const Stripe = require("stripe");
const db = require("../config/database");

const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
const paymentsDisabled = process.env.DISABLE_PAYMENTS === 'true' || !hasStripeKey;

const stripe = !paymentsDisabled && hasStripeKey
    ? Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

exports.createCheckoutSession = async (req, res) => {
    if (paymentsDisabled || !stripe) {
        return res.status(503).json({
            status: 'UNAVAILABLE',
            message: 'Payments are temporarily disabled or Stripe is not configured'
        });
    }

    try {
        const { recruiter_id, pack_id } = req.body;

        // Récupérer le pack dans la base
        const [rows] = await db.query("SELECT * FROM packs WHERE id = ?", [pack_id]);
        const pack = rows[0];

        if (!pack) {
            return res.status(400).json({ message: "Pack introuvable" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: { name: pack.name },
                        unit_amount: pack.price * 100, // Stripe utilise les cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
        });

        return res.json({ url: session.url });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erreur Stripe", error: error.message });
    }
};
