async function load() {
  try {
    const section = S === 'new_member' ? 'nuovo-membro' : 'extra';

    const [settings, productData] = await Promise.all([
      apiFetch(`/api/${section}/settings`),
      apiFetch(`/api/${section}/products`)
    ]);

    enabled = !!settings.orders_enabled;

    $('closed').classList.toggle('d-none', enabled);
    $('send').disabled = !enabled;

    products = productData.products || [];

    renderProducts();
    renderCart();

  } catch (e) {
    $('msg').innerHTML =
      `<div class="alert alert-danger">${esc(e.message)}</div>`;
  }
}
