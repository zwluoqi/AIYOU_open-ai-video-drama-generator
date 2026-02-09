/**
 * 项目 CRUD API
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';

const router = Router();

// GET /api/projects - 获取所有项目
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const projects = await db('projects').orderBy('updated_at', 'desc');
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects - 创建项目
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const id = uuidv4();
    const { title = '未命名项目', settings = {} } = req.body;
    const [project] = await db('projects').insert({ id, title, settings: JSON.stringify(settings) }).returning('*');
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id - 获取项目详情（含所有节点、连接、分组）
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const project = await db('projects').where({ id }).first();
    if (!project) return res.status(404).json({ success: false, error: '项目不存在' });

    const [nodes, connections, groups] = await Promise.all([
      db('nodes').where({ project_id: id }),
      db('connections').where({ project_id: id }),
      db('groups').where({ project_id: id }),
    ]);

    // Attach media files to nodes
    const nodeIds = nodes.map(n => n.id);
    const mediaFiles = nodeIds.length > 0
      ? await db('media_files').whereIn('node_id', nodeIds)
      : [];

    const mediaByNode = {};
    for (const mf of mediaFiles) {
      if (!mediaByNode[mf.node_id]) mediaByNode[mf.node_id] = [];
      mediaByNode[mf.node_id].push(mf);
    }

    const nodesWithMedia = nodes.map(n => ({
      ...n,
      media: mediaByNode[n.id] || [],
    }));

    res.json({
      success: true,
      data: { ...project, nodes: nodesWithMedia, connections, groups },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { title, settings } = req.body;
    const updates = { updated_at: new Date() };
    if (title !== undefined) updates.title = title;
    if (settings !== undefined) updates.settings = JSON.stringify(settings);
    const [project] = await db('projects').where({ id }).update(updates).returning('*');
    if (!project) return res.status(404).json({ success: false, error: '项目不存在' });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/projects/:id - 删除项目（级联删除所有关联数据）
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const deleted = await db('projects').where({ id }).del();
    if (!deleted) return res.status(404).json({ success: false, error: '项目不存在' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
