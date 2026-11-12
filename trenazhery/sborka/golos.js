/* golos.js - голос заданий: читает текст встроенным голосом браузера (бесплатно, без сервера).
   Голоса на каждом устройстве свои: в Edge на компьютере - живые голоса Microsoft (Natural), на Android - Google, на iPhone - Милена/Юрий.
   Ученик выбирает голос из списка своего устройства (живые - первыми), выбор и "звук выкл" помнятся на устройстве.
   Использование:
     GOLOS.say(текст, { onb: function(номер_символа){...}, onend: function(){...} })  - прочитать; onb - докуда дочитал (для печати текста)
     GOLOS.stop()  GOLOS.on  GOLOS.setOn(true|false)  GOLOS.vol  GOLOS.setVol(0..1)  GOLOS.can() - есть ли русский голос
     GOLOS.list() - русские голоса устройства, живые первыми;  GOLOS.cur() - выбранный;  GOLOS.pick(имя_голоса)
   Озвучка файлами (22.10, решение по входу: "запишем голос или нейроозвучка файлом"):
     GOLOS.play('vhod.mp3', { text: 'запасной текст', onend: ... }) - играет файл из папки озвучки (window.ZVUK_DIR, по умолчанию 'zvuk/');
     если файла нет или он не играет - читает text голосом устройства. Звук выключен (GOLOS.on=false) - молчит. */
(function(){
'use strict';
var CFG=window.KURSY||{}, KEY=(CFG.store||'kursy')+'_golos', syn=window.speechSynthesis;
function lsG(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function live(v){ return /natural|online|neural|enhanced|premium/i.test(v.name); }
function list(){ var r=(syn?syn.getVoices():[]).filter(function(v){ return /^ru/i.test(v.lang); });
  return r.filter(live).concat(r.filter(function(v){ return !live(v); })); }
var V0=parseFloat(lsG(KEY+'_vol')); /* громкость 0..1, помнится на устройстве */
function speakFrom(sp){ var off=sp.pos, u=new SpeechSynthesisUtterance(sp.s.slice(off)); u.lang='ru-RU'; u.voice=G.cur(); u.rate=1; u.pitch=1; u.volume=G.vol;
  u.onboundary=function(e){ if(e.charIndex==null) return; sp.pos=off+e.charIndex; if(sp.o.onb) sp.o.onb(sp.back(off+e.charIndex+(e.charLength||6))); };
  u.onend=u.onerror=function(){ if(sp.u===u) sp.end(); }; sp.u=u; syn.speak(u); }
var G=window.GOLOS={ on:lsG(KEY)!=='off', vol:isNaN(V0)?1:Math.max(0,Math.min(1,V0)), tm:0, list:list, live:live,
  can:function(){ return !!syn&&list().length>0; },
  cur:function(){ var r=list(), nm=lsG(KEY+'_v'); return r.find(function(v){ return v.name===nm; })||r[0]||null; },
  pick:function(nm){ lsS(KEY+'_v',nm); },
  setVol:function(v){ G.vol=Math.max(0,Math.min(1,+v||0)); lsS(KEY+'_vol',String(G.vol)); if(G.au) G.au.volume=G.vol;
    /* голос устройства не меняет громкость на ходу: перечитываем фразу с того слова, где остановились, уже с новой громкостью (0 - молчим) */
    var sp=G.sp; if(sp&&syn){ clearTimeout(G.vt); G.vt=setTimeout(function(){ if(G.sp!==sp) return; sp.u=null; syn.cancel(); if(G.vol>0) speakFrom(sp); else sp.end(); },250); } },
  setOn:function(b){ G.on=!!b; lsS(KEY,b?'on':'off'); if(!b) G.stop(); },
  stop:function(){ G.zt=null; clearTimeout(G.tm); clearTimeout(G.vt); if(syn) syn.cancel(); if(G.au){ G.au.onended=G.au.onerror=null; G.au.pause(); G.au=null; } },
  play:function(file,o){ o=o||{}; G.stop(); if(!G.on){ o.onend&&o.onend(false); return false; }
    var au=G.au=new Audio((window.ZVUK_DIR||'zvuk/')+file), done=false; au.volume=G.vol;
    function end(ok){ if(done) return; done=true; if(G.au===au) G.au=null; o.onend&&o.onend(ok); }
    function back(){ if(done) return; if(G.au===au) G.au=null; done=true; if(o.text) G.say(o.text,o); else o.onend&&o.onend(false); } /* нет файла - голос устройства */
    au.onended=function(){ end(true); }; au.onerror=back; var pr=au.play(); if(pr&&pr.catch) pr.catch(back); return true; },
  say:function(text,o){ o=o||{}; G.stop(); if(G.on&&zSay(text,o)) return true; return dev(text,o); },
  dev:function(text,o){ if(!G.on||!G.can()){ o.onend&&o.onend(false); return false; }
    var f={s:text,back:function(i){ return i; }}, done=false, sp={s:f.s,back:f.back,o:o,pos:0};
    sp.end=function(){ if(done) return; done=true; if(G.sp===sp) G.sp=null; o.onend&&o.onend(true); };
    G.sp=sp; speakFrom(sp); return true; } };
function dev(t,o){ return G.dev(t,o); }
/* 12.11: записанный голос (Лера, Яндекс SpeechKit) - когда игра открыта внутри курса, где есть записи (golos-new.js главной страницы).
   Фразы записаны по предложениям: текст режем на предложения, ключ каждого - parent.GOLOS.key(предложение). Есть все - играем подряд, нет хоть одного - голос устройства. */
function zP(){ try{ var P=parent!==window&&parent.GOLOS; if(P&&P.key&&P.zmap&&P.zdir&&P.zmap()) return P; }catch(e){} return null; }
function zSent(t){ return (String(t).match(/[^.!?…]+(?:[.!?…]+|$)\s*/g)||[]).map(function(x){ return x.trim(); }).filter(Boolean); }
function zSay(text,o){ var P=zP(); if(!P) return false; var L=P.zmap(), dir=P.zdir(), parts=zSent(text), au=[];
  for(var j=0;j<parts.length;j++){ var f=L[P.key(parts[j])]; if(!f) return false; var a=new Audio(dir+f); a.preload='auto'; au.push(a); }
  if(!au.length) return false; var tok={}, i=0, done=false; G.zt=tok;
  function end(ok){ if(done) return; done=true; if(G.zt===tok) G.zt=null; G.au=null; o.onend&&o.onend(ok); }
  function bad(){ if(G.zt!==tok||done) return; done=true; G.zt=null; G.au=null; dev(parts.slice(Math.max(0,i-1)).join(' '),o); } /* файл не играет - остаток голосом устройства */
  function next(){ if(G.zt!==tok) return; if(i>=au.length) return end(true); var a=G.au=au[i++]; a.volume=G.vol; a.onended=next; a.onerror=bad; var pr=a.play(); if(pr&&pr.catch) pr.catch(bad); }
  next(); return true; }
if(syn&&syn.getVoices) syn.getVoices(); /* Chrome загружает список голосов не сразу */
})();
