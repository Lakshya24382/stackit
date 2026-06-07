import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './HomePage.css';

export default function HomePage() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    api.get('/questions', { params: { page, filter, search } })
      .then(r => { setQuestions(r.data.questions); setTotal(r.data.total); })
      .catch(console.error);
  }, [page, filter, search]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="home">
      {/* Top Bar */}
      <div className="home-topbar">
        <h1>All Questions <span>{total}</span></h1>
        <Link to="/ask"><button className="btn-primary">Ask New Question</button></Link>
      </div>

      {/* Filters + Search */}
      <div className="home-controls">
        <div className="filters">
          {['newest', 'unanswered'].map(f => (
            <button key={f} className={filter === f ? 'active' : ''}
              onClick={() => { setFilter(f); setPage(1); }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search questions..."
          />
          <button type="submit">🔍</button>
        </form>
      </div>

      {/* Questions List */}
      <div className="question-list">
        {questions.length === 0
          ? <p className="empty">No questions found.</p>
          : questions.map(q => (
            <div key={q.id} className="question-card"
              onClick={() => navigate(`/questions/${q.id}`)}>
              <div className="q-meta">
                <span className="ans-count">{q.answer_count} answers</span>
                {q.accepted_answer_id && <span className="accepted">✓ Answered</span>}
              </div>
              <div className="q-body">
                <h3>{q.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: q.description.substring(0, 150) + '...' }} />
                <div className="q-footer">
                  <div className="tags">
                    {(q.tags || []).filter(Boolean).map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                  <span className="author">👤 {q.username} · {new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
        </div>
      )}
    </div>
  );
}