import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) api.get('/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, [user]);

  const unread = notifs.filter(n => !n.is_read).length;

  const handleBell = () => {
    setOpen(!open);
    if (!open && unread > 0) {
      api.patch('/notifications/read-all').then(() =>
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      );
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">StackIt</Link>
      <div className="nav-right">
        {user ? (
          <>
            <Link to="/ask"><button className="btn-primary">Ask Question</button></Link>
            <div className="notif-wrapper">
              <button className="bell-btn" onClick={handleBell}>
                🔔 {unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {open && (
                <div className="notif-dropdown">
                  <h4>Notifications</h4>
                  {notifs.length === 0
                    ? <p className="empty">No notifications</p>
                    : notifs.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => { navigate(n.link || '/'); setOpen(false); }}>
                        {n.message}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <span className="username">👤 {user.username}</span>
            <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"><button>Login</button></Link>
            <Link to="/register"><button className="btn-primary">Register</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}