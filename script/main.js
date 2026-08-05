/* ==========================================================
   VARIABLES GLOBALES
   ========================================================== */

/**
 * Estado global del carrito de compras.
 * @type {Object.<string, {name: string, price: number, qty: number}>}
 */
var cart = {};

/**
 * Categoría o grupo de productos filtrado actualmente.
 * @type {string}
 */
var currentCat = 'all';

/**
 * Texto de búsqueda ingresado en el filtro de productos.
 * @type {string}
 */
var currentSearch = '';


/* ==========================================================
   LOCAL STORAGE
   ========================================================== */

/**
 * Guarda el estado actual del carrito en LocalStorage.
 */
function saveCart() {
  try {
    localStorage.setItem('uonni_cart', JSON.stringify(cart));
  } catch (e) {
    // Manejo silencioso de errores de storage
  }
}

/**
 * Carga el carrito desde LocalStorage y renderiza los productos guardados.
 */
function loadCart() {
  try {
    const s = localStorage.getItem('uonni_cart');
    if (s) {
      cart = JSON.parse(s);
      renderCart();
    }
  } catch (e) {
    // Manejo silencioso de errores de parseo/storage
  }
}

/**
 * Guarda los datos del cliente ingresados en el formulario en LocalStorage.
 */
function saveClientData() {
  const data = {
    nombre: document.getElementById("f-nombre").value.trim(),
    negocio: document.getElementById("f-negocio").value.trim(),
    wa: document.getElementById("f-wa").value.trim(),
    mail: document.getElementById("f-mail").value.trim(),
    localidad: document.getElementById("f-localidad").value.trim()
  };
  localStorage.setItem('uonni_client', JSON.stringify(data));
}

/**
 * Carga los datos del cliente desde LocalStorage y completa el formulario.
 */
function loadClientData() {
  try {
    const s = localStorage.getItem('uonni_client');
    if (!s) return;

    const d = JSON.parse(s);
    if (d.nombre) document.getElementById("f-nombre").value = d.nombre;
    if (d.negocio) document.getElementById("f-negocio").value = d.negocio;
    if (d.wa) document.getElementById("f-wa").value = d.wa;
    if (d.mail) document.getElementById("f-mail").value = d.mail;
    if (d.localidad) document.getElementById("f-localidad").value = d.localidad;
  } catch (e) {
    // Manejo silencioso de errores de parseo/storage
  }
}


/* ==========================================================
   FUNCIONES AUXILIARES
   ========================================================== */

/**
 * Formatea un número como importe en moneda con separadores de miles.
 *
 * @param {number} n - Valor numérico a formatear.
 * @returns {string} Cadena formateada en pesos (ej: "$100.000").
 */
function fmt(n) {
  const s = Math.round(n).toString();
  let r = "";
  let c = 0;

  for (let i = s.length - 1; i >= 0; i--) {
    if (c > 0 && c % 3 === 0) {
      r = "." + r;
    }
    r = s[i] + r;
    c++;
  }

  return `$${r}`;
}

/**
 * Modifica la cantidad de un input de producto sumando o restando un valor sin permitir negativos.
 *
 * @param {string} id - ID del input HTML.
 * @param {number} d - Delta a sumar o restar.
 */
function qch(id, d) {
  const inp = document.getElementById(id);
  if (!inp) return;

  let v = parseInt(inp.value, 10) || 0;
  v = Math.max(0, v + d);
  inp.value = v;
}


/* ==========================================================
   CARRITO
   ========================================================== */

/**
 * Agrega un producto al carrito según la cantidad seleccionada en su input.
 * Actualiza la UI del botón y la tarjeta del producto, resetea la cantidad y guarda los cambios.
 *
 * @param {string} id - Identificador único del producto / input.
 */
function addToCart(id) {
  const inp = document.getElementById(id);
  if (!inp) return;

  let qty = parseInt(inp.value, 10) || 0;
  if (qty <= 0) {
    inp.value = 1;
    qty = 1;
  }

  const name = inp.getAttribute("data-name");
  const price = parseInt(inp.getAttribute("data-price"), 10);

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name: name, price: price, qty: qty };
  }

  const btn = document.getElementById(`btn_${id}`);
  if (btn) {
    btn.textContent = "Agregado";
    btn.classList.add("success");
    setTimeout(() => {
      btn.textContent = "+ Agregar";
      btn.classList.remove("success");
    }, 1400);
  }

  const card = document.getElementById(`card_${id}`);
  if (card) {
    card.classList.add("added-flash");
    setTimeout(() => {
      card.classList.remove("added-flash");
    }, 1400);
  }

  inp.value = 0;
  renderCart();
  saveCart();
}

/**
 * Elimina un producto del carrito según su ID.
 *
 * @param {string} id - Identificador del producto a remover.
 */
function removeFromCart(id) {
  delete cart[id];
  renderCart();
  saveCart();
}

/**
 * Renderiza el contenido del carrito en el panel lateral, calculando subtotales y la cantidad total de unidades.
 */
function renderCart() {
  const body = document.getElementById("cart-items");
  const keys = Object.keys(cart);
  let total = 0;
  let totalQty = 0;

  if (keys.length === 0) {
    body.innerHTML = '<div class="cart-empty"><div style="font-size:40px;margin-bottom:8px">&#128722;</div>Todavia no agregaste productos.</div>';
    updateTotal(0);
    document.getElementById("cart-badge").textContent = "0";
    document.getElementById("cart-total-header").textContent = "$0";
    return;
  }

  let html = "";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const item = cart[key];
    const sub = item.price * item.qty;

    total += sub;
    totalQty += item.qty;

    html += `<div class="cart-item"><div class="ci-info"><div class="ci-name">${item.name}</div><div class="ci-detail">${item.qty} u. x ${fmt(item.price)}</div></div><div style="display:flex;align-items:center;gap:8px"><div class="ci-subtotal">${fmt(sub)}</div><button class="ci-remove" data-id="${key}" onclick="removeFromCart(this.dataset.id)">&#215;</button></div></div>`;
  }

  body.innerHTML = html;
  updateTotal(total);
  document.getElementById("cart-badge").textContent = totalQty;
  document.getElementById("cart-total-header").textContent = fmt(total);
}

/**
 * Actualiza la visualización del total del carrito, la barra de progreso del pedido mínimo y el estado del botón de confirmación.
 *
 * @param {number} total - Importe total acumulado del carrito.
 */
function updateTotal(total) {
  document.getElementById("total-display").textContent = fmt(total);

  const pct = Math.min(100, (total / 300000) * 100);
  document.getElementById("minimo-fill").style.width = `${pct}%`;

  const msg = document.getElementById("minimo-msg");
  const btn = document.getElementById("btn-confirmar");

  if (total >= 300000) {
    msg.textContent = "Minimo alcanzado";
    msg.className = "minimo-msg ok";
    btn.disabled = false;
  } else {
    const falta = 300000 - total;
    msg.textContent = `Faltan ${fmt(falta)} para el minimo`;
    msg.className = "minimo-msg no";
    btn.disabled = true;
  }
}

/**
 * Abre el panel lateral deslizable del carrito y deshabilita el scroll principal.
 */
function openCart() {
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-panel").classList.add("open");
  document.body.style.overflow = "hidden";
}

/**
 * Cierra el panel lateral del carrito y restaura el scroll del sitio.
 */
function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-panel").classList.remove("open");
  document.body.style.overflow = "";
}


/* ==========================================================
   FILTROS Y BÚSQUEDA
   ========================================================== */

/**
 * Ejecuta la búsqueda de productos en base al texto ingresado.
 *
 * @param {string} val - Texto ingresado por el usuario.
 */
function doSearch(val) {
  currentSearch = val.trim().toLowerCase();
  document.getElementById("clear-btn").style.display = currentSearch ? "block" : "none";
  applyFilters();
}

/**
 * Resetea el campo de búsqueda e invoca la actualización de filtros.
 */
function clearSearch() {
  document.getElementById("search-input").value = "";
  doSearch("");
}

/**
 * Aplica la selección de una categoría o grupo de productos en la interfaz.
 *
 * @param {HTMLElement} el - Elemento del DOM correspondiente al botón/tab de categoría.
 * @param {string} cat - Código identificador de la categoría o grupo.
 */
function filterCat(el, cat) {
  document.querySelectorAll(".cat-pill").forEach((p) => {
    p.classList.remove("active");
  });
  el.classList.add("active");
  currentCat = cat;
  applyFilters();
}

/**
 * Oculta o muestra secciones, banners y productos combinando los filtros de categoría/grupo y búsqueda por texto.
 */
function applyFilters() {
  const sections = document.querySelectorAll(".cat-section");
  const banners = document.querySelectorAll(".group-banner");
  let anyVisible = false;
  const visibleGroups = {};

  sections.forEach((sec) => {
    const secCat = sec.getAttribute("data-cat");
    const secGroup = sec.getAttribute("data-group");
    const catMatch = currentCat === "all" || (currentCat.startsWith("g:") ? secGroup === currentCat.slice(2) : secCat === currentCat);
    const cards = sec.querySelectorAll(".prod-card");
    let secHasVisible = false;

    cards.forEach((card) => {
      const nameMatch = !currentSearch || card.getAttribute("data-name").includes(currentSearch);
      const visible = catMatch && nameMatch;

      card.style.display = visible ? "" : "none";
      if (visible) secHasVisible = true;
    });

    sec.style.display = secHasVisible ? "" : "none";
    if (secHasVisible) {
      anyVisible = true;
      visibleGroups[secGroup] = true;
    }
  });

  banners.forEach((b) => {
    b.style.display = visibleGroups[b.getAttribute("data-group")] ? "" : "none";
  });

  document.getElementById("no-results").style.display = anyVisible ? "none" : "block";
}


/* ==========================================================
   VALIDACIÓN DEL FORMULARIO
   ========================================================== */

/**
 * Valida los campos obligatorios del formulario de compra.
 *
 * @returns {boolean} `true` si todos los campos requeridos están completos, `false` de lo contrario.
 */
function validateForm() {
  let valid = true;
  const fields = ["f-nombre", "f-wa", "f-localidad"];

  fields.forEach((id) => {
    const inp = document.getElementById(id);
    if (!inp.value.trim()) {
      inp.classList.add("error");
      valid = false;
    } else {
      inp.classList.remove("error");
    }
  });

  return valid;
}


/* ==========================================================
   MODAL DE CONFIRMACIÓN
   ========================================================== */

/**
 * Valida el formulario del comprador, guarda sus datos, arma el desglose del pedido y despliega el modal de confirmación.
 */
function confirmarPedido() {
  if (!validateForm()) {
    document.getElementById("f-nombre").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  saveClientData();

  const keys = Object.keys(cart);
  if (keys.length === 0) {
    alert("Agrega productos primero.");
    return;
  }

  const total = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);

  const nombre = document.getElementById("f-nombre").value.trim();
  const negocio = document.getElementById("f-negocio").value.trim();
  const wa = document.getElementById("f-wa").value.trim();
  const mail = document.getElementById("f-mail").value.trim();
  const localidad = document.getElementById("f-localidad").value.trim();

  let ch = "";
  if (nombre) ch += `<b>Nombre:</b> ${nombre}<br>`;
  if (negocio) ch += `<b>Negocio:</b> ${negocio}<br>`;
  if (wa) ch += `<b>WhatsApp:</b> ${wa}<br>`;
  if (mail) ch += `<b>Email:</b> ${mail}<br>`;
  if (localidad) ch += `<b>Localidad:</b> ${localidad}<br>`;

  document.getElementById("resumen-cliente").innerHTML = ch;

  let ih = "";
  for (let i = 0; i < keys.length; i++) {
    const item = cart[keys[i]];
    const sub = item.price * item.qty;
    ih += `<div class="modal-item"><div><div class="modal-item-name">${item.name}</div><div class="modal-item-qty">${item.qty} u. x ${fmt(item.price)}</div></div><div class="modal-item-sub">${fmt(sub)}</div></div>`;
  }

  document.getElementById("resumen-items").innerHTML = ih;
  document.getElementById("resumen-total").textContent = fmt(total);
  document.getElementById("resumen-minimo").textContent = total >= 300000 ? "Minimo alcanzado" : "";
  document.getElementById("modal-overlay").classList.add("open");
}

/**
 * Cierra la ventana modal de confirmación del pedido.
 */
function cerrarModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}


/* ==========================================================
   GENERACIÓN DEL PEDIDO
   ========================================================== */

/**
 * Construye y retorna la representación en texto plano del pedido con los datos del comprador e ítems.
 *
 * @returns {string} Cadena de texto formateada para el envío del pedido.
 */
function buildTextResumen() {
  const nombre = document.getElementById("f-nombre").value.trim();
  const negocio = document.getElementById("f-negocio").value.trim();
  const wa = document.getElementById("f-wa").value.trim();
  const mail = document.getElementById("f-mail").value.trim();
  const localidad = document.getElementById("f-localidad").value.trim();

  const total = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
  const fecha = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const sep = "------------------------";
  const lines = [];

  lines.push("*PEDIDO MAYORISTA UONNI*");
  lines.push(`Fecha: ${fecha}`);
  lines.push(sep);
  lines.push("*DATOS DEL COMPRADOR*");

  if (nombre) lines.push(`Nombre: ${nombre}`);
  if (negocio) lines.push(`Negocio: ${negocio}`);
  if (wa) lines.push(`WhatsApp: ${wa}`);
  if (mail) lines.push(`Email: ${mail}`);
  if (localidad) lines.push(`Localidad: ${localidad}`);

  lines.push(sep);
  lines.push("*PRODUCTOS*");

  const keys = Object.keys(cart);
  for (let i = 0; i < keys.length; i++) {
    const item = cart[keys[i]];
    lines.push(`- ${item.name}`);
    lines.push(`  ${item.qty} u. x ${fmt(item.price)} = ${fmt(item.price * item.qty)}`);
  }

  lines.push(sep);
  lines.push(`*TOTAL: ${fmt(total)}*`);

  return lines.join("\n");
}

/**
 * Copia el resumen del pedido generado en el portapapeles.
 */
function copiarResumen() {
  const txt = buildTextResumen();
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById("btn-copiar");
    btn.textContent = "Copiado!";
    setTimeout(() => {
      btn.textContent = "Copiar";
    }, 2000);
  }).catch(() => {
    alert("No se pudo copiar automaticamente.");
  });
}


/* ==========================================================
   WHATSAPP
   ========================================================== */

/**
 * Abre una nueva ventana hacia WhatsApp enviando el texto formateado del pedido.
 */
function enviarWA() {
  const txt = buildTextResumen();
  window.open(`https://wa.me/541121733672?text=${encodeURIComponent(txt)}`, "_blank");
}


/* ==========================================================
   EVENTOS
   ========================================================== */

/**
 * Configuración de eventos para navegación mediante arrastre (drag scroll) en la barra de categorías.
 */
const slider = document.querySelector('.cats-scroll');

if (slider) {
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  });
}


/* ==========================================================
   INICIALIZACIÓN
   ========================================================== */

loadCart();
loadClientData();
updateTotal(0);