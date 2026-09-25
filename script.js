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

// Copiar email
const toast = document.querySelector('.toast');
document.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(b.dataset.copy);
    toast.textContent = 'Email copiado';
  } catch {
    toast.textContent = 'No se pudo copiar. Mantén pulsado el email para copiarlo.';
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}));

// Año del pie
document.getElementById('year').textContent = new Date().getFullYear();
