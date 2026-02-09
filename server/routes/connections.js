/**
 * 连接 CRUD API
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';

const router = Router();

// POST /api/connections - 创建连接
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { project_id, from_node, to_node } = req.body;
    const id = req.body.id || uuidv4();
    const [conn] = await db('connections').insert({ id, project_id, from_node, to_node }).returning('*');
    res.json({ success: true, data: conn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/connections/:id - 删除连接
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const deleted = await db('connections').where({ id: req.params.id }).del();
    if (!deleted) return res.status(404).json({ success: false, error: '连接不存在' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
