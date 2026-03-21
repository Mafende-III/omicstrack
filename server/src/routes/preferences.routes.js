import { Router } from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PreferencesSchema } from '../validation/schemas.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const prefs = await db('user_preferences').where('user_id', req.user.id).first();
  res.json({ lang: prefs?.lang || 'en' });
});

router.put('/', authenticate, validate(PreferencesSchema), async (req, res) => {
  const { lang } = req.validated;
  const existing = await db('user_preferences').where('user_id', req.user.id).first();

  if (existing) {
    await db('user_preferences').where('user_id', req.user.id).update({ lang, updated_at: new Date() });
  } else {
    await db('user_preferences').insert({ user_id: req.user.id, lang });
  }

  res.json({ lang });
});

export default router;
