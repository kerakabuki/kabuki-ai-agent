import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Image, FileText, CheckCircle, Clock, Edit3, Sparkles, Download, Users, HelpCircle, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

interface Stats {
  total: number;
  draft: number;
  approved: number;
  posted: number;
  images: number;
  characters: number;
  quizzes: number;
}

const STEPS = [
  {
    num: 1,
    title: 'キャラクター確認',
    desc: 'KABUKI NAVIから取得した歌舞伎キャラクター（135件）を確認。演目エディタの画像も自動表示されます。',
    link: '/characters',
    icon: Users,
    doneKey: 'characters' as const,
  },
  {
    num: 2,
    title: '画像アップロード',
    desc: 'SNS投稿に使う画像をアップロード。Instagram/X/Facebook用に自動リサイズされます。',
    link: '/images',
    icon: Image,
    doneKey: 'images' as const,
  },
  {
    num: 3,
    title: '365日カレンダー生成',
    desc: '「365日生成」ボタンで1年分の投稿スケジュールを自動作成。曜日テーマ・画像・キャラクターが自動割当されます。',
    link: '/calendar',
    icon: Calendar,
    doneKey: 'total' as const,
  },
  {
    num: 4,
    title: 'AI文章生成',
    desc: 'カレンダーから投稿を選んで「AI生成」→ Geminiが4プラットフォーム分のテキストを自動作成。手動編集もOK。',
    link: '/calendar',
    icon: Sparkles,
    doneKey: 'draft' as const,
    invertCheck: true,
  },
  {
    num: 5,
    title: 'CSVエクスポート',
    desc: '完成した投稿をCSVでエクスポート。プラットフォーム別・期間指定で出力できます。',
    link: '/export',
    icon: Download,
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, approved: 0, posted: 0, images: 0, characters: 0, quizzes: 0 });
  const [todayPost, setTodayPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [posts, images, quizzes] = await Promise.all([
          api.posts.list(),
          api.images.list(),
          api.quiz.list(),
        ]);
        const total = posts.length;
        const draft = posts.filter((p: any) => p.status === 'draft').length;
        const approved = posts.filter((p: any) => p.status === 'approved').length;
        const posted = posts.filter((p: any) => p.status === 'posted').length;
        setStats({ total, draft, approved, posted, images: images.length, characters: 10, quizzes: quizzes.length });

        const today = new Date().toISOString().split('T')[0];
        const tp = posts.find((p: any) => p.post_date === today);
        setTodayPost(tp || null);

        // Hide guide if calendar already generated
        if (total > 0) setShowGuide(false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const statCards = [
    { label: '全投稿', value: stats.total, icon: FileText, color: 'bg-blue-50 text-blue-700' },
    { label: '下書き', value: stats.draft, icon: Edit3, color: 'bg-yellow-50 text-yellow-700' },
    { label: '承認済', value: stats.approved, icon: CheckCircle, color: 'bg-green-50 text-green-700' },
    { label: '投稿済', value: stats.posted, icon: Clock, color: 'bg-purple-50 text-purple-700' },
  ];

  const isStepDone = (step: typeof STEPS[number]) => {
    if (!step.doneKey) return false;
    const val = stats[step.doneKey];
    if (step.invertCheck) return val === 0 && stats.total > 0; // All drafts converted
    return val > 0;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">ダッシュボード</h2>
      <p className="text-sm text-gray-500 mb-6">KABUKI POST 365 — SNS投稿管理システム</p>

      {/* How to use guide */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-5 mb-8">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-base font-semibold text-red-800">
            📖 使い方ガイド — 5ステップで365日分の投稿を作成
          </h3>
          <span className="text-red-400 text-sm">{showGuide ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>

        {showGuide && (
          <div className="mt-4 space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const done = isStepDone(step);
              return (
                <Link
                  key={step.num}
                  to={step.link}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    done ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    done ? 'bg-green-500 text-white' : 'bg-red-700 text-white'
                  }`}>
                    {done ? '✓' : step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={done ? 'text-green-600' : 'text-red-700'} />
                      <span className={`font-medium text-sm ${done ? 'text-green-700' : 'text-gray-900'}`}>{step.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                </Link>
              );
            })}

            <div className="bg-white border border-amber-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                <b>💡 曜日テーマ:</b> 月=演目 / 火=役者 / 水=豆知識 / 木=名場面 / 金=クイズ / 土=舞台裏 / 日=歴史<br/>
                <b>💡 CTA:</b> 投稿の末尾に自動で「詳しくはこちら→」等のリンクが入ります（設定で変更可）
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Sub stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{stats.images}</div>
          <div className="text-xs text-gray-500">画像</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{stats.characters}</div>
          <div className="text-xs text-gray-500">キャラクター</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{stats.quizzes}</div>
          <div className="text-xs text-gray-500">クイズ</div>
        </div>
      </div>

      {/* Today's Post */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">今日の投稿</h3>
        {todayPost ? (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm bg-gray-100 px-2 py-1 rounded">{todayPost.theme}</span>
              <span className="text-sm text-gray-500">{todayPost.post_date}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                todayPost.status === 'posted' ? 'bg-green-100 text-green-700' :
                todayPost.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{todayPost.status}</span>
            </div>
            {todayPost.instagram_text && (
              <p className="text-sm text-gray-600 line-clamp-3">{todayPost.instagram_text}</p>
            )}
            <Link to={`/posts/${todayPost.id}`} className="text-sm text-red-700 hover:underline mt-2 inline-block">
              編集する →
            </Link>
          </div>
        ) : (
          <p className="text-gray-500">
            {stats.total === 0
              ? 'カレンダーで「365日生成」を実行すると、ここに今日の投稿が表示されます'
              : '今日の投稿はまだ作成されていません'}
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/calendar" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors">
          <Calendar size={24} className="text-red-700" />
          <div>
            <div className="font-medium">カレンダー</div>
            <div className="text-sm text-gray-500">投稿スケジュール管理</div>
          </div>
        </Link>
        <Link to="/quiz" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors">
          <HelpCircle size={24} className="text-red-700" />
          <div>
            <div className="font-medium">クイズ管理</div>
            <div className="text-sm text-gray-500">金曜投稿用のクイズ</div>
          </div>
        </Link>
        <Link to="/export" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors">
          <Download size={24} className="text-red-700" />
          <div>
            <div className="font-medium">エクスポート</div>
            <div className="text-sm text-gray-500">CSV出力</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
