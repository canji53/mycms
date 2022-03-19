---
title: "typeormのmigrationファイルの置き場所に注意"
description: "TypeORMでmigrationを流していると突然 `migration name is wrong.` と怒られました。結論を述べると、migrationファイルが格納されているディレクトリ内に、migrationとは関係のないファイル、正確にはタイムスタンプが追加されていないクラス名が存在すると上記エラーでコケてしまいます"
category: "typeorm"
tags: ["typescript", "typeorm"]
thumbnailUrl: "https://github.com/canji53/toLog/tree/master/packages/contents/tolog/posts/typeorm-accurate-migration-directory/thumbnail.png"
updatedAt: "2021-05-05"
createdAt: "2021-05-05"
---

## はじめに

現在携わっているプロダクトで TypeORM を使っていて、ここ最近プライベートでも素振りしています。
そんな中、migration を流していると突然 `migration name is wrong. Migration class name should have a JavaScript timestamp appended.` と怒られました。

結論を述べると、migration のクラス名に timestamp が載っていない以前に、空のクラス名が渡っていて、そのせいで怒られていました。
では、なぜ空のクラス名が渡るのかと言うと、**migration ファイルが格納されているディレクトリ内に、関係のないファイル、正確にはタイムスタンプが追加されていないクラス名が存在すると上記エラーでコケてしまいます。**

## TL; DR

TypeORM の config で指定した migration のディレクトリには、migration とは関係ないファイルやクラスを置いてはいけない。

## 内容

TypeORM では、[migration 用のクラス名に timestamp を含める必要があります。](https://typeorm.io/#/migrations/generating-migrations)

```js
// 公式よりサンプル

import { MigrationInterface, QueryRunner } from "typeorm";

export class PostRefactoringTIMESTAMP implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {}

  async down(queryRunner: QueryRunner): Promise<void> {}
}
```

また、TypeORM では [migration ファイルが格納されているディレクトリを予め config 等で設定します。](https://typeorm.io/#/migrations/creating-a-new-migration)
ちなみに私は `.js` で管理していて、そのままではないですが、下記のように設定していました。

```js
// ormconfig.js

module.exports = {
  type: "postgres",
  url: DB_URL,
  entities: ["dist/domain/model/**/*.js"],
  migrations: ["src/infrastructure/migration/**/*.ts"], // here!!
  synchronize: false,
  logging: true,
};
```

この設定が不味く、私の場合、`/migration` ディレクトリ内に、TypeORM の migration クラスとは関係ない `/fixture` （開発・テスト用の DB の mock データ）を置いていて、この fixture では timestamp とは無縁のクラス名にしていました。

```bash
$ tree migration

migration
├── fixture
│   ├── index.ts
│   ├── sex.ts
│   └── user.ts
├── row
│   └── 1800000000001-insert-user.ts
├── seed
│   └── 1700000000000-insert-sex.ts
└── table
    ├── 1600000000000-create-sex.ts
    └── 1600000000002-create-user.ts

4 directories, 10 files
```

こんな中、`migration:run` をすると、

```bash
migration name is wrong. Migration class name should have a JavaScript timestamp appended.
```

エラー内容としては、「migration のクラス名にタイムスタンプを加えること」で、内容に従って全てのクラス名を見直してたのですが、同様のエラーでコケてしまいます。
仕方なく TypeORM 本体まで潜って雑に print debug していると、そもそも空のクラス名が渡っていることが分かりました。

```js
// typeorm/migration/MigrationExecutor.js

/**
 * Gets all migrations that setup for this connection.
 */
MigrationExecutor.prototype.getMigrations = function () {
  console.log(this.connection.migrations) // 雑 debug !!
  var migrations = this.connection.migrations.map(function (migration) {
    var migrationClassName = migration.name || migration.constructor.name
    var migrationTimestamp = parseInt(migrationClassName.substr(-13), 10)
    if (!migrationTimestamp || isNaN(migrationTimestamp)) {
      console.log('error', migration) // 雑 debug !!
      throw new Error(
        migrationClassName +
          " migration name is wrong. Migration class name should have a JavaScript timestamp appended."
      )
    }
  .
  .
  .
}
```

上記の雑 debug で `typeorm migration:run` を実行すると、

```bash
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = current_schema() AND "table_name" = 'migrations'
query: SELECT * FROM "migrations" "migrations"  ORDER BY "id" DESC
[
  {},
  {},
  {},
  InsertUser1800000000001 {},
  InsertSex1700000000000 {},
  CreateSex1600000000000 {},
  CreateUser1600000000002 {}
]
error {}
Error during migration run:
Error:  migration name is wrong. Migration class name should have a JavaScript timestamp appended.
    at /app/packages/graphql/src/migration/MigrationExecutor.ts:411:20
```

そこで、**migration に指定するディレクトリ内には、migration とは関係ない timestamp を含んでいないクラスを置いてはいけない**と至り、下記のように `/fixture` を除いた migration クラスのみが置かれたディレクトリを指定するように config を修正。実行すると無事 migration されることを確認しました。

```js
// ormconfig.js

module.exports = {
  type: "postgres",
  url: DB_URL,
  entities: ["dist/domain/model/**/*.js"],
  migrations: [
    "src/infrastructure/migration/table/**/*.ts",
    "src/infrastructure/migration/seed/**/*.ts",
    "src/infrastructure/migration/row/**/*.ts",
  synchronize: false,
  logging: true,
}
```

## おわりに

大前提として migration とは関係ないクラスがあってもよしなに選別してくれると勘違いした私が大問題なのですが、もう少しエラー内容が親切だと嬉しいなと思った一幕でした :sweat_drops:
