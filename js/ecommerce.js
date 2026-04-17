// js/ecommerce.js
import { firestore } from './firebase.js';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export class ProductService {
  constructor() {
    this.productsCollection = collection(firestore, 'products');
  }

  // সব প্রোডাক্ট লোড করবে (সীমিত সংখ্যক)
  async getAllProducts(limitCount = 20) {
    try {
      const q = query(this.productsCollection, limit(limitCount));
      const snapshot = await getDocs(q);
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return products;
    } catch (error) {
      console.error("প্রোডাক্ট লোড করতে সমস্যা:", error);
      return [];
    }
  }

  // নির্দিষ্ট প্রোডাক্ট ডিটেইল
  async getProductById(productId) {
    try {
      const docRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("প্রোডাক্ট ডিটেইল পেতে সমস্যা:", error);
      return null;
    }
  }

  // সবচেয়ে কম দামের প্রোডাক্ট
  async getCheapestProduct() {
    try {
      const q = query(this.productsCollection, orderBy('price', 'asc'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error("সবচেয়ে কম দামের প্রোডাক্ট পেতে সমস্যা:", error);
      return null;
    }
  }

  // প্রোডাক্ট সার্চ (সিম্পল টেক্সট ম্যাচ)
  async searchProducts(searchTerm) {
    try {
      const term = searchTerm.toLowerCase();
      const allProducts = await this.getAllProducts(50);
      
      // ফিল্টার করে মিল খোঁজা
      const results = allProducts.filter(product => {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        return name.includes(term) || description.includes(term) || category.includes(term);
      });
      
      return results.slice(0, 5); // সর্বোচ্চ ৫টা রেজাল্ট
    } catch (error) {
      console.error("সার্চ করতে সমস্যা:", error);
      return [];
    }
  }

  // UI-তে প্রোডাক্ট গ্রিড রেন্ডার
  renderProductGrid(products, containerId = 'productGrid', onProductClick) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    if (products.length === 0) {
      container.innerHTML = '<div class="col-span-2 text-zinc-500 py-14 text-center">কোনো প্রোডাক্ট পাওয়া যায়নি</div>';
      return;
    }
    
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image || 'https://via.placeholder.com/200'}" 
             onerror="this.src='https://via.placeholder.com/200?text=No+Image'" 
             class="product-image" 
             alt="${product.name}">
        <h3 class="font-semibold text-white text-sm mb-1">${product.name}</h3>
        <p class="text-zinc-400 text-xs mb-2">${product.category || 'সাধারণ'}</p>
        <p class="text-white font-bold">₹${product.price}</p>
        ${product.stock ? `<p class="text-green-500 text-xs mt-1">স্টকে আছে (${product.stock})</p>` : '<p class="text-red-500 text-xs mt-1">স্টক নেই</p>'}
      `;
      card.addEventListener('click', () => {
        if (onProductClick) onProductClick(product);
      });
      container.appendChild(card);
    });
  }

  // প্রোডাক্ট ডিটেইল UI রেন্ডার
  renderProductDetail(product, containerId = 'productDetailContent') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <img src="${product.image || 'https://via.placeholder.com/400'}" 
           onerror="this.src='https://via.placeholder.com/400?text=No+Image'" 
           class="w-full rounded-xl mb-4" 
           style="max-height: 300px; object-fit: cover;">
      <h2 class="text-2xl font-bold">${product.name}</h2>
      <p class="text-zinc-400 mt-1">${product.category || 'সাধারণ'}</p>
      <p class="text-3xl font-bold text-white mt-4">₹${product.price}</p>
      ${product.stock ? `<p class="text-green-500 mt-2">স্টকে আছে (${product.stock} টি)</p>` : '<p class="text-red-500 mt-2">স্টক নেই</p>'}
      <p class="text-zinc-300 mt-4 leading-relaxed">${product.description || 'কোনো বিবরণ নেই'}</p>
      <button class="w-full bg-white text-black font-semibold py-3 rounded-full mt-6 hover:bg-zinc-200 transition">
        কার্টে যোগ করুন
      </button>
    `;
  }
}