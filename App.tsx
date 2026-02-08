
import React, { useState, useEffect, useRef, memo } from 'react';
import { Message, User, Game, Order } from './types';
import { firebaseService } from './services/firebaseService';
import { getAIResponse, verifyScreenshotAI } from './services/geminiService';
import { PAYMENT_METHODS } from './constants';

// --- Compact Premium UI Elements ---

const AuthInput = memo(({ type, value, onChange, onNext, placeholder, isLoading }: any) => (
  <div className="mt-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-xl animate-in zoom-in-95 duration-300">
    <div className="mb-3 flex items-center gap-2">
       <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{placeholder} Required</span>
    </div>
    <input 
      type={type === 'password' ? 'password' : 'text'}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all mb-4"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onNext()}
    />
    <button onClick={onNext} disabled={isLoading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">
      {isLoading ? 'Processing...' : 'Verify ➔'}
    </button>
  </div>
));

const GameInputCard = memo(({ uid, ign, setUid, setIgn, onNext }: any) => (
  <div className="mt-3 bg-white p-6 rounded-3xl border border-indigo-50 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg text-lg">🎮</div>
      <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Account Details</h3>
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
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">In-Game Name</label>
        <input 
          placeholder="Character Name"
          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          value={ign} onChange={(e) => setIgn(e.target.value)}
        />
      </div>
      <button onClick={onNext} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-2">
        Proceed to Pay ➔
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-md transform group-hover:scale-105 transition-transform" style={{ backgroundColor: m.color }}>{m.icon}</div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{m.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-2xl text-center animate-in zoom-in-95 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: methodData?.color }}></div>
          <div className="mb-6">
             <div className="flex justify-center mb-4">
               <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                  Payment: {selectedMethod}
               </span>
             </div>
             <h4 className="text-slate-900 font-black text-3xl tracking-tight mb-1">Rs. {amount}</h4>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">To: {methodData?.merchantName}</p>
             <p className="text-xs text-indigo-600 font-black mt-0.5 tracking-wider">{methodData?.id}</p>
          </div>
          
          <div className="relative inline-block mb-6 group">
            <div className="absolute -inset-8 bg-indigo-500 rounded-full blur-[40px] opacity-10"></div>
            <div className="relative bg-white p-4 rounded-2xl shadow-inner border border-slate-50">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(methodData?.qrData || '9861513184')}&margin=10&bgcolor=ffffff&color=${(methodData?.color || '#4f46e5').replace('#', '')}`} 
                className="w-44 h-44 object-contain" 
                alt="Payment QR" 
              />
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl mb-6 text-left border border-slate-100 space-y-2">
             <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instructions:</p>
             </div>
             <p className="text-xs font-semibold text-slate-700 leading-tight">1. Pay <span className="text-indigo-600 font-black">Rs. {amount}</span> using QR</p>
             <p className="text-xs font-semibold text-slate-700 leading-tight">2. Recipient: <span className="font-bold">{methodData?.merchantName}</span></p>
             <p className="text-xs font-semibold text-slate-700 leading-tight">3. Upload screenshot below</p>
          </div>

          <label className="w-full flex items-center justify-center gap-2.5 bg-indigo-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 transition-all">
            <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Upload Receipt
          </label>
          
          <button onClick={() => onSelect(null)} className="mt-5 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500 transition-colors">Choose another method</button>
        </div>
      )}
    </div>
  );
});

// --- Main Chat System ---

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const fbGames = await firebaseService.getGames();
      setGames(fbGames);
      setIsLoading(false);
      
      const savedUid = localStorage.getItem('mero_topup_uid');
      if (savedUid) {
        const user = await firebaseService.getUserById(savedUid);
        if (user) {
          setCurrentUser(user);
          const orders = await firebaseService.getUserOrders(user.userId);
          setOrderHistory(orders);
          addMessage('assistant', `Welcome back, ${user.username}! 🙏 विशाल घिमिरेको डिजिटल सेल्सम्यान "MeroTopup AI" यहाँ उपस्थित छ। आज कुन गेम टप-अप गरौँ? 🎮`);
          return;
        }
      }
      addMessage('assistant', `नमस्ते! 🙏 म विशाल घिमिरे (Bishal Ghimire) द्वारा निर्मित "MeroTopup AI Assistant" हुँ। म उहाँको डिजिटल सेल्सम्यान (Digital Salesman) हुँ।\n\nयदि तपाईंहरूको साथ र सपोर्ट मिल्यो भने उहाँले मलाई भविष्यमा अझ पावरफुल बनाउनुहुनेछ। कुनै प्राविधिक समस्या आएमा उहाँलाई **9764630634** मा सिधै सम्पर्क गर्नुहोला।\n\nसुरु गर्न कृपया आफ्नो **Email Address** राख्नुहोस्:`, undefined, 'AUTH_EMAIL');
    };
    init();
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string, image?: string, interactiveType?: Message['interactiveType'], data?: any) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, content, timestamp: new Date(), image, interactiveType, data }]);
  };

  const handleAuth = async () => {
    const lastMsgType = messages[messages.length-1].interactiveType;
    if (lastMsgType === 'AUTH_EMAIL') {
      if (!auth.email.includes('@')) return;
      setIsLoading(true);
      const user = await firebaseService.getUserByEmail(auth.email);
      setIsLoading(false);
      addMessage('user', auth.email);
      if (user) {
        addMessage('assistant', `तपाईंको **Password** राख्नुहोस्:`, undefined, 'AUTH_PASSWORD');
      } else {
        addMessage('assistant', `तपाईंको **Full Name** के हो?`, undefined, 'REGISTER_NAME');
      }
    } else if (lastMsgType === 'REGISTER_NAME') {
      if (!auth.name.trim()) return;
      addMessage('user', auth.name);
      addMessage('assistant', `एउटा सुरक्षित **Password** बनाउनुहोस्:`, undefined, 'AUTH_PASSWORD');
    } else {
      if (!auth.password.trim()) return;
      setIsLoading(true);
      addMessage('user', '********');
      try {
        const user = auth.name ? 
          await firebaseService.createUser({ email: auth.email, username: auth.name, password: auth.password }) :
          await firebaseService.getUserByEmail(auth.email);
        
        if (user && (auth.name || (user as any).password === auth.password)) {
          setCurrentUser(user);
          localStorage.setItem('mero_topup_uid', user.userId);
          const orders = await firebaseService.getUserOrders(user.userId);
          setOrderHistory(orders);
          addMessage('assistant', `लग-इन सफल भयो! ✅ स्वागत छ ${user.username}। कुन गेम टप-अप गर्ने विचार छ?`);
        } else throw new Error();
      } catch(e) { addMessage('assistant', "पासवर्ड मिलेन, फेरि प्रयास गर्नुहोस्।", undefined, 'AUTH_PASSWORD'); }
      setIsLoading(false);
    }
  };

  const handleSend = async (customMsg?: string) => {
    const msg = customMsg || inputText;
    if (!msg.trim()) return;
    if (!customMsg) setInputText('');
    if (!customMsg) addMessage('user', msg);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const aiReply = await getAIResponse(history, msg, { availableGames: games, userName: currentUser?.username });

      const priceMatch = aiReply.match(/\[PRICE:\s*(\d+)\]/i);
      if (priceMatch && priceMatch[1]) {
        setFlowState(prev => ({ ...prev, amount: parseInt(priceMatch[1]) }));
      }

      const cleanedReply = aiReply
        .replace(/\[PRICE:\s*\d+\]/gi, "")
        .replace(/\[ACTION: ASK_GAME_DETAILS\]/gi, "")
        .replace(/\[ACTION: SHOW_PAYMENT_METHODS\]/gi, "")
        .replace(/\[ACTION: SHOW_SCREENSHOT_UPLOAD\]/gi, "")
        .trim();

      if (aiReply.includes("[ACTION: ASK_GAME_DETAILS]")) {
        addMessage('assistant', cleanedReply, undefined, 'GAME_INPUTS');
      } else if (aiReply.includes("[ACTION: SHOW_PAYMENT_METHODS]")) {
        addMessage('assistant', cleanedReply, undefined, 'PAYMENT_METHODS');
      } else {
        addMessage('assistant', cleanedReply);
      }
    } catch (e) { addMessage('assistant', "I'm busy at the moment. Please try again in a bit or contact Bishal at 9764630634."); }
    finally { setIsLoading(false); }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      addMessage('user', "रसिद चेक गर्दैछु... 🔍", base64);
      setIsLoading(true);
      try {
        const result = await verifyScreenshotAI(base64, flowState.amount || 100);
        if (result.valid) {
          addMessage('assistant', `पेमेन्ट सफल देखियो! ✅ अर्डर पेन्डिङमा छ, विशाल घिमिरेले चाँडै टप-अप गरिदिनुहुनेछ।\nID: ORD${Date.now().toString().slice(-6)}`);
          await firebaseService.createOrder({
            customerId: currentUser?.userId,
            customerName: currentUser?.username,
            customerEmail: currentUser?.email,
            gameName: flowState.gameName || "Topup",
            gameUserId: flowState.uid,
            gameUsername: flowState.ign,
            price: flowState.amount,
            status: 'pending'
          });
          const orders = await firebaseService.getUserOrders(currentUser!.userId);
          setOrderHistory(orders);
        } else {
          addMessage('assistant', `त्रुटि: ${result.reason} ❌`);
        }
      } catch(e) { addMessage('assistant', "रसिद विश्लेषणमा समस्या आयो। ❌"); }
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto bg-slate-50 relative overflow-hidden font-poppins antialiased">
      {/* Native Compact Header - Full Width */}
      <header className="glass border-b border-slate-100 px-5 pt-10 pb-4 sticky top-0 z-[70] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <span className="text-white font-black italic text-lg">MT</span>
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-base tracking-tight leading-none">MeroTopup</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bishal's AI Agent</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm active:scale-95 transition-all">
          {currentUser ? (
            <span className="font-black text-sm">{currentUser.username[0].toUpperCase()}</span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </button>
      </header>

      {/* Message Feed - Adjusted Padding */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-28 space-y-8 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5 duration-500`}>
            <div className={`max-w-[92%] p-5 rounded-3xl shadow-sm relative border ${
              m.role === 'user' 
                ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none shadow-indigo-100' 
                : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {m.image && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-50 shadow-md max-h-[250px] flex items-center justify-center bg-slate-50">
                  <img src={m.image} className="max-w-full max-h-full object-contain p-2" alt="receipt" />
                </div>
              )}
              <p className="text-sm leading-relaxed font-semibold whitespace-pre-wrap">{m.content}</p>
              
              {/* Specialized Widgets */}
              {m.interactiveType === 'AUTH_EMAIL' && <AuthInput placeholder="Email Address" value={auth.email} onChange={(v:any)=>setAuth({...auth, email:v})} onNext={handleAuth} isLoading={isLoading} />}
              {m.interactiveType === 'REGISTER_NAME' && <AuthInput placeholder="Full Name" value={auth.name} onChange={(v:any)=>setAuth({...auth, name:v})} onNext={handleAuth} isLoading={isLoading} />}
              {m.interactiveType === 'AUTH_PASSWORD' && <AuthInput type="password" placeholder="Password" value={auth.password} onChange={(v:any)=>setAuth({...auth, password:v})} onNext={handleAuth} isLoading={isLoading} />}
              
              {m.interactiveType === 'GAME_INPUTS' && (
                <GameInputCard 
                  uid={flowState.uid} ign={flowState.ign} 
                  setUid={(v:any)=>setFlowState({...flowState, uid:v})} 
                  setIgn={(v:any)=>setFlowState({...flowState, ign:v})} 
                  onNext={()=>handleSend(`Details: ID ${flowState.uid}, Name ${flowState.ign}`)} 
                />
              )}
              
              {m.interactiveType === 'PAYMENT_METHODS' && (
                <PaymentSection 
                  amount={flowState.amount || 0}
                  selectedMethod={flowState.selectedMethod}
                  onSelect={(method:any) => setFlowState({...flowState, selectedMethod: method})}
                  onUpload={handleFileUpload}
                />
              )}

              <div className={`text-[9px] mt-3 font-black uppercase tracking-widest opacity-30 flex items-center gap-1.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                 • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-5 py-3 rounded-full border border-slate-100 shadow-md flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Syncing</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Floating Compact Input Dock - Improved for mobile width */}
      <footer className="fixed bottom-4 w-full px-4 z-[80]">
        <div className="max-w-2xl mx-auto flex items-center gap-3 glass p-2 rounded-full border border-white shadow-2xl focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-500">
          <input
            type="text"
            placeholder="Ask MeroTopup AI..."
            className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm py-2 px-5 font-semibold text-slate-800 placeholder:text-slate-300"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </footer>

      {/* Account Slide Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={()=>setShowProfile(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[85dvh] animate-in slide-in-from-bottom-full duration-500">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-[60px]"></div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter">Your Vault</h2>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Transaction History</p>
              </div>
              <button onClick={()=>setShowProfile(false)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-sm font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 no-scrollbar">
              {orderHistory.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                   <div className="text-5xl opacity-10">📦</div>
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No records</p>
                </div>
              ) : orderHistory.map(o => (
                <button 
                  key={o.orderId} 
                  onClick={() => setSelectedOrder(o)}
                  className="w-full text-left p-5 rounded-2xl bg-white border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="space-y-1">
                    <p className="font-black text-indigo-600 text-[9px] uppercase tracking-widest">#{o.orderId.slice(-6)}</p>
                    <p className="font-black text-slate-800 text-base">{o.gameName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(o.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    o.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {o.status}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center pb-10">
               <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[11px] font-black text-red-500 uppercase tracking-widest">Logout</button>
               <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">v3.4 Stable</span>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-5 animate-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={()=>setSelectedOrder(null)}></div>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-50">
             <div className="p-8 text-center border-b border-slate-50 bg-indigo-50/20">
                <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-indigo-50">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Order Receipt</h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Ref: {selectedOrder.orderId}</p>
             </div>
             <div className="p-6 space-y-4">
                {[
                  { label: "Service", value: selectedOrder.gameName },
                  { label: "ID", value: selectedOrder.gameUserId },
                  { label: "IGN", value: selectedOrder.gameUsername },
                  { label: "Total", value: `Rs. ${selectedOrder.price}`, color: 'text-indigo-600' },
                  { label: "Status", value: selectedOrder.status.toUpperCase(), color: selectedOrder.status === 'completed' ? "text-green-500" : "text-amber-500" },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-xs font-black ${item.color || 'text-slate-800'}`}>{item.value}</span>
                  </div>
                ))}
             </div>
             <div className="p-6">
                <button onClick={()=>setSelectedOrder(null)} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95">Close</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
