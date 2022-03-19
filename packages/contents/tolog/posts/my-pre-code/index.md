---
title: "WordPressのコード表示をプラグインなしで自前実装"
description: "WordPressのSyntax系プラグインのコード表示が物足りず、HTML/CSS/JavaScriptでの自前実装に切り替えました。今回はHightlight.jsで手軽にsyntax highlightしたり、CSSの 'counter-increment: linenumber;' で行数表示したりして、ある程度満足のいくコード表示が実現できることを確認しました。"
category: "wordpress"
tags: ["highlight.js"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/my-pre-code/thumbnail.png"
updatedAt: "2020-10-29"
createdAt: "2020-04-30"
---

## **はじめに**

> 現在、当ブログは WordPress ではなく、Gatsby.js で構築されています :bow:

ブログのテーマ上、ソースコードを貼付することが多いのですが、WordPress で用意されている Syntax 系のプラグインではコードの表示がイマイチ。開発当初はとりあえずプラグインで間に合わせていたのですが、安定運用に入ってからブログを書いてると、痒いところに手が届かないというか、スタイルを頻繁に調整したくなったり、対応している言語が少なかったりと、とにかく何か物足りない感じでした。

しばらく、[Enlighter](https://ja.wordpress.org/plugins/enlighter/) というプラグインを使っていたのですが、良いプラグインではあるのですが、大変感謝しているのですが、どうしても物足りなかったので **HTML/CSS/JavaScript での自前実装に切り変えました。**

- 行数表示
- コードを折り返し表示ではなく、スクロール表示
- より多くの言語を Syntax Highlight

WordPress ならプラグインを使えば良いのですが、何か満足できない人もいるかと思い、今回はこの実装内容を共有します。

## **使用経験のある Syntax Highlight プラグイン**

ちなみに今まで使用したことのある Syntax Highlight 系プラグインが下記になります。

個人的には Enlighter がそこそこ良いかなと思います。

### **Enlighter (Version 4.1 CE)**

- 開発活発、保守性良好
- 古い言語や Apache などのミドルウェア周りの構文は未サポート
- 評価 ４/５ 以上
- テーマ１５個

### **Crayon Syntax Highlighter (Version 2.8.4)**

- ４年以上アップデートされていない
- 評価 ４/５ 以上
- 古い言語までサポートしており歴史を感じる
- 根強い人気を誇るが最近は見なくなった？

### **Highlighting Code Block (Version 1.1.0)**</a>

- 日本人が開発（[LOOS WEB STUDIO](https://loos-web-studio.com/)）
- 評価 ５/５
- 比較的新しいプラグイン
- 非常にシンプルな設定・構成

## **tl; dl**

### **実装後**

![icon_custom_wp_pre_code_cutting](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/my-pre-code/icon_custom_wp_pre_code_cutting.png)

### **実装前**

![image_naitive](https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/my-pre-code/image_naitive.png)

## **環境**

- PHP 7.3
- WordPress 5.3

## **実装サンプル**

あくまでサンプルで、お使いの WordPress 環境に添うかは分かりません。また、網羅的な OS・ブラウザの表示テストは行っていません、Ubuntu の Chrome では横のスクロールバーが二重表示されるなどの表示崩れを確認しています。

この実装は[こちらの Qiita の記事](https://qiita.com/Ria0130/items/b49b13e4ff935993c813)を大いに参考にしています。

### **HTML**

Syntax Highlight を実装するのは難しいので [highlight.js](https://highlightjs.org/) と呼ばれる JavaScript のライブラリを使用しました。npm で管理できるのですが、**今回は簡単に利用するため CDN を利用しています。**

head タグ内に下記を追加してください。

テーマは複数用意されており、公式ページにてテーマの見た目を試すことができます。私は **atom-one-dark** を選んでいます。

```html
<!-- highlight.js -->
<link
  rel="stylesheet"
  href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/atom-one-dark.min.css"
/>
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/highlight.min.js"></script>
<script>
  hljs.initHighlightingOnLoad("");
</script>
```

### **JavaScript**

JavaScript ではソースコードの行数を表示するために、**行数分だけ空の span タグを追加する関数を実装**しています。後述の CSS では span ダグをカウントして行番号を表示するスタイルを適用します。

```javascript
window.onload = () => {
  addNumLinesCode();
};

/**
 * Add number of lines for source code
 */
const addNumLinesCode = () => {
  let wp_block_code_elems = document.getElementsByClassName("wp-block-code");
  if (wp_block_code_elems.length === 0) return null;

  Array.prototype.forEach.call(wp_block_code_elems, (wp_block_code_elem) => {
    // get code text
    var code_elem = wp_block_code_elem.getElementsByTagName("code");
    var code_text = code_elem[0].textContent;
    var code_lines = code_text.match(/\r\n|\n/g);

    // get code number of lines
    var code_line_count = 0;
    if (code_lines !== null) {
      code_line_count = code_lines.length + 1;
    } else {
      code_line_count = 1;
    }

    // append span-tag to line_numbers_elem for the number of code rows
    // ex.) <div class="line_number"><span></span><span></span>....</class>
    var line_numbers_elem = document.createElement("div");
    for (var i = 0; i < code_line_count; i++) {
      var span_elem = document.createElement("span");
      line_numbers_elem.appendChild(span_elem);
    }

    // insert line-numbers to the first element
    wp_block_code_elem.insertBefore(line_numbers_elem, code_elem[0]);

    // add line-numbers class
    line_numbers_elem.classList.add("line-numbers");
  });
};
```

### **CSS**

**counter-increment: linenumber** で span タグをカウントして、span の擬似要素 after にて **counter(linenumber)** でカウント数値を表示します。おそらくお使いの環境に応じてその他のスタイルが微調整必要かと思われますので、その際は対応願います。

```css
.wp-block-code {
  width: 100%;
  height: auto;
  padding: 3.5rem 2rem 2rem 2rem;
  display: flex;
  flex-flow: row nowrap;
  overflow-y: hidden;
  overflow-x: scroll;
  background-color: #222222;
  border: none;
  border-radius: 1rem;
  font-size: 1.3rem;
}
.wp-block-code code {
  width: 100%;
  margin: 0;
  padding: 0 0 1.5rem 1rem;
  line-height: 2rem;
  white-space: pre;
}

.hljs {
  background-color: transparent !important;
}
.hljs span {
  line-height: 2rem;
}

.line-numbers {
  width: 4rem;
  height: 100%;
  margin: 0;
  padding: 0 1rem 0 0;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  border-right: solid 0.1rem rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.4);
}
.line-numbers > span {
  width: 100%;
  margin: 0;
  display: block;
  counter-increment: linenumber;
  text-align: right;
  line-height: 2rem;
}
.line-numbers > span::after {
  content: counter(linenumber);
}
```

## **おわりに**

車輪の再発明は良くないと言いますが、脳筋で全てそのロジックで考えるのは良くないですね。十分にテストできていないですが、満足度は結構高いです。何だかんだこの程度の実装なら下手にケチらなければ良かったです。

WordPress はプラグインの数に比例してわかり易く重くなるので、個人開発レベルなら積極的に自前実装した方が良いのかなと感じました。

## **参考文献**

- [[ WordPress.ORG ] Enlighter](https://ja.wordpress.org/plugins/enlighter/)
- [[ WordPress.ORG ] Crayon Syntax Highlighter](https://wordpress.org/plugins/crayon-syntax-highlighter/)
- [[ WordPress.ORG ] Highlighting Code Block](https://ja.wordpress.org/plugins/highlighting-code-block/)
- [[ Qiita ] CSS でコードブロックの行番号を表示する](https://qiita.com/Ria0130/items/b49b13e4ff935993c813)
- [highlight.js Syntax highlighting for the Web](https://highlightjs.org/)
