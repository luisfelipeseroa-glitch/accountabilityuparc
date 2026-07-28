/* ══════════════════════════════════════
   ACCOUNTABILITY DASHBOARD — APP.JS
   ══════════════════════════════════════ */

let SLIDES = [];
let cur = 0;
const IMG = { logo:null, bg1:null, bg2:null };

// ── Load stored images ──
['logo','bg1','bg2'].forEach(k=>{
  const v = localStorage.getItem('dash_img_'+k);
  if(v) IMG[k]=v;
});

// ── Fetch slides data ──
fetch('slides.json')
  .then(r => r.json())
  .then(data => {
    // NOVO: guarda original pra referência do admin
    window.__originalSlides = JSON.parse(JSON.stringify(data));

    // NOVO: usa versão customizada se existir
    const customData = localStorage.getItem('accountability_slides_custom');
    if(customData){
      try{ data = JSON.parse(customData); }catch(e){}
    }
     
    SLIDES = data;
    buildNav();
    go(0);
  })
  .catch(()=>{
    document.getElementById('slide').innerHTML='<div class="cover-content"><div class="c-line1">Erro</div><div class="c-line2">Não foi possível carregar slides.json</div></div>';
  });

// ══════════════════════════════════════
// RENDERERS by type
// ══════════════════════════════════════

const RENDER = {
  cover(d){
    return `<div class="cover-content">
      <div class="c-line1">${d.line1}</div>
      <div class="c-divider"></div>
      <div class="c-line2">${d.line2}</div>
      <div class="c-line3">${d.line3}</div>
    </div>`;
  },

  cards(d){
    const cols = d.columns||2;
    let h = `<div class="cardgrid" style="grid-template-columns:repeat(${cols},1fr);">`;
    d.cards.forEach(c=>{
      h += `<div class="card"><h4>${c.title}</h4><ul>${c.items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
    });
    return h+'</div>';
  },

  org(d){
    let h = '<div class="org">';
    d.rows.forEach((row,i)=>{
      if(i>0) h += '<div class="org-line"></div>';
      h += '<div class="org-row">';
      row.forEach(p=>{
        h += `<div class="org-card"><div class="role">${p.role}</div><div class="name">${p.name}</div></div>`;
      });
      h += '</div>';
    });
    return h+'</div>';
  },

  kpis(d){
    return d.rows.map(row=>{
      return '<div class="kpi-row">'+row.map(k=>`
        <div class="kpi">
          <div class="k-label">${k.label}</div>
          <div class="k-val">${k.value}</div>
          <div class="k-sub k-${k.status}">${k.sub}</div>
        </div>`).join('')+'</div>';
    }).join('');
  },

  table(d){
    let h = '<table class="dt"><thead><tr>';
    d.headers.forEach(th=>{ h += `<th>${th}</th>`; });
    h += '</tr></thead><tbody>';
    d.rows.forEach(row=>{
      h += '<tr>';
      row.forEach((cell,ci)=>{
        const isNum = (d.numCols||[]).includes(ci);
        const isSt = d.statusCol!==undefined && ci===d.statusCol;
        let cls = isNum?'num':'';
        if(isSt){
          cls = cell==='✓'||cell==='Concluído'?'st-ok':'';
          if(cell==='✗') cls='st-fail';
        }
        h += `<td class="${cls}">${cell}</td>`;
      });
      h += '</tr>';
    });
    return h+'</tbody></table>';
  },

  'kpis+table'(d){
    let h = '<div class="kpi-row">';
    d.kpis.forEach(k=>{
      h += `<div class="kpi"><div class="k-label">${k.label}</div><div class="k-val">${k.value}</div><div class="k-sub k-${k.status}">${k.sub}</div></div>`;
    });
    h += '</div>';
    h += RENDER.table(d);
    return h;
  },

  'kpis+cards'(d){
    let h = '<div class="kpi-row">';
    d.kpis.forEach(k=>{
      h += `<div class="kpi"><div class="k-label">${k.label}</div><div class="k-val">${k.value}</div><div class="k-sub k-${k.status}">${k.sub}</div></div>`;
    });
    h += '</div>';
    const cols = d.columns||2;
    h += `<div class="cardgrid" style="grid-template-columns:repeat(${cols},1fr);">`;
    d.cards.forEach(c=>{
      h += `<div class="card"><h4>${c.title}</h4><ul>${c.items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
    });
    h += '</div>';
    return h;
  },

  custom(d, slide){
    // Acolhimento slide — hardcoded custom layout
    if(slide.title==='Acolhimento'){
      return `
        <div class="kpi-row">
          <div class="kpi risk-red"><div class="k-label">Vermelho</div><div class="k-val">142</div><div class="k-sub">1,7%</div></div>
          <div class="kpi risk-orange"><div class="k-label">Laranja</div><div class="k-val">987</div><div class="k-sub">12,0%</div></div>
          <div class="kpi risk-yellow"><div class="k-label">Amarelo</div><div class="k-val">3.218</div><div class="k-sub">39,0%</div></div>
          <div class="kpi risk-green"><div class="k-label">Verde</div><div class="k-val">2.940</div><div class="k-sub">35,6%</div></div>
          <div class="kpi risk-blue"><div class="k-label">Azul</div><div class="k-val">960</div><div class="k-sub">11,6%</div></div>
        </div>
        <div class="cardgrid" style="grid-template-columns:1fr 1fr;">
          <div class="card"><h4>Destaques</h4><ul>
            <li>97,3% dos pacientes classificados em ≤ 5 min</li>
            <li>Pico de demanda: 18h–22h (seg e ter)</li>
            <li>Azul + Verde = 47,2% → oportunidade de direcionamento para APS</li>
          </ul></div>
          <div class="card"><h4>Ações</h4><ul>
            <li>Articulação com CF do território para redirecionar Azul/Verde</li>
            <li>Painel de fluxo em tempo real implantado</li>
          </ul></div>
        </div>`;
    }
    return '<div class="cover-content"><div class="c-line2">Slide personalizado</div></div>';
  }
};

// ══════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════

function buildNav(){
  const nav = document.getElementById('nav');
  const groups = {};
  SLIDES.forEach((s,i)=>{
    if(!groups[s.group]) groups[s.group] = [];
    groups[s.group].push({...s, idx:i});
  });

  let html = '';
  let gn = 0;
  for(const [name, items] of Object.entries(groups)){
    gn++;
    html += `<div class="nav-group open" data-group="${name}">
      <div class="g-head" onclick="toggleGroup(this)">
        <span><span class="num">${String(gn).padStart(2,'0')}</span>${name}</span>
        <span class="car">▶</span>
      </div>
      <div class="g-items">`;
    items.forEach(s=>{
      html += `<div class="g-item" data-idx="${s.idx}" onclick="go(${s.idx})">${s.title}</div>`;
    });
    html += '</div></div>';
  }
  nav.innerHTML = html;
}

function toggleGroup(el){
  el.closest('.nav-group').classList.toggle('open');
}

function go(i){
  if(i<0||i>=SLIDES.length) return;
  cur = i;

  const s = SLIDES[cur];
  const sl = document.getElementById('slide');

  // Background
  const bgKey = cur%2===0?'bg1':'bg2';
  sl.style.backgroundImage = IMG[bgKey]?`url(${IMG[bgKey]})`:'none';

  // Animation
  sl.classList.remove('slide-enter');
  void sl.offsetWidth; // reflow
  sl.classList.add('slide-enter');

  // Render content
  const renderer = RENDER[s.type] || RENDER.custom;
  const bodyHTML = renderer(s.data, s);

  sl.innerHTML = `
    <div class="diamonds"><svg viewBox="0 0 200 200"><polygon points="100,10 190,100 100,190 10,100" fill="none" stroke="var(--gold)" stroke-width="0.5"/><polygon points="100,40 160,100 100,160 40,100" fill="none" stroke="var(--gold)" stroke-width="0.3"/></svg></div>
    <div class="brand"><span class="pill" id="brand-pill">${document.getElementById('adm-pill')?document.getElementById('adm-pill').value:'UPA Rocinha'}</span></div>
    <div class="s-head"><div class="eyebrow">${s.eyebrow}</div><h2>${s.heading}</h2></div>
    <div class="s-body">${bodyHTML}</div>
    ${s.source?`<div class="s-source">${s.source}</div>`:''}
  `;

  // Logo
  const logoArea = document.getElementById('logo-area');
  if(IMG.logo){
    logoArea.innerHTML = `<img src="${IMG.logo}" alt="Logo">`;
  }

  // Update nav
  document.querySelectorAll('.g-item').forEach(el=>{
    el.classList.toggle('active', parseInt(el.dataset.idx)===cur);
  });

  // Progress
  const pct = ((cur+1)/SLIDES.length*100).toFixed(0);
  document.getElementById('pbar').style.width = pct+'%';

  // Crumb
  document.getElementById('crumb').innerHTML = `${s.group} › <b>${s.title}</b>`;

  // Counter
  const counter = document.getElementById('slide-counter');
  if(counter) counter.textContent = `${cur+1} / ${SLIDES.length}`;

  // Buttons
  document.getElementById('btnP').disabled = cur===0;
  document.getElementById('btnN').disabled = cur===SLIDES.length-1;

  // Count-up animation for KPI values
  setTimeout(()=>{
    sl.querySelectorAll('.k-val').forEach(el=>{
      const text = el.textContent;
      const num = parseFloat(text.replace(/[^\d.,]/g,'').replace(',','.'));
      if(!isNaN(num) && num > 0 && num < 100000){
        animateValue(el, 0, num, text, 600);
      }
    });
  }, 100);
}

function animateValue(el, start, end, originalText, duration){
  const prefix = originalText.match(/^[^\d]*/)[0];
  const suffix = originalText.match(/[^\d.,]*$/)[0];
  const hasComma = originalText.includes(',');
  const startTime = performance.now();

  function update(currentTime){
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed/duration, 1);
    const eased = 1 - Math.pow(1-progress, 3); // ease-out cubic
    const current = start + (end-start)*eased;

    if(progress < 1){
      let display;
      if(hasComma){
        display = current.toFixed(1).replace('.',',');
      } else if(end === Math.floor(end)){
        display = Math.floor(current).toLocaleString('pt-BR');
      } else {
        display = current.toFixed(1).replace('.',',');
      }
      el.textContent = prefix + display + suffix;
      requestAnimationFrame(update);
    } else {
      el.textContent = originalText;
    }
  }
  requestAnimationFrame(update);
}

function next(){ go(cur+1); }
function prev(){ go(cur-1); }

// ══════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════

document.addEventListener('keydown', e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;

  switch(e.key){
    case 'ArrowRight': case 'ArrowDown': next(); e.preventDefault(); break;
    case 'ArrowLeft': case 'ArrowUp': prev(); e.preventDefault(); break;
    case 'Escape':
      if(document.body.classList.contains('fullscreen')){
        toggleFullscreen();
      } else if(document.getElementById('admin-panel').classList.contains('open')){
        toggleAdmin();
      }
      e.preventDefault();
      break;
    case 'f': case 'F':
      if(!e.ctrlKey && !e.metaKey) toggleFullscreen();
      break;
  }
});

// ══════════════════════════════════════
// FULLSCREEN
// ══════════════════════════════════════

function toggleFullscreen(){
  document.body.classList.toggle('fullscreen');
  const btn = document.getElementById('btnFS');
  if(btn){
    btn.textContent = document.body.classList.contains('fullscreen') ? '✕ Sair' : '⛶ Apresentar';
  }
}

// ══════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════

function toggleAdmin(){
  document.getElementById('admin-panel').classList.toggle('open');
  document.getElementById('admin-overlay').classList.toggle('show');
}

function handleImg(input, prevId, key){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    IMG[key] = e.target.result;
    const prev = document.getElementById(prevId);
    prev.src = e.target.result;
    prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveAdmin(){
  // Save images
  ['logo','bg1','bg2'].forEach(k=>{
    if(IMG[k]) localStorage.setItem('dash_img_'+k, IMG[k]);
  });

  // Save text overrides
  const eyebrow = document.getElementById('adm-eyebrow').value;
  const title = document.getElementById('adm-title').value;

  document.getElementById('side-eyebrow').textContent = eyebrow;
  document.getElementById('side-title').textContent = title;

  localStorage.setItem('dash_eyebrow', eyebrow);
  localStorage.setItem('dash_title', title);
  localStorage.setItem('dash_pill', document.getElementById('adm-pill').value);

  // Re-render current slide
  go(cur);

  // Toast
  const toast = document.getElementById('admin-toast');
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 2000);
}

// Restore saved text on load
(function restoreTexts(){
  const ey = localStorage.getItem('dash_eyebrow');
  const ti = localStorage.getItem('dash_title');
  if(ey) document.getElementById('adm-eyebrow').value = ey;
  if(ti) document.getElementById('adm-title').value = ti;
  if(ey) document.getElementById('side-eyebrow').textContent = ey;
  if(ti) document.getElementById('side-title').textContent = ti;
  const pi = localStorage.getItem('dash_pill');
  if(pi) document.getElementById('adm-pill').value = pi;
})();
