(function(){
  const STORAGE = 'gymshop_cart_v1';

  const overlay = document.getElementById('cart-overlay');
  const cartBtn = document.querySelector('.cart_btn');
  const closeBtn = document.getElementById('cart-close');
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearBtn = document.getElementById('clear-cart-btn');
  const orderForm = document.getElementById('order-form');
  const orderCancel = document.getElementById('order-cancel');
  const orderMessage = document.getElementById('order-message');

  let cart = {};

  const parsePrice = s => Number(String(s).replace(/[^\d]/g,'')) || 0;
  const fmtPrice = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' ₽';
  const slug = s => String(s||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'');

  function load(){ try{ cart = JSON.parse(localStorage.getItem(STORAGE)) || {}; }catch(e){ cart = {}; } }
  function save(){ localStorage.setItem(STORAGE, JSON.stringify(cart)); }

  function productFromCard(card){
    return {
      id: slug(card.querySelector('.product-name')?.textContent || ''),
      name: card.querySelector('.product-name')?.textContent || 'Товар',
      price: parsePrice(card.querySelector('.product-price')?.textContent || '0'),
      img: card.querySelector('.product-image')?.getAttribute('src') || ''
    };
  }

  function addToCart(prod, delta = 1){
    if(!prod.id) prod.id = slug(prod.name);
    if(!cart[prod.id]) cart[prod.id] = { ...prod, qty:0 };
    cart[prod.id].qty = (cart[prod.id].qty || 0) + delta;
    if(cart[prod.id].qty <= 0) delete cart[prod.id];
    save(); renderAll();
  }
  function removeItem(id){ if(cart[id]) delete cart[id]; save(); renderAll(); }
  function clearCart(){ cart = {}; save(); renderAll(); }
  function totalAmount(){ return Object.values(cart).reduce((s,i)=> s + i.price * i.qty, 0); }

  function renderCards(){
    document.querySelectorAll('.product-card').forEach(card=>{
      const prod = productFromCard(card);
      const old = card.querySelector('.card-controls'); if(old) old.remove();
      const btn = card.querySelector('.add-to-cart-btn');
      if(cart[prod.id]){
        if(btn) btn.style.display = 'none';
        const wrap = document.createElement('div');
        wrap.className = 'card-controls';
        wrap.innerHTML = '<button class="card-decr" data-id="'+prod.id+'">−</button>' +
                         '<span class="card-qty">'+cart[prod.id].qty+'</span>' +
                         '<button class="card-incr" data-id="'+prod.id+'">+</button>';
        const priceEl = card.querySelector('.product-price');
        if(priceEl) priceEl.insertAdjacentElement('afterend', wrap); else card.appendChild(wrap);
      } else { if(btn) btn.style.display = ''; }
    });
  }

  function renderCart(){
    if(!itemsEl || !totalEl) return;
    itemsEl.innerHTML = '';
    const vals = Object.values(cart);
    if(!vals.length){ itemsEl.innerHTML = '<p>Корзина пуста</p>'; }
    else {
      vals.forEach(it=>{
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML =
          '<img src="'+it.img+'" alt="'+it.name+'">' +
          '<div class="meta"><div class="name">'+it.name+'</div><div class="price">'+fmtPrice(it.price)+'</div></div>' +
          '<div class="controls">' +
            '<div class="qty-controls" data-id="'+it.id+'"><button class="cart-decr">−</button><span class="cart-qty">'+it.qty+'</span><button class="cart-incr">+</button></div>' +
            '<div><button class="remove-item" data-id="'+it.id+'" style="background:none;border:0;color:var(--yellow);cursor:pointer;font-weight:700">Удалить</button></div>' +
          '</div>';
        itemsEl.appendChild(row);
      });
    }
    totalEl.textContent = fmtPrice(totalAmount());
  }

  function renderAll(){ renderCards(); renderCart(); }

  function openCart(){ overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden','false'); renderCart(); }
  function closeCart(){ overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden','true'); hideOrderForm(); }
  function showOrderForm(){ if(orderForm) orderForm.classList.remove('hidden'); }
  function hideOrderForm(){ if(orderForm) orderForm.classList.add('hidden'); if(orderMessage) orderMessage.textContent = ''; }

  document.addEventListener('click', function(e){
    const t = e.target;

    if(t.matches('.add-to-cart-btn')){ const card = t.closest('.product-card'); if(!card) return; addToCart(productFromCard(card),1); return; }

    if(t.matches('.card-incr')){ addToCart({id:t.dataset.id},1); return; }
    if(t.matches('.card-decr')){ addToCart({id:t.dataset.id},-1); return; }

    if(t.closest('.cart_btn')){ openCart(); return; }
    if(t.closest('#cart-close')){ closeCart(); return; }
    if(t === overlay){ closeCart(); return; }

    if(t.matches('.cart-incr')){ const id = t.closest('.qty-controls')?.dataset.id; if(id) addToCart({id},1); return; }
    if(t.matches('.cart-decr')){ const id = t.closest('.qty-controls')?.dataset.id; if(id) addToCart({id},-1); return; }
    if(t.matches('.remove-item')){ const id = t.dataset.id; if(id) removeItem(id); return; }

    if(t.matches('#clear-cart-btn')){ if(confirm('Очистить корзину?')) clearCart(); return; }

    if(t.matches('#checkout-btn')){ showOrderForm(); return; }
  });

  if(orderForm){
    orderForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      if(Object.keys(cart).length === 0){ if(orderMessage) orderMessage.textContent = 'Корзина пуста — добавьте товар.'; return; }
      if(orderMessage) orderMessage.textContent = 'Заказ создан!';
      clearCart();
    });
    if(orderCancel) orderCancel.addEventListener('click', function(){ hideOrderForm(); });
  }

  if(closeBtn) closeBtn.addEventListener('click', closeCart);

  load();
  renderAll();

  window._cart = { cart, addToCart, removeItem, clearCart };
})();
