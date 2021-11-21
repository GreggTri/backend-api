const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const uploadPicture = multer({ storage: storage, fileFilter: fileFilter})
const Product = require("../models/Product")
const Seller = require('../models/Seller')

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
router.post("/:sellerId/addproduct", uploadPicture.single('productImage'), (req, res, next) => {
  const id = req.params.sellerId
  //To get seller branding and customer service data
  Seller.findById(id)
  .select('brandLogo brandName customerService')
  .exec()
  .then(doc => {
    console.log("from database ", doc)
    if(doc){
      console.log("found Seller\'s branding & customer service info " + doc)

      //creates product with important seller data
      const product = new Product({
        productImage: req.file.path,
        productName: req.body.productName,
        price: req.body.price,
        desc: req.body.desc,
        category: req.body.category,
        colorway: [{
          colorName: req.body.colorName,
          hexcode: req.body.hexcode,
          model: req.body.model
        }],
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
    } else {
      res.status(404).json({
        message: "No valid entry fround for provided ID"
      })
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({ error: err });
  })
});

//*************************************Seller-panel Product PATCH request************************************

//TODO: edit product from seller
router.patch("/:productId", (req, res, next) => {
  const id = req.params.productId;
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  Product.updateOne({ _id: id }, { $set: updateOps })
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

//TODO: DELETE product from seller 
router.delete("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.deleteOne({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json({
          message: 'Product deleted',
          request: {
              type: 'POST',
              url: 'http://localhost:5000/products',
              body: { name: 'String', price: 'Number' }
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
//*************************************APP CLIENT PRODUCT GET REQUESTS**********************************************
//******************************************************************************************************************

//TODO: get products that where most recently added

//TODO: get products that are most purchased

//perform search query for products
module.exports = router;