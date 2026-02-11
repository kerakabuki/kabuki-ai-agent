# 台詞道場 - 節まわしビジュアライザー

`extract_kabuki_pitch.py` で出力した `serifu_guide.json` と音声ファイルを読み込み、お手本のピッチ曲線とマイク入力の曲線を重ねて表示する React アプリです。

## 使い方

```bash
cd serifu-viz
npm install
npm run dev
```

ブラウザで開いたら:

1. **📄 JSON** で `serifu_guide.json`（プロジェクト直下または `../serifu_guide.json`）を選択
2. **🔊 音声** で同じ出典の音声（WAV/MP3）または動画を選択
3. ▶ で再生し、🎤 でマイクを ON にすると自分の声のピッチが重なって表示されます

## ビルド

```bash
npm run build
```

`dist/` に静的ファイルが出力されます。Worker の ASSETS や R2 に配置すれば本番でも利用できます。
