// js/app.js
import { BotSystem } from './bot-core.js';
import { ProductService } from './ecommerce.js';

// ---------- গ্লোবাল স্ক্রিন সুইচ ----------
window.showScreen = (screenId) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'chatScreen') {
    setTimeout(() => bot.chatInputEl?.focus(), 80);
  }
};

// ---------- ই-কমার্স সার্ভিস ----------
const productService = new ProductService();

// ---------- বট সিস্টেম ----------
const bot = new BotSystem({
  botGridId: 'botGrid',
  chatMessagesId: 'chatMessages',
  chatHeaderNameId: 'chatHeaderName',
  chatHeaderImgId: 'chatHeaderImg',
  chatInputId: 'chatInput',
  sendBtnId: 'sendBtn',
  wallpaperId: 'chatWallpaper',
  storagePrefix: 'ecom_bot_',
  hfModel: "meta-llama/Llama-3.1-8B-Instruct"
});

// ---------- ই-কমার্স ইন্টেন্ট হ্যান্ডলার সেট করা ----------
bot.productIntentHandler = async (userMessage) => {
  const lowerMsg = userMessage.toLowerCase();
  
  // সবচেয়ে কম দামের প্রোডাক্ট
  if (lowerMsg.includes('সবচেয়ে কম') || lowerMsg.includes('cheapest') || lowerMsg.includes('কম দাম')) {
    const product = await productService.getCheapestProduct();
    if (product) {
      return `আমাদের স্টোরে সবচেয়ে কম দামের প্রোডাক্ট হলো "${product.name}"। এর দাম ₹${product.price}। ${product.stock ? `বর্তমানে ${product.stock} টি স্টকে আছে।` : 'কিন্তু দুঃখিত, এটি এখন স্টকে নেই।'}`;
    } else {
      return "দুঃখিত, এখন কোনো প্রোডাক্ট পাওয়া যায়নি।";
    }
  }
  
  // প্রোডাক্ট সার্চ
  if (lowerMsg.includes('খুঁজ') || lowerMsg.includes('search') || lowerMsg.includes('find') || lowerMsg.includes('দেখাও')) {
    // সহজ কীওয়ার্ড এক্সট্রাক্ট
    const searchTerms = ['বই', 'জিনিস', 'প্রোডাক্ট', 'book', 'product', 'item'];
    let searchQuery = userMessage;
    
    const results = await productService.searchProducts(searchQuery);
    if (results.length > 0) {
      let reply = `আমি "${searchQuery}" এর জন্য ${results.length} টি প্রোডাক্ট পেয়েছি:\n`;
      results.slice(0, 3).forEach((p, i) => {
        reply += `${i+1}. ${p.name} - ₹${p.price}\n`;
      });
      reply += `\nআরও দেখতে চাইলে প্রোডাক্ট লিস্ট দেখতে পারো।`;
      return reply;
    } else {
      return `দুঃখিত, "${searchQuery}" সম্পর্কিত কোনো প্রোডাক্ট পাইনি।`;
    }
  }
  
  // যদি কোনো মিল না থাকে
  return null;
};

// ---------- প্রোডাক্ট লিস্ট লোড ও রেন্ডার ----------
async function loadProducts() {
  const products = await productService.getAllProducts(30);
  productService.renderProductGrid(products, 'productGrid', (product) => {
    // প্রোডাক্ট ডিটেইল স্ক্রিনে যাওয়া
    productService.renderProductDetail(product, 'productDetailContent');
    window.showScreen('productDetailScreen');
  });
}

// ---------- নেভিগেশন বাটন (নিচে ট্যাব বা অন্য কিছু থাকলে) ----------
// এখানে আমরা শুধু ডেমো হিসেবে প্রোডাক্ট লিস্ট স্ক্রিনে যাওয়ার একটা উপায় দিচ্ছি।
// তুমি চাইলে বট লিস্ট স্ক্রিনে একটা বাটন যোগ করতে পারো।

// উদাহরণ: বট লিস্ট স্ক্রিনে একটা "প্রোডাক্ট দেখুন" বাটন যোগ করা
function addProductButton() {
  const botListScreen = document.getElementById('botListScreen');
  const btnContainer = document.createElement('div');
  btnContainer.className = 'mt-4 text-center';
  btnContainer.innerHTML = `
    <button id="viewProductsBtn" class="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-zinc-200 transition">
      🛍️ প্রোডাক্ট দেখুন
    </button>
  `;
  botListScreen.querySelector('.flex-1')?.insertAdjacentElement('beforebegin', btnContainer);
  
  document.getElementById('viewProductsBtn').addEventListener('click', async () => {
    await loadProducts();
    window.showScreen('productListScreen');
  });
}

// প্রোডাক্ট বাটন যোগ করো
setTimeout(addProductButton, 500);

// ভিউপোর্ট রিসাইজ হ্যান্ডলিং (মোবাইল কিবোর্ড)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    document.body.style.height = window.visualViewport.height + 'px';
  });
}

console.log('অ্যাপ শুরু হয়েছে!');