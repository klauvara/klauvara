// =========================================================
// KLAUVARA · interacciones
// =========================================================

// Pega aquí la URL de tu Apps Script (termina en /exec).
// Mientras no la pegues, la guía se descarga igual pero los emails no se guardan.
const SCRIPT_URL = 'PEGA_AQUI_LA_URL_DE_TU_APPS_SCRIPT';

document.documentElement.classList.add('js');

// Menú en móvil
const btn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');
if (btn && nav) {
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
}

// Aparición al hacer scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('in'));
}

// Copiar email
const toast = document.querySelector('.toast');
document.querySelectorAll('button.copy').forEach(b => b.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(b.dataset.copy);
    toast.textContent = 'Email copiado';
  } catch {
    toast.textContent = 'No se pudo copiar. Mantén pulsado el email para copiarlo.';
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}));

// Formulario de la guía
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
    if (!d.get('acepto')) { msg.textContent = 'Tienes que aceptar para recibir la guía.'; return; }
    if (d.get('web')) return; // bots

    const button = form.querySelector('button');
    button.disabled = true; button.textContent = 'Enviando…';
    if (SCRIPT_URL.startsWith('https://')) {
      const body = new URLSearchParams({ nombre, email, origen: new URLSearchParams(location.search).get('o') || 'web' });
      try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body }); } catch (err) {}
    } else {
      done.querySelector('p').textContent = 'Aquí la tienes.';
    }
    done.querySelector('.form__name').textContent = nombre.split(' ')[0];
    form.hidden = true;
    done.hidden = false;
  });
}

// Año del pie
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
