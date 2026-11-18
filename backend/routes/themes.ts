import { Router, Request, Response } from 'express';
import {
  createTheme,
  deleteTheme,
  exportTheme,
  getTheme,
  importTheme,
  listThemes,
  publishTheme,
  renameTheme,
  ThemeError
} from '../services/themes/themeService';

/** Theme management. Mounted behind requireAdmin — every route is admin-only. */
const router = Router();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function fail(res: Response, err: any) {
  if (err instanceof ThemeError) return res.status(err.status).json({ error: err.message });
  console.error('[Themes]', err);
  return res.status(500).json({ error: err?.message || 'Theme operation failed.' });
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ themes: await listThemes() });
  } catch (err) {
    fail(res, err);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    res.json({ theme: await getTheme(req.params.id) });
  } catch (err) {
    fail(res, err);
  }
});

/** Body: { name?, from?: 'default' | <themeId> } — new draft (blank default or a duplicate). */
router.post('/', async (req: Request, res: Response) => {
  try {
    res.status(201).json({ theme: await createTheme({ name: req.body?.name, from: req.body?.from }) });
  } catch (err) {
    fail(res, err);
  }
});

/** Body: { fileName, data: base64, name? } — a .zip theme package or a theme.json. */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { fileName, data, name } = req.body || {};
    if (!fileName || typeof data !== 'string') throw new ThemeError('Send the theme file as { fileName, data (base64) }.');
    const base64 = data.includes(',') && data.startsWith('data:') ? data.slice(data.indexOf(',') + 1) : data;
    const buf = Buffer.from(base64, 'base64');
    if (buf.length === 0) throw new ThemeError('The uploaded file is empty.');
    if (buf.length > MAX_UPLOAD_BYTES) throw new ThemeError('Theme files can be at most 25 MB.');
    const result = await importTheme(String(fileName), buf, name);
    res.status(201).json(result);
  } catch (err) {
    fail(res, err);
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    if (typeof req.body?.name !== 'string') throw new ThemeError('Nothing to update.');
    res.json({ theme: await renameTheme(req.params.id, req.body.name) });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    res.json(await publishTheme(req.params.id));
  } catch (err) {
    fail(res, err);
  }
});

router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { fileName, zip } = await exportTheme(req.params.id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(zip);
  } catch (err) {
    fail(res, err);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteTheme(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    fail(res, err);
  }
});

export default router;
