const contentService = require('../services/contentService');

async function getSiteContent(req, res, next) {
  try {
    const data = await contentService.load();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function updateSiteContent(req, res, next) {
  try {
    const data = req.body;
    console.log('[CONTENT] Recebendo atualização de conteúdo...');
    if (data.adminPanel && data.adminPanel.photos) {
      console.log(`[CONTENT] Salvando ${data.adminPanel.photos.length} fotos na galeria.`);
    }
    // Data is assumed to be validated by middleware
    await contentService.save(data);
    res.json({ ok: true });
  } catch (error) {
    console.error('[CONTENT ERROR] Falha ao salvar conteúdo:', error);
    next(error);
  }
}

module.exports = {
  getSiteContent,
  updateSiteContent
};
