const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('morgan')
require ('dotenv').config()

//import routes
const sellerRoute = require('./routes/sellers')
const productRoute = require('./routes/products')

app.use(express.json())
app.use(logger('dev'))

//routes
app.use('/seller', sellerRoute)
app.use('/product', productRoute)

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