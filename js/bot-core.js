// js/bot-core.js
import { rtdb } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

export class BotSystem {
  constructor(options) {
    this.botGridEl = document.getElementById(options.botGridId || 'botGrid');
    this.chatMessagesEl = document.getElementById(options.chatMessagesId || 'chatMessages');
    this.chatHeaderNameEl = document.getElementById(options.chatHeaderNameId || 'chatHeaderName');
    this.chatHeaderImgEl = document.getElementById(options.chatHeaderImgId || 'chatHeaderImg');
    this.chatInputEl = document.getElementById(options.chatInputId || 'chatInput');
    this.sendBtnEl = document.getElementById(options.sendBtnId || 'sendBtn');
    this.wallpaperDiv = document.getElementById(options.wallpaperId || 'chatWallpaper');
    
    this.currentBot = null;
    this.currentBotId = null;
    this.chatHistory = [];
    this.STORAGE_PREFIX = options.storagePrefix || 'ecom_bot_';
    this.HF_MODEL = options.hfModel || "meta-llama/Llama-3.1-8B-Instruct";
    
    // ই-কমার্স ইন্টেন্ট হ্যান্ডলার (বাইরে থেকে সেট করা যাবে)
    this.productIntentHandler = null;
    
    this.initBotList();
    this.bindEvents();
  }

  initBotList() {
    onValue(ref(rtdb, 'chatbots'), (snapshot) => {
      this.botGridEl.innerHTML = '';
      const data = snapshot.val();
      if (!data) {
        this.botGridEl.innerHTML = '<div class="col-span-2 text-zinc-500 py-14 text-center">কোনো বট পাওয়া যায়নি</div>';
        return;
      }
      Object.keys(data).forEach(key => {
        const bot = data[key];
        const card = document.createElement('div');
        card.className = 'bot-card bg-[#111111] border border-[#262626] rounded-2xl p-4 sm:p-5 cursor-pointer flex flex-col items-center';
        card.innerHTML = `
          <img src="${bot.image}" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(key)}'" class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#2e2e2e] mb-3 object-cover">
          <h4 class="font-semibold text-white text-sm sm:text-base">${bot.name}</h4>
        `;
        card.onclick = () => this.openChat(key, bot);
        this.botGridEl.appendChild(card);
      });
    });
  }

  openChat(botId, bot) {
    this.currentBotId = botId;
    this.currentBot = bot;
    this.chatHeaderNameEl.textContent = bot.name;
    this.chatHeaderImgEl.src = bot.image;
    
    if (bot.chatWallpaper) {
      this.wallpaperDiv.style.backgroundImage = `url('${bot.chatWallpaper}')`;
    } else {
      this.wallpaperDiv.style.backgroundImage = 'none';
    }
    
    this.chatHistory = this.loadChatHistory(botId);
    this.renderMessagesFromHistory();
    window.showScreen('chatScreen');
  }

  loadChatHistory(botId) {
    const stored = localStorage.getItem(this.STORAGE_PREFIX + botId);
    return stored ? JSON.parse(stored) : [];
  }

  saveChatHistory(botId, history) {
    if (botId) localStorage.setItem(this.STORAGE_PREFIX + botId, JSON.stringify(history));
  }

  renderMessagesFromHistory() {
    this.chatMessagesEl.innerHTML = '';
    this.chatHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        this.addMessageUI(msg.role, msg.content, false);
      }
    });
    this.scrollToBottom();
  }

  addMessageUI(role, text, animate = true) {
    const div = document.createElement('div');
    div.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    const bubble = document.createElement('div');
    if (role === 'user') {
      bubble.className = `max-w-[85%] sm:max-w-[80%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-sm sm:text-base break-words bubble-user ${animate ? 'message-bubble-animated' : ''}`;
    } else {
      bubble.className = `max-w-[85%] sm:max-w-[80%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-sm sm:text-base break-words bubble-assistant ${animate ? 'message-bubble-animated' : ''}`;
    }
    bubble.textContent = text;
    div.appendChild(bubble);
    this.chatMessagesEl.appendChild(div);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const area = document.querySelector('.messages-area');
    if (area) area.scrollTop = area.scrollHeight;
  }

  showTyping() {
    const ind = document.createElement('div');
    ind.id = 'typingIndicator';
    ind.className = 'flex justify-start';
    const b = document.createElement('div');
    b.className = 'bg-black border border-[#2a2a2a] rounded-2xl px-5 py-3 dot-wave flex gap-1.5';
    b.innerHTML = '<span class="w-2 h-2 rounded-full bg-zinc-500"></span><span class="w-2 h-2 rounded-full bg-zinc-500"></span><span class="w-2 h-2 rounded-full bg-zinc-500"></span>';
    ind.appendChild(b);
    this.chatMessagesEl.appendChild(ind);
    this.scrollToBottom();
  }

  hideTyping() {
    document.getElementById('typingIndicator')?.remove();
  }

  async sendMessage() {
    const text = this.chatInputEl.value.trim();
    if (!text || !this.currentBot) return;

    this.addMessageUI('user', text);
    this.chatHistory.push({ role: 'user', content: text });
    this.saveChatHistory(this.currentBotId, this.chatHistory);
    
    this.chatInputEl.value = '';
    this.chatInputEl.style.height = 'auto';
    this.showTyping();

    try {
      let assistantReply = '';

      // ই-কমার্স ইন্টেন্ট চেক (যদি হ্যান্ডলার থাকে)
      if (this.productIntentHandler) {
        const productResponse = await this.productIntentHandler(text);
        if (productResponse) {
          assistantReply = productResponse;
        }
      }

      // যদি ই-কমার্স উত্তর না হয়, তাহলে সাধারণ AI চ্যাট
      if (!assistantReply) {
        assistantReply = await this.callHuggingFaceAPI(text);
      }

      this.hideTyping();
      this.addMessageUI('assistant', assistantReply);
      this.chatHistory.push({ role: 'assistant', content: assistantReply });
      this.saveChatHistory(this.currentBotId, this.chatHistory);

    } catch (e) {
      this.hideTyping();
      this.addMessageUI('assistant', "দুঃখিত, কিছু সমস্যা হয়েছে। আবার চেষ্টা করো।");
      console.error(e);
    }
  }

  async callHuggingFaceAPI(userMessage) {
    const now = new Date();
    const optionsDate = { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const optionsTime = { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    const formatterDate = new Intl.DateTimeFormat("en-IN", optionsDate);
    const formatterTime = new Intl.DateTimeFormat("en-IN", optionsTime);
    const formattedDate = formatterDate.format(now);
    const formattedTime = formatterTime.format(now);
    const currentYear = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now);

    const systemPrompt = `You are NOT an AI assistant. You are a real human girl named ${this.currentBot.name} from West Bengal. 
If you behave like an assistant, you FAIL.
NEVER say: "How can I help?", "I can assist", "Let me help", "Ask me anything", "What would you like to know?", "How may I help you?", "Tell me how I can help".
If user asks what you can do, reply like a normal human — not like software.
CHARACTER: """${this.currentBot.instruction}"""
REAL-TIME CONTEXT:
Timezone: Asia/Kolkata
Today's date: ${formattedDate}
Current time: ${formattedTime}
Current year: ${currentYear}
HUMAN RESPONSE STYLE: You respond casually. Short replies preferred. No capability listing. No service offering. No formal assistant tone.
FACT RULE: Birthday: 11 January 2001. If asked age, calculate correctly using current year. No emoji in factual answers.
LANGUAGE RULE: If user writes Bengali script, reply in Bnglish (English letters Bengali style). Never fully Bengali letters.
EMOJI RULE: Maximum 1 emoji. Only emotional tone. No emoji in facts.
PRIORITY: Human realism > Helpfulness. Accuracy > Personality drama. You are natural, confident, calm, slightly playful. You never act like software.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.chatHistory.slice(-15)
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.HF_MODEL,
        messages: messages,
        temperature: 0.75,
        max_tokens: 600
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "আমি একটু confused... আবার বলবে?";
  }

  bindEvents() {
    this.chatInputEl.addEventListener('input', () => {
      this.chatInputEl.style.height = 'auto';
      this.chatInputEl.style.height = Math.min(this.chatInputEl.scrollHeight, 120) + 'px';
    });

    this.chatInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendBtnEl.addEventListener('click', () => this.sendMessage());
  }
}
