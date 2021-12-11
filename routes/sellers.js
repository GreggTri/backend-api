const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { v4 } = require('uuid')
const uuid = v4
const multer = require('multer')
const multerS3 = require('multer-s3')
const Seller = require('../models/Seller')
const Product = require('../models/Product')
const path = require('path')
const { s3 } = require('../s3')
const bcrypt = require('bcrypt')

var uploadBrandLogo = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, Object.assign({}, file.fieldname));
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const nameOfFile = path.parse(file.originalname).name
      cb(null, `${"brandLogo_" + nameOfFile + "_" + uuid()}${ext}`)
    }
  })
}).single('brandLogo')


//*******************************Seller-panel SELLER GET requests*********************************************

//GET ALL sellers
router.get("/", (req, res, next) => {
    Seller.find()
    .select("brandLogo brandName ownerName email cards customerService address")
    .exec()
    .then( docs => {
        const response = {
            count: docs.length,
            sellers: docs.map(doc => {
                return {
                    _id: doc._id,  
                    brandLogo: doc.brandLogo,
                    brandName: doc.brandName,
                    ownerName: doc.ownerName,
                    email: doc.email,
                    cards: doc.cards,
                    customerService: doc.customerService,
                    address: doc.address,
                    request: {
                        type: "GET",
                        url: "http://localhost:5000/api/seller/" + doc._id
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


//GET singular Seller
//TODO**
router.get("/:sellerId", (req, res, next) => {
    const id = req.params.sellerId;
    Seller.findById(id)
      .select('_id brandLogo brandName ownerName email')
      .exec()
      .then(doc => {
        console.log("From database", doc);
        if (doc) {
          res.status(200).json({
              seller: doc,
              request: {
                  type: 'GET',
                  url: 'http://localhost:5000/seller/' + doc._id
              }
          });
        } else {
          res
            .status(404)
            .json({ message: "No valid entry found for provided ID" });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
      });
});


//*******************************Seller-panel SELLER POST requests********************************************

router.post('/login', async (req, res, next) =>{
  try{
    let seller = await Seller.findOne({email: req.body.email}).exec()

    if(seller === null || seller === undefined){
      return res.status(400).send("Wrong email or password. Please try again")

    }else{

      if(await bcrypt.compare(req.body.password, seller.password)){
        res.status(200).send('You have Successfully logged in!')
      }else{
        res.status(400).send('Wrong email or password. Please try again')
      }
    }
  }catch(err){
    res.status(500).send(`${err}`)
  }
})

router.post("/", uploadBrandLogo, async (req, res, next) => {

  try{
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const seller = new Seller({
      brandLogo: req.file.key,
      brandName: req.body.brandName,
      ownerName: req.body.ownerName,
      email: req.body.email,
      password: hashedPassword
    })
    seller.save().then(result =>{
      console.log(result)
      res.status(201).json({
          message: "Seller account has been created!",
          createdSeller: {
              _id: result._id,
              brandLogo: result.brandLogo,
              brandName: result.brandName,
              ownerName: result.ownerName,
              email: result.email,
              password: result.passowrd,
              EIN: result.EIN,
              request: {
                  type: 'GET',
                  url:"http://localhost:5000/seller/" + result._id
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
  }catch(err){
    res.status(500).send(error)
  }
})
    
    
//*******************************Seller-panel SELLER PATCH requests*********************************************

//update seller info
//TODO:: Figure out how to switch out logo file in s3 bucket and update key for it
router.patch("/:sellerId", (req, res, next) => {
  const id = req.params.sellerId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }

  //TODO:: persist updates from seller customer service info to product customer service info
  //if(updateOps.propName === "")


  console.log(updateOps)
  Seller.updateOne({ _id: id }, {$set: updateOps}, {upsert: true, new: true})
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Seller\'s account has been updated',
          result: result,
          request: {
              type: 'GET',
              url: 'http://localhost:3000/seller/' + id
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


//*******************************Seller-panel SELLER DELETE requests*********************************************

router.delete("/:sellerId", async (req, res, next) => {
    const id = req.params.sellerId;
    let keysToDelete = [{"Key": ''}]
  
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME, 
      Delete: {
        Objects: [{
            Key: ''
        }],
        Quiet: false
      },
    }
    let count = 0

    Seller.findById(id).select('numOfProducts brandLogo')
    .exec()
    .then( async result =>{

      keysToDelete[count] = {
        Key: result.brandLogo
      } 
      count++
      
      //Collects keys from deleted products
      for(i = 0; i <= result.numOfProducts -1; i++){
        const data = await Product.findOneAndDelete({'seller.brand_id': id})
        .exec()
        .then(deletedDoc =>{
          return deletedDoc
        }).catch(err => {console.log(err);})

        keysToDelete[count] = { 
          "Key": data.productImage
        }
        count++
        for(j = 0; j <= data.colorway.length -1; j++){
          
          keysToDelete[count] = {
            "Key": data.colorway[j].model
          }
          count++
        }
    } //end of for loop

      //Deletes seller
      Seller.deleteOne({_id: id})
      .exec()
      .then(deleteSellerResult =>{
        console.log(deleteSellerResult)
      })
      .catch(err => {
        console.log(err);
      })

      return keysToDelete
    })// end of seller.findbyid .then
    .then(keys => {
      //sends keys to params to delete
      params.Delete.Objects = keys

      //deletes keys in s3 bucket
      s3.deleteObjects(params, function(err, data) {
        if (err){console.log(err, err.stack)} // an error occurred
        else {console.log(data)}           // successful response
      });

      res.status(200).json({
        message: 'Seller\'s account and all products have been deleted from DB and S3',
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        Error: err
      });
    });
});

//******************************************************************************************************************
//*************************************APP CLIENT SELLER GET REQUESTS***********************************************
//******************************************************************************************************************



module.exports = router