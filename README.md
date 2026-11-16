# 四角形の2D移動ゲーム

Godot 4 / GDScript / Compatibility。追加の画像・フォント・外部ライブラリは使用していません。

## 実行方法

1. Godotでこのフォルダーの project.godot を開きます。
2. すでに開いている場合、外部変更の再読み込みを求められたら再読み込みします。反映されなければプロジェクトを開き直してください。
3. F5（プロジェクトを実行）を押します。メインシーンは main.tscn に設定済みです。
4. ゲーム画面をクリックし、WASDまたは矢印キーで四角形を動かします。
5. Godotの停止ボタンまたはF8で終了します。

移動速度は300ピクセル/秒、四角形は40×40です。斜め移動でも速度は同じです。四角形の大きさを含めて画面内に制限し、ウィンドウのサイズ変更にも追従します。player.tscn のPlayerノードのInspectorで speed、size、color を調整できます。

## ファイルと変更内容

- main.tscn（追加）: Playerと操作案内のあるメインシーン。
- player.tscn（追加）: player.gdを付けた再利用可能なプレイヤーシーン。
- player.gd（更新）: 空の処理を四角形の描画、入力移動、画面端制限に置き換え。
- project.godot（更新）: メインシーン、960×540の基準サイズ、背景色、WASDと矢印キーのInput Mapを設定。既存のCompatibilityとcanvas_items/expand設定は維持。
- export_presets.cfg（追加）: Webプリセット。スレッドとGDExtensionは無効。
- build/.gdignore（追加）: Web出力をGodotの素材インポート対象から除外。
- README.md（追加）: この説明書。

既存ファイルは削除していません。既存のアイコンとplayer.gd.uidも維持しています。

## Webエクスポート

1. エディター → エクスポートテンプレートの管理から、使用中のGodotと同じバージョンのテンプレートをインストールします。
2. プロジェクト → エクスポートを開き、設定済みのWebを選択します。
3. プロジェクトのエクスポートで build/web/index.html に出力します。
4. 生成されたHTML・JavaScript・WASM・PCKなどを同じフォルダーのままWebサーバーで配信します。HTMLファイルの直接ダブルクリックではなくHTTP経由で開いてください。
5. ローカル確認にはGodotのWeb実行ボタンを利用できます。Python導入済みなら、プロジェクトフォルダーで python -m http.server 8000 --directory build/web を実行し、http://localhost:8000/ を開くこともできます。

Compatibility（WebGL 2.0）とシングルスレッド設定を使用しています。
公式ガイド: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html

## 確認結果

Godot 4.7.2のヘッドレス実行でメインシーンの読み込み、WASD・矢印キー8種類、斜め移動の速度、逆方向キー同時押し、四隅の制限、画面サイズ変更を確認しました。検証用スクリプトはインポート対象外の .godot/movement_smoke.gd にあります。
この実行環境では証明書ストアに関するエラーが出ますが、ゲームの動作検証は成功しています。
Godot 4.7.2のWebリリースビルドとWorkersローカルランタイムでの圧縮配信検証が完了しています。公開URLでのブラウザー操作は未確認です。

## GitHub / Cloudflare Workers公開

公開済みURLは https://godot-web-test.beeskynohito.workers.dev/ です。
予定の独自ドメイン https://testgame.xainome.blog はDNS接続待ちです。
ビルド・容量制限・認証・DNS承認・公開確認は [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) を参照してください。
既存のHugoブログは変更しません。GitHub Actionsのデプロイは有効で、mainへのPushで専用Workerを更新します。
