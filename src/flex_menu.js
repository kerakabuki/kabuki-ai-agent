// src/flex_menu.js
// env は将来 R2（ASSETS_BUCKET 等）を使う場合に利用。現状は受け取るだけ。

export function mainMenuFlex(env) {
    const menuItem = (icon, label, desc, data, color) => ({
      type: "box",
      layout: "horizontal",
      paddingAll: "12px",
      backgroundColor: color,
      cornerRadius: "12px",
  
      // ✅ displayText を消す（タップしたラベルがトークに出なくなる）
      action: { type: "postback", label, data },
  
      contents: [
        { type: "text", text: icon, size: "xl", flex: 0, gravity: "center" },
        {
          type: "box",
          layout: "vertical",
          paddingStart: "12px",
          flex: 4,
          contents: [
            { type: "text", text: label, weight: "bold", size: "md" },
            { type: "text", text: desc, size: "xxs", color: "#666666", wrap: true }
          ]
        },
        { type: "text", text: "▶", size: "sm", color: "#999999", flex: 0, gravity: "center" }
      ]
    });
  
    return {
      type: "flex",
      altText: "けらのすけメニュー",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            { type: "text", text: "けらのすけ 🙂", weight: "bold", size: "xl" },
            { type: "text", text: "歌舞伎AIガイド｜気になるメニューをタップ！", size: "xs", color: "#888888", wrap: true },
            { type: "separator", margin: "md" },
  
            // ① 気良歌舞伎ナビ（mode=kera）
            menuItem("💬", "気良歌舞伎ナビ", "公演・会場・アクセス・参加方法を案内", "mode=kera", "#FFF8E1"),
  
            // ② 演目・人物ガイド（step=enmoku_list）
            menuItem("📖", "演目・人物ガイド", "20演目のあらすじ・みどころ・登場人物", "step=enmoku_list", "#E8F5E9"),
  
            // ③ おすすめ（mode=recommend）
            menuItem("🌟", "おすすめ演目", "初心者向け／ジャンル別にサクッと", "mode=recommend", "#FFF3E0"),
  
            // ④ 用語（mode=general）
            menuItem("📝", "歌舞伎用語いろは", "126の用語をカテゴリ別に解説", "mode=general", "#E3F2FD"),
  
            // ⑤ クイズ（mode=quiz）
            menuItem("🎯", "歌舞伎クイズ", "全100問の三択で楽しく学ぼう", "mode=quiz", "#FCE4EC"),
  
            { type: "text", text: "💡「0」でいつでもメニューに戻れるよ", size: "xxs", color: "#AAAAAA", wrap: true, margin: "md" }
          ]
        }
      }
    };
  }
  