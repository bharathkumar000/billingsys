"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Trash2,
  Plus,
  Download,
  Globe,
  FileText,
  Send,
  RotateCcw,
  ChevronRight,
  X,
  Sparkles,
  Volume2,
  Zap,
  Clock,
  Package,
  User,
  Bot,
  Sun,
  Moon,
  Hash,
  ShoppingCart,
  MessageSquare,
  Layers,
  Check,
  UtensilsCrossed,
  Bell,
  Eye,
  Save,
  ArrowUpDown,
} from 'lucide-react';

/* ===== TYPE DEFINITIONS ===== */
interface BillingItem {
  item_name_en: string;
  item_name_kn: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Session {
  id: string;
  session_title: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  grand_total?: number;
}

interface AppNotification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

type StatusType = 'IDLE' | 'READY' | 'LISTENING' | 'EXTRACTING' | 'LOADING' | 'CREATING' | 'PDF_GEN' | 'ERROR' | 'SPEECH_ERROR';

/* ===== STATUS CONFIG ===== */
const statusConfig: Record<StatusType, { label: string; color: string; dotClass: string }> = {
  IDLE:         { label: 'Idle',        color: 'var(--text-dim)',      dotClass: '' },
  READY:        { label: 'Online',      color: 'var(--success)',       dotClass: 'online' },
  LISTENING:    { label: 'Listening…',  color: 'var(--danger)',        dotClass: 'recording' },
  EXTRACTING:   { label: 'Parsing…',    color: 'var(--warning)',       dotClass: 'processing' },
  LOADING:      { label: 'Loading…',    color: 'var(--warning)',       dotClass: 'processing' },
  CREATING:     { label: 'Creating…',   color: 'var(--warning)',       dotClass: 'processing' },
  PDF_GEN:      { label: 'Generating…', color: 'var(--accent-primary)', dotClass: 'processing' },
  ERROR:        { label: 'Error',       color: 'var(--danger)',        dotClass: '' },
  SPEECH_ERROR: { label: 'Mic Error',   color: 'var(--danger)',        dotClass: '' },
};

/* ===== RESTAURANT MOCK MENU ===== */
interface MenuItem {
  name_en: string;
  name_kn: string;
  price: number;
  unit: string;
  emoji: string;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  items: MenuItem[];
}

const RESTAURANT_MENU: MenuCategory[] = [
  {
    id: 'starters',
    label: 'Starters',
    icon: '🍢',
    items: [
      { name_en: 'Paneer Tikka', name_kn: 'ಪನೀರ್ ಟಿಕ್ಕಾ', price: 220, unit: 'Plate', emoji: '🧀' },
      { name_en: 'Chicken 65', name_kn: 'ಚಿಕನ್ 65', price: 280, unit: 'Plate', emoji: '🍗' },
      { name_en: 'Gobi Manchurian', name_kn: 'ಗೋಬಿ ಮಂಚೂರಿಯನ್', price: 180, unit: 'Plate', emoji: '🥦' },
      { name_en: 'Veg Spring Roll', name_kn: 'ವೆಜ್ ಸ್ಪ್ರಿಂಗ್ ರೋಲ್', price: 160, unit: 'Plate', emoji: '🥟' },
      { name_en: 'Masala Papad', name_kn: 'ಮಸಾಲ ಪಾಪಡ್', price: 80, unit: 'Plate', emoji: '🫓' },
    ],
  },
  {
    id: 'main',
    label: 'Main Course',
    icon: '🍛',
    items: [
      { name_en: 'Butter Chicken', name_kn: 'ಬಟರ್ ಚಿಕನ್', price: 350, unit: 'Plate', emoji: '🍗' },
      { name_en: 'Paneer Butter Masala', name_kn: 'ಪನೀರ್ ಬಟರ್ ಮಸಾಲ', price: 280, unit: 'Plate', emoji: '🧀' },
      { name_en: 'Dal Makhani', name_kn: 'ದಾಲ್ ಮಖನಿ', price: 220, unit: 'Bowl', emoji: '🫘' },
      { name_en: 'Mutton Rogan Josh', name_kn: 'ಮಟನ್ ರೋಗನ್ ಜೋಶ್', price: 420, unit: 'Plate', emoji: '🥩' },
      { name_en: 'Aloo Gobi', name_kn: 'ಆಲೂ ಗೋಬಿ', price: 180, unit: 'Plate', emoji: '🥔' },
    ],
  },
  {
    id: 'biryani',
    label: 'Biryani & Rice',
    icon: '🍚',
    items: [
      { name_en: 'Chicken Biryani', name_kn: 'ಚಿಕನ್ ಬಿರಿಯಾನಿ', price: 320, unit: 'Plate', emoji: '🍗' },
      { name_en: 'Mutton Biryani', name_kn: 'ಮಟನ್ ಬಿರಿಯಾನಿ', price: 380, unit: 'Plate', emoji: '🥩' },
      { name_en: 'Veg Biryani', name_kn: 'ವೆಜ್ ಬಿರಿಯಾನಿ', price: 240, unit: 'Plate', emoji: '🥕' },
      { name_en: 'Jeera Rice', name_kn: 'ಜೀರಾ ರೈಸ್', price: 140, unit: 'Plate', emoji: '🍚' },
      { name_en: 'Curd Rice', name_kn: 'ಮೊಸರನ್ನ', price: 120, unit: 'Bowl', emoji: '🥣' },
    ],
  },
  {
    id: 'breads',
    label: 'Breads',
    icon: '🫓',
    items: [
      { name_en: 'Butter Naan', name_kn: 'ಬಟರ್ ನಾನ್', price: 60, unit: 'Piece', emoji: '🫓' },
      { name_en: 'Garlic Naan', name_kn: 'ಗಾರ್ಲಿಕ್ ನಾನ್', price: 70, unit: 'Piece', emoji: '🧄' },
      { name_en: 'Tandoori Roti', name_kn: 'ತಂದೂರಿ ರೊಟ್ಟಿ', price: 40, unit: 'Piece', emoji: '🍞' },
      { name_en: 'Laccha Paratha', name_kn: 'ಲಚ್ಚಾ ಪರಾಠ', price: 60, unit: 'Piece', emoji: '🥙' },
      { name_en: 'Kulcha', name_kn: 'ಕುಲ್ಚಾ', price: 70, unit: 'Piece', emoji: '🫓' },
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    icon: '☕',
    items: [
      { name_en: 'Masala Chai', name_kn: 'ಮಸಾಲ ಚಹಾ', price: 40, unit: 'Cup', emoji: '☕' },
      { name_en: 'Filter Coffee', name_kn: 'ಫಿಲ್ಟರ್ ಕಾಫಿ', price: 50, unit: 'Cup', emoji: '☕' },
      { name_en: 'Fresh Lime Soda', name_kn: 'ಲಿಂಬೆ ಸೋಡಾ', price: 60, unit: 'Glass', emoji: '🍋' },
      { name_en: 'Mango Lassi', name_kn: 'ಮಾಂಗೋ ಲಸ್ಸಿ', price: 90, unit: 'Glass', emoji: '🥭' },
      { name_en: 'Buttermilk', name_kn: 'ಮಜ್ಜಿಗೆ', price: 40, unit: 'Glass', emoji: '🥛' },
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    icon: '🍨',
    items: [
      { name_en: 'Gulab Jamun', name_kn: 'ಗುಲಾಬ್ ಜಾಮೂನ್', price: 80, unit: 'Plate', emoji: '🟤' },
      { name_en: 'Ras Malai', name_kn: 'ರಸಮಲಾಯಿ', price: 100, unit: 'Plate', emoji: '🍮' },
      { name_en: 'Ice Cream', name_kn: 'ಐಸ್ ಕ್ರೀಮ್', price: 120, unit: 'Scoop', emoji: '🍨' },
      { name_en: 'Kesari Bath', name_kn: 'ಕೇಸರಿ ಬಾತ್', price: 70, unit: 'Bowl', emoji: '🟡' },
      { name_en: 'Payasam', name_kn: 'ಪಾಯಸ', price: 80, unit: 'Bowl', emoji: '🥣' },
    ],
  },
];

/* ===== MAIN APP ===== */
export default function VoiceBillingApp() {
  const recognitionRef = useRef<any>(null);
  const localRecRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const handleSendMessageRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const voiceAccumulatedRef = useRef<string>('');

  // Core state
  const [isRecording, setIsRecording] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [activeSessionTitle, setActiveSessionTitle] = useState('New Invoice');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [items, setItems] = useState<BillingItem[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [listenerLanguage, setListenerLanguage] = useState<'kn-IN' | 'en-IN'>('en-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusType>('IDLE');
  const [customerName, setCustomerName] = useState('');
  const [editingCell, setEditingCell] = useState<{ index: number; field: keyof BillingItem } | null>(null);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'num-desc' | 'num-asc' | 'total-desc' | 'total-asc' | 'name-asc' | 'name-desc'>('date-desc');

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on client-side mount to avoid hydration mismatch
  useEffect(() => {
    const savedTheme = localStorage.getItem('voicebill-theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const [menuCategory, setMenuCategory] = useState<string>('starters');
  
  // Menu visibility toggled by "Add from Menu" button
  const [showMenu, setShowMenu] = useState(false);

  // Custom Modal States
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInterim, setVoiceInterim] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsHistory, setShowNotificationsHistory] = useState(false);

  // Shipping & Details Metadata States
  const [invoiceDate, setInvoiceDate] = useState('');
  const [destination, setDestination] = useState('');
  const [dispatchedThrough, setDispatchedThrough] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneeGstin, setConsigneeGstin] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [terminalView, setTerminalView] = useState<'chat' | 'sessions'>('chat');

  // Resizable panel states
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [chatWidth, setChatWidth] = useState(380);

  // Mouse Drag Handlers
  const startSidebarResize = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = sidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(450, startWidth + (mouseMoveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  const startChatResize = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = chatWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(600, startWidth - (mouseMoveEvent.clientX - startX)));
      setChatWidth(newWidth);
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  // ===== IN-APP NOTIFICATION TRIGGER =====
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const triggerNotification = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotifications(prev => [{ id, text: message, time, read: false }, ...prev]);
    showToast(message);
  }, [showToast]);

  // Read all notifications
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ===== WEB SPEECH API (TIMELINE MIC) =====
  useEffect(() => {
    loadSessions(true);
  }, []);



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // ===== VOICE MODAL SPEECH RECOGNITION =====
  const startVoiceRecording = (overrideLang?: 'kn-IN' | 'en-IN') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerNotification('Speech recognition is not supported in this browser.');
      return;
    }
    
    // Stop any current running instance
    if (localRecRef.current) {
      localRecRef.current.stop();
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = overrideLang || listenerLanguage;

    rec.onstart = () => {
      setIsVoiceRecording(true);
    };
    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (final) {
        setVoiceTranscript(prev => (prev + ' ' + final).trim());
      }
      setVoiceInterim(interim);
    };
    rec.onerror = (err: any) => {
      console.warn('Voice Assistant Mic Error:', err);
      setIsVoiceRecording(false);
      let msg = 'Microphone error or permission denied.';
      if (err.error === 'network') {
        msg = "ASR network error. (Note: If using Brave, enable 'Google services for speech recognition' in brave://settings/privacy)";
      } else if (err.error === 'not-allowed') {
        msg = "Microphone access denied. Please allow microphone permissions in the browser address bar.";
      }
      triggerNotification(msg);
    };
    rec.onend = () => {
      setIsVoiceRecording(false);
    };

    rec.start();
    localRecRef.current = rec;
  };

  const stopVoiceRecording = () => {
    if (localRecRef.current) {
      localRecRef.current.stop();
    }
    setIsVoiceRecording(false);
  };

  const handleVoiceModalOpen = () => {
    setVoiceTranscript('');
    setVoiceInterim('');
    setIsVoiceModalOpen(true);
  };

  const handleVoiceModalClose = () => {
    stopVoiceRecording();
    setIsVoiceModalOpen(false);
  };

  const handleCommitVoiceInput = () => {
    if (!voiceTranscript.trim()) {
      triggerNotification('Please speak or type a command first.');
      return;
    }
    handleSendMessage(voiceTranscript);
    setIsVoiceModalOpen(false);
    stopVoiceRecording();
  };

  // ===== API CALLS =====
  const loadSessions = async (initFirst = false) => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);
        if (initFirst) {
          if (data.sessions.length > 0) {
            loadSessionDetail(data.sessions[0].id);
          } else {
            createNewSession();
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const loadSessionDetail = async (id: string) => {
    setIsLoading(true);
    setStatusMessage('LOADING');
    try {
      const res = await fetch(`/api/sessions/${id}`);
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSessionId(data.session.id);
        setActiveSessionTitle(data.session.session_title);
        setItems(data.items || []);
        setChatLog(
          (data.history || []).map((h: any) => ({
            role: h.sender_role,
            text: h.raw_transcript,
          }))
        );
        // Load metadata fields
        setCustomerName(data.session.customer_name || '');
        setInvoiceDate(data.session.invoice_date || '');
        setDestination(data.session.destination || '');
        setDispatchedThrough(data.session.dispatched_through || '');
        setTermsOfDelivery(data.session.terms_of_delivery || '');
        setConsigneeName(data.session.consignee_name || '');
        setConsigneeAddress(data.session.consignee_address || '');
        setConsigneeGstin(data.session.consignee_gstin || '');
        setBuyerAddress(data.session.buyer_address || '');
        setBuyerGstin(data.session.buyer_gstin || '');
        setConsigneePhone(data.session.consignee_phone || '');
        setBuyerPhone(data.session.buyer_phone || '');
        setSidebarOpen(true);
        setTerminalView('chat');
        setStatusMessage('READY');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setStatusMessage('ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    setIsLoading(true);
    setStatusMessage('CREATING');
    const newId = 'sess_' + Math.floor(100000 + Math.random() * 900000);

    // Clear state immediately to provide instant visual feedback to user
    setItems([]);
    setChatLog([]);
    setCustomerName('');
    setInvoiceDate('');
    setDestination('');
    setDispatchedThrough('');
    setTermsOfDelivery('');
    setConsigneeName('');
    setConsigneeAddress('');
    setConsigneeGstin('');
    setBuyerAddress('');
    setBuyerGstin('');
    setConsigneePhone('');
    setBuyerPhone('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessionId(newId);
        setActiveSessionTitle(data.session.session_title);
        loadSessions(false);
        setStatusMessage('READY');
        triggerNotification('New invoice session created');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setStatusMessage('ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setStatusMessage('EXTRACTING');
    const updatedLog: ChatMessage[] = [...chatLog, { role: 'user', text }];
    setChatLog(updatedLog);
    setTextInput('');

    try {
      const res = await fetch('/api/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: text, items }),
      });
      const data = await res.json();
      if (data.success && data.extractedData) {
        const newItems = data.extractedData.items || [];
        setItems(newItems);

        let extractedCust = customerName;
        let extractedDate = invoiceDate;
        let extractedDest = destination;
        let extractedDisp = dispatchedThrough;
        let extractedTerms = termsOfDelivery;
        let extractedConsName = consigneeName;
        let extractedConsAddr = consigneeAddress;
        let extractedConsGstin = consigneeGstin;
        let extractedBuyAddr = buyerAddress;
        let extractedBuyGstin = buyerGstin;
        let extractedConsPhone = consigneePhone;
        let extractedBuyPhone = buyerPhone;

        if (data.extractedData.customer_name) {
          setCustomerName(data.extractedData.customer_name);
          extractedCust = data.extractedData.customer_name;
        }
        if (data.extractedData.invoice_date) {
          setInvoiceDate(data.extractedData.invoice_date);
          extractedDate = data.extractedData.invoice_date;
          setSidebarOpen(true);
        }
        if (data.extractedData.destination) {
          setDestination(data.extractedData.destination);
          extractedDest = data.extractedData.destination;
          setSidebarOpen(true);
        }
        if (data.extractedData.dispatched_through) {
          setDispatchedThrough(data.extractedData.dispatched_through);
          extractedDisp = data.extractedData.dispatched_through;
          setSidebarOpen(true);
        }
        if (data.extractedData.terms_of_delivery) {
          setTermsOfDelivery(data.extractedData.terms_of_delivery);
          extractedTerms = data.extractedData.terms_of_delivery;
          setSidebarOpen(true);
        }
        if (data.extractedData.consignee_name) {
          setConsigneeName(data.extractedData.consignee_name);
          extractedConsName = data.extractedData.consignee_name;
          setSidebarOpen(true);
        }
        if (data.extractedData.consignee_address) {
          setConsigneeAddress(data.extractedData.consignee_address);
          extractedConsAddr = data.extractedData.consignee_address;
          setSidebarOpen(true);
        }
        if (data.extractedData.consignee_gstin) {
          setConsigneeGstin(data.extractedData.consignee_gstin);
          extractedConsGstin = data.extractedData.consignee_gstin;
          setSidebarOpen(true);
        }
        if (data.extractedData.buyer_address) {
          setBuyerAddress(data.extractedData.buyer_address);
          extractedBuyAddr = data.extractedData.buyer_address;
          setSidebarOpen(true);
        }
        if (data.extractedData.buyer_gstin) {
          setBuyerGstin(data.extractedData.buyer_gstin);
          extractedBuyGstin = data.extractedData.buyer_gstin;
          setSidebarOpen(true);
        }
        if (data.extractedData.consignee_phone) {
          setConsigneePhone(data.extractedData.consignee_phone);
          extractedConsPhone = data.extractedData.consignee_phone;
          setSidebarOpen(true);
        }
        if (data.extractedData.buyer_phone) {
          setBuyerPhone(data.extractedData.buyer_phone);
          extractedBuyPhone = data.extractedData.buyer_phone;
          setSidebarOpen(true);
        }
        const addedSummaries: string[] = [];
        const updatedMetadata: string[] = [];

        newItems.forEach((newItem: BillingItem) => {
          const oldItem = items.find((i: BillingItem) => i.item_name_en === newItem.item_name_en);
          const oldQty = oldItem ? oldItem.quantity : 0;
          const diffQty = newItem.quantity - oldQty;
          if (diffQty > 0) {
            addedSummaries.push(`➕ ${diffQty} x ${newItem.item_name_en} (${newItem.item_name_kn})`);
          }
        });

        items.forEach((oldItem: BillingItem) => {
          const newItem = newItems.find((i: BillingItem) => i.item_name_en === oldItem.item_name_en);
          if (!newItem) {
            addedSummaries.push(`➖ Removed ${oldItem.item_name_en} (${oldItem.item_name_kn})`);
          } else {
            const diffQty = newItem.quantity - oldItem.quantity;
            if (diffQty < 0) {
              addedSummaries.push(`➖ Decreased ${Math.abs(diffQty)} x ${oldItem.item_name_en} (${oldItem.item_name_kn})`);
            }
          }
        });

        if (data.extractedData.customer_name) {
          updatedMetadata.push(`👤 Customer Name: ${data.extractedData.customer_name}`);
        }
        if (data.extractedData.consignee_name && data.extractedData.consignee_name !== data.extractedData.customer_name) {
          updatedMetadata.push(`🏢 Consignee Name: ${data.extractedData.consignee_name}`);
        }
        if (data.extractedData.consignee_address || data.extractedData.buyer_address) {
          updatedMetadata.push(`📍 Address: ${data.extractedData.consignee_address || data.extractedData.buyer_address}`);
        }
        if (data.extractedData.destination) {
          updatedMetadata.push(`🚚 Destination: ${data.extractedData.destination}`);
        }
        if (data.extractedData.consignee_gstin || data.extractedData.buyer_gstin) {
          updatedMetadata.push(`💳 GSTIN: ${data.extractedData.consignee_gstin || data.extractedData.buyer_gstin}`);
        }
        if (data.extractedData.dispatched_through) {
          updatedMetadata.push(`📦 Dispatched Through: ${data.extractedData.dispatched_through}`);
        }
        if (data.extractedData.terms_of_delivery) {
          updatedMetadata.push(`📄 Terms of Delivery: ${data.extractedData.terms_of_delivery}`);
        }
        if (data.extractedData.invoice_date) {
          updatedMetadata.push(`📅 Invoice Date: ${data.extractedData.invoice_date}`);
        }
        if (data.extractedData.consignee_phone) {
          updatedMetadata.push(`📞 Consignee Phone: ${data.extractedData.consignee_phone}`);
        }
        if (data.extractedData.buyer_phone) {
          updatedMetadata.push(`📞 Buyer Phone: ${data.extractedData.buyer_phone}`);
        }

        let responseMsg = '';
        if (addedSummaries.length > 0) {
          responseMsg += 'Added to bill:\n' + addedSummaries.join('\n') + '\n';
        }
        if (updatedMetadata.length > 0) {
          responseMsg += (responseMsg ? '\n' : '') + 'Billing details updated:\n' + updatedMetadata.join('\n') + '\n';
        }
        if (!responseMsg) {
          responseMsg = '✅ Invoice updated successfully.';
        }
        const finalLogs: ChatMessage[] = [...updatedLog, { role: 'assistant', text: responseMsg }];
        setChatLog(finalLogs);

        saveSessionState(activeSessionId, activeSessionTitle, newItems, finalLogs, {
          custName: extractedCust,
          invDate: extractedDate,
          dest: extractedDest,
          disp: extractedDisp,
          terms: extractedTerms,
          consName: extractedConsName,
          consAddr: extractedConsAddr,
          consGstin: extractedConsGstin,
          buyAddr: extractedBuyAddr,
          buyGstin: extractedBuyGstin,
          consPhone: extractedConsPhone,
          buyPhone: extractedBuyPhone,
        });
        setStatusMessage('READY');
        triggerNotification('Items parsed and added to invoice');
      } else {
        throw new Error('Parsing failed.');
      }
    } catch (err: any) {
      console.error('Inference failure:', err);
      setChatLog((prev) => [...prev, { role: 'assistant', text: '⚠️ Parser error. Please try again.' }]);
      setStatusMessage('READY');
    }
  };
  handleSendMessageRef.current = handleSendMessage;

  const saveSessionState = async (
    sessionId: string,
    sessionTitle: string,
    activeItems: BillingItem[],
    activeChat: ChatMessage[],
    metaOverride?: {
      custName?: string;
      invDate?: string;
      dest?: string;
      disp?: string;
      terms?: string;
      consName?: string;
      consAddr?: string;
      consGstin?: string;
      buyAddr?: string;
      buyGstin?: string;
      consPhone?: string;
      buyPhone?: string;
    }
  ) => {
    try {
      await fetch(`/api/sessions/${sessionId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: activeItems,
          chatLog: activeChat.map((c) => ({ role: c.role, text: c.text })),
          title: sessionTitle,
          customerName: metaOverride?.custName !== undefined ? metaOverride.custName : customerName,
          invoiceDate: metaOverride?.invDate !== undefined ? metaOverride.invDate : invoiceDate,
          destination: metaOverride?.dest !== undefined ? metaOverride.dest : destination,
          dispatchedThrough: metaOverride?.disp !== undefined ? metaOverride.disp : dispatchedThrough,
          termsOfDelivery: metaOverride?.terms !== undefined ? metaOverride.terms : termsOfDelivery,
          consigneeName: metaOverride?.consName !== undefined ? metaOverride.consName : consigneeName,
          consigneeAddress: metaOverride?.consAddr !== undefined ? metaOverride.consAddr : consigneeAddress,
          consigneeGstin: metaOverride?.consGstin !== undefined ? metaOverride.consGstin : consigneeGstin,
          buyerAddress: metaOverride?.buyAddr !== undefined ? metaOverride.buyAddr : buyerAddress,
          buyerGstin: metaOverride?.buyGstin !== undefined ? metaOverride.buyGstin : buyerGstin,
          consigneePhone: metaOverride?.consPhone !== undefined ? metaOverride.consPhone : consigneePhone,
          buyerPhone: metaOverride?.buyPhone !== undefined ? metaOverride.buyPhone : buyerPhone,
        }),
      });
      loadSessions(false);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // ===== ITEM HANDLERS =====
  const handleUpdateItemCell = (index: number, field: keyof BillingItem, val: any) => {
    const updated = [...items];
    let parsedVal = val;
    if (field === 'quantity' || field === 'unit_price') {
      parsedVal = parseFloat(val) || 0;
    }
    updated[index] = { ...updated[index], [field]: parsedVal };
    setItems(updated);
    saveSessionState(activeSessionId, activeSessionTitle, updated, chatLog);
  };

  const handleAddRowManually = () => {
    const updated = [
      ...items,
      {
        item_name_en: 'New Product',
        item_name_kn: 'ಹೊಸ ವಸ್ತು',
        quantity: 1,
        unit: 'KG',
        unit_price: 10,
      },
    ];
    setItems(updated);
    saveSessionState(activeSessionId, activeSessionTitle, updated, chatLog);
    triggerNotification('Manual row added to invoice');
  };

  const handleRemoveRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    saveSessionState(activeSessionId, activeSessionTitle, updated, chatLog);
  };

  // Custom confirmation triggers this instead of native browser popup
  const handleFlushLedger = () => {
    setShowClearConfirm(true);
  };

  const confirmFlushLedger = () => {
    setItems([]);
    const newLog: ChatMessage[] = [...chatLog, { role: 'assistant', text: '🗑️ Invoice cleared.' }];
    setChatLog(newLog);
    saveSessionState(activeSessionId, activeSessionTitle, [], newLog);
    triggerNotification('Invoice items cleared');
    setShowClearConfirm(false);
  };

  const handleSaveSession = async () => {
    if (items.length === 0) {
      triggerNotification('Add items before saving the bill');
      return;
    }
    setStatusMessage('LOADING');
    try {
      await saveSessionState(
        activeSessionId,
        activeSessionTitle,
        items,
        chatLog
      );
      triggerNotification('Invoice saved successfully');
      await createNewSession();
    } catch (err) {
      console.error('Failed to save session:', err);
      triggerNotification('Failed to save invoice');
      setStatusMessage('READY');
    }
  };

  const handleEmitPDF = async () => {
    if (items.length === 0) {
      triggerNotification('Add items before generating PDF');
      return;
    }
    setStatusMessage('PDF_GEN');
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items, 
          sessionTitle: activeSessionTitle,
          customerName,
          invoiceDate,
          destination,
          dispatchedThrough,
          termsOfDelivery,
          consigneeName,
          consigneeAddress,
          consigneeGstin,
          buyerAddress,
          buyerGstin,
          consigneePhone,
          buyerPhone
        }),
      });
      if (!response.ok) throw new Error('PDF render error.');

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.setAttribute('download', `${activeSessionTitle.replace(/\s+/g, '_')}_Invoice.pdf`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      setStatusMessage('READY');
      triggerNotification('Dual-page bilingual PDF downloaded');
    } catch (err) {
      console.warn('PDF failed:', err);
      triggerNotification('PDF generation failed');
      setStatusMessage('READY');
    }
  };

  const handlePreviewPDF = async () => {
    if (items.length === 0) {
      triggerNotification('Add items before previewing PDF');
      return;
    }
    setStatusMessage('PDF_GEN');
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items, 
          sessionTitle: activeSessionTitle,
          customerName,
          invoiceDate,
          destination,
          dispatchedThrough,
          termsOfDelivery,
          consigneeName,
          consigneeAddress,
          consigneeGstin,
          buyerAddress,
          buyerGstin,
          consigneePhone,
          buyerPhone
        }),
      });
      if (!response.ok) throw new Error('PDF render error.');

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(fileUrl);
      setIsPreviewOpen(true);
      setStatusMessage('READY');
      triggerNotification('Invoice preview loaded');
    } catch (err) {
      console.warn('PDF failed:', err);
      triggerNotification('PDF preview failed');
      setStatusMessage('READY');
    }
  };

  const downloadPreviewPDF = () => {
    if (!previewPdfUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = previewPdfUrl;
    downloadLink.setAttribute('download', `${activeSessionTitle.replace(/\s+/g, '_')}_Invoice.pdf`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    triggerNotification('PDF downloaded');
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

  const handleToggleMic = (overrideLang?: 'kn-IN' | 'en-IN') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerNotification('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    // Stop any existing instance just in case
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = overrideLang || listenerLanguage;

      rec.onstart = () => {
        setIsRecording(true);
        setStatusMessage('LISTENING');
        voiceAccumulatedRef.current = '';
      };
      rec.onerror = (e: any) => {
        console.warn('ASR Error:', e);
        setIsRecording(false);
        setStatusMessage('SPEECH_ERROR');
        let msg = 'Microphone error. Check browser permissions.';
        if (e.error === 'network') {
          msg = "ASR network error. (Note: If using Brave, enable 'Google services for speech recognition' in brave://settings/privacy)";
        } else if (e.error === 'not-allowed') {
          msg = "Microphone access denied. Please allow microphone permissions in the browser address bar.";
        }
        triggerNotification(msg);
      };
      rec.onend = () => {
        setIsRecording(false);
        setStatusMessage(prev => prev === 'SPEECH_ERROR' ? 'SPEECH_ERROR' : 'READY');
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        const textToSend = voiceAccumulatedRef.current.trim();
        if (textToSend) {
          handleSendMessageRef.current?.(textToSend);
          voiceAccumulatedRef.current = '';
        }
      };
      rec.onresult = (e: any) => {
        let interimTranscript = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          } else {
            interimTranscript += e.results[i][0].transcript;
          }
        }
        if (final) {
          voiceAccumulatedRef.current = (voiceAccumulatedRef.current + ' ' + final).trim();
          setTextInput(voiceAccumulatedRef.current);
        } else if (interimTranscript) {
          setTextInput((voiceAccumulatedRef.current + ' ' + interimTranscript).trim());
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          rec.stop();
        }, 3000); // 3 seconds of silence before auto-submitting
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.warn('ASR Init or Start Error:', err);
      setStatusMessage('SPEECH_ERROR');
      triggerNotification('Failed to start speech recognition: ' + err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage(textInput);
  };

  const calculateGrandTotal = (): number => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const getSortedSessions = useCallback(() => {
    return [...sessions].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'num-desc':
          return b.session_title.localeCompare(a.session_title, undefined, { numeric: true, sensitivity: 'base' });
        case 'num-asc':
          return a.session_title.localeCompare(b.session_title, undefined, { numeric: true, sensitivity: 'base' });
        case 'total-desc':
          return (b.grand_total || 0) - (a.grand_total || 0);
        case 'total-asc':
          return (a.grand_total || 0) - (b.grand_total || 0);
        case 'name-asc':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'name-desc':
          return (b.customer_name || '').localeCompare(a.customer_name || '');
        default:
          return 0;
      }
    });
  }, [sessions, sortBy]);

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(n);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ===== THEME TOGGLE =====
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('voicebill-theme', next);
  };

  // ===== ADD FROM MENU =====
  const handleAddFromMenu = (menuItem: MenuItem) => {
    const existingIndex = items.findIndex((i) => i.item_name_en === menuItem.name_en);
    let updated: BillingItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1,
      };
    } else {
      updated = [
        ...items,
        {
          item_name_en: menuItem.name_en,
          item_name_kn: menuItem.name_kn,
          quantity: 1,
          unit: menuItem.unit,
          unit_price: menuItem.price,
        },
      ];
    }
    setItems(updated);
    saveSessionState(activeSessionId, activeSessionTitle, updated, chatLog);
    triggerNotification(`Added ${menuItem.name_en} to invoice`);
  };

  const activeMenuCategory = RESTAURANT_MENU.find((c) => c.id === menuCategory) || RESTAURANT_MENU[0];
  const currentStatus = statusConfig[statusMessage] || statusConfig.IDLE;

  // ===== RENDER =====
  return (
    <div className="h-screen w-screen flex overflow-hidden" data-theme={theme} style={{ background: 'var(--bg-primary)' }}>

      {/* ===== TOAST ===== */}
      {toastMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in-up"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-hover)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 20px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <Check size={14} style={{ color: 'var(--success)' }} />
          {toastMessage}
        </div>
      )}

      {/* ===== LOADING OVERLAY ===== */}
      {isLoading && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="animate-spin-slow" style={{ color: 'var(--accent-primary)' }}>
              <Layers size={20} />
            </div>
            <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Synchronizing…
            </span>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SIDEBAR — Sessions Panel                                        */}
      {/* ================================================================ */}
      {sidebarOpen && (
        <aside
          className="animate-slide-left"
          style={{
            width: `${sidebarWidth}px`,
            minWidth: `${sidebarWidth}px`,
            height: '100%',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              padding: '20px 18px 16px',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <Zap size={16} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  VoiceBill
                </div>
                <div className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  BILINGUAL POS
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Billing Info Form (formerly in right panel) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Consignee Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px', marginBottom: '4px' }}>
                CONSIGNEE DETAILS (BILL TO)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Name</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. ಶ್ರೀ ದುರ್ಗಾಪರಮೇಶ್ವರಿ ದೇವಸ್ಥಾನ ಕಟೀಲು"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Address</label>
                <textarea
                  className="input-ghost"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. ಕಟೀಲು ಅಂಚೆ, ಮುಲ್ಕಿ ತಾಲೂಕು..."
                  rows={2}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>GSTIN</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={consigneeGstin}
                  onChange={(e) => setConsigneeGstin(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. 29ಡಿಎಎಫ್‌ಪಿಡಿ7054ಸಿ2ಜೆಡ್‌ಡಿ"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={consigneePhone}
                  onChange={(e) => setConsigneePhone(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. 9876543210"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Buyer Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px', marginBottom: '4px' }}>
                BUYER DETAILS (IF DIFFERENT)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer/Customer Name</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. bharath"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer Address</label>
                <textarea
                  className="input-ghost"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="Buyer's billing/delivery address"
                  rows={2}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer GSTIN</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. 29DAFPD7054C2ZD"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Buyer Phone</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. 9876543210"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Shipping & Reference Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.05em', borderBottom: '1px solid var(--border-primary)', paddingBottom: '4px', marginBottom: '4px' }}>
                SHIPPING & REFERENCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Dated Ref</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. 1 June 2026"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Destination</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. Kateel, Mulki"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Dispatched Through</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={dispatchedThrough}
                  onChange={(e) => setDispatchedThrough(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. Road / Truck"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Terms of Delivery</label>
                <input
                  type="text"
                  className="input-ghost"
                  value={termsOfDelivery}
                  onChange={(e) => setTermsOfDelivery(e.target.value)}
                  onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                  placeholder="e.g. Immediate Delivery"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </aside>
      )}
      {sidebarOpen && (
        <div
          onMouseDown={startSidebarResize}
          style={{
            width: '4px',
            cursor: 'col-resize',
            background: 'transparent',
            zIndex: 10,
            transition: 'background 0.2s',
            alignSelf: 'stretch',
            borderRight: '1px solid var(--border-primary)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        />
      )}

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA                                                */}
      {/* ================================================================ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

        {/* ===== TOP BAR ===== */}
        <header
          style={{
            height: '56px',
            minHeight: '56px',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: 'var(--bg-secondary)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {!sidebarOpen && (
              <button
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
                onClick={() => setSidebarOpen(true)}
                title="Open sidebar"
              >
                <ChevronRight size={16} />
              </button>
            )}

            {/* Editable Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                value={activeSessionTitle}
                onChange={(e) => setActiveSessionTitle(e.target.value)}
                onBlur={() => saveSessionState(activeSessionId, activeSessionTitle, items, chatLog)}
                className="font-mono"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  maxWidth: '260px',
                }}
                title="Click to rename"
              />
              <div className="font-mono" style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                background: 'var(--bg-elevated)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Hash size={9} />
                {activeSessionId.slice(-6)}
              </div>
            </div>
          </div>

          {/* Right side: Status + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
            }}>
              <span className={`status-dot ${currentStatus.dotClass}`} />
              <span className="font-mono" style={{ fontSize: '10px', color: currentStatus.color, fontWeight: 600, letterSpacing: '0.04em' }}>
                {currentStatus.label}
              </span>
            </div>

            {/* Customer Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
            }}>
              <User size={12} style={{ color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  width: '120px',
                }}
              />
            </div>

            {/* Theme Toggle */}
            <button
              className="btn btn-ghost"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span className="font-mono" style={{ fontSize: '10px' }}>
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Notification History Bell Icon */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowNotificationsHistory(!showNotificationsHistory);
                  markNotificationsAsRead();
                }}
                title="Notifications History"
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: showNotificationsHistory ? 'var(--accent-muted)' : undefined,
                  color: showNotificationsHistory ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Bell size={15} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 700,
                      borderRadius: '50%',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Slide-down dropdown for Notification logs */}
              {showNotificationsHistory && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '0',
                    width: '320px',
                    maxHeight: '360px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span className="font-mono text-dim" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>System Events</span>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '9px', padding: '2px 6px', height: 'auto', minHeight: '0' }}
                      onClick={() => {
                        setNotifications([]);
                        setShowNotificationsHistory(false);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                        No events logged
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent-primary)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{n.text}</span>
                          <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', alignSelf: 'flex-end' }}>{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Today's Date */}
            <div className="font-mono" style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <Clock size={11} />
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* ===== BODY: Split between Invoice Table + Chat ===== */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ============================================================ */}
          {/* LEFT PANEL: Invoice Table                                     */}
          {/* ============================================================ */}
          <section
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRight: '1px solid var(--border-primary)',
            }}
          >
            {/* Action Bar */}
            <div
              style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={14} style={{ color: 'var(--text-dim)' }} />
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Invoice Items
                </span>
                {items.length > 0 && (
                  <span style={{
                    background: 'var(--accent-muted)',
                    color: 'var(--accent-primary)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}>
                    {items.length}
                  </span>
                )}
              </div>
              
              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-primary" onClick={handleVoiceModalOpen} style={{ background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)', color: 'white', border: 'none' }} title="Bilingual voice assistant modal">
                  <Mic size={13} />
                  Voice Bill
                </button>
                <button className="btn btn-ghost" onClick={() => setShowMenu(true)} title="Add item from restaurant catalog">
                  <UtensilsCrossed size={13} />
                  Add from Menu
                </button>
                <button className="btn btn-danger" onClick={handleFlushLedger} title="Clear all items from list" style={{ padding: '8px 10px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>



            {/* Table Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              {items.length === 0 ? (
                <div
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '12px',
                    padding: '40px',
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Package size={24} style={{ color: 'var(--text-dim)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
                      No items yet
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '280px' }}>
                      Use the voice command dialog or click "Add from Menu" to add billing items
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-primary" onClick={handleVoiceModalOpen}>
                      <Mic size={13} />
                      Voice Input
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowMenu(true)}>
                      <UtensilsCrossed size={13} />
                      Browse Menu
                    </button>
                  </div>
                </div>
              ) : (
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                      <th>Item (EN)</th>
                      <th>ವಸ್ತು (KN)</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Qty</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>Unit</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Total</th>
                      <th style={{ width: '45px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="animate-fade-in-up">
                        {/* SL No */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </td>

                        {/* English Name */}
                        <td>
                          {editingCell?.index === index && editingCell?.field === 'item_name_en' ? (
                            <input
                              className="input-ghost"
                              autoFocus
                              value={item.item_name_en}
                              onChange={(e) => handleUpdateItemCell(index, 'item_name_en', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                            />
                          ) : (
                            <span
                              onClick={() => setEditingCell({ index, field: 'item_name_en' })}
                              style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary)' }}
                            >
                              {item.item_name_en}
                            </span>
                          )}
                        </td>

                        {/* Kannada Name */}
                        <td>
                          {editingCell?.index === index && editingCell?.field === 'item_name_kn' ? (
                            <input
                              className="input-ghost font-kannada"
                              autoFocus
                              value={item.item_name_kn}
                              onChange={(e) => handleUpdateItemCell(index, 'item_name_kn', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                            />
                          ) : (
                            <span
                              className="font-kannada"
                              onClick={() => setEditingCell({ index, field: 'item_name_kn' })}
                              style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}
                            >
                              {item.item_name_kn}
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td style={{ textAlign: 'right' }}>
                          {editingCell?.index === index && editingCell?.field === 'quantity' ? (
                            <input
                              className="input-ghost font-mono"
                              type="number"
                              autoFocus
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemCell(index, 'quantity', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              style={{ textAlign: 'right', width: '70px' }}
                            />
                          ) : (
                            <span
                              className="font-mono"
                              onClick={() => setEditingCell({ index, field: 'quantity' })}
                              style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </td>

                        {/* Unit */}
                        <td style={{ textAlign: 'center' }}>
                          {editingCell?.index === index && editingCell?.field === 'unit' ? (
                            <input
                              className="input-ghost font-mono"
                              autoFocus
                              value={item.unit}
                              onChange={(e) => handleUpdateItemCell(index, 'unit', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              style={{ textAlign: 'center', width: '60px' }}
                            />
                          ) : (
                            <span
                              className="font-mono"
                              onClick={() => setEditingCell({ index, field: 'unit' })}
                              style={{
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '11px',
                                background: 'var(--bg-elevated)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Unit Price */}
                        <td style={{ textAlign: 'right' }}>
                          {editingCell?.index === index && editingCell?.field === 'unit_price' ? (
                            <input
                              className="input-ghost font-mono"
                              type="number"
                              autoFocus
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItemCell(index, 'unit_price', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              style={{ textAlign: 'right', width: '80px' }}
                            />
                          ) : (
                            <span
                              className="font-mono"
                              onClick={() => setEditingCell({ index, field: 'unit_price' })}
                              style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                              {formatCurrency(item.unit_price)}
                            </span>
                          )}
                        </td>

                        {/* Total */}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(item.quantity * item.unit_price)}
                          </span>
                        </td>

                        {/* Delete */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveRow(index)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-dim)',
                              padding: '4px',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                              (e.currentTarget as HTMLElement).style.background = 'var(--danger-muted)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)';
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ===== TOTALS BAR ===== */}
            <div className="totals-bar" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handlePreviewPDF} style={{ background: 'linear-gradient(135deg, var(--accent-primary), #a855f7)', color: 'white', border: 'none' }} title="Preview PDF Invoice in modal">
                  <Eye size={13} />
                  Preview Bill
                </button>
                <button className="btn btn-success" onClick={handleSaveSession}>
                  <Save size={13} />
                  Save
                </button>
                <button className="btn btn-ghost" onClick={handleFlushLedger}>
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Grand Total
                </span>
                <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {formatCurrency(calculateGrandTotal())}
                </span>
              </div>
            </div>
          </section>

          <div
            onMouseDown={startChatResize}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: 'transparent',
              zIndex: 10,
              transition: 'background 0.2s',
              alignSelf: 'stretch',
              borderLeft: '1px solid var(--border-primary)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          />

          <section
            style={{
              width: `${chatWidth}px`,
              minWidth: `${chatWidth}px`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
            }}
          >
            {/* Consolidated Header with Tab Switcher */}
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                height: '48px',
                minHeight: '48px',
              }}
            >
              {/* Segmented Switcher Control */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-primary)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-primary)',
                  flex: 1,
                }}
              >
                <button
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terminalView === 'chat' ? 'var(--bg-elevated)' : 'transparent',
                    color: terminalView === 'chat' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setTerminalView('chat')}
                >
                  <MessageSquare size={12} style={{ color: terminalView === 'chat' ? 'var(--accent-primary)' : 'var(--text-dim)' }} />
                  <span>AI Terminal</span>
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: terminalView === 'sessions' ? 'var(--bg-elevated)' : 'transparent',
                    color: terminalView === 'sessions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setTerminalView('sessions')}
                >
                  <Layers size={12} style={{ color: terminalView === 'sessions' ? 'var(--accent-primary)' : 'var(--text-dim)' }} />
                  <span>Recent Sessions</span>
                </button>
              </div>

              {/* Status/Language Indicator on Right */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  height: '28px',
                }}
              >
                <Sparkles size={11} style={{ color: 'var(--accent-primary)' }} />
                <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  AUTO (EN/KN)
                </span>
              </div>
            </div>

            {terminalView === 'sessions' ? (
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--bg-primary)',
                }}
              >
                {/* New Session Button */}
                <div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={createNewSession}>
                    <Plus size={14} />
                    New Invoice
                  </button>
                </div>

                {/* Session List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 6px 10px',
                    borderBottom: '1px solid var(--border-primary)',
                    marginBottom: '10px',
                  }}>
                    <span className="font-mono" style={{
                      fontSize: '9px',
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                    }}>
                      Recent Sessions
                    </span>
                    
                    {/* Sort Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowUpDown size={11} style={{ color: 'var(--text-dim)' }} />
                      <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-secondary)',
                          fontSize: '10px',
                          padding: '2px 4px',
                          borderRadius: 'var(--radius-sm)',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: 600,
                        }}
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="num-desc">Invoice No (Desc)</option>
                        <option value="num-asc">Invoice No (Asc)</option>
                        <option value="total-desc">Amount (High-Low)</option>
                        <option value="total-asc">Amount (Low-High)</option>
                        <option value="name-asc">Customer (A-Z)</option>
                        <option value="name-desc">Customer (Z-A)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {sessions.length === 0 ? (
                      <div style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: '12px',
                      }}>
                        No sessions yet
                      </div>
                    ) : (
                      getSortedSessions().map((session) => (
                        <div
                          key={session.id}
                          className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                          onClick={() => loadSessionDetail(session.id)}
                          style={{
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-primary)',
                            background: session.id === activeSessionId ? 'var(--accent-muted)' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            marginBottom: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              <FileText size={13} style={{ color: session.id === activeSessionId ? 'var(--accent-primary)' : 'var(--text-dim)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: '13px',
                                fontWeight: session.id === activeSessionId ? 600 : 400,
                                color: session.id === activeSessionId ? 'var(--text-primary)' : 'var(--text-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {session.session_title}
                              </span>
                            </div>
                            {session.grand_total !== undefined && session.grand_total > 0 && (
                              <span className="font-mono" style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: session.id === activeSessionId ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                flexShrink: 0,
                              }}>
                                {formatCurrency(session.grand_total)}
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingLeft: '21px',
                            marginTop: '4px',
                          }}>
                            <div className="font-mono" style={{
                              fontSize: '9px',
                              color: 'var(--text-dim)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}>
                              <Clock size={9} />
                              {formatDate(session.created_at)} · {formatTime(session.created_at)}
                            </div>
                            {session.customer_name && (
                              <span style={{
                                fontSize: '9px',
                                color: 'var(--text-dim)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100px',
                                fontWeight: 500,
                              }}>
                                {session.customer_name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {chatLog.length === 0 ? (
                    <div
                      className="animate-fade-in"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '16px',
                        padding: '20px',
                      }}
                    >
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--accent-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Volume2 size={22} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px' }}>
                          Voice Command Ready
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '240px' }}>
                          Press the microphone button or type a command to get started.
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatLog.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '8px',
                          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                          maxWidth: '90%',
                        }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                            border: msg.role === 'assistant' ? '1px solid var(--border-primary)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {msg.role === 'user' ? (
                              <User size={11} color="white" />
                            ) : (
                              <Bot size={11} style={{ color: 'var(--accent-primary)' }} />
                            )}
                          </div>
                          <div className={`chat-bubble ${msg.role}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Recording Visualizer */}
                {isRecording && (
                  <div
                    className="animate-fade-in"
                    style={{
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'var(--danger-muted)',
                      borderTop: '1px solid rgba(239,68,68,0.15)',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`animate-soundwave-${i}`}
                        style={{
                          width: '3px',
                          borderRadius: '2px',
                          background: 'var(--danger)',
                        }}
                      />
                    ))}
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--danger)', marginLeft: '10px', fontWeight: 600 }}>
                      Listening…
                    </span>
                  </div>
                )}

                {/* Chat Input */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderTop: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {/* Mic Button */}
                  <button
                    onClick={() => handleToggleMic()}
                    className={isRecording ? 'animate-pulse-glow' : ''}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      background: isRecording
                        ? 'var(--danger)'
                        : 'linear-gradient(135deg, var(--accent-primary), #a855f7)',
                      boxShadow: isRecording ? '0 0 16px rgba(239,68,68,0.4)' : 'var(--shadow-glow)',
                    }}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isRecording ? <MicOff size={16} color="white" /> : <Mic size={16} color="white" />}
                  </button>

                  {/* Language Selector Button */}
                  <button
                    onClick={() => {
                      const nextLang = listenerLanguage === 'en-IN' ? 'kn-IN' : 'en-IN';
                      setListenerLanguage(nextLang);
                      if (isRecording) {
                        if (recognitionRef.current) {
                          recognitionRef.current.stop();
                        }
                        setTimeout(() => {
                          handleToggleMic(nextLang);
                        }, 400);
                      }
                    }}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-primary)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                    title={`Switch to ${listenerLanguage === 'en-IN' ? 'Kannada' : 'English'}`}
                  >
                    <span>{listenerLanguage === 'en-IN' ? 'EN' : 'KN'}</span>
                  </button>

                  {/* Text Input */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0 4px 0 14px',
                    transition: 'border-color 0.2s',
                  }}>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={listenerLanguage === 'en-IN' ? 'Type a command...' : 'ಆದೇಶ ಟೈಪ್ ಮಾಡಿ...'}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        padding: '10px 0',
                      }}
                    />
                    <button
                      onClick={() => handleSendMessage(textInput)}
                      disabled={!textInput.trim()}
                      style={{
                        background: textInput.trim() ? 'var(--accent-primary)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px',
                        cursor: textInput.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        color: textInput.trim() ? 'white' : 'var(--text-dim)',
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL: Custom Confirmation Modal                             */}
      {/* ============================================================ */}
      <CustomConfirmModal
        isOpen={showClearConfirm}
        title="Clear Invoice"
        message="Are you sure you want to clear all items from this invoice? This action cannot be undone."
        onConfirm={confirmFlushLedger}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* ============================================================ */}
      {/* MODAL: Restaurant Menu Catalog Popup Modal                   */}
      {/* ============================================================ */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              width: '640px',
              height: '80%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: 'var(--text-primary)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UtensilsCrossed size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Food Catalog Menu</span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '50%' }}
                onClick={() => setShowMenu(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Category tabs */}
            <div
              style={{
                padding: '10px 20px',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              {RESTAURANT_MENU.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMenuCategory(cat.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: menuCategory === cat.id ? 'var(--border-accent)' : 'var(--border-primary)',
                    background: menuCategory === cat.id ? 'var(--accent-muted)' : 'transparent',
                    color: menuCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Items Grid List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {activeMenuCategory.items.map((menuItem, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddFromMenu(menuItem)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-primary)',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--accent-muted)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-primary)';
                    }}
                  >
                    <span style={{ fontSize: '24px', flexShrink: 0 }}>{menuItem.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {menuItem.name_en}
                      </div>
                      <div className="font-kannada" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {menuItem.name_kn}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ₹{menuItem.price}
                      </div>
                      <div className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {menuItem.unit}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                Tapping items adds them to the active invoice list
              </span>
              <button
                className="btn btn-primary"
                style={{ padding: '6px 14px' }}
                onClick={() => setShowMenu(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Voice-to-Text Billing Ingestion Assistant             */}
      {/* ============================================================ */}
      {isVoiceModalOpen && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="animate-fade-in-up animate-pulse-glow"
            style={{
              width: '500px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={18} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '15px' }}>
                  {listenerLanguage === 'en-IN' ? 'Voice Billing Assistant' : 'ಧ್ವನಿ ಬಿಲ್ಲಿಂಗ್ ಸಹಾಯಕ'}
                </span>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px', borderRadius: '50%' }}
                onClick={handleVoiceModalClose}
              >
                <X size={16} />
              </button>
            </div>



            {/* Animated Waveform Section */}
            <div
              style={{
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-primary)',
                gap: '4px',
              }}
            >
              {isVoiceRecording ? (
                <>
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((_, idx) => (
                    <div
                      key={idx}
                      className={`animate-soundwave-${(idx % 5) + 1}`}
                      style={{
                        width: '4px',
                        background: 'var(--danger)',
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                  <span className="font-mono" style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
                    Listening... Speak now
                  </span>
                </>
              ) : (
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Mic inactive. Tap the red button to record.
                </span>
              )}
            </div>

            {/* Editable transcription text-area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="font-mono text-dim" style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600 }}>
                Bilingual Transcript Text Area
              </span>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={4}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  placeholder={listenerLanguage === 'en-IN' 
                    ? "Speak standard sentences like 'Add two basmati rice and one fresh standardized milk'..." 
                    : "ಧ್ವನಿ ನೀಡಲು ಮೈಕ್ ಆನ್ ಮಾಡಿ ಮತ್ತು ಮಾತನಾಡಿ, ಉದಾಹರಣೆಗೆ: 'ಎರಡು ಅಕ್ಕಿ ಮತ್ತು ಒಂದು ಹಾಲು ಸೇರಿಸಿ'..."
                  }
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: listenerLanguage === 'kn-IN' ? "'Noto Sans Kannada', sans-serif" : 'inherit',
                  }}
                />
                {voiceInterim && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      pointerEvents: 'none',
                    }}
                  >
                    {voiceInterim}...
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mic Toggle Button */}
                <button
                  onClick={isVoiceRecording ? stopVoiceRecording : () => startVoiceRecording()}
                  className={isVoiceRecording ? 'animate-pulse-glow' : ''}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    background: isVoiceRecording ? 'var(--danger)' : 'var(--accent-primary)',
                    boxShadow: isVoiceRecording ? '0 0 14px rgba(239,68,68,0.4)' : 'var(--shadow-glow)',
                  }}
                  title={isVoiceRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isVoiceRecording ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
                </button>

                {/* Language Selector Button */}
                <button
                  onClick={() => {
                    const nextLang = listenerLanguage === 'en-IN' ? 'kn-IN' : 'en-IN';
                    setListenerLanguage(nextLang);
                    if (isVoiceRecording) {
                      if (localRecRef.current) {
                        localRecRef.current.stop();
                      }
                      setTimeout(() => {
                        startVoiceRecording(nextLang);
                      }, 400);
                    }
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                  title={`Switch to ${listenerLanguage === 'en-IN' ? 'Kannada' : 'English'}`}
                >
                  <span>{listenerLanguage === 'en-IN' ? 'EN' : 'KN'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost" onClick={handleVoiceModalClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCommitVoiceInput}
                  disabled={!voiceTranscript.trim()}
                  style={{ padding: '8px 20px' }}
                >
                  Generate Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PDF Preview Modal                                     */}
      {/* ============================================================ */}
      {isPreviewOpen && previewPdfUrl && (
        <div
          className="fixed inset-0 z-[9995] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              width: '90%',
              maxWidth: '960px',
              height: '90%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: 'var(--text-primary)',
            }}
          >
            {/* Toolbar Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                  Invoice Preview — {activeSessionTitle}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-success"
                  onClick={downloadPreviewPDF}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  <Download size={12} />
                  Download PDF
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={closePreview}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  <X size={12} />
                  Close
                </button>
              </div>
            </div>
            {/* PDF iframe Body */}
            <div style={{ flex: 1, background: '#f8fafc', position: 'relative' }}>
              <iframe
                src={previewPdfUrl}
                title="PDF Invoice Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== CUSTOM REUSE CONFIRMATION DIALOG ===== */
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function CustomConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '380px',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>{title}</div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
