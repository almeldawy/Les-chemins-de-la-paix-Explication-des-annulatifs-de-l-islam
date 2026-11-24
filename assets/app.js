(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var NOTES=window.NOTES||{},BOOK=window.BOOK||[];
var FILE=document.body.dataset.file,IS_CHAP=document.body.classList.contains('is-chap');
function get(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var html=document.documentElement;

/* ---------- panneau latéral */
var side=$('#side'),veil=$('#veil');
function openSide(){side.classList.add('open');veil.classList.add('on')}
function closeSide(){side.classList.remove('open');veil.classList.remove('on')}
$('#bt').addEventListener('click',function(){side.classList.contains('open')?closeSide():openSide()});
veil.addEventListener('click',function(){closeSide();closePop()});
$$('.tab').forEach(function(t){t.addEventListener('click',function(){
  $$('.tab').forEach(function(x){x.classList.toggle('on',x===t)});
  $$('.pane').forEach(function(p){p.classList.toggle('on',p.id==='pane-'+t.dataset.tab)});
})});
$$('#pane-toc a').forEach(function(a){a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#')closeSide()})});

/* ---------- taille du texte et mode nuit */
var fs=get('sobul-fs',19);
function setFs(){html.style.setProperty('--fs',fs+'px');set('sobul-fs',fs)}
$('#fp').addEventListener('click',function(){fs=Math.min(28,fs+1);setFs();onScroll()});
$('#fm').addEventListener('click',function(){fs=Math.max(14,fs-1);setFs();onScroll()});
setFs();
function setDark(on){html.classList.toggle('dark',on);set('sobul-dark',on?'1':'0');$('#dk').textContent=on?'☀':'☾'}
setDark(get('sobul-dark','0')==='1');
$('#dk').addEventListener('click',function(){setDark(!html.classList.contains('dark'))});

/* ---------- notes */
var pop=$('#pop');
function closePop(){pop.classList.remove('on')}
document.addEventListener('click',function(e){
  var f=e.target.closest('button.fn');
  if(f){var n=f.dataset.n;$('#popt').textContent='Note '+n.split('-').pop();$('#popc').innerHTML=NOTES[n]||'';$('#popc').scrollTop=0;pop.classList.add('on');e.stopPropagation();return}
  if(e.target.closest('#pop .x')||!e.target.closest('#pop'))closePop();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closePop();closeSide()}
  if(e.target.closest('input,textarea'))return;
  if(e.key==='ArrowRight'&&$('#nextb'))location.href=$('#nextb').href;
  if(e.key==='ArrowLeft'&&$('#prevb'))location.href=$('#prevb').href;
});

/* ---------- toast */
var tt;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},1800)}

/* ---------- blocs de lecture (repères) */
var blocks=IS_CHAP?$$('#chap h1, #chap h3, #chap h4, #chap p, #chap .sharh-tag').filter(function(b){return b.tagName==='H1'||!b.closest('.ch-h')}):[];
function topBlock(){
  var lim=($('.bar').offsetHeight||52)+8;
  for(var i=0;i<blocks.length;i++){if(blocks[i].getBoundingClientRect().bottom>lim)return i}
  return 0;
}
function goBlock(i,flash){
  var b=blocks[i];if(!b)return;
  b.scrollIntoView({block:'start'});
  if(flash){b.classList.remove('bm-flash');void b.offsetWidth;b.classList.add('bm-flash')}
}
function excerpt(i){
  var b=blocks[i];if(!b)return'';
  var c=b.cloneNode(true);$$('button.fn',c).forEach(function(x){x.remove()});
  var s=c.textContent.replace(/\s+/g,' ').trim();
  return s.length>130?s.slice(0,127)+'…':s;
}

/* ---------- progression */
var prog=get('sobul-prog',{});
function chapTitle(f){for(var i=0;i<BOOK.length;i++)if(BOOK[i].f===f)return BOOK[i].t;return''}
function paintProgress(){
  var tot=0,done=0;
  BOOK.forEach(function(c){tot+=c.w;done+=c.w*Math.min(100,prog[c.f]||0)/100});
  var g=tot?Math.round(done/tot*100):0;
  $('#gpct').textContent=g+' %';$('#gbar').style.width=g+'%';
  $$('li.ch').forEach(function(li){
    var p=prog[li.dataset.f]||0;
    li.classList.toggle('read',p>=97);
    li.classList.toggle('part-read',p>1&&p<97);
    li.style.setProperty('--p',p+'%');
  });
  if(!IS_CHAP){
    var last=get('sobul-last',null);
    if(last&&last.f){
      var r=$('#resumeb');r.hidden=false;r.href=last.f+'#b='+(last.i||0);
      r.textContent='Reprendre : '+chapTitle(last.f);
      var sb=$('#startb');sb.textContent='Recommencer au début';sb.classList.add('ghost');r.classList.remove('ghost');sb.parentNode.appendChild(sb);
      $('#cprog').hidden=false;$('#cbar').style.width=g+'%';
      $('#ctext').textContent='Vous avez lu '+g+' % du livre';
    }
  }
}
var ticking=false,saveT;
function onScroll(){
  if(!IS_CHAP||ticking)return;ticking=true;
  requestAnimationFrame(function(){
    ticking=false;
    var h=document.documentElement.scrollHeight-innerHeight;
    var p=h>0?Math.min(100,Math.max(0,scrollY/h*100)):100;
    $('#rbar i').style.width=p+'%';if($('#opb')){$('#opb').style.width=p+'%';$('#opp').textContent=Math.round(p)+' %'}$('#pct').textContent=Math.round(p)+' %';
    clearTimeout(saveT);saveT=setTimeout(function(){
      if(p>(prog[FILE]||0)){prog[FILE]=Math.round(p);set('sobul-prog',prog);paintProgress()}
      set('sobul-last',{f:FILE,i:topBlock(),d:Date.now()});
    },350);
    spy();
  });
}
/* sommaire du chapitre (colonne droite sur grand écran) */
var op=$('#onpage');
if(op&&IS_CHAP){
  var hs=$$('#chap h3');
  var o='<h2>Dans ce chapitre</h2><div class="opr"><span id="opp">0 %</span> lu<div class="gbar"><i id="opb"></i></div></div>';
  if(hs.length){o+='<ol>'+hs.map(function(h){return '<li><a href="#'+h.id+'">'+h.textContent.replace(/^\s+|\s+$/g,'')+'</a></li>'}).join('')+'</ol>'}
  op.innerHTML=o;
}
/* sous-titre courant dans le sommaire */
var subLinks=$$('.subs a, #onpage a'),heads=subLinks.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
function spy(){
  var lim=($('.bar').offsetHeight||52)+30,ch=null;
  $$('#chap h3').forEach(function(h){if(h.getBoundingClientRect().top<lim)ch=h});
  subLinks.forEach(function(a,i){a.classList.toggle('on',heads[i]===ch)});
}

/* ---------- marque-pages */
var bms=get('sobul-bm',[]);
function saveBms(){set('sobul-bm',bms);renderBms()}
function renderBms(){
  $('#bmn').textContent=bms.length?bms.length:'';
  var L=$('#bmlist');
  if(!bms.length){L.innerHTML='<p class="bm-empty">Aucun marque-page pour l\'instant.<br>Touchez « 🔖 Marquer » pendant la lecture pour en ajouter un.</p>';}
  else{
    L.innerHTML='';
    bms.slice().sort(function(a,b){return b.d-a.d}).forEach(function(m){
      var a=document.createElement('a');a.className='bm';a.href=m.f+'#b='+m.i;
      var d=new Date(m.d);
      a.innerHTML='<b></b><q></q><small></small><button class="del" title="Supprimer" aria-label="Supprimer">×</button>';
      a.querySelector('b').textContent=m.t;a.querySelector('q').textContent=m.x;
      a.querySelector('small').textContent=d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})+' · '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      a.querySelector('.del').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();bms=bms.filter(function(x){return x.id!==m.id});saveBms();markPins();toast('Marque-page supprimé')});
      a.addEventListener('click',function(){if(m.f===FILE){closeSide()}});
      L.appendChild(a);
    });
  }
}
function markPins(){
  blocks.forEach(function(b){b.classList.remove('bm-pin')});
  bms.forEach(function(m){if(m.f===FILE&&blocks[m.i])blocks[m.i].classList.add('bm-pin')});
}
var mk=$('#mk');
if(mk)mk.addEventListener('click',function(){
  var i=topBlock();
  if(bms.some(function(m){return m.f===FILE&&m.i===i})){toast('Déjà marqué à cet endroit');return}
  bms.push({id:Date.now().toString(36),f:FILE,i:i,t:chapTitle(FILE),x:excerpt(i),d:Date.now()});
  saveBms();markPins();toast('Marque-page ajouté ✓');
});

/* ---------- initialisation */
renderBms();markPins();paintProgress();
var cur=$('li.ch.cur');if(cur&&side.scrollHeight){var pane=$('#pane-toc');pane.scrollTop=Math.max(0,cur.offsetTop-pane.clientHeight/3)}
function fromHash(){
  var m=/^#b=(\d+)$/.exec(location.hash);
  if(m){setTimeout(function(){goBlock(+m[1],true)},60);history.replaceState(null,'',location.pathname)}
}
if(IS_CHAP){fromHash();addEventListener('hashchange',fromHash);addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);setTimeout(onScroll,120)}
})();
