const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('morgan')
require ('dotenv').config()

//import routes
const sellerRoute = require('./routes/sellers')
const productRoute = require('./routes/products')
const stripeRoute = require('./routes/stripe')
const orderRoute = require('./routes/orders')
const userRoute = require('./routes/users')

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'))
app.use((req, res, next) =>{
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Headers', '*')
  if(req.method === 'OPTIONS'){
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATH, DELETE, GET')
    return res.status(200).json({})
  }
  next();
})

//routes
app.use('/seller', sellerRoute)
app.use('/product', productRoute)
app.use('/stripe', stripeRoute)
app.use('/order', orderRoute)
app.use('/user', userRoute)

//error handling
app.use((req, res, next) =>{
    const error = new Error("Error 404: Route Not found")
    error.status = 404
    next(error)
})
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message
      }
    });
})

//Connects to database
mongoose.connect(process.env.DB_CONNECTION, {
    auth: {
      username: process.env.MONGO_USER,
      password: process.env.MONGO_PASS
    },
    useNewUrlParser:true
      }).then(
        () => { 
            console.log("Database connected");
        },
        err => { 
            /** handle initial connection error */ 
            console.log("Error in database connection. ", err);
        }
    );
    
//listening to server
app.listen(process.env.PORT, () =>{
    console.log('Seller Panel Backend Server is running!')
})