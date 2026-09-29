const S = window.VV_SECTION;
let products = [], cart = [], enabled = true;
const $ = id => document.getElementById(id);
const money = n => Number(n).toFixed(2).replace('.', ',');

async function load() {
  try {
    const data = await apiFetch(`/api/section/${S}/bootstrap`);
    enabled = !!data.orders_enabled;
    $('closed').classList.toggle('d-none', enabled);
    $('send').disabled = !enabled;
    products = data.products || [];
    renderProducts();
    renderCart();
  } catch (e) {
    $('msg').innerHTML = `<div class="alert alert-danger">${esc(e.message)}</div>`;
  }
}

function renderProducts() {
  const isNewMember = S === 'new_member';
  $('products').innerHTML = products.length ? products.map(p => `<div class="col"><div class="product"><img src="${p.image || '../../logo.png'}" alt=""><div class="product-body"><h5 class="mb-1">${esc(p.name)}</h5><div class="fw-bold text-success mb-2">${isNewMember ? 'GRATIS' : '€ ' + money(p.price)}</div><div class="small mb-1">Taglia</div><div class="sizes">${(p.sizes || []).map(size => `<button class="size" data-id="${p.id}" data-size="${size}">${size}</button>`).join('')}</div><div class="mt-3 d-flex"><button class="btn btn-success btn-sm ms-auto" data-action="add" data-id="${p.id}">Aggiungi</button></div></div></div></div>`).join('') : '<div class="col-12"><div class="alert alert-light">Nessun prodotto disponibile in questo momento.</div></div>';
  document.querySelectorAll('.size').forEach(b => b.onclick = () => {
    document.querySelectorAll(`.size[data-id="${b.dataset.id}"]`).forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
  document.querySelectorAll('[data-action="add"]').forEach(b => b.onclick = () => {
    const p = products.find(x => x.id === b.dataset.id);
    const size = document.querySelector(`.size[data-id="${b.dataset.id}"].active`);
    if (!size) return alert('Seleziona una taglia.');
    const old = cart.find(x => x.product_id === p.id);
    if (old) return alert('Hai già aggiunto questo prodotto. Per Nuovo Membro è disponibile una sola unità per prodotto.');
    cart.push({ product_id: p.id, product_name: p.name, size: size.dataset.size, quantity: isNewMember ? 1 : 1, unit_price: isNewMember ? 0 : Number(p.price), image: p.image });
    renderCart();
  });
}

function renderCart() {
  let total = 0, count = 0;
  cart.forEach(x => { total += x.quantity * x.unit_price; count += x.quantity; });
  $('cartCount').textContent = count;
  $('total').textContent = money(total);
  $('cartItems').innerHTML = cart.length ? cart.map((x, i) => `<div class="cart-line"><div class="d-flex gap-2"><img src="${x.image || '../../logo.png'}"><div class="flex-grow-1"><div class="fw-bold">${esc(x.product_name)}</div><div>${x.size} × ${x.quantity}</div><div>€ ${money(x.unit_price)}</div></div><button class="btn btn-sm btn-outline-danger" data-remove="${i}">×</button></div></div>`).join('') : '<p class="text-secondary">Il carrello è vuoto.</p>';
  document.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { cart.splice(+b.dataset.remove, 1); renderCart(); });
}

$('send').onclick = async () => {
  if (!enabled) return alert('Le ordinazioni sono chiuse.');
  if (!cart.length) return alert('Aggiungi almeno un prodotto.');
  const first = $('firstName').value.trim(), last = $('lastName').value.trim();
  if (!first || !last) return alert('Inserisci nome e cognome.');
  try {
    const result = await apiFetch(`/api/section/${S}/orders`, { method: 'POST', body: JSON.stringify({ first_name: first, last_name: last, items: cart.map(x => ({ product_id: x.product_id, size: x.size, quantity: x.quantity })) }) });
    cart = []; $('firstName').value = ''; $('lastName').value = ''; renderCart();
    $('msg').innerHTML = `<div class="alert alert-success">Ordine inviato correttamente!</div>`;
  } catch (e) { alert(e.message); await load(); }
};

function esc(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
load();
setInterval(load, 10000);
