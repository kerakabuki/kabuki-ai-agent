import { receptionGifts, GIFT_PATH, giftFilename } from './reception_gifts.js';
import { KERA_SITE_URL, KERA_OGP_URL } from './kera_brand.js';
const PATH = '/kerakabuki/survey';
const API = '/api/kerakabuki/survey';
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// <script> 内へ埋め込む値。</script> の混入でスクリプトが途切れないようにする。
const embed = value => JSON.stringify(value).replace(/</g, '\\u003c');
const questionsOf = survey => survey.sections.flatMap(s => s.questions);
const css = `
:root{color-scheme:light;--ink:#262c34;--muted:#626872;--paper:#f6f2e9;--red:#963e3a;--border:#ded9cf;--green:#2f6254}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"BIZ UDPGothic","Yu Gothic",Meiryo,sans-serif;font-size:16px;line-height:1.8}a{color:var(--red)}button,input,textarea{font:inherit}button,a.button{cursor:pointer;touch-action:manipulation}button:disabled{cursor:wait;opacity:.55}[hidden]{display:none!important}header{background:#232c32;color:#fff;border-top:7px solid transparent;border-image:repeating-linear-gradient(90deg,#171d23 0 42px,#b14d38 42px 84px,#788970 84px 126px) 7;padding:22px 24px}header a{color:#fff;text-decoration:none;letter-spacing:.16em;font-weight:bold}header small{display:block;font-size:11px;letter-spacing:.18em;color:#ccc}.wrap{max-width:680px;margin:auto;padding:30px 20px 55px}.wide{max-width:1160px}h1{font-family:"Yu Mincho",serif;font-size:31px;letter-spacing:.04em;line-height:1.5;margin:8px 0 18px}h2{font-size:21px;margin:0 0 18px}h3{font-size:17px;line-height:1.6;margin:0 0 4px}.eyebrow{font-size:12px;letter-spacing:.14em;color:var(--red);font-weight:bold}.intro{margin-bottom:25px}.intro p{margin:0 0 10px}.intro ul{margin:0;padding-left:1.3em}.intro li{margin:3px 0}.muted,.hint{color:var(--muted);font-size:14px}.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:25px;margin:20px 0;box-shadow:0 3px 10px #22200004}fieldset{border:0;margin:0;padding:0;min-width:0}legend,.label{font-weight:bold;display:block;margin-bottom:10px;padding:0}.required{font-size:11px;color:var(--red);border:1px solid #dfb6ae;padding:2px 5px;margin-left:8px;border-radius:3px;vertical-align:middle;white-space:nowrap}input[type=text],textarea{width:100%;min-height:49px;border:1px solid #abaea9;border-radius:6px;padding:10px 12px;background:#fff;color:var(--ink)}textarea{min-height:170px;resize:vertical;line-height:1.7}input:focus,textarea:focus,button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #c4863b;outline-offset:2px}input[type=radio],input[type=checkbox]{accent-color:var(--red);width:20px;height:20px;flex-shrink:0}.choice{display:flex;align-items:center;gap:12px;border:1px solid var(--border);padding:13px 14px;border-radius:7px;margin:9px 0;cursor:pointer;line-height:1.6}.choice:has(input:checked){border-color:var(--red);background:#faf1ed}.q{margin:0 0 34px}.q:last-child{margin-bottom:0}.qhint{margin:-6px 0 6px}.qerror{color:#8d2424;font-weight:bold;font-size:14px;margin:8px 0 0}.otherField{margin:4px 0 12px 34px}.count{text-align:right;margin:4px 0 0}button,.button{display:inline-block;border:1px solid var(--red);background:var(--red);color:#fff;border-radius:6px;padding:12px 20px;text-align:center;text-decoration:none;font-weight:bold;min-height:49px}.secondary{background:#fff;color:var(--red)}.small{padding:8px 16px;min-height:44px;font-size:15px}.full{width:100%;margin-top:12px}.notice{padding:15px 18px;background:#ecefe8;border-left:4px solid #60775e;border-radius:3px}.preview{background:#fff0c9;border-left:4px solid #b98520;margin-bottom:20px;padding:12px 16px;font-weight:bold;font-size:14px}.error{color:#8d2424;background:#fff0ee;padding:12px 15px;border-radius:5px;margin:12px 0}.privacy{font-size:13px;color:var(--muted);line-height:1.9;margin:24px 0 0}.hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.thanks{text-align:center}.giftList{list-style:none;margin:16px 0 0;padding:0}.giftItem{display:grid;grid-template-columns:72px 1fr;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--border)}.giftItem img{width:72px;height:auto;aspect-ratio:724/1244;object-fit:contain;border-radius:4px;background:#eceae3}.giftItem strong{display:block;margin-bottom:6px;line-height:1.5}.giftLinks{display:flex;gap:8px;flex-wrap:wrap}.links{display:grid;gap:10px}.dark{background:#232c32;border-color:#232c32}.toolbar{display:flex;gap:10px;flex-wrap:wrap}footer{text-align:center;color:var(--muted);font-size:12px;padding:20px}noscript{display:block;background:#fff0ee;padding:20px;margin:20px 0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:22px 0 6px}.kpi{background:#fff;border:1px solid var(--border);border-radius:8px;padding:14px 18px}.kpi span{display:block;color:var(--muted);font-size:13px}.kpi strong{display:block;font-family:"BIZ UDPGothic","Yu Gothic",Meiryo,sans-serif;font-size:28px;font-weight:bold;line-height:1.4}.kpi small{font-size:14px;font-weight:normal;color:var(--muted);margin-left:3px}.tallyGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(470px,100%),1fr));gap:0 20px}.bars{margin:12px 0 0}.barRow{display:grid;grid-template-columns:minmax(7em,15em) minmax(60px,1fr) 4.2em 4.8em;gap:2px 12px;align-items:center;padding:4px 0;font-size:14px}.barLabel{overflow-wrap:anywhere;line-height:1.5}.barTrack{height:24px;display:flex;align-items:center;border-left:1px solid #c9c4ba}.bar{display:block;height:12px;background:#963e3a;border-radius:0 4px 4px 0;min-width:2px}.barCount,.barPct{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.barCount{color:var(--ink)}.barPct{color:var(--muted)}details{margin-top:14px;font-size:14px}summary{cursor:pointer;color:var(--red)}details ul{margin:8px 0 0;padding-left:1.3em}details li{overflow-wrap:anywhere}.filter{display:inline-flex}.resp{border-top:1px solid var(--border);padding:16px 0}.resp.isExcluded>:not(button){opacity:.55}.respMeta{font-size:13px;color:var(--muted);margin:0 0 6px}.badges{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}.pill{font-size:12px;padding:3px 8px;border-radius:4px;background:#f4e6d6}.pill.ok{background:#dfeee6;color:#275647}.pill.off{background:#eceae3;color:var(--muted)}.respComment{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 8px}
@media(max-width:480px){.wrap{padding:24px 16px 40px}.card{padding:20px 16px}h1{font-size:27px}.choice{padding:12px 10px}.otherField{margin-left:0}.toolbar>*{flex:1 1 auto;white-space:nowrap}.barRow{grid-template-columns:1fr 4em 4.6em}.barLabel{grid-column:1/-1}}
`;
function shell(title, body, script = '', { preview = false, wide = false, head = '' } = {}) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} | 気良歌舞伎</title>${head}<link rel="icon" href="/assets/kera-favicon-32.png" type="image/png" sizes="32x32"><style>${css}</style></head><body><header><a href="/kerakabuki">気良歌舞伎<small>KERAKABUKI · KABUKI PLUS+</small></a></header><main class="wrap ${wide ? 'wide' : ''}">${preview ? '<div class="preview">試作・動作確認用です。架空の内容でお試しください。</div>' : ''}${body}</main><footer>気良歌舞伎 · KABUKI PLUS+</footer>${script ? `<script>${script}</script>` : ''}</body></html>`;
}
const commonJS = String.raw`
const $=id=>document.getElementById(id);
function el(tag,text,className){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;return n;}
function showError(message,id='error'){const e=$(id);e.textContent=message;e.hidden=false;e.focus();}
async function requestJSON(url,options={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});let d;try{d=await r.json()}catch{throw Error('通信を確認できません。時間をおいてお試しください。')}if(!r.ok)throw Object.assign(Error(d.error||'処理を完了できませんでした。'),{status:r.status});return d;}
function store(key,value){try{if(value===null)sessionStorage.removeItem(key);else sessionStorage.setItem(key,value)}catch{}}
function stored(key){try{return sessionStorage.getItem(key)}catch{return null}}
`;
const nextCard = () => `<div class="card"><h2>次回公演のご案内</h2><p>令和9年（2027年）9月の公演のご案内を、メールや郵送でお届けします。</p><a class="button full" href="/kerakabuki/annai">ご案内の受け取り方法を選ぶ →</a></div>`;

// 設問HTMLはすべて定義から生成する。表示名は必ずエスケープする。
function questionHTML(q) {
  const badge = q.required ? '<span class="required">必須</span>' : '';
  const hintId = `${q.id}-hint`; const errorId = `${q.id}-error`;
  const hint = q.hint ? `<p class="hint qhint" id="${hintId}">${escape(q.hint)}</p>` : '';
  const error = `<p class="qerror" id="${errorId}" hidden></p>`;
  // ヒントとエラーは各入力に結び付け、どの選択肢にフォーカスしても読み上げられるようにする。
  const described = [q.hint ? hintId : '', errorId].filter(Boolean).join(' ');
  if (q.type === 'text') {
    return `<div class="q" id="q-${q.id}"><label class="label" for="${q.id}">${escape(q.label)}${badge}</label>${hint}<textarea id="${q.id}" name="${q.id}" rows="7" maxlength="${q.max}" autocomplete="off" aria-describedby="${described} ${q.id}-count"></textarea><p class="hint count" id="${q.id}-count" aria-live="polite">0 / ${q.max}</p>${error}</div>`;
  }
  const type = q.type === 'single' ? 'radio' : 'checkbox';
  const options = q.options.map(([value, label]) => `<label class="choice"><input type="${type}" name="${q.id}" value="${escape(value)}" aria-describedby="${described}">${escape(label)}</label>${q.other && value === 'other' ? `<div class="otherField" id="${q.id}-otherField" hidden><label class="label" for="${q.id}_other">その他の内容</label><input type="text" id="${q.id}_other" name="${q.id}_other" maxlength="100" autocomplete="off" aria-describedby="${errorId}" disabled></div>` : ''}`).join('');
  return `<fieldset class="q" id="q-${q.id}"${q.dependsOn ? ' hidden disabled' : ''}><legend>${escape(q.label)}${badge}</legend>${hint}${options}${error}</fieldset>`;
}

export function surveyPage(survey, { open = true, available = true, preview = false } = {}) {
  const head = `<meta name="description" content="${escape(survey.shareDescription)}"><meta property="og:title" content="${escape(survey.shareTitle)}"><meta property="og:description" content="${escape(survey.shareDescription)}"><meta property="og:image" content="${KERA_OGP_URL}"><meta property="og:url" content="${KERA_SITE_URL}/survey/${escape(survey.id)}"><meta property="og:type" content="website"><meta property="og:site_name" content="気良歌舞伎"><meta name="twitter:card" content="summary_large_image">`;
  const top = `<div class="eyebrow">${escape(survey.eyebrow)}</div><h1>${escape(survey.title)}</h1>`;
  const official = '<p><a href="/kerakabuki">気良歌舞伎 公式サイトへ →</a></p>';
  // 締切後はDBの状態にかかわらず終了の案内を出す。
  if (!open) return shell(survey.title, `${top}<div class="notice">アンケートの受付は終了しました（${escape(survey.closesLabel)}まで）。ご協力ありがとうございました。</div>${nextCard()}${official}`, '', { preview, head });
  if (!available) return shell(survey.title, `${top}<div class="error">アンケートの準備中です。時間をおいてお試しください。</div>`, '', { preview, head });
  const gifts = receptionGifts.map(g => `<li class="giftItem"><img data-src="${GIFT_PATH}/${g.id}-thumb.webp" alt="" width="180" height="309" decoding="async"><div><strong>${escape(g.name)}</strong><div class="giftLinks"><a class="button secondary small" href="${GIFT_PATH}/${g.id}.png?view=1" target="_blank" rel="noopener noreferrer" aria-label="${escape(g.name)}のカードを開く（新しいタブ）">開く ↗</a><a class="button small" href="${GIFT_PATH}/${g.id}.png" download="${escape(giftFilename(g))}" aria-label="${escape(g.name)}のカードを保存">保存</a></div></div></li>`).join('');
  const body = `${top}<div class="intro" id="intro"><p>「曽根崎心中」にご来場いただき、ありがとうございました。これからの気良歌舞伎づくりのため、ご感想をお聞かせください。</p><ul><li>3分ほどで終わります</li><li>「必須」の質問のほかは、答えられるものだけで結構です</li><li>お名前やご連絡先はうかがいません（無記名）</li><li>回答期限：${escape(survey.closesLabel)}</li></ul></div>
<noscript>このアンケートはJavaScriptを使用します。</noscript>
<section id="formSection"><form id="surveyForm" method="post" novalidate>
${survey.sections.map(s => `<div class="card"><h2>${escape(s.title)}</h2>${s.questions.map(questionHTML).join('')}</div>`).join('')}
<div class="hp" aria-hidden="true"><label>ウェブサイト<input name="website" tabindex="-1" autocomplete="off"></label></div>
<p class="privacy">このアンケートは無記名です。お名前・ご連絡先はうかがいません。いただいた回答は、気良歌舞伎の公演づくりと、個人が特定されない形での集計結果の公表に使います。ご感想は、紹介を許可いただいた場合に限り、お名前を出さずに公式サイトやSNSで紹介することがあります。お問い合わせ：<a href="mailto:kerakabuki@gmail.com">kerakabuki@gmail.com</a></p>
<div id="error" class="error" hidden role="alert" tabindex="-1"></div>
<button type="submit" id="submit" class="full">回答を送信する</button>
</form></section>
<section id="thanksSection" hidden><div class="card thanks"><div class="eyebrow">THANK YOU</div><h2 tabindex="-1" id="thanksTitle">ご回答ありがとうございました</h2><p>いただいたご感想は、座員みんなで読ませていただきます。来年の舞台づくりに生かしてまいります。</p><p class="notice" id="alreadyNotice" hidden>この回答は、すでに受け付けています（最初にお送りいただいた内容で記録しています）。</p></div>
<div class="card"><h2>ご来場記念デジタルカード</h2><p>お礼に、白浪五人男の来場記念カードをお受け取りください。スマートフォンに保存できます。</p><ul class="giftList">${gifts}</ul><p class="hint">保存できないときは「開く」から、長押しや共有メニューで保存してください。</p></div>
${nextCard()}
<div class="card"><h2>気良歌舞伎をもっと</h2><div class="links"><a class="button secondary" href="/kerakabuki">公式サイト</a><a class="button dark" href="https://www.youtube.com/@kerakabuki" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a class="button secondary" href="https://www.instagram.com/kerakabuki_official/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div></div>
<button type="button" id="another" class="secondary full">別の方の回答をする</button></section>`;
  const questions = questionsOf(survey).map(({ id, type, required, other, exclusive, dependsOn, label, short, max }) => ({ id, type, required: !!required, other: !!other, exclusive: exclusive || null, dependsOn: dependsOn || null, label, short, max: max || null }));
  const script = commonJS + String.raw`
const api=${embed(API + '/' + survey.id)};const questions=${embed(questions)};
const requestKey=${embed('kera-survey-' + survey.id + '-request')};const doneKey=${embed('kera-survey-' + survey.id + '-done')};
const form=$('surveyForm');let sending=false;
// 古い端末で crypto.randomUUID がなければ getRandomValues で UUID v4 を作る。
const newId=()=>crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
let requestId=stored(requestKey)||newId();store(requestKey,requestId);
function done(on){try{if(on)localStorage.setItem(doneKey,'1');else localStorage.removeItem(doneKey)}catch{}}
function isDone(){try{return localStorage.getItem(doneKey)==='1'}catch{return false}}
const inputs=name=>[...form.querySelectorAll('input[name="'+name+'"]')];
function sync(){for(const q of questions){
 if(q.other){const on=inputs(q.id).some(i=>i.value==='other'&&i.checked);$(q.id+'-otherField').hidden=!on;$(q.id+'_other').disabled=!on}
 if(q.dependsOn){const on=$(q.dependsOn).value.trim()!=='';const box=$('q-'+q.id);box.hidden=!on;box.disabled=!on}
 if(q.type==='text')$(q.id+'-count').textContent=$(q.id).value.length+' / '+q.max;
}}
const fields=id=>[...$('q-'+id).querySelectorAll('input,textarea')];
function clearError(id){const e=$(id+'-error');e.hidden=true;e.textContent='';for(const f of fields(id))f.removeAttribute('aria-invalid')}
form.addEventListener('change',e=>{const t=e.target;const q=questions.find(x=>x.id===t.name);if(q&&q.exclusive&&t.checked){for(const i of inputs(q.id))if(i!==t&&(t.value===q.exclusive||i.value===q.exclusive))i.checked=false}if(q)clearError(q.id);sync()});
form.addEventListener('input',e=>{if(e.target.tagName==='TEXTAREA'){clearError(e.target.name);sync()}});
function collect(){const answers={};for(const q of questions){
 if($('q-'+q.id).disabled)continue;
 if(q.type==='single'){const c=inputs(q.id).find(i=>i.checked);if(c)answers[q.id]=c.value}
 else if(q.type==='multi'){const v=inputs(q.id).filter(i=>i.checked).map(i=>i.value);if(v.length)answers[q.id]=v;if(q.other&&v.includes('other')&&$(q.id+'_other').value.trim())answers[q.id+'_other']=$(q.id+'_other').value}
 else if($(q.id).value.trim())answers[q.id]=$(q.id).value;
}return answers}
function validate(answers){let first=null;for(const q of questions){clearError(q.id);let message='';
 if(q.required&&answers[q.id]===undefined)message='「'+q.label+'」にお答えください。';
 else if(q.max&&(answers[q.id]||'').trim().length>q.max)message='「'+q.short+'」は'+q.max+'文字以内でお書きください。';
 else if(q.other&&(answers[q.id+'_other']||'').trim().length>100)message='「'+q.short+'（その他）」は100文字以内でお書きください。';
 if(message){const e=$(q.id+'-error');e.textContent=message;e.hidden=false;for(const f of fields(q.id))f.setAttribute('aria-invalid','true');if(!first)first=q}
}if(first){const box=$('q-'+first.id);box.scrollIntoView({block:'center'});box.querySelector('input,textarea').focus({preventScroll:true})}return !first}
function thanks(already=false){$('alreadyNotice').hidden=!already;$('intro').hidden=true;$('formSection').hidden=true;$('thanksSection').hidden=false;for(const img of $('thanksSection').querySelectorAll('img[data-src]')){img.src=img.dataset.src;img.removeAttribute('data-src')}$('thanksTitle').focus();window.scrollTo(0,0)}
form.addEventListener('submit',async e=>{e.preventDefault();if(sending)return;$('error').hidden=true;const answers=collect();if(!validate(answers))return;sending=true;const button=$('submit');button.disabled=true;button.textContent='送信しています…';try{await requestJSON(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId,website:form.elements.website.value,answers})});done(true);thanks()}catch(err){
 // 同じ送信番号で内容違い（409）は、最初の回答が記録済みなので完了画面へ進める。
 if(err.status===409){done(true);thanks(true);return}
 showError(err.message+' 送信済みの場合も、同じ内容で再送すれば二重には記録されません。')}finally{sending=false;button.disabled=false;button.textContent='回答を送信する'}});
$('another').onclick=()=>{done(false);store(requestKey,null);form.reset();location.reload()};
sync();if(isDone())thanks();
`;
  return shell(survey.title, body, script, { preview, head });
}

export function surveyLoginPage(survey, status) {
  return shell('アンケート集計', `<h1>アンケート集計</h1><div class="card"><p>${status === 401 ? 'KABUKI PLUS+にログインしてから、この画面へお戻りください。' : 'この画面は気良歌舞伎の管理担当者のみ利用できます。管理者に権限をご確認ください。'}</p><a class="button" href="/jikabuki/base">KABUKI PLUS+でログインする</a><p><a href="${PATH}/${escape(survey.id)}/admin">ログイン後に集計画面を開く</a></p><a href="${PATH}/${escape(survey.id)}">アンケートの回答画面はこちら</a></div>`);
}

export function surveyAdminPage(survey, { preview = false } = {}) {
  const eyebrow = survey.eyebrow.split(' · ')[0] + ' · 担当者専用';
  const body = `<div class="eyebrow">${escape(eyebrow)}</div><h1>アンケート集計</h1><div class="toolbar"><button type="button" id="reload" class="secondary">一覧を更新</button><a class="button secondary" href="${API}/${escape(survey.id)}/admin/export">CSVを書き出す</a><a class="button secondary" href="${PATH}/${escape(survey.id)}">回答画面を開く</a></div>
<div id="error" class="error" hidden role="alert" tabindex="-1"></div>
<div class="kpis" id="kpis"></div><p class="hint" id="lastAt" aria-live="polite">読み込んでいます…</p>
<h2 style="margin-top:30px">設問ごとの集計</h2><div class="tallyGrid" id="tallies"></div>
<div class="card"><h2>回答一覧</h2><label class="choice filter"><input type="checkbox" id="onlyComments" checked>ご感想のある回答だけ表示</label><p id="listStatus" class="hint" aria-live="polite"></p><div id="responses"></div></div>`;
  const questions = questionsOf(survey).map(({ id, type, label, short, options, other, dependsOn }) => ({ id, type, label, short, options: options || [], other: !!other, dependsOn: dependsOn || null }));
  const script = commonJS + String.raw`
const api=${embed(API + '/' + survey.id)};const questions=${embed(questions)};
const byId=Object.fromEntries(questions.map(q=>[q.id,q]));
const label=(id,v)=>{const o=byId[id]?.options.find(x=>x[0]===v);return o?o[1]:''};
const jst=iso=>{const t=Date.parse(iso);return Number.isNaN(t)?'':new Date(t+9*3600000).toISOString().slice(0,16).replace('T',' ')};
let data=null;let loading=false;
function kpis(d){const list=[['回答数（集計対象）',d.total],['ご感想あり',d.comments],['紹介してよいご感想',d.quotable],['集計から除外',d.excluded]];$('kpis').replaceChildren(...list.map(([k,v])=>{const box=el('div',null,'kpi');const value=el('strong',String(v));value.append(el('small','件'));box.append(el('span',k),value);return box}));$('lastAt').textContent=d.last_at?'最終回答：'+jst(d.last_at):'まだ回答がありません。'}
function tallyCard(q,t,total){
 const card=el('section',null,'card');card.append(el('h3',q.label),el('p','回答 '+t.answered+'件・無回答 '+(total-t.answered)+'件'+(q.type==='multi'?'・複数回答':''),'hint'));
 if(!t.answered){card.append(el('p','まだ回答がありません','muted'));return card}
 let order=q.options.map(o=>o[0]);
 // 複数回答は件数の多い順。ただし「その他」「特になし」は末尾に置く。
 if(q.type==='multi'){const tail=order.filter(v=>v==='other'||v==='none');order=order.filter(v=>!tail.includes(v)).sort((a,b)=>t.counts[b]-t.counts[a]).concat(tail)}
 const bars=el('div',null,'bars');
 for(const v of order){const n=t.counts[v]||0;const pct=(n/t.answered*100).toFixed(1);const name=label(q.id,v);const row=el('div',null,'barRow');row.title=name+'：'+n+'件（'+pct+'%）';const track=el('div',null,'barTrack');track.setAttribute('aria-hidden','true');if(n){const bar=el('span',null,'bar');bar.style.width=pct+'%';track.append(bar)}row.append(el('span',name,'barLabel'),track,el('span',n+'件','barCount'),el('span',pct+'%','barPct'));bars.append(row)}
 card.append(bars);
 if(t.other.length){const d=el('details');d.append(el('summary','その他の記入（'+t.other.length+'件）'));const ul=el('ul');for(const s of t.other)ul.append(el('li',s));d.append(ul);card.append(d)}
 return card}
function respCard(r){
 const a=r.answers||{};const box=el('article',null,'resp'+(r.excluded?' isExcluded':''));
 box.append(el('p',['No.'+r.id,jst(r.created_at),'総合：'+(label('overall',a.overall)||'未回答'),label('visits',a.visits),label('region',a.region),label('age',a.age)].filter(Boolean).join('・'),'respMeta'));
 const quote=a.quote==='profile'?['紹介：許可','ok']:a.quote==='anonymous'?['紹介：匿名なら許可','ok']:['紹介：不可・未回答','off'];
 const badges=el('div',null,'badges');badges.append(el('span',quote[0],'pill '+quote[1]));if(r.excluded)badges.append(el('span','除外中','pill'));box.append(badges);
 if(typeof a.comment==='string'&&a.comment)box.append(el('p',a.comment,'respComment'));
 for(const q of questions)if(q.other&&typeof a[q.id+'_other']==='string'&&a[q.id+'_other'])box.append(el('p',q.short+'（その他）：'+a[q.id+'_other'],'hint'));
 const button=el('button',r.excluded?'集計に戻す':'集計から除外する','secondary small');button.type='button';button.onclick=()=>setExcluded(r,button);box.append(button);
 return box}
function responses(){if(!data)return;const only=$('onlyComments').checked;const shown=data.responses.filter(r=>!only||(typeof r.answers?.comment==='string'&&r.answers.comment));$('listStatus').textContent=shown.length+'件を表示（全'+data.responses.length+'件）';$('responses').replaceChildren(...(shown.length?shown.map(respCard):[el('p','表示する回答がありません。','muted')]))}
async function load(){if(loading)return;loading=true;$('reload').disabled=true;$('error').hidden=true;try{data=await requestJSON(api+'/admin');kpis(data);$('tallies').replaceChildren(...questions.filter(q=>(q.type==='single'||q.type==='multi')&&!q.dependsOn&&data.tallies[q.id]).map(q=>tallyCard(q,data.tallies[q.id],data.total)));responses()}catch(e){showError(e.message)}finally{loading=false;$('reload').disabled=false}}
async function setExcluded(r,button){button.disabled=true;$('error').hidden=true;try{await requestJSON(api+'/admin/'+r.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({excluded:!r.excluded})});await load()}catch(e){showError(e.message);button.disabled=false}}
$('reload').onclick=load;$('onlyComments').onchange=responses;load();
`;
  return shell('アンケート集計', body, script, { preview, wide: true });
}
