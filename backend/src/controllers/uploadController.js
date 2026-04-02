// ---- uploadController.js ----
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado.' });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'gear9df/galeria', resource_type: 'image' },
        (err, result) => { if (err) return reject(err); resolve(result); }
      );
      bufferToStream(req.file.buffer).pipe(stream);
    });
    res.json({ ok: true, path: result.secure_url, filename: result.public_id });
  } catch (error) {
    console.error('[UPLOAD IMAGE ERROR]', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function uploadDoc(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado.' });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'gear9df/documentos', resource_type: 'raw' },
        (err, result) => { if (err) return reject(err); resolve(result); }
      );
      bufferToStream(req.file.buffer).pipe(stream);
    });
    res.json({ ok: true, path: result.secure_url, filename: result.public_id });
  } catch (error) {
    console.error('[UPLOAD DOC ERROR]', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  uploadImage,
  uploadDoc
};
