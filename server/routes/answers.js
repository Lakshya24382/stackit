const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Post answer
router.post('/:questionId', auth, async (req, res) => {
  const { body } = req.body;
  const answer = await pool.query(
    'INSERT INTO answers (question_id, user_id, body) VALUES ($1,$2,$3) RETURNING *',
    [req.params.questionId, req.user.id, body]
  );
  // Notify question owner
  const q = await pool.query('SELECT user_id, title FROM questions WHERE id=$1', [req.params.questionId]);
  if (q.rows[0].user_id !== req.user.id) {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message, link) VALUES ($1,$2,$3,$4)',
      [q.rows[0].user_id, 'answer', `Someone answered your question: "${q.rows[0].title}"`, `/questions/${req.params.questionId}`]
    );
  }
  res.status(201).json(answer.rows[0]);
});

// Vote on answer
router.post('/:answerId/vote', auth, async (req, res) => {
  const { vote_type } = req.body; // 1 or -1
  try {
    await pool.query(
      `INSERT INTO votes (user_id, answer_id, vote_type) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, answer_id) DO UPDATE SET vote_type=$3`,
      [req.user.id, req.params.answerId, vote_type]
    );
    const score = await pool.query('SELECT COALESCE(SUM(vote_type),0)::int AS score FROM votes WHERE answer_id=$1', [req.params.answerId]);
    res.json({ score: score.rows[0].score });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Accept answer (question owner only)
router.patch('/:answerId/accept', auth, async (req, res) => {
  const answer = await pool.query('SELECT * FROM answers WHERE id=$1', [req.params.answerId]);
  const question = await pool.query('SELECT * FROM questions WHERE id=$1', [answer.rows[0].question_id]);
  if (question.rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await pool.query('UPDATE answers SET is_accepted=FALSE WHERE question_id=$1', [answer.rows[0].question_id]);
  await pool.query('UPDATE answers SET is_accepted=TRUE WHERE id=$1', [req.params.answerId]);
  await pool.query('UPDATE questions SET accepted_answer_id=$1 WHERE id=$2', [req.params.answerId, answer.rows[0].question_id]);
  res.json({ message: 'Accepted' });
});

module.exports = router;