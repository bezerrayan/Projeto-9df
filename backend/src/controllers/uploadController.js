// ---- uploadController.js ----
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado." });
    }
    // O Multer-Cloudinary preenche o req.file.path com a URL segura
    res.json({ ok: true, path: req.file.path, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function uploadDoc(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado." });
    }
    res.json({ ok: true, path: req.file.path, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  uploadImage,
  uploadDoc
};
