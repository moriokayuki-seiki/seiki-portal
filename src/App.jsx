import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, CheckCircle2, AlertTriangle, User, Users, Clock, 
  Settings, LogOut, Plus, ChevronLeft, ChevronRight, X, Search, 
  FileText, ArrowUp, ArrowDown, Bell, BookOpen, Package, 
  Calendar as CalendarIcon, Save, Edit3, Trash2, ShieldCheck, Info,
  Copy, UploadCloud, File, Folder, ExternalLink, MailWarning
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

// ==========================================
// 1. Firebase 初期化設定
// ==========================================
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
   return { apiKey: "AIzaSyAMxTDK4w4Ys9Dji-mxkl9Wi9tpjKPm6ho", authDomain: "seiki-portal.firebaseapp.com", projectId: "seiki-portal", storageBucket: "seiki-portal.firebasestorage.app", messagingSenderId: "806874141485", appId: "1:806874141485:web:76f51d0dd67664542079a4" };
};


const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'chikyukan-task-system';

// ==========================================
// 2. 定数・初期データ
// ==========================================
const DEFAULT_GRADES = ["小1", "小2", "小3", "小4", "小5", "小6", "中1", "中2", "中3", "高1", "高2", "高3"];
const DEFAULT_COURSES = ["SSJ", "中学受験コース", "高校受験コース", "洛北西京コース", "SCHOP", "速読"]; 

const INITIAL_MEMBERS = [
  { name: '本部', branch: '全教室', role: '管理者', password: 'Seiki1962' },
  { name: '稲永昌大', branch: '知求館（北大路）', role: '教室長', password: 'seiki' },
  { name: '馬谷伸一', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '合路郁子', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '亀井淳史', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '杉村茉衣', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '森岡優希', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: '小髙', branch: '知求館（北大路）', role: 'スタッフ', password: 'seiki' },
  { name: 'アルバイト（共通）', branch: '知求館（北大路）', role: 'アルバイト', password: 'seiki' }
];

const INITIAL_ROUTINES = [
  { id: 'r1', name: '授業で使用する印刷物の印刷', formType: 'none', description: '', attachmentLinks: [] },
  { id: 'r2', name: '古紙の回収', formType: 'none', description: '', attachmentLinks: [] },
  { id: 'r3', name: '季節の掲示物の作成・掲示', formType: 'none', description: '', attachmentLinks: [] },
  { id: 'r4', name: 'ごみの回収', formType: 'none', description: '', attachmentLinks: [] },
  { id: 'r5', name: 'マーカーのインクの補充', formType: 'none', description: '', attachmentLinks: [] },
  { id: 'r6', name: '紙の在庫確認', formType: 'inventory', description: '', attachmentLinks: [] },
  { id: 'r7', name: 'パンフレット類の補充', formType: 'none', description: '', attachmentLinks: [] }
];

const RULES_TEXT = [
  "① 園生保護者に関わらず、教室に誰かが入って来られたら相手の顔を見て、明るく元気に「こんにちは」と挨拶をする。",
  "② 受付に要件を言ってこられる方もおられるが、そうでない方もいらっしゃるので、「お伺いしましょうか。」と取り次ぐ。",
  "③ 次に用件を聞き、わからなければ、社員に聞くこと。",
  "④ 最後、帰られる時に「ありがとうございました」と元気に挨拶と一礼をすること。"
];

// ==========================================
// 3. UIコンポーネント群・補助関数
// ==========================================

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto
        ${t.type === 'success' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 
          t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-slate-800 text-white'}`}
      >
        {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-teal-500" />}
        {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
        {t.type === 'info' && <Info className="w-5 h-5 text-slate-400" />}
        <span className="text-sm font-bold">{t.message}</span>
      </div>
    ))}
  </div>
);

const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayOfWeek = (dateStr) => {
  if (!dateStr) return '';
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = new Date(dateStr);
  return days[d.getDay()];
};

const formatDateWithDay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${m}月${d}日 (${getDayOfWeek(dateStr)})`;
};

const formatDateTimeWithDay = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const day = days[date.getDay()];
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}年${m}月${d}日 (${day}) ${h}:${min}`;
};

// カスタムカレンダーポップアップ
const DatePickerPopup = ({ currentDateStr, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDateStr || new Date()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[200] w-72">
      <div className="flex justify-between items-center mb-4">
        <button onClick={(e) => { e.preventDefault(); setViewDate(new Date(year, month - 1, 1)); }} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5"/></button>
        <span className="font-bold text-slate-800">{year}年 {month + 1}月</span>
        <button onClick={(e) => { e.preventDefault(); setViewDate(new Date(year, month + 1, 1)); }} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => <div key={d} className={`text-xs font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-slate-400'}`}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="h-8"></div>;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isSelected = dateStr === currentDateStr;
          const isToday = dateStr === formatYMD(new Date());
          return (
            <button 
              key={i} 
              onClick={(e) => { e.preventDefault(); onSelect(dateStr); onClose(); }}
              className={`h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
         <button onClick={(e) => { e.preventDefault(); onSelect(formatYMD(new Date())); onClose(); }} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">今日</button>
         <button onClick={(e) => { e.preventDefault(); onClose(); }} className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">閉じる</button>
      </div>
    </div>
  );
};

// ==========================================
// 4. メインアプリケーション
// ==========================================
export default function ChikyukanTaskSystem() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [members, setMembers] = useState([]);      
  const [currentUser, setCurrentUser] = useState(null); 
  const [tasks, setTasks] = useState([]);         
  const [settings, setSettings] = useState({ 
    grades: DEFAULT_GRADES, 
    courses: DEFAULT_COURSES, 
    routines: INITIAL_ROUTINES,
    alertSettings: { email: '', inventoryThreshold: 10 }
  });

  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, routine, special, history, settings
  const [toasts, setToasts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

  const [routineDate, setRoutineDate] = useState(formatYMD(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedNewRoutine, setSelectedNewRoutine] = useState(null);
  const [routineForm, setRoutineForm] = useState({
    action: 'request',
    description: '', reportMemo: '', actualAssignee: '',
    inventoryDetails: { a3: '', a4: '', b4: '', b5: '' },
    attachmentLinks: [], attachedFiles: [], reportFiles: []
  });

  const [selectedLoginUser, setSelectedLoginUser] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [taskForm, setTaskForm] = useState({
    title: '', type: 'special', dueDate: '',
    targetGrades: [], targetCourses: [], description: '', attachmentLinks: [], attachedFiles: []
  });
  
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [reportMemo, setReportMemo] = useState('');
  const [actualAssignee, setActualAssignee] = useState('');
  const [inventoryDetails, setInventoryDetails] = useState({ a3: '', a4: '', b4: '', b5: '' });
  const [commentText, setCommentText] = useState('');
  const [reportFiles, setReportFiles] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [settingsTab, setSettingsTab] = useState('members');
  const [editMemberForm, setEditMemberForm] = useState({ name: '', role: 'スタッフ', password: 'seiki' });
  const [newGrade, setNewGrade] = useState('');
  const [newCourse, setNewCourse] = useState('');
  
  // ルーティン設定用
  const [newRoutine, setNewRoutine] = useState({ name: '', formType: 'none', description: '', attachmentLinks: [], attachedFiles: [] });
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editRoutineForm, setEditRoutineForm] = useState({ name: '', formType: 'none', description: '', attachmentLinks: [], attachedFiles: [] });
  
  // アラート設定用
  const [alertSettingsForm, setAlertSettingsForm] = useState({ email: '', inventoryThreshold: 10 });

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const copyDriveUrl = () => {
    const url = "https://drive.google.com/drive/folders/1wKyynLD_2w9q1GsIWS3YArm6U4n6EERP?usp=drive_link";
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('ドライブのURLをコピーしました');
    } catch (err) {
      showToast('コピーに失敗しました', 'error');
    }
    document.body.removeChild(textArea);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setAuthUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          grades: data.grades || DEFAULT_GRADES, 
          courses: data.courses || DEFAULT_COURSES, 
          routines: data.routines || INITIAL_ROUTINES,
          alertSettings: data.alertSettings || { email: '', inventoryThreshold: 10 }
        });
        setAlertSettingsForm(data.alertSettings || { email: '', inventoryThreshold: 10 });
      } else {
        const initialData = { grades: DEFAULT_GRADES, courses: DEFAULT_COURSES, routines: INITIAL_ROUTINES, alertSettings: { email: '', inventoryThreshold: 10 } };
        setDoc(settingsRef, initialData);
        setSettings(initialData);
        setAlertSettingsForm(initialData.alertSettings);
      }
    });

    const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      if (snap.empty) {
        const batch = writeBatch(db);
        INITIAL_MEMBERS.forEach(m => { const docRef = doc(membersRef); batch.set(docRef, m); });
        batch.commit();
      } else {
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setIsInitializing(false);
    });
    return () => { unsubSettings(); unsubMembers(); };
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !currentUser) return;
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(fetchedTasks);
    }, (err) => console.error(err));
    return () => unsubTasks();
  }, [authUser, currentUser]);

  const isEmployee = currentUser?.role !== 'アルバイト';
  const isAdmin = currentUser?.role === '管理者';

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0)), [tasks]);
  
  const specialTasks = useMemo(() => sortedTasks.filter(t => t.type === 'special'), [sortedTasks]);
  const kanbanTasks = useMemo(() => ({
    'todo': specialTasks.filter(t => t.status === 'todo'),
    'in-progress': specialTasks.filter(t => t.status === 'in-progress'),
    'pending': specialTasks.filter(t => t.status === 'pending'),
    'done': specialTasks.filter(t => t.status === 'done' && !t.archived)
  }), [specialTasks]);

  const dayRoutineTasks = useMemo(() => {
    return tasks.filter(t => t.type === 'routine' && t.targetDate === routineDate);
  }, [tasks, routineDate]);

  const historyTasks = useMemo(() => {
    return sortedTasks.filter(t => {
      const matchSearch = t.title.includes(searchQuery) || t.description?.includes(searchQuery) || t.author.includes(searchQuery) || t.assignee?.includes(searchQuery);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [sortedTasks, searchQuery, statusFilter]);

  const pendingConfirmationTasks = useMemo(() => tasks.filter(t => t.status === 'done' && !t.archived && !t.lowInventoryAlert), [tasks]);
  const alertTasks = useMemo(() => tasks.filter(t => t.lowInventoryAlert && !t.archived), [tasks]);

  const executeConfirm = async () => {
    if (confirmDialog.onConfirm) {
      setIsSubmitting(true);
      try { await confirmDialog.onConfirm(); } catch (e) { showToast('処理に失敗しました', 'error'); } finally { setIsSubmitting(false); }
    }
    setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === selectedLoginUser.password) {
      setCurrentUser(selectedLoginUser);
      setLoginPassword(''); setLoginError('');
      
      if (selectedLoginUser.password === 'seiki' && selectedLoginUser.role !== 'アルバイト') {
        setForcePasswordChange(true);
      } else {
        showToast('ログインしました');
      }
      setSelectedLoginUser(null);
    } else { setLoginError('パスワードが間違っています。'); }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword === 'seiki') return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', currentUser.id), { password: newPassword });
      setCurrentUser(prev => ({ ...prev, password: newPassword }));
      setForcePasswordChange(false);
      setNewPassword('');
      showToast('パスワードを変更し、ログインしました');
    } catch(err) {
      showToast('パスワードの変更に失敗しました', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ファイルアップロードの汎用ハンドラ（複数対応・750KB制限）
  const handleMultipleFilesUpload = (e, setter, key = null) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    let hasError = false;
    const validFiles = [];

    files.forEach(file => {
      if (file.size > 750 * 1024) { 
        hasError = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasError) {
      showToast('750KBを超えるファイルは除外されました', 'error');
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (key) {
          setter(prev => ({ ...prev, [key]: [...(prev[key] || []), { name: file.name, data: event.target.result }] }));
        } else {
          setter(prev => [...(prev || []), { name: file.name, data: event.target.result }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = ''; // 連続アップロード可能にするためリセット
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setReportMemo('');
    setActualAssignee('');
    setInventoryDetails({ a3: '', a4: '', b4: '', b5: '' });
    setReportFiles([]);
    setCommentText('');
  };

  const openTaskModal = () => {
    setIsEditingTask(false);
    setEditingTaskId(null);
    setTaskForm({ title: '', type: 'special', dueDate: '', targetGrades: [], targetCourses: [], description: '', attachmentLinks: [], attachedFiles: [] });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setIsEditingTask(true);
    setEditingTaskId(task.id);
    
    const linksToEdit = task.attachmentLinks?.length > 0 ? task.attachmentLinks : (task.attachmentUrl ? [{ name: '手順書・マニュアル', url: task.attachmentUrl }] : []);
    
    setTaskForm({
      title: task.title, type: task.type, dueDate: task.dueDate || '',
      targetGrades: task.targetGrades || [], targetCourses: task.targetCourses || [],
      description: task.description || '', 
      attachmentLinks: linksToEdit, 
      attachedFiles: task.attachedFiles || (task.attachedFile ? [task.attachedFile] : [])
    });
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleCopyTask = (taskToCopy = selectedTask) => {
    if(!taskToCopy) return;
    
    const linksToCopy = taskToCopy.attachmentLinks?.length > 0 ? taskToCopy.attachmentLinks : (taskToCopy.attachmentUrl ? [{ name: '手順書・マニュアル', url: taskToCopy.attachmentUrl }] : []);
    
    setTaskForm({
      title: taskToCopy.title + ' (コピー)',
      type: 'special', 
      dueDate: '',
      targetGrades: taskToCopy.targetGrades || [],
      targetCourses: taskToCopy.targetCourses || [],
      description: taskToCopy.description || '',
      attachmentLinks: linksToCopy,
      attachedFiles: taskToCopy.attachedFiles || (taskToCopy.attachedFile ? [taskToCopy.attachedFile] : [])
    });
    setSelectedTask(null);
    setViewMode('special');
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 空のリンクを取り除く
    const filteredLinks = (taskForm.attachmentLinks || []).filter(link => link.url.trim() !== '');

    try {
      if (isEditingTask && editingTaskId) {
        const updates = {
          title: taskForm.title, dueDate: taskForm.dueDate, targetGrades: taskForm.targetGrades, targetCourses: taskForm.targetCourses,
          description: taskForm.description, attachmentLinks: filteredLinks, attachedFiles: taskForm.attachedFiles || []
        };
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTaskId), updates);
        showToast('特別タスクを更新しました');
      } else {
        const maxOrder = tasks.filter(t => t.status === 'todo').reduce((max, t) => Math.max(max, t.order || 0), 0);
        const newTask = {
          title: taskForm.title, type: 'special', author: currentUser.name, createdAt: serverTimestamp(),
          dueDate: taskForm.dueDate, targetGrades: taskForm.targetGrades, targetCourses: taskForm.targetCourses,
          description: taskForm.description, attachmentLinks: filteredLinks, attachedFiles: taskForm.attachedFiles || [],
          status: 'todo', order: maxOrder + 1, assignee: null, reportMemo: '', comments: [], archived: false,
          inventoryDetails: null, reportFiles: [], lowInventoryAlert: false
        };
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), newTask);
        showToast('特別タスクを発行しました');
        if (viewMode !== 'special') setViewMode('special');
      }
      setIsTaskModalOpen(false);
    } catch (e) { showToast('タスクの保存に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const checkLowInventory = (inventoryData) => {
    if (!inventoryData) return { isLow: false, message: '' };
    const threshold = Number(settings.alertSettings?.inventoryThreshold) || 10;
    const lowItems = [];
    ['a3', 'a4', 'b4', 'b5'].forEach(size => {
      const val = parseInt(inventoryData[size], 10);
      if (!isNaN(val) && val <= threshold) {
        lowItems.push(size.toUpperCase());
      }
    });
    if (lowItems.length > 0) {
      return { isLow: true, message: `【在庫不足】${lowItems.join(', ')} が ${threshold}部 以下です。至急補充・発注が必要です。` };
    }
    return { isLow: false, message: '' };
  };

  const openNewRoutineModal = (routine) => {
    setSelectedNewRoutine(routine);
    
    const masterLinks = routine.attachmentLinks?.length > 0 ? routine.attachmentLinks : (routine.manualUrl ? [{ name: 'マニュアル', url: routine.manualUrl }] : []);
    
    setRoutineForm({
      action: isEmployee ? 'request' : 'done', description: '', reportMemo: '', actualAssignee: '',
      inventoryDetails: { a3: '', a4: '', b4: '', b5: '' },
      attachmentLinks: masterLinks, attachedFiles: [], reportFiles: []
    });
  };

  const handleCreateRoutineTask = async (e) => {
    e.preventDefault();
    const isDone = routineForm.action === 'done';
    
    if (isDone && !isEmployee && !routineForm.actualAssignee.trim()) {
      showToast('実施した人の名前を入力してください', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const assigneeName = isDone ? (!isEmployee ? routineForm.actualAssignee.trim() : currentUser.name) : null;
      
      // 指示ファイルは個別の添付を優先し、なければマスタのものを使用する
      const finalAttachedFiles = routineForm.attachedFiles?.length > 0 ? routineForm.attachedFiles : (selectedNewRoutine.attachedFiles || []);
      
      // リンクも同様に処理
      const filteredRoutineLinks = (routineForm.attachmentLinks || []).filter(link => link.url.trim() !== '');
      const masterLinks = selectedNewRoutine.attachmentLinks?.length > 0 ? selectedNewRoutine.attachmentLinks : (selectedNewRoutine.manualUrl ? [{ name: 'マニュアル', url: selectedNewRoutine.manualUrl }] : []);
      const finalAttachmentLinks = filteredRoutineLinks.length > 0 ? filteredRoutineLinks : masterLinks;
      
      let lowInventoryAlert = false;
      let alertMessage = '';
      if (isDone && selectedNewRoutine.formType === 'inventory') {
        const check = checkLowInventory(routineForm.inventoryDetails);
        lowInventoryAlert = check.isLow;
        alertMessage = check.message;
      }

      const newTask = {
        title: selectedNewRoutine.name, type: 'routine', routineId: selectedNewRoutine.id, formType: selectedNewRoutine.formType,
        author: currentUser.name, createdAt: serverTimestamp(), targetDate: routineDate,
        description: routineForm.description, attachmentLinks: finalAttachmentLinks,
        attachedFiles: finalAttachedFiles, masterDescription: selectedNewRoutine.description || '', // マスターの説明文を保持
        status: isDone ? 'done' : 'todo', order: 0, assignee: assigneeName,
        reportMemo: isDone ? routineForm.reportMemo : '', 
        reportFiles: isDone ? routineForm.reportFiles : [],
        comments: [], archived: false,
        inventoryDetails: isDone && selectedNewRoutine.formType === 'inventory' ? routineForm.inventoryDetails : null,
        lowInventoryAlert, alertMessage
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), newTask);
      setSelectedNewRoutine(null);
      
      if (lowInventoryAlert && settings.alertSettings?.email) {
        showToast(`${settings.alertSettings.email} 宛に在庫アラートを送信しました`, 'error');
      } else {
        showToast(isDone ? 'ルーティンの完了報告をしました' : 'ルーティン作業を依頼しました');
      }
    } catch(err) { showToast('処理に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleCompleteTask = async () => {
    if (!isEmployee && !actualAssignee.trim()) {
      showToast('実施した人の名前を入力してください', 'error');
      return;
    }
    const assigneeName = !isEmployee ? actualAssignee.trim() : currentUser.name;
    
    let lowInventoryAlert = false;
    let alertMessage = '';
    if (selectedTask.formType === 'inventory') {
      const check = checkLowInventory(inventoryDetails);
      lowInventoryAlert = check.isLow;
      alertMessage = check.message;
    }

    handleUpdateTaskStatus(selectedTask.id, 'done', { 
      reportMemo, 
      inventoryDetails: selectedTask.formType === 'inventory' ? inventoryDetails : null,
      assignee: assigneeName,
      reportFiles: reportFiles,
      lowInventoryAlert,
      alertMessage
    });
    
    if (lowInventoryAlert && settings.alertSettings?.email) {
      setTimeout(() => showToast(`${settings.alertSettings.email} 宛に在庫不足アラートを送信しました`, 'error'), 500);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus, additionalData = {}) => {
    setIsSubmitting(true);
    try {
      const updates = { status: newStatus, ...additionalData };
      if (newStatus === 'in-progress' && !additionalData.assignee) updates.assignee = currentUser.name;
      // 進行中や未着手に戻る場合はアラートフラグを消す
      if (newStatus !== 'done') {
        updates.lowInventoryAlert = false;
        updates.alertMessage = '';
      }
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), updates);
      setSelectedTask(null);
      showToast('ステータスを更新しました');
    } catch (e) { showToast('更新に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    setIsSubmitting(true);
    try {
      const newComment = { id: Date.now().toString(), author: currentUser.name, text: commentText.trim(), createdAt: new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', selectedTask.id), { comments: [...(selectedTask.comments || []), newComment] });
      setSelectedTask(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setCommentText('');
    } catch (e) { showToast('コメントの送信に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleMoveOrder = async (task, direction) => {
    const todoTasks = kanbanTasks['todo'];
    const currentIndex = todoTasks.findIndex(t => t.id === task.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= todoTasks.length) return;
    const targetTask = todoTasks[targetIndex];
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { order: targetTask.order || targetIndex });
      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', targetTask.id), { order: task.order || currentIndex });
      await batch.commit();
    } catch (e) { showToast('並び替えに失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleArchiveTask = async (taskId) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { archived: true }); showToast('タスクを確認済みにしました'); } catch (e) { showToast('エラーが発生しました', 'error'); }
  };

  const handleDeleteTask = (taskId) => {
    setConfirmDialog({ isOpen: true, message: 'このタスクを削除しますか？\n元に戻すことはできません。', onConfirm: async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId)); setSelectedTask(null); showToast('タスクを削除しました'); } });
  };

  // --- 管理者用設定ハンドラ ---
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!editMemberForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'members'), { name: editMemberForm.name.trim(), role: editMemberForm.role, password: editMemberForm.password });
      setEditMemberForm({ name: '', role: 'スタッフ', password: 'seiki' }); showToast('メンバーを追加しました');
    } catch(e) { showToast('追加に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDeleteMember = (memberId) => {
    setConfirmDialog({ isOpen: true, message: 'このアカウントを削除しますか？', onConfirm: async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberId)); showToast('アカウントを削除しました'); } });
  };

  const handleUpdateSettings = async (field, value) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { [field]: value }); showToast('設定を更新しました'); } catch(e) { showToast('更新に失敗しました', 'error'); }
  };

  const handleUpdateAlertSettings = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { alertSettings: alertSettingsForm });
      showToast('アラート設定を更新しました');
    } catch(e) { showToast('更新に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleAddRoutine = async () => {
    if (!newRoutine.name.trim()) return;
    setIsSubmitting(true);
    try {
      const filteredLinks = (newRoutine.attachmentLinks || []).filter(link => link.url.trim() !== '');
      const newRoutines = [...settings.routines, { id: 'r' + Date.now(), name: newRoutine.name.trim(), formType: newRoutine.formType, description: newRoutine.description.trim(), attachmentLinks: filteredLinks, attachedFiles: newRoutine.attachedFiles || [] }];
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { routines: newRoutines });
      setNewRoutine({ name: '', formType: 'none', description: '', attachmentLinks: [], attachedFiles: [] });
      showToast('ルーティンを追加しました');
    } catch(e) { showToast('追加に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleUpdateRoutine = async (id) => {
    if (!editRoutineForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const filteredLinks = (editRoutineForm.attachmentLinks || []).filter(link => link.url.trim() !== '');
      const updatedRoutines = settings.routines.map(r => 
        r.id === id ? { ...r, name: editRoutineForm.name.trim(), formType: editRoutineForm.formType, description: editRoutineForm.description.trim(), attachmentLinks: filteredLinks, attachedFiles: editRoutineForm.attachedFiles || [] } : r
      );
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { routines: updatedRoutines });
      setEditingRoutineId(null);
      showToast('ルーティンを更新しました');
    } catch(e) { showToast('更新に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDeleteRoutine = (id) => {
    setConfirmDialog({ isOpen: true, message: 'このルーティンを削除しますか？', onConfirm: async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { routines: settings.routines.filter(r => r.id !== id) }); showToast('ルーティンを削除しました'); } });
  };
  
  const handleMoveRoutineOrder = async (index, direction) => {
    const newRoutines = [...settings.routines];
    if (direction === 'up' && index > 0) {
      [newRoutines[index - 1], newRoutines[index]] = [newRoutines[index], newRoutines[index - 1]];
    } else if (direction === 'down' && index < newRoutines.length - 1) {
      [newRoutines[index + 1], newRoutines[index]] = [newRoutines[index], newRoutines[index + 1]];
    } else {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { routines: newRoutines });
    } catch(e) { showToast('順序の変更に失敗しました', 'error'); } finally { setIsSubmitting(false); }
  };

  const changeDate = (days) => {
    const d = new Date(routineDate);
    d.setDate(d.getDate() + days);
    setRoutineDate(formatYMD(d));
  };

  const handleDragStart = (e, taskId) => { e.dataTransfer.setData('taskId', taskId); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) handleUpdateTaskStatus(taskId, targetStatus);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'done': return 'bg-teal-100 text-teal-700 border-teal-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };
  const getStatusLabel = (status) => {
    switch(status) {
      case 'todo': return '未着手'; case 'in-progress': return '進行中'; case 'pending': return '確認待ち/保留'; case 'done': return '完了'; default: return '不明';
    }
  };

  // --- ログイン画面 ---
  if (isInitializing) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading...</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <ToastContainer toasts={toasts} />
        <div className="absolute top-0 w-full h-1/2 bg-blue-900 z-0"></div>
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10 border border-slate-200">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><CheckSquare className="text-white w-8 h-8" /></div>
          <h1 className="text-2xl font-black text-center mb-2 text-slate-800">タスク依頼システム</h1>
          <p className="text-center text-slate-500 text-sm mb-8 font-medium">知求館 メンバーログイン</p>
          {!selectedLoginUser ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-xs font-bold text-slate-400 mb-2">アカウントを選択してください</div>
              {members.map(u => (
                <button key={u.id} onClick={() => setSelectedLoginUser(u)} className="w-full p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 text-left flex justify-between items-center transition-all group">
                  <div className="font-black text-slate-800 group-hover:text-blue-800 text-base flex items-center gap-2"><User className="w-4 h-4 text-slate-400 group-hover:text-blue-500"/> {u.name}</div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${u.role === 'アルバイト' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>{u.role}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-200">
              <button onClick={() => { setSelectedLoginUser(null); setLoginError(''); setLoginPassword(''); }} className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> 戻る</button>
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-lg">{selectedLoginUser.name[0]}</div>
                <div><div className="font-black text-slate-800">{selectedLoginUser.name}</div><div className="text-xs text-slate-500">{selectedLoginUser.role}</div></div>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">パスワード</label>
                  <input type="password" autoFocus required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none transition-colors bg-slate-50 focus:bg-white" value={loginPassword} onChange={e => {setLoginPassword(e.target.value); setLoginError('');}} placeholder="パスワードを入力" />
                  {loginError && <p className="text-red-500 text-xs font-bold mt-2">{loginError}</p>}
                </div>
                <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors active:scale-95">ログイン</button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <ToastContainer toasts={toasts} />
      
      {/* ＝＝＝ 強制パスワード変更モーダル ＝＝＝ */}
      {forcePasswordChange && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center gap-3 mb-6 text-amber-600">
              <ShieldCheck className="w-8 h-8" />
              <h2 className="text-xl font-black">パスワードの変更</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
              セキュリティ保護のため、初期パスワードからの変更が必要です。ご自身専用の新しいパスワードを設定してください。
            </p>
            <form onSubmit={handleForcePasswordChange}>
              <div className="mb-6">
                <input 
                  type="password" autoFocus required minLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none transition-colors bg-slate-50 focus:bg-white font-mono font-bold tracking-widest"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード"
                />
                <p className="text-[10px] text-slate-500 mt-2">※4文字以上で設定してください。</p>
              </div>
              <button type="submit" disabled={isSubmitting || newPassword.length < 4 || newPassword === 'seiki'} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-95">
                変更してシステムを開始する
              </button>
            </form>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <h1 className="text-white font-black text-lg tracking-tight flex items-center gap-2"><CheckSquare className="w-5 h-5 text-blue-500"/> 知求館タスク管理</h1>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="mb-6 px-2">
            <div className="text-xs font-bold text-slate-500 mb-1">ログインユーザー</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white shadow-inner">{currentUser.name[0]}</div>
              <div><div className="text-sm font-bold text-white">{currentUser.name}</div><div className="text-[10px] text-slate-400">{currentUser.role}</div></div>
            </div>
          </div>
          <div className="space-y-1">
            <button onClick={() => setViewMode('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}><BookOpen className="w-4 h-4"/> ダッシュボード</button>
            <button onClick={() => setViewMode('routine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'routine' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}><CalendarIcon className="w-4 h-4"/> ルーティンチェック</button>
            <button onClick={() => setViewMode('special')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'special' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}><CheckSquare className="w-4 h-4"/> 特別タスクボード</button>
            
            {/* 社員のみ検索・履歴を表示 */}
            {isEmployee && (
              <>
                <a href="https://drive.google.com/drive/folders/1wKyynLD_2w9q1GsIWS3YArm6U4n6EERP?usp=drive_link" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Folder className="w-4 h-4"/> 添付資料ドライブ <ExternalLink className="w-3 h-3 ml-auto opacity-50"/>
                </a>
                <button onClick={() => setViewMode('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}><Search className="w-4 h-4"/> 検索・履歴</button>
              </>
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-800 space-y-1">
            {isAdmin && <button onClick={() => setViewMode('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${viewMode === 'settings' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}><Settings className="w-4 h-4"/> 管理者設定</button>}
            <button onClick={() => { setCurrentUser(null); setViewMode('dashboard'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/30 transition-colors"><LogOut className="w-4 h-4"/> ログアウト</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <h2 className="text-lg font-black text-slate-800">
            {viewMode === 'dashboard' ? 'ダッシュボード' : viewMode === 'routine' ? 'ルーティン管理' : viewMode === 'special' ? '特別タスクボード' : viewMode === 'history' ? '検索・履歴' : '管理者設定'}
          </h2>
          {isEmployee && viewMode !== 'settings' && (
            <button onClick={openTaskModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4"/> 特別タスクを発行
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6 relative">
          
          {/* --- ダッシュボード --- */}
          {viewMode === 'dashboard' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
              <div className="text-center bg-white rounded-2xl shadow-sm border border-slate-200 py-6">
                <div className="text-slate-500 font-bold mb-2 flex items-center justify-center gap-2">
                  <CalendarIcon className="w-5 h-5" /> 本日の日付
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-blue-800 tracking-widest">
                  {formatDateWithDay(formatYMD(new Date()))}
                </h2>
              </div>

              {/* 🚨 在庫不足アラート（社員・管理者向け） */}
              {isEmployee && alertTasks.length > 0 && (
                <div className="bg-red-50 rounded-2xl shadow-sm border-2 border-red-400 overflow-hidden animate-in slide-in-from-top-4">
                  <div className="bg-red-500 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <MailWarning className="w-6 h-6 animate-pulse" />
                      <h3 className="font-black text-lg">🚨 緊急アラート：在庫不足</h3>
                    </div>
                    <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{alertTasks.length} 件</span>
                  </div>
                  <div className="p-2">
                    <div className="divide-y divide-red-100">
                      {alertTasks.map(task => (
                        <div key={task.id} className="p-4 hover:bg-red-100 transition-colors flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
                            <h4 className="font-bold text-red-900 truncate mb-1">{task.alertMessage}</h4>
                            <div className="flex gap-3 text-xs text-red-700/70">
                              <span>報告: <strong className="text-red-800">{task.assignee}</strong></span>
                              <span>日時: {formatDateTimeWithDay(new Date(task.createdAt?.toMillis?.() || Date.now()))}</span>
                            </div>
                          </div>
                          <button onClick={() => handleArchiveTask(task.id)} className="bg-white hover:bg-slate-100 text-red-600 border border-red-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm">
                            確認・対応済みにする
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center gap-3"><User className="w-6 h-6 text-amber-600" /><h3 className="text-amber-800 font-black text-lg">アルバイトとしての心得</h3></div>
                <div className="p-6">
                  <p className="font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">■ 来訪者への対応心得</p>
                  <ul className="space-y-3">
                    {RULES_TEXT.map((rule, idx) => <li key={idx} className="text-sm text-slate-600 leading-relaxed font-medium pl-2 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:bg-amber-400 before:rounded-full">{rule}</li>)}
                  </ul>
                </div>
              </div>
              
              {!isEmployee && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 text-center">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8"/></div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">今日も1日よろしくお願いします！</h3>
                  <p className="text-sm text-slate-600 mb-6">左のメニューから「ルーティンチェック」を開いて、<br/>本日の業務を実施・報告してください。</p>
                  <button onClick={() => setViewMode('routine')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95">ルーティンチェックを開く</button>
                </div>
              )}

              {isEmployee && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-blue-600" /><h3 className="text-blue-800 font-black">確認待ちの完了タスク</h3></div>
                    {pendingConfirmationTasks.length > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{pendingConfirmationTasks.length} 件</span>}
                  </div>
                  <div className="p-2">
                    {pendingConfirmationTasks.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {pendingConfirmationTasks.map(task => (
                          <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
                              <div className="flex items-center gap-2 mb-1">
                                {task.type === 'routine' && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">ルーティン</span>}
                                <h4 className="font-bold text-slate-800 truncate">{task.title}</h4>
                              </div>
                              <div className="flex gap-3 text-xs text-slate-500">
                                <span>実施: <strong className="text-slate-700">{task.assignee}</strong></span>
                                <span>完了日時: {formatDateTimeWithDay(new Date(task.createdAt?.toMillis?.() || Date.now()))}</span>
                              </div>
                            </div>
                            <button onClick={() => handleArchiveTask(task.id)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">確認済みにする</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 font-bold text-sm">現在、確認待ちのタスクはありません</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- ルーティンチェック（カレンダー形式） --- */}
          {viewMode === 'routine' && (
            <div className="max-w-4xl mx-auto animate-in fade-in h-full flex flex-col">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between px-6 py-4 flex-shrink-0 gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                  <div className="relative flex items-center justify-center min-w-[200px] hover:bg-slate-50 rounded-xl transition-colors p-2 group">
                    <button 
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="flex items-center gap-2 outline-none"
                    >
                      <h2 className="text-2xl md:text-3xl font-black text-blue-800 tracking-wider text-center flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        <CalendarIcon className="w-6 h-6 text-blue-500" />
                        {formatDateWithDay(routineDate)}
                      </h2>
                    </button>
                    {isDatePickerOpen && (
                      <>
                        <div className="fixed inset-0 z-[190]" onClick={() => setIsDatePickerOpen(false)}></div>
                        <DatePickerPopup 
                          currentDateStr={routineDate} 
                          onSelect={setRoutineDate} 
                          onClose={() => setIsDatePickerOpen(false)} 
                        />
                      </>
                    )}
                  </div>
                  <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
                </div>
                <button onClick={() => setRoutineDate(formatYMD(new Date()))} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors whitespace-nowrap">今日に戻る</button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {settings.routines.map(r => {
                    const task = dayRoutineTasks.find(t => t.routineId === r.id && !t.archived);
                    const isCompleted = task && task.status === 'done';
                    const hasLinks = r.attachmentLinks?.length > 0 || r.manualUrl;
                    return (
                      <div key={r.id} onClick={() => task && task.status !== 'todo' ? openTaskDetail(task) : openNewRoutineModal(r)} className="p-5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? 'bg-teal-100 text-teal-600' : (!task || task.status === 'todo') ? 'bg-slate-100 text-slate-400 group-hover:bg-blue-50' : 'bg-blue-100 text-blue-600'}`}>
                            {isCompleted ? <CheckCircle2 className="w-6 h-6"/> : <CheckSquare className="w-5 h-5"/>}
                          </div>
                          <div>
                            <h3 className={`font-bold text-base mb-1 transition-colors ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{r.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              {r.formType === 'inventory' && <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100 font-bold">在庫入力</span>}
                              {(hasLinks || r.attachedFiles?.length > 0 || r.description) && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-bold flex items-center gap-1"><BookOpen className="w-3 h-3"/> 手順・説明あり</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {task && task.status !== 'todo' ? (
                            <div className="flex flex-col items-end">
                               <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span>
                               {task.assignee && <span className="text-[10px] text-slate-500 mt-1 font-bold">担当: {task.assignee}</span>}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">未実施（クリックして報告）</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {settings.routines.length === 0 && <div className="p-8 text-center text-slate-400 font-bold">設定されたルーティンがありません。管理者設定から追加してください。</div>}
                </div>
              </div>
            </div>
          )}

          {/* --- 特別タスクボード（カンバン） --- */}
          {viewMode === 'special' && (
            <div className="h-full flex gap-4 overflow-x-auto pb-4 animate-in fade-in">
              {['todo', 'in-progress', 'pending', 'done'].map(status => (
                <div key={status} className={`flex-1 min-w-[300px] max-w-[400px] flex flex-col bg-slate-100/50 rounded-2xl border ${status === 'todo' ? 'border-slate-300' : 'border-slate-200'} max-h-full`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                  <div className={`p-4 border-b flex items-center justify-between font-black rounded-t-2xl ${getStatusColor(status)} border-opacity-50`}>
                    <div className="flex items-center gap-2">
                      {status === 'todo' && <FileText className="w-4 h-4"/>}{status === 'in-progress' && <Clock className="w-4 h-4"/>}{status === 'pending' && <AlertTriangle className="w-4 h-4"/>}{status === 'done' && <CheckSquare className="w-4 h-4"/>}
                      {getStatusLabel(status)}
                    </div>
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs shadow-sm">{kanbanTasks[status]?.length || 0}</span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar relative">
                    {kanbanTasks[status]?.map((task, index) => (
                      <div key={task.id} draggable={isEmployee} onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => openTaskDetail(task)} className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group ${task.dueDate ? 'border-l-4 border-l-amber-400' : ''}`}>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex flex-wrap gap-1">
                            {task.targetGrades?.length > 0 && <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">{task.targetGrades[0]}...</span>}
                          </div>
                          {isEmployee && status === 'todo' && (
                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(task, 'up'); }} disabled={index === 0} className="text-slate-300 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveOrder(task, 'down'); }} disabled={index === kanbanTasks[status].length - 1} className="text-slate-300 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{task.title}</h4>
                        {task.dueDate && status !== 'done' && <div className="text-[10px] font-bold text-red-500 mb-2 flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> 締切: {formatDateWithDay(task.dueDate)}</div>}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-2 mt-auto">
                          <span>依頼: {task.author}</span>
                          {task.assignee ? <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">担当: {task.assignee}</span> : <span>未担当</span>}
                        </div>
                      </div>
                    ))}
                    {(!kanbanTasks[status] || kanbanTasks[status].length === 0) && <div className="text-center py-8 text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-xl">タスクなし</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- 検索・履歴（社員のみ） --- */}
          {viewMode === 'history' && isEmployee && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="タスク名、担当者、内容で検索..." className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <select className="border border-slate-300 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-200 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">すべてのステータス</option>
                  <option value="todo">未着手</option>
                  <option value="in-progress">進行中</option>
                  <option value="done">完了済み</option>
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-3">
                  {historyTasks.map(task => (
                    <div key={task.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between group">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskDetail(task)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">{task.type === 'routine' ? 'ルーティン' : '特別タスク'}</span>
                          <span className="text-xs text-slate-500">{task.targetDate ? `対象日: ${formatDateWithDay(task.targetDate)}` : task.dueDate ? `締切: ${formatDateWithDay(task.dueDate)}` : formatDateTimeWithDay(new Date(task.createdAt?.toMillis?.() || Date.now()))}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-500 flex gap-4 sm:flex-col sm:gap-1 sm:text-right">
                          <span>依頼: {task.author}</span>
                          <span>担当: {task.assignee || '-'}</span>
                        </div>
                        <button onClick={() => handleCopyTask(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="コピーして新規作成"><Copy className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {historyTasks.length === 0 && <div className="text-center py-10 text-slate-400 font-bold">該当するタスクが見つかりません</div>}
                </div>
              </div>
            </div>
          )}

          {/* --- 管理者設定 --- */}
          {viewMode === 'settings' && isAdmin && (
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-full animate-in fade-in">
              <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                <button onClick={() => setSettingsTab('members')} className={`p-3 rounded-xl text-sm font-bold text-left transition-colors ${settingsTab === 'members' ? 'bg-white shadow-sm border border-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>アカウント管理</button>
                <button onClick={() => setSettingsTab('options')} className={`p-3 rounded-xl text-sm font-bold text-left transition-colors ${settingsTab === 'options' ? 'bg-white shadow-sm border border-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>学年・コース設定</button>
                <button onClick={() => setSettingsTab('routines')} className={`p-3 rounded-xl text-sm font-bold text-left transition-colors ${settingsTab === 'routines' ? 'bg-white shadow-sm border border-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>ルーティン設定</button>
                <button onClick={() => setSettingsTab('alerts')} className={`p-3 rounded-xl text-sm font-bold text-left transition-colors flex justify-between items-center ${settingsTab === 'alerts' ? 'bg-white shadow-sm border border-slate-200 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                  アラート・通知設定 {settings.alertSettings?.email && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                </button>
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
                {settingsTab === 'members' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">メンバーの追加</h3>
                      <form onSubmit={handleAddMember} className="flex gap-3 items-end">
                        <div className="flex-1"><label className="block text-xs font-bold text-slate-500 mb-1">氏名</label><input type="text" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={editMemberForm.name} onChange={e => setEditMemberForm({...editMemberForm, name: e.target.value})} /></div>
                        <div className="w-32"><label className="block text-xs font-bold text-slate-500 mb-1">権限</label><select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={editMemberForm.role} onChange={e => setEditMemberForm({...editMemberForm, role: e.target.value})}><option value="アルバイト">アルバイト</option><option value="スタッフ">スタッフ</option><option value="教室長">教室長</option><option value="管理者">管理者</option></select></div>
                        <div className="w-32"><label className="block text-xs font-bold text-slate-500 mb-1">初期PW</label><input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none font-mono" value={editMemberForm.password} onChange={e => setEditMemberForm({...editMemberForm, password: e.target.value})} /></div>
                        <button type="submit" disabled={isSubmitting} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 h-[38px]">追加</button>
                      </form>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">登録済みメンバー</h3>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200"><tr><th className="px-4 py-3">氏名</th><th className="px-4 py-3">権限</th><th className="px-4 py-3">パスワード</th><th className="px-4 py-3 text-center">操作</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {members.map(m => (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-bold">{m.name}</td>
                                <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{m.role}</span></td>
                                <td className="px-4 py-3 font-mono text-slate-500">{m.password}</td>
                                <td className="px-4 py-3 text-center">{m.name !== '管理者' && <button onClick={() => handleDeleteMember(m.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === 'options' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">対象学年リスト
                        <div className="flex gap-2"><input type="text" placeholder="新規追加" className="px-3 py-1 border border-slate-300 rounded text-sm outline-none" value={newGrade} onChange={e => setNewGrade(e.target.value)} /><button onClick={() => { if(newGrade && !settings.grades.includes(newGrade)) { handleUpdateSettings('grades', [...settings.grades, newGrade]); setNewGrade(''); } }} className="bg-slate-800 text-white px-3 py-1 rounded text-sm font-bold">追加</button></div>
                      </h3>
                      <div className="flex flex-wrap gap-2">{settings.grades.map(g => <span key={g} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group">{g} <button onClick={() => handleUpdateSettings('grades', settings.grades.filter(x => x !== g))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button></span>)}</div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">対象コースリスト
                        <div className="flex gap-2"><input type="text" placeholder="新規追加" className="px-3 py-1 border border-slate-300 rounded text-sm outline-none" value={newCourse} onChange={e => setNewCourse(e.target.value)} /><button onClick={() => { if(newCourse && !settings.courses.includes(newCourse)) { handleUpdateSettings('courses', [...settings.courses, newCourse]); setNewCourse(''); } }} className="bg-slate-800 text-white px-3 py-1 rounded text-sm font-bold">追加</button></div>
                      </h3>
                      <div className="flex flex-wrap gap-2">{settings.courses.map(c => <span key={c} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group">{c} <button onClick={() => handleUpdateSettings('courses', settings.courses.filter(x => x !== c))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button></span>)}</div>
                    </div>
                  </div>
                )}
                {settingsTab === 'alerts' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <MailWarning className="w-5 h-5 text-red-500"/> 在庫アラート・通知設定
                      </h3>
                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        アルバイトが入力した紙の在庫数が「通知する閾値（部数）」以下になった場合、指定したメールアドレスへ通知し、ダッシュボードに警告を表示します。
                      </p>
                      
                      <form onSubmit={handleUpdateAlertSettings} className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">通知先メールアドレス（任意）</label>
                          <input 
                            type="email" 
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-white" 
                            value={alertSettingsForm.email} 
                            onChange={e => setAlertSettingsForm({...alertSettingsForm, email: e.target.value})} 
                            placeholder="admin@example.com" 
                          />
                          <p className="text-[10px] text-slate-500 mt-2">※ダミー動作：現在、実際のメールは送信されませんがシステム内で警告が表示されます。</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">通知する閾値（何部以下になったら警告するか）</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" min="0" required
                              className="w-32 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-white text-right" 
                              value={alertSettingsForm.inventoryThreshold} 
                              onChange={e => setAlertSettingsForm({...alertSettingsForm, inventoryThreshold: e.target.value})} 
                            />
                            <span className="text-sm font-bold text-slate-600">部 以下</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex justify-end">
                          <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95">
                            設定を保存する
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                {settingsTab === 'routines' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">ルーティンの追加</h3>
                      <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex gap-4">
                          <div className="flex-[2] space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">ルーティン名 <span className="text-red-500">*</span></label>
                              <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} placeholder="例：黒板消しクリーナー清掃" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">特殊フォームの表示</label>
                              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={newRoutine.formType} onChange={e => setNewRoutine({...newRoutine, formType: e.target.value})}>
                                <option value="none">なし（通常）</option>
                                <option value="inventory">在庫報告フォーム</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex-[3] space-y-3 border-l border-slate-200 pl-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">詳細な手順・説明（任意）</label>
                              <textarea rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={newRoutine.description} onChange={e => setNewRoutine({...newRoutine, description: e.target.value})} placeholder="アルバイトへ伝える定常的な注意事項などを入力" />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 border-t border-slate-200 pt-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-500">マニュアルリンク（複数可・任意）</label>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={copyDriveUrl} className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1">
                                  <Copy className="w-3 h-3"/> URLコピー
                                </button>
                                <a href="https://drive.google.com/drive/folders/1wKyynLD_2w9q1GsIWS3YArm6U4n6EERP?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-700 hover:underline flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                                  <Folder className="w-3 h-3"/> ドライブを開く
                                </a>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {newRoutine.attachmentLinks?.map((link, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <input type="text" className="w-1/3 px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-200 outline-none" value={link.name} onChange={e => {
                                    const newLinks = [...newRoutine.attachmentLinks];
                                    newLinks[idx].name = e.target.value;
                                    setNewRoutine({...newRoutine, attachmentLinks: newLinks});
                                  }} placeholder="表示名" />
                                  <input type="url" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-200 outline-none" value={link.url} onChange={e => {
                                    const newLinks = [...newRoutine.attachmentLinks];
                                    newLinks[idx].url = e.target.value;
                                    setNewRoutine({...newRoutine, attachmentLinks: newLinks});
                                  }} placeholder="URL" />
                                  <button type="button" onClick={() => {
                                    setNewRoutine({...newRoutine, attachmentLinks: newRoutine.attachmentLinks.filter((_, i) => i !== idx)});
                                  }} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => setNewRoutine(prev => ({ ...prev, attachmentLinks: [...(prev.attachmentLinks || []), { name: '', url: '' }] }))} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3"/> リンクを追加
                              </button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">マニュアルファイルの添付（任意）</label>
                            <div className="relative border-2 border-dashed border-slate-300 bg-white rounded-lg px-2 py-2 text-xs text-slate-500 flex items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors">
                              <UploadCloud className="w-4 h-4"/>
                              <span>ファイルを選択 (750KB以下)</span>
                              <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setNewRoutine, 'attachedFiles')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                            </div>
                            {newRoutine.attachedFiles?.length > 0 && (
                              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                                {newRoutine.attachedFiles.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200 text-[10px]">
                                    <span className="truncate flex-1">{file.name}</span>
                                    <button type="button" onClick={() => setNewRoutine(prev => ({...prev, attachedFiles: prev.attachedFiles.filter((_, i) => i !== idx)}))} className="text-red-500 hover:underline ml-2">削除</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button onClick={handleAddRoutine} disabled={isSubmitting || !newRoutine.name.trim()} className="bg-slate-800 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 disabled:opacity-50">追加する</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">登録済みルーティン <span className="text-xs text-slate-500 font-normal">※矢印ボタンで優先度（並び順）を変更できます</span></h3>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200"><tr><th className="px-4 py-3">ルーティン名</th><th className="px-4 py-3 w-32">特殊フォーム</th><th className="px-4 py-3 min-w-[200px]">詳細・マニュアル</th><th className="px-4 py-3 text-center w-32">操作・順序</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {settings.routines.map((r, index) => (
                              editingRoutineId === r.id ? (
                                <tr key={r.id} className="bg-blue-50/50">
                                  <td className="px-3 py-3">
                                    <input type="text" className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs focus:ring-2 focus:ring-blue-200 outline-none mb-2" value={editRoutineForm.name} onChange={e => setEditRoutineForm({...editRoutineForm, name: e.target.value})} placeholder="ルーティン名" />
                                    <textarea rows="2" className="w-full px-2 py-1.5 border border-blue-300 rounded text-[10px] outline-none" value={editRoutineForm.description} onChange={e => setEditRoutineForm({...editRoutineForm, description: e.target.value})} placeholder="詳細な説明" />
                                  </td>
                                  <td className="px-3 py-3 align-top">
                                    <select className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs outline-none" value={editRoutineForm.formType} onChange={e => setEditRoutineForm({...editRoutineForm, formType: e.target.value})}>
                                      <option value="none">なし</option><option value="inventory">在庫</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-3 space-y-2 align-top">
                                    <div className="space-y-1">
                                      {editRoutineForm.attachmentLinks?.map((link, idx) => (
                                        <div key={idx} className="flex gap-1 items-center">
                                          <input type="text" className="w-1/3 px-1 py-1 border border-blue-300 rounded text-[10px] outline-none" value={link.name} onChange={e => {
                                            const newLinks = [...editRoutineForm.attachmentLinks];
                                            newLinks[idx].name = e.target.value;
                                            setEditRoutineForm({...editRoutineForm, attachmentLinks: newLinks});
                                          }} placeholder="名" />
                                          <input type="url" className="w-full px-1 py-1 border border-blue-300 rounded text-[10px] outline-none" value={link.url} onChange={e => {
                                            const newLinks = [...editRoutineForm.attachmentLinks];
                                            newLinks[idx].url = e.target.value;
                                            setEditRoutineForm({...editRoutineForm, attachmentLinks: newLinks});
                                          }} placeholder="URL" />
                                          <button type="button" onClick={() => {
                                            setEditRoutineForm({...editRoutineForm, attachmentLinks: editRoutineForm.attachmentLinks.filter((_, i) => i !== idx)});
                                          }} className="text-red-500"><X className="w-3 h-3"/></button>
                                        </div>
                                      ))}
                                      <button type="button" onClick={() => setEditRoutineForm(prev => ({ ...prev, attachmentLinks: [...(prev.attachmentLinks || []), { name: '', url: '' }] }))} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                        <Plus className="w-3 h-3"/> リンク追加
                                      </button>
                                    </div>
                                    <div className="relative border-2 border-dashed border-blue-300 bg-white rounded px-2 py-1 text-xs text-blue-600 flex items-center justify-center gap-1 cursor-pointer overflow-hidden">
                                      <UploadCloud className="w-3 h-3 flex-shrink-0"/>
                                      <span className="truncate">ファイル追加</span>
                                      <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setEditRoutineForm, 'attachedFiles')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                    </div>
                                    {editRoutineForm.attachedFiles?.map((f, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-[10px] bg-white p-1 border rounded">
                                        <span className="truncate">{f.name}</span>
                                        <button onClick={() => setEditRoutineForm(prev => ({...prev, attachedFiles: prev.attachedFiles.filter((_, i) => i !== idx)}))} className="text-red-500 hover:underline ml-2">削除</button>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="px-3 py-3 text-center align-top">
                                    <div className="flex justify-center gap-1.5">
                                      <button onClick={() => handleUpdateRoutine(r.id)} disabled={isSubmitting} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"><Save className="w-4 h-4"/></button>
                                      <button onClick={() => setEditingRoutineId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X className="w-4 h-4"/></button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr key={r.id} className="hover:bg-slate-50 group transition-colors">
                                  <td className="px-4 py-3 align-top">
                                    <div className="font-bold text-slate-800 mb-1">{r.name}</div>
                                    {r.description && <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{r.description}</div>}
                                  </td>
                                  <td className="px-4 py-3 align-top"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.formType === 'inventory' ? '在庫報告' : 'なし'}</span></td>
                                  <td className="px-4 py-3 align-top">
                                    <div className="flex flex-col gap-1">
                                      {(() => {
                                        const displayLinks = r.attachmentLinks?.length > 0 ? r.attachmentLinks : (r.manualUrl ? [{ name: 'マニュアル', url: r.manualUrl }] : []);
                                        return displayLinks.map((l, idx) => (
                                          l.url && <a key={`link-${idx}`} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline truncate max-w-[200px] flex items-center gap-1"><BookOpen className="w-3 h-3"/> {l.name || 'URLリンク'}</a>
                                        ));
                                      })()}
                                      {r.attachedFiles?.map((f, idx) => (
                                        <a key={idx} href={f.data} download={f.name} className="text-[10px] text-teal-600 hover:underline truncate max-w-[200px] flex items-center gap-1"><File className="w-3 h-3"/> 添付 ({f.name})</a>
                                      ))}
                                      {!r.manualUrl && (!r.attachmentLinks || r.attachmentLinks.length === 0) && (!r.attachedFiles || r.attachedFiles.length === 0) && <span className="text-xs text-slate-400 italic">設定なし</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center align-top">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="flex justify-center gap-1">
                                        <button onClick={() => handleMoveRoutineOrder(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 bg-slate-100 rounded hover:bg-slate-200"><ArrowUp className="w-3 h-3"/></button>
                                        <button onClick={() => handleMoveRoutineOrder(index, 'down')} disabled={index === settings.routines.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 bg-slate-100 rounded hover:bg-slate-200"><ArrowDown className="w-3 h-3"/></button>
                                      </div>
                                      <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { 
                                          setEditingRoutineId(r.id); 
                                          const linksToEdit = r.attachmentLinks?.length > 0 ? r.attachmentLinks : (r.manualUrl ? [{ name: 'マニュアル', url: r.manualUrl }] : []);
                                          setEditRoutineForm({ name: r.name, formType: r.formType, description: r.description || '', attachmentLinks: linksToEdit, attachedFiles: r.attachedFiles || [] }); 
                                        }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit3 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteRoutine(r.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ＝＝＝ ルーティン新規処理モーダル ＝＝＝ */}
      {selectedNewRoutine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center pt-10 px-4 pb-4">
          <div className="bg-white rounded-t-2xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-8 flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-black text-lg text-slate-800 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-blue-600"/> {selectedNewRoutine.name}</h2>
              <button onClick={() => setSelectedNewRoutine(null)} className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleCreateRoutineTask} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="bg-slate-100 rounded-lg p-3 text-sm font-bold text-slate-700 flex items-center gap-2"><CalendarIcon className="w-4 h-4"/> 対象日: {formatDateWithDay(routineDate)}</div>

              {selectedNewRoutine.description && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-sm text-blue-900 whitespace-pre-wrap leading-relaxed shadow-sm">
                  <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Info className="w-4 h-4"/> 詳細・説明</h4>
                  {selectedNewRoutine.description}
                </div>
              )}

              {/* マニュアル・手順書エリア */}
              {(() => {
                const displayLinks = selectedNewRoutine.attachmentLinks?.length > 0 ? selectedNewRoutine.attachmentLinks : (selectedNewRoutine.manualUrl ? [{ name: 'マニュアル', url: selectedNewRoutine.manualUrl }] : []);
                if (displayLinks.length > 0 || (selectedNewRoutine.attachedFiles && selectedNewRoutine.attachedFiles.length > 0)) {
                  return (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4"/> マニュアル・関連資料</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayLinks.map((link, idx) => (
                          link.url && (
                            <a key={`link-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full p-3 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors border border-blue-200 shadow-sm text-sm">
                              <ExternalLink className="w-4 h-4 shrink-0" /> <span className="truncate">{link.name || 'リンクを開く'}</span>
                            </a>
                          )
                        ))}
                        {selectedNewRoutine.attachedFiles?.map((file, idx) => (
                          <a key={`file-${idx}`} href={file.data} download={file.name} className="flex items-center gap-2 w-full p-3 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors border border-blue-200 shadow-sm text-sm">
                            <File className="w-4 h-4 text-blue-400 shrink-0" /> <span className="truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {isEmployee && (
                <div className="flex gap-4 border-b border-slate-100 pb-4 pt-2">
                  <label className={`flex-1 p-3 rounded-xl border-2 text-center cursor-pointer transition-all font-bold text-sm ${routineForm.action === 'request' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                    <input type="radio" className="hidden" checked={routineForm.action === 'request'} onChange={() => setRoutineForm({...routineForm, action: 'request'})} />
                    事前指示・申し送りをする
                  </label>
                  <label className={`flex-1 p-3 rounded-xl border-2 text-center cursor-pointer transition-all font-bold text-sm ${routineForm.action === 'done' ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                    <input type="radio" className="hidden" checked={routineForm.action === 'done'} onChange={() => setRoutineForm({...routineForm, action: 'done'})} />
                    自分で完了済みにする
                  </label>
                </div>
              )}

              {routineForm.action === 'request' ? (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">本日の追加指示・連絡メモ（任意）</label>
                    <textarea rows="4" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none bg-slate-50 focus:bg-white" value={routineForm.description} onChange={e => setRoutineForm({...routineForm, description: e.target.value})} placeholder="具体的な手順や注意書きがあれば記入してください" />
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-slate-700">追加の手順書リンク（複数可・任意）</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={copyDriveUrl} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors flex items-center gap-1">
                          <Copy className="w-3 h-3"/> URLをコピー
                        </button>
                        <a href="https://drive.google.com/drive/folders/1wKyynLD_2w9q1GsIWS3YArm6U4n6EERP?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                          <Folder className="w-3 h-3"/> ドライブを開く
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {routineForm.attachmentLinks?.map((link, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="flex-[1] w-full">
                            <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={link.name} onChange={e => {
                              const newLinks = [...routineForm.attachmentLinks];
                              newLinks[idx].name = e.target.value;
                              setRoutineForm({...routineForm, attachmentLinks: newLinks});
                            }} placeholder="表示名 (例: 座席表)" />
                          </div>
                          <div className="flex-[2] w-full">
                            <input type="url" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={link.url} onChange={e => {
                              const newLinks = [...routineForm.attachmentLinks];
                              newLinks[idx].url = e.target.value;
                              setRoutineForm({...routineForm, attachmentLinks: newLinks});
                            }} placeholder="https://" />
                          </div>
                          <button type="button" onClick={() => {
                            setRoutineForm({...routineForm, attachmentLinks: routineForm.attachmentLinks.filter((_, i) => i !== idx)});
                          }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 shrink-0 self-end sm:self-auto">
                            <X className="w-5 h-5"/>
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setRoutineForm(prev => ({ ...prev, attachmentLinks: [...(prev.attachmentLinks || []), { name: '', url: '' }] }))} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2">
                        <Plus className="w-4 h-4"/> リンクを追加
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">指示の添付ファイル（複数可・任意）</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm text-slate-600 h-[46px] cursor-pointer">
                      <UploadCloud className="w-4 h-4"/>
                      <span>ファイルを選択 (1ファイル750KB以下)</span>
                      <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setRoutineForm, 'attachedFiles')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                    </div>
                    {routineForm.attachedFiles?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {routineForm.attachedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                            <span className="truncate flex-1">{file.name}</span>
                            <button type="button" onClick={() => setRoutineForm(prev => ({...prev, attachedFiles: prev.attachedFiles.filter((_, i) => i !== idx)}))} className="text-red-500 hover:underline ml-2">削除</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  {!isEmployee && (
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 mb-2">実施した人の名前 <span className="text-red-500">*</span></label>
                      <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 outline-none bg-slate-50 focus:bg-white" value={routineForm.actualAssignee} onChange={e => setRoutineForm({...routineForm, actualAssignee: e.target.value})} placeholder="例：山田太郎" />
                    </div>
                  )}

                  {selectedNewRoutine.formType === 'inventory' && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm"><Package className="w-4 h-4"/> 在庫数の報告</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {['A3', 'A4', 'B4', 'B5'].map(size => (
                          <div key={size}><label className="block text-xs font-bold text-slate-500 mb-1">{size}</label><input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 outline-none" value={routineForm.inventoryDetails[size.toLowerCase()]} onChange={e => setRoutineForm({...routineForm, inventoryDetails: {...routineForm.inventoryDetails, [size.toLowerCase()]: e.target.value}})} placeholder="部・包" /></div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">完了報告 / メモ（任意）</label>
                    <textarea rows="3" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 outline-none bg-slate-50 focus:bg-white" value={routineForm.reportMemo} onChange={e => setRoutineForm({...routineForm, reportMemo: e.target.value})} placeholder="印刷機の調子が悪かったです、等" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">報告の添付ファイル（画像など・複数可・任意）</label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm text-slate-600 h-[46px] cursor-pointer">
                      <UploadCloud className="w-4 h-4"/>
                      <span>ファイルを選択 (1ファイル750KB以下)</span>
                      <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setRoutineForm, 'reportFiles')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                    </div>
                    {routineForm.reportFiles?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {routineForm.reportFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                            <span className="truncate flex-1">{file.name}</span>
                            <button type="button" onClick={() => setRoutineForm(prev => ({...prev, reportFiles: prev.reportFiles.filter((_, i) => i !== idx)}))} className="text-red-500 hover:underline ml-2">削除</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setSelectedNewRoutine(null)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl">キャンセル</button>
              <button onClick={handleCreateRoutineTask} disabled={isSubmitting} className={`px-8 py-2.5 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center min-w-[120px] transition-all active:scale-95 ${routineForm.action === 'request' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                {routineForm.action === 'request' ? '指示を保存する' : '完了報告する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ 特別タスク作成・編集モーダル ＝＝＝ */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center pt-10 px-4 pb-4">
          <div className="bg-white rounded-t-2xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-8 flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50 flex-shrink-0">
              <h2 className="font-black text-lg text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {isEditingTask ? '特別・イレギュラータスクの修正' : '特別・イレギュラータスクの発行'}</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-amber-700 hover:bg-amber-200 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">依頼名 <span className="text-red-500">*</span></label><input type="text" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 outline-none" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="例：〇〇テストの採点" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">完了希望日 <span className="text-red-500">*</span></label><input type="date" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 outline-none" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">対象学年（任意）</label><div className="h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">{settings.grades.map(g => (<label key={g} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-slate-100 rounded"><input type="checkbox" className="accent-amber-600 rounded" checked={taskForm.targetGrades.includes(g)} onChange={() => setTaskForm(prev => ({...prev, targetGrades: prev.targetGrades.includes(g) ? prev.targetGrades.filter(x => x !== g) : [...prev.targetGrades, g] }))} /> {g}</label>))}</div></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">対象コース（任意）</label><div className="h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">{settings.courses.map(c => (<label key={c} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-slate-100 rounded"><input type="checkbox" className="accent-amber-600 rounded" checked={taskForm.targetCourses.includes(c)} onChange={() => setTaskForm(prev => ({...prev, targetCourses: prev.targetCourses.includes(c) ? prev.targetCourses.filter(x => x !== c) : [...prev.targetCourses, c] }))} /> {c}</label>))}</div></div>
              </div>
              <div className="space-y-6 border-t border-slate-100 pt-6">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">詳細な手順・説明（任意）</label><textarea rows="4" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 outline-none bg-slate-50 focus:bg-white transition-colors" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="具体的な手順や注意書きがあれば記入してください" /></div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700">手順書・関連リンク（複数可・任意）</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={copyDriveUrl} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <Copy className="w-3 h-3"/> ドライブURLをコピー
                      </button>
                      <a href="https://drive.google.com/drive/folders/1wKyynLD_2w9q1GsIWS3YArm6U4n6EERP?usp=drive_link" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                        <Folder className="w-3 h-3"/> ドライブを開く
                      </a>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {taskForm.attachmentLinks?.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="flex-[1] w-full">
                          <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 outline-none" value={link.name} onChange={e => {
                            const newLinks = [...taskForm.attachmentLinks];
                            newLinks[idx].name = e.target.value;
                            setTaskForm({...taskForm, attachmentLinks: newLinks});
                          }} placeholder="表示名 (例: マニュアル)" />
                        </div>
                        <div className="flex-[2] w-full">
                          <input type="url" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 outline-none" value={link.url} onChange={e => {
                            const newLinks = [...taskForm.attachmentLinks];
                            newLinks[idx].url = e.target.value;
                            setTaskForm({...taskForm, attachmentLinks: newLinks});
                          }} placeholder="https://" />
                        </div>
                        <button type="button" onClick={() => {
                          setTaskForm({...taskForm, attachmentLinks: taskForm.attachmentLinks.filter((_, i) => i !== idx)});
                        }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 shrink-0 self-end sm:self-auto">
                          <X className="w-5 h-5"/>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setTaskForm(prev => ({ ...prev, attachmentLinks: [...(prev.attachmentLinks || []), { name: '', url: '' }] }))} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2">
                      <Plus className="w-4 h-4"/> リンクを追加
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ファイルの直接添付（複数可・任意）</label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-xl px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm text-slate-600 h-[46px] cursor-pointer">
                    <UploadCloud className="w-4 h-4"/>
                    <span>ファイルを選択 (1ファイル750KB以下)</span>
                    <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setTaskForm, 'attachedFiles')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  </div>
                  {taskForm.attachedFiles?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {taskForm.attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                          <span className="truncate flex-1">{file.name}</span>
                          <button type="button" onClick={() => setTaskForm(prev => ({...prev, attachedFiles: prev.attachedFiles.filter((_, i) => i !== idx)}))} className="text-red-500 hover:underline ml-2">削除</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsTaskModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl">キャンセル</button>
              <button onClick={handleCreateTask} disabled={isSubmitting} className="px-8 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center min-w-[120px]">{isEditingTask ? '更新する' : '発行する'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ タスク詳細モーダル ＝＝＝ */}
      {selectedTask && !isTaskModalOpen && !selectedNewRoutine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(selectedTask.status)}`}>{getStatusLabel(selectedTask.status)}</span>
              <div className="flex items-center gap-2">
                {isEmployee && (
                  <button onClick={() => handleCopyTask()} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><Copy className="w-3.5 h-3.5"/> コピーして作成</button>
                )}
                <button onClick={() => setSelectedTask(null)} className="p-2 rounded-full hover:bg-slate-200 text-slate-400"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
                  {selectedTask.type === 'routine' && <CheckSquare className="w-5 h-5 text-blue-500" />}
                  {selectedTask.type === 'special' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {selectedTask.title}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-4">
                  <span className="bg-slate-100 px-2 py-1 rounded">依頼: {selectedTask.author}</span>
                  {selectedTask.targetDate && <span className="bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded">対象日: {formatDateWithDay(selectedTask.targetDate)}</span>}
                  {selectedTask.dueDate && <span className="bg-red-50 text-red-600 font-bold px-2 py-1 rounded">締切: {formatDateWithDay(selectedTask.dueDate)}</span>}
                </div>
                {(selectedTask.targetGrades?.length > 0 || selectedTask.targetCourses?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedTask.targetGrades?.map(g => <span key={g} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">{g}</span>)}
                    {selectedTask.targetCourses?.map(c => <span key={c} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">{c}</span>)}
                  </div>
                )}
              </div>

              {selectedTask.masterDescription && selectedTask.type === 'routine' && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-sm text-blue-900 whitespace-pre-wrap leading-relaxed shadow-sm">
                  <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1"><Info className="w-4 h-4"/> 詳細・説明</h4>
                  {selectedTask.masterDescription}
                </div>
              )}

              {selectedTask.description && (
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {selectedTask.type === 'routine' && <h4 className="text-xs font-bold text-slate-500 mb-2">本日の追加指示</h4>}
                  {selectedTask.description}
                </div>
              )}

              {/* マニュアル・添付ファイル リンク */}
              {(() => {
                const displayLinks = selectedTask.attachmentLinks?.length > 0 ? [...selectedTask.attachmentLinks] : [];
                if (selectedTask.attachmentUrl && !displayLinks.some(l => l.url === selectedTask.attachmentUrl)) {
                  displayLinks.push({ name: '手順書・マニュアル', url: selectedTask.attachmentUrl });
                }

                if (displayLinks.length > 0 || (selectedTask.attachedFiles && selectedTask.attachedFiles.length > 0)) {
                  return (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4"/> 関連リンク・資料</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {displayLinks.map((link, idx) => (
                          link.url && (
                            <a key={`link-${idx}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full p-3 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors border border-blue-200 shadow-sm text-sm">
                              <ExternalLink className="w-4 h-4 shrink-0" /> <span className="truncate">{link.name || 'リンクを開く'}</span>
                            </a>
                          )
                        ))}
                        {selectedTask.attachedFiles?.map((file, idx) => (
                          <a key={`file-${idx}`} href={file.data} download={file.name} className="flex items-center gap-2 w-full p-3 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-bold transition-colors border border-blue-200 shadow-sm text-sm">
                            <File className="w-4 h-4 text-blue-400 shrink-0" /> <span className="truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <hr className="border-slate-100" />

              {/* ステータスアクションエリア */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800">ステータス更新・報告</h3>
                
                {/* 未着手 -> 進行中 */}
                {selectedTask.status === 'todo' && (
                  <button onClick={() => handleUpdateTaskStatus(selectedTask.id, 'in-progress')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md flex justify-center items-center gap-2 active:scale-95 transition-all">
                    <Clock className="w-5 h-5"/> このタスクを担当する（着手）
                  </button>
                )}

                {/* 進行中・保留 -> 完了 */}
                {(selectedTask.status === 'in-progress' || selectedTask.status === 'pending') && (
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                    <div className="text-sm font-bold text-slate-600">担当: <span className="text-blue-700">{selectedTask.assignee}</span></div>
                    
                    {/* 特殊フォーム入力: 在庫確認 */}
                    {selectedTask.formType === 'inventory' && (
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm"><Package className="w-4 h-4"/> 在庫数の報告</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {['A3', 'A4', 'B4', 'B5'].map(size => (
                            <div key={size}>
                              <label className="block text-xs font-bold text-slate-500 mb-1">{size}</label>
                              <input type="text" className="w-full p-2 border border-slate-300 rounded focus:border-teal-500 outline-none" value={inventoryDetails[size.toLowerCase()]} onChange={e => setInventoryDetails({...inventoryDetails, [size.toLowerCase()]: e.target.value})} placeholder="部・包" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isEmployee && (
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-600 mb-2">実施した人の名前 <span className="text-red-500">*</span></label>
                        <input type="text" required className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 outline-none" value={actualAssignee} onChange={e => setActualAssignee(e.target.value)} placeholder="例：山田太郎" />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">完了報告 / 申し送りメモ（任意）</label>
                      <textarea rows="3" className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 outline-none" value={reportMemo} onChange={e => setReportMemo(e.target.value)} placeholder="印刷機の調子が悪かったです、等"></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">報告の添付ファイル（画像など・複数可・任意）</label>
                      <div className="relative border-2 border-dashed border-slate-300 rounded-lg px-4 py-2 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm text-slate-600 h-[46px] cursor-pointer">
                        <UploadCloud className="w-4 h-4"/>
                        <span>ファイルを選択 (1ファイル750KB以下)</span>
                        <input type="file" multiple onChange={e => handleMultipleFilesUpload(e, setReportFiles)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                      </div>
                      {reportFiles?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {reportFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                              <span className="truncate flex-1">{file.name}</span>
                              <button type="button" onClick={() => setReportFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:underline ml-2">削除</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200 flex-wrap">
                      <button onClick={() => handleUpdateTaskStatus(selectedTask.id, 'todo')} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors border border-slate-300 min-w-[100px]">
                        未着手に戻す
                      </button>
                      <button onClick={() => handleUpdateTaskStatus(selectedTask.id, 'pending')} className="flex-1 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold text-sm transition-colors border border-amber-300 min-w-[100px]">
                        一旦保留にする
                      </button>
                      <button onClick={handleCompleteTask} className="w-full sm:flex-[2] py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex justify-center items-center gap-1.5">
                        <CheckSquare className="w-4 h-4"/> 完了報告する
                      </button>
                    </div>
                  </div>
                )}

                {/* 完了済み表示 */}
                {selectedTask.status === 'done' && (
                  <div className="bg-teal-50 p-4 border border-teal-200 rounded-xl space-y-3">
                    <div className="text-teal-800 font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> 完了済みのタスクです</div>
                    <div className="text-sm text-teal-900 bg-white p-3 rounded-lg border border-teal-100">
                      <div>担当: <span className="font-bold">{selectedTask.assignee}</span></div>
                      {selectedTask.reportMemo && <div className="mt-2 pt-2 border-t border-teal-100"><strong>報告メモ:</strong><br/>{selectedTask.reportMemo}</div>}
                      {selectedTask.inventoryDetails && (
                        <div className="mt-2 pt-2 border-t border-teal-100">
                          <strong className="text-red-600 flex items-center gap-1 mb-1"><Package className="w-4 h-4"/> 在庫報告:</strong>
                          <ul className="flex gap-4 mt-1 font-bold">
                            <li>A3: <span className={selectedTask.inventoryDetails.a3 && Number(selectedTask.inventoryDetails.a3) <= (settings.alertSettings?.inventoryThreshold || 10) ? 'text-red-600' : ''}>{selectedTask.inventoryDetails.a3||'-'}</span></li>
                            <li>A4: <span className={selectedTask.inventoryDetails.a4 && Number(selectedTask.inventoryDetails.a4) <= (settings.alertSettings?.inventoryThreshold || 10) ? 'text-red-600' : ''}>{selectedTask.inventoryDetails.a4||'-'}</span></li>
                            <li>B4: <span className={selectedTask.inventoryDetails.b4 && Number(selectedTask.inventoryDetails.b4) <= (settings.alertSettings?.inventoryThreshold || 10) ? 'text-red-600' : ''}>{selectedTask.inventoryDetails.b4||'-'}</span></li>
                            <li>B5: <span className={selectedTask.inventoryDetails.b5 && Number(selectedTask.inventoryDetails.b5) <= (settings.alertSettings?.inventoryThreshold || 10) ? 'text-red-600' : ''}>{selectedTask.inventoryDetails.b5||'-'}</span></li>
                          </ul>
                        </div>
                      )}
                      
                      {selectedTask.reportFiles?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-teal-100 space-y-2">
                          <strong className="block text-teal-800 text-xs">報告の添付ファイル:</strong>
                          {selectedTask.reportFiles.map((file, idx) => (
                            <a key={idx} href={file.data} download={file.name} className="flex items-center gap-1.5 text-teal-700 hover:text-teal-900 transition-colors font-bold text-xs bg-white p-2 rounded-lg border border-teal-200 shadow-sm">
                              <File className="w-4 h-4" /> {file.name} をダウンロード
                            </a>
                          ))}
                        </div>
                      )}

                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-teal-200">
                      <button onClick={() => handleUpdateTaskStatus(selectedTask.id, 'in-progress')} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
                        <ArrowUp className="w-3 h-3"/> 間違えて完了した場合はこちら（進行中に戻す）
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 社員用 編集・削除ボタン */}
              {isEmployee && (
                <div className="border-t border-slate-100 pt-6 mt-6 flex flex-wrap gap-4 justify-between items-center">
                  {selectedTask.type === 'special' ? (
                    <button onClick={() => openEditTaskModal(selectedTask)} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 hover:underline">
                      <Edit3 className="w-4 h-4"/> タスク内容を修正する
                    </button>
                  ) : <div></div>}
                  <button onClick={() => handleDeleteTask(selectedTask.id)} className="text-sm font-bold text-red-500 flex items-center gap-1.5 hover:underline ml-auto">
                    <Trash2 className="w-4 h-4"/> このタスクを完全に削除する
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ＝＝＝ 汎用確認ダイアログ ＝＝＝ */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 mb-4"><AlertTriangle className="w-6 h-6" /><h3 className="font-black text-xl">確認</h3></div>
            <p className="text-slate-700 text-sm whitespace-pre-wrap mb-8 leading-relaxed font-medium">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog({isOpen:false})} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50">キャンセル</button>
              <button onClick={executeConfirm} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all active:scale-95">実行する</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

