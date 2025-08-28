/* BETWIN Frontend Demo Script */

/* ---------------- DOM Helpers ---------------- */
const $ = id => document.getElementById(id);
const fmt = n => Number(n).toFixed(2);
const now = () => Date.now();

/* DOM references */
const balEl = $('balance'),
      roundEl = $('roundNum'),
      phaseEl = $('phase'),
      timerEl = $('timer'),
      playersEl = $('players'),
      upTotalEl = $('upTotal'),
      downTotalEl = $('downTotal'),
      upBotsList = $('upBotsList'),
      downBotsList = $('downBotsList'),
      activity = $('activity'),
      priceVal = $('priceVal'),
      priceArrow = $('priceArrow');

/* ---------------- LocalStorage Keys ---------------- */
const K = {
  BAL: 'mb_bal_v1',
  SERIES: 'mb_series_v1',
  EPOCH: 'mb_epoch_v1',
  ROUND: 'mb_round_v1',
  START_PRICE: 'mb_start_price_v1',
  UP_TOTAL: 'mb_up_total_v1',
  DOWN_TOTAL: 'mb_down_total_v1',
  MY_BETS: 'mb_my_bets_v1'
};

/* ---------------- Initial State ---------------- */
let balance = parseFloat(localStorage.getItem(K.BAL));
if (!Number.isFinite(balance)) { balance = 100; localStorage.setItem(K.BAL, balance); }
balEl.textContent = fmt(balance);

let series = JSON.parse(localStorage.getItem(K.SERIES) || '[100]');
localStorage.setItem(K.SERIES, JSON.stringify(series));

function getEpoch(){ 
  let e = parseInt(localStorage.getItem(K.EPOCH) || '0',10); 
  if(!e){ e = now(); localStorage.setItem(K.EPOCH, e); } 
  return e; 
}
function setEpoch(t){ localStorage.setItem(K.EPOCH, t); }
function getRound(){ 
  let r = parseInt(localStorage.getItem(K.ROUND) || '1',10); 
  if(!r){ r=1; localStorage.setItem(K.ROUND, r); } 
  return r; 
}
function setRound(n){ localStorage.setItem(K.ROUND, n); roundEl.textContent = n; }

let epoch = getEpoch();
let roundNum = getRound();
roundEl.textContent = roundNum;

let totals = { up: parseFloat(localStorage.getItem(K.UP_TOTAL) || '0'),
               down: parseFloat(localStorage.getItem(K.DOWN_TOTAL) || '0') };
upTotalEl.textContent = fmt(totals.up); downTotalEl.textContent = fmt(totals.down);

let myBets = JSON.parse(localStorage.getItem(K.MY_BETS) || '[]');

/* ---------------- Chart Setup ---------------- */
const ctx = $('priceChart').getContext('2d');
let upColor = '#00d27a', downColor = '#ff4d4f';
function gradient(up=true){
  const g = ctx.createLinearGradient(0,0,0,360);
  if(up){ g.addColorStop(0,'rgba(0,210,122,.18)'); g.addColorStop(1,'rgba(0,210,122,.04)'); }
  else { g.addColorStop(0,'rgba(255,77,79,.16)'); g.addColorStop(1,'rgba(255,77,79,.04)'); }
  return g;
}
const chart = new Chart(ctx,{
  type:'line',
  data:{ labels: series.map((_,i)=>i), datasets:[{
    data: series,
    borderColor: upColor,
    backgroundColor: gradient(true),
    borderWidth:2.4, pointRadius:0, tension:0.35, fill:true
  }]},
  options:{ animation:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false}, y:{display:false}}, responsive:true, maintainAspectRatio:false }
});

/* ---------------- Price Animation ---------------- */
let target = series[series.length-1];
let start = target;
let segStart = performance.now();
const SEG_MS = 900;
function pickTarget(){
  const drift = (Math.random()-0.5)*1.6;
  start = target;
  target = Math.max(10, +(target + drift).toFixed(3));
  segStart = performance.now();
}
setInterval(pickTarget, SEG_MS);

function frame(ts){
  const p = Math.min(1, (ts - segStart)/SEG_MS);
  const current = start + (target - start)*p;
  series.push(+current.toFixed(3));
  if(series.length>240) series.shift();
  chart.data.datasets[0].data = series;
  const up = current >= series[series.length-2];
  chart.data.datasets[0].borderColor = up ? upColor : downColor;
  chart.data.datasets[0].backgroundColor = gradient(up);
  chart.update('none');

  if(priceVal) priceVal.textContent = '$'+(+current).toFixed(3);
  if(priceArrow) priceArrow.textContent = up?'▲':'▼';
  localStorage.setItem(K.SERIES, JSON.stringify(series));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------- Round State ---------------- */
const BET_WINDOW = 20, RESULT_WINDOW = 5, CYCLE = BET_WINDOW + RESULT_WINDOW;
function computeState(){
  const elapsed = Math.floor((now()-epoch)/1000);
  const pos = elapsed % CYCLE;
  const inBet = pos < BET_WINDOW;
  const timeLeft = inBet?(BET_WINDOW-pos):(CYCLE-pos);
  phaseEl.textContent = inBet?'BETTING':'RESULT';
  timerEl.textContent = timeLeft+'s';
  return {pos, inBet, timeLeft};
}

/* ---------------- Bots ---------------- */
const BOT_NAMES = ['Alpha','Beta','Crypto','Satoshi','Luna','Mira','Vikram','Zara','Robo1','TraderZ','Nina','Kai','Rohit','Asha'];
function randName(){ return BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]+Math.floor(Math.random()*90+10); }
function randAmt(){ return +(Math.random()*24.5+0.5).toFixed(2); }
function makeAvatarInitials(name){ return name.split(/[^A-Za-z0-9]/).map(s=>s[0]).slice(0,2).join('').toUpperCase(); }
function genBotsForSide(count, side){
  const arr = [];
  for(let i=0;i<count;i++){
    const name = randName();
    arr.push({ id:name+'_'+Math.floor(Math.random()*99999), name, avatar:makeAvatarInitials(name), amount:randAmt(), side });
  }
  return arr;
}
function renderBots(upBots, downBots){
  upBotsList.innerHTML = upBots.map(b=>`<div class="bot"><div class="avatar" style="background:#0b2">${b.avatar}</div><div class="meta"><div class="name">${b.name}</div><div class="meta-sub">${b.side.toUpperCase()}</div></div><div class="amt">$${fmt(b.amount)}</div></div>`).join('');
  downBotsList.innerHTML = downBots.map(b=>`<div class="bot"><div class="avatar" style="background:#f66">${b.avatar}</div><div class="meta"><div class="name">${b.name}</div><div class="meta-sub">${b.side.toUpperCase()}</div></div><div class="amt">$${fmt(b.amount)}</div></div>`).join('');
}

/* ---------------- Round Lifecycle ---------------- */
let lastPos=-1;
let currentUpBots=[], currentDownBots=[];
let settledRounds = new Set();

setInterval(()=>{
  const s = computeState();

  if(s.pos===0 && lastPos!==0){
    epoch = now(); setEpoch(epoch);
    roundNum = getRound()+1; setRound(roundNum);
    const upCount = Math.floor(Math.random()*(20-8+1))+8;
    const downCount = Math.floor(Math.random()*(20-8+1))+8;
    currentUpBots = genBotsForSide(upCount,'up');
    currentDownBots = genBotsForSide(downCount,'down');

    let upTot = currentUpBots.reduce((s,b)=>s+b.amount,0);
    let downTot = currentDownBots.reduce((s,b)=>s+b.amount,0);
    totals.up = +(upTot + parseFloat(localStorage.getItem(K.UP_TOTAL)||0)).toFixed(2);
    totals.down = +(downTot + parseFloat(localStorage.getItem(K.DOWN_TOTAL)||0)).toFixed(2);
    upTotalEl.textContent = fmt(totals.up); downTotalEl.textContent = fmt(totals.down);

    renderBots(currentUpBots,currentDownBots);
    log(`Round ${getRound()} started • Bots: UP ${upCount}, DOWN ${downCount}`);
  }

  if(s.pos===BET_WINDOW && lastPos!==BET_WINDOW){
    settleRoundOnce();
  }
  lastPos = s.pos;
},300);

/* ---------------- Place Bet ---------------- */
function placeBetUser(side){
  const amt = parseFloat($('betAmount').value||'0');
  if(!(amt>0)) return toast('Enter valid amount');
  const s = computeState();
  if(!s.inBet) return toast('Betting closed');
  if(balance<amt) return toast('Insufficient balance');

  balance = +(balance-amt).toFixed(2); setBalance(balance);
  if(side==='up') totals.up = +(totals.up+amt).toFixed(2); else totals.down = +(totals.down+amt).toFixed(2);
  upTotalEl.textContent = fmt(totals.up); downTotalEl.textContent = fmt(totals.down);

  myBets.push({round:getRound(), side, amount:amt});
  localStorage.setItem(K.MY_BETS, JSON.stringify(myBets));

  log(`You bet $${fmt(amt)} on ${side.toUpperCase()}`);
}
$('betUp').addEventListener('click',()=>placeBetUser('up'));
$('betDown').addEventListener('click',()=>placeBetUser('down'));

/* ---------------- Settle Round ---------------- */
function settleRoundOnce(){
  const r = getRound();
  if(settledRounds.has(r)) return;
  settledRounds.add(r);

  const startPrice = series[series.length-2]||series[0];
  const endPrice = series[series.length-1];
  const result = endPrice>=startPrice?'up':'down';

  const roundBets = myBets.filter(b=>b.round===r);
  let credit = 0;
  roundBets.forEach(b=>{ if(b.side===result) credit+=b.amount*2; });
  if(credit>0){ setBalance(balance+credit); log(`Result ${result.toUpperCase()} • You won +$${fmt(credit)}`);}
  else log(`Result ${result.toUpperCase()} • You had no winning bets`);

  myBets = myBets.filter(b=>b.round!==r);
  localStorage.setItem(K.MY_BETS, JSON.stringify(myBets));

  setTimeout(()=>{
    currentUpBots=[]; currentDownBots=[];
    renderBots([],[]);
    totals.up=0; totals.down=0;
    upTotalEl.textContent = fmt(totals.up); downTotalEl.textContent = fmt(totals.down);
    settledRounds.delete(r);
  },1800);
}

/* ---------------- Activity Log ---------------- */
function log(msg){
  const row = document.createElement('div');
  row.className='row';
  const t = new Date().toLocaleTimeString();
  row.innerHTML=`<span>${t}</span><span>${msg}</span>`;
  activity.querySelector('.hint')?.remove();
  activity.prepend(row);
  while(activity.children.length>40) activity.lastChild.remove();
}
function toast(msg){ log(msg); }

/* ---------------- Players Demo ---------------- */
setInterval(()=>{ if(playersEl) playersEl.textContent=Math.floor(30+Math.random()*40); },1500);

/* ---------------- Modal ---------------- */
$('openDeposit').addEventListener('click',()=>openModal('depositModal'));
$('openWithdraw').addEventListener('click',()=>openModal('withdrawModal'));
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',e=>closeModal(e.currentTarget.getAttribute('data-close'))));
function openModal(id){ $(id).classList.remove('hidden'); }
function closeModal(id){ $(id).classList.add('hidden'); }
