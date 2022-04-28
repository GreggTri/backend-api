const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/User')
const Product = require("../models/Product")
const Seller = require("../models/Seller")

//**************************************GET requests*********************************************************

router.get("/", (req, res, next) => {
    User.find()
    .select("_id firstName lastName email address")
    .exec()
    .then( docs => {
        const response = {
            count: docs.length,
            sellers: docs.map(doc => {
                return {
                    _id: doc._id,  
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    email: doc.email,
                    address: doc.address,
                    request: {
                        type: "GET",
                        url: "http://localhost:5000/user/" + doc._id
                    }
                }
            })
        }
        res.status(200).json(response)
    })
    .catch(err =>{
        console.log(err)
        res.status(500).json({
            error: err
        })
    })
})

router.get('/query', async (req, res, next) => {
    query = req.body.query
    ///^bar$/i
    try{
        brandResults = await Seller.find(
            {brandName: {$regex: query, $options: 'i'}, isVerified: true}
            //{isVerified: true}
        )
        .select(' brandName brandLogo customerService numOfProducts')

        productResults = await Product.find(
            {productName: {$regex: query, $options: 'i'}, 'seller.isVerified': true}
            //{'seller.isVerified': true}
        )
        .select(' productName productImage desc price category seller colorway countInStock')

        let resultCount = brandResults.length + productResults.length
        queryResults = {
            numOfResults: resultCount,
            brands: brandResults,
            products: productResults
        }

        res.status(200).json(queryResults)

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
})

router.get('/favorites', async (req, res, next) => {
    idList = req.body
    try{
        console.log(idList)
        const results = await Product.find({_id: { $in: idList}})
        res.status(200).json(results)

    } catch(error) {
        res.status(500).json(error)
    }
})

router.get('/cart', async (req, res, next) => {
    idList = req.body
    try{
        console.log(idList)
        //TODO
        const results = await Product.find({_id: { $in: idList}})
        res.status(200).json(results)

    } catch(error) {
        res.status(500).json(error)
    }
})

//******************************************POST requests*******************************************************

router.post('/login', async (req, res, next) =>{
    let userEmail = req.body.email.toLowerCase()
    try{
        let user = await User.findOne({email: userEmail}).select('_id firstName lastName email password favorites cart address ')
        if(user == null){
            return res.status(400).send("This user does not exist")
        }

        if(await bcrypt.compare(req.body.password, user.password)){
            await User.findOneAndUpdate({_id: user._id}, {"lastActive": Date.now()}).exec()
            
            userWithoutPass = {
                "_id": user._id,
                "firstName": user.firstName,
                "lastName": user.lastName,
                "email": user.email,
                "favorites": user.favorites,
                "cart": user.cart,
            }
            res.status(200).json(userWithoutPass)

        }else{
            res.status(400).send('Wrong email or password. Please try again')
        }
    }catch(err){
        res.status(500).send(`${err}`)
    }
})

router.post("/", async (req, res, next) =>{
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        console.log(hashedPassword)
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
        })
        

        user.save()
        .then(result =>{
            console.log(result)
            res.status(201).json({
                message: "User account has been created!"
            })
        })
        .catch(err =>{
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
    }catch(err){
        res.status(500).send(`${err}`)
    }
})

//*****************************************PATCH requests*******************************************************

router.patch('/save-cart', async (req, res, next) =>{
    console.log(req.body)

    try{
        await User.findByIdAndUpdate({_id: req.body.userId}, {$set: {cart: req.body.cart}})
        res.status(200).json("ok")

    } catch(error) {
        res.status(500).json(error)
    }
})


router.patch('/save-favorites', async (req, res, next) =>{
    console.log(req.body)

    try{
        await User.findByIdAndUpdate({_id: req.body.userId}, {$set: {favorites: req.body.favorites}})
        res.status(200).json("ok")

    } catch(error) {
        res.status(500).json(error)
    }
})

router.patch('/save-address', async (req, res, next) =>{
    console.log(req.body)

    try{
        await User.findByIdAndUpdate({_id: req.body.userId}, {$set: {address: req.body.address}})
        res.status(200).json("ok")

    } catch(error) {
        res.status(500).json(error)
    }
})

router.patch("/:userId", (req, res, next) => {
    const id = req.params.userId;
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    User.updateOne({ _id: id }, {$set: updateOps}, {upsert: true, new: true})
      .exec()
      .then(result => {
        res.status(200).json({
            message: 'user\'s account has been updated',
            result: result,
            request: {
                type: 'GET',
                url: 'http://localhost:3000/user/' + id
            }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });


//*****************************************DELETE requests*******************************************************

router.delete("/delete-user", (req, res, next) => {
    const id = req.body.userId;
    User.deleteOne({ _id: id })
      .exec()
      .then(result => {
        res.status(200).json({
            message: 'User Deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:5000/user',
                body: { result }
            }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});

module.exports = router
