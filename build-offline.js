/* 完全オフライン版（regi-offline.html）を index.html から生成する。
   ファイル1つで動くようにするため、外部ファイルへの参照をすべて外す。

   使い方： node build-offline.js
   index.html を直すたびに走らせること（手で regi-offline.html を触らない）。 */

const fs = require("fs");
const path = require("path");
const DIR = __dirname;
const SRC = path.join(DIR, "index.html");
const OUT = path.join(DIR, "regi-offline.html");

let s = fs.readFileSync(SRC, "utf8");
const EOL = s.includes("\r\n") ? "\r\n" : "\n";
const fx = t => t.split("\n").join(EOL);
let n = 0;
function rep(from, to, label){
  const a = fx(from), b = fx(to);
  const c = s.split(a).length - 1;
  if(c !== 1){ console.error(`FAIL [${label}] 一致数=${c}`); process.exit(1); }
  s = s.replace(a, b); console.log("  ok  " + label); n++;
}

const ver = (s.match(/APP_VERSION = "([0-9.]+)"/) || [])[1];
if(!ver){ console.error("FAIL APP_VERSION が読めない"); process.exit(1); }

/* 1. manifest は単体ファイルでは読めないので外す。
      アイコンは data URI にして埋め込み、ファイル1つで完結させる。 */
const icon = fs.readFileSync(path.join(DIR, "icon-192.png")).toString("base64");
rep(
`<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<title>屋台レジ</title>`,
`<link rel="apple-touch-icon" href="data:image/png;base64,${icon}">
<title>屋台レジ（オフライン版）</title>`,
"manifest を外し、アイコンを埋め込み");

/* 2. Service Worker は file:// では登録できない。
      そもそもファイル1つで完結しているので不要。 */
rep(
`  /* PWA */
  if("serviceWorker" in navigator){
    window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }`,
`  /* オフライン版なので Service Worker は使わない（file:// では登録できない） */`,
"Service Worker の登録を削除");

/* 3. どちらを開いているか画面下部で分かるようにする */
rep(
`  const APP_VERSION = "${ver}";`,
`  const APP_VERSION = "${ver} オフライン版";`,
"バージョン表示にオフライン版と明記");

/* 4. 保存できない環境では、売上が消えるので先に止める。
      file:// は端末やブラウザによって localStorage が使えないことがある。 */
rep(
`<script>
  /* ===== 商品マスタ（⚙️設定タブで編集） ===== */`,
`<script>
  /* 保存が使えない環境でレジを打たせると、売上が丸ごと消える。先に止める。 */
  (function(){
    try{ localStorage.setItem("__chk","1"); localStorage.removeItem("__chk"); }
    catch(e){
      document.body.innerHTML =
        '<div style="padding:28px;font-family:-apple-system,sans-serif;color:#f1f5f9;line-height:1.9">'
        + '<h2 style="color:#ef4444;font-size:20px;margin-bottom:14px">この端末では使えません</h2>'
        + '<p>ブラウザがデータの保存を許可していないため、打った売上が残りません。</p>'
        + '<p style="margin-top:14px;color:#94a3b8;font-size:14px">'
        + 'プライベートブラウズを解除する、別のブラウザで開く、'
        + 'または <b style="color:#f1f5f9">https://k2mac49.github.io/oomasa/</b> から通常版を使ってください。</p>'
        + '</div>';
      throw new Error("localStorage unavailable");
    }
  })();

  /* ===== 商品マスタ（⚙️設定タブで編集） ===== */`,
"保存できない端末では起動させない");

/* 5. 生成物だと分かるようにする */
s = fx(`<!-- このファイルは build-offline.js が index.html から自動生成したものです。
     直接編集しないでください。直すときは index.html を直して node build-offline.js を実行。
     生成元: v${ver} -->
`) + s;

fs.writeFileSync(OUT, s, "utf8");
console.log(`\n${n}件適用`);
console.log(`生成: ${OUT}`);
console.log(`サイズ: ${(fs.statSync(OUT).size/1024).toFixed(1)} KB（元 ${(fs.statSync(SRC).size/1024).toFixed(1)} KB）`);
console.log(`版数: ${ver} オフライン版`);
