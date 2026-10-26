import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Plus, Trash2, Edit3, Download, Upload, CheckCircle2, 
  XCircle, AlertCircle, Clock, BookOpen, Award, ArrowLeft, 
  ArrowRight, Save, Eye, RefreshCw, HelpCircle, FileText, 
  Check, X, Image as ImageIcon, ChevronRight, BarChart2,
  Settings, User, ShieldCheck, Flame, RotateCcw, LayoutGrid,
  Languages, Loader2
} from 'lucide-react';

// --- INITIAL SAMPLE DATA ---
const INITIAL_SETS = [
  {
    id: 'rrb-mock-01',
    title: 'RRB NTPC & Group D - Full Mock Test 01',
    description: '100 Questions Practice based on actual TCS CBT pattern. Includes Mathematics, Reasoning & General Science.',
    durationMinutes: 90,
    positiveMarks: 1,
    negativeMarks: 0.3333,
    createdAt: '2025-02-15',
    questions: [
      {
        id: 'q1',
        section: 'Mathematics',
        text: 'A sum of money doubles itself at compound interest in 15 years. In how many years will it become 8 times of itself at the same rate of interest?',
        imageUrl: '',
        options: [
          { key: 'A', text: '30 years', imageUrl: '' },
          { key: 'B', text: '45 years', imageUrl: '' },
          { key: 'C', text: '60 years', imageUrl: '' },
          { key: 'D', text: '50 years', imageUrl: '' }
        ],
        correctAnswer: 'B',
        explanation: 'At CI, P becomes 2P in 15 years. So (2)^3 = 8 times will take 3 * 15 = 45 years.'
      },
      {
        id: 'q2',
        section: 'Mathematics',
        text: 'Evaluate the trigonometric expression given below:\nIf sin θ + cos θ = √2 cos θ, then what is the value of (cos θ - sin θ)?',
        imageUrl: '',
        options: [
          { key: 'A', text: '√2 sin θ', imageUrl: '' },
          { key: 'B', text: '-√2 sin θ', imageUrl: '' },
          { key: 'C', text: '2 sin θ', imageUrl: '' },
          { key: 'D', text: '√2 cos θ', imageUrl: '' }
        ],
        correctAnswer: 'A',
        explanation: 'Squaring both sides and applying identity sin²θ + cos²θ = 1 gives cos θ - sin θ = √2 sin θ.'
      },
      {
        id: 'q3',
        section: 'General Intelligence & Reasoning',
        text: 'Select the missing number from the given mathematical matrix pattern:\n\n[ 7   9   12 ]\n[ 4   6    8  ]\n[ 3   3    ?  ]\n[ 28  54  96 ]',
        imageUrl: '',
        options: [
          { key: 'A', text: '4', imageUrl: '' },
          { key: 'B', text: '5', imageUrl: '' },
          { key: 'C', text: '6', imageUrl: '' },
          { key: 'D', text: '8', imageUrl: '' }
        ],
        correctAnswer: 'A',
        explanation: 'Column logic: 7 * 4 = 28, 9 * 6 = 54, 12 * 8 = 96. Pattern gives ? = 4.'
      },
      {
        id: 'q4',
        section: 'General Science',
        text: 'Which of the following noble gases is used in radiant advertising signboards to produce an intense reddish-orange light?',
        imageUrl: '',
        options: [
          { key: 'A', text: 'Argon (Ar)', imageUrl: '' },
          { key: 'B', text: 'Neon (Ne)', imageUrl: '' },
          { key: 'C', text: 'Krypton (Kr)', imageUrl: '' },
          { key: 'D', text: 'Helium (He)', imageUrl: '' }
        ],
        correctAnswer: 'B',
        explanation: 'Neon gas emits a vibrant reddish-orange glow in discharge tubes.'
      },
      {
        id: 'q5',
        section: 'Mathematics',
        text: 'Two trains of length 150 m and 180 m are traveling towards each other on parallel tracks at speeds of 54 km/h and 72 km/h respectively. In what time will they cross each other completely?',
        imageUrl: '',
        options: [
          { key: 'A', text: '9.4 seconds', imageUrl: '' },
          { key: 'B', text: '11.2 seconds', imageUrl: '' },
          { key: 'C', text: '10.0 seconds', imageUrl: '' },
          { key: 'D', text: '12.5 seconds', imageUrl: '' }
        ],
        correctAnswer: 'A',
        explanation: 'Total distance = 330 m. Relative speed = 126 km/h = 35 m/s. Time = 330 / 35 ≈ 9.42 seconds.'
      }
    ]
  }
];

// Lightweight Translator
async function translateOnline(text) {
  if (!text || !text.trim()) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data?.[0] ? data[0].map(item => item[0]).join('') : text;
  } catch {
    return text;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [paperSets, setPaperSets] = useState(() => {
    try {
      const saved = localStorage.getItem('pyqs_paper_sets');
      return saved ? JSON.parse(saved) : INITIAL_SETS;
    } catch (e) {
      return INITIAL_SETS;
    }
  });

  const [selectedSet, setSelectedSet] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Active Test Engine States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [questionStatuses, setQuestionStatuses] = useState({}); 
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(90 * 60);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [lastExamResult, setLastExamResult] = useState(null);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Translation State (UI Preserved)
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState({});
  const [showHindi, setShowHindi] = useState(false);

  // Create/Edit Set Modal
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [setForm, setSetForm] = useState({
    title: '',
    description: '',
    durationMinutes: 90,
    positiveMarks: 1,
    negativeMarks: 0.3333
  });

  // Question Management Modal/State
  const [managingSetId, setManagingSetId] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    section: 'Mathematics',
    text: '',
    imageUrl: '',
    options: [
      { key: 'A', text: '', imageUrl: '' },
      { key: 'B', text: '', imageUrl: '' },
      { key: 'C', text: '', imageUrl: '' },
      { key: 'D', text: '', imageUrl: '' }
    ],
    correctAnswer: 'A',
    explanation: ''
  });

  useEffect(() => {
    localStorage.setItem('pyqs_paper_sets', JSON.stringify(paperSets));
  }, [paperSets]);

  const timerRef = useRef(null);
  useEffect(() => {
    if (currentView === 'test_screen') {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView, selectedSet, userAnswers, questionStatuses]);

  useEffect(() => {
    if (currentView === 'test_screen' && selectedSet) {
      const q = selectedSet.questions[currentQuestionIndex];
      if (q) {
        setQuestionStatuses((prev) => {
          const currentStatus = prev[q.id];
          if (!currentStatus || currentStatus === 'not_visited') {
            return { ...prev, [q.id]: 'unanswered' };
          }
          return prev;
        });
      }
    }
  }, [currentQuestionIndex, currentView, selectedSet]);

  const handleOpenConfirmModal = (set) => {
    if (!set.questions || set.questions.length === 0) {
      alert("Is paper set me abhi koi questions nahi hain! Pehle questions add ya import karein.");
      return;
    }
    setSelectedSet(set);
    setAcceptedTerms(false);
    setShowConfirmModal(true);
  };

  const startExam = () => {
    setShowConfirmModal(false);
    const duration = (selectedSet.durationMinutes || 90) * 60;
    setTimeLeftSeconds(duration);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowMobilePalette(false);
    setShowHindi(false);
    setTranslations({});
    
    const initialStatus = {};
    selectedSet.questions.forEach((q, idx) => {
      initialStatus[q.id] = idx === 0 ? 'unanswered' : 'not_visited';
    });
    setQuestionStatuses(initialStatus);
    setSelectedSectionFilter('ALL');
    setCurrentView('test_screen');
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const questions = selectedSet.questions;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (!ans) {
        unattemptedCount++;
      } else if (ans === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const posMarks = Number(selectedSet.positiveMarks || 1);
    const negMarks = Number(selectedSet.negativeMarks || 0.3333);
    const rawScore = (correctCount * posMarks) - (wrongCount * negMarks);
    const totalMaxMarks = questions.length * posMarks;
    const accuracy = (correctCount + wrongCount) > 0 
      ? ((correctCount / (correctCount + wrongCount)) * 100).toFixed(1) 
      : 0;

    const resultData = {
      set: selectedSet,
      date: new Date().toLocaleString(),
      totalQuestions: questions.length,
      attemptedCount: correctCount + wrongCount,
      correctCount,
      wrongCount,
      unattemptedCount,
      rawScore: rawScore.toFixed(2),
      totalMaxMarks,
      accuracy,
      userAnswers,
      timeTakenSeconds: ((selectedSet.durationMinutes || 90) * 60) - timeLeftSeconds
    };

    setLastExamResult(resultData);
    setCurrentView('result_screen');
  };

  const currentQ = selectedSet?.questions[currentQuestionIndex];

  // Language switcher
  const handleToggleTranslate = async () => {
    if (!currentQ) return;
    if (showHindi) {
      setShowHindi(false);
      return;
    }

    if (translations[currentQ.id]) {
      setShowHindi(true);
      return;
    }

    setIsTranslating(true);
    try {
      const qTextHindi = await translateOnline(currentQ.text);
      const optsHindi = await Promise.all(
        currentQ.options.map(async (o) => ({
          ...o,
          text: await translateOnline(o.text)
        }))
      );
      setTranslations(prev => ({
        ...prev,
        [currentQ.id]: { text: qTextHindi, options: optsHindi }
      }));
      setShowHindi(true);
    } catch {
      // Fallback
    } finally {
      setIsTranslating(false);
    }
  };

  const activeQuestionText = (showHindi && translations[currentQ?.id]) ? translations[currentQ.id].text : currentQ?.text;
  const activeOptions = (showHindi && translations[currentQ?.id]) ? translations[currentQ.id].options : currentQ?.options;

  const handleSelectOption = (key) => {
    if (!currentQ) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: key }));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
    setQuestionStatuses(prev => ({
      ...prev,
      [currentQ.id]: 'unanswered'
    }));
  };

  const handleSaveAndNext = () => {
    if (!currentQ) return;
    const isAnswered = !!userAnswers[currentQ.id];
    setQuestionStatuses(prev => ({
      ...prev,
      [currentQ.id]: isAnswered ? 'answered' : 'unanswered'
    }));
    if (currentQuestionIndex < selectedSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    const isAnswered = !!userAnswers[currentQ.id];
    setQuestionStatuses(prev => ({
      ...prev,
      [currentQ.id]: isAnswered ? 'marked_answered' : 'marked'
    }));
    if (currentQuestionIndex < selectedSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleOpenSetModal = (set = null) => {
    if (set) {
      setEditingSet(set);
      setSetForm({
        title: set.title,
        description: set.description,
        durationMinutes: set.durationMinutes || 90,
        positiveMarks: set.positiveMarks || 1,
        negativeMarks: set.negativeMarks || 0.3333
      });
    } else {
      setEditingSet(null);
      setSetForm({
        title: `RRB CBT Paper Set ${paperSets.length + 1}`,
        description: 'Target Practice for NTPC / Group D / ALP / JE 100 Questions',
        durationMinutes: 90,
        positiveMarks: 1,
        negativeMarks: 0.3333
      });
    }
    setShowSetModal(true);
  };

  const handleSaveSet = (e) => {
    e.preventDefault();
    if (!setForm.title.trim()) return;

    if (editingSet) {
      setPaperSets(prev => prev.map(s => s.id === editingSet.id ? {
        ...s,
        ...setForm,
        durationMinutes: Number(setForm.durationMinutes),
        positiveMarks: Number(setForm.positiveMarks),
        negativeMarks: Number(setForm.negativeMarks)
      } : s));
    } else {
      const newSet = {
        id: 'set_' + Date.now(),
        ...setForm,
        durationMinutes: Number(setForm.durationMinutes),
        positiveMarks: Number(setForm.positiveMarks),
        negativeMarks: Number(setForm.negativeMarks),
        createdAt: new Date().toISOString().split('T')[0],
        questions: []
      };
      setPaperSets(prev => [newSet, ...prev]);
    }
    setShowSetModal(false);
  };

  const handleDeleteSet = (id) => {
    if (window.confirm("Kya aap sach me is paper set ko delete karna chahte hain?")) {
      setPaperSets(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paperSets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PYQS_Practices_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const incomingSets = Array.isArray(parsed) ? parsed : [parsed];
        const validSets = incomingSets.filter(s => s && (s.questions || s.title));
        if (validSets.length === 0) {
          alert("Invalid file format.");
          return;
        }

        setPaperSets((prevSets) => {
          const newSetIds = new Set(validSets.map(s => s.id || ('set_' + Date.now())));
          const preservedPrev = prevSets.filter(s => !newSetIds.has(s.id));
          return [...validSets, ...preservedPrev];
        });

        alert(`Successfully imported ${validSets.length} paper set(s)!`);
      } catch (err) {
        alert("Error reading JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const currentManageSet = paperSets.find(s => s.id === managingSetId);

  const handleOpenAddQuestion = (q = null) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionForm({ ...q });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        section: 'Mathematics',
        text: '',
        imageUrl: '',
        options: [
          { key: 'A', text: '', imageUrl: '' },
          { key: 'B', text: '', imageUrl: '' },
          { key: 'C', text: '', imageUrl: '' },
          { key: 'D', text: '', imageUrl: '' }
        ],
        correctAnswer: 'A',
        explanation: ''
      });
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!questionForm.text.trim() && !questionForm.imageUrl.trim()) {
      alert("Please enter question text or add an image.");
      return;
    }

    setPaperSets(prevSets => prevSets.map(set => {
      if (set.id !== managingSetId) return set;
      let updatedQuestions = [...set.questions];

      if (editingQuestion) {
        updatedQuestions = updatedQuestions.map(q => q.id === editingQuestion.id ? { ...questionForm, id: q.id } : q);
      } else {
        const newQ = {
          ...questionForm,
          id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 6)
        };
        updatedQuestions.push(newQ);
      }
      return { ...set, questions: updatedQuestions };
    }));

    setShowQuestionModal(false);
  };

  const handleDeleteQuestion = (qId) => {
    if (window.confirm("Delete this question?")) {
      setPaperSets(prevSets => prevSets.map(set => {
        if (set.id !== managingSetId) return set;
        return {
          ...set,
          questions: set.questions.filter(q => q.id !== qId)
        };
      }));
    }
  };

  const handleGenerateSampleQuestions = (count = 5) => {
    if (!currentManageSet) return;
    const dummySubjects = ['Mathematics', 'General Intelligence & Reasoning', 'General Science', 'General Awareness'];
    const generated = Array.from({ length: count }).map((_, i) => {
      const idx = currentManageSet.questions.length + i + 1;
      const sub = dummySubjects[i % dummySubjects.length];
      return {
        id: 'q_gen_' + Date.now() + '_' + idx,
        section: sub,
        text: `[Sample RRB CBT Question #${idx}] If a sum triples itself in 8 years, find the rate of interest per annum under simple interest calculation?`,
        imageUrl: '',
        options: [
          { key: 'A', text: '12.5%', imageUrl: '' },
          { key: 'B', text: '25%', imageUrl: '' },
          { key: 'C', text: '16.66%', imageUrl: '' },
          { key: 'D', text: '33.33%', imageUrl: '' }
        ],
        correctAnswer: 'B',
        explanation: 'SI = 2P in 8 years. Rate = (2P * 100) / (P * 8) = 200/8 = 25%.'
      };
    });

    setPaperSets(prev => prev.map(s => {
      if (s.id === managingSetId) {
        return { ...s, questions: [...s.questions, ...generated] };
      }
      return s;
    }));
  };

  const handleImageUpload = (file, callback) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaletteStyle = (status) => {
    switch(status) {
      case 'answered':
        return 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
      case 'unanswered':
        return 'bg-red-500 text-white border-red-600 shadow-sm';
      case 'marked':
        return 'bg-purple-600 text-white border-purple-700';
      case 'marked_answered':
        return 'bg-purple-600 text-white border-purple-700 relative';
      case 'not_visited':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    }
  };

  const testSections = selectedSet ? ['ALL', ...new Set(selectedSet.questions.map(q => q.section || 'General'))] : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased">
      
      {/* 1. TOP GLOBAL NAVIGATION HEADER */}
      {currentView !== 'test_screen' && (
        <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 backdrop-blur">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-bold text-lg sm:text-xl shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
                  PYQS Practices
                  <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                    RRB CBT
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400">90-Minute Mock Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <label className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Import JSON</span>
                <span className="sm:hidden">Import</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export Backup</span>
                <span className="sm:hidden">Backup</span>
              </button>
              <button
                onClick={() => handleOpenSetModal()}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Create Paper Set</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 2. MAIN BODY SWITCH */}
      <main className="flex-1 flex flex-col">
        {/* VIEW A: DASHBOARD OF PAPER SETS */}
        {currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 w-full flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Available Paper Sets</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                  Select any previous year set to practice under standard 90-minute RRB examination conditions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
                  <div className="text-xs text-slate-400">Total Sets</div>
                  <div className="text-base sm:text-lg font-bold text-blue-400">{paperSets.length}</div>
                </div>
              </div>
            </div>

            {/* Set Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-5">
              {paperSets.map((set) => {
                const qCount = set.questions?.length || 0;
                return (
                  <div 
                    key={set.id}
                    className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-5 sm:p-6 transition duration-200 flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          {set.durationMinutes || 90} Mins
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenSetModal(set); }}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                            title="Edit Set Info"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                            title="Delete Set"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-semibold text-white mt-3 group-hover:text-blue-400 transition line-clamp-1">
                        {set.title}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {set.description || "No description provided."}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-4 py-2.5 border-y border-slate-700/60 text-center">
                        <div>
                          <div className="text-[11px] text-slate-400">Questions</div>
                          <div className="text-sm sm:text-base font-bold text-white mt-0.5">{qCount}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Marks/Q</div>
                          <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">+{set.positiveMarks || 1}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-400">Negative</div>
                          <div className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">-{set.negativeMarks ? Number(set.negativeMarks).toFixed(2) : '0.33'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          setManagingSetId(set.id);
                          setCurrentView('question_manager');
                        }}
                        className="flex-1 py-2.5 px-2 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        Manage ({qCount})
                      </button>

                      <button
                        onClick={() => handleOpenConfirmModal(set)}
                        className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW B: QUESTION MANAGER */}
        {currentView === 'question_manager' && currentManageSet && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 w-full flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    {currentManageSet.title}
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-blue-400">
                      {currentManageSet.questions.length} Qs
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Manage questions and diagrams for this paper set</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateSampleQuestions(5)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  +5 Sample Qs
                </button>
                <button
                  onClick={() => handleOpenAddQuestion()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="mt-5 space-y-4 flex-1 overflow-y-auto">
              {currentManageSet.questions.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                  <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-300">No questions added yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click "Add Question" above or import a JSON set to start.
                  </p>
                </div>
              ) : (
                currentManageSet.questions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 hover:border-slate-600 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                          Q{idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {q.section || 'General'}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Ans: {q.correctAnswer}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAddQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                      {q.text}
                    </div>

                    {q.imageUrl && (
                      <div className="mt-3 max-w-md bg-slate-950 p-2 rounded-lg border border-slate-700">
                        <img src={q.imageUrl} alt="Diagram" className="max-h-40 object-contain rounded mx-auto" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {q.options.map((opt) => (
                        <div 
                          key={opt.key}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs font-medium ${
                            opt.key === q.correctAnswer 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                              : 'bg-slate-900/60 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                            opt.key === q.correctAnswer ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt.key}
                          </span>
                          <div className="flex-1">
                            <div>{opt.text}</div>
                            {opt.imageUrl && (
                              <img src={opt.imageUrl} alt="" className="mt-1 max-h-20 rounded border border-slate-700" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW C: CBT TEST SCREEN (ORIGINAL CLEAN UI PRESERVED) */}
        {currentView === 'test_screen' && selectedSet && currentQ && (
          <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-slate-900 select-none">
            
            {/* Top CBT Header */}
            <header className="h-13 sm:h-14 bg-slate-950 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-600 flex items-center justify-center font-black text-white text-xs sm:text-sm shrink-0">
                  RRB
                </div>
                <div className="truncate max-w-[150px] sm:max-w-md">
                  <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                    {selectedSet.title}
                  </h2>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400">CBT Simulation</span>
                </div>
              </div>

              {/* Timer + Clean Language Button + Mobile Palette */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Minimalist Language Switch Button */}
                <button
                  disabled={isTranslating}
                  onClick={handleToggleTranslate}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                    showHindi 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Toggle Hindi translation"
                >
                  {isTranslating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{showHindi ? 'ENG' : 'हिंदी'}</span>
                </button>

                <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-lg border font-mono font-bold tracking-wider ${
                  timeLeftSeconds < 300 
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse' 
                    : 'bg-slate-800 border-slate-700 text-yellow-400'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm">{formatTime(timeLeftSeconds)}</span>
                </div>

                {/* Mobile Question Palette Toggle Button */}
                <button
                  onClick={() => setShowMobilePalette(prev => !prev)}
                  className="lg:hidden p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center gap-1 text-xs"
                >
                  <LayoutGrid className="w-4 h-4 text-blue-400" />
                  <span>Q-Box</span>
                </button>

                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-300 font-semibold">RRB Aspirant</span>
                </div>
              </div>
            </header>

            {/* Sub-Header: Section Filters */}
            <div className="h-10 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[65%] sm:max-w-none">
                <span className="text-[11px] text-slate-400 font-medium shrink-0">Sec:</span>
                {testSections.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSectionFilter(sec)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap transition ${
                      selectedSectionFilter === sec 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[11px] font-medium shrink-0">
                <span className="text-emerald-400">+{selectedSet.positiveMarks || 1}</span>
                <span className="text-rose-400">-{selectedSet.negativeMarks ? Number(selectedSet.negativeMarks).toFixed(2) : '0.33'}</span>
              </div>
            </div>

            {/* Test Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Question & Options Area */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto p-3.5 sm:p-6 bg-slate-900">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20">
                      Q.{currentQuestionIndex + 1} / {selectedSet.questions.length}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      [{currentQ.section || 'General'}]
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="mt-3">
                    <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {activeQuestionText}
                    </p>

                    {currentQ.imageUrl && (
                      <div className="mt-3 max-w-xl bg-white p-2 rounded-xl shadow-md border border-slate-300">
                        <img 
                          src={currentQ.imageUrl} 
                          alt="Question mathematical diagram" 
                          className="max-h-52 object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="mt-4 sm:mt-6 space-y-2.5 max-w-3xl">
                    {activeOptions.map((opt) => {
                      const isSelected = userAnswers[currentQ.id] === opt.key;
                      return (
                        <label
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition active:scale-[0.99] ${
                            isSelected 
                              ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500' 
                              : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-600 text-white' 
                              : 'border-slate-500 bg-slate-900 text-slate-300'
                          }`}>
                            {opt.key}
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-xs sm:text-sm font-medium leading-normal">{opt.text}</div>
                            {opt.imageUrl && (
                              <img 
                                src={opt.imageUrl} 
                                alt={`Option ${opt.key}`} 
                                className="mt-2 max-h-24 object-contain bg-white p-1 rounded border border-slate-400"
                              />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="mt-6 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 bg-slate-900 pb-2">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                    <button
                      onClick={handleMarkForReviewAndNext}
                      className="flex-1 sm:flex-none px-3 py-2 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-600/60 text-purple-300 rounded-lg text-xs font-semibold transition"
                    >
                      Mark Review
                    </button>
                    <button
                      onClick={handleClearResponse}
                      className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleSaveAndNext}
                      className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1"
                    >
                      Save & Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Palette */}
              <aside className={`
                fixed inset-y-0 right-0 z-40 w-72 bg-slate-950 border-l border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out
                lg:static lg:w-80 lg:translate-x-0
                ${showMobilePalette ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}
              `}>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question Palette
                    </h3>
                    <button 
                      onClick={() => setShowMobilePalette(false)}
                      className="lg:hidden text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-1.5 my-2.5 text-[10px] text-slate-300 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-red-500 text-white flex items-center justify-center font-bold text-[9px]">!</span>
                      <span>Unanswered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-[9px]">●</span>
                      <span>Review</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center font-bold text-[9px]">-</span>
                      <span>Not Visited</span>
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-1">
                    <div className="grid grid-cols-5 gap-1.5">
                      {selectedSet.questions.map((q, idx) => {
                        if (selectedSectionFilter !== 'ALL' && q.section !== selectedSectionFilter) {
                          return null;
                        }
                        const status = questionStatuses[q.id] || 'not_visited';
                        const isCurrent = idx === currentQuestionIndex;
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCurrentQuestionIndex(idx);
                              setShowMobilePalette(false);
                            }}
                            className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center border ${getPaletteStyle(status)} ${
                              isCurrent ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Final Submit */}
                <div className="pt-3 border-t border-slate-800 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm("Kya aap test finalize karke submit karna chahte hain?")) {
                        finishExam();
                      }
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Test
                  </button>
                </div>
              </aside>

              {/* Mobile Backdrop for Palette */}
              {showMobilePalette && (
                <div 
                  onClick={() => setShowMobilePalette(false)}
                  className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                />
              )}
            </div>
          </div>
        )}

        {/* VIEW D: INSTANT SCORECARD */}
        {currentView === 'result_screen' && lastExamResult && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Official Scorecard & Analysis
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                  {lastExamResult.set.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Time Spent: {Math.floor(lastExamResult.timeTakenSeconds / 60)}m {lastExamResult.timeTakenSeconds % 60}s
                </p>
              </div>

              <button
                onClick={() => setCurrentView('dashboard')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>

            {/* Scorecard Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 mb-6">
              <div className="bg-slate-800/90 border border-slate-700 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-slate-400 font-medium">Net Score</div>
                <div className={`text-xl sm:text-2xl font-black mt-1 ${Number(lastExamResult.rawScore) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lastExamResult.rawScore}
                </div>
                <div className="text-[10px] text-slate-500">out of {lastExamResult.totalMaxMarks}</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-slate-400 font-medium">Accuracy</div>
                <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{lastExamResult.accuracy}%</div>
                <div className="text-[10px] text-slate-500">Attempted basis</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-slate-400 font-medium">Attempted</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">{lastExamResult.attemptedCount}</div>
                <div className="text-[10px] text-slate-500">/ {lastExamResult.totalQuestions} Qs</div>
              </div>

              <div className="bg-slate-800/90 border border-emerald-900/40 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-emerald-400 font-medium">Correct (+1)</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{lastExamResult.correctCount}</div>
              </div>

              <div className="bg-slate-800/90 border border-rose-900/40 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-rose-400 font-medium">Incorrect (-0.33)</div>
                <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1">{lastExamResult.wrongCount}</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 p-3 sm:p-4 rounded-xl text-center">
                <div className="text-[11px] text-slate-400 font-medium">Skipped (0)</div>
                <div className="text-xl sm:text-2xl font-black text-slate-300 mt-1">{lastExamResult.unattemptedCount}</div>
              </div>
            </div>

            {/* Question Review List */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Question Solutions & Review
              </h3>

              <div className="space-y-4">
                {lastExamResult.set.questions.map((q, idx) => {
                  const userAns = lastExamResult.userAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  const isSkipped = !userAns;

                  return (
                    <div 
                      key={q.id}
                      className={`p-4 rounded-xl border transition ${
                        isSkipped 
                          ? 'bg-slate-900/50 border-slate-700' 
                          : isCorrect 
                            ? 'bg-emerald-950/20 border-emerald-500/40' 
                            : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          {isSkipped && <span className="text-[11px] text-slate-400">Skipped (0)</span>}
                          {!isSkipped && isCorrect && <span className="text-[11px] text-emerald-400 font-semibold">✓ Correct (+1)</span>}
                          {!isSkipped && !isCorrect && <span className="text-[11px] text-rose-400 font-semibold">✗ Wrong (-0.33)</span>}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-200 whitespace-pre-line leading-relaxed">
                        {q.text}
                      </p>

                      {q.imageUrl && (
                        <div className="my-2.5 max-w-sm bg-white p-2 rounded-lg border">
                          <img src={q.imageUrl} alt="" className="max-h-40 object-contain mx-auto" />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {q.options.map((opt) => {
                          const isThisUserAns = userAns === opt.key;
                          const isThisCorrect = q.correctAnswer === opt.key;

                          let badgeStyle = "bg-slate-900 border-slate-700 text-slate-300";
                          if (isThisCorrect) {
                            badgeStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                          } else if (isThisUserAns && !isThisCorrect) {
                            badgeStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                          }

                          return (
                            <div key={opt.key} className={`p-2.5 rounded-lg border text-xs font-medium flex items-start gap-2 ${badgeStyle}`}>
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {opt.key}
                              </span>
                              <div className="flex-1">
                                <div>{opt.text}</div>
                                {isThisCorrect && <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">✓ Correct</span>}
                                {isThisUserAns && !isThisCorrect && <span className="text-[10px] font-bold text-rose-400 block mt-0.5">✗ Your Choice</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                          <span className="font-bold text-yellow-400">Note: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL 1: TEST CONFIRMATION --- */}
      {showConfirmModal && selectedSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm sm:text-base">Examination Instructions</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed custom-scrollbar">
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-3 text-blue-300">
                <h4 className="font-bold text-xs sm:text-sm text-blue-200 mb-0.5">{selectedSet.title}</h4>
                <p>90 Minutes duration | {selectedSet.questions.length} Questions</p>
              </div>

              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Har sahi uttar par <strong className="text-emerald-400">+{selectedSet.positiveMarks || 1}</strong> milega.</li>
                <li>Har galat uttar par <strong className="text-rose-400">-{Number(selectedSet.negativeMarks || 0.33).toFixed(2)}</strong> negative marking hogi.</li>
                <li>Chhode gaye prashna par koi mark deduct nahi hoga.</li>
              </ul>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600"
                  />
                  <span className="text-xs text-slate-200">
                    Maine sabhi niyam padh liye hain aur main test shuru karne ke liye taiyar hoon.
                  </span>
                </label>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex justify-end gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                disabled={!acceptedTerms}
                onClick={startExam}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE / EDIT SET --- */}
      {showSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5">
            <h3 className="text-base font-bold text-white mb-3">
              {editingSet ? 'Edit Paper Set' : 'Create New Paper Set'}
            </h3>
            <form onSubmit={handleSaveSet} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Set Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RRB JE Shift 1"
                  value={setForm.title}
                  onChange={(e) => setSetForm({ ...setForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={setForm.description}
                  onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block">Duration (M)</label>
                  <input
                    type="number"
                    value={setForm.durationMinutes}
                    onChange={(e) => setSetForm({ ...setForm, durationMinutes: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block">Correct (+)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={setForm.positiveMarks}
                    onChange={(e) => setSetForm({ ...setForm, positiveMarks: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block">Negative (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={setForm.negativeMarks}
                    onChange={(e) => setSetForm({ ...setForm, negativeMarks: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-md"
                >
                  Save Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD/EDIT QUESTION --- */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Section</label>
                  <select
                    value={questionForm.section}
                    onChange={(e) => setQuestionForm({ ...questionForm, section: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="General Intelligence & Reasoning">Reasoning</option>
                    <option value="General Science">General Science</option>
                    <option value="General Awareness">General Awareness</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Correct Answer</label>
                  <select
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Question Text</label>
                <textarea
                  rows={2}
                  placeholder="Type question here..."
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              {/* Question Image */}
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[11px] text-slate-300 block mb-1.5">Diagram Image (Optional)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL or upload..."
                    value={questionForm.imageUrl}
                    onChange={(e) => setQuestionForm({ ...questionForm, imageUrl: e.target.value })}
                    className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <label className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], (data) => setQuestionForm(prev => ({ ...prev, imageUrl: data })))}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-300 block">Options A, B, C, D</label>
                {questionForm.options.map((opt, i) => (
                  <div key={opt.key} className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${opt.key}`}
                      value={opt.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestionForm(prev => {
                          const newOpts = [...prev.options];
                          newOpts[i].text = val;
                          return { ...prev, options: newOpts };
                        });
                      }}
                      className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-md"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
