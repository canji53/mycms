---
title: "WordPressにて目次機能をJavaScriptで自動生成"
description: "QiitaやClassmethodなどのテック系ブログの目次表示をWordPressで実現するためにJavaScriptでシンプルに実装。WordPressだけでなく他のCMS/フレームワークでも扱えるようにするためJavaScriptで実装、またちょっとした工夫としてページ内リンクも追加して実装。"
category: "javascript"
tags: ["table-of-contents", "wordpress"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/my-contents/thumbnail.png"
updatedAt: "2020-10-29"
createdAt: "2020-05-16"
---

## はじめに

> 現在、当ブログは WordPress ではなく Gatsby.js で構築されています :bow:

Qiita や Classmethod などのテック系ブログを見ていると画面サイズが HD 以上になるとサイドバーに現れる「**目次**」が常々良いなと思っていました。自分でも同じことができないかと思い、WordPress ならプラグインがあるだろうと考えたのですが、案の定良い感じのがない、、、

それなら、自作するしかない。

今回は下記の観点で「**目次機能**」を自作しました。

- **WordPress だけでなく、他の CMS / フレームワークでも扱えるように JavaScript で実装**
- **記事中の見出し ( Heading ) を検索して、目次を自動生成**
- **ページ内リンクを活用することでユーザビリティ向上を目論む**

## **tl; dr**

codepen で簡単なサンプルを作っています。ご参考程度に見てもらえればです。

https://codepen.io/canji53/pen/OJyoaRM

## **環境**

- PHP 7.3
- WordPress 5.3
- Gutenberg エディタ

## **ポイント**

### **ページ内リンクについて**

html5 であれば下記のように組めばページ内をジャンプするリンクを作成できます。

詳しくは[コチラの SEO ラボさんの記事](https://seolaboratory.jp/42119/)も参考にしていただければです。

```html
<a id="title">ジャンプ先</a>
```

```html
<a href="#title">ジャンプ元</a>
```

## **目次作成の流れ**

今回組んだ JavaScript はざっくりと下記のような流れになります。

### **1. 見出しにサイト内リンクを追加**

- 記事内の見出し H2、H3、H4 のそれぞれのレベル要素を取得
  - Gutenberg では、見出しブロックが H2、H3、H4 となるため
- 取得した要素ごとに見出し名を id として追加

```javascript
const getHeadingElementList = () => {
  const postElement = document.getElementById("post");
  return postElement.querySelectorAll(&#91;"h2", "h3", "h4"]);
};

const addInternalLinksForHeading = () => {
  const headingElementList = getHeadingElementList();
  Array.prototype.forEach.call(headingElementList, (headingElement) => {
      headingElement.innerHTML = `&lt;a id="${headingElement.textContent}">` + headingElement.innerHTML + "&lt;/a>";
  });
};

addInternalLinksForHeading();
```

### **2. 見出しのレベルに応じて目次を生成**

- 目次を挿入したい要素を予め取得、ここでは contents とする
- 記事内の見出し H2、H3、H4 要素を取得
- 前ステップで取得した要素をループ処理へ
- H2、H3、H4 のレベルに応じて ul li タグの深さが異なる連鎖要素を用意
  - \#id を a タグで追加することでサイト内リンクを実現
- 前ステップで取得した要素を contents の後列に順次追加
- ループ処理終了

```javascript
const getFirstLevelList = (internalLinkId) => {
  return `
    <ul>
      <a href="#${internalLinkId}">
        <li>
          ${internalLinkId}
        </li>
      </a>
    </ul>
  `;
};

const getSecondLevelList = (internalLinkId) => {
  return `
    <ul>
      <li>
        <ul>
          <a href="#${internalLinkId}">
            <li>
              ${internalLinkId}
            </li>
          </a>
        </ul>
      </li>
    </ul>
  `;
};

const getThirdLevelList = (internalLinkId) => {
  return `
    <ul>
      <li>
        <ul>
          <li>
            <ul>
              <a href="#${internalLinkId}">
                <li>
                  ${internalLinkId}
                </li>
              </a>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  `;
};

const addContents = () => {
  const contentsElement = document.getElementById("contents");
  const headingElementList = getHeadingElementList();

  Array.prototype.forEach.call(headingElementList, (headingElement) => {
    const headingAnchorElement = headingElement.getElementsByTagName("a")[0];

    if (headingElement.tagName === "H2") {
      var contentsLine = getFirstLevelList(headingAnchorElement.id);
    }
    if (headingElement.tagName === "H3") {
      var contentsLine = getSecondLevelList(headingAnchorElement.id);
    }
    if (headingElement.tagName === "H4") {
      var contentsLine = getThirdLevelList(headingAnchorElement.id);
    }

    contentsElement.insertAdjacentHTML("beforeend", contentsLine);
  });
};

addContents();
```

### **3. シンプルにスタイル調整**

ul li タグのスタイル調整では、主に `padding` や `margin` 周りをいじって「目次感」を再現するのが肝かと思います。

また、サイトデザインにもよるのですが、Qiita 等の技術系のブログではサイドバーに目次が画面追従するように実装されているため、これを `position: sticky` で実現するのが尚良しかと思います。

```css
#contents {
  position: sticky;
  top: 25%;
}

#contents ul {
  padding-inline-start: 0rem;
}
#contents ul li ul,
#contents ul li ul li ul {
  padding-inline-start: 0.9rem;
}

#contents ul li,
#contents ul li ul li,
#contents ul li ul li ul li {
  padding: 0 0.5rem;
  border-radius: 0.3rem;
  overflow: scroll;
}

#contents ul,
#contents ul li ul,
#contents ul li ul li ul {
  margin-bottom: 0;
  list-style-type: none;
}

#contents ul a {
  color: #888;
  text-decoration: none;
}
```

## **おわりに**

わずかなコード量ですが、目次機能を実装するのに意外と時間がかかりました。フロント側の勉強もなお一層必要だなと痛感しました。

また、そこそこ重要なのは CSS 側でのスタイル調整かと思われます。ところが、コチラはお使いの環境によって大きく変わってくるため、時間のかかる部分かもしれないです。当ブログでは、画面幅が 1280px 以上で右側のサイドバーに目次機能が現れますが、基本的には Qiita に近い形で調整しています。

## **参考文献**

- [[ SEO ラボ ] HTML でページ内リンク（ジャンプ）をスクロールする方法](https://seolaboratory.jp/42119/)
