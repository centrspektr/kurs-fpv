/* golos.js - голос заданий: читает текст встроенным голосом браузера (бесплатно, без сервера).
   Голос на разных устройствах свой: в Edge на компьютере - живые голоса Microsoft, на Android - Google, на iPhone - Милена/Юрий.
   Три голоса на выбор (GOLOS.k): 1 диспетчер (женский, спокойный), 2 инструктор (мужской, ниже), 3 бортовой помощник (выше, с сигналом рации).
   Выбор и "звук выкл" помнятся на устройстве. Использование:
     GOLOS.say(текст, { onb: function(номер_символа){...}, onend: function(){...} })  - прочитать; onb - докуда дочитал (для печати текста)
     GOLOS.stop()  GOLOS.on  GOLOS.setOn(true|false)  GOLOS.can() - есть ли русский голос на устройстве */
(function(){
'use strict';
var CFG=window.KURSY||{}, KEY=(CFG.store||'kursy')+'_golos', syn=window.speechSynthesis;
function lsG(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
var SET={1:{rate:1,pitch:1.05},2:{rate:.93,pitch:.85},3:{rate:1.08,pitch:1.3,beep:1}};
function ru(){ return (syn?syn.getVoices():[]).filter(function(v){ return /^ru/i.test(v.lang); }); }
function natural(v){ return /natural|online|enhanced|premium/i.test(v.name); }
/* сначала живые голоса (Natural/Online), потом любые русские */
function voiceFor(k){ var r=ru(), fem=/svetlana|dariya|milena|katya|irina|elena|anna|alena|google/i, male=/dmitry|pavel|yuri|maxim|nikolai|male/i, pool=r.filter(natural).concat(r);
  if(k===2) return pool.find(function(v){ return male.test(v.name); })||pool[0];
  return pool.find(function(v){ return fem.test(v.name)&&!male.test(v.name); })||pool[0]; }
var AX=null;
function beep(){ try{ AX=AX||new (window.AudioContext||window.webkitAudioContext)(); var o=AX.createOscillator(), g=AX.createGain(), t=AX.currentTime;
  o.type='square'; o.frequency.setValueAtTime(1400,t); o.frequency.setValueAtTime(1900,t+.07); g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.001,t+.18); o.connect(g); g.connect(AX.destination); o.start(t); o.stop(t+.2); }catch(e){} }
var G=window.GOLOS={ k:+(CFG.golos||1), on:lsG(KEY)!=='off', tm:0,
  can:function(){ return !!syn&&ru().length>0; },
  setOn:function(b){ G.on=!!b; lsS(KEY,b?'on':'off'); if(!b) G.stop(); },
  stop:function(){ clearTimeout(G.tm); if(syn) syn.cancel(); },
  say:function(text,o){ o=o||{}; G.stop(); if(!G.on||!G.can()){ o.onend&&o.onend(false); return false; }
    var s=SET[G.k]||SET[1], u=new SpeechSynthesisUtterance(text), done=false; u.lang='ru-RU'; u.voice=voiceFor(G.k)||null; u.rate=s.rate; u.pitch=s.pitch;
    function end(){ if(done) return; done=true; o.onend&&o.onend(true); }
    u.onboundary=function(e){ if(e.charIndex!=null&&o.onb) o.onb(e.charIndex+(e.charLength||6)); }; u.onend=end; u.onerror=end;
    if(s.beep){ beep(); G.tm=setTimeout(function(){ syn.speak(u); },230); } else syn.speak(u); return true; } };
if(syn&&syn.getVoices) syn.getVoices(); /* Chrome загружает список голосов не сразу */
})();
