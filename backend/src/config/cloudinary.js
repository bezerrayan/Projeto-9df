const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const config = require('./env');

cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gear9df/galeria",
    allowed_formats: ["jpg", "png", "webp", "svg"],
  },
});

const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gear9df/documentos",
    allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx"],
    resource_type: "raw", 
  },
});

module.exports = {
  upload: multer({ storage: storage }),
  uploadDoc: multer({ storage: docStorage }),
  cloudinary
};
