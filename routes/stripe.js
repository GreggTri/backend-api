const express = require("express");
const router = express.Router();
require('dotenv').config()
const mongoose = require("mongoose")
const stripe = require('stripe')(process.env.STRIPE_TEST_KEY)

const Seller = require('../models/Seller')

//Creates Seller's Connected Stripe account
router.post('/v1/accounts/:id', async (req, res, next) => {
    const seller_id = req.params.id
    Seller.findById(seller_id)
    .exec()
    .then( async seller => {

        const account = await stripe.accounts.create({
            type: 'standard',
            country: 'us',
            email: seller.email,
            business_profile: {
                name: seller.brandName,
                product_description: null,
                url: null,
                support_address: {
                    city: null,
                    country: null,
                    line1: null,
                    line2: null,
                    postal_code: null,
                    state: null
                },
            },
            business_type: 'company',
            settings: {
                card_payments: {
                    statement_descriptor_prefix: null
                },
                payments: {
                    statement_descriptor: null
                }
            }
        });
        console.log(account)
        return account
    })
    .then( async stripe_account =>{
        
        const accountLink = await stripe.accountLinks.create({
            account: stripe_account.id,
            refresh_url: 'http://localhost:5000',
            return_url: 'http://localhost:5000',
            type: 'account_onboarding',
        });
        
        Seller.updateOne({_id: seller_id}, {$set : {connect_stripe_id: stripe_account.id}})
        .exec()
        .then(results => {
            console.log(results)
          })
          .catch(err => {
            console.log(err)
          })
        res.send(accountLink)
    })
    .catch(err =>{
        console.log(err)
        res.status(500).json({Error: err})
    })
}) 

//TODO:: finish everyting
router.post('/create-subscription', async (req, res) =>{
  const id = req.body.id
  Seller.findById(id).select('stripe_seller_customerId email numOfProducts')
  .exec()
  .then( async seller_customer =>{
    const domainURL = process.env.DOMAIN;
    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // [automatic_tax] - to automatically calculate sales tax, VAT and GST in the checkout page
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: seller_customer.stripe_seller_customerId,
        'customer_update[address]': 'auto',
        phone_number_collection: {enabled: true},
        automatic_tax: { enabled: true },
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: seller_customer.numOfProducts,
          },
        ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/subscription/cancel`,
        
      });
      res.send(session.url)
    } catch (e) {
      res.status(400);
      return res.send({
        error: {
          message: e.message,
        }
      });
    }
  })
  .catch(err =>{
    console.log(err)
    res.status(500).json({err})
  })
})


router.post('/create-seller-customer', async (req, res) => {
  const seller_id = req.body.id
  Seller.findById(seller_id).select('email stripe_seller_customerId').exec()
  .then(async sellerObj =>{
    if(stripe_seller_customerId = null){  
      const customer = await stripe.customers.create({
        email: sellerObj.email,
      });
      Seller.updateOne({_id: seller_id}, {$set : {stripe_seller_customerId: customer.id}})
      .exec()
      .then(results => {
          res.send({ customer });
      })
      .catch(err => {
        console.log(err)
      }) 
    }
    else{
      console.log("seller already has customer id")
      res.send(sellerObj.stripe_seller_customerId)
    }
  })
  .catch(err =>{
    console.log(err)
  })
})

router.post('/customer-portal', async (req, res) => {
  const seller_id = req.body.id

  Seller.findById(seller_id).select('stripe_seller_customerId')
  .exec()
  .then(async seller_customer => {
    
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = process.env.DOMAIN;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: seller_customer.stripe_seller_customerId,
      return_url: `${returnUrl}/dashboard`,
    });
    res.send(portalSession.url)
  })
  .catch(error => {
    console.log(error)
    res.status(400).json({Error: error})
  })
});

router.post("/subscription/webhook", async (req, res) => {
  let data;
  let eventType;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  }

  // Handle the event
  switch (eventType) {
    case 'checkout.session.completed':
      // Payment is successful and the subscription is created.
      // You should provision the subscription and save the customer ID to your database.
      break;
    case 'invoice.paid':
      // Continue to provision the subscription as payments continue to be made.
      // Store the status in your database and check when a user accesses your service.
      // This approach helps you avoid hitting rate limits.
      break;
    case 'invoice.payment_failed': 
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify your customer and send them to the
      // customer portal to update their payment information.
      break;
    case 'invoice.upcoming':
      //check for numOfProducts for seller's upcoming invoice and change the quantity of subscription
      //for such invoice
      break;
    default:
      // Unhandled event type
      res.status(400).end()
  }

  // Return a 200 response to acknowledge receipt of the event
  res.sendStatus(200)
});

router.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

module.exports = router