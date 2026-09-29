const S = window.VV_SECTION;

let products = [];
let cart = [];
let enabled = true;

const $ = id => document.getElementById(id);

const money = n =>
  Number(n).toFixed(2).replace('.', ',');


async function load() {

  try {

    const section =
      S === 'new_member'
        ? 'nuovo-membro'
        : 'extra';


    const [settings, productData] =
      await Promise.all([

        apiFetch(`/api/${section}/settings`),

        apiFetch(`/api/${section}/products`)

      ]);


    enabled = !!settings.orders_enabled;


    $('closed').classList.toggle(
      'd-none',
      enabled
    );


    $('send').disabled = !enabled;


    products =
      productData.products || [];


    renderProducts();

    renderCart();


  } catch (e) {

    $('msg').innerHTML =
      `<div class="alert alert-danger">
        ${esc(e.message)}
      </div>`;

  }

}


function renderProducts() {

  const isNewMember =
    S === 'new_member';


  $('products').innerHTML =
    products.length

      ? products.map(p => `

        <div class="col">

          <div class="product">

            <img
              src="${p.image || '../../logo.png'}"
              alt=""
            >

            <div class="product-body">

              <h5 class="mb-1">
                ${esc(p.name)}
              </h5>


              <div class="fw-bold text-success mb-2">

                ${
                  isNewMember
                    ? 'GRATIS'
                    : '€ ' + money(p.price)
                }

              </div>


              <div class="small mb-1">
                Taglia
              </div>


              <div class="sizes">

                ${(p.sizes || []).map(size => `

                  <button
                    class="size"
                    data-id="${p.id}"
                    data-size="${size}"
                  >
                    ${size}
                  </button>

                `).join('')}

              </div>


              <div class="mt-3 d-flex">

                <button
                  class="btn btn-success btn-sm ms-auto"
                  data-action="add"
                  data-id="${p.id}"
                >
                  Aggiungi
                </button>

              </div>

            </div>

          </div>

        </div>

      `).join('')

      : `

        <div class="col-12">

          <div class="alert alert-light">

            Nessun prodotto disponibile
            in questo momento.

          </div>

        </div>

      `;


  document
    .querySelectorAll('.size')
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(
            `.size[data-id="${button.dataset.id}"]`
          )
          .forEach(x =>
            x.classList.remove('active')
          );


        button.classList.add('active');

      };

    });


  document
    .querySelectorAll(
      '[data-action="add"]'
    )
    .forEach(button => {

      button.onclick = () => {

        const product =
          products.find(
            x => x.id === button.dataset.id
          );


        const size =
          document.querySelector(
            `.size[data-id="${button.dataset.id}"].active`
          );


        if (!size) {

          alert('Seleziona una taglia.');

          return;

        }


        const old =
          cart.find(
            x => x.product_id === product.id
          );


        if (old) {

          alert(
            'Hai già aggiunto questo prodotto. Per Nuovo Membro è disponibile una sola unità per prodotto.'
          );

          return;

        }


        cart.push({

          product_id: product.id,

          product_name: product.name,

          size: size.dataset.size,

          quantity: isNewMember ? 1 : 1,

          unit_price:
            isNewMember
              ? 0
              : Number(product.price),

          image: product.image

        });


        renderCart();

      };

    });

}


function renderCart() {

  let total = 0;

  let count = 0;


  cart.forEach(item => {

    total +=
      item.quantity *
      item.unit_price;

    count +=
      item.quantity;

  });


  $('cartCount').textContent =
    count;


  $('total').textContent =
    money(total);


  $('cartItems').innerHTML =

    cart.length

      ? cart.map((item, index) => `

          <div class="cart-line">

            <div class="d-flex gap-2">

              <img
                src="${item.image || '../../logo.png'}"
              >

              <div class="flex-grow-1">

                <div class="fw-bold">
                  ${esc(item.product_name)}
                </div>

                <div>
                  ${item.size} × ${item.quantity}
                </div>

                <div>
                  € ${money(item.unit_price)}
                </div>

              </div>


              <button
                class="btn btn-sm btn-outline-danger"
                data-remove="${index}"
              >
                ×
              </button>

            </div>

          </div>

        `).join('')

      : '<p class="text-secondary">Il carrello è vuoto.</p>';


  document
    .querySelectorAll('[data-remove]')
    .forEach(button => {

      button.onclick = () => {

        cart.splice(
          +button.dataset.remove,
          1
        );

        renderCart();

      };

    });

}


$('send').onclick = async () => {

  if (!enabled) {

    alert(
      'Le ordinazioni sono chiuse.'
    );

    return;

  }


  if (!cart.length) {

    alert(
      'Aggiungi almeno un prodotto.'
    );

    return;

  }


  const first =
    $('firstName').value.trim();


  const last =
    $('lastName').value.trim();


  if (!first || !last) {

    alert(
      'Inserisci nome e cognome.'
    );

    return;

  }


  try {

    const section =
      S === 'new_member'
        ? 'nuovo-membro'
        : 'extra';


    await apiFetch(
      `/api/${section}/orders`,
      {
        method: 'POST',

        body: JSON.stringify({

          first_name: first,

          last_name: last,

          items: cart.map(item => ({

            product_id:
              item.product_id,

            size:
              item.size,

            quantity:
              item.quantity

          }))

        })

      }
    );


    cart = [];


    $('firstName').value = '';

    $('lastName').value = '';


    renderCart();


    $('msg').innerHTML = `

      <div class="alert alert-success">

        Ordine inviato correttamente!

      </div>

    `;


  } catch (e) {

    alert(e.message);

    await load();

  }

};


function esc(value) {

  return String(value ?? '')
    .replace(
      /[&<>'"]/g,
      character => ({

        '&': '&amp;',

        '<': '&lt;',

        '>': '&gt;',

        "'": '&#39;',

        '"': '&quot;'

      }[character])

    );

}


/* AVVIO AUTOMATICO */

load();

setInterval(
  load,
  10000
);
