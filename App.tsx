
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Message, User, Game, Order } from './types';
import { firebaseService } from './services/firebaseService';
import { getAIResponse, verifyScreenshotAI } from './services/geminiService';
import { PAYMENT_METHODS } from './constants';

// --- UI Components ---

const AuthInput = memo(({ type, value, onChange, onNext, placeholder, isLoading, label }: any) => (
  <div className="mt-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-xl animate-in zoom-in-95 duration-300">
    <div className="mb-3 flex items-center gap-2">
       <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label || placeholder}</span>
    </div>
    <input 
      type={type === 'password' ? 'password' : 'text'}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all mb-4"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onNext()}
      autoFocus
    />
    <button onClick={onNext} disabled={isLoading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">
      {isLoading ? 'Verifying...' : 'Next Step ➔'}
    </button>
  </div>
));

const GameInputCard = memo(({ uid, ign, setUid, setIgn, onNext }: any) => (
  <div className="mt-3 bg-white p-6 rounded-3xl border border-indigo-50 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg text-lg">🎮</div>
      <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Game Account</h3>
    </div>
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Player UID</label>
        <input 
          placeholder="Game ID"
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          value={uid} onChange={(e) => setUid(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Character Name (IGN)</label>
        <input 
          placeholder="Game Name"
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          value={ign} onChange={(e) => setIgn(e.target.value)}
        />
      </div>
      <button onClick={onNext} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-2">
        Show QR Code ➔
      </button>
    </div>
  </div>
));

const PaymentSection = memo(({ onSelect, onUpload, selectedMethod, amount }: any) => {
  const methodData = selectedMethod ? Object.values(PAYMENT_METHODS).find(m => m.name.includes(selectedMethod)) : null;

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {!selectedMethod ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.values(PAYMENT_METHODS).map(m => (
            <button key={m.name} onClick={() => onSelect(m.name)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 shadow-sm group-hover:scale-105 transition-transform border border-slate-50">
                <img src={m.icon} alt={m.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=ICON')} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-2xl text-center animate-in zoom-in-95 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: methodData?.color }}></div>
          <div className="mb-6 pt-2">
             <div className="flex justify-center mb-4">
               <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                  PAYMENT: Rs. {amount}
               </span>
             </div>
             <div className="flex items-center justify-center gap-3 mb-4">
                <img src={methodData?.icon} className="w-10 h-10 object-contain rounded-lg" alt="icon" />
                <h4 className="text-slate-900 font-black text-2xl tracking-tight leading-none">{methodData?.name}</h4>
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Merchant: {methodData?.merchantName}</p>
             <p className="text-base text-indigo-600 font-black mt-1 tracking-wider">{methodData?.id}</p>
          </div>
          <div className="relative inline-block mb-6 group">
            <div className="relative bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
              <img 
                src={methodData?.qr} 
                className="w-52 h-52 object-contain" 
                alt="Payment QR" 
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=QR+CODE+MISSING')}
              />
            </div>
          </div>
          <label className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 transition-all">
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Send Payment Screenshot
          </label>
          <button onClick={() => onSelect(null)} className="mt-5 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500 transition-colors">Change Method</button>
        </div>
      )}
    </div>
  );
});

// --- Main App ---

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Record<string, Game>>({});
  const [showProfile, setShowProfile] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  const [flowState, setFlowState] = useState({
    uid: '', ign: '', selectedMethod: null as string | null, amount: 0, 
    gameName: '', packageName: ''
  });
  const [auth, setAuth] = useState({ email: '', password: '', name: '' });
  const [tempUser, setTempUser] = useState<User | null>(null);

  const stats = useMemo(() => {
    const orders = orderHistory;
    const count = orders.length;
    const spent = orders.reduce((sum, o) => sum + (o.price || 0), 0);
    return { count, spent };
  }, [orderHistory]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const fbGames = await firebaseService.getGames();
        setGames(fbGames);
        
        const savedUid = localStorage.getItem('mero_topup_uid');
        if (savedUid) {
          const user = await firebaseService.getUserById(savedUid);
          if (user) {
            setCurrentUser(user);
            refreshOrders(user.userId);
            addMessage('assistant', `नमस्ते ${user.username}! 🙏 तपाईंको ड्यासबोर्ड र अर्डर हिस्ट्री लोड भयो। आज के सेवा गरौँ? 🎮`);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) { console.error(err); }
      addMessage('assistant', `नमस्ते! 🙏 म MeroTopup AI सेल्सम्यान हुँ। आज तपाईंलाई म कुन गेम टप-अप गर्न मद्दत गरौँ?`);
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshOrders = async (uid: string) => {
    try {
      const orders = await firebaseService.getUserOrders(uid);
      setOrderHistory(orders);
    } catch (e) { console.error(e); }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, image?: string, interactiveType?: any) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role, content, timestamp: new Date(), image, interactiveType }]);
  };

  // Added handleProfileClick function to fix the "Cannot find name 'handleProfileClick'" errors
  const handleProfileClick = () => {
    if (!currentUser) {
      addMessage('assistant', "आफ्नो प्रोफाइल र अर्डर हिस्ट्री हेर्न कृपया पहिले लग-इन गर्नुहोस्।", undefined, 'AUTH_EMAIL');
    } else {
      setShowProfile(true);
    }
  };

  const handleAuth = async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    const lastMsgType = lastMsg.interactiveType;

    if (lastMsgType === 'AUTH_EMAIL') {
      if (!auth.email.trim() || !auth.email.includes('@')) return;
      setIsLoading(true);
      addMessage('user', auth.email);
      const user = await firebaseService.getUserByEmail(auth.email.trim());
      setIsLoading(false);
      if (user) {
        setTempUser(user);
        addMessage('assistant', `तपाईंको पासवर्ड राख्नुहोस्:`, undefined, 'AUTH_PASSWORD');
      } else {
        setTempUser(null);
        addMessage('assistant', `नयाँ अकाउन्ट बनाउन आफ्नो पूरा नाम राख्नुहोस्:`, undefined, 'REGISTER_NAME');
      }
    } else if (lastMsgType === 'REGISTER_NAME') {
      if (!auth.name.trim()) return;
      addMessage('user', auth.name);
      addMessage('assistant', `एउटा सुरक्षित पासवर्ड बनाउनुहोस्:`, undefined, 'AUTH_PASSWORD');
    } else {
      if (!auth.password.trim()) return;
      setIsLoading(true);
      addMessage('user', '********');
      try {
        let user;
        if (tempUser) {
          if (tempUser.password === auth.password) {
            user = tempUser;
          } else {
            addMessage('assistant', "गलत पासवर्ड! फेरि प्रयास गर्नुहोस्।", undefined, 'AUTH_PASSWORD');
            setIsLoading(false);
            return;
          }
        } else {
          user = await firebaseService.createUser({ 
            email: auth.email.trim(), 
            username: auth.name.trim(), 
            password: auth.password.trim() 
          });
        }
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('mero_topup_uid', user.userId);
          refreshOrders(user.userId);
          addMessage('assistant', `स्वागत छ ${user.username}! अब अगाडि बढौं। 🎮`);
        }
      } catch(e) { addMessage('assistant', "सिस्टममा समस्या आयो। सपोर्ट टिमलाई ९७६४६३०६३४ मा सम्पर्क गर्नुहोस्।"); }
      setIsLoading(false);
    }
  };

  const handleSend = async (customMsg?: string) => {
    const msg = customMsg || inputText;
    if (!msg.trim()) return;
    if (!customMsg) setInputText('');
    if (!customMsg) addMessage('user', msg);
    setIsLoading(true);
    scrollToBottom();
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const aiReply = await getAIResponse(history, msg, { availableGames: games, userName: currentUser?.username });
      const needsLogin = aiReply.includes("[ACTION: REQUIRE_LOGIN]") && !currentUser;
      if (needsLogin) {
        const cleaned = aiReply.replace(/\[.*?\]/g, "").trim();
        addMessage('assistant', cleaned || "अगाडि बढ्न पहिले लग-इन गर्नुहोस्।", undefined, 'AUTH_EMAIL');
        setIsLoading(false);
        return;
      }
      const priceMatch = aiReply.match(/\[PRICE:\s*(\d+)\]/i);
      const gameDetect = aiReply.match(/(Free Fire|PUBG Mobile|Freefire|PUBG|Mobile Legends|MLBB)/i);
      const pkgDetect = aiReply.match(/(\d+)\s*(Diamonds|UC|DMs|Dimonds)/i);
      setFlowState(prev => ({
        ...prev,
        amount: priceMatch ? parseInt(priceMatch[1]) : prev.amount,
        gameName: gameDetect ? gameDetect[0] : prev.gameName,
        packageName: pkgDetect ? pkgDetect[0] : prev.packageName
      }));
      const cleanedReply = aiReply.replace(/\[.*?\]/gi, "").trim();
      if (aiReply.includes("[ACTION: ASK_GAME_DETAILS]")) {
        addMessage('assistant', cleanedReply, undefined, 'GAME_INPUTS');
      } else if (aiReply.includes("[ACTION: SHOW_PAYMENT_METHODS]")) {
        addMessage('assistant', cleanedReply, undefined, 'PAYMENT_METHODS');
      } else if (aiReply.includes("[ACTION: SHOW_SCREENSHOT_UPLOAD]")) {
        addMessage('assistant', cleanedReply, undefined, 'PAYMENT_METHODS');
      } else if (aiReply.includes("[ACTION: SHOW_ORDER_BUTTON]")) {
        addMessage('assistant', cleanedReply, undefined, 'VIEW_ORDER_BTN');
      } else {
        addMessage('assistant', cleanedReply);
      }
    } catch (e: any) { 
      addMessage('assistant', "मेसेज पठाउन सकिएन। इन्टरनेट चेक गर्नुहोस्।");
    } finally { 
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      addMessage('user', "भेरिफाइ हुँदैछ... 🔍", base64);
      
      try {
        const result = await verifyScreenshotAI(base64, flowState.amount || 100);
        
        if (result.valid) {
          const createRes = await firebaseService.createOrder({
            customerId: currentUser?.userId,
            customerName: currentUser?.username,
            customerEmail: currentUser?.email,
            gameName: flowState.gameName,
            gameUserId: flowState.uid,
            gameUsername: flowState.ign,
            price: flowState.amount,
            status: 'pending'
          });
          
          if (createRes.success) {
            addMessage('assistant', `भुक्तानी सफल! ✅ अर्डर #MT-${createRes.order.orderId} सुरक्षित भयो। १ देखि ५ मिनेटभित्र डेलिभर हुनेछ।`, undefined, 'VIEW_ORDER_BTN');
            if(currentUser) refreshOrders(currentUser.userId);
          } else {
            addMessage('assistant', `पेमेन्ट त भेरिफाई भयो! ✅ तर डाटाबेसमा सेभ हुन सकेन। कृपया रसिद सिधै ह्वाट्सएप (९७६४६३०६३४) मा पठाउनुहोस्।`, undefined, 'VIEW_ORDER_BTN');
          }
        } else {
          addMessage('assistant', `त्रुटि: ${result.reason || "अमान्य रसिद।"} ❌\nकृपया सफल भुक्तानीको ओरिजिनल स्क्रीनशट पठाउनुहोस्।`);
        }
      } catch(err: any) { 
        addMessage('assistant', "सर्भरमा समस्या आयो। सपोर्ट टिमलाई ९७६४६३०६३४ मा सम्पर्क गर्नुहोस्। ❌"); 
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    };
    reader.readAsDataURL(file);
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`नमस्ते सपोर्ट टिम, मलाई अर्डर गर्न मद्दत चाहियो। (User: ${currentUser?.username || 'Guest'})`);
    window.open(`https://wa.me/9764630634?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto bg-slate-50 relative overflow-hidden font-poppins antialiased">
      <header className="glass border-b border-slate-100 px-5 pt-10 pb-4 sticky top-0 z-[70] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 relative">
            <span className="text-white font-black italic text-lg">MT</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-base tracking-tight leading-none">AI Agent</h1>
              <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[8px] font-black text-green-600 uppercase">Online</span>
              </div>
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2 block leading-none">MeroTopup AI</span>
          </div>
        </div>
        <button 
          onClick={handleProfileClick}
          className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm active:scale-95 transition-all overflow-hidden"
        >
          {currentUser ? (
             <div className="w-full h-full flex items-center justify-center bg-indigo-50 font-black text-lg">
                {currentUser.username[0].toUpperCase()}
             </div>
          ) : (
            <span className="text-xl">👤</span>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-28 space-y-8 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5 duration-500`}>
            <div className={`max-w-[92%] p-5 rounded-3xl shadow-sm relative border ${
              m.role === 'user' ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none shadow-indigo-100 shadow-xl' : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {m.image && <img src={m.image} className="mb-4 rounded-2xl max-h-[300px] w-full object-cover bg-slate-50 p-1 border shadow-sm" alt="receipt" />}
              <p className="text-sm leading-relaxed font-semibold whitespace-pre-wrap">{m.content}</p>
              
              {m.interactiveType === 'AUTH_EMAIL' && <AuthInput label="User Identity" placeholder="Your Email" value={auth.email} onChange={(v:any)=>setAuth({...auth, email:v})} onNext={handleAuth} isLoading={isLoading} />}
              {m.interactiveType === 'AUTH_PASSWORD' && <AuthInput type="password" label="Passcode" placeholder="Password" value={auth.password} onChange={(v:any)=>setAuth({...auth, password:v})} onNext={handleAuth} isLoading={isLoading} />}
              {m.interactiveType === 'REGISTER_NAME' && <AuthInput label="Member Profile" placeholder="Your Full Name" value={auth.name} onChange={(v:any)=>setAuth({...auth, name:v})} onNext={handleAuth} isLoading={isLoading} />}
              
              {m.interactiveType === 'GAME_INPUTS' && (
                <GameInputCard 
                  uid={flowState.uid} ign={flowState.ign} 
                  setUid={(v:any)=>setFlowState(ps => ({...ps, uid:v}))} 
                  setIgn={(v:any)=>setFlowState(ps => ({...ps, ign:v}))} 
                  onNext={()=>handleSend(`Details: UID - ${flowState.uid}, IGN - ${flowState.ign}`)} 
                />
              )}
              
              {m.interactiveType === 'PAYMENT_METHODS' && (
                <PaymentSection 
                  amount={flowState.amount}
                  selectedMethod={flowState.selectedMethod}
                  onSelect={(method:any) => setFlowState(ps => ({...ps, selectedMethod: method}))}
                  onUpload={handleFileUpload}
                />
              )}

              {m.interactiveType === 'VIEW_ORDER_BTN' && (
                <button 
                  onClick={handleProfileClick} 
                  className="mt-4 w-full bg-indigo-50 border border-indigo-100 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <span>Check All Orders History</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center">
              <div className="flex gap-1.5 px-1 py-0.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </main>

      <footer className="fixed bottom-4 w-full px-4 z-[80]">
        <div className="max-w-2xl mx-auto flex items-center gap-3 glass p-2 rounded-full border border-white shadow-2xl focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-500">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-0 outline-none text-sm py-2 px-5 font-semibold text-slate-800 placeholder:text-slate-400"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} disabled={isLoading || !inputText.trim()} className="bg-indigo-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </footer>

      {showProfile && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={()=>{setShowProfile(false); setSelectedOrder(null);}}></div>
          <div className="bg-white w-full max-w-2xl rounded-t-[3rem] shadow-2xl p-8 max-h-[96dvh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500 no-scrollbar relative border-t border-white/50">
            
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full"></div>

            {selectedOrder ? (
              <div className="animate-in zoom-in-95 duration-300 pt-4">
                <button onClick={()=>setSelectedOrder(null)} className="mb-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full w-fit">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                   Back to History
                </button>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedOrder.gameName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Ref ID: {selectedOrder.orderId}</p>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${selectedOrder.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{selectedOrder.status}</span>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1 py-4 border-b border-slate-200/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Player UID</span>
                      <span className="text-lg font-black text-slate-800">{selectedOrder.gameUserId}</span>
                    </div>
                    <div className="flex flex-col gap-1 py-4 border-b border-slate-200/50">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In-Game Name</span>
                      <span className="text-lg font-black text-slate-800">{selectedOrder.gameUsername}</span>
                    </div>
                    <div className="flex justify-between items-center py-5">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                        <p className="text-3xl font-black text-indigo-600">Rs. {selectedOrder.price}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                         <p className="text-xs font-bold text-slate-500 mt-1">{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">Account Dashboard</h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mt-2">{currentUser?.username}</p>
                  </div>
                  <button onClick={()=>setShowProfile(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 hover:text-red-500 transition-colors shadow-sm">✕</button>
                </div>

                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">Total Investments</p>
                    <p className="text-3xl font-black">Rs. {stats.spent}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100 flex flex-col justify-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Success Orders</p>
                    <p className="text-3xl font-black text-slate-800">{stats.count}</p>
                  </div>
                </div>

                <div className="mb-8 flex items-center justify-between">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Order Stream</h3>
                   <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] font-black text-green-600 uppercase tracking-wider">Syncing</span>
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                  {orderHistory.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <div className="text-4xl mb-4">💳</div>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Empty Transaction List</p>
                    </div>
                  ) : (
                    orderHistory.map(o => (
                      <button 
                        key={o.orderId} 
                        onClick={()=>setSelectedOrder(o)} 
                        className="w-full p-6 rounded-[2rem] bg-white border border-slate-50 flex justify-between items-center shadow-lg shadow-slate-50 hover:shadow-indigo-100/50 hover:border-indigo-100 active:scale-95 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-sm font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                             {o.gameName[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{o.gameName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                               {o.orderId} • Rs. {o.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${o.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {o.status}
                           </span>
                           <span className="text-[8px] font-bold text-slate-300">{new Date(o.timestamp).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <button 
                  onClick={openWhatsApp}
                  className="w-full mb-12 bg-green-500 text-white p-5 rounded-[2rem] flex items-center justify-center gap-4 shadow-xl shadow-green-100 active:scale-95 transition-all group"
                >
                  <div className="bg-white/20 p-2 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">WhatsApp Support</p>
                    <p className="text-base font-black">24/7 Live Help Center</p>
                  </div>
                </button>

                <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }} 
                  className="w-full py-5 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-sm"
                >
                  Logout from MeroTopup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
