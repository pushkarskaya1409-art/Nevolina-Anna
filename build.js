const fs=require('fs'), path=require('path');
const root=__dirname, out=path.join(root,'dist');
function rm(p){if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true})}
rm(out); fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(path.join(out,'blog'),{recursive:true});
function readJSON(f){return JSON.parse(fs.readFileSync(path.join(root,f),'utf8'))}
function esc(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function md(s=''){
  return s.replace(/\r/g,'').split(/\n\n+/).map(block=>{
    block=block.trim(); if(!block)return '';
    if(block.startsWith('### ')) return '<h3>'+inline(block.slice(4))+'</h3>';
    if(block.startsWith('## ')) return '<h2>'+inline(block.slice(3))+'</h2>';
    if(block.startsWith('# ')) return '<h1>'+inline(block.slice(2))+'</h1>';
    if(block.startsWith('> ')) return '<div class="quote">'+inline(block.replace(/^> /,''))+'</div>';
    if(block.split('\n').every(x=>/^[-*] /.test(x))) return '<ul>'+block.split('\n').map(x=>'<li>'+inline(x.slice(2))+'</li>').join('')+'</ul>';
    return '<p>'+inline(block).replace(/\n/g,'<br>')+'</p>';
  }).join('');
}
function inline(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')}
const pages=readJSON('content/pages.json');
const site=readJSON('content/site.json');
const nav=[['index.html','Главная'],['about.html','Обо мне'],['colleagues.html','Коллегам'],['parents.html','Родителям'],['children.html','Дети'],['environment.html','Среда'],['portfolio.html','Портфолио'],['blog.html','Блог']];
function layout(title,desc,body,current=''){
 return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="data:,"></head><body><header class="header"><div class="wrap"><a class="brand" href="/index.html"><span class="mark">А</span><span><b>${esc(site.name)}</b><small>${esc(site.tagline)}</small></span></a><button class="menu-toggle" aria-label="Меню">☰</button><nav class="nav">${nav.map(([u,n])=>`<a class="${current===u?'active':''}" href="/${u}">${n}</a>`).join('')}</nav></div></header>${body}<footer class="footer"><div class="wrap">${esc(site.footer)}</div></footer><script src="/script.js"></script></body></html>`}
function hero(label,title,intro){return `<section class="page-hero"><div class="wrap"><div class="breadcrumbs"><a href="/index.html">Главная</a> → ${esc(label)}</div><h1>${esc(title)}</h1><p>${esc(intro)}</p></div></section>`}
function save(name,html){fs.writeFileSync(path.join(out,name),html)}
// copy static assets
for(const f of ['styles.css','script.js','robots.txt']) fs.copyFileSync(path.join(root,f),path.join(out,f)); fs.cpSync(path.join(root,'admin'),path.join(out,'admin'),{recursive:true});
fs.mkdirSync(path.join(out,'images'),{recursive:true});
if(fs.existsSync(path.join(root,'static/images/uploads'))) fs.cpSync(path.join(root,'static/images/uploads'),path.join(out,'images/uploads'),{recursive:true});
// Home
let h=`<main><section class="hero"><div class="wrap hero-grid"><div><div class="eyebrow">Педагогическое портфолио · Южный Урал</div><h1>${esc(site.home_title)}</h1><p class="lead">${esc(site.home_intro)}</p><div class="hero-actions"><a class="button" href="/about.html">Познакомиться</a><a class="button ghost" href="/blog.html">Читать блог</a></div></div><div class="hero-card"><div class="sun">✦</div><h3>${esc(site.home_card_title)}</h3><p>${esc(site.home_card_text)}</p></div></div></section><section class="content"><div class="wrap prose"><div class="section-kicker">Педагогическая философия</div><h2>${esc(site.philosophy_title)}</h2><p>${md(site.philosophy_text)}</p><div class="quote">${esc(site.quote)}</div><div class="cards">${pages.cards.map(c=>`<a class="card" href="/${c.link}"><span>${esc(c.kicker)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></a>`).join('')}</div></div></section></main>`;
save('index.html',layout(site.home_title,site.home_description,h,'index.html'));
// pages
for(const p of pages.pages){const body=`<main>${hero(p.title,p.title,p.intro)}<section class="content"><div class="wrap prose">${md(p.body)}${p.tags?.length?`<div class="tag-row">${p.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}</div></section></main>`; save(p.slug+'.html',layout(p.title,p.description,body,p.slug+'.html'));}
// portfolio
const cards=pages.portfolio.map(a=>`<a class="card" href="/${a.slug}.html"><span>${esc(a.kicker)}</span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></a>`).join('');
save('portfolio.html',layout('Портфолио — Анна Неволина','Педагогическое портфолио воспитателя детского сада: образование, повышение квалификации, достижения и достижения воспитанников.',`<main>${hero('Портфолио','Портфолио','Путь педагога — это не витрина, а следы роста, поиска и совместных открытий.')}<section class="content"><div class="wrap prose"><div class="cards">${cards}</div></div></section></main>`,'portfolio.html'));
for(const a of pages.portfolio){save(a.slug+'.html',layout(a.title,a.text,`<main>${hero('Портфолио',a.title,a.text)}<section class="content"><div class="wrap prose"><div class="empty-gallery"><h2>${esc(a.gallery_title)}</h2><p>${esc(a.gallery_text)}</p><a class="button" href="/admin/">Добавить материалы</a></div></div></section></main>`,'portfolio.html'));}
// blog
const postsDir=path.join(root,'content/posts'); let posts=[]; if(fs.existsSync(postsDir)) for(const f of fs.readdirSync(postsDir).filter(f=>f.endsWith('.md'))){const raw=fs.readFileSync(path.join(postsDir,f),'utf8'); const m=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); let meta={},body=''; if(m){m[1].split('\n').forEach(l=>{const x=l.match(/^([^:]+):\s*(.*)$/);if(x)meta[x[1].trim()]=x[2].trim().replace(/^['"]|['"]$/g,'')});body=m[2]} else body=raw; posts.push({...meta,body,slug:f.replace(/\.md$/,'')});}
posts.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const postCards=posts.length?posts.map(p=>`<article class="post-card"><div class="post-date">${esc(p.date||'')}</div><h2><a href="/blog/${esc(p.slug)}.html">${esc(p.title||p.slug)}</a></h2><p>${esc(p.description||'')}</p><a class="readmore" href="/blog/${esc(p.slug)}.html">Читать →</a></article>`).join(''):`<div class="empty-gallery"><h2>Блог только начинается</h2><p>Здесь будут появляться заметки о детях, родном крае, проектах и педагогических находках.</p><a class="button" href="/admin/">Создать первую публикацию</a></div>`;
save('blog.html',layout('Блог — Анна Неволина','Заметки воспитателя о дошкольном детстве, Южном Урале, краеведении и педагогике.',`<main>${hero('Блог','Блог','Место для живых заметок, проектов, фотографий и педагогических открытий.')}<section class="content"><div class="wrap post-list">${postCards}</div></section></main>`,'blog.html'));
for(const p of posts){save('blog/'+p.slug+'.html',layout(p.title||'Публикация',p.description||'',`<main>${hero('Блог',p.title||'',p.description||'')}<section class="content"><div class="wrap prose">${p.image?`<img class="post-image" src="${esc(p.image)}" alt="${esc(p.title||'')}">`:''}${md(p.body)}</div></section></main>`,'blog.html'));}
// sitemap
const base='https://example.com'; let urls=['/index.html','/about.html','/colleagues.html','/parents.html','/children.html','/environment.html','/portfolio.html','/blog.html',...pages.portfolio.map(x=>'/'+x.slug+'.html'),...posts.map(x=>'/blog/'+x.slug+'.html')]; fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${base}${u}</loc></url>`).join('')+'</urlset>');
