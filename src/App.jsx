import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Building2, GraduationCap, Users, CheckSquare, Folder, Trash2, X, ChevronDown, ChevronRight as ChevronRightIcon, Tag, Settings, MapPin, LayoutGrid, List, Clock, AlertTriangle, ExternalLink, Bell, User, Library, MessageSquare, FileText, Bookmark, Send, History, MessageSquareText, Sparkles, UserPlus, Lock, ShieldCheck, LogOut, Pencil, Save, Loader2, Info, XCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';

// ==========================================
// 1. Firebase 初期化設定
// ==========================================
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
     apiKey: "AIzaSyAMxTDK4w4Ys9Dji-mxkl9Wi9tpjKPm6ho",
  authDomain: "seiki-portal.firebaseapp.com",
  projectId: "seiki-portal",
  storageBucket: "seiki-portal.firebasestorage.app",
  messagingSenderId: "806874141485",
  appId: "1:806874141485:web:76f51d0dd67664542079a4"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'seiki-portal';

// ==========================================
// 2. 定数・初期データ
// ==========================================
const DEFAULT_GRADES = ["小1", "小2", "小3", "小4", "小5", "小6", "中1", "中2", "中3", "全学年"];
const DEFAULT_COURSES = ["S-kids", "玉井式", "SSJ", "中学受験", "SSS", "同志社専科", "公立中高一貫", "TOP高校", "スコップ", "新・中学部", "HSS", "Zクラス", "Sクラス"]; 

const CATEGORIES = [
  { name: "通常授業", subcategories: [] },
  { name: "季節講習", subcategories: [] },
  { name: "模試・テスト", subcategories: [] },
  { name: "イベント", subcategories: [] },
  { name: "面談・保護者会", subcategories: [] },
  { name: "教室運営", subcategories: [] },
  { name: "事務連絡", subcategories: [] },
  { name: "その他", subcategories: [] }
];
const MANUAL_CATEGORIES = ["人事", "DX", "マーケティング", "経理財務", "総務", "その他"];

const INITIAL_USERS = [
  { name: '本部', branch: '全教室', role: '管理者', password: 'Seiki1962' },
  { name: '稲永昌大', branch: '知求館（北大路）', role: '教室長', password: 'seiki' },
  { name: '馬谷伸一', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '合路郁子', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '亀井淳史', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '杉村茉衣', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '森岡優希', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '小髙みずき', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '金地和也', branch: 'SSS（烏丸二条）', role: 'スタッフ', password: 'seiki' },
  { name: '大本富子', branch: 'SSS（烏丸二条）', role: 'スタッフ', password: 'seiki' },
  { name: '齊藤明子', branch: 'SSS（烏丸二条）', role: 'スタッフ', password: 'seiki' },
  { name: '野々村忠大', branch: '京大北教室', role: '教室長', password: 'seiki' },
  { name: '福田麻衣', branch: '京大北教室', role: 'スタッフ', password: 'seiki' },
  { name: '永禮慎二', branch: '桂教室', role: '教室長', password: 'seiki' },
  { name: '岡崎尚美', branch: '桂教室', role: 'スタッフ', password: 'seiki' },
  { name: '岸田太郎', branch: '桂教室', role: 'スタッフ', password: 'seiki' },
  { name: '杉野文音', branch: '桂教室', role: 'スタッフ', password: 'seiki' }
];

const INITIAL_ORG_DATA = [
  {
    name: "次世代第1エリア",
    branches: [
      { name: "知求館（北大路）", staff: ["稲永昌大", "馬谷伸一", "合路郁子", "亀井淳史", "杉村茉衣", "森岡優希", "小髙みずき"] },
      { name: "SSS（烏丸二条）", staff: ["金地和也", "大本富子", "齊藤明子"] },
      { name: "京大北教室", staff: ["野々村忠大", "福田麻衣"] },
      { name: "桂教室", staff: ["永禮慎二", "岡崎尚美", "岸田太郎", "杉野文音"] }
    ]
  }
];

const TEMPLATES = [
  { id: 't1', name: '休講連絡', title: '【緊急】〇〇による休講判断について', type: 'info', category: '事務連絡', subCategory: '', isUrgent: true, summary: '〇〇のため、本日の授業は休講といたします。\n対象教室：\n生徒への対応：\nその他：' },
  { id: 't2', name: '月次報告', title: '【〇月度】教室運営・月次報告', type: 'info', category: '教室運営', subCategory: '', isUrgent: false, summary: '■ 今月の目標達成状況\n\n■ 現場の課題と対策\n\n■ その他共有事項' },
  { id: 't3', name: 'イベント告知', title: '【イベント】〇〇開催のお知らせ', type: 'info', category: 'イベント', subCategory: '', isUrgent: false, summary: 'イベント名：\n日時：\n場所：\n対象学年：\n内容詳細：' }
];

// ==========================================
// 3. UIコンポーネント群
// ==========================================

// カスタムトースト通知
const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto
        ${t.type === 'success' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 
          t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-slate-800 text-white'}`}
      >
        {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
        {t.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        {t.type === 'info' && <Info className="w-5 h-5 text-slate-400" />}
        <span className="text-sm font-bold">{t.message}</span>
      </div>
    ))}
  </div>
);

// アイテムカード
const ItemCard = ({ item, currentUser, onSelect, onToggleBookmark, onDelete }) => {
  if (!currentUser) return null;
  const isRead = item.readBy?.includes(currentUser.id);
  const isMyTask = item.type === 'task' && item.assignee === currentUser.name;
  const isBookmarked = item.bookmarkedBy?.includes(currentUser.id);
  const canDelete = currentUser.role === '管理者' || item.author === currentUser.name;

  return (
    <div 
      onClick={() => onSelect(item.id)}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg group flex flex-col h-full relative
        ${isRead ? 'opacity-70 border-slate-200 bg-slate-50/50' : item.isUrgent ? 'border-red-300 shadow-[0_4px_12px_rgba(239,68,68,0.1)]' : isMyTask ? 'border-blue-300 shadow-[0_4px_12px_rgba(59,130,246,0.1)]' : 'border-slate-200 shadow-sm'}
      `}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex flex-wrap gap-1 pr-6">
          {item.isUrgent && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">緊急</span>}
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
            {item.category}{item.subCategory ? ` > ${item.subCategory}` : ''}
          </span>
          {item.branch !== '全教室' && <span className="border border-slate-200 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">{item.branch}</span>}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(item.id); }} 
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors z-10 ${isBookmarked ? 'bg-amber-50 text-amber-500' : 'text-slate-300 hover:bg-slate-100 hover:text-amber-400'}`} 
          title="お気に入り"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <h3 className={`text-sm font-bold mb-1 line-clamp-2 ${isRead ? 'text-slate-600' : item.isUrgent ? 'text-red-700' : 'text-slate-800'}`}>
        {item.title}
      </h3>
      
      <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 relative">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">{item.author?.[0]}</div>
          <span>{item.author}</span>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 absolute right-16 top-1/2 -translate-y-1/2" 
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {item.comments?.length > 0 && (
            <span className="flex items-center gap-0.5 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
              <MessageSquareText className="w-3 h-3"/> {item.comments.length}
            </span>
          )}
          {!isRead && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm"></span>}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. メインアプリケーション
// ==========================================
export default function IntegratedPortal() {
  // --- 基本ステート ---
  const [isInitializing, setIsInitializing] = useState(true); // Firebaseの初期化中
  const [authUser, setAuthUser] = useState(null);
  const [members, setMembers] = useState([]);      
  const [currentUser, setCurrentUser] = useState(null); 
  const [posts, setPosts] = useState([]);         
  const [settings, setSettings] = useState({
    orgData: [], courses: DEFAULT_COURSES, categories: CATEGORIES, manualCategories: MANUAL_CATEGORIES, grades: DEFAULT_GRADES
  });

  // --- UI・検索ステート ---
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('home');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [toasts, setToasts] = useState([]);

  // --- ローディング（処理中）ステート ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- セットアップ画面ステート ---
  const [setupPhase, setSetupPhase] = useState('auth'); 
  const [setupAuthPass, setSetupAuthPass] = useState('');
  const [setupError, setSetupError] = useState('');

  // --- フィルターステート ---
  const [filters, setFilters] = useState({
    quick: 'all', areas: [], branches: [], grades: [], courses: [], categories: [], subCategories: [], manualCategories: []
  });
  const [expandedSections, setExpandedSections] = useState({ 
    area_branch: false, grade: false, course: false, category: false, manualCategory: false 
  });
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null); 

  // --- モーダル制御ステート ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
  const [settingsTab, setSettingsTab] = useState('org');

  // --- フォームステート ---
  const [newTask, setNewTask] = useState({ 
    type: 'task', title: "", url: "", area: "次世代第1エリア", branch: "全教室", assignType: 'staff', selectedTargets: [], dueDate: "", category: "通常授業", subCategory: "", grades: [], courses: [], summary: "" 
  });
  const [newUserName, setNewUserName] = useState('');
  const [newUserBranch, setNewUserBranch] = useState('全教室');
  const [newUserRole, setNewUserRole] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: '', branch: '', role: '', password: '' });

  // --- 設定入力ステート ---
  const [newAreaName, setNewAreaName] = useState('');
  const [addingBranchTo, setAddingBranchTo] = useState(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [addingStaffTo, setAddingStaffTo] = useState(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newGradeName, setNewGradeName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newManualCategoryName, setNewManualCategoryName] = useState('');

  // --- ログイン画面ステート ---
  const [selectedLoginBranch, setSelectedLoginBranch] = useState(null);
  const [selectedLoginUser, setSelectedLoginUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ==========================================
  // Hooks & Effects
  // ==========================================
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
        showToast('認証エラーが発生しました', 'error');
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
    const unsubscribe = onSnapshot(membersRef, (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsInitializing(false); // メンバー情報の初回ロード完了
    }, (error) => {
      console.error(error);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !currentUser) return;
    
    const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
    const unsubPosts = onSnapshot(postsRef, (snap) => {
      const fetchedPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedPosts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPosts(fetchedPosts);
    }, (err) => console.error(err));

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          orgData: data.orgData || [],
          courses: data.courses || DEFAULT_COURSES,
          grades: data.grades || DEFAULT_GRADES,
          categories: (data.categories || CATEGORIES).map(c => typeof c === 'string' ? { name: c, subcategories: [] } : c),
          manualCategories: data.manualCategories || MANUAL_CATEGORIES
        });
      }
    }, (err) => console.error(err));

    return () => { unsubPosts(); unsubSettings(); };
  }, [authUser, currentUser]);


  // ==========================================
  // 計算ロジック (useMemo)
  // ==========================================
  const selectedItem = useMemo(() => posts.find(p => p.id === selectedItemId), [posts, selectedItemId]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = Array.from({ length: firstDay }, () => null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ 
        day: i, 
        dateStr: dateStr, 
        events: posts.filter(post => post.dueDate === dateStr) 
      });
    }
    return days;
  }, [currentDate, posts]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayObj = calendarDays.find(d => d?.dateStr === selectedDate);
    return dayObj && dayObj.events ? dayObj.events : [];
  }, [calendarDays, selectedDate]);

  const filteredItems = useMemo(() => {
    return posts.filter(item => {
      const matchesSearch = item.title?.includes(searchQuery) || item.author?.includes(searchQuery) || (item.summary && item.summary.includes(searchQuery));
      if (filters.quick === 'todo' && !['todo', 'in-progress', 'unread'].includes(item.status)) return false;
      if (filters.quick === 'manual' && item.type !== 'manual') return false;

      const matchesArea = filters.areas.length === 0 || filters.areas.includes(item.area) || item.area === '全エリア';
      const matchesBranch = filters.branches.length === 0 || filters.branches.includes(item.branch) || item.branch === '全教室';
      const matchesGrade = filters.grades.length === 0 || (item.grades && item.grades.some(g => filters.grades.includes(g))) || (item.grades && item.grades.includes('全学年'));
      const matchesCourse = filters.courses.length === 0 || (item.courses && item.courses.some(c => filters.courses.includes(c)));
      
      let matchesCategory = true;
      if (item.type === 'manual') {
        matchesCategory = filters.manualCategories.length === 0 || filters.manualCategories.includes(item.category);
      } else {
        if (filters.categories.length === 0 && filters.subCategories.length === 0) {
          matchesCategory = true;
        } else {
          const matchCat = filters.categories.includes(item.category);
          const matchSub = item.subCategory && filters.subCategories.includes(item.subCategory);
          matchesCategory = matchCat || matchSub;
        }
      }

      const matchesDate = !selectedDate || item.dueDate === selectedDate;
      const matchesViewMode = viewMode === 'board' ? item.type === 'task' : viewMode === 'manuals' ? item.type === 'manual' : true;

      return matchesSearch && matchesArea && matchesBranch && matchesGrade && matchesCourse && matchesCategory && matchesDate && matchesViewMode;
    });
  }, [posts, searchQuery, filters, selectedDate, viewMode]);

  const dashboardData = useMemo(() => {
    if (!currentUser) return { myTasks: [], unreadInfos: [], snoozedItems: [], myBookmarks: [] };
    const myTasks = posts.filter(item => 
      item.type === 'task' && item.status !== 'done' && 
      (item.assignee === currentUser.name || (item.assignee === '-' && (item.branch === currentUser.branch || item.branch === '全教室')))
    );
    const unreadInfos = posts.filter(item => 
      item.type !== 'task' && item.type !== 'manual' && !item.readBy?.includes(currentUser.id)
    );
    const snoozedItems = posts.filter(item => item.snoozedBy?.includes(currentUser.id));
    const myBookmarks = posts.filter(item => item.bookmarkedBy?.includes(currentUser.id) && item.type === 'manual');
    
    return { myTasks, unreadInfos, snoozedItems, myBookmarks };
  }, [posts, currentUser]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];
    if (filters.quick === 'todo') badges.push({ type: 'quick', value: '未完了タスク', label: '未完了' });
    if (filters.quick === 'manual') badges.push({ type: 'quick', value: 'マニュアル・資料', label: 'マニュアル' });
    filters.areas.forEach(v => badges.push({ type: 'areas', value: v, label: v }));
    filters.branches.forEach(v => badges.push({ type: 'branches', value: v, label: v }));
    filters.grades.forEach(v => badges.push({ type: 'grades', value: v, label: v }));
    filters.courses.forEach(v => badges.push({ type: 'courses', value: v, label: v }));
    filters.categories.forEach(v => badges.push({ type: 'categories', value: v, label: v }));
    filters.subCategories.forEach(v => badges.push({ type: 'subCategories', value: v, label: v }));
    filters.manualCategories.forEach(v => badges.push({ type: 'manualCategories', value: v, label: v }));
    if (selectedDate) badges.push({ type: 'date', value: selectedDate, label: new Date(selectedDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) });
    return badges;
  }, [filters, selectedDate]);

  const hasKyomuFilter = filters.areas.length > 0 || filters.branches.length > 0 || filters.grades.length > 0 || filters.courses.length > 0 || filters.categories.length > 0 || filters.subCategories.length > 0;

  // ==========================================
  // アクションハンドラー
  // ==========================================
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (setupAuthPass === 'Seiki1962') {
      setSetupPhase('wizard');
      setSetupError('');
    } else {
      setSetupError('システム管理者パスワードが正しくありません。');
    }
  };

  const executeSetup = async () => {
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
      INITIAL_USERS.forEach(u => {
        const docRef = doc(membersRef);
        batch.set(docRef, u);
      });
  
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master');
      batch.set(settingsRef, {
        orgData: INITIAL_ORG_DATA, grades: DEFAULT_GRADES, courses: DEFAULT_COURSES, categories: CATEGORIES, manualCategories: MANUAL_CATEGORIES
      });
      
      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
      batch.set(doc(postsRef), {
         type: 'info', title: '【完了】SEIKI Portalの初期セットアップが完了しました 🎉', area: '全エリア', branch: '全教室', assignee: '-', status: 'unread', dueDate: '', grades: [], courses: [], category: 'システム', author: 'システム', readBy: [], snoozedBy: [], bookmarkedBy: [], comments: [], summary: 'ポータルの利用を開始できます。右上の歯車アイコン（管理者のみ）から各種設定を変更可能です。', createdAt: serverTimestamp()
      });
  
      await batch.commit();
      setSetupPhase('done');
      showToast('初期セットアップが完了しました');
    } catch(e) {
      console.error(e);
      showToast('セットアップに失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      const newSettings = { ...settings, ...updates };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), newSettings, { merge: true });
      showToast('設定を更新しました');
    } catch (e) {
      showToast('設定の更新に失敗しました', 'error');
    }
  };

  const handleToggleRead = async (itemId) => {
    const post = posts.find(p => p.id === itemId);
    if (!post) return;
    const isRead = post.readBy?.includes(currentUser.id);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', itemId), {
        readBy: isRead ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });
    } catch(e) { showToast('通信エラーが発生しました', 'error'); }
  };

  const handleToggleSnooze = async (itemId) => {
    const post = posts.find(p => p.id === itemId);
    if (!post) return;
    const isSnoozed = post.snoozedBy?.includes(currentUser.id);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', itemId), {
        snoozedBy: isSnoozed ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });
      if (!isSnoozed) showToast('スヌーズに登録しました');
    } catch(e) { showToast('通信エラーが発生しました', 'error'); }
  };

  const handleToggleBookmark = async (itemId) => {
    const post = posts.find(p => p.id === itemId);
    if (!post) return;
    const isBookmarked = post.bookmarkedBy?.includes(currentUser.id);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', itemId), {
        bookmarkedBy: isBookmarked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });
      showToast(isBookmarked ? 'お気に入りを解除しました' : 'お気に入りに登録しました');
    } catch(e) { showToast('通信エラーが発生しました', 'error'); }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', itemId), { status: newStatus });
      showToast('ステータスを更新しました');
    } catch(e) { showToast('通信エラーが発生しました', 'error'); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedItemId) return;
    setIsSubmitting(true);
    try {
      const comment = { id: Date.now().toString(), author: currentUser.name, text: newComment, date: new Date().toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'}) };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', selectedItemId), {
        comments: arrayUnion(comment)
      });
      setNewComment('');
    } catch(e) {
      showToast('コメントの送信に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeConfirm = async () => {
    if (confirmDialog.onConfirm) {
      setIsSubmitting(true);
      try {
        await confirmDialog.onConfirm();
      } catch (e) {
        showToast('処理に失敗しました', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
    setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
  };
  
  const cancelConfirm = () => setConfirmDialog({ isOpen: false, message: '', onConfirm: null });

  const confirmDeletePost = (id) => {
    setConfirmDialog({
      isOpen: true, message: "この情報を削除しますか？\n（この操作は元に戻せません）",
      onConfirm: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', id));
        if (selectedItemId === id) setSelectedItemId(null);
        showToast('情報を削除しました');
      }
    });
  };

  const handleDeleteMember = (memberId, memberName, memberBranch) => {
    setConfirmDialog({
      isOpen: true, message: `${memberName} さんのアカウントを削除しますか？`,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberId));
        if (memberBranch !== '全教室') {
          const newOrgData = settings.orgData.map(area => ({
            ...area, branches: area.branches.map(b => b.name === memberBranch ? { ...b, staff: b.staff.filter(s => s !== memberName) } : b)
          }));
          await updateSettings({ orgData: newOrgData });
        }
        showToast('アカウントを削除しました');
      }
    });
  };

  const handleUpdateMember = async (memberId, oldData, newData) => {
    if (!newData.name.trim() || !newData.password.trim()) {
      showToast('名前とパスワードは必須です', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberId), {
        name: newData.name.trim(), branch: newData.branch, role: newData.role, password: newData.password.trim()
      });

      if (oldData.name !== newData.name.trim() || oldData.branch !== newData.branch) {
        let newOrgData = JSON.parse(JSON.stringify(settings.orgData)); 
        if (oldData.branch !== '全教室') {
          newOrgData = newOrgData.map(area => ({
            ...area, branches: area.branches.map(b => b.name === oldData.branch ? { ...b, staff: b.staff.filter(s => s !== oldData.name) } : b)
          }));
        }
        if (newData.branch !== '全教室') {
          newOrgData = newOrgData.map(area => ({
            ...area, branches: area.branches.map(b => b.name === newData.branch && !b.staff.includes(newData.name.trim()) ? { ...b, staff: [...b.staff, newData.name.trim()] } : b)
          }));
        }
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { ...settings, orgData: newOrgData }, { merge: true });
      }
      setEditingMemberId(null);
      showToast('メンバー情報を更新しました');
    } catch(e) { showToast('更新に失敗しました', 'error'); } 
    finally { setIsSubmitting(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', currentUser.id), {
        password: newPassword.trim()
      });
      setCurrentUser({ ...currentUser, password: newPassword.trim() });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      showToast("パスワードを変更しました");
    } catch(e) { showToast("変更に失敗しました", "error"); } 
    finally { setIsSubmitting(false); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!authUser) return;
    if (newTask.type === 'task' && newTask.selectedTargets.length === 0) { 
      showToast("振り分け先を選択してください", "error"); return; 
    }

    setIsSubmitting(true);
    try {
      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
      const batch = writeBatch(db);
      
      if (newTask.type === 'task') {
        const getStaffBranch = (staffName) => {
          if (newTask.branch !== '全教室') return newTask.branch;
          const area = settings.orgData.find(a => a.name === newTask.area);
          const b = area?.branches.find(b => b.staff.includes(staffName));
          return b ? b.name : '全教室';
        };

        newTask.selectedTargets.forEach((target) => {
          const newDocRef = doc(postsRef);
          batch.set(newDocRef, {
            type: 'task', title: newTask.title, url: newTask.url, area: newTask.area,
            branch: newTask.assignType === 'branch' ? target : getStaffBranch(target),
            assignee: newTask.assignType === 'staff' ? target : '-',
            status: 'todo', dueDate: newTask.dueDate, grades: newTask.grades, courses: newTask.courses, category: newTask.category, subCategory: newTask.subCategory, author: currentUser.name, readBy: [], snoozedBy: [], bookmarkedBy: [], comments: [], summary: newTask.summary, createdAt: serverTimestamp()
          });
        });
      } else {
        const newDocRef = doc(postsRef);
        batch.set(newDocRef, {
          type: newTask.type, title: newTask.title, url: newTask.url, area: newTask.area, branch: newTask.branch, assignee: '-', status: 'unread', dueDate: newTask.dueDate, grades: newTask.grades, courses: newTask.courses, category: newTask.category, subCategory: newTask.subCategory, author: currentUser.name, readBy: [], snoozedBy: [], bookmarkedBy: [], comments: [], summary: newTask.summary, createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      setIsTaskModalOpen(false);
      setNewTask({ type: 'task', title: "", url: "", area: settings.orgData[0]?.name || "次世代第1エリア", branch: "全教室", assignType: 'staff', selectedTargets: [], dueDate: "", category: settings.categories[0]?.name || "通常授業", subCategory: "", grades: [], courses: [], summary: "" });
      showToast('投稿を作成しました');
    } catch(e) {
      showToast('投稿に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const newUser = {
        name: newUserName.trim(), branch: newUserBranch, role: newUserRole, password: 'seiki'
      };
      const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
      await addDoc(membersRef, newUser);

      if (newUserBranch !== '全教室') {
        const newOrgData = settings.orgData.map(area => ({
          ...area, branches: area.branches.map(b => b.name === newUserBranch ? { ...b, staff: [...b.staff, newUser.name] } : b)
        }));
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { ...settings, orgData: newOrgData }, { merge: true });
      }
      setIsInviteModalOpen(false);
      setNewUserName(''); setNewUserRole('');
      showToast(`${newUser.name} さんを招待しました`);
    } catch(e) { showToast('招待に失敗しました', 'error'); } 
    finally { setIsSubmitting(false); }
  };

  // --- フィルタ用ハンドラ ---
  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  const activateMainView = (mode) => {
    if (mode !== 'home') setIsCalendarExpanded(false);
    else setIsCalendarExpanded(true);
    setViewMode(mode);
  };
  const toggleFilter = (type, value) => {
    const isKyomuFilter = ['areas', 'branches', 'grades', 'courses', 'categories', 'subCategories'].includes(type);
    if (isKyomuFilter && viewMode === 'manuals') activateMainView('list');
    if (viewMode === 'home') activateMainView('list');
    
    setFilters(prev => {
      const current = prev[type];
      return current.includes(value) ? { ...prev, [type]: current.filter(v => v !== value) } : { ...prev, [type]: [...current, value] };
    });
  };
  const applyTemplate = (template) => setNewTask(prev => ({ ...prev, type: template.type, title: template.title, category: template.category, subCategory: template.subCategory || '', isUrgent: template.isUrgent, summary: template.summary }));
  const removeFilterBadge = (type, value) => {
    if (type === 'quick') setFilters(prev => ({ ...prev, quick: 'all' }));
    else setFilters(prev => ({ ...prev, [type]: prev[type].filter(v => v !== value) }));
  };
  const clearAllFilters = () => {
    setFilters({ quick: 'all', areas: [], branches: [], grades: [], courses: [], categories: [], subCategories: [], manualCategories: [] });
    setSelectedDate(null); setSearchQuery("");
  };
  const toggleTargetSelection = (targetName) => setNewTask(prev => ({ ...prev, selectedTargets: prev.selectedTargets.includes(targetName) ? prev.selectedTargets.filter(t => t !== targetName) : [...prev.selectedTargets, targetName] }));
  const selectAllTargets = (targetList) => setNewTask(prev => ({ ...prev, selectedTargets: targetList }));
  const clearAllTargets = () => setNewTask(prev => ({ ...prev, selectedTargets: [] }));

  // --- 各種データ設定ハンドラ ---
  const handleAddArea = () => { if (newAreaName.trim() && !settings.orgData.find(a => a.name === newAreaName.trim())) { updateSettings({ orgData: [...settings.orgData, { name: newAreaName.trim(), branches: [] }] }); setNewAreaName(''); } };
  const handleDeleteArea = (areaName) => { setConfirmDialog({ isOpen: true, message: `エリア「${areaName}」を削除しますか？`, onConfirm: () => updateSettings({ orgData: settings.orgData.filter(a => a.name !== areaName) }) }); }
  const handleAddBranch = (areaName) => { if (newBranchName.trim()) { updateSettings({ orgData: settings.orgData.map(a => a.name === areaName ? { ...a, branches: [...a.branches, { name: newBranchName.trim(), staff: [] }] } : a) }); setNewBranchName(''); setAddingBranchTo(null); } };
  const handleDeleteBranch = (areaName, branchName) => { setConfirmDialog({ isOpen: true, message: `教室「${branchName}」を削除しますか？`, onConfirm: () => updateSettings({ orgData: settings.orgData.map(a => a.name === areaName ? { ...a, branches: a.branches.filter(b => b.name !== branchName) } : a) }) }); }
  const handleAddStaff = (areaName, branchName) => { if (newStaffName.trim()) { updateSettings({ orgData: settings.orgData.map(a => a.name === areaName ? { ...a, branches: a.branches.map(b => b.name === branchName && !b.staff.includes(newStaffName.trim()) ? { ...b, staff: [...b.staff, newStaffName.trim()] } : b) } : a) }); setNewStaffName(''); setAddingStaffTo(null); } };
  const handleDeleteStaff = (areaName, branchName, staffName) => { setConfirmDialog({ isOpen: true, message: `スタッフ「${staffName}」を削除しますか？`, onConfirm: () => updateSettings({ orgData: settings.orgData.map(a => a.name === areaName ? { ...a, branches: a.branches.map(b => b.name === branchName ? { ...b, staff: b.staff.filter(s => s !== staffName) } : b) } : a) }) }); };
  const handleAddCourse = () => { if(newCourseName.trim() && !settings.courses.includes(newCourseName.trim())) { updateSettings({ courses: [...settings.courses, newCourseName.trim()] }); setNewCourseName(''); } }
  const handleDeleteCourse = (course) => { setConfirmDialog({ isOpen: true, message: `コース「${course}」を削除しますか？`, onConfirm: () => updateSettings({ courses: settings.courses.filter(c => c !== course) }) }); }
  const handleAddGrade = () => { if(newGradeName.trim() && !(settings.grades || []).includes(newGradeName.trim())) { updateSettings({ grades: [...(settings.grades || []), newGradeName.trim()] }); setNewGradeName(''); } }
  const handleDeleteGrade = (grade) => { setConfirmDialog({ isOpen: true, message: `学年「${grade}」を削除しますか？`, onConfirm: () => updateSettings({ grades: (settings.grades || []).filter(c => c !== grade) }) }); }
  const handleAddCategory = () => { if(newCategoryName.trim() && !settings.categories.find(c => c.name === newCategoryName.trim())) { updateSettings({ categories: [...settings.categories, { name: newCategoryName.trim(), subcategories: [] }] }); setNewCategoryName(''); } }
  const handleDeleteCategory = (catName) => { setConfirmDialog({ isOpen: true, message: `カテゴリー「${catName}」を削除しますか？`, onConfirm: () => updateSettings({ categories: settings.categories.filter(c => c.name !== catName) }) }); }
  const handleAddSubCategory = (catName) => { if (newSubCategoryName.trim()) { updateSettings({ categories: settings.categories.map(c => c.name === catName ? { ...c, subcategories: [...(c.subcategories || []), newSubCategoryName.trim()] } : c) }); setNewSubCategoryName(''); setAddingSubCategoryTo(null); } }
  const handleDeleteSubCategory = (catName, subName) => { setConfirmDialog({ isOpen: true, message: `サブカテゴリー「${subName}」を削除しますか？`, onConfirm: () => updateSettings({ categories: settings.categories.map(c => c.name === catName ? { ...c, subcategories: (c.subcategories || []).filter(s => s !== subName) } : c) }) }); }
  const handleAddManualCategory = () => { if(newManualCategoryName.trim() && !settings.manualCategories.includes(newManualCategoryName.trim())) { updateSettings({ manualCategories: [...settings.manualCategories, newManualCategoryName.trim()] }); setNewManualCategoryName(''); } }
  const handleDeleteManualCategory = (cat) => { setConfirmDialog({ isOpen: true, message: `マニュアル分類「${cat}」を削除しますか？`, onConfirm: () => updateSettings({ manualCategories: settings.manualCategories.filter(c => c !== cat) }) }); }


  // ==========================================
  // Render: ログイン・セットアップ画面
  // ==========================================
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-widest animate-pulse">SYSTEM LOADING...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative">
        <ToastContainer toasts={toasts} />
        <div className="absolute top-0 w-full h-1/2 bg-blue-900 z-0 transition-all duration-700"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 z-0"></div>
        
        {members.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300 border border-slate-200 z-10 transition-all">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-center mb-2 text-slate-800 tracking-tight">SEIKI Portal</h1>
            
            {setupPhase === 'auth' ? (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-center text-slate-500 text-sm mb-6 font-medium">システムの初期設定を行うため<br/>管理者パスワードを入力してください。</p>
                <form onSubmit={handleAdminAuth}>
                  <div className="mb-6 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none transition-colors bg-slate-50 focus:bg-white text-lg font-bold tracking-widest"
                      value={setupAuthPass} onChange={e => {setSetupAuthPass(e.target.value); setSetupError('');}}
                      placeholder="パスワード"
                    />
                    {setupError && <p className="text-red-500 text-xs font-bold mt-2">{setupError}</p>}
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold shadow-md hover:bg-slate-900 transition-colors active:scale-95 flex justify-center items-center gap-2">
                    ロックを解除して設定へ進む
                  </button>
                </form>
              </div>
            ) : setupPhase === 'wizard' ? (
              <div className="mt-6 text-center animate-in fade-in slide-in-from-right-4">
                <div className="border-b border-slate-200 pb-4 mb-6">
                  <h2 className="text-lg font-black text-slate-800">初期マスターデータの設定</h2>
                  <p className="text-sm text-slate-500 mt-2">管理者認証に成功しました。<br/>登録済みのメンバーや教室データを<br/>システムに自動で投入します。</p>
                </div>
                
                <button onClick={executeSetup} disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 active:scale-95">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '初期データをセットアップする'}
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center animate-in fade-in zoom-in">
                 <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8"/></div>
                 <h2 className="text-xl font-black text-slate-800 mb-2">セットアップ完了！</h2>
                 <p className="text-sm text-slate-500 mb-6">画面を再読み込みすると、<br/>ログイン画面が表示されます。</p>
                 <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">再読み込み</button>
              </div>
            )}
          </div>
        ) : !selectedLoginBranch ? (
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300 border border-slate-200 z-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
              <Library className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-center mb-2 text-slate-800 tracking-tight">SEIKI Portal</h1>
            <p className="text-center text-slate-500 text-sm mb-8 font-medium">所属教室を選択してください</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from(new Set(members.map(u => u.branch))).map(branch => (
                <button 
                  key={branch} onClick={() => setSelectedLoginBranch(branch)} 
                  className="w-full p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 text-left flex justify-between items-center transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="font-black text-slate-800 group-hover:text-blue-800 text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500"/> {branch}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500"/>
                </button>
              ))}
            </div>
          </div>
        ) : !selectedLoginUser ? (
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300 border border-slate-200 z-10">
            <button onClick={() => setSelectedLoginBranch(null)} className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4"/> 教室選択に戻る
            </button>
            <h1 className="text-2xl font-black text-center mb-2 text-slate-800 tracking-tight">{selectedLoginBranch}</h1>
            <p className="text-center text-slate-500 text-sm mb-8 font-medium">あなたのお名前を選択してください</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {members.filter(u => u.branch === selectedLoginBranch).map(u => (
                <button 
                  key={u.id} onClick={() => setSelectedLoginUser(u)} 
                  className="w-full p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 text-left flex justify-between items-center transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="font-black text-slate-800 group-hover:text-blue-800 text-base">{u.name} <span className="text-xs font-normal text-slate-500 ml-1">さん</span></div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                    {u.role || '未設定'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300 border border-slate-200 z-10">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
              <Library className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-center mb-6 text-slate-800 tracking-tight">SEIKI Portal</h1>
            <div className="animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0">
                  {selectedLoginUser.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-slate-800 truncate">{selectedLoginUser.name}</div>
                  <div className="text-xs text-slate-500 truncate">{selectedLoginUser.branch} / {selectedLoginUser.role || '-'}</div>
                </div>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if(loginPassword === selectedLoginUser.password) {
                  setCurrentUser(selectedLoginUser);
                  setLoginPassword(''); setLoginError(''); setSelectedLoginUser(null);
                  showToast(`ログインしました。ようこそ、${selectedLoginUser.name}さん。`);
                } else {
                  setLoginError('パスワードが間違っています。');
                }
              }}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">パスワード <span className="text-red-500">*</span></label>
                  <input 
                    type="password" autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none transition-colors bg-slate-50 focus:bg-white"
                    value={loginPassword} onChange={e => {setLoginPassword(e.target.value); setLoginError('');}}
                    placeholder="パスワードを入力"
                  />
                  {loginError && <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">{loginError}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => {setSelectedLoginUser(null); setLoginPassword(''); setLoginError('');}} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">戻る</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors active:scale-95">ログイン</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // Render: メインUI
  // ==========================================
  const gradesList = settings.grades || DEFAULT_GRADES;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-800">
      <ToastContainer toasts={toasts} />
      
      {/* ＝＝＝ 左サイドバー ＝＝＝ */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-20 flex-shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.03)] custom-scrollbar">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 bg-slate-900 text-white">
          <button onClick={() => activateMainView('home')} className="font-black text-lg tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 p-1.5 rounded shadow-sm"><CheckSquare className="w-4 h-4"/></div>
            <span>SEIKI Portal</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 space-y-6 flex-1">
            
            {/* ユーザー情報と設定・招待ボタン */}
            <div className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shadow-inner flex-shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-slate-800 truncate">{currentUser.name}</div>
                  <div className="text-[10px] font-bold text-slate-500 truncate">{currentUser.branch}</div>
                </div>
              </div>
              <div className="border-t border-slate-200 mt-1 pt-2 px-1 flex flex-col gap-1">
                <button onClick={() => setIsPasswordModalOpen(true)} className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                  <Lock className="w-3.5 h-3.5" /> パスワードを変更
                </button>
                {currentUser?.role === '管理者' && (
                  <button onClick={() => setIsInviteModalOpen(true)} className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                    <UserPlus className="w-4 h-4" /> メンバーを招待
                  </button>
                )}
                <button onClick={() => setCurrentUser(null)} className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> ログアウト
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <button onClick={() => activateMainView('home')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${viewMode === 'home' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                <LayoutGrid className="w-4 h-4" /> ダッシュボード
              </button>
              <button onClick={() => { setFilters(prev => ({...prev, quick: 'all'})); activateMainView('list'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${(filters.quick === 'all' && viewMode === 'list') ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                <Folder className="w-4 h-4" /> すべての情報
              </button>
              <button onClick={() => { setFilters(prev => ({...prev, quick: 'todo'})); activateMainView('board'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${viewMode === 'board' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                <CheckCircle2 className="w-4 h-4" /> タスクボード
              </button>
            </div>

            {/* 各種フィルター */}
            <div className="border-t border-slate-200 pt-4">
              <button onClick={() => toggleSection('area_branch')} className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/>エリア・教室で探す</span>
                {expandedSections.area_branch ? <ChevronDown className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
              </button>
              {expandedSections.area_branch && (
                <div className="space-y-4 ml-1 pl-2">
                  {settings.orgData.map(area => (
                    <div key={area.name} className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={filters.areas.includes(area.name)} onChange={() => toggleFilter('areas', area.name)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className={`text-sm font-bold transition-colors ${filters.areas.includes(area.name) ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{area.name}</span>
                      </label>
                      <div className="space-y-1 ml-5 border-l-2 border-slate-100 pl-2">
                        {area.branches.map(b => (
                          <label key={b.name} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={filters.branches.includes(b.name)} onChange={() => toggleFilter('branches', b.name)} className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <span className={`text-xs transition-colors ${filters.branches.includes(b.name) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-blue-600'}`}>{b.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <button onClick={() => toggleSection('grade')} className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5"/>学年で探す</span>
                {expandedSections.grade ? <ChevronDown className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
              </button>
              {expandedSections.grade && (
                <div className="flex flex-col gap-1.5 ml-1 pl-2">
                  {gradesList.map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filters.grades.includes(g)} onChange={() => toggleFilter('grades', g)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className={`text-sm transition-colors ${filters.grades.includes(g) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-blue-600'}`}>{g}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button onClick={() => toggleSection('course')} className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/>コースで探す</span>
                {expandedSections.course ? <ChevronDown className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
              </button>
              {expandedSections.course && (
                <div className="flex flex-col gap-1.5 ml-1 pl-2">
                  {settings.courses.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filters.courses.includes(c)} onChange={() => toggleFilter('courses', c)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                      <span className={`text-sm transition-colors ${filters.courses.includes(c) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-blue-600'}`}>{c}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button onClick={() => toggleSection('category')} className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                 <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/>教務関連カテゴリで探す</span>
                {expandedSections.category ? <ChevronDown className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
              </button>
              {expandedSections.category && (
                <div className="space-y-4 ml-1 pl-2">
                  {settings.categories.map(cat => (
                    <div key={cat.name} className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={filters.categories.includes(cat.name)} onChange={() => toggleFilter('categories', cat.name)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className={`text-sm font-bold transition-colors ${filters.categories.includes(cat.name) ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{cat.name}</span>
                      </label>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="space-y-1 ml-5 border-l-2 border-slate-100 pl-2">
                          {cat.subcategories.map(sub => (
                            <label key={sub} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" checked={filters.subCategories.includes(sub)} onChange={() => toggleFilter('subCategories', sub)} className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              <span className={`text-xs transition-colors ${filters.subCategories.includes(sub) ? 'text-blue-700 font-bold' : 'text-slate-600 group-hover:text-blue-600'}`}>{sub}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-4 mt-auto">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">マニュアル・資料庫</h3>
             <button 
              onClick={() => { setFilters(prev => ({...prev, quick: 'manual'})); activateMainView('manuals'); }}
              disabled={hasKyomuFilter}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors mb-4 
                ${hasKyomuFilter ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200' : 
                  viewMode === 'manuals' ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-200' : 
                  'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
              title={hasKyomuFilter ? "教務情報のフィルターを選択中は開けません" : ""}
            >
              <Library className={`w-4 h-4 ${hasKyomuFilter ? 'text-slate-400' : 'text-amber-600'}`} /> マニュアル・資料
            </button>
            <div>
              <button onClick={() => toggleSection('manualCategory')} className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                 <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/>分類フィルター</span>
                {expandedSections.manualCategory ? <ChevronDown className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
              </button>
              {expandedSections.manualCategory && (
                <div className="flex flex-col gap-1.5 ml-1 pl-2">
                  {settings.manualCategories.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filters.manualCategories.includes(c)} onChange={() => toggleFilter('manualCategories', c)} className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      <span className={`text-sm transition-colors ${filters.manualCategories.includes(c) ? 'text-amber-700 font-bold' : 'text-slate-600 group-hover:text-amber-600'}`}>{c}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* 右側メインエリア */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-50 relative">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" placeholder="キーワード検索..." 
                className="w-full bg-slate-100 border border-slate-200 text-sm text-slate-700 pl-9 pr-4 py-2 rounded-full focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white outline-none transition-all shadow-inner"
                value={searchQuery} onChange={e => {
                  setSearchQuery(e.target.value);
                  if (viewMode === 'home') activateMainView('list');
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-100">
            {currentUser?.role === '管理者' && (
              <button onClick={() => setIsOrgSettingsOpen(true)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors" title="各種設定"><Settings className="w-5 h-5" /></button>
            )}
            <button onClick={() => setIsTaskModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 ml-2"><Plus className="w-4 h-4" /> 投稿を作成</button>
          </div>
        </header>

        {activeFilterBadges.length > 0 && viewMode !== 'home' && (
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 flex-wrap flex-shrink-0 min-h-[40px] shadow-sm z-0">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1"><Search className="w-3 h-3"/> 適用中の絞り込み:</span>
            {activeFilterBadges.map((badge, idx) => (
              <span key={`${badge.type}-${badge.value}-${idx}`} className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm animate-in zoom-in duration-200">
                {badge.label}
                <button onClick={() => { if (badge.type === 'date') setSelectedDate(null); else removeFilterBadge(badge.type, badge.value); }} className="hover:text-red-500 hover:bg-blue-100 rounded-full p-0.5 transition-colors"><X className="w-3.5 h-3.5"/></button>
              </span>
            ))}
            <button onClick={clearAllFilters} className="text-xs font-bold text-slate-400 hover:text-blue-600 ml-2 underline transition-colors">すべてクリア</button>
          </div>
        )}

        <main className="flex-1 overflow-hidden p-4 flex gap-4">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="max-w-6xl mx-auto h-full flex flex-col">
              
              {viewMode === 'home' ? (
                <div className="space-y-8 animate-in fade-in duration-500 pb-8">
                  <div className="bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">お疲れ様です、{currentUser.name}さん</h1>
                      <p className="text-blue-100 font-medium">現在、あなたが確認すべき未読情報が <strong className="text-white text-lg bg-blue-500/50 px-2 py-0.5 rounded">{dashboardData.unreadInfos.length}件</strong> あります。</p>
                    </div>
                    <Sparkles className="absolute right-4 top-4 w-32 h-32 text-white opacity-10 animate-pulse" />
                    <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <section className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-teal-500" /> あなたの担当タスク</h2>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{dashboardData.myTasks.length} 件</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {dashboardData.myTasks.length > 0 ? (
                            dashboardData.myTasks.map(item => <ItemCard key={item.id} item={item} currentUser={currentUser} onSelect={setSelectedItemId} onToggleBookmark={handleToggleBookmark} onDelete={confirmDeletePost} />)
                          ) : (
                            <div className="col-span-full py-8 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">未完了のタスクはありません 🎉</div>
                          )}
                        </div>
                      </section>

                      <section className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" /> 未読の情報・連絡</h2>
                          <button onClick={() => activateMainView('list')} className="text-xs font-bold text-blue-600 hover:underline">すべて見る</button>
                        </div>
                        <div className="space-y-3">
                          {dashboardData.unreadInfos.length > 0 ? (
                            dashboardData.unreadInfos.slice(0,5).map(item => (
                              <div key={item.id} onClick={() => setSelectedItemId(item.id)} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all group">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-800 transition-colors line-clamp-1">{item.title}</h3>
                                  <div className="text-[10px] text-slate-500 mt-1 flex gap-2"><span>{item.author}</span><span>{item.dueDate || '最近'}</span><span className="bg-slate-100 px-1.5 rounded">{item.category}</span></div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-slate-400 font-bold text-sm">未読のお知らせはありません</div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="bg-amber-50 rounded-2xl p-5 shadow-md border border-amber-100">
                        <h2 className="text-sm font-black text-amber-800 flex items-center gap-2 mb-4"><Clock className="w-4 h-4" /> あとで対応する項目</h2>
                        <div className="space-y-2">
                          {dashboardData.snoozedItems.length > 0 ? (
                            dashboardData.snoozedItems.map(item => (
                              <div key={item.id} onClick={() => setSelectedItemId(item.id)} className="bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:ring-1 ring-amber-300 transition-shadow">
                                <h3 className="text-xs font-bold text-slate-800 truncate">{item.title}</h3>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-amber-600/70 text-center py-4 font-bold">スヌーズ中の項目はありません</div>
                          )}
                        </div>
                      </section>

                      <section className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4"><Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" /> お気に入り資料</h2>
                        <div className="space-y-2">
                          {dashboardData.myBookmarks.length > 0 ? (
                            dashboardData.myBookmarks.map(item => (
                              <a key={item.id} href={item.url || '#'} onClick={e => {if(!item.url) {e.preventDefault(); setSelectedItemId(item.id);}}} className="block p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition-colors">
                                <div className="text-[9px] font-bold text-amber-600 mb-1">{item.category}</div>
                                <h3 className="text-xs font-bold text-slate-800 line-clamp-2">{item.title}</h3>
                              </a>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 text-center py-4 font-bold">お気に入りのマニュアルはありません</div>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
                  <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <button onClick={() => activateMainView('home')} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors" title="ホームに戻る"><ChevronLeft className="w-5 h-5" /></button>
                      <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {viewMode === 'list' ? 'すべての情報' : viewMode === 'board' ? 'タスクボード' : 'マニュアル・資料'} 
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{filteredItems.length}</span>
                      </h2>
                    </div>
                    
                    <div className="flex bg-slate-200/70 p-1 rounded-lg border border-slate-200">
                      <button onClick={() => activateMainView('list')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5"/> 一覧</button>
                      <button onClick={() => activateMainView('board')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'board' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid className="w-3.5 h-3.5"/> ボード</button>
                      {!hasKyomuFilter && (
                        <button onClick={() => activateMainView('manuals')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'manuals' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Library className="w-3.5 h-3.5"/> 資料</button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    {viewMode === 'list' && (
                      <div className="flex flex-col gap-3 max-w-5xl mx-auto">
                        {filteredItems.map(item => {
                          const isRead = item.readBy?.includes(currentUser.id);
                          return (
                            <div key={item.id} onClick={() => setSelectedItemId(item.id)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex items-center gap-4 ${isRead ? 'opacity-60 border-slate-200' : item.isUrgent ? 'border-red-300 shadow-red-50' : 'border-slate-200 shadow-sm'}`}>
                              <div className="flex-shrink-0">
                                {item.type === 'urgent' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : item.type === 'task' ? <CheckSquare className="w-6 h-6 text-teal-500" /> : item.type === 'manual' ? <FileText className="w-6 h-6 text-amber-500" /> : <MessageSquare className="w-6 h-6 text-blue-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.category}{item.subCategory ? ` > ${item.subCategory}` : ''}
                                  </span>
                                  <span className="text-xs font-bold text-slate-400">{item.branch}</span>
                                </div>
                                <h3 className={`text-sm font-bold truncate ${isRead ? 'text-slate-500' : 'text-slate-800'}`}>{item.title}</h3>
                              </div>
                              <div className="flex-shrink-0 text-right hidden sm:block">
                                <div className="text-xs font-bold text-slate-500">{item.author}</div>
                                {item.dueDate && <div className="text-[10px] font-bold text-red-500 mt-1">締切: {item.dueDate}</div>}
                              </div>
                              {(currentUser.role === '管理者' || item.author === currentUser.name) && (
                                <div className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-2">
                                  <button onClick={(e) => { e.stopPropagation(); confirmDeletePost(item.id); }} className="text-slate-300 hover:text-red-500 transition-colors p-1.5"><Trash2 className="w-4 h-4"/></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {filteredItems.length === 0 && <div className="text-center py-20 text-slate-400 font-bold">該当する情報がありません</div>}
                      </div>
                    )}

                    {viewMode === 'board' && (
                      <div className="flex h-full gap-5 overflow-x-auto pb-4">
                        {['todo', 'in-progress', 'done'].map(status => (
                          <div key={status} className="flex-1 min-w-[300px] flex flex-col bg-slate-200/50 rounded-2xl border border-slate-200 max-h-full shadow-inner">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between font-black text-slate-700 bg-slate-100/50 rounded-t-2xl">
                              {status === 'todo' ? '未着手' : status === 'in-progress' ? '進行中' : '完了'}
                              <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm border border-slate-200">{filteredItems.filter(i => i.status === status).length}</span>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                              {filteredItems.filter(i => i.status === status).map(item => (
                                <ItemCard key={item.id} item={item} currentUser={currentUser} onSelect={setSelectedItemId} onToggleBookmark={handleToggleBookmark} onDelete={confirmDeletePost} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {viewMode === 'manuals' && !hasKyomuFilter && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredItems.map(item => (
                          <ItemCard key={item.id} item={item} currentUser={currentUser} onSelect={setSelectedItemId} onToggleBookmark={handleToggleBookmark} onDelete={confirmDeletePost} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側：カレンダー */}
          <div className={`${isCalendarExpanded ? 'w-72' : 'w-10'} bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-full flex-shrink-0 transition-all duration-300 overflow-hidden relative`}>
            {isCalendarExpanded ? (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="font-black text-slate-800 ml-1">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><ChevronRight className="w-4 h-4"/></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={() => setIsCalendarExpanded(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="カレンダーを閉じる"><ChevronRightIcon className="w-4 h-4"/></button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                      <div key={d} className={`text-[10px] font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayObj, index) => {
                      if (!dayObj) return <div key={`empty-${index}`} className="h-8"></div>;
                      
                      const isSelected = dayObj.dateStr === selectedDate;
                      const isToday = dayObj.dateStr === new Date().toISOString().split('T')[0];
                      
                      const activeEvents = dayObj.events.filter(e => e.status !== 'done' && !e.readBy?.includes(currentUser.id));
                      const hasUrgent = activeEvents.some(e => e.type === 'urgent');
                      const hasTask = activeEvents.some(e => e.type === 'task' || e.type === 'info');

                      return (
                        <button 
                          key={dayObj.dateStr}
                          onClick={() => setSelectedDate(isSelected ? null : dayObj.dateStr)}
                          className={`h-8 rounded-lg flex items-center justify-center relative text-xs font-bold transition-all ${isSelected ? 'bg-slate-800 text-white shadow-md' : isToday ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                          {dayObj.day}
                          <div className="absolute bottom-1 flex gap-0.5">
                            {hasUrgent && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm"></span>}
                            {hasTask && !hasUrgent && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shadow-sm"></span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border-t border-slate-100 bg-slate-50/50 p-4 shadow-inner">
                  {selectedDate ? (
                    <div className="animate-in fade-in duration-200">
                      <div className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
                        <span>{new Date(selectedDate).toLocaleDateString('ja-JP', {month: 'short', day:'numeric'})} の締切情報</span>
                        <button onClick={() => setSelectedDate(null)} className="text-blue-500 hover:underline">解除</button>
                      </div>
                      <div className="space-y-3">
                        {selectedDateEvents.map(e => (
                          <div key={e.id} onClick={() => setSelectedItemId(e.id)} className={`cursor-pointer bg-white p-3 rounded-xl border text-xs shadow-sm flex flex-col gap-2 transition-all ${e.status === 'done' || e.readBy?.includes(currentUser.id) ? 'opacity-50 border-slate-200' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
                            <div className="flex items-start gap-2 font-bold text-slate-700 leading-tight">
                               {e.type === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                               {e.type === 'task' && <CheckSquare className="w-4 h-4 text-teal-500 flex-shrink-0" />}
                               {e.type === 'info' && <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                               <span className="line-clamp-2">{e.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-100 pt-1.5">
                              <span className="truncate max-w-[80px]">{e.branch}</span>
                              {e.assignee !== '-' && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">担当: {e.assignee}</span>}
                            </div>
                          </div>
                        ))}
                        {selectedDateEvents.length === 0 && (
                          <div className="text-xs text-slate-400 text-center py-6 font-bold">該当なし</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                      <CalendarIcon className="w-10 h-10 mb-3" />
                      <p className="text-[10px] font-bold text-center leading-relaxed">カレンダーの日付を押すと<br/>その日の締切情報が表示されます</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center py-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsCalendarExpanded(true)} title="カレンダーを展開する">
                <CalendarIcon className="w-5 h-5 text-slate-400 mb-6" />
                <div className="text-[11px] font-bold text-slate-500" style={{ writingMode: 'vertical-rl', letterSpacing: '0.2em' }}>カレンダーを開く</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ＝＝＝ 詳細・コメント モーダル ＝＝＝ */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm ${selectedItem.type==='urgent'?'bg-red-500': selectedItem.type==='task'?'bg-teal-500': selectedItem.type==='manual'?'bg-amber-500':'bg-blue-500'}`}>
                  {selectedItem.type === 'urgent' ? '緊急' : selectedItem.type === 'task' ? 'タスク' : selectedItem.type === 'manual' ? 'マニュアル' : '情報共有'}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {selectedItem.category}{selectedItem.subCategory ? ` > ${selectedItem.subCategory}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleBookmark(selectedItem.id)} className={`p-2 rounded-full transition-colors ${selectedItem.bookmarkedBy?.includes(currentUser.id) ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-200 text-slate-400'}`} title="お気に入り">
                  <Bookmark className={`w-5 h-5 ${selectedItem.bookmarkedBy?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => setSelectedItemId(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 leading-tight">{selectedItem.title}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400"/> 投稿: {selectedItem.author}</div>
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400"/> 対象: {selectedItem.branch}</div>
                {selectedItem.dueDate && <div className="flex items-center gap-1.5 text-red-600 font-bold"><CalendarIcon className="w-4 h-4"/> 締切: {selectedItem.dueDate}</div>}
                {selectedItem.assignee && selectedItem.assignee !== '-' && <div className="flex items-center gap-1.5 text-teal-700 font-bold"><CheckSquare className="w-4 h-4"/> 担当: {selectedItem.assignee}</div>}
              </div>

              {selectedItem.summary && <div className="prose prose-sm max-w-none mb-8 text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">{selectedItem.summary}</div>}

              {selectedItem.url && (
                <a href={selectedItem.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-colors mb-8 border border-blue-200 shadow-sm">
                  <ExternalLink className="w-5 h-5" /> 関連資料・ファイルを開く
                </a>
              )}

              <div className="flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-8 mb-10">
                <button onClick={() => handleToggleRead(selectedItem.id)} className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${selectedItem.readBy?.includes(currentUser.id) ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700 active:scale-95'}`}>
                  <CheckCircle2 className="w-5 h-5" /> {selectedItem.readBy?.includes(currentUser.id) ? '既読を取り消す' : '確認しました（既読にする）'}
                </button>
                {selectedItem.type === 'task' && (
                  <select 
                    value={selectedItem.status} onChange={(e) => handleStatusChange(selectedItem.id, e.target.value)}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold border border-slate-300 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white cursor-pointer"
                  >
                    <option value="todo">ステータス: 未着手</option>
                    <option value="in-progress">ステータス: 進行中</option>
                    <option value="done">ステータス: 完了済</option>
                  </select>
                )}
                <button onClick={() => handleToggleSnooze(selectedItem.id)} className={`px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${selectedItem.snoozedBy?.includes(currentUser.id) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 active:scale-95'}`} title="あとで対応する">
                  <Clock className="w-5 h-5" /> スヌーズ
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6"><MessageSquareText className="w-5 h-5 text-blue-600" /> コメント・やり取り</h3>
                <div className="space-y-5 mb-6">
                  {selectedItem.comments?.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-sm text-slate-600">{comment.author[0]}</div>
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-sm text-slate-700">{comment.author}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{comment.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedItem.comments || selectedItem.comments.length === 0) && <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">まだコメントはありません。</p>}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" placeholder="質問や報告をコメントする..." 
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                    value={newComment} onChange={e => setNewComment(e.target.value)} disabled={isSubmitting}
                  />
                  <button type="submit" disabled={!newComment.trim() || isSubmitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors shadow-sm w-14 flex items-center justify-center">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ 投稿作成モーダル ＝＝＝ */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-black text-lg text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> 情報・タスクの新規作成</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="bg-blue-50/50 p-5 border-b border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-1.5"><History className="w-4 h-4"/> テンプレートから作成</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => applyTemplate(t)} type="button" className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors">{t.name}</button>
                  ))}
                </div>
              </div>

              <form id="add-form" onSubmit={handleAddTask} className="p-6 space-y-8">
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
                  <label className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer px-4 py-2 rounded-lg transition-all ${newTask.type === 'task' ? 'bg-white shadow text-blue-700 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                    <input type="radio" name="type" value="task" checked={newTask.type === 'task'} onChange={() => setNewTask({...newTask, type: 'task', selectedTargets: [], category: settings.categories[0]?.name || "通常授業", subCategory: ""})} className="hidden" />
                    <CheckSquare className="w-4 h-4" /> タスク（担当割当）
                  </label>
                  <label className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer px-4 py-2 rounded-lg transition-all ${newTask.type === 'info' ? 'bg-white shadow text-blue-700 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                    <input type="radio" name="type" value="info" checked={newTask.type === 'info'} onChange={() => setNewTask({...newTask, type: 'info', assignee: "-", selectedTargets: [], category: settings.categories[0]?.name || "通常授業", subCategory: ""})} className="hidden" />
                    <Bell className="w-4 h-4" /> 情報共有
                  </label>
                  <label className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer px-4 py-2 rounded-lg transition-all ${newTask.type === 'manual' ? 'bg-white shadow text-amber-700 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
                    <input type="radio" name="type" value="manual" checked={newTask.type === 'manual'} onChange={() => setNewTask({...newTask, type: 'manual', assignee: "-", selectedTargets: [], category: settings.manualCategories[0], subCategory: ""})} className="hidden" />
                    <FileText className="w-4 h-4" /> マニュアル・資料
                  </label>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">タイトル <span className="text-red-500">*</span></label>
                    <input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder={newTask.type === 'manual' ? "例：中途採用 面接マニュアル" : "例：保護者会資料の印刷"} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">詳細内容（任意）</label>
                    <textarea rows="4" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors resize-none leading-relaxed" value={newTask.summary} onChange={e => setNewTask({...newTask, summary: e.target.value})} placeholder="連絡事項の詳細や指示を記入してください。" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">資料のURL（Googleスプレッドシート等）</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="url" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors" value={newTask.url} onChange={e => setNewTask({...newTask, url: e.target.value})} placeholder="https://" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-8"></div>

                {newTask.type === 'task' ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">振り分け（アサイン）の単位 <span className="text-red-500">*</span></label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                          <input type="radio" name="assignType" value="branch" className="w-4 h-4 accent-blue-600" checked={newTask.assignType === 'branch'} onChange={() => setNewTask({...newTask, assignType: 'branch', selectedTargets: []})} /> 教室ごとに振り分ける
                        </label>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                          <input type="radio" name="assignType" value="staff" className="w-4 h-4 accent-blue-600" checked={newTask.assignType === 'staff'} onChange={() => setNewTask({...newTask, assignType: 'staff', selectedTargets: []})} /> スタッフ個人ごとに振り分ける
                        </label>
                      </div>
                    </div>
                    {newTask.assignType === 'branch' ? (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-500 mb-2">対象エリア</label>
                          <select className="w-1/2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white shadow-sm" value={newTask.area} onChange={e => setNewTask({...newTask, area: e.target.value, selectedTargets: []})}>
                            {settings.orgData.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-700">タスクを発行する教室をチェック <span className="text-red-500">*</span></label>
                            <div className="flex gap-3">
                              <button type="button" onClick={() => selectAllTargets(settings.orgData.find(a => a.name === newTask.area)?.branches.map(b=>b.name) || [])} className="text-xs font-bold text-blue-600 hover:underline">すべて選択</button>
                              <button type="button" onClick={clearAllTargets} className="text-xs font-bold text-slate-500 hover:underline">クリア</button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200 rounded-xl min-h-[80px]">
                            {settings.orgData.find(a => a.name === newTask.area)?.branches.map(b => (
                              <label key={b.name} className={`flex items-center gap-2 text-sm border px-4 py-2 rounded-xl cursor-pointer transition-colors ${newTask.selectedTargets.includes(b.name) ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={newTask.selectedTargets.includes(b.name)} onChange={() => toggleTargetSelection(b.name)} /> {b.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">対象エリア</label>
                            <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white shadow-sm" value={newTask.area} onChange={e => { setNewTask({...newTask, area: e.target.value, branch: "全教室", selectedTargets: []}); }}>
                              {settings.orgData.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-500 mb-2">対象教室</label>
                            <select className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white shadow-sm" value={newTask.branch} onChange={e => setNewTask({...newTask, branch: e.target.value, selectedTargets: []})}>
                              <option value="全教室">全教室（エリア内全員）</option>
                              {settings.orgData.find(a => a.name === newTask.area)?.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-700">タスクを発行するスタッフをチェック <span className="text-red-500">*</span></label>
                            <div className="flex gap-3">
                              <button type="button" onClick={() => selectAllTargets(newTask.branch === '全教室' ? settings.orgData.find(a => a.name === newTask.area)?.branches.flatMap(b => b.staff) || [] : settings.orgData.find(a => a.name === newTask.area)?.branches.find(b => b.name === newTask.branch)?.staff || [])} className="text-xs font-bold text-blue-600 hover:underline">すべて選択</button>
                              <button type="button" onClick={clearAllTargets} className="text-xs font-bold text-slate-500 hover:underline">クリア</button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 p-4 bg-white border border-slate-200 rounded-xl min-h-[80px] max-h-64 overflow-y-auto">
                            {(newTask.branch === '全教室' ? settings.orgData.find(a => a.name === newTask.area)?.branches.flatMap(b => b.staff) || [] : settings.orgData.find(a => a.name === newTask.area)?.branches.find(b => b.name === newTask.branch)?.staff || []).map(s => (
                              <label key={s} className={`flex items-center gap-2 text-sm border px-4 py-2 rounded-xl cursor-pointer transition-colors ${newTask.selectedTargets.includes(s) ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                <input type="checkbox" className="accent-teal-600 w-4 h-4" checked={newTask.selectedTargets.includes(s)} onChange={() => toggleTargetSelection(s)} /> <span className="font-bold">{s}</span>
                                {newTask.branch === '全教室' && <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 ml-1">{settings.orgData.find(a => a.name === newTask.area)?.branches.find(b => b.staff.includes(s))?.name}</span>}
                              </label>
                            ))}
                            {((newTask.branch === '全教室' ? settings.orgData.find(a => a.name === newTask.area)?.branches.flatMap(b => b.staff) || [] : settings.orgData.find(a => a.name === newTask.area)?.branches.find(b => b.name === newTask.branch)?.staff || []).length === 0) && <span className="text-sm text-slate-400 p-4">該当するスタッフがいません</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">対象エリア</label>
                      <select className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white shadow-sm" value={newTask.area} onChange={e => setNewTask({...newTask, area: e.target.value, branch: e.target.value === '全エリア' ? '全教室' : ''})}>
                        <option value="全エリア">全エリア</option>
                        {settings.orgData.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">対象教室</label>
                      <select className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400" value={newTask.branch} onChange={e => setNewTask({...newTask, branch: e.target.value})} disabled={newTask.area === '全エリア'}>
                        <option value="全教室">全教室</option>
                        {newTask.area !== '全エリア' && settings.orgData.find(a => a.name === newTask.area)?.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">対象学年（任意・複数可）</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      {gradesList.map(g => (
                        <label key={g} className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${newTask.grades.includes(g) ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                          <input type="checkbox" className="hidden" checked={newTask.grades.includes(g)} onChange={() => { setNewTask(prev => ({ ...prev, grades: prev.grades.includes(g) ? prev.grades.filter(x => x !== g) : [...prev.grades, g] })) }} /> {g}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">対象コース（任意・複数可）</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      {settings.courses.map(c => (
                        <label key={c} className={`flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${newTask.courses.includes(c) ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                          <input type="checkbox" className="hidden" checked={newTask.courses.includes(c)} onChange={() => { setNewTask(prev => ({ ...prev, courses: prev.courses.includes(c) ? prev.courses.filter(x => x !== c) : [...prev.courses, c] })) }} /> {c}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">カテゴリー <span className="text-red-500">*</span></label>
                    <select required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white shadow-sm" value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value, subCategory: ""})}>
                      {newTask.type === 'manual' ? settings.manualCategories.map(c => <option key={c} value={c}>{c}</option>) : settings.categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  {newTask.type !== 'manual' && settings.categories.find(c => c.name === newTask.category)?.subcategories?.length > 0 ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">サブカテゴリー</label>
                      <select className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white shadow-sm" value={newTask.subCategory} onChange={e => setNewTask({...newTask, subCategory: e.target.value})}>
                        <option value="">設定しない（任意）</option>
                        {settings.categories.find(c => c.name === newTask.category).subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">期日・締切</label>
                      <input type="date" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white shadow-sm" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
              <button type="button" onClick={() => setIsTaskModalOpen(false)} disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">キャンセル</button>
              <button onClick={handleAddTask} disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 w-48 justify-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (newTask.type === 'task' ? `${Math.max(1, newTask.selectedTargets.length)}件一括発行` : '保存する')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ メンバー招待モーダル ＝＝＝ */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> 新しいメンバーを招待
              </h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名 <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  value={newUserName} onChange={e => setNewUserName(e.target.value)}
                  placeholder="例：山田 太郎"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">所属教室 <span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  value={newUserBranch} onChange={e => setNewUserBranch(e.target.value)}
                >
                  <option value="全教室">全教室（本部など）</option>
                  {settings.orgData.map(area => (
                    <optgroup key={area.name} label={area.name}>
                      {area.branches.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">役割・役職</label>
                <select 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                  value={newUserRole} onChange={e => setNewUserRole(e.target.value)}
                >
                  <option value="">設定しない（空欄）</option>
                  <option value="スタッフ">スタッフ</option>
                  <option value="教室長">教室長</option>
                  <option value="管理者">管理者</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} disabled={isSubmitting} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">キャンセル</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center w-32">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '招待する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ＝＝＝ パスワード変更モーダル ＝＝＝ */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 animate-in zoom-in duration-200">
            <h2 className="font-black text-xl text-slate-800 mb-6 flex items-center gap-2"><Lock className="w-6 h-6 text-blue-500" />パスワードの変更</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2">新しいパスワードを入力</label>
                <input 
                  type="text" required autoFocus
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg font-bold tracking-wider focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード"
                />
                <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1"><Info className="w-3 h-3 flex-shrink-0 mt-0.5"/>パスワードはシステム管理者のみ確認可能です。</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">キャンセル</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center w-32">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ＝＝＝ 各種設定モーダル ＝＝＝ */}
      {isOrgSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col h-[85vh] border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl flex-shrink-0">
              <h2 className="font-black text-lg text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-500" /> 各種データ設定</h2>
              <button onClick={() => setIsOrgSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 bg-slate-50 border-r border-slate-200 p-3 flex flex-col gap-1.5 flex-shrink-0 overflow-y-auto">
                <button onClick={() => setSettingsTab('org')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'org' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><MapPin className="w-4 h-4"/> 組織・スタッフ管理</button>
                <button onClick={() => setSettingsTab('members')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'members' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><User className="w-4 h-4"/> メンバー管理（PW確認）</button>
                <button onClick={() => setSettingsTab('grade')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'grade' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><GraduationCap className="w-4 h-4"/> 学年一覧管理</button>
                <button onClick={() => setSettingsTab('course')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'course' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><Users className="w-4 h-4"/> コース一覧管理</button>
                <button onClick={() => setSettingsTab('category')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'category' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><Tag className="w-4 h-4"/> 情報カテゴリー管理</button>
                <button onClick={() => setSettingsTab('manualCategory')} className={`px-4 py-3 rounded-xl text-sm font-bold text-left transition-all flex items-center gap-2.5 ${settingsTab === 'manualCategory' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}><FileText className="w-4 h-4"/> マニュアル分類管理</button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-white">
                {settingsTab === 'members' && (
                  <div className="space-y-6 animate-in fade-in">
                    <p className="text-sm font-bold text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      全メンバーのアカウント情報とパスワードの確認・編集・削除が行えます。
                    </p>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-4 whitespace-nowrap">名前</th>
                            <th className="px-5 py-4 whitespace-nowrap">所属教室</th>
                            <th className="px-5 py-4 whitespace-nowrap">役職</th>
                            <th className="px-5 py-4 whitespace-nowrap">パスワード</th>
                            <th className="px-5 py-4 text-center whitespace-nowrap w-[120px]">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.map(m => (
                            editingMemberId === m.id ? (
                              <tr key={m.id} className="bg-blue-50/30">
                                <td className="px-4 py-3">
                                  <input type="text" className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-200" value={editMemberForm.name} onChange={e => setEditMemberForm({...editMemberForm, name: e.target.value})} placeholder="氏名" disabled={isSubmitting} />
                                </td>
                                <td className="px-4 py-3">
                                  <select className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" value={editMemberForm.branch} onChange={e => setEditMemberForm({...editMemberForm, branch: e.target.value})} disabled={isSubmitting}>
                                    <option value="全教室">全教室</option>
                                    {settings.orgData.map(area => (
                                      <optgroup key={area.name} label={area.name}>
                                        {area.branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                      </optgroup>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <select className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white" value={editMemberForm.role} onChange={e => setEditMemberForm({...editMemberForm, role: e.target.value})} disabled={isSubmitting}>
                                    <option value="">設定しない（空欄）</option>
                                    <option value="スタッフ">スタッフ</option>
                                    <option value="教室長">教室長</option>
                                    <option value="管理者">管理者</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <input type="text" className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-200" value={editMemberForm.password} onChange={e => setEditMemberForm({...editMemberForm, password: e.target.value})} placeholder="パスワード" disabled={isSubmitting} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button onClick={() => handleUpdateMember(m.id, m, editMemberForm)} disabled={isSubmitting} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400" title="保存">
                                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                    </button>
                                    <button onClick={() => setEditingMemberId(null)} disabled={isSubmitting} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50" title="キャンセル"><X className="w-4 h-4"/></button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-5 py-4 font-bold text-slate-800">{m.name}</td>
                                <td className="px-5 py-4 text-slate-600">{m.branch}</td>
                                <td className="px-5 py-4 text-slate-600">
                                  {m.role ? <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">{m.role}</span> : <span className="text-slate-400 italic text-xs">未設定</span>}
                                </td>
                                <td className="px-5 py-4 font-mono font-bold text-blue-600">{m.password}</td>
                                <td className="px-5 py-4 text-center">
                                   <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => { setEditingMemberId(m.id); setEditMemberForm({ name: m.name, branch: m.branch, role: m.role || '', password: m.password }); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="編集"><Pencil className="w-4 h-4"/></button>
                                     <button onClick={() => handleDeleteMember(m.id, m.name, m.branch)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="削除"><Trash2 className="w-4 h-4"/></button>
                                   </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {settingsTab === 'org' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-blue-800 mb-3">新しいエリアの追加</h3>
                      <div className="flex gap-3">
                        <input type="text" placeholder="例：第２エリア" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white shadow-sm" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} />
                        <button onClick={handleAddArea} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-blue-700 shadow-sm active:scale-95 transition-all">エリアを追加</button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {settings.orgData.map(area => (
                        <div key={area.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-slate-400" /> {area.name}</h3>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setAddingBranchTo(addingBranchTo === area.name ? null : area.name)} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-4 h-4"/> 教室を追加</button>
                              <button onClick={() => handleDeleteArea(area.name)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          
                          {addingBranchTo === area.name && (
                            <div className="p-4 bg-blue-50/50 border-b border-slate-100 flex gap-3 animate-in slide-in-from-top-2">
                              <input type="text" placeholder="教室名" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} />
                              <button onClick={() => handleAddBranch(area.name)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">追加</button>
                            </div>
                          )}

                          <div className="p-4 space-y-4 bg-slate-50/30">
                            {area.branches.map(branch => (
                              <div key={branch.name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
                                  <h4 className="text-base font-bold text-slate-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-400"/>{branch.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setAddingStaffTo(addingStaffTo === branch.name ? null : branch.name)} className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md hover:bg-teal-100 flex items-center gap-1 transition-colors"><Plus className="w-3 h-3"/> スタッフ追加</button>
                                    <button onClick={() => handleDeleteBranch(area.name, branch.name)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                                </div>

                                {addingStaffTo === branch.name && (
                                  <div className="flex gap-2 mb-4 animate-in slide-in-from-top-1">
                                    <input type="text" placeholder="スタッフ名" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 outline-none" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
                                    <button onClick={() => handleAddStaff(area.name, branch.name)} className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">追加</button>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  {branch.staff.map(staff => (
                                    <span key={staff} className="bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 group hover:border-slate-300 transition-colors">
                                      <User className="w-3.5 h-3.5 text-slate-400" /> {staff}
                                      <button onClick={() => handleDeleteStaff(area.name, branch.name, staff)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100"><X className="w-3 h-3"/></button>
                                    </span>
                                  ))}
                                  {branch.staff.length === 0 && <span className="text-sm text-slate-400 italic py-1 border border-dashed border-slate-200 px-4 rounded-lg">スタッフがいません</span>}
                                </div>
                              </div>
                            ))}
                            {area.branches.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-white">教室が登録されていません</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'grade' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                      <div className="flex gap-3">
                        <input type="text" placeholder="新しい学年（例：高1）" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-white shadow-sm" value={newGradeName} onChange={e => setNewGradeName(e.target.value)} />
                        <button onClick={handleAddGrade} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-blue-700 shadow-sm active:scale-95 transition-all">学年を追加</button>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap gap-3 shadow-sm">
                      {gradesList.map(grade => (
                        <div key={grade} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 group hover:border-slate-300 hover:shadow-sm transition-all">
                          <span className="text-sm font-bold text-slate-700">{grade}</span>
                          <button onClick={() => handleDeleteGrade(grade)} className="text-slate-300 hover:text-red-500 bg-white rounded-full p-1 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'course' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                      <div className="flex gap-3">
                        <input type="text" placeholder="新しいコース名" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-white shadow-sm" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
                        <button onClick={handleAddCourse} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-blue-700 shadow-sm active:scale-95 transition-all">コースを追加</button>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap gap-3 shadow-sm">
                      {settings.courses.map(course => (
                        <div key={course} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 group hover:border-slate-300 hover:shadow-sm transition-all">
                          <span className="text-sm font-bold text-slate-700">{course}</span>
                          <button onClick={() => handleDeleteCourse(course)} className="text-slate-300 hover:text-red-500 bg-white rounded-full p-1 shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'category' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                      <div className="flex gap-3">
                        <input type="text" placeholder="新しい親カテゴリー名" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none bg-white shadow-sm" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                        <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-indigo-700 shadow-sm active:scale-95 transition-all">カテゴリーを追加</button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {settings.categories.map(cat => (
                        <div key={cat.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-400"/> {cat.name}</h3>
                            <div className="flex items-center gap-3">
                              <button onClick={() => setAddingSubCategoryTo(addingSubCategoryTo === cat.name ? null : cat.name)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> サブカテゴリ追加</button>
                              <button onClick={() => handleDeleteCategory(cat.name)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>

                          {addingSubCategoryTo === cat.name && (
                            <div className="p-4 bg-indigo-50/30 border-b border-slate-100 flex gap-3 animate-in slide-in-from-top-2">
                              <input type="text" placeholder="サブカテゴリ名" className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} />
                              <button onClick={() => handleAddSubCategory(cat.name)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">追加</button>
                            </div>
                          )}

                          <div className="p-5 bg-white">
                            <div className="flex flex-wrap gap-2">
                              {cat.subcategories?.map(sub => (
                                <span key={sub} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 group hover:border-slate-300 transition-all shadow-sm">
                                  {sub}
                                  <button onClick={() => handleDeleteSubCategory(cat.name, sub)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-white rounded-full p-0.5 border border-slate-100 shadow-sm"><X className="w-3 h-3"/></button>
                                </span>
                              ))}
                              {(!cat.subcategories || cat.subcategories.length === 0) && <span className="text-sm text-slate-400 italic px-4 py-2 border border-dashed border-slate-200 rounded-xl">サブカテゴリはありません</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'manualCategory' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 shadow-sm">
                      <div className="flex gap-3">
                        <input type="text" placeholder="新しいマニュアル分類名" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 outline-none bg-white shadow-sm" value={newManualCategoryName} onChange={e => setNewManualCategoryName(e.target.value)} />
                        <button onClick={handleAddManualCategory} className="bg-amber-600 text-white px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-amber-700 shadow-sm active:scale-95 transition-all">分類を追加</button>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap gap-3 shadow-sm">
                      {settings.manualCategories.map(cat => (
                        <div key={cat} className="bg-orange-50 border border-orange-100 px-4 py-2 rounded-xl flex items-center gap-3 group hover:border-orange-200 hover:shadow-sm transition-all">
                          <FileText className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-bold text-orange-800">{cat}</span>
                          <button onClick={() => handleDeleteManualCategory(cat)} className="text-orange-300 hover:text-red-500 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 mb-4"><AlertTriangle className="w-6 h-6" /><h3 className="font-black text-xl">確認</h3></div>
            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-8 leading-relaxed font-medium">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelConfirm} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">キャンセル</button>
              <button onClick={executeConfirm} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 justify-center min-w-[100px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : '実行する'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

