const { query } = require('../../config/database');
const { paginate, slugify } = require('../../utils/helpers');
const { NotFoundError } = require('../../utils/errors');

const createResource = async (userId, payload) => {
  const slug = `${slugify(payload.title)}-${Date.now()}`;
  await query(
    `INSERT INTO resources (created_by, title, slug, description, body, category, external_url, thumbnail_url, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, false)`,
    [
      userId,
      payload.title,
      slug,
      payload.description,
      payload.body,
      payload.category,
      payload.external_url,
      payload.thumbnail_url
    ]
  );

  const res = await query('SELECT * FROM resources WHERE slug = ? LIMIT 1', [slug]);
  return res.rows[0];
};

const updateResource = async (id, payload) => {
  const res = await query(
    `UPDATE resources
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         body = COALESCE(?, body),
         category = COALESCE(?, category),
         external_url = COALESCE(?, external_url),
         thumbnail_url = COALESCE(?, thumbnail_url),
         updated_at = NOW()
     WHERE id = ? OR slug = ?`,
    [
      payload.title,
      payload.description,
      payload.body,
      payload.category,
      payload.external_url,
      payload.thumbnail_url,
      id,
      id
    ]
  );

  if (res.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }

  const row = await query('SELECT * FROM resources WHERE id = ? OR slug = ? LIMIT 1', [id, id]);
  return row.rows[0];
};

const deleteResource = async (id) => {
  const existing = await query('SELECT id FROM resources WHERE id = ? OR slug = ? LIMIT 1', [id, id]);
  if (existing.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }

  const res = await query('DELETE FROM resources WHERE id = ? OR slug = ?', [id, id]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }
  return { id: existing.rows[0].id };
};

const publishResource = async (id) => {
  const res = await query("UPDATE resources SET is_published = true, updated_at = NOW() WHERE id = ? OR slug = ?", [id, id]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }
  const row = await query('SELECT * FROM resources WHERE id = ? OR slug = ? LIMIT 1', [id, id]);
  return row.rows[0];
};

const listResources = async (filters) => {
  const { page, limit, offset } = paginate(filters);
  const values = [];
  const where = ["is_published = true"];

  if (filters.category) {
    values.push(filters.category);
    where.push('category = ?');
  }

  values.push(limit, offset);

  const res = await query(
    `SELECT * FROM resources
     WHERE ${where.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    values
  );

  const ids = res.rows.map((r) => r.id);
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(', ');
    await query(`UPDATE resources SET views_count = views_count + 1 WHERE id IN (${placeholders})`, ids);
  }

  const countRes = await query(
    `SELECT COUNT(*) AS total FROM resources WHERE ${where.join(' AND ')}`,
    values.slice(0, values.length - 2)
  );

  const total = Number(countRes.rows[0].total || 0);
  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

const getResource = async (idOrSlug) => {
  const res = await query('SELECT * FROM resources WHERE (id = ? OR slug = ?) AND is_published = true LIMIT 1', [idOrSlug, idOrSlug]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }

  await query('UPDATE resources SET views_count = views_count + 1 WHERE id = ?', [res.rows[0].id]);
  return res.rows[0];
};

const getYouthProfileId = async (userId) => {
  const res = await query('SELECT id FROM youth_profiles WHERE user_id = ?', [userId]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Youth profile not found');
  }
  return res.rows[0].id;
};

const addBookmark = async (resourceId, userId) => {
  const youthId = await getYouthProfileId(userId);
  const resourceRes = await query('SELECT id FROM resources WHERE id = ? OR slug = ?', [resourceId, resourceId]);
  if (resourceRes.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }

  await query(
    `INSERT INTO bookmarks (youth_id, resource_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE resource_id = resource_id`,
    [youthId, resourceRes.rows[0].id]
  );

  return { resourceId: resourceRes.rows[0].id };
};

const removeBookmark = async (resourceId, userId) => {
  const youthId = await getYouthProfileId(userId);
  const resourceRes = await query('SELECT id FROM resources WHERE id = ? OR slug = ?', [resourceId, resourceId]);
  if (resourceRes.rowCount === 0) {
    throw new NotFoundError('Resource not found');
  }

  await query('DELETE FROM bookmarks WHERE youth_id = ? AND resource_id = ?', [youthId, resourceRes.rows[0].id]);
  return { resourceId: resourceRes.rows[0].id };
};

const myBookmarks = async (userId) => {
  const youthId = await getYouthProfileId(userId);
  const res = await query(
    `SELECT r.*
     FROM bookmarks b
     JOIN resources r ON r.id = b.resource_id
     WHERE b.youth_id = ?
     ORDER BY b.created_at DESC`,
    [youthId]
  );

  return res.rows;
};

module.exports = {
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  listResources,
  getResource,
  addBookmark,
  removeBookmark,
  myBookmarks
};
