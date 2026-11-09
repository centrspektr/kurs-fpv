/* golos.js - голос заданий: читает текст встроенным голосом браузера (бесплатно, без сервера).
   Голоса на каждом устройстве свои: в Edge на компьютере - живые голоса Microsoft (Natural), на Android - Google, на iPhone - Милена/Юрий.
   Ученик выбирает голос из списка своего устройства (живые - первыми), выбор и "звук выкл" помнятся на устройстве.
   Использование:
     GOLOS.say(текст, { onb: function(номер_символа){...}, onend: function(){...} })  - прочитать; onb - докуда дочитал (для печати текста)
     GOLOS.stop()  GOLOS.on  GOLOS.setOn(true|false)  GOLOS.can() - есть ли русский голос
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
var G=window.GOLOS={ on:lsG(KEY)!=='off', tm:0, list:list, live:live,
  can:function(){ return !!syn&&list().length>0; },
  cur:function(){ var r=list(), nm=lsG(KEY+'_v'); return r.find(function(v){ return v.name===nm; })||r[0]||null; },
  pick:function(nm){ lsS(KEY+'_v',nm); },
  setOn:function(b){ G.on=!!b; lsS(KEY,b?'on':'off'); if(!b) G.stop(); },
  stop:function(){ clearTimeout(G.tm); if(syn) syn.cancel(); if(G.au){ G.au.onended=G.au.onerror=null; G.au.pause(); G.au=null; } },
  play:function(file,o){ o=o||{}; G.stop(); if(!G.on){ o.onend&&o.onend(false); return false; }
    var au=G.au=new Audio((window.ZVUK_DIR||'zvuk/')+file), done=false;
    function end(ok){ if(done) return; done=true; if(G.au===au) G.au=null; o.onend&&o.onend(ok); }
    function back(){ if(done) return; if(G.au===au) G.au=null; done=true; if(o.text) G.say(o.text,o); else o.onend&&o.onend(false); } /* нет файла - голос устройства */
    au.onended=function(){ end(true); }; au.onerror=back; var pr=au.play(); if(pr&&pr.catch) pr.catch(back); return true; },
  say:function(text,o){ o=o||{}; G.stop(); if(!G.on||!G.can()){ o.onend&&o.onend(false); return false; }
    var u=new SpeechSynthesisUtterance(text), done=false; u.lang='ru-RU'; u.voice=G.cur(); u.rate=1; u.pitch=1;
    function end(){ if(done) return; done=true; o.onend&&o.onend(true); }
    u.onboundary=function(e){ if(e.charIndex!=null&&o.onb) o.onb(e.charIndex+(e.charLength||6)); }; u.onend=end; u.onerror=end;
    syn.speak(u); return true; } };
if(syn&&syn.getVoices) syn.getVoices(); /* Chrome загружает список голосов не сразу */
})();
