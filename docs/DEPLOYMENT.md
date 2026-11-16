# GitHub / Cloudflare Workers 公開手順

公開予定URL: https://testgame.xainome.blog
専用リポジトリ予定: https://github.com/sai-nome/godot-web-test
専用Worker名: godot-web-test

既存Hugoブログ、xainome.blogのルートドメイン、既存Workerは変更しない。
この構成のwrangler.jsoncにはroutes/custom domainsを指定しない。
DNS変更は別作業として内容を確認し、承認を得てから実施する。

## 確認結果（2026-11-16）

- Godot: 4.7.2.stable.official.ed1daf0bf
- GDScript、Compatibility、Thread Support OFF、GDExtension OFF。
- main.tscnから使用するリソースだけをエクスポートする。
- Webリリースビルド成功。環境の証明書ストア読取エラーは残るが終了コード0、出力を検証済み。
- ツール類をゲームに取り込まないよう.gdignoreとシーン選択エクスポートを使用。
- WASM原本: 39,514,754 bytes（37.68 MiB）。25 MiBを超過する。
- gzip版: 10,153,810 bytes（9.68 MiB）。全配信ファイルが上限内。
- WorkersローカルランタイムでHTTP取得、gzip展開後の原本一致、WASMコンパイル、HTML取得、404を検証済み。
- Wrangler deploy --dry-runはこの端末の実行制限（親フォルダー参照拒否）により失敗。CIにも検査を組み込んでいる。CI上での実行成功はまだ未確認。
- GitHubリポジトリ作成・Push、Actions本番実行、Cloudflare本番デプロイ、DNS接続、公開後のブラウザー操作は未完了。

| ファイル | 元のWeb出力 bytes | 配信 bytes |
| --- | ---: | ---: |
| index.html | 5,443 | 5,443 |
| index.js | 279,815 | 279,815 |
| index.wasm | 39,514,754 | 10,153,810 |
| index.pck | 9,580 | 9,580 |
| index.audio.worklet.js | 7,298 | 7,298 |
| index.audio.position.worklet.js | 2,973 | 2,973 |
| index.png | 21,443 | 21,443 |
| index.icon.png | 5,765 | 5,765 |
| index.apple-touch-icon.png | 11,939 | 11,939 |
| _headers | — | 37 |

最新のサイズは npm run prepare:web で再計測し、build/asset-report.json に保存する。

## 上限超過への対応と無料枠

Cloudflare静的アセットは1ファイル25 MiB、Freeでは20,000ファイルまで。
通常のHTTP転送圧縮だけではアップロード上限を解決できないため、
ビルド時にWASMをgzip化したファイルをdistに作る。元のbuild/webは非圧縮のまま残す。

/index.wasm だけを worker/index.js に通し、ASSETSから圧縮済みデータをストリームで返す。
Content-Encoding: gzip と encodeBody: manual を設定する。
_headersにContent-Encodingを指定するだけの構成は二重圧縮を起こしたため採用していない。
WASMの拡張子はそのままにしてGodotローダーを変更しない。
distは必ずWrangler/Workersを通して配信する。通常のpython http.serverでdistを配信しない。

既知のHTML/JS/画像/PCKは静的配信。WASMとWorkerに到達する不明URLのリクエストはWorkers枠を使う。
Workers Freeはアカウント全体で100,000リクエスト/日、CPU 10ms/呼び出し。
既存Workerがある場合、その利用と枠を共有する。上限到達時にゲームを配信できなくなる可能性がある。
Workers Paidへの変更、R2/KV/有料サービスの作成は行わない。
既存アカウントがPaidの場合も、この手順のデプロイを有効化せず、費用を確認して事前承認を得る。

将来gzip後も25 MiBを超えたらCIはデプロイ前に停止する。
無料の代替案は、3D等の不要機能を省いたGodot Webテンプレートを自前ビルドすること。
別ホスティングやR2は公開方式・費用の確認後に検討する。

## ローカルでのビルド

Node.js 22以降と、Godot 4.7.2の対応エクスポートテンプレートが必要。

```powershell
npm ci
npm run verify:project
# godotはインストール済みGodot実行ファイルのパスに読み替える
godot --headless --path . --editor --import --quit
godot --headless --path . --export-release Web build/web/index.html
npm run prepare:web
npm run test:serving
npm run deploy:check
npm run preview
```

プレビューは http://localhost:8787/ 。WASD/矢印キーと画面端を確認する。
公開前のWASM配信テストはHTTP・圧縮の検証であり、ブラウザーでのゲーム操作確認とは別。
出力に予期しない古いファイルがある場合prepare:webは停止する。distを別名に退避してから再生成する。

## GitHubの初回設定

1. https://github.com/new で所有者sai-nome、名前godot-web-testの空リポジトリを作成する。
   Actionsの標準ホストを無料で使うためPublicを推奨。README、.gitignore、Licenseは初期化しない。
   Privateを選ぶ場合はActionsの利用枠と課金設定を確認し、課金は別途承認する。
2. ローカルGitのoriginをこの専用リポジトリへ設定し、mainをPushする。既存履歴がある場合はforce pushしない。
3. ActionsのBuild and deploy Godot Webを確認する。初期状態ではビルド/検証のみで、デプロイは無効。
4. CIはGodot 4.7.2の公式バイナリ/テンプレートをダウンロードし、固定SHA-256を照合する。
   公式テンプレートアーカイブは約1.28 GB。Web用releaseテンプレートのみ展開する。
5. Actions標準Linuxランナーを使う。成果物の保持は3日。

この端末ではGit資格情報ストアが使用できず、GitHub CLIも未導入。
通常の端末/VS CodeでGitHubへサインインするか、接続GitHubツール経由でソースを反映する。
認証時にworkflowファイルを書き込める権限も必要。トークンをGitのURLやファイルに埋め込まない。

## Cloudflareの初回設定（人間の操作）

1. https://dash.cloudflare.com/ にログイン。Workers & PagesでアカウントがWorkers Freeか確認する。
   この作業中、既存ブログ/Workerの設定画面で編集・削除・アップグレードしない。
2. godot-web-testというWorkerが存在しないことを確認する。
   既存の同名Workerがある場合は停止し、用途を調べる。上書きしない。
3. アカウントIDを控える。Zone IDとは異なる。
4. My Profile → API Tokensで、このGitHub Actions専用トークンを作成する。
   カスタムトークンのAccount権限はWorkers Scripts: Edit、対象は該当アカウントに限定。
   DNS Edit / Zone Workers Routes Editは付与しない。期限を設定し、最小権限で運用する。
   トークン作成は人間が実施し、チャットやリポジトリに貼り付けない。
5. 専用GitHubリポジトリ → Settings → Secrets and variables → Actions → Secretsに登録する:
   - CLOUDFLARE_API_TOKEN: 上記のトークン
   - CLOUDFLARE_ACCOUNT_ID: 該当アカウントのID
6. Variablesに登録する:
   - CLOUDFLARE_FREE_PLAN_CONFIRMED = true（Freeであることを実際に確認した後）
   - CLOUDFLARE_DEPLOY_ENABLED = true（新規専用Workerの作成を開始できる状態になった後）
   - CLOUDFLARE_WORKER_CREATED_FOR_THIS_REPO は最初は未設定
7. Actions → Build and deploy Godot Web → Run workflow → main。
   初回はAPIでWorker名の空きを確認してから作成する。
   401/403なら認証/権限不足。DNS権限を増やす前にエラー対象を確認する。
8. 成功ログのworkers.dev URLを開いてゲームを確認する。
9. 今回のリポジトリから作成したWorkerであることを確認してから、
   CLOUDFLARE_WORKER_CREATED_FOR_THIS_REPO = true を設定する。
   以後mainへのPushで更新される。この変数を既存の無関係なWorkerに対して設定しない。
   初回途中失敗でWorkerだけ作られた場合も、確認してからこの変数を設定する。
10. 一時停止するにはCLOUDFLARE_DEPLOY_ENABLEDをfalseにする。公開中の版は維持される。

APIトークンやアカウントIDはwrangler.jsoncに書かない。
.gitignoreは.env系、.dev.vars系、export_credentials.cfg、秘密鍵、キャッシュを除外する。
GitHub Actionsはcontents: readのみ、PRからデプロイしない。

## testgame.xainome.blog の接続（事前承認が必要）

Workerのworkers.dev動作確認後に行う。ここまでのCIはDNSを作成しない。

変更案:
- 対象: testgame.xainome.blog のみ。
- 専用Worker godot-web-test にCustom Domainとして関連付ける。
- Cloudflareにこのサブドメイン用DNSとTLS証明書を作成させる。
- xainome.blog、www、既存ブログのWorker/Pages、その他のDNSレコードは変更しない。
- *.xainome.blog/* や xainome.blog/* のWorker Routeを追加しない。

承認前にxainome.blogゾーンが該当アカウントでActiveであること、
testgameに既存DNS/Custom Domain/Worker Routeがないことを読み取りで確認する。
既存レコードがあれば削除/上書きせず、内容を報告する。
承認後、Workers & Pages → godot-web-test → Settings → Domains & Routes → Add → Custom Domainで
testgame.xainome.blogを指定し、確認画面の変更内容がこのサブドメインだけであることを確認して適用する。
この操作がDNS変更になるため、人間の承認なしでは実施しない。

## 公開後の確認

- https://testgame.xainome.blog が有効なHTTPSで開く。
- WASMレスポンスが200、Content-Type: application/wasm、Content-Encoding: gzip。
- PCK/JS/画像のロードエラーがない。
- 四角形が表示され、WASDと矢印キーで移動し、斜め速度が増えず、画面外に出ない。
- ウィンドウをリサイズしても画面内に収まる。
- ブラウザーコンソールに起動エラーがない。
- 既存 https://xainome.blog を閲覧し、表示を確認する（変更はしない）。

## 公式資料

- [Workersの上限](https://developers.cloudflare.com/workers/platform/limits/)
- [静的アセット料金](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [圧縮済みResponse](https://developers.cloudflare.com/workers/runtime-apis/response/)
- [GitHub Actions連携](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Godot Webエクスポート](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
