const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'dist');
const SITE_URL = 'https://anna-nevolina.tuqo.ru';

function rm(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function ensure(p) { fs.mkdirSync(p, { recursive: true }); }
function readJSON(file) { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
function write(file, content) { ensure(path.dirname(path.join(out, file))); fs.writeFileSync(path.join(out, file), content, 'utf8'); }
function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeUrl(value = '') {
  const url = String(value).trim();
  if (!url) return '';
  if (/^(https?:|mailto:|tel:|\/)/i.test(url)) return url;
  return '/' + url.replace(/^\.\//, '');
}
function md(value = '') {
  const text = String(value || '').replace(/\r/g, '').trim();
  if (!text) return '';
  return text.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('### ')) return `<h3>${inline(block.slice(4))}</h3>`;
    if (block.startsWith('## ')) return `<h2>${inline(block.slice(3))}</h2>`;
    if (block.startsWith('# ')) return `<h1>${inline(block.slice(2))}</h1>`;
    if (block.startsWith('> ')) return `<div class="quote">${inline(block.replace(/^> /, ''))}</div>`;
    const lines = block.split('\n');
    if (lines.every(line => /^[-*] /.test(line))) return `<ul>${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${inline(block).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
function inline(value) {
  return esc(value)

    // YouTube
    .replace(
      /(^|\s)https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)(?:\?[^\s]*)?/g,
      '$1<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/$2" title="Видео YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'
    )

    // Rutube
    .replace(
      /(^|\s)https?:\/\/rutube\.ru\/video\/([A-Za-z0-9]+)\/?(?:\?[^\s]*)?/g,
      '$1<div class="video-wrapper"><iframe src="https://rutube.ru/play/embed/$2" title="Видео Rutube" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
    )

    // VK Видео
    .replace(
      /(^|\s)https?:\/\/vk\.com\/video(-?\d+_\d+)(?:\?[^\s]*)?/g,
      '$1<div class="video-wrapper"><iframe src="https://vk.com/video_ext.php?oid=$2" title="Видео VK" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
    )

    // Изображение из Markdown
    .replace(
      /!\[(.*?)\]\((https?:\/\/[^)]+)\)/g,
      '<img class="inline-image" src="$2" alt="$1" loading="lazy">'
    )

    // Жирный текст
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Курсив
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Обычные ссылки
    .replace(
      /\[(.+?)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}
function imageSrc(item) { return item?.image || item?.image_url || ''; }
function materialCard(item, labels) {
  if (!item) return '';
  const image = imageSrc(item) ? `<img class="material-image" src="${esc(imageSrc(item))}" alt="${esc(item.image_alt || item.title || labels.imageAlt)}" loading="lazy">` : '';
  const doc = item.document_url ? `<a class="material-link" href="${esc(item.document_url)}" target="_blank" rel="noopener noreferrer">📎 ${esc(item.document_label || labels.openDocument)}</a>` : '';
  return `<article class="material-card">${image}<div class="material-content">${item.date ? `<div class="post-date">${esc(item.date)}</div>` : ''}${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.text ? `<div class="material-text">${md(item.text)}</div>` : ''}${doc}</div></article>`;
}
function materialsBlock(items, title, labels) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<section class="materials-section"><h2>${esc(title)}</h2><div class="materials-grid">${items.map(item => materialCard(item, labels)).join('')}</div></section>`;
}
function loadPosts() {
  const dir = path.join(root, 'content/posts');
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let meta = {}, body = raw;
    if (match) {
      match[1].split('\n').forEach(line => {
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if (m) meta[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
      });
      body = match[2];
    }
    posts.push({ ...meta, body, slug: file.replace(/\.md$/, '') });
  }
  return posts.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

rm(out);
ensure(path.join(out, 'blog'));
ensure(path.join(out, 'images'));

const site = readJSON('content/site.json');
const pages = readJSON('content/pages.json');
const posts = loadPosts();

if (site.site_url && site.site_url.replace(/\/$/, '') !== SITE_URL) {
  throw new Error(`site_url must be ${SITE_URL}`);
}

const labels = {
  imageAlt: site.labels?.image_alt || 'Изображение материала',
  openDocument: site.labels?.open_document || 'Открыть документ',
  materials: site.labels?.materials || 'Материалы',
  pageMaterials: site.labels?.page_materials || 'Материалы раздела',
  additionalMaterials: site.labels?.additional_materials || 'Дополнительные материалы',
  portfolioAdd: site.labels?.portfolio_add || 'Добавить материалы',
  readMore: site.labels?.read_more || 'Читать →',
  blogEmptyTitle: site.labels?.blog_empty_title || 'Блог только начинается',
  blogEmptyText: site.labels?.blog_empty_text || 'Здесь будут появляться заметки о детях, родном крае, проектах и педагогических находках.',
  adminButton: site.labels?.admin_button || 'Открыть редактор'
};

const nav = Array.isArray(site.nav) ? site.nav.map(item => [item.link, item.label]) : [];
const homePhoto = site.home_photo || site.home_photo_url || '';

function layout({ title, description, body, current = '', image = '', canonicalPath = current || '' }) {
  const cleanPath = String(canonicalPath || '').replace(/^\//, '');
  const canonical = cleanPath && cleanPath !== 'index.html'
    ? `${SITE_URL}/${cleanPath}`
    : `${SITE_URL}/`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.job_title || 'Воспитатель',
    description,
    url: canonical
  };
  if (image) schema.image = image;
  if (site.organization) schema.worksFor = { '@type': 'EducationalOrganization', name: site.organization };
  const verification = `${site.google_verification ? `<meta name="google-site-verification" content="${esc(site.google_verification)}">` : ''}${site.yandex_verification ? `<meta name="yandex-verification" content="${esc(site.yandex_verification)}">` : ''}`;
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="keywords" content="${esc(site.site_keywords || '')}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}${verification}<link rel="stylesheet" href="/styles.css"><link rel="icon" href="data:,"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><header class="header"><div class="wrap"><a class="brand" href="/"><span class="mark">А</span><span><b>${esc(site.name)}</b><small>${esc(site.tagline)}</small></span></a><button class="menu-toggle" aria-label="Меню" aria-expanded="false">☰</button><nav class="nav">${nav.map(([url, label]) => `<a class="${current === url ? 'active' : ''}" href="${esc(safeUrl(url))}">${esc(label)}</a>`).join('')}</nav></div></header>${body}<footer class="footer"><div class="wrap">${esc(site.footer)}</div></footer><script src="/script.js"></script></body></html>`;
}
function hero(label, title, intro) {
  return `<section class="page-hero"><div class="wrap"><div class="breadcrumbs"><a href="/">${esc(site.labels?.home || 'Главная')}</a> → ${esc(label)}</div><h1>${esc(title)}</h1><p>${esc(intro || '')}</p></div></section>`;
}
function save(name, html) { write(name, html); }

for (const file of ['styles.css', 'script.js', 'robots.txt']) write(file, fs.readFileSync(path.join(root, file), 'utf8'));
write('admin/index.html', fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8'));
write('admin/config.yml', fs.readFileSync(path.join(root, 'admin/config.yml'), 'utf8'));
if (fs.existsSync(path.join(root, 'static/images/uploads'))) fs.cpSync(path.join(root, 'static/images/uploads'), path.join(out, 'images/uploads'), { recursive: true });

const cards = (pages.cards || []).map(card => `<a class="card" href="${esc(safeUrl(card.link))}"><span>${esc(card.kicker)}</span><h3>${esc(card.title)}</h3><div>${md(card.text)}</div>${materialsBlock(card.materials, labels.materials, labels)}</a>`).join('');
const home = `<main><section class="hero"><div class="wrap hero-grid"><div><div class="eyebrow">${esc(site.home_eyebrow || 'Педагогическое портфолио · Южный Урал')}</div><h1>${esc(site.home_title)}</h1><div class="lead">${md(site.home_intro)}</div><div class="hero-actions"><a class="button" href="/about.html">${esc(site.home_about_button_label || 'Познакомиться')}</a><a class="button ghost" href="/blog.html">${esc(site.home_blog_button_label || 'Блог')}</a><a class="button ghost" href="/portfolio.html">${esc(site.home_portfolio_button_label || 'Портфолио')}</a></div></div><div class="hero-card hero-photo-card">${homePhoto ? `<img class="educator-photo" src="${esc(homePhoto)}" alt="${esc(site.home_photo_alt || site.name)}">` : `<div class="photo-placeholder">${esc(site.home_photo_placeholder || 'Здесь будет фотография воспитателя')}</div>`}<div class="sun">✦</div><h3>${esc(site.home_card_title)}</h3><div>${md(site.home_card_text)}</div></div></div></section><section class="content"><div class="wrap prose"><div class="section-kicker">${esc(site.philosophy_kicker || 'Педагогическая философия')}</div><h2>${esc(site.philosophy_title)}</h2><div>${md(site.philosophy_text)}</div><div class="quote">${esc(site.quote)}</div><div class="cards">${cards}</div>${materialsBlock(site.home_materials, site.labels?.home_materials || 'Материалы на главной', labels)}</div></section></main>`;
save('index.html', layout({ title: site.home_title, description: site.home_description, body: home, current: 'index.html', image: homePhoto, canonicalPath: '' }));

for (const page of pages.pages || []) {
  const body = `<main>${hero(page.title, page.title, page.intro)}<section class="content"><div class="wrap prose">${page.cover_image ? `<img class="page-cover" src="${esc(page.cover_image)}" alt="${esc(page.cover_image_alt || page.title)}">` : ''}${md(page.body)}${Array.isArray(page.tags) && page.tags.length ? `<div class="tag-row">${page.tags.map(tag => `<span class="pill">${esc(tag)}</span>`).join('')}</div>` : ''}${materialsBlock(page.materials, labels.pageMaterials, labels)}</div></section></main>`;
  save(`${page.slug}.html`, layout({ title: page.title, description: page.description, body, current: `${page.slug}.html`, image: page.cover_image, canonicalPath: `${page.slug}.html` }));
}

const portfolioTitle = site.portfolio_page?.title || 'Портфолио';
const portfolioIntro = site.portfolio_page?.intro || 'Путь педагога — это не витрина, а следы роста, поиска и совместных открытий.';
const portfolioCards = (pages.portfolio || []).map(album => `<a class="card" href="/${esc(album.slug)}.html"><span>${esc(album.kicker)}</span><h3>${esc(album.title)}</h3><div>${md(album.text)}</div></a>`).join('');
save('portfolio.html', layout({ title: `${portfolioTitle} — ${site.name}`, description: site.portfolio_page?.description || portfolioIntro, body: `<main>${hero(site.labels?.portfolio || 'Портфолио', portfolioTitle, portfolioIntro)}<section class="content"><div class="wrap prose"><div class="cards">${portfolioCards}</div></div></section></main>`, current: 'portfolio.html', canonicalPath: 'portfolio.html' }));

for (const album of pages.portfolio || []) {
  const body = `<main>${hero(site.labels?.portfolio || 'Портфолио', album.title, album.text)}<section class="content"><div class="wrap prose">${album.cover_image ? `<img class="page-cover" src="${esc(album.cover_image)}" alt="${esc(album.cover_image_alt || album.title)}">` : ''}<h2>${esc(album.gallery_title)}</h2><div>${md(album.gallery_text)}</div>${materialsBlock(album.materials, labels.pageMaterials, labels)}<a class="button" href="/admin/">${esc(labels.portfolioAdd)}</a></div></section></main>`;
  save(`${album.slug}.html`, layout({ title: album.title, description: album.text, body, current: 'portfolio.html', canonicalPath: `${album.slug}.html`, image: album.cover_image }));
}

const blogTitle = site.blog_page?.title || 'Блог';
const blogIntro = site.blog_page?.intro || 'Место для живых заметок, проектов, фотографий и педагогических открытий.';
const postCards = posts.length ? posts.map(post => `<article class="post-card">${post.date ? `<div class="post-date">${esc(post.date)}</div>` : ''}<h2><a href="/blog/${esc(post.slug)}.html">${esc(post.title || post.slug)}</a></h2><div>${md(post.description || '')}</div><a class="readmore" href="/blog/${esc(post.slug)}.html">${esc(labels.readMore)}</a></article>`).join('') : `<div class="empty-gallery"><h2>${esc(labels.blogEmptyTitle)}</h2><p>${esc(labels.blogEmptyText)}</p><a class="button" href="/admin/">${esc(labels.adminButton)}</a></div>`;
save('blog.html', layout({ title: `${blogTitle} — ${site.name}`, description: site.blog_page?.description || blogIntro, body: `<main>${hero(site.labels?.blog || 'Блог', blogTitle, blogIntro)}<section class="content"><div class="wrap post-list">${postCards}</div></section></main>`, current: 'blog.html', canonicalPath: 'blog.html' }));

for (const post of posts) {
  const postBody = `<main>${hero(site.labels?.blog || 'Блог', post.title || '', post.description || '')}<section class="content"><div class="wrap prose">${post.image ? `<img class="post-image" src="${esc(post.image)}" alt="${esc(post.title || '')}">` : ''}${md(post.body)}${post.document_url ? `<p><a class="button" href="${esc(post.document_url)}" target="_blank" rel="noopener noreferrer">📎 ${esc(post.document_label || labels.openDocument)}</a></p>` : ''}${materialsBlock(post.materials, labels.additionalMaterials, labels)}</div></section></main>`;
  save(`blog/${post.slug}.html`, layout({ title: post.title || 'Публикация', description: post.description || '', body: postBody, current: 'blog.html', canonicalPath: `blog/${post.slug}.html`, image: post.image }));
}

const urls = ['/', ...(pages.pages || []).map(p => `/${p.slug}.html`), '/portfolio.html', ...(pages.portfolio || []).map(p => `/${p.slug}.html`), '/blog.html', ...posts.map(p => `/blog/${p.slug}.html`)].map(url => url === '/index.html' ? '/' : url);
const uniqueUrls = [...new Set(urls)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map(url => `  <url><loc>${SITE_URL}${url}</loc></url>`).join('\n')}\n</urlset>\n`;
write('sitemap.xml', sitemap);
