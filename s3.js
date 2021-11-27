require('dotenv').config()
const fs = require('fs')
const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const { v4 } = require('uuid')
const { builtinModules } = require('module')
const uuid = v4


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION
})

const s3 = new AWS.S3({ apiVersion: '2006-03-01'})

module.exports.s3 = s3

const fileImageFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileModelFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === '.usdz') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// uploads a file to s3
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path)

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename
  }

  return s3.upload(uploadParams).promise()
}
exports.uploadFile = uploadFile



  // downloads a file from s3
  function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }
  exports.getFileStream = getFileStream