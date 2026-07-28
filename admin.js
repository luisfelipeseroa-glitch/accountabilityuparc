/* ══════════════════════════════════════
   ADMIN PANEL — Accountability UPA
   Edição visual dos slides via localStorage
   ══════════════════════════════════════ */

const ADMIN_STORAGE_KEY = 'accountability_slides_custom';

/* ── Helpers ── */
function getCustomSlides(){
  try{ return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)); }
  catch(e){ return null; }
}
function saveCustomSlides(data){
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
}
function clearCustomSlides(){
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

/* ── Cria botão flutuante ── */
function initAdminButton(){
  const btn = document.createElement('button');
  btn.id = 'admin-toggle';
  btn.innerHTML = '⚙️ Admin';
  btn.title = 'Abrir painel de edição';
  Object.assign(btn.style,{
    position:'fixed', bottom:'20px', right:'20px', zIndex:'99999',
    background:'linear-gradient(135deg,#C9A46A,#A9814A)', color:'#0F1B33',
    border:'none', borderRadius:'8px', padding:'10px 18px',
    fontWeight:'700', fontSize:'13px', cursor:'pointer',
    boxShadow:'0 4px 20px rgba(0,0,0,0.4)', transition:'transform 0.2s'
  });
  btn.onmouseenter=()=>btn.style.transform='scale(1.05)';
  btn.onmouseleave=()=>btn.style.transform='scale(1)';
  btn.onclick = openAdminPanel;
  document.body.appendChild(btn);
}

/* ── Painel principal ── */
function openAdminPanel(){
  if(document.getElementById('admin-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'admin-overlay';
  Object.assign(overlay.style,{
    position:'fixed', inset:'0', zIndex:'100000',
    background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
    display:'flex', justifyContent:'center', alignItems:'flex-start',
    overflowY:'auto', padding:'40px 20px'
  });

  const panel = document.createElement('div');
  Object.assign(panel.style,{
    background:'#111827', borderRadius:'12px', width:'100%', maxWidth:'900px',
    padding:'32px', color:'#EDEFF5', fontFamily:'Inter,sans-serif',
    boxShadow:'0 8px 40px rgba(0,0,0,0.6)', position:'relative'
  });

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 style="margin:0;font-size:20px;color:#C9A46A;">⚙️ Painel Admin — Editar Indicadores</h2>
      <button id="admin-close" style="background:none;border:none;color:#93A0BD;font-size:24px;cursor:pointer;">✕</button>
    </div>
    <p style="color:#93A0BD;font-size:12px;margin-bottom:20px;">
      Altere os valores abaixo e clique <strong>Salvar</strong>. Os dados ficam salvos no seu navegador.<br>
      Para voltar aos dados originais, clique <strong>Resetar</strong>.
    </p>
    <div id="admin-slides-list"></div>
    <div style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end;">
      <button id="admin-reset" style="padding:10px 20px;border-radius:8px;border:1px solid #D96C6C;background:transparent;color:#D96C6C;font-weight:700;cursor:pointer;">Resetar p/ Original</button>
      <button id="admin-save" style="padding:10px 20px;border-radius:8px;border:none;background:linear-gradient(135deg,#C9A46A,#A9814A);color:#0F1B33;font-weight:700;cursor:pointer;font-size:14px;">💾 Salvar e Recarregar</button>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click',(e)=>{if(e.target===overlay)closeAdmin();});
  document.getElementById('admin-close').onclick = closeAdmin;
  document.getElementById('admin-save').onclick = saveFromAdmin;
  document.getElementById('admin-reset').onclick = resetAdmin;

  loadSlidesIntoAdmin();
}

function closeAdmin(){
  const o = document.getElementById('admin-overlay');
  if(o) o.remove();
}

/* ── Carrega slides no painel ── */
function loadSlidesIntoAdmin(){
  const container = document.getElementById('admin-slides-list');
  const slides = getCustomSlides() || window.__originalSlides || [];
  if(!slides.length){
    container.innerHTML='<p style="color:#D96C6C;">Nenhum slide encontrado. Verifique se o site carregou corretamente.</p>';
    return;
  }

  let html = '';
  slides.forEach((slide,si)=>{
    html += `<div style="background:#1a2332;border-radius:8px;padding:16px;margin-bottom:16px;border-left:3px solid #C9A46A;">`;
    html += `<h3 style="margin:0 0 12px;font-size:14px;color:#C9A46A;">${slide.group} → ${slide.title}</h3>`;

    // Heading editável
    html += fieldInput(`s${si}_heading`, 'Título do Slide', slide.heading);

    // KPIs
    const kpis = slide.data?.kpis || (slide.data?.rows && slide.type==='kpis' ? slide.data.rows.flat() : []);
    if(kpis.length){
      html += `<div style="font-size:11px;color:#93A0BD;margin:8px 0 4px;text-transform:uppercase;letter-spacing:0.1em;">KPIs</div>`;
      kpis.forEach((kpi,ki)=>{
        const pre = `s${si}_k${ki}`;
        html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:6px;">`;
        html += smallInput(pre+'_label', 'Label', kpi.label);
        html += smallInput(pre+'_value', 'Valor', kpi.value);
        html += smallInput(pre+'_sub', 'Sub', kpi.sub);
        html += smallSelect(pre+'_status', kpi.status);
        html += `</div>`;
      });
    }

    // Tabela
    if((slide.type==='table'||slide.type==='kpis+table') && slide.data?.rows && slide.data?.headers){
      html += `<div style="font-size:11px;color:#93A0BD;margin:12px 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Tabela</div>`;
      html += `<div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;">`;
      html += `<tr>${slide.data.headers.map(h=>`<th style="text-align:left;padding:4px 6px;color:#C9A46A;border-bottom:1px solid #2a3a52;">${h}</th>`).join('')}</tr>`;
      slide.data.rows.forEach((row,ri)=>{
        html += `<tr>${row.map((cell,ci)=>`<td style="padding:2px 4px;"><input data-id="s${si}_r${ri}_c${ci}" value="${escHtml(cell)}" style="width:100%;background:#111827;border:1px solid #2a3a52;border-radius:4px;color:#EDEFF5;padding:3px 6px;font-size:11px;"></td>`).join('')}</tr>`;
      });
      html += `</table></div>`;
    }

    // Cards
    if(slide.data?.cards && slide.data.cards.length){
      html += `<div style="font-size:11px;color:#93A0BD;margin:12px 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Cards</div>`;
      slide.data.cards.forEach((card,ci)=>{
        const pre = `s${si}_card${ci}`;
        html += `<div style="background:#111827;border-radius:6px;padding:8px;margin-bottom:6px;">`;
        html += smallInput(pre+'_title','Título card',card.title);
        card.items.forEach((item,ii)=>{
          html += smallInput(pre+'_item'+ii,'Item '+(ii+1),item);
        });
        html += `</div>`;
      });
    }

    // Cover
    if(slide.type==='cover' && slide.data?.line1!==undefined){
      html += fieldInput(`s${si}_line1`,'Linha 1',slide.data.line1);
      html += fieldInput(`s${si}_line2`,'Linha 2',slide.data.line2);
      html += fieldInput(`s${si}_line3`,'Linha 3',slide.data.line3);
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}

/* ── Salvar ── */
function saveFromAdmin(){
  const slides = JSON.parse(JSON.stringify(getCustomSlides() || window.__originalSlides || []));

  slides.forEach((slide,si)=>{
    // Heading
    const hVal = getVal(`s${si}_heading`);
    if(hVal!==null) slide.heading = hVal;

    // Cover
    if(slide.type==='cover'){
      const l1=getVal(`s${si}_line1`), l2=getVal(`s${si}_line2`), l3=getVal(`s${si}_line3`);
      if(l1!==null) slide.data.line1=l1;
      if(l2!==null) slide.data.line2=l2;
      if(l3!==null) slide.data.line3=l3;
    }

    // KPIs (formato rows flat — type: kpis)
    if(slide.type==='kpis' && slide.data?.rows){
      let ki=0;
      slide.data.rows.forEach(row=>{
        row.forEach(kpi=>{
          const pre=`s${si}_k${ki}`;
          const lb=getVal(pre+'_label'), vl=getVal(pre+'_value'), sb=getVal(pre+'_sub'), st=getVal(pre+'_status');
          if(lb!==null) kpi.label=lb;
          if(vl!==null) kpi.value=vl;
          if(sb!==null) kpi.sub=sb;
          if(st!==null) kpi.status=st;
          ki++;
        });
      });
    }
    // KPIs (formato kpis array — type: kpis+table, kpis+cards)
    else if(slide.data?.kpis){
      slide.data.kpis.forEach((kpi,ki)=>{
        const pre=`s${si}_k${ki}`;
        const lb=getVal(pre+'_label'), vl=getVal(pre+'_value'), sb=getVal(pre+'_sub'), st=getVal(pre+'_status');
        if(lb!==null) kpi.label=lb;
        if(vl!==null) kpi.value=vl;
        if(sb!==null) kpi.sub=sb;
        if(st!==null) kpi.status=st;
      });
    }

    // Table rows
    if(slide.data?.rows && slide.data?.headers){
      slide.data.rows.forEach((row,ri)=>{
        row.forEach((cell,ci)=>{
          const v=getVal(`s${si}_r${ri}_c${ci}`);
          if(v!==null) slide.data.rows[ri][ci]=v;
        });
      });
    }

    // Cards
    if(slide.data?.cards){
      slide.data.cards.forEach((card,ci)=>{
        const pre=`s${si}_card${ci}`;
        const t=getVal(pre+'_title');
        if(t!==null) card.title=t;
        card.items.forEach((item,ii)=>{
          const v=getVal(pre+'_item'+ii);
          if(v!==null) card.items[ii]=v;
        });
      });
    }
  });

  saveCustomSlides(slides);
  closeAdmin();
  showToast('✅ Salvo! Recarregando...');
  setTimeout(()=>location.reload(), 800);
}

/* ── Resetar ── */
function resetAdmin(){
  if(!confirm('Tem certeza? Isso apaga todas as edições e volta aos dados originais do slides.json.')) return;
  clearCustomSlides();
  closeAdmin();
  showToast('🔄 Resetado! Recarregando...');
  setTimeout(()=>location.reload(), 800);
}

/* ── Toast ── */
function showToast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  Object.assign(t.style,{
    position:'fixed',bottom:'80px',right:'20px',zIndex:'200000',
    background:'#1a2332',color:'#C9A46A',padding:'12px 24px',borderRadius:'8px',
    fontWeight:'700',fontSize:'13px',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
    transition:'opacity 0.5s'
  });
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),500);},2000);
}

/* ── Input helpers ── */
function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function getVal(id){
  const el=document.querySelector(`[data-id="${id}"]`);
  return el ? el.value : null;
}
function fieldInput(id,label,value){
  return `<div style="margin-bottom:8px;">
    <label style="font-size:10px;color:#93A0BD;">${label}</label>
    <input data-id="${id}" value="${escHtml(value||'')}" style="width:100%;background:#111827;border:1px solid #2a3a52;border-radius:6px;color:#EDEFF5;padding:6px 10px;font-size:12px;">
  </div>`;
}
function smallInput(id,placeholder,value){
  return `<input data-id="${id}" value="${escHtml(value||'')}" placeholder="${placeholder}" title="${placeholder}" style="background:#111827;border:1px solid #2a3a52;border-radius:4px;color:#EDEFF5;padding:3px 6px;font-size:11px;min-width:0;">`;
}
function smallSelect(id,current){
  const opts=['green','red','muted'];
  return `<select data-id="${id}" style="background:#111827;border:1px solid #2a3a52;border-radius:4px;color:#EDEFF5;padding:3px 4px;font-size:11px;">
    ${opts.map(o=>`<option value="${o}"${o===current?' selected':''}>${o==='green'?'🟢 Verde':o==='red'?'🔴 Vermelho':'⚪ Cinza'}</option>`).join('')}
  </select>`;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded',()=>initAdminButton());
