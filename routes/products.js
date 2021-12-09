const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const multerS3 = require('multer-s3')
const { v4 } = require('uuid')
const uuid = v4
const Product = require("../models/Product")
const Seller = require('../models/Seller')
const path = require('path')
const { s3 } = require('../s3')

var  uploadProduct = multer({
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
      cb(null, `${file.fieldname + "_" + nameOfFile + "_" + uuid()}${ext}`)
    }
  })
}).fields([
  {name: 'productImage', maxCount: 1},
  {name: 'model', maxCount: 6}
  ])

//******************************************************************************************************************
//*********************************Seller-panel PRODUCT GET requests*********************************************
//******************************************************************************************************************

//GET ALL Products
//TODO**
router.get("/", (req, res, next) => {
  Product.find()
    .select("_id productImage productName price desc")
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        products: docs.map(doc => {
          return {
            productImage: doc.productImage,
            productName: doc.productName,
            desc: doc.desc,
            price: doc.price,
            _id: doc._id,
            request: {
              type: "GET",
              url: "http://localhost:3000/products/" + doc._id
            }
          };
        })
      };
      res.status(200).json(response);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

//GET singular Product **CAN ALSO BE USED FOR APP CLIENT**
//TODO**
router.get("/:productId", (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
      .select('_id productImage productName price desc category colorway seller reviews ')
      .exec()
      .then(doc => {
        console.log("From database", doc);
        if (doc) {
          res.status(200).json({
              product: doc,
              request: {
                  type: 'GET',
                  url: 'http://localhost:3000/products'
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

  //get all products from a seller
  router.get("/list-all/:sellerId", (req, res, next) => {
    const id = req.params.sellerId;
    Product.find({'seller.brand_id': id})
    .select('_id productImage productName price desc category colorway seller ')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
         
        message: 'All of a sellers products',
        products: docs.map(doc => {
          return {
            _id: doc._id,
            productImage: doc.productImage,
            productName: doc.productName,
            price: doc.price,
            category: doc.category,
            desc: doc.desc,
            colorway: doc.colorway,
            Seller: doc.seller.brandName,
          };
        })
      };
      res.status(200).json(response);
    })
      .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
      });
  });

//*************************************Seller-panel Product POST request************************************

//ADD's a product to a singular seller
router.post("/:sellerId/addproduct", uploadProduct, (req, res, next) => {
  const id = req.params.sellerId
  //To get seller branding and customer service data
  Seller.findById(id)
  .select('brandLogo brandName customerService')
  .exec()
  .then(doc => {
    if(doc){
      console.log("found Seller\'s branding & customer service info " + doc)

      //declarations for arrays to get colorway information
      const tempColorName = new Array()
      const tempHexcode = new Array()
      const tempModel = new Array()

      //stores colorway info into separate arrays
      for (const [key, value] of Object.entries(req.body)) {
        if(key === "colorName"){
          for(i = 0; i <= value.length - 1; i++){
            tempColorName[i] = value[i]
          }
        }
        else if(key === "hexcode"){
          for(i = 0; i <= value.length - 1; i++){
            tempHexcode[i] = value[i]
          }
        }
        else {
          //do nothing
        }
      }
      //stores model keys into model array
      for(i = 0; i <= req.files['model'].length - 1; i++){
        tempModel[i] = req.files['model'][i].key

      }
      let colorwayArray = [{
        "colorName": "",
        "hexcode": "",
        "model": ""
      }]
      //adds all colorways into an array of objects
      for(i = 0; i <= tempColorName.length - 1; i++){
        colorwayArray[i] = {
          "colorName": tempColorName[i],
          "hexcode": tempHexcode[i],
          "model": tempModel[i]
        }
      }
      console.log(colorwayArray)
      //creates product with important seller data
      const product = new Product({
        productImage: req.files['productImage'][0].key,
        productName: req.body.productName,
        price: req.body.price,
        desc: req.body.desc,
        category: req.body.category,
        colorway: colorwayArray,
        "seller.brand_id": id,
        "seller.brandLogo": doc.brandLogo,
        "seller.brandName": doc.brandName,
        "seller.customerService": {
          email: doc.customerService.email,
          phoneNumber: doc.customerService.phoneNumber,
          return_policy: doc.customerService.return_policy,
          warranty_policy: doc.customerService.warranty_policy
        } 
      })
      product
      .save()
      .then(result => {
        Seller.updateOne({ _id: id }, {$inc: { numOfProducts: 1} }, {upsert: true, new: true})
        .exec()
        .then(results => {
          console.log(results)
        })
        .catch(err => {
          console.log(err)
        })
        console.log(result);
        res.status(201).json({
          message: "Created product successfully",
          createdProduct: {
            _id: result._id,  
            name: result.name,
            price: result.price,
            desc: result.desc,
            category: result.category,
            colorway: result.colorway,
            seller: result.seller,
            request: {
                type: 'GET',
                url: "http://localhost:3000/products/" + result._id
            }
          }
        });
      })
      .catch(err =>{
        console.log(err)
      })
    } else {
      res.status(404).json({
        message: "No valid entry found for provided ID"
      })
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ error: err });
  })
});

//*************************************Seller-panel Product PATCH request************************************

//TODO:: Figure out how to switch out files in s3 bucket and update keys for them
router.patch("/:productId", (req, res, next) => {
  const id = req.params.productId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  Product.updateOne({ _id: id }, { $set: updateOps }, {upsert: true, new: true})
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Product updated',
          request: {
              type: 'GET',
              url: 'http://localhost:3000/products/' + id
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

//****************************************Seller-panel Product DELETE request********************************

//DELETE product from seller 
router.delete("/:productId", async (req, res, next) => {
  const id = req.params.productId;
  let keysToDelete = [{"Key": ''}]
  let count = 0

  var params = {
    Bucket: process.env.AWS_BUCKET_NAME, 
    Delete: {
      Objects: [{
          Key: ''
      }],
      Quiet: false
    },
  }
  Product.findOneAndDelete({ _id: id })
  .exec()
  .then(deletedDoc => {
    
    keysToDelete[count] = { 
      "Key": deletedDoc.productImage
    }
    count++

    for(j = 0; j <= deletedDoc.colorway.length -1; j++){
          
      keysToDelete[count] = {
        "Key": deletedDoc.colorway[j].model
      }
      count++
    }
    Seller.updateOne({"seller.brand_id": id }, {$inc: { numOfProducts: -1} })
    .exec()
    .then(results => {
      console.log(results)
    })
    .catch(err => {
      console.log(err)
    })
    return keysToDelete
  })
  .then(keys =>{
    params.Delete.Objects = keys

    //deletes keys of this product in s3 bucket
    s3.deleteObjects(params, function(err, data) {
      if (err){console.log(err, err.stack)} // an error occurred
      else {console.log(data)}           // successful response
    });
    res.status(200).json({
      message: 'Product deleted from DB and s3',
    });
  })
  .then(() => {
    
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

//******************************************************************************************************************
//*************************************APP CLIENT PRODUCT GET REQUESTS**********************************************
//******************************************************************************************************************

//TODO: get products that were most recently added

//TODO: get products that are most purchased

//perform search query for products
module.exports = router;