import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './QuestionPage.css';

export default function QuestionPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestion = () => {
    api.get(`/questions/${id}`).then(r => setQuestion(r.data)).catch(console.error);
  };

  useEffect(() => { fetchQuestion(); }, [id]);

  const handleVote = async (answerId, voteType) => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/answers/${answerId}/vote`, { vote_type: voteType });
      fetchQuestion();
    } catch (err) {
      alert(err.response?.data?.message || 'Vote failed');
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await api.patch(`/answers/${answerId}/accept`);
      fetchQuestion();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!answer.trim()) return setError('Answer cannot be empty');
    setLoading(true);
    try {
      await api.post(`/answers/${id}`, { body: answer });
      setAnswer('');
      setError('');
      fetchQuestion();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post answer');
    } finally { setLoading(false); }
  };

  if (!question) return <div className="loading">Loading...</div>;

  return (
    <div className="qpage">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> › <span>{question.title.substring(0, 50)}...</span>
      </div>

      {/* Question */}
      <div className="question-detail">
        <h1>{question.title}</h1>
        <div className="q-info">
          <span>👤 {question.username}</span>
          <span>🕒 {new Date(question.created_at).toLocaleDateString()}</span>
          <div className="tags">
            {(question.tags || []).filter(Boolean).map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
        <div className="q-description" data-color-mode="light">
          <MDEditor.Markdown source={question.description} />
        </div>
      </div>

      {/* Answers */}
      <div className="answers-section">
        <h2>{question.answers?.length || 0} Answers</h2>

        {question.answers?.length === 0 && (
          <p className="no-answers">No answers yet. Be the first to answer!</p>
        )}

        {question.answers?.map(ans => (
          <div key={ans.id} className={`answer-card ${ans.is_accepted ? 'accepted' : ''}`}>
            <div className="vote-col">
              <button className="vote-btn up" onClick={() => handleVote(ans.id, 1)}>▲</button>
              <span className="vote-score">{ans.vote_score}</span>
              <button className="vote-btn down" onClick={() => handleVote(ans.id, -1)}>▼</button>
              {question.user_id === user?.id && !ans.is_accepted && (
                <button className="accept-btn" onClick={() => handleAccept(ans.id)}
                  title="Accept this answer">✓</button>
              )}
              {ans.is_accepted && <span className="accepted-badge">✓</span>}
            </div>
            <div className="answer-body">
              <div data-color-mode="light">
                <MDEditor.Markdown source={ans.body} />
              </div>
              <div className="answer-meta">
                👤 {ans.username} · {new Date(ans.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Answer */}
      <div className="submit-answer">
        <h2>Your Answer</h2>
        {!user ? (
          <p className="login-prompt">
            <Link to="/login">Login</Link> to post an answer.
          </p>
        ) : (
          <form onSubmit={handleSubmitAnswer}>
            {error && <p className="error">{error}</p>}
            <div data-color-mode="light">
              <MDEditor value={answer} onChange={setAnswer} height={200} />
            </div>
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Posting...' : 'Post Answer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}