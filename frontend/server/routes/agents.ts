import { Router } from 'express';

const router = Router();

// All /api/agents/* routes return 501 — namespace reserved for V1.0 (FR-024)
router.all('/*', (_req, res) => {
  res.status(501).json({
    error: 'Agent API not implemented — reserved for V1.0',
    code: 'NOT_IMPLEMENTED',
  });
});

export default router;
