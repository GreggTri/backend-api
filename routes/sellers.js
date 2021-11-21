const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const multer = require('multer')

//const { uploadFile, getFileStream } = require('./s3')
const Seller = require('../models/Seller')

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, false);
    }
};

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
});
const upload = multer({storage: storage, fileFilter: fileFilter})


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
                  url: 'http://localhost:5000/api/seller/' + doc._id
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

router.post("/", upload.single('brandLogo'), (req, res, next) =>{
    console.log(req.file)
    const seller = new Seller({
        brandLogo: req.file.path,
        brandName: req.body.brandName,
        ownerName: req.body.ownerName,
        email: req.body.email,
        password: req.body.password,
        EIN: req.body.EIN
    })
    console.log(seller)
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
                    url:"http://localhost:5000/api/seller/" + result._id
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

//*******************************Seller-panel SELLER PATCH requests*********************************************

//update seller info
router.patch("/:sellerId", (req, res, next) => {
  const id = req.params.sellerId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  Seller.updateOne({ _id: id }, {$set: updateOps}, {upsert: true, new: true})
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Seller\'s account has been updated',
          result: result,
          request: {
              type: 'GET',
              url: 'http://localhost:3000/api/seller/' + id
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

router.delete("/:sellerId", (req, res, next) => {
    const id = req.params.sellerId;
    Seller.deleteOne({ _id: id })
      .exec()
      .then(result => {
        res.status(200).json({
            message: 'Seller Deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:5000/api/seller',
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

//******************************************************************************************************************
//*************************************APP CLIENT SELLER GET REQUESTS***********************************************
//******************************************************************************************************************



module.exports = router