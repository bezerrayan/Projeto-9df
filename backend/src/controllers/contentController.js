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
    // Data is assumed to be validated by middleware
    await contentService.save(data);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSiteContent,
  updateSiteContent
};
