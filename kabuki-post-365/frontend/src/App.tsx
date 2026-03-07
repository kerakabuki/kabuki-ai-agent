import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import PostEditPage from './pages/PostEditPage';
import ImagesPage from './pages/ImagesPage';
import CharactersPage from './pages/CharactersPage';
import QuizPage from './pages/QuizPage';
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/SettingsPage';
import { hasAuthToken, setAuthToken } from './lib/api';

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setAuthToken(token);
        onLogin();
      } else {
        setError('トークンが正しくありません');
      }
    } catch {
      setError('接続エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎭</div>
          <h1 className="text-xl font-bold text-gray-900">KABUKI POST 365</h1>
          <p className="text-sm text-gray-500 mt-1">管理画面にログイン</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-gray-700 block mb-1">APIトークン</label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
            placeholder="トークンを入力"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={!token || loading}
            className="w-full py-2.5 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(hasAuthToken());

  // Also check if token was set externally (e.g., after 401 reload)
  useEffect(() => {
    setAuthed(hasAuthToken());
  }, []);

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/posts/:id" element={<PostEditPage />} />
          <Route path="/images" element={<ImagesPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
