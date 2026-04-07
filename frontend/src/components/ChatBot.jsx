import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, ChefHat, MapPin, RotateCcw, Loader2 } from 'lucide-react';
import api from '../utils/api.js';

const EVENT_TYPES = [
  { label: '💍 Wedding', value: 'Wedding' },
  { label: '🏢 Corporate Event', value: 'Corporate Event' },
  { label: '🎂 Birthday Party', value: 'Birthday Party' },
  { label: '🏠 House Warming', value: 'House Warming' },
  { label: '🪔 Pooja / Festival', value: 'Pooja / Festival' },
  { label: '🍽️ Other', value: 'Other' },
];

const EVENT_GREETINGS = {
  Wedding: "Congratulations on the upcoming wedding! 🎊 Let me design the perfect menu.",
  'Corporate Event': "Great! Let me put together a professional spread for your event.",
  'Birthday Party': "Let's make this birthday unforgettable with an amazing menu! 🎂",
  'House Warming': "A house warming deserves a warm, traditional feast! 🏠",
  'Pooja / Festival': "A sacred occasion calls for a beautiful, festive menu! 🪔",
  Other: "Let me design a great menu for your event!",
};

// ── Message bubble ──────────────────────────────────────────────────────────
function Bubble({ from, children }) {
  const isBot = from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      {isBot && (
        <div className="w-7 h-7 bg-saffron-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
          <ChefHat size={14} className="text-saffron-500" />
        </div>
      )}
      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isBot
          ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
          : 'bg-saffron-500 text-white rounded-tr-sm'
      }`}>
        {children}
      </div>
    </div>
  );
}

// Typing indicator
function TypingBubble() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 bg-saffron-100 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
        <ChefHat size={14} className="text-saffron-500" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// ── Quick reply chips ───────────────────────────────────────────────────────
function QuickReplies({ options, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1 mb-2 pl-9">
      {options.map(opt => (
        <button
          key={opt.value ?? opt.label}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 bg-saffron-50 border border-saffron-200 text-saffron-700 text-xs font-semibold rounded-xl hover:bg-saffron-100 transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Caterer result card inside chat ────────────────────────────────────────
function CatererResultCard({ caterer, matched, totalPrice, plates, selectedNames, city, isVeg }) {
  const vegParam = isVeg === true ? 'true' : isVeg === false ? 'false' : '';
  const queryStr = `?selected=${encodeURIComponent(JSON.stringify(selectedNames))}&plates=${plates}&city=${encodeURIComponent(city || '')}&veg=${vegParam}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-2 shadow-sm hover:border-saffron-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-bold text-sm text-gray-900">{caterer.businessName}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin size={10} />{caterer.city}
          </p>
        </div>
        <span className="text-xs bg-saffron-100 text-saffron-700 font-bold px-2 py-0.5 rounded-lg shrink-0">
          {matched.length}/{selectedNames.length} items
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2.5">
        {matched.slice(0, 4).map(d => (
          <span key={d._id} className={`text-xs px-2 py-0.5 rounded-full ${d.isVeg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {d.name}
          </span>
        ))}
        {matched.length > 4 && (
          <span className="text-xs text-gray-400 px-1 py-0.5">+{matched.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Est. total ({plates} plates)</p>
          <p className="font-bold text-saffron-600 text-base">₹{totalPrice.toLocaleString()}</p>
        </div>
        <Link
          to={`/caterer/${caterer._id}${queryStr}`}
          className="px-3 py-1.5 bg-saffron-500 text-white text-xs font-bold rounded-lg hover:bg-saffron-600 transition-colors"
        >
          View Menu →
        </Link>
      </div>
    </div>
  );
}

// ── Main ChatBot ────────────────────────────────────────────────────────────
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [step, setStep] = useState('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);

  const [session, setSession] = useState({
    eventType: null,
    isVeg: null,
    plates: null,
    city: '',
  });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load cities once
  useEffect(() => {
    if (open && availableCities.length === 0) {
      api.get('/dishes/all')
        .then(res => {
          const cities = [...new Set(res.data.dishes.map(d => d.catererId?.city).filter(Boolean))].sort();
          setAvailableCities(cities);
        })
        .catch(() => {});
    }
  }, [open]);

  // Start conversation on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => kickoff(), 300);
    }
  }, [open]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const addBot = (content, extra = {}) => {
    setMessages(prev => [...prev, { from: 'bot', content, ...extra, id: Date.now() + Math.random() }]);
  };

  const addUser = (text) => {
    setMessages(prev => [...prev, { from: 'user', content: text, id: Date.now() + Math.random() }]);
  };

  const botSay = (text, delay = 0, extra = {}) => {
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        addBot(text, extra);
        resolve();
      }, delay);
    });
  };

  const showTyping = (ms = 900) => {
    setIsTyping(true);
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // ── conversation steps ────────────────────────────────────────────────────

  const kickoff = async () => {
    setStep('event');
    await showTyping(600);
    await botSay("👋 Hi! I'm your CaterConnect AI assistant. I'll design the perfect menu for your event and find the best caterers instantly!");
    await showTyping(700);
    await botSay("What's the occasion? 🎉");
    setQuickReplies(EVENT_TYPES);
  };

  const handleEventSelect = async (opt) => {
    setQuickReplies([]);
    addUser(opt.label);
    setSession(s => ({ ...s, eventType: opt.value }));

    await showTyping(500);
    await botSay(EVENT_GREETINGS[opt.value]);
    await showTyping(600);
    await botSay('Would you like a Veg, Non-Veg, or Mixed menu?');
    setQuickReplies([
      { label: '🌿 Pure Veg', value: 'veg' },
      { label: '🍗 Non-Veg', value: 'nonveg' },
      { label: '🍽️ Mix (Both)', value: 'mix' },
    ]);
    setStep('vegPref');
  };

  const handleVegSelect = async (opt) => {
    setQuickReplies([]);
    addUser(opt.label);
    const isVeg = opt.value === 'veg' ? true : opt.value === 'nonveg' ? false : null;
    setSession(s => ({ ...s, isVeg }));

    await showTyping(500);
    await botSay('How many guests are you expecting? 👥');
    setAwaitingInput(true);
    setStep('guests');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleGuestsInput = async (val) => {
    const plates = parseInt(val) || 100;
    addUser(`${plates} guests`);
    setSession(s => ({ ...s, plates }));
    setAwaitingInput(false);

    await showTyping(500);
    await botSay(`Got it — planning for ${plates} guests! 👌`);
    await showTyping(600);

    if (availableCities.length > 0) {
      await botSay('Which city is the event in?');
      setQuickReplies([
        ...availableCities.map(c => ({ label: c, value: c })),
        { label: '🌍 Any City', value: '' },
      ]);
      setStep('city');
    } else {
      await runAI({ ...session, plates, city: '' });
    }
  };

  const handleCitySelect = async (opt) => {
    setQuickReplies([]);
    addUser(opt.value ? opt.label : 'Any City');
    const city = opt.value;
    setSession(s => ({ ...s, city }));
    await runAI({ ...session, city });
  };

  // ── AI call ───────────────────────────────────────────────────────────────

  const runAI = async (currentSession) => {
    setStep('thinking');
    setIsTyping(true);

    await showTyping(400);
    await botSay('🔍 Analysing your preferences and browsing the full menu catalog...');
    setIsTyping(true);

    try {
      const { data } = await api.post('/chat/suggest', {
        eventType: currentSession.eventType,
        isVeg: currentSession.isVeg,
        plates: currentSession.plates,
        city: currentSession.city || null,
      });

      setIsTyping(false);

      const { suggestedNames, caterers } = data;

      if (!suggestedNames || suggestedNames.length === 0) {
        await botSay("Hmm, I couldn't find dishes matching your preferences. Try a different combination!");
        showReset();
        return;
      }

      // Show menu summary
      const preview = suggestedNames.slice(0, 6).join(', ') + (suggestedNames.length > 6 ? ` & ${suggestedNames.length - 6} more` : '');
      await showTyping(700);
      await botSay(`✅ I've curated a ${suggestedNames.length}-course menu for your ${currentSession.eventType}:\n${preview}`);

      if (caterers.length === 0) {
        await showTyping(600);
        const cityNote = currentSession.city ? `in ${currentSession.city}` : 'in your area';
        await botSay(`No caterers found ${cityNote} for this menu. Try selecting "Any City" or different preferences.`);
        showReset();
        return;
      }

      await showTyping(700);
      await botSay(`🎉 Found ${caterers.length} caterer${caterers.length > 1 ? 's' : ''} who can serve your menu! Tap "View Menu" to see full details and send an enquiry.`);

      // Add caterer cards as a special message
      addBot(null, {
        type: 'catererResults',
        caterers,
        suggestedNames,
        session: currentSession,
      });

      setStep('done');
      setTimeout(() => showReset(), 600);

    } catch (err) {
      setIsTyping(false);
      await botSay('⚠️ Something went wrong while generating suggestions. Please try again!');
      showReset();
    }
  };

  const showReset = () => {
    setQuickReplies([{ label: '🔄 Start Over', value: '__reset__' }]);
  };

  // ── reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setMessages([]);
    setQuickReplies([]);
    setIsTyping(false);
    setAwaitingInput(false);
    setInputVal('');
    setSession({ eventType: null, isVeg: null, plates: null, city: '' });
    setStep('idle');
    setTimeout(() => kickoff(), 300);
  };

  // ── quick reply dispatcher ────────────────────────────────────────────────

  const handleQuickReply = (opt) => {
    if (opt.value === '__reset__') { reset(); return; }
    if (step === 'event') { handleEventSelect(opt); return; }
    if (step === 'vegPref') { handleVegSelect(opt); return; }
    if (step === 'city') { handleCitySelect(opt); return; }
  };

  // ── text input submit ─────────────────────────────────────────────────────

  const handleSubmit = () => {
    const val = inputVal.trim();
    if (!val) return;
    setInputVal('');
    if (step === 'guests') handleGuestsInput(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-saffron-500 hover:bg-saffron-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open catering assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] max-h-[580px] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-saffron-500 to-spice-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ChefHat size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">CaterConnect AI</p>
                <p className="text-saffron-100 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Powered by Groq AI
                </p>
              </div>
            </div>
            <button onClick={reset} title="Restart conversation" className="text-white/70 hover:text-white transition-colors p-1">
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {messages.map(msg => {
              if (msg.type === 'catererResults') {
                return (
                  <div key={msg.id} className="pl-9 mb-3">
                    {msg.caterers.map(r => (
                      <CatererResultCard
                        key={r.caterer._id}
                        caterer={r.caterer}
                        matched={r.matched}
                        totalPrice={r.totalPrice}
                        plates={msg.session.plates}
                        selectedNames={msg.suggestedNames}
                        city={msg.session.city}
                        isVeg={msg.session.isVeg}
                      />
                    ))}
                  </div>
                );
              }
              return (
                <Bubble key={msg.id} from={msg.from}>
                  {msg.content?.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </Bubble>
              );
            })}

            {isTyping && <TypingBubble />}

            {quickReplies.length > 0 && !isTyping && (
              <QuickReplies options={quickReplies} onSelect={handleQuickReply} />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Text input */}
          {awaitingInput && (
            <div className="border-t border-gray-200 bg-white px-3 py-2.5 flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                type="number"
                min="1"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 150"
                className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputVal.trim()}
                className="w-8 h-8 bg-saffron-500 disabled:bg-gray-200 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          )}

          {/* AI thinking indicator in input bar */}
          {step === 'thinking' && (
            <div className="border-t border-gray-200 bg-white px-4 py-2.5 flex items-center gap-2 text-xs text-gray-400 shrink-0">
              <Loader2 size={13} className="animate-spin text-saffron-500" />
              Groq AI is building your menu...
            </div>
          )}
        </div>
      )}
    </>
  );
}
