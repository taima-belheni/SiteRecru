const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route pour initier le paiement (Redirige vers Stripe)
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Route appelée par ton Frontend une fois que l'utilisateur revient de Stripe
// Le frontend enverra le session_id récupéré dans l'URL
router.post('/payment-success', paymentController.handlePaymentSuccess);

module.exports = router;