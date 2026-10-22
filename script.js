// =========================================================
// KLAUVARA · interacciones
// =========================================================

// Pega aquí la URL de tu Apps Script (termina en /exec).
// Mientras no la pegues, el formulario avisa de que aún no está disponible.
const SCRIPT_URL = 'PEGA_AQUI_LA_URL_DE_TU_APPS_SCRIPT';

document.documentElement.classList.add('js');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cabecera: transparente sobre la portada, sólida al bajar
const top = document.querySelector('.top');
const onScroll = () => top.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.6);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menú en móvil
const btn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');
btn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
  btn.textContent = open ? 'Cerrar' : 'Menú';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  btn.setAttribute('aria-expanded', false);
  btn.textContent = 'Menú';
}));

// Palabra que rota en el titular
const words = document.querySelectorAll('.rot__word');
if (words.length && !reduce) {
  let i = 0;
  setInterval(() => {
    const cur = words[i];
    cur.classList.remove('is-on'); cur.classList.add('is-out');
    setTimeout(() => cur.classList.remove('is-out'), 650);
    i = (i + 1) % words.length;
    words[i].classList.add('is-on');
  }, 2600);
}

// Aparición al hacer scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('in'));
}

// Manifiesto: las palabras se encienden al hacer scroll
const mt = document.querySelector('[data-words]');
if (mt) {
  mt.innerHTML = mt.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span> `).join('');
  const ws = mt.querySelectorAll('.w');
  const paint = () => {
    const r = mt.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * ws.length);
    ws.forEach((w, k) => w.classList.toggle('on', k < n));
  };
  if (reduce) ws.forEach(w => w.classList.add('on'));
  else { paint(); window.addEventListener('scroll', paint, { passive: true }); }
}

// Copiar email
const toast = document.querySelector('.toast');
document.querySelectorAll('button.copy').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast.textContent = 'Email copiado'; }
  catch { toast.textContent = 'Mantén pulsado el email para copiarlo'; }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}));

// Formulario de "mi historia"
const form = document.getElementById('form-guia');
if (form) {
  const msg = form.querySelector('.form__msg');
  const done = document.querySelector('.form__done');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';
    const d = new FormData(form);
    const nombre = (d.get('nombre') || '').trim();
    const email = (d.get('email') || '').trim();
    if (!nombre) { msg.textContent = 'Dime tu nombre.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Revisa el email, parece que no está bien.'; return; }
    if (!d.get('acepto')) { msg.textContent = 'Marca la casilla para que te la pueda enviar.'; return; }
    if (d.get('web')) return; // bots
    if (!SCRIPT_URL.startsWith('https://')) { msg.textContent = 'Estoy terminando de prepararla. Vuelve en unos días.'; return; }
    const button = form.querySelector('button');
    button.disabled = true; button.textContent = 'Enviando…';
    const body = new URLSearchParams({ nombre, email, origen: new URLSearchParams(location.search).get('o') || 'web' });
    try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body }); } catch (err) {}
    done.querySelector('.form__name').textContent = nombre.split(' ')[0];
    form.hidden = true;
    done.hidden = false;
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
