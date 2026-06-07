const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET all questions (paginated, filterable)
router.get('/', async (req, res) => {
  const { page = 1, filter = 'newest', search = '' } = req.query;
  const limit = 10, offset = (page - 1) * limit;
  let orderBy = 'q.created_at DESC';
  if (filter === 'unanswered') orderBy = 'answer_count ASC, q.created_at DESC';

  const result = await pool.query(`
    SELECT q.*, u.username, u.avatar_url,
      COUNT(DISTINCT a.id)::int AS answer_count,
      ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM questions q
    JOIN users u ON q.user_id = u.id
    LEFT JOIN answers a ON a.question_id = q.id
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    WHERE q.title ILIKE $1 OR q.description ILIKE $1
    GROUP BY q.id, u.username, u.avatar_url
    ORDER BY ${orderBy}
    LIMIT $2 OFFSET $3
  `, [`%${search}%`, limit, offset]);

  const countResult = await pool.query('SELECT COUNT(*) FROM questions WHERE title ILIKE $1', [`%${search}%`]);
  res.json({ questions: result.rows, total: parseInt(countResult.rows[0].count) });
});

// GET single question
router.get('/:id', async (req, res) => {
  const q = await pool.query(`
    SELECT q.*, u.username, u.avatar_url,
      ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tags
    FROM questions q JOIN users u ON q.user_id=u.id
    LEFT JOIN question_tags qt ON qt.question_id=q.id
    LEFT JOIN tags t ON t.id=qt.tag_id
    WHERE q.id=$1 GROUP BY q.id, u.username, u.avatar_url
  `, [req.params.id]);
  if (!q.rows[0]) return res.status(404).json({ message: 'Not found' });

  const answers = await pool.query(`
    SELECT a.*, u.username, u.avatar_url,
      COALESCE(SUM(v.vote_type),0)::int AS vote_score
    FROM answers a JOIN users u ON a.user_id=u.id
    LEFT JOIN votes v ON v.answer_id=a.id
    WHERE a.question_id=$1 GROUP BY a.id, u.username, u.avatar_url
    ORDER BY a.is_accepted DESC, vote_score DESC
  `, [req.params.id]);

  res.json({ ...q.rows[0], answers: answers.rows });
});

// POST create question (auth required)
router.post('/', auth, async (req, res) => {
  const { title, description, tags } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = await client.query(
      'INSERT INTO questions (title, description, user_id) VALUES ($1,$2,$3) RETURNING *',
      [title, description, req.user.id]
    );
    const qId = q.rows[0].id;
    for (const tagName of tags) {
      const tag = await client.query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
        [tagName.toLowerCase()]
      );
      await client.query('INSERT INTO question_tags VALUES ($1,$2)', [qId, tag.rows[0].id]);
    }
    await client.query('COMMIT');
    res.status(201).json(q.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally { client.release(); }
});

module.exports = router;