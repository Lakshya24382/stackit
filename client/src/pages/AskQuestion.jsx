import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './AskQuestion.css';

export default function AskQuestion() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (!tags.includes(t) && tags.length < 5) setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    if (!description.trim()) return setError('Description is required');
    if (tags.length === 0) return setError('Add at least one tag');
    setLoading(true);
    try {
      const res = await api.post('/questions', { title, description, tags });
      navigate(`/questions/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post question');
    } finally { setLoading(false); }
  };

  return (
    <div className="ask-container">
      <h2>Ask a Question</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Be specific and concise" maxLength={300} />
          <span className="char-count">{title.length}/300</span>
        </div>

        <div className="form-group">
          <label>Description</label>
          <div data-color-mode="light">
            <MDEditor value={description} onChange={setDescription} height={250} />
          </div>
        </div>

        <div className="form-group">
          <label>Tags <span className="hint">(press Enter to add, max 5)</span></label>
          <div className="tag-input-wrapper">
            {tags.map(t => (
              <span key={t} className="tag">
                {t} <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
              </span>
            ))}
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag} placeholder={tags.length < 5 ? 'e.g. react, sql...' : ''}
              disabled={tags.length >= 5} />
          </div>
        </div>

        <button type="submit" className="btn-primary submit-btn" disabled={loading}>
          {loading ? 'Posting...' : 'Post Question'}
        </button>
      </form>
    </div>
  );
}