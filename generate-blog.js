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
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function isoDate(str) {
  return str ? new Date(str).toISOString() : new Date().toISOString();
}

function initials(name = 'DU') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

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
      { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${SITE_BASE}/blog` },
      { '@type': 'ListItem', position: 3, name: a.title, item: url },
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preload" href="/navbar.html" as="fetch" crossorigin>
<link rel="preload" href="/footer.html" as="fetch" crossorigin>

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
<meta property="og:locale"      content="en_US">
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
@media(max-width:600px){.article-wrap{padding:1.5rem 1.25rem 4rem}}
</style>
</head>
<body>

<div data-include="/navbar.html"></div>

<article class="article-wrap" itemscope itemtype="https://schema.org/Article">
  <a href="/blog" class="back-link">← Back to blog</a>

  ${coverHtml}

  <div class="modal-meta">
    <span class="modal-cat">${a.category}</span>
    <span class="modal-date">${formatDate(a.date)}</span>
    <span class="modal-read">${a.read_time} min read</span>
  </div>

  <h1 class="article-title" itemprop="headline">${a.title}</h1>
  ${a.subtitle ? `<p class="modal-subtitle" itemprop="description">${a.subtitle}</p>` : ''}

  <div class="article-content" itemprop="articleBody">
    ${a.content || '<p>Content not available.</p>'}
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
    <span>Share</span>
    <button class="share-btn" onclick="navigator.clipboard.writeText(location.href).then(()=>showToast('Link copied!'))">🔗 Copy link</button>
    <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(a.title)}" target="_blank" rel="noopener">𝕏 Twitter</a>
    <a class="share-btn" href="https://wa.me/?text=${encodeURIComponent(a.title + ' ' + url)}" target="_blank" rel="noopener">💬 WhatsApp</a>
  </div>

  <div class="modal-cta">
    <h3>Ready to build scripts that stop the scroll?</h3>
    <p>Analyze your video for free and discover your Viral Score. Then create with DUPY.</p>
    <a href="/">Try DUPY for free →</a>
  </div>
</article>

<div data-include="/footer.html"></div>

<script>
function showToast(msg){let t=document.getElementById('t');if(!t){t=document.createElement('div');t.id='t';t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:.7rem 1.5rem;border-radius:8px;font-size:.875rem;font-weight:600;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;z-index:999';document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)'},2500)}
</script>
<script src="/include.js"></script>
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
  const indexData = [];
  for (const a of articles) {
    const slug = slugify(a.title);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), articleTemplate(a, slug), 'utf8');
    console.log(`  ✍️  blog/${slug}.html`);
    slugs.push({ slug, title: a.title });

    // Dati leggeri per la griglia di blog.html: niente "content" qui,
    // il testo completo vive solo dentro la pagina statica blog/{slug}.html
    indexData.push({
      id: a.id,
      slug,
      title: a.title,
      subtitle: a.subtitle || '',
      category: a.category,
      date: a.date,
      read_time: a.read_time,
      cover: a.cover || '',
      tags: a.tags || [],
      author: a.author || 'Team DUPY',
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'articles-index.json'), JSON.stringify(indexData, null, 2), 'utf8');
  console.log(`  🗂  blog/articles-index.json (${indexData.length} articoli)`);

  // Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_BASE}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
${slugs.map(({ slug }) =>
  `  <url><loc>${SITE_BASE}/blog/${slug}.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(path.dirname(OUT_DIR), 'sitemap-blog.xml'), sitemap, 'utf8');
  console.log('\n🗺  sitemap-blog.xml generata');
  console.log('🎉 Done!');
})();
