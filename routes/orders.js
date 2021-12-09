const express = require("express");
const router = express.Router();
require('dotenv').config()
const mongoose = require("mongoose")
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY, {apiVersion: '2020-08-27'})

const Seller = require('../models/Seller')
const Order = require('../models/Order')
const User = require('../models/User')
const Product = require('../models/Product')

const calculateOrderAmount = (items) => {
    
    // should be channged to whatever the actual variables are but this is the concept used.
    const total = items.reduce((previous, current) => {
      return previous.price + current.price
    })
    return total * 100;
  };

router.post('/create-payment-intent', async (req, res, next) =>{
    try{
        const { items } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            currency: 'usd',
            payment_method_types: ['card'],
        })
        res.status(200).json({clientSecret: paymentIntent.client_secret})
    }
    catch(e){
        res.status(400).json({error: {message: e.message}})
    }
})

router.get('/config', async (req, res, next) =>{
    res.json({publishableKey: process.env.STRIPE_PUBLISHABLE_KEY})
})

router.post('/webhook', async (req, res) => {
    let data, eventType;
  
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // we can retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }
  
    if (eventType === 'payment_intent.succeeded') {
      // Funds have been captured
      // Fulfill any orders, e-mail receipts, etc
      // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
      console.log('💰 Payment captured!');
    } else if (eventType === 'payment_intent.payment_failed') {
      console.log('❌ Payment failed.');
    }
    res.sendStatus(200);
  });
  
module.exports = router