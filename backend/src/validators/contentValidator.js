const path = require('path');

const ADMIN_PAGES = {
  "index.html": "Inicio",
  "sobre.html": "Sobre",
  "atividades.html": "Atividades",
  "galeria.html": "Galeria",
  "ramo.html": "Ramos",
  "projetos.html": "Projetos",
  "contato.html": "Contato",
  "documentos.html": "Documentos",
  "equipe.html": "Equipe",
  "participar.html": "Participar",
  "links.html": "Links uteis",
};

const ALLOWED_IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".svg"]);
const LINUX_SAFE_IMAGE_RE = /^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png|svg)$/;

function sanitize(payload) {
  if (!payload || typeof payload !== "object") {
    return { pages: {}, adminPanel: {} };
  }

  const pages = payload.pages && typeof payload.pages === "object" ? payload.pages : {};
  const cleaned = { pages: {}, adminPanel: {} };

  for (const [pageName, pageData] of Object.entries(pages)) {
    if (!ADMIN_PAGES[pageName] || !pageData || typeof pageData !== "object") {
      continue;
    }

    cleaned.pages[pageName] = {
      text: pageData.text && typeof pageData.text === "object" ? pageData.text : {},
      images: pageData.images && typeof pageData.images === "object" ? pageData.images : {},
      sections: pageData.sections && typeof pageData.sections === "object" ? pageData.sections : {},
      extras: Array.isArray(pageData.extras) ? pageData.extras : [],
    };
  }

  cleaned.adminPanel = sanitizeAdminPanel(payload.adminPanel && typeof payload.adminPanel === "object" ? payload.adminPanel : {});
  return cleaned;
}

function sanitizeAdminPanel(adminPanel) {
  const cleaned = { ...adminPanel };
  
  if (Array.isArray(cleaned.photos)) {
    cleaned.photos = cleaned.photos.map(p => validateGalleryPhoto(p)).filter(Boolean);
  }
  
  return cleaned;
}

function validateGalleryPhoto(photo) {
  if (!photo || typeof photo !== "object") return null;

  try {
    const src = String(photo.src || "").trim().replace(/\\/g, "/");
    const title = String(photo.title || "").trim();
    
    if (!title || !src) return null;

    // We only validate the pattern if it's a local path. 
    // Cloudinary URLs (starting with http) bypass the LINUX_SAFE check.
    const isExternal = src.toLowerCase().startsWith('http');
    
    if (!isExternal && !LINUX_SAFE_IMAGE_RE.test(src)) {
        console.warn(`[VALIDATOR] Imagem descartada por segurança (path inválido): ${src}`);
        return null; 
    }

    if (isExternal) {
      console.log(`[VALIDATOR] Link externo aceito: ${src}`);
    }

    return {
      id: String(photo.id || "ph-" + Math.random().toString(36).substr(2, 9)).trim(),
      title,
      category: String(photo.category || "atividade").trim(),
      caption: String(photo.caption || title).trim(),
      src,
    };
  } catch (e) {
    console.error('[VALIDATOR ERROR] Falha ao processar foto:', e);
    return null;
  }
}

module.exports = {
  sanitize,
  ADMIN_PAGES
};
