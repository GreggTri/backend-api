const express = require('express')
const router = express.Router()

const User = require('../models/User')

//**************************************GET requests*********************************************************

//GET ALL users
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

//******************************************POST requests*******************************************************

router.post("/", (req, res, next) =>{
    const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
    })
    console.log(seller)
    seller.save().then(result =>{
        console.log(result)
        res.status(201).json({
            message: "User account has been created!",
            createdSeller: {
                _id: result._id,
                firstName: result.firstName,
                lastName: result.lastName,
                email: result.email,
                request: {
                    type: 'GET',
                    url:"http://localhost:5000/user/" + result._id
                }
            }
        })
    })
    .catch(err =>{
        console.log(err)
        res.status(500).json({
            error: err
        })
    })
})

//*****************************************PATCH requests*******************************************************

router.patch("/:userId", (req, res, next) => {
    const id = req.params.userId;
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Seller.updateOne({ _id: id }, {$set: updateOps}, {upsert: true, new: true})
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

router.delete("/:userId", (req, res, next) => {
    const id = req.params.userId;
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