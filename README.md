# ぴたお@AI🤖 — Portfolio

作ったものと、そのとき詰まったことを置いているサイト。

https://pitawo.github.io/

## 構成

| パス | 内容 |
|---|---|
| `index.html` | トップページ（HERO / WORKS / ABOUT / CONTACT） |
| `works/*.html` | 作品ごとの詳細ページ |
| `demo/` | 作品のデモ（`cafe-site/` はビルド済みの React アプリ、`secretary-app/` はブラウザ内保存版、`gas-form-scoring/` は結果ページの再現） |
| `styles.css` | スタイル一式 |
| `main.js` | トップページの作品カルーセルの矢印・ドットと、ヒーローのアニメーション |
| `Image/` | ヒーロー背景と作品サムネイル |

## 技術

素の HTML / CSS で書いている。フレームワークもビルド工程も使っていない。JavaScript はトップページで `main.js` だけを読み込んでいる。カルーセルは CSS の scroll-snap だけで全件見られ、`main.js` は矢印・ドットとヒーローのアニメーションを上乗せするだけなので、JS が動かなくても中身には届く。

画像はサムネイルが SVG、ヒーロー背景が WebP。
