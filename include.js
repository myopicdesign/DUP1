document.querySelectorAll('[data-include]').forEach(el => {
  fetch(el.getAttribute('data-include'))
    .then(r => r.text())
    .then(html => el.innerHTML = html);
});
