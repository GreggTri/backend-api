const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
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

router.post('/login', async (req, res, next) =>{
    try{
        let user = await User.findOne({email: req.body.email}).exec()
        console.log(user)
        if(user == null){
            return res.status(400).send("Wrong email or password. Please try again")
        }

        if(await bcrypt.compare(req.body.password, user.password)){
            res.status(200).send('You have Successfully logged in!')
        }else{
            res.status(400).send('Wrong email or password. Please try again')
        }
    }catch(err){
        res.status(500).send(`${err}`)
    }
})

router.post("/", async (req, res, next) =>{
    console.log(req.body)
    try{
        if(req.body.password !== req.body.confirmPassword){
            
            return res.status(400).send('Passwords do not match! Please try again')
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        console.log(hashedPassword)
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
        })
        
        console.log(user)

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