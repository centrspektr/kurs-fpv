/* Курс FPV. (c) 2026 Александр Наумов, "Клуб и взлёт". Все права защищены. Копирование и переделка без разрешения автора запрещены. KFPV-AN-2026 */
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
  /* 17.11 (исправление): can() - "голос есть". Раньше это значило "в устройстве есть русский голос", и модуль 2 (монитор, приветствие)
     молчал там, где голоса устройства нет: встроенный браузер Telegram/VK, часть телефонов. Голос теперь - записи Леры, им голос устройства не нужен.
     dev() - есть ли голос устройства (для выбора голоса в настройках). */
  can:function(){ return !!window.Audio||G.dev(); },
  dev:function(){ return !!syn&&list().length>0; },
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
  /* 17.11: только записанный голос Леры. Записи нет - молчим (текст на экране остаётся), голос устройства ("робот") больше не подменяет.
     Список записей ещё грузится - ждём его и тогда играем. Чего не хватило - в GOLOS.miss (для дозаписи). */
  say:function(text,o){ o=o||{}; G.stop(); if(!G.on){ o.onend&&o.onend(false); return false; }
    if(zSay(text,o)) return true;
    if(!ZL&&ZLwait){ var tok={}; G.zt=tok; ZLwait.then(function(){ if(G.zt!==tok) return; G.zt=null; if(!zSay(text,o)){ zMiss(text); o.onend&&o.onend(false); } }); return true; }
    zMiss(text); o.onend&&o.onend(false); return false; } };
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
   zvuk/spisok.json = { "ключ": "файл.mp3" }; ключ = G.key(текст) - число из прочитанного текста (после G.fix). Есть файл - играет файл, нет - молчит (17.11: голос устройства больше не подменяет запись; проба golos-proba.js на new.html).
   Окна модулей и тренажёров (iframe) берут список и папку у главной страницы. Список и файлы делает скрипт озвучки (interier-grafika/kod/ozvuchka.py). */
var ZL=null, ZLwait=null;
G.key=function(text){ var t=G.fix(text).s.replace(/\s+/g,' ').trim().toLowerCase(), h=0x811c9dc5; for(var i=0;i<t.length;i++){ h^=t.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return ('0000000'+h.toString(16)).slice(-8); };
G.zdir=function(){ if(window.ZVUK_DIR) return window.ZVUK_DIR; try{ if(parent!==window&&parent.GOLOS&&parent.GOLOS.zdir) return parent.GOLOS.zdir(); }catch(e){} return new URL('zvuk/',location.href).href; };
G.zlist=function(){ if(ZL||ZLwait) return; try{ if(parent!==window&&parent.GOLOS&&parent.GOLOS.zmap){ ZL=parent.GOLOS.zmap(); if(ZL) return; } }catch(e){}
  if(!window.fetch) return; ZLwait=fetch(G.zdir()+'spisok.json',{cache:'no-store'}).then(function(r){ return r.ok?r.json():{}; }).then(function(j){ ZL=j||{}; },function(){ ZL={}; }); };
G.zmap=function(){ return ZL; };
/* 12.11: целой фразы нет - режем на предложения и играем записи подряд (так записаны игры и длинные тексты).
   "Привет, Имя!" записать нельзя - вместо него звучит записанное "Привет!", на экране имя остаётся. Нет хоть одного предложения - голос устройства. */
function zSent(t){ return (String(t).match(/[^.!?…]+(?:[.!?…]+|$)\s*/g)||[]).map(function(x){ return x.trim(); }).filter(Boolean); }
function zFiles(text){ var f=ZL[G.key(text)]; if(f) return [f]; var p=zSent(text), r=[]; if(p.length<2&&!/^(Привет|Добро пожаловать), /.test(text)) return null;
  for(var i=0;i<p.length;i++){ var x=ZL[G.key(p[i])]; if(!x&&/^Привет, [^.!?]{1,40}!$/.test(p[i])) x=ZL[G.key('Привет!')]; if(!x&&/^Добро пожаловать, [^.!?]{1,40}!$/.test(p[i])) x=ZL[G.key('Добро пожаловать!')]; if(!x) return null; r.push(x); } return r.length?r:null; }
G.miss=[]; function zMiss(t){ if(G.miss.indexOf(t)<0){ G.miss.push(t); try{ console.info('GOLOS: нет записи -', t); }catch(e){} } }
G.zhas=function(t){ return !!(ZL&&zFiles(t)); };
var ZWAIT=null; /* браузер не дал играть до первого нажатия - ждём нажатия и играем */
function zGesture(fn){ ZWAIT=fn; if(zGesture.on) return; zGesture.on=1; var go=function(){ var f=ZWAIT; ZWAIT=null; if(f) f(); };
  ['pointerdown','keydown','touchstart'].forEach(function(e){ addEventListener(e,go,true); }); }
/* 17.11 вечер (проба): на телефоне (iPhone, Android) браузер даёт играть звук только тому плееру, который хоть раз запустили нажатием.
   Раньше каждое предложение играл новый плеер - на телефоне второе предложение могло не начаться без нового нажатия, и пояснение обрывалось.
   Теперь один плеер на все записи: первое касание экрана его "разрешает" (тихий звук), дальше он играет предложения подряд сам. */
var EL=null, SIL='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEwAAAAAAAAAAAAEluZm8AAAAPAAAACQAAA0gAUFBQUFBQUFBQUFBmZmZmZmZmZmZmZnx8fHx8fHx8fHx8kpKSkpKSkpKSkpKoqKioqKioqKioqL6+vr6+vr6+vr6+1NTU1NTU1NTU1NTq6urq6urq6urq6v//////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQD8AAAAAAAAANIWaLJEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//M0xAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xHYAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xLEAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//M0xMQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
function zEl(){ if(!EL){ EL=new Audio(); EL.preload='auto'; } return EL; }
(function(){ var un=function(){ var e=zEl(); if(e._ok||G.zt||G.au===e) return; e.onended=e.onerror=e.ontimeupdate=null; var s0=e.src; e.muted=true; e.src=SIL; var pr=e.play(); var fin=function(){ e._ok=1; e.muted=false; }; if(pr&&pr.then) pr.then(fin,function(){}); else fin(); };
  ['touchstart','pointerdown','keydown'].forEach(function(ev){ addEventListener(ev,un,{capture:true,passive:true}); }); })();
/* 19.11.2026: записи голоса упакованы в 16 файлов zvuk/p/0.mp3 ... zvuk/p/f.mp3 вместо 2830 отдельных - GitVerse не успевал их выкладывать и оставлял сайт пустым.
   zvuk/paket.json = { v: метка, f: { "3/g-xxx.mp3": [начало, длина] } } (делает .github/zvuk-paket.py). Запись берём из пакета запросом части файла (Range),
   сервер отдал пакет целиком - режем у себя. Нет paket.json - играем отдельные файлы, как раньше. Окна модулей и тренажёров берут записи у главной (общий кэш). */
var PK=null, PKwait=null, PKurl={}, PKbuf={};
G.zget=function(files){ try{ if(parent!==window&&parent.GOLOS&&parent.GOLOS.zget) return parent.GOLOS.zget(files); }catch(e){}
  var dir=G.zdir(); if(!window.fetch||!window.Blob||!window.URL||!URL.createObjectURL) return Promise.resolve(files.map(function(x){ return dir+x; }));
  if(!PKwait) PKwait=fetch(dir+'paket.json',{cache:'no-store'}).then(function(r){ return r.ok?r.json():null; }).then(function(j){ PK=j&&j.f?j:null; },function(){ PK=null; });
  return PKwait.then(function(){ return Promise.all(files.map(function(x){ return zOne(dir,x); })); }); };
function zOne(dir,x){ var e=PK&&PK.f[x]; if(!e) return Promise.resolve(dir+x); if(PKurl[x]) return Promise.resolve(PKurl[x]);
  var p=x.charAt(0), url=dir+'p/'+p+'.mp3?v='+PK.v, a=e[0], n=e[1];
  function mk(b){ return PKurl[x]=URL.createObjectURL(new Blob([b],{type:'audio/mpeg'})); }
  function whole(){ if(!PKbuf[p]){ PKbuf[p]=fetch(url).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); }); PKbuf[p].catch(function(){ delete PKbuf[p]; }); }
    return PKbuf[p].then(function(b){ return mk(b.slice(a,a+n)); }); }
  if(PKbuf[p]) return whole().catch(function(){ return dir+x; });
  return fetch(url,{headers:{Range:'bytes='+a+'-'+(a+n-1)}}).then(function(r){
    if(r.status===206) return r.arrayBuffer().then(function(b){ return b.byteLength===n?mk(b):whole(); });
    if(!r.ok) throw 0; PKbuf[p]=r.arrayBuffer(); return whole(); }).catch(function(){ return whole().catch(function(){ return dir+x; }); }); }
function zSay(text,o){ if(!ZL) return false; var files=zFiles(text); if(!files) return false;
  var wt={}; G.zt=wt; G.zget(files).then(function(u){ if(G.zt===wt) zSay1(text,o,u); }); return true; }
function zSay1(text,o,files){ /* files - готовые адреса записей (из пакета) */
  var f=G.fix(text), i=0, done=false, tok={}, a=zEl(), dir=''; G.zt=tok;
  function end(ok){ if(done) return; done=true; if(G.zt===tok) G.zt=null; if(G.au===a) G.au=null; o.onend&&o.onend(ok); }
  function back(){ if(done||G.zt!==tok) return; end(false); } /* файл не открылся - молчим, без голоса устройства */
  function prog(){ if(!o.onb||!a.duration) return; var u=(i-1+a.currentTime/a.duration)/files.length; o.onb(f.back(Math.min(f.s.length,Math.round(f.s.length*u)))); }
  function play(){ var pr=a.play(); if(pr&&pr.then) pr.then(function(){ a._ok=1; },function(){}); if(pr&&pr.catch) pr.catch(function(e){ if(G.zt!==tok||done) return; if(e&&e.name==='NotAllowedError') zGesture(function(){ if(G.zt===tok&&!done) play(); }); else if(!(e&&e.name==='AbortError')) back(); }); }
  function next(){ if(G.zt!==tok||done) return; if(i>=files.length){ if(o.onb) o.onb(f.back(f.s.length)); return end(true); } G.au=a; a.muted=false; a.volume=G.vol; a.src=dir+files[i++]; a.ontimeupdate=prog; a.onended=next; a.onerror=back; play(); }
  next(); return true; }
G.zlist();
if(syn&&syn.getVoices) syn.getVoices(); /* Chrome загружает список голосов не сразу */
})();
