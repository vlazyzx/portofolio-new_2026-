function go(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nl,.mnl').forEach(l=>l.classList.remove('on'));
  const p=document.getElementById('page-'+id);
  if(p){p.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
  document.querySelectorAll('.nl,.mnl').forEach(l=>{
    if(l.textContent.trim().toLowerCase()===id)l.classList.add('on');
  });
  if(id==='home')setTimeout(animStats,200);
  if(id==='about')setTimeout(animSkills,200);
}
function animStats(){
  document.querySelectorAll('.sc').forEach((c,i)=>{
    setTimeout(()=>{
      const w=parseFloat(c.dataset.w||'.5');
      c.querySelector('.sf').style.transform=`scaleX(${w})`;
    },i*120);
  });
}
function animSkills(){
  document.querySelectorAll('.sk-row').forEach((r,i)=>{
    setTimeout(()=>{
      const w=parseFloat(r.dataset.w||'.5');
      r.querySelector('.sk-fill').style.transform=`scaleX(${w})`;
    },i*100);
  });
}
function toggleMenu(){
  const h=document.getElementById('ham');
  const m=document.getElementById('mob-menu');
  h.classList.toggle('open');
  m.classList.toggle('open');
}
function closeMenu(){
  document.getElementById('ham').classList.remove('open');
  document.getElementById('mob-menu').classList.remove('open');
}

document.querySelectorAll('[data-page]').forEach(el=>{
  el.addEventListener('click',()=>{
    go(el.dataset.page);
    if(el.dataset.closeMenu==='true')closeMenu();
  });
});
document.querySelector('[data-toggle-menu]')?.addEventListener('click',toggleMenu);
document.querySelector('[data-upload-trigger]')?.addEventListener('click',()=>{
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change',function(e){
  const f=e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    const img=document.getElementById('profile-img');
    img.src=ev.target.result;
    img.style.display='block';
    document.getElementById('ph-inner').style.display='none';
  };
  r.readAsDataURL(f);
});
setTimeout(animStats,500);
function filterProjects(filter){
  const cards=[...document.querySelectorAll('#page-projects .pj')];
  cards.forEach((card,index)=>{
    const match=filter==='all'||card.dataset.category===filter;
    card.style.setProperty('--pj-delay',`${index*55}ms`);
    if(match){
      card.hidden=false;
      card.classList.remove('pj-hide');
      card.classList.add('pj-show');
    }else{
      card.classList.remove('pj-show');
      card.classList.add('pj-hide');
      setTimeout(()=>{
        if(card.classList.contains('pj-hide'))card.hidden=true;
      },240);
    }
  });
}
document.querySelectorAll('.pf').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.pf').forEach(item=>item.classList.remove('on'));
    btn.classList.add('on');
    filterProjects(btn.dataset.filter||'all');
  });
});
filterProjects('all');
function initLanyardTilt(){
  const frame=document.querySelector('[data-lanyard-profile]');
  if(!frame)return;
  frame.addEventListener('pointermove',e=>{
    const r=frame.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    frame.style.setProperty('--tilt-y',`${x*10}deg`);
    frame.style.setProperty('--tilt-x',`${-y*8}deg`);
  });
  frame.addEventListener('pointerleave',()=>{
    frame.style.setProperty('--tilt-y','0deg');
    frame.style.setProperty('--tilt-x','0deg');
  });
}
initLanyardTilt();
