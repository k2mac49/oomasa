# 屋台レジ（oomasa / regi）

iPhone 1台で完結する、屋台・イベント向けの単一HTMLレジ（PWA・オフライン対応）。

- 公開URL: https://k2mac49.github.io/oomasa/
- 構成: `index.html`（本体）/ `sw.js`（オフライン）/ `manifest.json` / アイコン
- ドキュメント: `要件定義書.md` / `仕様書.md`

## 機能
- 商品ボタン＋個数で合計自動計算、テンキーで預り金→おつり
- 商品と金額の編集（⚙️設定タブ：名称・単価の変更／追加・削除／並び替え／有効・無効）
- 商品ごとの値引き（定額/半額、解除まで継続、営業日変更で自動解除）
- 売上集計（日付・イベント別、品目別、値引き内訳、CSV書き出し）
- 会計の取消（直後8秒のトースト／売上履歴からの個別削除）
- オフライン動作（Service Worker）＋端末ローカル保存（localStorage）

## 開発メモ
- 商品マスタは端末の localStorage（`regmock_prods_v1`）。初期値は `index.html` の
  `DEFAULTS` 配列（焼うどん600/豚バラ600/梅酒500）で、初回起動時に複製される。
- 画面（HTML）はネット優先で配信するため、push すれば更新は自動で届く。
  `sw.js` の `CACHE`（現行 `regi-cache-v10`）はキャッシュを捨てたいときに上げる。

## デプロイ
GitHub Pages（Settings → Pages → Deploy from a branch → main / root）。
ファイルを上書き commit → push で自動再公開。
