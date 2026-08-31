#!/usr/bin/env node
/**
 * DUPY Blog – Generatore pagine statiche SEO
 * Gira in GitHub Actions, legge le variabili d'ambiente dai secrets.
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tklrhmvmdcnhgjeepnin.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_0XFGo7JQnz2qeIvIBVX2Dg_xiyAjJfe';
const SITE_BASE    = (process.env.SITE_BASE || 'https://dupy.it').replace(/\/$/, '');
const OUT_DIR      = path.join(path.dirname(fileURLToPath(import.meta.url)), 'blog');

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
};

function slugify(title = '') {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                  'luglio','agosto','settembre','ottobre','novembre','dicembre'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function isoDate(str) {
  return str ? new Date(str).toISOString() : new Date().toISOString();
}

function initials(name = 'DU') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const NAV_LOGO = `<svg width="72" height="29" viewBox="0 0 101 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M95.0104 8.88383C95.0104 9.65831 95.0104 20.2733 95.0104 21.7312C95.0104 25.0569 93.4101 26.8793 90.7583 26.8793C88.1064 26.8793 86.5061 25.0569 86.5061 21.7312C86.5061 20.2733 86.5061 9.65831 86.5061 8.88383H80.4708C80.4708 10.0683 80.4708 20.5011 80.4708 21.549C80.4708 21.6856 80.4708 21.8679 80.4708 22.0046C80.3794 25.6492 79.0534 26.8793 77.0416 26.8793C75.7157 26.8793 74.5727 26.4692 73.5211 25.9226C74.5727 24.0547 75.3042 21.5945 75.3042 18.7244C75.3042 12.9841 71.3721 8.42825 65.9312 8.42825C63.4165 8.42825 61.4962 9.24829 59.9416 10.8428L59.713 8.83827H54.1349V21.1845C54.1806 24.9658 52.6261 26.3781 50.9344 26.3781C49.2884 26.3781 47.9167 25.5581 47.9167 22.8702C47.9167 22.6424 47.9167 22.0046 47.9167 21.1845C47.9167 19.1344 47.9167 14.0319 47.9167 11.0251C47.9167 9.93166 47.9167 9.11162 47.9167 8.79271H41.8814C41.8814 8.97494 41.8814 9.84055 41.8814 11.0251C41.8814 13.9863 41.8814 18.9977 41.8814 21.0023C41.8814 21.2756 41.8814 21.549 41.8814 21.6856C41.8814 25.0114 40.2811 26.8337 37.6292 26.8337C34.9774 26.8337 33.3771 25.0114 33.3771 21.6856C33.3771 20.2278 33.3771 9.61276 33.3771 8.83827H27.3875C27.3875 9.97722 27.3875 19.18 27.3875 21.1845C27.4332 24.9658 25.8787 26.3781 24.187 26.3781C22.541 26.3781 21.1693 25.5581 21.1693 22.8702V11.0251V0H15.134V8.88383C14.2653 8.61048 13.1679 8.42825 11.842 8.42825C5.71526 8.42825 0 12.6651 0 20.6378C0 26.7426 3.9321 31.5718 9.37302 31.5718C12.5736 31.5718 14.8597 30.2506 16.5514 27.5626C18.0145 30.205 20.4835 31.5718 23.3182 31.5718C26.3816 31.5718 28.3019 30.0683 29.3536 28.4282C30.8167 30.4328 33.1028 31.5718 35.9832 31.5718C39.3667 31.5718 41.8814 30.1139 43.2988 27.6082C44.6704 30.2506 46.9565 31.5718 49.4255 31.5718C51.163 31.5718 52.9004 30.7973 54.1349 29.4305V40H60.1702V18.3144C60.1702 14.9431 62.4106 13.5763 64.8339 13.5763C67.6229 13.5763 69.6804 15.3075 69.6804 19.18C69.6347 20 69.6347 21.7312 69.0403 23.0068C68.1716 22.5057 67.2114 22.1868 66.1598 22.1868C63.7823 22.1868 62.182 23.7813 62.182 26.0592C62.182 28.5649 64.148 30.2506 67.0285 30.2506C67.0742 30.2506 67.12 30.2506 67.1657 30.2506C67.2114 30.2506 67.2114 30.2506 67.2571 30.2506C68.5374 30.2506 69.8176 29.7494 71.0063 28.8838C72.4694 30.2961 74.2526 31.6173 77.1331 31.6173C79.5106 31.6173 81.3395 30.6606 82.574 28.7472C83.9914 30.5695 86.1403 31.6173 88.8379 31.6173C91.4441 31.6173 93.5016 30.7061 94.9647 29.0661V40.0456H101V21.2301C101 18.451 101 9.93166 101 8.88383H95.0104ZM10.8818 26.4692C8.32141 26.4692 6.44681 24.5558 6.44681 20.1822C6.44681 15.3986 8.87008 13.1207 12.4821 13.1207C13.3051 13.1207 14.2196 13.2574 15.134 13.5308V21.0934V21.7312C15.134 25.0569 13.0765 26.4692 10.8818 26.4692Z" fill="black"/></svg>`;

function articleTemplate(a, slug) {
  const url         = `${SITE_BASE}/blog/${slug}.html`;
  const ogImage     = a.cover || `${SITE_BASE}/og-default.jpg`;
  const description = (a.subtitle || a.title).replace(/"/g, '&quot;');
  const title       = a.title.replace(/"/g, '&quot;');
  const tagsStr     = (a.tags || []).join(', ');
  const dateISO     = isoDate(a.date);

  const tagsHtml = (a.tags || []).length
    ? `<div class="modal-tags">${a.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}</div>`
    : '';

  const coverHtml = a.cover
    ? `<img class="modal-cover" src="${a.cover}" alt="${title}" width="820">`
    : `<div class="modal-cover-placeholder"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#6100FF" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.subtitle || a.title,
    image: ogImage,
    author: { '@type': 'Person', name: a.author || 'Team DUPY' },
    publisher: {
      '@type': 'Organization',
      name: 'DUPY',
      logo: { '@type': 'ImageObject', url: `${SITE_BASE}/logo.png` }
    },
    datePublished: dateISO,
    dateModified: a.updated_at ? new Date(a.updated_at).toISOString() : dateISO,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: tagsStr,
    articleSection: a.category,
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: SITE_BASE },
      { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${SITE_BASE}/blog.html` },
      { '@type': 'ListItem', position: 3, name: a.title, item: url },
    ]
  };

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>${a.title} – DUPY Blog</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
${tagsStr ? `<meta name="keywords" content="${tagsStr}">` : ''}

<meta property="og:type"        content="article">
<meta property="og:url"         content="${url}">
<meta property="og:title"       content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image"       content="${ogImage}">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale"      content="it_IT">
<meta property="og:site_name"   content="DUPY">
<meta property="article:published_time" content="${dateISO}">
<meta property="article:author"         content="${a.author || 'Team DUPY'}">
<meta property="article:section"        content="${a.category}">
${(a.tags || []).map(t => `<meta property="article:tag" content="${t}">`).join('\n')}

<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image"       content="${ogImage}">

<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Serif+Display:ital@1&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
:root{
  --black:#111;--white:#fff;--off:#f7f6f3;--border:#e5e3de;--muted:#999;
  --green:#6100FF;--green-dark:#4d00cc;--green-bg:#f0eaff;
  --mono:'Courier New',monospace;
  --sans:'Archivo',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
}
body{font-family:var(--sans);background:var(--white);color:var(--black);font-size:16px;line-height:1.6;overflow-x:hidden}
body::before{content:'';position:fixed;top:56px;left:0;right:0;bottom:0;background-image:radial-gradient(circle,#b0b0b0 1px,transparent 1px);background-size:24px 24px;opacity:0.4;pointer-events:none;z-index:-1}
nav{position:sticky;top:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;height:56px;background:rgba(255,255,255,0.96);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.nav-r{display:flex;align-items:center;gap:1.5rem}
.nav-link{font-size:0.875rem;color:var(--muted);text-decoration:none;transition:color .15s}
.nav-link:hover{color:var(--black)}
.nav-btn{background:var(--black);color:var(--white);padding:.45rem 1.1rem;border-radius:6px;font-size:0.875rem;font-weight:600;text-decoration:none;transition:opacity .15s}
.nav-btn:hover{opacity:.82}
.breadcrumb{max-width:820px;margin:0 auto;padding:1.25rem 2rem 0;display:flex;align-items:center;gap:.4rem;font-family:var(--mono);font-size:.68rem;letter-spacing:.06em;color:var(--muted);flex-wrap:wrap}
.breadcrumb a{color:var(--muted);text-decoration:none}.breadcrumb a:hover{color:var(--black)}
.breadcrumb span{color:var(--black);font-weight:700}
.article-wrap{max-width:820px;margin:0 auto;padding:2.5rem 2rem 6rem}
.modal-cover{width:100%;aspect-ratio:16/7;object-fit:cover;display:block;border-radius:16px;margin-bottom:2rem}
.modal-cover-placeholder{width:100%;aspect-ratio:16/7;background:linear-gradient(135deg,var(--green-bg) 0%,#e8e0ff 100%);display:flex;align-items:center;justify-content:center;border-radius:16px;margin-bottom:2rem}
.modal-meta{display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;flex-wrap:wrap}
.modal-cat{font-family:var(--mono);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;background:var(--green-bg);color:var(--green-dark);padding:.22rem .6rem;border-radius:4px;font-weight:700}
.modal-date,.modal-read{font-size:.8rem;color:var(--muted);font-family:var(--mono)}
h1.article-title{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;letter-spacing:-.04em;line-height:1.1;margin-bottom:1rem}
.modal-subtitle{font-size:1.05rem;color:#555;line-height:1.65;margin-bottom:2rem;border-bottom:1px solid var(--border);padding-bottom:1.5rem}
.article-content{font-size:.97rem;line-height:1.82;color:#333}
.article-content h2{font-size:1.4rem;font-weight:800;letter-spacing:-.03em;margin:2.25rem 0 .65rem;color:var(--black)}
.article-content h3{font-size:1.12rem;font-weight:700;margin:1.75rem 0 .5rem;color:var(--black)}
.article-content p{margin-bottom:1.1rem}
.article-content strong{font-weight:700;color:var(--black)}
.article-content ul,.article-content ol{padding-left:1.5rem;margin-bottom:1.1rem}
.article-content li{margin-bottom:.45rem}
.article-content blockquote{border-left:3px solid var(--green);padding:.75rem 1.25rem;background:var(--green-bg);margin:1.75rem 0;border-radius:0 10px 10px 0;color:#444;font-style:italic}
.modal-author-row{margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
.modal-author{display:flex;align-items:center;gap:.6rem}
.modal-author-dot{width:28px;height:28px;border-radius:50%;background:var(--green-bg);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:var(--green-dark);flex-shrink:0}
.modal-author strong{display:block;font-size:.85rem;color:var(--black)}
.modal-author span{font-size:.75rem;color:var(--muted)}
.modal-tags{display:flex;flex-wrap:wrap;gap:.35rem}
.modal-tag{font-family:var(--mono);font-size:.62rem;padding:.18rem .5rem;border-radius:4px;background:var(--off);color:var(--muted);border:1px solid var(--border)}
.share-bar{display:flex;align-items:center;gap:.5rem;margin-top:1rem;flex-wrap:wrap}
.share-bar span{font-family:var(--mono);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.share-btn{font-size:.75rem;font-weight:600;font-family:var(--sans);padding:.28rem .7rem;border-radius:5px;border:1.5px solid var(--border);background:var(--off);cursor:pointer;color:var(--muted);transition:all .12s;text-decoration:none;display:inline-block}
.share-btn:hover{border-color:var(--green);color:var(--green-dark);background:var(--green-bg)}
.modal-cta{margin:2rem 0 0;background:var(--black);color:#fff;border-radius:14px;padding:2rem;text-align:center}
.modal-cta h3{font-size:1.1rem;font-weight:700;margin-bottom:.5rem}
.modal-cta p{font-size:.875rem;color:#aaa;margin-bottom:1.25rem;line-height:1.55}
.modal-cta a{display:inline-block;background:var(--green);color:#fff;padding:.7rem 1.75rem;border-radius:8px;font-weight:700;text-decoration:none;font-size:.9rem;transition:background .15s}
.modal-cta a:hover{background:var(--green-dark)}
.back-link{display:inline-flex;align-items:center;gap:.4rem;font-size:.8rem;color:var(--muted);text-decoration:none;font-family:var(--mono);letter-spacing:.05em;margin-bottom:2rem;transition:color .15s}
.back-link:hover{color:var(--black)}
footer{border-top:1px solid var(--border);padding:2.5rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
.footer-links{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}
.footer-links a{font-size:.8rem;color:var(--muted);text-decoration:none;transition:color .15s}
.footer-links a:hover{color:var(--black)}
footer span{font-size:.75rem;color:var(--muted);font-family:var(--mono)}
@media(max-width:600px){.article-wrap{padding:1.5rem 1.25rem 4rem}}
</style>
</head>
<body>

<nav>
  <a href="../index.html" style="display:flex;align-items:center;text-decoration:none">${NAV_LOGO}</a>
  <div class="nav-r">
    <a href="../index.html#come-funziona" class="nav-link">Come funziona</a>
    <a href="../index.html#prezzi" class="nav-link">Prezzi</a>
    <a href="../blog.html" class="nav-link active">Blog</a>
    <a href="../index.html#prezzi" class="nav-btn">Prova gratis</a>
  </div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="../index.html">Home</a><span>›</span>
  <a href="../blog.html">Blog</a><span>›</span>
  <span>${a.title}</span>
</nav>

<article class="article-wrap" itemscope itemtype="https://schema.org/Article">
  <a href="../blog.html" class="back-link">← Torna al blog</a>

  ${coverHtml}

  <div class="modal-meta">
    <span class="modal-cat">${a.category}</span>
    <span class="modal-date">${formatDate(a.date)}</span>
    <span class="modal-read">${a.read_time} min di lettura</span>
  </div>

  <h1 class="article-title" itemprop="headline">${a.title}</h1>
  ${a.subtitle ? `<p class="modal-subtitle" itemprop="description">${a.subtitle}</p>` : ''}

  <div class="article-content" itemprop="articleBody">
    ${a.content || '<p>Contenuto non disponibile.</p>'}
  </div>

  <div class="modal-author-row">
    <div class="modal-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
      <div class="modal-author-dot">${initials(a.author)}</div>
      <div>
        <strong itemprop="name">${a.author || 'Team DUPY'}</strong>
        <span>Team DUPY</span>
      </div>
    </div>
    ${tagsHtml}
  </div>

  <div class="share-bar">
    <span>Condividi</span>
    <button class="share-btn" onclick="navigator.clipboard.writeText(location.href).then(()=>showToast('Link copiato!'))">🔗 Copia link</button>
    <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}" target="_blank" rel="noopener">𝕏 Twitter</a>
    <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent(a.title + ' ' + url)}" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>

  <div class="modal-cta">
    <h3>Pronto a costruire script che fermano lo scroll?</h3>
    <p>Analizza il tuo video gratis e scopri il tuo Viral Score. Poi costruisci con DUPY.</p>
    <a href="../index.html">Prova DUPY gratis →</a>
  </div>
</article>

<footer>
  <a href="../index.html" style="display:flex;align-items:center;text-decoration:none">${NAV_LOGO}</a>
  <div class="footer-links">
    <a href="../index.html#come-funziona">Come funziona</a>
    <a href="../index.html#prezzi">Prezzi</a>
    <a href="../blog.html">Blog</a>
    <a href="#">Privacy</a>
    <a href="#">Termini</a>
  </div>
  <span>© 2025 DUPY</span>
</footer>

<script>
function showToast(msg){let t=document.getElementById('t');if(!t){t=document.createElement('div');t.id='t';t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:.7rem 1.5rem;border-radius:8px;font-size:.875rem;font-weight:600;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;z-index:999';document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)'},2500)}
</script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('📡 Fetching articles from Supabase…');

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?status=eq.published&order=created_at.desc`,
    { headers: HEADERS }
  );

  if (!res.ok) {
    console.error('❌ Supabase error:', await res.text());
    process.exit(1);
  }

  const articles = await res.json();
  console.log(`✅ ${articles.length} articoli trovati`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs = [];
  for (const a of articles) {
    const slug = slugify(a.title);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), articleTemplate(a, slug), 'utf8');
    console.log(`  ✍️  blog/${slug}.html`);
    slugs.push({ slug, title: a.title });
  }

  // Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_BASE}/blog.html</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
${slugs.map(({ slug }) =>
  `  <url><loc>${SITE_BASE}/blog/${slug}.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(path.dirname(OUT_DIR), 'sitemap-blog.xml'), sitemap, 'utf8');
  console.log('\n🗺  sitemap-blog.xml generata');
  console.log('🎉 Done!');
})();
