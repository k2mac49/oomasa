# 屋台レジ（oomasa / regi）

iPhone 1台で完結する、屋台・イベント向けの単一HTMLレジ（PWA・オフライン対応）。

- 公開URL: https://k2mac49.github.io/oomasa/
- 構成: `index.html`（本体）/ `sw.js`（オフライン）/ `manifest.json` / アイコン
- ドキュメント: `要件定義書.md` / `仕様書.md`

## 機能
- 商品ボタン＋個数で合計自動計算、テンキーで預り金→おつり
- 商品ごとの値引き（定額/半額、解除まで継続、営業日変更で自動解除）
- 売上集計（日付・イベント別、品目別、値引き内訳、CSV書き出し）
- オフライン動作（Service Worker）＋端末ローカル保存（localStorage）

## 開発メモ
- 商品マスタは `index.html` の `PRODUCTS` 配列（焼うどん600/豚バラ600/梅酒500）。
- 更新時は `sw.js` の `CACHE`（現行 `regi-cache-v9`）の版数を上げてから deploy。

## デプロイ
GitHub Pages（Settings → Pages → Deploy from a branch → main / root）。
ファイルを上書き commit → push で自動再公開。
