# tomu-select

tomu select — 個人開発者のとむが作ったアプリの棚

暮らしの道具から占い、音で遊ぶものまで、作ったアプリを目的別の棚に並べるページです。
白基調・ミニマル・ゴールドアクセント。依存なし・ビルドなしの `index.html` と、一覧のデータ `apps.json` の2ファイルで構成されています。

## 表示方法

`apps.json` を `fetch` で読み込むため、`index.html` をファイルとして直接開くと一覧が出ません（ブラウザが `file://` からの読み込みを止めるため）。ローカルでは簡易サーバー経由で開きます。

```bash
npx serve .            # または: python -m http.server
```

公開は GitHub Pages（<https://tomu-ai963.github.io/tomu-select/>）。

## 構成

- **ナビゲーション** — スティッキーヘッダー（アプリ / 法人向け / About・制作のご相談は tomu-ai.dev へ）、モバイル幅ではハンバーガーメニュー
- **タブ** — 「アプリ」と「法人向け」。URL の `#apps` / `#business` と連動し、左右キー・Home / End で切り替えられる（WAI-ARIA Tabs）
- **アプリの棚** — 目的別の棚ごとにカードを並べる。カードは頭文字の四角・料金ラベル（無料 / 有料 / 無料＋有料 / 準備中）・名前・ひとこと・印（スマホ向け / オフラインでも動く）・「使ってみる」ボタン。棚へのリンク（`#shelf-<id>`）付き
- **法人向け** — 法人向けに開発しているプロダクト。カードを押すと詳細（機能・価格）を表示し、「相談する」は tomu-ai.dev の問い合わせへ
- **フッター** — 棚へのリンク（apps.json から生成）と外部リンク

## apps.json

アプリの一覧はこのファイルだけで管理する（HTML 側に一覧を書かない）。

| キー | 中身 |
| --- | --- |
| `shelves` | 棚の `id` と `title`。並び順がそのまま表示順 |
| `apps` | アプリ。`shelf`（棚の id）・`name`・`desc`・`price`（`free` / `paid` / `both` / `soon`）・`url`（https のみ表示）・`mobile`・`offline`。`link: "github"` のものはボタンが「GitHub で見る」になる |
| `business` | 法人向けタブの商品。`icon`・`name`・`desc`・`fullDesc`・`price`・`per`・`category`・`features` |

印の付け方（2026-10-30 時点の基準）:

- `mobile`（スマホ向け）: リポジトリの説明に「スマホ向け」「スマホ対応」とあるもの、またはホーム画面に追加できる作り（PWA）のもの
- `offline`（オフラインでも動く）: Service Worker があり、ネットにつながなくても使えるもの（AI を使うものは付けない）

## 実装メモ

- テキストはすべて `textContent` で入れる。`innerHTML` を使うのはページ内に定義したアイコンの SVG だけ
- リンク先は `https://` で始まるものだけを出す
- 読み込み中はスケルトン、読み込みに失敗したらメッセージを表示する
- カラー・シャドウは CSS カスタムプロパティでトークン化。ライト / ダーク対応（`prefers-color-scheme` + `data-theme` 属性）
- `prefers-reduced-motion` 対応（スムーススクロール・シマー・トランジション停止）

## 今後の予定

- 最初は別アドレスで育て、棚が育ったら tomu-ai.dev のトップを tomu select にする（portfolio は About と制作のご相談へ）
- portfolio の Works・プロフィール README も apps.json を元にする
