---
title: "【Vue/Nuxt】multipleなselectのデータを親子間で受け渡すには？"
description: "Vue/Nuxtでmultipleなselectを親子間で受け渡すのに苦労したのでメモ。結論、v-modelを:valueと@changeに分解するのではなく、v-modelのget+setでデータの受け渡しを制御することで実現できました。"
category: "vue"
tags: ["vue", "nuxt", "html", "multiple-select"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/nuxt-multiple-select-binding/thumbnail.png"
updatedAt: "2020-09-03"
createdAt: "2020-09-03"
---

Vue / Nuxt で form 周りを触っていると、双方向バインディングのありがたさが身に染みるこの頃ですが、

Atomic デザインをしていると Atom / Molecules / Organisms / templates / pages にコンポーネントが徹底的に分解されていくので、
親子間でのデータの受け渡しが必須になってくるかと思います。

するとです、**multiple タイプな select でどうデータを受け渡せば良いのかで詰まりました。**:confused:

ですので、自戒もこめて下記にその方法を残しておきます。

## TL; DR

以下は、オレオレ Atomic デザインで親子間を構築してますが、components をどう分割しているかだけなので、そのまま自身の環境に合わせればたぶん動くと思います。

### 親コンポーネント

```markup
<template>
  <SelectMultiple
    :options="options"
    :selected="selected"
    @select="$emit('select', $event)"
  />
</template>

<script>
import SelectMultiple from '@/components/Atoms/SelectMultiple';

export default {
  components: {
    SelectMultiple
  },
  props: {
    selected: {
      type: Array,
      required: true
    }
  },
  data: () => ({
    options: [
      { text: 'hoge1', value: 'hoge1' },
      { text: 'hoge2', value: 'hoge2' }
    ]
  })
</script>
```

### 子コンポーネント

```markup
<template>
  <select
    v-model="select"
    multiple
  >
    <option
      v-for="(option, key) in options"
      :key="key"
      :value="option.value"
    >
      {{ option.text }}
    </option>
  </select>
</template>

<script>
export default {
  props: {
    selected: {
      type: Array,
      required: true
    },
    options: {
      type: Array,
      required: true
    }
  },
  computed: {
    select: {
      get () {
        return this.$props.selected;
      },
      set (value) {
        this.$emit('select', value);
      }
    }
  }
};
</script>
```

## 通常の親子間の受け渡し

### props と $emit

[親子間でデータを受け渡す](https://jp.vuejs.org/v2/guide/components.html#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%A7-v-model-%E3%82%92%E4%BD%BF%E3%81%86)際は、

- 親コンポーネント -> 子コンポーネント : props オプション
- 子コンポーネント -> 親コンポーネント : $emit メソッド

ここで注意したいのが、**props で渡された値は更新ができない readonly であることです。**

### v-model は シンタックスシュガー

[v-model は、v-bind:value（各種入力値）と v-on:input（各種イベント）のシンタックスシュガー（糖衣構文）](https://jp.vuejs.org/v2/guide/forms.html#%E5%9F%BA%E6%9C%AC%E7%9A%84%E3%81%AA%E4%BD%BF%E3%81%84%E6%96%B9)で、簡潔に記述するために v-model が多用されています。

ところが、[親子間のデータ受け渡しには v-model ではなく、v-bind:value と v-on:input を使う方がスムーズに動きます。](https://jp.vuejs.org/v2/guide/components.html#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%A7-v-model-%E3%82%92%E4%BD%BF%E3%81%86)
これは、前述した props が読み込み専用であることに起因しています。

v-model に props で渡されたデータを入力するとエラーがおきます。
これは、読み込み専用であるデータを v-model 内で書き換えようとするために起きるエラーです。

そこで、これを回避するために、v-model を分解して、props のデータを v-bind:value に入力、v-on:input で発火したイベント処理を $emit で親に渡して、props を更新しないようにしてあげます。

```markup
<template>
  <div>
    <input v-model="value"> // ×
    <input v-bind:value="value" v-on:input="$emit('input', $event.target.value)"> // ◯
  </div>
</template>

<script>
export default {
  props: [value]
}
</script>
```

ちなみに、各入力タグの v-model のシンタックスシュガーは下記のようになっています。

| 入力タグ                   | シンタックシュガー                     |
| -------------------------- | -------------------------------------- |
| input[text], textarea      | v-model = v-bind:value + v-on:input    |
| input[check], input[radio] | v-model = v-bind:checked + v-on:change |
| select                     | v-model = v-bind:value + v-on:change   |

## ところが multiple な select では、、、

multiple タイプの select では複数の option の value が選択されて、それを親に渡す必要があります。
ところが、前述の select のシンタックスシュガーと $emit では、はじめに選択された option の value のみ渡されるような挙動になりました。

```markup
// ×
<template>
  <select
    :value="selected"
    :change="$emit('select', $event.target.value)"
    multiple
  >
以下略
```

これは、`$event.target.value` が原因です。
`$event` は、Javascript におけるイベント発生時のオブジェクトが詰まっているのですが、
`$event.target.value` では、はじめに選択されたオプションの value しか見れないので、結果的に複数ではなく、１つだけ渡された格好になりました。

**そこで、`$event` のあらゆるプロパティを覗いて複数の value を渡そうとしたのでしたが、結果的に上手くはいきませんでした。**（もしかしたら、何らかのプロパティを渡せば動くかも？）

## そこで敢えて v-model を使うことに

この方法は、[こちらの方の記事](https://qiita.com/ozone/items/b75efe5c449cbc469b1e#v-model%E3%82%92%E4%BD%BF%E3%81%86%E8%A6%81%E7%B4%A0%E3%82%92%E3%83%A9%E3%83%83%E3%83%97%E3%81%99%E3%82%8B)を参考に multiple な select に適用したものです。

v-model に直接 props を入力するのではなく、**`computed` を介して、v-model の `get`、`set` メソッドでデータの受け渡しを制御する方法です。**

こうすることによって、複数の option の value が親に渡せることが確認できました。

```markup
<template>
  <select
    v-model="select"
    multiple
  >
    <!-- 略 -->
  </select>
</template>

<script>
export default {
  props: {
    selected: {
      type: Array,
      required: true
    }
  },
  computed: {
    select: {
      get () {
        return this.$props.selected;
      },
      set (value) {
        this.$emit('select', value);
      }
    }
  }
};
</script>
```

## おわりに

ざっと、現在の私の知見としては下記のような感じです。

- 同一コンポーネント間であれば、v-model でさくっとデータの受け渡しが可能
- 親子コンポーネント間であれば、`v-bind:(props) + v-on:(event)` でデータの受け渡しが可能
- ただし、multiple な select のように、幾つかの入力タグでは、適切な　`$event.target.value` が見出せないので、v-model の get、set で親子間のデータ渡しを制御すること

うーん、難しいな :sweat:

やはり説明書を読まない、ドキュメントを読めていないツケが回ってきているような状態ですね。

## 参考文献

- [[Vue.js 公式ドキュメント] コンポーネントの基本 #コンポーネントで-v-model-を使う](https://jp.vuejs.org/v2/guide/components.html#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%A7-v-model-%E3%82%92%E4%BD%BF%E3%81%86)
- [[Vue.js 公式ドキュメント] フォーム入力バインディング #基本的な使い方](https://jp.vuejs.org/v2/guide/forms.html#%E5%9F%BA%E6%9C%AC%E7%9A%84%E3%81%AA%E4%BD%BF%E3%81%84%E6%96%B9)
- [[Vue.js 公式ドキュメント] コンポーネントの基本 #コンポーネントで-v-model-を使う](https://jp.vuejs.org/v2/guide/components.html#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%A7-v-model-%E3%82%92%E4%BD%BF%E3%81%86)
- [[Qiita] Vue.js：v-model と$emit を使ってデータを読み書きする子コンポーネントをつくる (2019/10/13 追記)](https://qiita.com/ozone/items/b75efe5c449cbc469b1e#v-model%E3%82%92%E4%BD%BF%E3%81%86%E8%A6%81%E7%B4%A0%E3%82%92%E3%83%A9%E3%83%83%E3%83%97%E3%81%99%E3%82%8B)
