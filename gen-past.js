/* 同梱する過去の実績データを、CSVから生成する。
   ・三沢は「復元33件を足した統合版（2026-09-20）」を使う
   ・グルージャ（2026-10-11）は渡されたCSVから */
const fs=require("fs");
const DL="C:/Users/Admin/Downloads/";

function load(p){
  const raw=fs.readFileSync(p,"utf8").replace(/^\uFEFF/,"");
  const L=raw.split(/\r?\n/).filter(x=>x.trim()); L.shift();
  const tx=new Map();
  for(const c of L.map(x=>x.split(","))){
    const k=c[0]+"#"+c[2];
    if(!tx.has(k)) tx.set(k,{date:c[0],ev:c[1],no:+c[2],time:c[3],items:[],total:0,recv:0});
    const t=tx.get(k);
    t.items.push({name:c[4], price:+c[5], unit:+c[6], qty:+c[8]});
    if(c[12]!==""){ t.total=+c[12]; t.recv=+c[13]; }
  }
  return [...tx.values()];
}

const misawa = load(DL+"売上_2026-09-20_統合.csv");
const all    = load(DL+"share1590021385 (2).csv");
const grulla = all.filter(t=>t.date==="2026-10-11");

const DAYS=[
  {date:"2026-09-20", ev:"三沢基地航空祭", list:misawa},
  {date:"2026-10-11", ev:"グルージャ",     list:grulla},
];

/* 商品名は共通表にまとめて、明細では番号で持つ */
const names=[], prices={};
for(const d of DAYS) for(const t of d.list) for(const i of t.items){
  if(!names.includes(i.name)) names.push(i.name);
  prices[i.name]=Math.max(prices[i.name]||0, i.price);   // 定価
}
const idx=n=>names.indexOf(n);
const mins=t=>{const[h,m]=t.split(":").map(Number); return h*60+m;};

const out=DAYS.map(d=>{
  const t=d.list.slice().sort((a,b)=>a.time<b.time?-1:a.time>b.time?1:a.no-b.no).map(x=>{
    // 明細：[商品番号, 個数] 。値引きで単価が変わっている場合だけ3つ目に実売単価
    const items=x.items.map(i=>
      i.unit===prices[i.name] ? [idx(i.name), i.qty] : [idx(i.name), i.qty, i.unit]);
    return [mins(x.time), x.recv, items];
  });
  return {d:d.date, e:d.ev, t};
});

const js = "const PAST_DATA = {"
  + "n:"+JSON.stringify(names)+","
  + "p:"+JSON.stringify(names.map(n=>prices[n]))+","
  + "d:"+JSON.stringify(out)
  + "};";
/* 公開用の index.html には実データを入れない（売上が外から見えてしまうため）。
   ここでは index.html に差し込んだ「ローカル専用ビルド」を作る。
   出力先は .gitignore 済み。タブレットにはこのファイルを渡す。 */
const DIR="C:/DATA/Development/oomasa/regi/";
for(const [src,out] of [["index.html","index-local.html"],["regi-offline.html","regi-offline-local.html"]]){
  if(!fs.existsSync(DIR+src)) continue;
  let h=fs.readFileSync(DIR+src,"utf8");
  const m=h.match(/const PAST_DATA = \{[\s\S]*?\};[^\r\n]*/);
  if(!m){ console.log("  (スキップ) "+src+" に PAST_DATA が無い"); continue; }
  fs.writeFileSync(DIR+out, h.replace(m[0], js), "utf8");
  console.log("  生成: "+out+"  "+(fs.statSync(DIR+out).size/1024).toFixed(1)+" KB");
}

/* 検算 */
console.log("=== 同梱するデータ ===");
let gq=0,ga=0,gc=0;
for(const d of DAYS){
  const q=d.list.reduce((a,t)=>a+t.items.reduce((s,i)=>s+i.qty,0),0);
  const a=d.list.reduce((s,t)=>s+t.total,0);
  console.log("  "+d.date+"  "+d.ev.padEnd(8)+String(d.list.length).padStart(4)+"件  "
    +String(q).padStart(4)+"点  ¥"+a.toLocaleString());
  gq+=q; ga+=a; gc+=d.list.length;
}
console.log("  合計              "+String(gc).padStart(4)+"件  "+String(gq).padStart(4)+"点  ¥"+ga.toLocaleString());
console.log("  商品:", names.join(" / "));
console.log("  サイズ:", (js.length/1024).toFixed(1), "KB");

/* 復元できるか（書いた形から戻して突き合わせ） */
let rq=0, ra=0, rc=0;
for(const d of out) for(const t of d.t){
  rc++;
  for(const [i,q,u] of t.items===undefined?t[2]:t[2]){ rq+=q; ra+=(u!==undefined?u:JSON.parse(js.slice(js.indexOf("p:")+2, js.indexOf(",d:")))[i])*q; }
}
console.log("  復元検算:", rc+"件 "+rq+"点 ¥"+ra.toLocaleString(),
  (rc===gc && rq===gq && ra===ga) ? "✓ 一致" : "★不一致");
