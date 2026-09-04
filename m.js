/* モールスの符号表と変換。トップページと解読ページの両方が読む。
   表を2つに分けると必ず片方だけ直して食い違うので、1つにまとめている。 */

const MORSE = {
  "A":".-",
  "B":"-...",
  "C":"-.-.",
  "D":"-..",
  "E":".",
  "F":"..-.",
  "G":"--.",
  "H":"....",
  "I":"..",
  "J":".---",
  "K":"-.-",
  "L":".-..",
  "M":"--",
  "N":"-.",
  "O":"---",
  "P":".--.",
  "Q":"--.-",
  "R":".-.",
  "S":"...",
  "T":"-",
  "U":"..-",
  "V":"...-",
  "W":".--",
  "X":"-..-",
  "Y":"-.--",
  "Z":"--..",
  "0":"-----",
  "1":".----",
  "2":"..---",
  "3":"...--",
  "4":"....-",
  "5":".....",
  "6":"-....",
  "7":"--...",
  "8":"---..",
  "9":"----.",
  ".":".-.-.-",
  ",":"--..--",
  "?":"..--..",
  "'":".----.",
  "!":"-.-.--",
  "/":"-..-.",
  "(":"-.--.",
  ")":"-.--.-",
  "&":".-...",
  ":":"---...",
  ";":"-.-.-.",
  "=":"-...-",
  "+":".-.-.",
  "-":"-....-",
  "_":"..--.-",
  "\"":".-..-.",
  "$":"...-..-",
  "@":".--.-."
};

const UNIT = 70, FREQ = 660;
let AC = null;
function ac(){ if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } return AC; }
function beep(units, at){
  const c = ac(); if (!c) return;
  const t = at == null ? c.currentTime : at;
  const dur = units * UNIT / 1000;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = FREQ;
  // 立ち上がり・立ち下がりを少しなまらせる（そうしないと「プツッ」と鳴る）
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22, t + 0.008);
  g.gain.setValueAtTime(0.22, t + dur - 0.008);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.01);
}

/* ===== 和文モールス =====
   カタカナを送るための符号。無線局運用規則 別表第一号（第十二条関係）に定めがある。
   欧文の符号をイロハ順に当てはめて作られたので、同じ ・－ でも欧文ならA、和文ならイになる。
   だから送る側と読む側で「どちらの表か」を合わせる必要がある（共有リンクは w=1 で持ち回る）。
   濁点・半濁点は文字のあとに続けて送る（ガ ＝ カ ＋ ゛）。 */
const WABUN = {
  "ア":"--.--",
  "イ":".-",
  "ウ":"..-",
  "エ":"-.---",
  "オ":".-...",
  "カ":".-..",
  "キ":"-.-..",
  "ク":"...-",
  "ケ":"-.--",
  "コ":"----",
  "サ":"-.-.-",
  "シ":"--.-.",
  "ス":"---.-",
  "セ":".---.",
  "ソ":"---.",
  "タ":"-.",
  "チ":"..-.",
  "ツ":".--.",
  "テ":".-.--",
  "ト":"..-..",
  "ナ":".-.",
  "ニ":"-.-.",
  "ヌ":"....",
  "ネ":"--.-",
  "ノ":"..--",
  "ハ":"-...",
  "ヒ":"--..-",
  "フ":"--..",
  "ヘ":".",
  "ホ":"-..",
  "マ":"-..-",
  "ミ":"..-.-",
  "ム":"-",
  "メ":"-...-",
  "モ":"-..-.",
  "ヤ":".--",
  "ユ":"-..--",
  "ヨ":"--",
  "ラ":"...",
  "リ":"--.",
  "ル":"-.--.",
  "レ":"---",
  "ロ":".-.-",
  "ワ":"-.-",
  "ヰ":".-..-",
  "ヱ":".--..",
  "ヲ":".---",
  "ン":".-.-.",
  "゛":"..",
  "゜":"..--.",
  "ー":".--.-",
  "（":"-.--.-",
  "）":".-..-."
};
const WABUN_REV = Object.fromEntries(Object.entries(WABUN).map(([k, v]) => [v, k]));
/* ひらがな→カタカナ、小書き→並字、濁音→文字＋濁点。打つ人に表記の細かさを求めないため。 */
const DAKU = {'ガ':'カ゛','ギ':'キ゛','グ':'ク゛','ゲ':'ケ゛','ゴ':'コ゛','ザ':'サ゛','ジ':'シ゛','ズ':'ス゛','ゼ':'セ゛','ゾ':'ソ゛',
  'ダ':'タ゛','ヂ':'チ゛','ヅ':'ツ゛','デ':'テ゛','ド':'ト゛','バ':'ハ゛','ビ':'ヒ゛','ブ':'フ゛','ベ':'ヘ゛','ボ':'ホ゛',
  'パ':'ハ゜','ピ':'ヒ゜','プ':'フ゜','ペ':'ヘ゜','ポ':'ホ゜','ヴ':'ウ゛'};
const SMALL = {'ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ','ッ':'ツ','ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ヮ':'ワ'};
function toKana(t){
  return [...t.replace(/[ぁ-ん]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))]
    .map(c => SMALL[c] || DAKU[c] || c).join('');
}
function hasKana(t){ return /[ぁ-んァ-ヶー]/.test(t); }

function toMorse(text, wa){
  const src = wa ? toKana(text) : text.toUpperCase();
  const map = wa ? WABUN : MORSE;
  const out = [];
  for (const ch of src) {
    if (ch === ' ' || ch === '\u3000') { out.push(''); continue; }
    const c = map[ch];
    if (c) out.push(c);
  }
  return out.join('_').replace(/_{2,}/g, '__').replace(/^_+|_+$/g, '');
}

/* 読み上げ用に濁点を文字へ戻す。符号としては カ＋゛ が正しいが、
   画面に「アリカ゛トウ」と出ても読みにくいだけなので「アリガトウ」にする。 */
const JOIN = Object.fromEntries(Object.entries({'ガ':'カ゛','ギ':'キ゛','グ':'ク゛','ゲ':'ケ゛','ゴ':'コ゛',
  'ザ':'サ゛','ジ':'シ゛','ズ':'ス゛','ゼ':'セ゛','ゾ':'ソ゛','ダ':'タ゛','ヂ':'チ゛','ヅ':'ツ゛','デ':'テ゛','ド':'ト゛',
  'バ':'ハ゛','ビ':'ヒ゛','ブ':'フ゛','ベ':'ヘ゛','ボ':'ホ゛','パ':'ハ゜','ピ':'ヒ゜','プ':'フ゜','ペ':'ヘ゜','ポ':'ホ゜',
  'ヴ':'ウ゛'}).map(([a, b]) => [b, a]));
function joinDaku(t){ return t.replace(/[ァ-ヶ][゛゜]/g, m => JOIN[m] || m); }

function fromMorse(code, wa){
  const norm = code.replace(/[・･·•]/g, '.').replace(/[－ー―‐−–—]/g, '-')
                   .replace(/[／]/g, '/').replace(/[\u3000]/g, ' ').trim();
  if (!norm) return {text:'', bad:0};
  const rev = wa ? WABUN_REV : null;
  const words = norm.split(/\s*(?:\/|__|\s{2,})\s*/);
  let bad = 0;
  const out = words.map(w => w.split(/[\s_]+/).filter(Boolean).map(sym => {
    const hit = rev ? rev[sym] : Object.keys(MORSE).find(k => MORSE[k] === sym);
    if (!hit) { bad++; return '?'; }
    return hit;
  }).join('')).filter(Boolean).join(' ');
  return {text: wa ? joinDaku(out) : out, bad};
}
