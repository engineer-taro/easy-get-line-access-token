## 使い方

### 初期設定

```
cp .env.example .env
```

envファイルの値を設定

```
npm install
```

### アクセストークンの取得

```
npm run test
```

コンソールにアクセストークンが表示される

## 目的

LINEアクセストークンで認証が必要なAPIを開発しており、API Clientツールを利用して動作確認する際に手動でLINEログインを行いアクセストークンを取得するのが手間だったため作成。
