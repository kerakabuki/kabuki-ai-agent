import { Hono } from 'hono';
import type { Env } from '../types';

export const quizRoutes = new Hono<{ Bindings: Env }>();

// List quizzes
quizRoutes.get('/', async (c) => {
  const difficulty = c.req.query('difficulty');
  const category = c.req.query('category');
  const used = c.req.query('used'); // 'true' or 'false'

  let query = 'SELECT q.*, p.post_date FROM quiz_posts q LEFT JOIN posts p ON q.post_id = p.id WHERE 1=1';
  const params: string[] = [];

  if (difficulty) { query += ' AND q.difficulty = ?'; params.push(difficulty); }
  if (category) { query += ' AND q.category = ?'; params.push(category); }
  if (used === 'true') { query += ' AND q.post_id IS NOT NULL'; }
  if (used === 'false') { query += ' AND q.post_id IS NULL'; }

  query += ' ORDER BY q.id ASC';
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});

// Get single quiz
quizRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM quiz_posts WHERE id = ?').bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

// Import quizzes
quizRoutes.post('/import', async (c) => {
  const quizzes = await c.req.json() as Array<Record<string, unknown>>;
  const batchSize = 50;
  let imported = 0;

  for (let i = 0; i < quizzes.length; i += batchSize) {
    const batch = quizzes.slice(i, i + batchSize);
    const stmts = batch.map((q) =>
      c.env.DB.prepare(
        `INSERT INTO quiz_posts (question, options, correct_answer, explanation, difficulty, category)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        q.question as string,
        typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
        q.correct_answer as number,
        (q.explanation as string) || null,
        (q.difficulty as string) || 'intermediate',
        (q.category as string) || null
      )
    );
    await c.env.DB.batch(stmts);
    imported += batch.length;
  }

  return c.json({ imported });
});

// Create single quiz
quizRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO quiz_posts (question, options, correct_answer, explanation, difficulty, category)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    body.question,
    typeof body.options === 'string' ? body.options : JSON.stringify(body.options),
    body.correct_answer,
    body.explanation || null,
    body.difficulty || 'intermediate',
    body.category || null
  ).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});

// Update quiz
quizRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE quiz_posts SET question=?, options=?, correct_answer=?, explanation=?, difficulty=?, category=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.question,
    typeof body.options === 'string' ? body.options : JSON.stringify(body.options),
    body.correct_answer,
    body.explanation || null,
    body.difficulty || 'intermediate',
    body.category || null,
    id
  ).run();
  return c.json({ success: true });
});

// Delete quiz
quizRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM quiz_posts WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
