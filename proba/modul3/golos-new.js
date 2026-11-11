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
  stop:function(){ clearTimeout(G.tm); clearTimeout(G.vt); if(syn) syn.cancel(); if(G.au){ G.au.onended=G.au.onerror=null; G.au.pause(); G.au=null; } },
  play:function(file,o){ o=o||{}; G.stop(); if(!G.on){ o.onend&&o.onend(false); return false; }
    var au=G.au=new Audio((window.ZVUK_DIR||'zvuk/')+file), done=false; au.volume=G.vol;
    function end(ok){ if(done) return; done=true; if(G.au===au) G.au=null; o.onend&&o.onend(ok); }
    function back(){ if(done) return; if(G.au===au) G.au=null; done=true; if(o.text) G.say(o.text,o); else o.onend&&o.onend(false); } /* нет файла - голос устройства */
    au.onended=function(){ end(true); }; au.onerror=back; var pr=au.play(); if(pr&&pr.catch) pr.catch(back); return true; },
  say:function(text,o){ o=o||{}; G.stop(); if(G.on&&zSay(text,o)) return true; if(!G.on||!G.can()){ o.onend&&o.onend(false); return false; }
    var f=G.fix(text), done=false, sp={s:f.s,back:f.back,o:o,pos:0};
    sp.end=function(){ if(done) return; done=true; if(G.sp===sp) G.sp=null; o.onend&&o.onend(true); };
    G.sp=sp; speakFrom(sp); return true; } };
/* Произношение (8.11.2026, дополнено 10.11: "Комната 1" -> "Комната первая", "из 5" -> "из пяти", слова тренажёров): голос устройства читал "Задание 1" как "задание первых", путал сокращения.
   Перед чтением текст переводится в слова, на экране он прежний:
     "Задание 1" -> "Задание первое", "Модуль 2" -> "Модуль второй" (так же уровень, шаг, этап, урок, вопрос);
     остальные числа - словами ("9 заданий" -> "девять заданий"); "4S" -> "четыре эс", "1500mAh" -> "тысяча пятьсот миллиампер-часов";
     сокращения и английские слова - по словарю SLOV; " - " читается как пауза.
   Ударение: в SLOV можно дать слово со знаком ударения после ударной гласной (́), например 'висение':'висе́ние'.
   G.fix(текст) -> { s: что читать, back(i): номер символа в исходном тексте } - для печати текста вслед за голосом (onb). */
var ED=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'],
  DS=['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'],
  SO=['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'],
  ORD={ n:['','первое','второе','третье','четвёртое','пятое','шестое','седьмое','восьмое','девятое','десятое','одиннадцатое','двенадцатое','тринадцатое','четырнадцатое','пятнадцатое','шестнадцатое','семнадцатое','восемнадцатое','девятнадцатое','двадцатое'],
    m:['','первый','второй','третий','четвёртый','пятый','шестой','седьмой','восьмой','девятый','десятый','одиннадцатый','двенадцатый','тринадцатый','четырнадцатый','пятнадцатый','шестнадцатый','семнадцатый','восемнадцатый','девятнадцатый','двадцатый'],
    f:['','первая','вторая','третья','четвёртая','пятая','шестая','седьмая','восьмая','девятая','десятая','одиннадцатая','двенадцатая','тринадцатая','четырнадцатая','пятнадцатая','шестнадцатая','семнадцатая','восемнадцатая','девятнадцатая','двадцатая'] },
  GEN=['','одного','двух','трёх','четырёх','пяти','шести','семи','восьми','девяти','десяти','одиннадцати','двенадцати','тринадцати','четырнадцати','пятнадцати','шестнадцати','семнадцати','восемнадцати','девятнадцати','двадцати'],
  ORD_W={ 'задание':'n', 'модуль':'m', 'уровень':'m', 'шаг':'m', 'этап':'m', 'урок':'m', 'вопрос':'m', 'комната':'f', 'попытка':'f' },
  UNIT={ s:'эс', c:'си', mah:'миллиампер-часов', v:'вольт', 'в':'вольт', mm:'миллиметров', 'мм':'миллиметров', g:'грамм', 'г':'грамм' },
  SLOV={ fpv:'эф пи ви', 'акб':'а ка бэ', mah:'миллиампер-часов', angle:'энгл', acro:'акро', failsafe:'фейлсейф', max:'макс', mobula:'мобула',
    x:'умножить на', c:'си', s:'эс', betaflight:'бетафла\u0301йт', elrs:'и эл эр эс', vtx:'ви ти экс', osd:'о эс дэ', esc:'регулятор', lipo:'липо', li:'ли', ion:'ион',
    'коли':'Ко\u0301ли', 'маши':'Ма\u0301ши', 'руки':'ру\u0301ки',
    /* 10.11: слова из тренажёров (пульт, Mobula 7, классы дронов) - раньше их голос читал по-английски */
    sa:'эс а', sb:'эс бэ', sc:'эс цэ', sd:'эс дэ', mode:'мод', modes:'мо\u0301дс', lihv:'ли эйч ви', hv:'эйч ви', edgetx:'эдж ти экс', sys:'сис', mdl:'модель',
    f4:'эф четыре', whoop:'вуп', tiny:'та\u0301йни', turtle:'тёртл', tele:'теле', rtn:'возврат', page:'пейдж', horizon:'хоризо\u0301н', gnb:'джи эн би',
    geprc:'джи и пи ар си', expresslrs:'экспресс эл эр эс', receiver:'реси\u0301вер', rssi:'эр эс эс ай', radiomaster:'радиома\u0301стер', pocket:'по\u0301кет',
    mark5:'марк пять', arm:'арм', armed:'армд', disarm:'диза\u0301рм', flip:'флип', crash:'крэш', beeper:'би\u0301пер', aux:'акс', aux1:'акс один', aux2:'акс два',
    aux3:'акс три', aux4:'акс четыре', aio:'ай о', lq:'эл кью', cinelog:'синело\u0301г', cinewhoop:'синеву\u0301п', gopro:'гоу про', enter:'энтер', over:'о\u0301вер',
    after:'а\u0301фтер', throttle:'тро\u0301ттл', yaw:'йо', pitch:'питч', roll:'ролл', ok:'окей' }; /* имена в историях (не "колИ", не "машИ") и "тренировать рУки" */
function sot(n,fem){ var r=[]; if(n>=100){ r.push(SO[Math.floor(n/100)]); n%=100; }
  if(n>=20){ r.push(DS[Math.floor(n/10)]); n%=10; if(!n) return r.join(' '); }
  if(n||!r.length) r.push(fem&&n===1?'одна':fem&&n===2?'две':ED[n]); return r.join(' '); }
function num(n){ if(n>=1e6) return String(n); var t=Math.floor(n/1000), r=n%1000, w=[];
  if(t){ var a=t%10, b=t%100; w.push((t===1?'':sot(t,true)+' ')+(a===1&&b!==11?'тысяча':a>=2&&a<=4&&(b<12||b>14)?'тысячи':'тысяч')); }
  if(r||!t) w.push(sot(r)); return w.join(' '); }
G.fix=function(text){ text=String(text==null?'':text); var out='', seg=[], last=0, prev='', re=/[A-Za-zА-Яа-яЁё0-9]+|\s+-\s+/g, mt;
  function put(o,ol,s){ seg.push([o,ol,out.length,s.length]); out+=s; }
  while((mt=re.exec(text))){ var w=mt[0], lw=w.toLowerCase(), r=null, d=/^(\d+)([a-zа-яё]*)$/i.exec(w);
    if(/^\s/.test(w)) r=', ';
    else if(d&&!d[2]){ var n=+w, k=ORD_W[prev]; r=k&&ORD[k][n]?ORD[k][n]:prev==='из'&&GEN[n]?GEN[n]:w.length>7?w:num(n); }
    else if(d&&UNIT[d[2].toLowerCase()]) r=num(+d[1])+' '+UNIT[d[2].toLowerCase()];
    else if(SLOV.hasOwnProperty(lw)&&(lw.length>1||/^[xCS]$/.test(w))) r=SLOV[lw];
    if(r!=null&&r!==w){ if(mt.index>last) put(last,mt.index-last,text.slice(last,mt.index)); put(mt.index,w.length,r); last=mt.index+w.length; }
    if(!/^\s/.test(w)) prev=lw; }
  if(last<text.length) put(last,text.length-last,text.slice(last));
  return { s:out, back:function(i){ for(var j=seg.length-1;j>=0;j--){ var g=seg[j]; if(i>=g[2]) return g[0]+Math.min(g[1],Math.round((i-g[2])*g[1]/Math.max(1,g[3]))); } return 0; } }; };
/* Записанный голос (11.11.2026, Яндекс SpeechKit): одинаково хороший голос во всех браузерах и на телефонах.
   zvuk/spisok.json = { "ключ": "файл.mp3" }; ключ = G.key(текст) - число из прочитанного текста (после G.fix). Есть файл - играет файл, нет - голос устройства.
   Окна модулей и тренажёров (iframe) берут список и папку у главной страницы. Список и файлы делает скрипт озвучки (interier-grafika/kod/ozvuchka.py). */
var ZL=null, ZLwait=null;
G.key=function(text){ var t=G.fix(text).s.replace(/\s+/g,' ').trim().toLowerCase(), h=0x811c9dc5; for(var i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return ('0000000'+h.toString(16)).slice(-8); };
G.zdir=function(){ if(window.ZVUK_DIR) return window.ZVUK_DIR; try{ if(parent!==window&&parent.GOLOS&&parent.GOLOS.zdir) return parent.GOLOS.zdir(); }catch(e){} return new URL('zvuk/',location.href).href; };
G.zlist=function(){ if(ZL||ZLwait) return; try{ if(parent!==window&&parent.GOLOS&&parent.GOLOS.zmap){ ZL=parent.GOLOS.zmap(); if(ZL) return; } }catch(e){}
  if(!window.fetch) return; ZLwait=fetch(G.zdir()+'spisok.json',{cache:'no-store'}).then(function(r){ return r.ok?r.json():{}; }).then(function(j){ ZL=j||{}; },function(){ ZL={}; }); };
G.zmap=function(){ return ZL; };
function zSay(text,o){ if(!ZL) return false; var k=G.key(text), file=ZL[k]; if(!file) return false;
  var f=G.fix(text), au=G.au=new Audio(G.zdir()+file), done=false; au.volume=G.vol;
  function end(ok){ if(done) return; done=true; if(G.au===au) G.au=null; o.onend&&o.onend(ok); }
  function back(){ if(done) return; done=true; if(G.au===au) G.au=null; if(G.can()){ var sp={s:f.s,back:f.back,o:o,pos:0}, d2=false; sp.end=function(){ if(d2) return; d2=true; if(G.sp===sp) G.sp=null; o.onend&&o.onend(true); }; G.sp=sp; speakFrom(sp); } else o.onend&&o.onend(false); }
  au.ontimeupdate=function(){ if(o.onb&&au.duration) o.onb(f.back(Math.min(f.s.length,Math.round(f.s.length*au.currentTime/au.duration)))); };
  au.onended=function(){ if(o.onb) o.onb(f.back(f.s.length)); end(true); }; au.onerror=back; var pr=au.play(); if(pr&&pr.catch) pr.catch(back); return true; }
G.zlist();
if(syn&&syn.getVoices) syn.getVoices(); /* Chrome загружает список голосов не сразу */
})();
