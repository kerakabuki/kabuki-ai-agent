// SNS投稿/2026-10-29_Instagram朝/recovery/existing365.js
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
async function postInstagramStory(config, imageUrl) {
  if (!config.igUserId) {
    return { success: false, error: "INSTAGRAM_USER_ID not configured" };
  }
  try {
    const createRes = await fetch(
      `${GRAPH_API}/${config.igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          media_type: "STORIES",
          access_token: config.accessToken
        })
      }
    );
    const createData = await createRes.json();
    if (createData.error) {
      return { success: false, error: formatMetaError(createData.error) };
    }
    const containerId = createData.id;
    const ready = await pollContainerStatus(config, containerId);
    if (!ready.success) return ready;
    const publishRes = await fetch(
      `${GRAPH_API}/${config.igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: config.accessToken
        })
      }
    );
    const publishData = await publishRes.json();
    if (publishData.error) {
      return { success: false, error: formatMetaError(publishData.error) };
    }
    const mediaId = publishData.id;
    let permalink;
    try {
      const permaRes = await fetch(
        `${GRAPH_API}/${mediaId}?fields=permalink&access_token=${config.accessToken}`
      );
      const permaData = await permaRes.json();
      if (typeof permaData.permalink === "string") {
        permalink = permaData.permalink;
      }
    } catch {
    }
    return { success: true, platformPostId: mediaId, permalink };
  } catch (e) {
    return { success: false, error: `Instagram Story API error: ${e.message}` };
  }
}
async function pollContainerStatus(config, containerId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3e3));
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${config.accessToken}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") {
      return { success: true };
    }
    if (data.status_code === "ERROR") {
      return { success: false, error: `Container processing failed` };
    }
  }
  return { success: false, error: "Container processing timed out" };
}
function formatMetaError(err) {
  if (typeof err === "object" && err !== null) {
    const e = err;
    return `Meta API [${e.code}]: ${e.message}`;
  }
  return String(err);
}
var GRAPH_API;
var init_meta_api = __esm({
  "worker-integration/mimyo-manual-release/src/lib/sns/meta-api.ts"() {
    "use strict";
    GRAPH_API = "https://graph.facebook.com/v21.0";
  }
});
var init_x_api = __esm({
  "worker-integration/mimyo-manual-release/src/lib/sns/x-api.ts"() {
    "use strict";
  }
});
var init_bluesky_api = __esm({
  "worker-integration/mimyo-manual-release/src/lib/sns/bluesky-api.ts"() {
    "use strict";
  }
});
function requiredImageCredits(settings2, imageIds) {
  const raw2 = settings2.image_required_credits;
  if (!raw2) return [];
  const parsed = JSON.parse(raw2);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid image_required_credits setting");
  }
  const entries = parsed;
  const credits = [];
  for (const id of imageIds) {
    const value = entries[String(id)];
    if (value === void 0) continue;
    if (typeof value !== "string" || !value.trim()) throw new Error("Invalid required photo credit");
    if (!credits.includes(value.trim())) credits.push(value.trim());
  }
  return credits;
}
function creditedCaption(text, tags, credits = []) {
  const body = text?.trim() || "";
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  const missing = [...new Set(credits)].filter((credit) => !lines.includes(credit));
  return [body, missing.join("\n"), tags?.trim()].filter(Boolean).join("\n\n");
}
function isPhotoOnlyDate(settings2, date) {
  const start = settings2.photo_only_start_date;
  const end = settings2.photo_only_end_date;
  return /^\d{4}-\d{2}-\d{2}$/.test(start || "") && /^\d{4}-\d{2}-\d{2}$/.test(end || "") && start <= date && date <= end;
}
var EDITORIAL_EVIDENCE_KEY = "ig_three_plays_evidence_v1";
var HELD_POST_IDS = [777, 778, 780, 781, 782];
var HELD_PHOTO_IDS = ["mori-mimyo-portrait", "mori-stage-headinspection", "yamashina-stage", "kirare-otomi-portrait", "kirare-stage-reunion"];
var HELD_IMAGE_IDS = [302, 303, 305, 239, 306];
var HELD_DELIVERY_SHA256 = ["9847c0687e95f02957a81e4bb220c5ce38e202bdd1cc05ea76db153fdc026c82", "b88c570d998c23d4db5fbe4f6e47b18c30ec258e44495cc64aee8e6f6df9e917", "5e06150d46e69baef44a28800661f6a28425951a78247a6f55e0986afe048447", "041f96d2cf901b1684cdfe80869dfbffb5eba86a2c8e984d60dc9dfd73833efe", "13305e8167582d0b4b408ead066e8a035016e73b50e6577c90476dfe99ceae6a"];
var HELD_R2_KEYS = ["originals/ig3_20261008_mori-mimyo-portrait_9847c0687e95.jpg", "originals/ig3_20261008_mori-stage-headinspection_b88c570d998c.jpg", "originals/ig3_20261008_yamashina-stage_5e06150d46e6.jpg", "originals/otomi_1.jpg", "originals/ig3_20261008_kirare-stage-reunion_13305e816758.jpg"];
function heldEditorialPost(id) {
  return HELD_POST_IDS.includes(id);
}
function heldEditorialMaterial(p2) {
  return HELD_PHOTO_IDS.includes(p2.id || "") || HELD_IMAGE_IDS.includes(p2.imageId || 0) || HELD_DELIVERY_SHA256.includes(p2.imageSha256 || "") || HELD_R2_KEYS.includes(p2.r2Key || "");
}
var object = (x) => !!x && typeof x === "object" && !Array.isArray(x);
var nonempty = (x) => typeof x === "string" && !!x.trim();
var sha = (x) => typeof x === "string" && /^[a-f0-9]{64}$/.test(x);
function proof(x, kinds, assertion, imageSha256) {
  if (!object(x) || x.status !== "confirmed" || !kinds.includes(String(x.kind)) || !nonempty(x.reference) || !sha(x.sha256) || !nonempty(x.excerpt) || x.assertion !== assertion || !x.excerpt.includes(assertion) || !nonempty(x.reviewedBy) || !nonempty(x.reviewedAt) || Number.isNaN(Date.parse(x.reviewedAt))) return false;
  if (imageSha256 && x.imageSha256 !== imageSha256) return false;
  if (String(x.kind).endsWith("_labelled_original")) {
    const chain = x.transformRecord;
    if (!sha(x.originalImageSha256) || x.sha256 !== x.originalImageSha256 || x.samePhotoMethod !== "exact_original_with_recorded_transform" || !object(chain) || !nonempty(chain.reference) || !sha(chain.sha256) || chain.originalImageSha256 !== x.originalImageSha256 || chain.imageSha256 !== imageSha256) return false;
  }
  return true;
}
var TONASE_VISIBLE_REVIEW = {
  "photoId": "yama-tonase-konami-267-approved",
  "imageId": 307,
  "imageSha256": "e190da8500e4ec1f436f840d100cf27dc8aacafe20ce037850d8a340e39cd69b",
  "originalImageSha256": "9ac5c015199060e3e0dca15d4e51745a93b18c1fb8d276e460b60d15268e7bbc",
  "r2Key": "originals/ig3_20261009_yama-tonase-konami-267-approved_e190da8500e4.jpg",
  "playName": "\u4E5D\u6BB5\u76EE\u30FB\u5C71\u79D1\u9591\u5C45",
  "copy": "\u6238\u7121\u702C\u3068\u5C0F\u6D6A\u3001\u4E8C\u4EBA\u306E\u5F79\u59FF\u3002",
  "text": "\u300E\u4E5D\u6BB5\u76EE\u30FB\u5C71\u79D1\u9591\u5C45\u300F\u306E\u821E\u53F0\u304B\u3089\u3002\n\u8D64\u3068\u767D\u3001\u4E8C\u3064\u306E\u8863\u88F3\u3002\n\u6238\u7121\u702C\u3068\u5C0F\u6D6A\u3001\u4E8C\u4EBA\u306E\u5F79\u59FF\u3002\n\u91D1\u306E\u5E2F\u304C\u3001\u8D64\u306E\u4E2D\u306B\u5149\u308B\u3002",
  "visibleReviewSha256": "88ec1225222400de8eb4d30559b020069e17c634aa99a658f691144be08adafd",
  "visibleReviewAt": "2026-10-09T01:34:23.693Z",
  "roleUIReviewSha256": "37792be2b7e32419a0454eb04ce1d43bda18a22c3b70a9b3315631abe3df56bc",
  "roleUIEventDigest": "a818dbf3bccb239f3bd19c52e658c0fe85fd0cfb5d192eed4d267f4857443e6f",
  "roleUIReviewAt": "2026-10-07T12:07:33.225Z",
  "roleUIReviewer": "\u3053\u306EPC\u306E\u78BA\u8A8D\u8005",
  "roleNames": [
    "\u6238\u7121\u702C",
    "\u5C0F\u6D6A"
  ],
  "userPlayAndUseSha256": "def5926bb12c7e8c9444a1e63e9ceebe40c8e5f218387dc7366eca822b0286a7",
  "transformSha256": "183ba4bf3931eb369bee984292b616a8f40db83c25aa06f85d7042383f83506c"
};
function reviewedTonaseVisibleFrame(p2, r) {
  const v = r.visible, h = v?.retainedRoleReview, t = v?.transformRecord, k = TONASE_VISIBLE_REVIEW;
  return p2.id === k.photoId && p2.imageId === k.imageId && p2.r2Key === k.r2Key && p2.imageSha256 === k.imageSha256 && p2.kind === "stage" && p2.characterName === null && p2.characterId === null && p2.naviCastId === null && p2.playName === k.playName && p2.copy === k.copy && p2.text === k.text && proof(v, ["reviewed_visible_composition"], p2.copy, p2.imageSha256) && v?.sha256 === k.visibleReviewSha256 && v.reviewedAt === k.visibleReviewAt && v.originalImageSha256 === k.originalImageSha256 && t?.sha256 === k.transformSha256 && t.originalImageSha256 === k.originalImageSha256 && t.imageSha256 === k.imageSha256 && !!h && h.sha256 === k.roleUIReviewSha256 && h.eventDigest === k.roleUIEventDigest && h.at === k.roleUIReviewAt && h.reviewer === k.roleUIReviewer && JSON.stringify(v.roles) === JSON.stringify(k.roleNames) && v.userPlayAndUsageSha256 === k.userPlayAndUseSha256 && r.play?.sha256 === k.userPlayAndUseSha256 && r.play.reviewedAt === "2026-10-09T01:26:00Z" && v.specificStoryMoment === "unknown" && v.noUserExactSceneInvented === true;
}
var OTOMI239_REVIEW = {
  "photoId": "kirare-otomi-239-reviewed",
  "imageId": 239,
  "imageSha256": "041f96d2cf901b1684cdfe80869dfbffb5eba86a2c8e984d60dc9dfd73833efe",
  "r2Key": "originals/otomi_1.jpg",
  "playName": "\u5207\u3089\u308C\u4E0E\u4E09",
  "characterName": "\u304A\u5BCC",
  "characterId": 71,
  "naviCastId": "person_1",
  "copy": "\u304B\u3064\u3066\u4E0E\u4E09\u90CE\u3068\u604B\u4EF2\u3060\u3063\u305F\u4EBA\u7269\u3067\u3059\u3002",
  "text": "\u5F79\u306E\u540D\u3092\u77E5\u308B\u3068\u3001\u4E00\u679A\u306E\u5199\u771F\u304C\u7269\u8A9E\u306E\u5165\u53E3\u306B\u3002\n\n\u300E\u5207\u3089\u308C\u4E0E\u4E09\u300F\u306E\u304A\u5BCC\u3002\n\u304B\u3064\u3066\u4E0E\u4E09\u90CE\u3068\u604B\u4EF2\u3060\u3063\u305F\u4EBA\u7269\u3067\u3059\u3002\n\n\u4E0E\u4E09\u90CE\u3068\u3001\u304A\u5BCC\u3002\n\u4E8C\u4EBA\u306E\u3064\u306A\u304C\u308A\u3092\u624B\u304C\u304B\u308A\u306B\u3001\u6B4C\u821E\u4F0E\u306E\u7269\u8A9E\u3092\u305F\u3069\u3063\u3066\u307F\u307E\u305B\u3093\u304B\u3002",
  "roleReviewSHA256": "bc33a031c870628e59034a299524b4542bd36e0d09d0667ae1f24dfdc9a2cc54",
  "eventDigest": "f907614584b6d2ccedcce89b52c873719c62511ef276cbf10a0420797d53ffc9",
  "reviewer": "\u3053\u306EPC\u306E\u78BA\u8A8D\u8005",
  "roleReviewAt": "2026-10-07T12:07:05.213Z",
  "rawPlayLabel": "\u4E0E\u8A71\u60C5\u6D6E\u540D\u6A2A\u6ADB",
  "primaryReviewSHA256": "e283081268aafb98cddbe4c5f4d31019b01f6215cbea5e4b6455b95a57c7046a",
  "permissionSHA256": "fc14210d0f805157c61af23eac8bd2e9891b7da823d9282b5d1d8d52e9fc8783",
  "visualSHA256": "fb361cf5bc2220fa9be831095493408fbd59203954a501d93b5572c9ebd561a5",
  "captionSHA256": "676a91d3e1b5ef97eb32d0d401a910894eb8de08238d02d6760a1b035f8d3670",
  "reviewedAt": "2026-10-09T23:14:07.771Z"
};
function isReviewedOtomi239Candidate(p2) {
  return p2.id === OTOMI239_REVIEW.photoId && p2.imageId === OTOMI239_REVIEW.imageId;
}
function reviewedOtomi239(p2, r) {
  const k = OTOMI239_REVIEW, i = r.identity, pl = r.play, c = r.copy;
  return isReviewedOtomi239Candidate(p2) && p2.kind === "portrait" && p2.r2Key === k.r2Key && p2.imageSha256 === k.imageSha256 && p2.playName === k.playName && p2.characterName === k.characterName && p2.characterId === k.characterId && p2.naviCastId === k.naviCastId && p2.copy === k.copy && p2.text === k.text && r.claimScope === "role_relationship" && proof(i, ["user_exact_role"], k.characterName, k.imageSha256) && i?.sha256 === k.roleReviewSHA256 && i.originalImageSha256 === k.imageSha256 && i.samePhotoMethod === "byte_identical_original_and_delivery" && i.transformRecord === void 0 && i.eventDigest === k.eventDigest && i.rawPlayLabel === k.rawPlayLabel && i.reviewedBy === k.reviewer && i.reviewedAt === k.roleReviewAt && i.userPhotoUseSha256 === k.permissionSHA256 && proof(pl, ["user_exact_play"], k.playName, k.imageSha256) && pl?.sha256 === k.roleReviewSHA256 && pl.eventDigest === k.eventDigest && pl.rawPlayLabel === k.rawPlayLabel && pl.reviewedBy === k.reviewer && pl.reviewedAt === k.roleReviewAt && pl.titleNormalizationSha256 === k.primaryReviewSHA256 && pl.userPhotoUseSha256 === k.permissionSHA256 && proof(c, ["primary_role_description"], k.copy) && c?.sha256 === k.primaryReviewSHA256 && c.reviewedAt === k.reviewedAt && p2.editorial?.visualReview.sha256 === k.visualSHA256 && p2.editorial.captionReview.sha256 === k.captionSHA256 && p2.editorial.reviewedAt === k.reviewedAt;
}
function editorialEvidenceError(s, revision, p2, postId) {
  if (postId !== void 0 && heldEditorialPost(postId) || heldEditorialMaterial(p2) && !isReviewedOtomi239Candidate(p2))
    return "\u4EBA\u7269\u30FB\u5834\u9762\u306E\u72EC\u7ACB\u6839\u62E0\u304C\u672A\u78BA\u5B9A\u306E\u7D20\u6750\u3067\u3059\u3002\u516C\u958B\u4FDD\u7559\u3092\u89E3\u9664\u3067\u304D\u307E\u305B\u3093";
  let raw2;
  try {
    raw2 = JSON.parse(s[EDITORIAL_EVIDENCE_KEY] || "");
  } catch {
    return "\u72EC\u7ACB\u3057\u305F\u4EBA\u7269\u30FB\u5834\u9762\u6839\u62E0\u306E\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059";
  }
  if (!object(raw2) || raw2.schemaVersion !== 1 || raw2.manifestRevision !== revision || !Array.isArray(raw2.photos) || raw2.photos.length > 150)
    return "\u72EC\u7ACB\u6839\u62E0\u306E\u627F\u8A8D\u7248\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
  const matches = raw2.photos.filter((x) => object(x) && x.photoId === p2.id);
  if (matches.length !== 1) return "\u3053\u306E\u5199\u771F\u306E\u72EC\u7ACB\u6839\u62E0\u304C\u3042\u308A\u307E\u305B\u3093";
  const review = matches[0];
  if (review.status !== "confirmed" || review.imageSha256 !== p2.imageSha256) return "\u4EBA\u7269\u30FB\u5834\u9762\u306E\u72EC\u7ACB\u6839\u62E0\u306F needs_review \u3067\u3059";
  if (isReviewedOtomi239Candidate(p2) && !reviewedOtomi239(p2, review)) return "\u304A\u5BCC239\u306E\u4FDD\u5B58\u6E08\u307F\u672C\u4EBA\u78BA\u8A8D\u30FB\u6F14\u76EE\u5BFE\u5FDC\u30FB\u4F7F\u7528\u8A31\u53EF\u30FB\u4E00\u6B21\u8CC7\u6599\u30FB\u672C\u6587\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
  if (p2.kind === "portrait") {
    if (review.claimScope !== "role_relationship" || !p2.characterName || !proof(review.identity, ["role_labelled_original", "user_exact_role"], p2.characterName, p2.imageSha256))
      return "\u540C\u3058\u539F\u5199\u771F\u306E\u5F79\u540D\u539F\u8CC7\u6599\u3001\u307E\u305F\u306F\u3053\u306E\u5199\u771F\u3078\u306E\u660E\u793A\u7684\u306A\u5F79\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059";
    if (p2.id === "yamashina-oishi-portrait" && (review.identity?.kind !== "role_labelled_original" || review.identity.originalImageSha256 !== "a77c3371c4a6aad8e9add9d5dd68b11a51cfe2dc106771af44f620de26073864" || p2.imageSha256 !== "51d971e321b89b908cf4065f145bf25b2be5e6deb9250797638a2f7983ff8ec4"))
      return "\u304A\u77F3\u306E\u5F79\u540D\u539F\u8CC7\u6599\u3068\u540C\u4E00\u539F\u5199\u771F\u306E\u5BFE\u5FDC\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
    if (!proof(review.copy, ["primary_role_description"], p2.copy)) return "\u4EBA\u7269\u306E\u4E00\u822C\u95A2\u4FC2\u3092\u652F\u3048\u308B\u4E00\u6B21\u8CC7\u6599\u304C\u5FC5\u8981\u3067\u3059";
  } else {
    if (!proof(review.play, ["play_labelled_original", "user_exact_play"], p2.playName, p2.imageSha256)) return "\u540C\u3058\u539F\u5199\u771F\u306E\u6F14\u76EE\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059";
    if (review.claimScope === "visible_composition" || p2.id === TONASE_VISIBLE_REVIEW.photoId || p2.imageId === TONASE_VISIBLE_REVIEW.imageId || p2.imageSha256 === TONASE_VISIBLE_REVIEW.imageSha256 || p2.r2Key === TONASE_VISIBLE_REVIEW.r2Key)
      return review.claimScope === "visible_composition" && reviewedTonaseVisibleFrame(p2, review) ? null : "\u6238\u7121\u702C\u30FB\u5C0F\u6D6A\u306E\u540C\u4E00\u5199\u771F\u3001\u672C\u4EBA\u5F79\u540D\u78BA\u8A8D\u3001\u6F14\u76EE\u30FB\u4F7F\u7528\u8A31\u53EF\u3001\u53EF\u8996\u69CB\u56F3\u9650\u5B9A\u672C\u6587\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
    if (review.claimScope !== "depicted_scene" || !proof(review.scene, ["scene_labelled_original", "user_exact_scene"], p2.copy, p2.imageSha256))
      return "\u3053\u306E\u5199\u771F\u306E\u5177\u4F53\u7684\u306A\u5834\u9762\u3092\u652F\u3048\u308B\u72EC\u7ACB\u6839\u62E0\u304C\u5FC5\u8981\u3067\u3059";
  }
  return null;
}
var INSTAGRAM_CAPTION_POLICY = "morning_character_evening_visual_v1";
var record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
var nonempty2 = (x) => typeof x === "string" && !!x.trim();
var evidence = (x) => record(x) && nonempty2(x.reference) && typeof x.sha256 === "string" && /^[a-f0-9]{64}$/.test(x.sha256) && nonempty2(x.excerpt);
function instagramEditorialText(p2) {
  const e = p2.editorial;
  if (!e) throw new Error("Reviewed Instagram editorial framing required");
  const gap = e.paragraphGap === 1 ? "\n" : "\n\n";
  return p2.kind === "portrait" ? `${e.opening}${gap}\u300E${p2.playName}\u300F\u306E${p2.characterName}\u3002
${p2.copy}${gap}${e.viewingEntry}` : `\u300E${p2.playName}\u300F\u306E\u821E\u53F0\u304B\u3089\u3002${gap}${e.opening}
${e.viewingEntry}`;
}
function parseInstagramEditorial(raw2, p2) {
  if (!record(raw2) || raw2.schemaVersion !== 1 || raw2.mode !== (p2.kind === "portrait" ? "morning_character" : "evening_visual") || raw2.paragraphGap !== void 0 && raw2.paragraphGap !== 1 && raw2.paragraphGap !== 2 || raw2.imageSha256 !== p2.imageSha256 || !nonempty2(raw2.opening) || !nonempty2(raw2.viewingEntry) || !evidence(raw2.visualReview) || !evidence(raw2.captionReview) || !nonempty2(raw2.reviewedBy) || !nonempty2(raw2.reviewedAt) || Number.isNaN(Date.parse(raw2.reviewedAt)))
    throw new Error("Invalid or unreviewed morning/evening caption framing");
  const e = raw2;
  const creative = `${e.opening}
${e.viewingEntry}`;
  if (/https?:\/\/|ignore.*instructions|指示.*無視|[「」“”]|心の中|胸の内|と思[うっ]|願[うっ]|悲し[むみん]|泣[くい]|嬉し|喜[ぶび]|怒[るり]|雪|雨|晴|季節|春|夏|秋|冬|朝日|夕日|夜空|昨夜|今朝|今夜|劇場|会場|撮影|演じる|演じた|俳優|役者/i.test(creative) || !e.visualReview.excerpt.includes(e.opening) || !e.captionReview.excerpt.includes(instagramEditorialText({ ...p2, editorial: e })))
    throw new Error("Editorial framing does not match reviewed visible elements and caption");
  return e;
}
var THREE_PLAY_MODE = "three_plays_v1";
var PLAY_IDS = ["moritunajinya", "yamashinakankyo", "kirareyosa"];
var PLAY_NAMES = {
  moritunajinya: ["\u76DB\u7DB1\u9663\u5C4B"],
  yamashinakankyo: ["\u5C71\u79D1\u9591\u5C45", "\u4E5D\u6BB5\u76EE\u30FB\u5C71\u79D1\u9591\u5C45", "\u4E5D\u6BB5\u76EE \u5C71\u79D1\u9591\u5C45"],
  kirareyosa: ["\u5207\u3089\u308C\u4E0E\u4E09"]
};
var record2 = (x) => !!x && typeof x === "object" && !Array.isArray(x);
var nonempty3 = (x) => typeof x === "string" && !!x.trim();
var hash = (x) => typeof x === "string" && /^[a-f0-9]{64}$/.test(x);
function validDate(x) {
  return typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x + "T00:00:00Z")) && (/* @__PURE__ */ new Date(x + "T00:00:00Z")).toISOString().slice(0, 10) === x;
}
function evidence2(x) {
  return record2(x) && nonempty3(x.reference) && hash(x.sha256) && nonempty3(x.excerpt);
}
function reviewedText(p2) {
  if (p2.editorial) return instagramEditorialText({ ...p2, imageSha256: p2.imageSha256 });
  return p2.kind === "portrait" ? `\u300E${p2.playName}\u300F\u306E\u767B\u5834\u4EBA\u7269\u3001${p2.characterName}\u3002
${p2.copy}` : `\u300E${p2.playName}\u300F\u306E\u821E\u53F0\u304B\u3089\u3002
${p2.copy}`;
}
function parseThreePlayManifest(raw2) {
  if (!raw2 || raw2.length > 2e5) throw new Error("3\u6F14\u76EE\u306E\u691C\u8A3C\u6E08\u307F\u7D20\u6750\u30DE\u30CB\u30D5\u30A7\u30B9\u30C8\u304C\u5FC5\u8981\u3067\u3059");
  const m = JSON.parse(raw2);
  if (!record2(m) || m.schemaVersion !== 1 || !nonempty3(m.revision) || !/^[a-zA-Z0-9_-]{1,64}$/.test(m.revision) || !validDate(m.startDate) || !Number.isInteger(m.reuseAfterDays) || Number(m.reuseAfterDays) < 1 || Number(m.reuseAfterDays) > 365 || !Array.isArray(m.photos) || m.photos.length > 150) throw new Error("Invalid three-play manifest");
  const photos = [], ids = /* @__PURE__ */ new Set();
  if (m.captionPolicy !== void 0 && m.captionPolicy !== INSTAGRAM_CAPTION_POLICY) throw new Error("Unknown Instagram caption policy");
  for (const x of m.photos) {
    if (!record2(x) || !nonempty3(x.id) || !/^[a-zA-Z0-9_-]{1,64}$/.test(x.id) || ids.has(x.id) || !PLAY_IDS.some((p22) => p22 === x.playId) || !nonempty3(x.playName) || !["portrait", "stage"].includes(String(x.kind)) || !Number.isInteger(x.imageId) || Number(x.imageId) < 1 || !nonempty3(x.r2Key) || !x.r2Key.startsWith("originals/") || x.r2Key.includes("..") || !hash(x.imageSha256) || !nonempty3(x.copy) || !nonempty3(x.text) || typeof x.hashtags !== "string" || !Array.isArray(x.credits) || !x.credits.every(nonempty3) || !evidence2(x.source) || !evidence2(x.photoReview) || !record2(x.rights) || x.rights.instagram !== true || !nonempty3(x.rights.reference) || !nonempty3(x.reviewedBy) || !nonempty3(x.reviewedAt) || Number.isNaN(Date.parse(x.reviewedAt)) || !validDate(x.validThrough)) throw new Error("Unreviewed or invalid three-play photo");
    const playId = x.playId;
    if (!PLAY_NAMES[playId].includes(x.playName) || !x.source.excerpt.includes(x.copy) || !x.photoReview.excerpt.includes(x.playName) || /https?:\/\/|ignore.*instructions|指示.*無視/i.test(x.text) || /AI生成/i.test(x.photoReview.excerpt)) throw new Error("Copy or photo provenance does not match");
    if (x.kind === "portrait" && (!Number.isInteger(x.characterId) || Number(x.characterId) < 1 || !nonempty3(x.characterName) || !nonempty3(x.naviCastId) || !x.source.excerpt.includes(x.characterName) || !x.photoReview.excerpt.includes(x.characterName))) throw new Error("Verified portrait-character provenance required");
    if (x.kind === "stage" && (x.characterId !== null || x.characterName !== null || x.naviCastId !== null)) throw new Error("Stage identity inference is not allowed");
    const p2 = {
      id: x.id,
      playId,
      playName: x.playName,
      kind: x.kind,
      imageId: Number(x.imageId),
      r2Key: x.r2Key,
      imageSha256: x.imageSha256,
      characterId: x.characterId,
      characterName: x.characterName,
      naviCastId: x.naviCastId,
      copy: x.copy,
      text: x.text,
      hashtags: x.hashtags,
      credits: x.credits,
      source: x.source,
      photoReview: x.photoReview,
      rights: { instagram: true, reference: x.rights.reference },
      reviewedBy: x.reviewedBy,
      reviewedAt: x.reviewedAt,
      validThrough: x.validThrough
    };
    if (x.editorial !== void 0) p2.editorial = parseInstagramEditorial(x.editorial, p2);
    if (x.text !== reviewedText(p2)) throw new Error("Copy must be the exact reviewed source template");
    ids.add(x.id);
    photos.push(p2);
  }
  return {
    schemaVersion: 1,
    revision: m.revision,
    startDate: m.startDate,
    reuseAfterDays: Number(m.reuseAfterDays),
    photos,
    ...m.captionPolicy ? { captionPolicy: INSTAGRAM_CAPTION_POLICY } : {}
  };
}
function missingEditorial(m, p2) {
  return m.captionPolicy === INSTAGRAM_CAPTION_POLICY && !p2.editorial;
}
function threePlayMode(s, date) {
  if (!s.ig_editorial_mode) return { state: "off" };
  if (s.ig_editorial_mode !== THREE_PLAY_MODE) return { state: "invalid", error: "Unknown Instagram editorial mode" };
  try {
    const manifest = parseThreePlayManifest(s.ig_three_plays_manifest_v1);
    return date < manifest.startDate ? { state: "waiting" } : { state: "active", manifest };
  } catch (e) {
    return { state: "invalid", error: e.message };
  }
}
function threePlayOwnsDate(s, date) {
  const mode = threePlayMode(s, date);
  return mode.state === "active" || mode.state === "invalid";
}
async function readThreePlaySettings(env) {
  const { results } = await env.DB.prepare("SELECT key,value FROM settings WHERE key IN ('ig_editorial_mode','ig_three_plays_manifest_v1','ig_three_plays_evidence_v1')").all();
  return Object.fromEntries(results.map((x) => [x.key, x.value]));
}
function playForDate(m, date) {
  if (!validDate(date) || date < m.startDate) return null;
  return PLAY_IDS[Math.floor((Date.parse(date + "T00:00:00Z") - Date.parse(m.startDate + "T00:00:00Z")) / 864e5) % 3];
}
function photoTheme(m, date, slot, p2) {
  return `ig3:${m.revision}:${date}:${slot}:${p2.id}`;
}
async function checkedPhoto(env, p2) {
  const image = await env.DB.prepare(`SELECT i.*,c.name character_name,c.navi_enmoku_id,c.navi_cast_id FROM images i
    LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?`).bind(p2.imageId).first();
  if (!image || image.verified !== 1 || image.privacy_excluded !== 0 || image.r2_key !== p2.r2Key || image.play_name !== p2.playName || /AI生成/i.test(image.scene_type || "")) return "\u5199\u771F\u306E\u691C\u54C1\u30FB\u6F14\u76EE\u30FB\u5143\u753B\u50CF\u5BFE\u5FDC\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
  if (p2.kind === "portrait" && (image.character_id !== p2.characterId || image.character_name !== p2.characterName || image.navi_enmoku_id !== p2.playId || image.navi_cast_id !== p2.naviCastId || !/ポートレート|portrait|ブロマイド/i.test(image.scene_type || ""))) return "\u5199\u771F\u3068\u4EBA\u7269\u7D39\u4ECB\u306E\u5BFE\u5FDC\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093";
  if (p2.kind === "stage" && (!/舞台|stage/i.test(image.scene_type || "") || /ポートレート|portrait|ブロマイド/i.test(image.scene_type || ""))) return "\u691C\u8A3C\u6E08\u307F\u306E\u821E\u53F0\u5199\u771F\u304C\u5FC5\u8981\u3067\u3059";
  const object2 = await env.R2.get(p2.r2Key);
  if (!object2 || object2.size < 1 || object2.size > 2e7) {
    await object2?.body.cancel();
    return "\u4F7F\u7528\u53EF\u80FD\u306A\u5143\u5199\u771F\u304C\u3042\u308A\u307E\u305B\u3093";
  }
  const digest = await crypto.subtle.digest("SHA-256", await object2.arrayBuffer());
  const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return actual === p2.imageSha256 ? null : "\u5143\u5199\u771F\u304C\u691C\u8A3C\u5F8C\u306B\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u3059";
}
function photoCaption(s, p2) {
  return creditedCaption(p2.text, p2.hashtags, [...p2.credits, ...requiredImageCredits(s, [p2.imageId])]);
}
async function guardThreePlayPublication(env, s, p2, now) {
  if (heldEditorialPost(p2.id) || await heldPostMaterial(env, s, p2)) return { managed: true, error: "\u4EBA\u7269\u30FB\u5834\u9762\u6839\u62E0\u304C\u672A\u78BA\u8A8D\u306E\u4FDD\u7559\u6295\u7A3F\u3067\u3059" };
  if (!threePlayOwnsDate(s, now.date) && !threePlayOwnsDate(s, p2.post_date) && !String(p2.theme || "").startsWith("ig3:")) return { managed: false };
  const mode = threePlayMode(s, now.date);
  if (mode.state !== "active") return { managed: true, error: mode.state === "invalid" ? mode.error : "3\u6F14\u76EE\u30E2\u30FC\u30C9\u306E\u958B\u59CB\u65E5\u307E\u3067\u516C\u958B\u3057\u307E\u305B\u3093" };
  if (!now.slot || p2.post_date !== now.date || p2.publish_slot !== now.slot || p2.auto_publish !== 1 || p2.content_type !== "photo" || p2.status !== "approved") return { managed: true, error: "3\u6F14\u76EE\u306E\u5F53\u65E508\u6642\u30FB19\u6642\u306E\u627F\u8A8D\u6E08\u307F\u5199\u771F\u67A0\u3060\u3051\u516C\u958B\u3067\u304D\u307E\u3059" };
  const m = mode.manifest, play = playForDate(m, now.date), kind = now.slot === "morning" ? "portrait" : "stage";
  const photo = m.photos.find((x) => x.playId === play && x.kind === kind && photoTheme(m, now.date, now.slot, x) === p2.theme);
  if (!photo || now.date > photo.validThrough || p2.image_id !== photo.imageId || p2.character_id !== photo.characterId || p2.instagram_text !== photo.text || (p2.instagram_hashtags || "") !== photo.hashtags) return { managed: true, error: "\u6F14\u76EE\u30FB\u753B\u50CF\u30FB\u672C\u6587\u30FB\u627F\u8A8D\u7248\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002\u65E7\u5019\u88DC\u306F\u516C\u958B\u3057\u307E\u305B\u3093" };
  const evidenceError = editorialEvidenceError(s, m.revision, photo, p2.id);
  if (evidenceError) return { managed: true, error: evidenceError };
  if (missingEditorial(m, photo)) return { managed: true, error: "\u671D\u5915\u306E\u627F\u8A8D\u6E08\u307F\u6587\u7AE0\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u3053\u306E\u67A0\u306F\u516C\u958B\u3057\u307E\u305B\u3093" };
  const caption = photoCaption(s, photo);
  if (p2.publish_container_id && (p2.published_media_key !== photo.r2Key || p2.published_caption !== caption)) return { managed: true, error: "\u4F5C\u6210\u6E08\u307F\u30B3\u30F3\u30C6\u30CA\u306E\u753B\u50CF\u30FB\u672C\u6587\u304C\u627F\u8A8D\u7248\u3068\u4E00\u81F4\u3057\u307E\u305B\u3093" };
  const error = await checkedPhoto(env, photo);
  return { managed: true, ...error ? { error } : { caption, photo } };
}
async function heldPostMaterial(env, s, p2) {
  const mode = threePlayMode(s, p2.post_date);
  if (mode.state === "active") {
    const reviewed = mode.manifest.photos.find((x) => isReviewedOtomi239Candidate(x) && x.imageId === p2.image_id && photoTheme(mode.manifest, p2.post_date, p2.publish_slot, x) === p2.theme);
    if (reviewed && !editorialEvidenceError(s, mode.manifest.revision, reviewed, p2.id)) return false;
  }
  if (heldEditorialMaterial({ imageId: p2.image_id, r2Key: p2.r2_key })) return true;
  if (!p2.image_id) return false;
  const image = await env.DB.prepare("SELECT r2_key FROM images WHERE id=?").bind(p2.image_id).first();
  if (heldEditorialMaterial({ r2Key: image?.r2_key })) return true;
  try {
    const raw2 = JSON.parse(s.ig_three_plays_manifest_v1 || "");
    if (Array.isArray(raw2.photos) && raw2.photos.some((x) => x.imageId === p2.image_id && heldEditorialMaterial(x))) return true;
  } catch {
  }
  return false;
}
async function guardThreePlayApproval(env, p2) {
  const s = await readThreePlaySettings(env);
  if (heldEditorialPost(p2.id) || await heldPostMaterial(env, s, p2)) return { managed: true, error: "\u4EBA\u7269\u30FB\u5834\u9762\u6839\u62E0\u304C\u672A\u78BA\u8A8D\u306E\u4FDD\u7559\u6295\u7A3F\u3067\u3059", settings: s };
  if (!String(p2.theme || "").startsWith("ig3:") && !threePlayOwnsDate(s, p2.post_date)) return { managed: false, settings: s };
  const mode = threePlayMode(s, p2.post_date);
  if (mode.state !== "active") return { managed: true, error: "3\u6F14\u76EE\u306E\u6709\u52B9\u306A\u627F\u8A8D\u7248\u304C\u3042\u308A\u307E\u305B\u3093", settings: s };
  const m = mode.manifest, slot = p2.publish_slot;
  const photo = m.photos.find((x) => photoTheme(m, p2.post_date, slot, x) === p2.theme);
  if (!photo || photo.playId !== playForDate(m, p2.post_date) || photo.kind !== (slot === "morning" ? "portrait" : "stage") || p2.post_date > photo.validThrough || p2.image_id !== photo.imageId || p2.character_id !== photo.characterId || p2.instagram_text !== photo.text || (p2.instagram_hashtags || "") !== photo.hashtags || p2.content_type !== "photo")
    return { managed: true, error: "\u6F14\u76EE\u30FB\u753B\u50CF\u30FB\u672C\u6587\u30FB\u627F\u8A8D\u7248\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093", settings: s };
  const error = editorialEvidenceError(s, m.revision, photo, p2.id) || (missingEditorial(m, photo) ? "\u671D\u5915\u306E\u627F\u8A8D\u6E08\u307F\u6587\u7AE0\u304C\u3042\u308A\u307E\u305B\u3093" : null) || await checkedPhoto(env, photo);
  return { managed: true, ...error ? { error } : {}, settings: s };
}
async function prepareThreePlaySlot(env, s, date, slot) {
  const mode = threePlayMode(s, date);
  if (mode.state !== "active") return { reason: mode.state === "invalid" ? mode.error : "3\u6F14\u76EE\u30E2\u30FC\u30C9\u5BFE\u8C61\u5916" };
  const m = mode.manifest;
  const occupied = await env.DB.prepare(`SELECT id,theme,post_date,publish_slot FROM posts WHERE (post_date=? AND publish_slot=? AND
    (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain'))) OR
    (instagram_posted=0 AND publish_state IN ('publishing','uncertain')) ORDER BY instagram_posted ASC,id LIMIT 1`).bind(date, slot).first();
  if (occupied) {
    const sameApprovedSlot = occupied.post_date === date && occupied.publish_slot === slot && m.photos.some((photo) => photo.playId === playForDate(m, date) && photo.kind === (slot === "morning" ? "portrait" : "stage") && photoTheme(m, date, slot, photo) === occupied.theme && !missingEditorial(m, photo) && !editorialEvidenceError(s, m.revision, photo, occupied.id));
    return { ...sameApprovedSlot ? { postId: occupied.id } : {}, reason: "\u516C\u958B\u6E08\u307F\u30FB\u51E6\u7406\u4E2D\u30FB\u7D50\u679C\u4E0D\u660E\u306E\u67A0\u3092\u4FDD\u6301\u3057\u307E\u3059" };
  }
  const candidates = m.photos.filter((x) => x.playId === playForDate(m, date) && x.kind === (slot === "morning" ? "portrait" : "stage") && date <= x.validThrough);
  const index = Math.floor((Date.parse(date + "T00:00:00Z") - Date.parse(m.startDate + "T00:00:00Z")) / (3 * 864e5));
  for (let offset = 0; offset < candidates.length; offset++) {
    const photo = candidates[(index + offset) % candidates.length], theme = photoTheme(m, date, slot, photo);
    if (editorialEvidenceError(s, m.revision, photo) || missingEditorial(m, photo)) continue;
    const existing = await env.DB.prepare("SELECT id FROM posts WHERE theme=? ORDER BY id LIMIT 1").bind(theme).first();
    if (existing) return heldEditorialPost(existing.id) ? { reason: "\u6839\u62E0\u672A\u78BA\u8A8D\u306E\u4FDD\u7559\u6295\u7A3F\u3067\u3059" } : { postId: existing.id, reason: "\u6E96\u5099\u6E08\u307F\u306E\u627F\u8A8D\u7D20\u6750" };
    const used = await env.DB.prepare("SELECT id FROM posts WHERE image_id=? AND instagram_posted=1 AND post_date BETWEEN date(?,'-'||?||' days') AND ? LIMIT 1").bind(photo.imageId, date, m.reuseAfterDays - 1, date).first();
    if (used || await checkedPhoto(env, photo)) continue;
    await env.DB.prepare(`INSERT INTO posts(post_date,day_of_week,theme,image_id,character_id,instagram_text,instagram_hashtags,status,auto_publish,content_type,publish_slot)
      SELECT ?,?,?,?,?,?,?,'approved',1,'photo',? WHERE NOT EXISTS(SELECT 1 FROM posts WHERE theme=?)
      AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')))
      AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('publishing','uncertain'))
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_editorial_mode' AND value=?)
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_manifest_v1' AND value=?)
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_evidence_v1' AND value=?)`).bind(
      date,
      (/* @__PURE__ */ new Date(date + "T00:00:00Z")).getUTCDay(),
      theme,
      photo.imageId,
      photo.characterId,
      photo.text,
      photo.hashtags,
      slot,
      theme,
      date,
      slot,
      s.ig_editorial_mode,
      s.ig_three_plays_manifest_v1,
      s[EDITORIAL_EVIDENCE_KEY]
    ).run();
    const saved = await env.DB.prepare("SELECT id FROM posts WHERE theme=? ORDER BY id LIMIT 1").bind(theme).first();
    return { ...saved ? { postId: saved.id } : {}, reason: saved ? "\u691C\u8A3C\u6E08\u307F\u7D20\u6750\u3092\u6E96\u5099" : "\u67A0\u3092\u4ED6\u306E\u51E6\u7406\u304C\u53D6\u5F97\u3057\u307E\u3057\u305F" };
  }
  return { reason: "\u540C\u6F14\u76EE\u306E\u691C\u8A3C\u6E08\u307F\u7D20\u6750\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u3053\u306E\u67A0\u306F\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3059" };
}
var MORNING_FEED_HOUR = 8;
function eveningFeedEnabled(s, date) {
  if (threePlayOwnsDate(s, date)) return true;
  return !!s.evening_feed_start_date && !!s.evening_feed_end_date && date >= s.evening_feed_start_date && date <= s.evening_feed_end_date;
}
function jstClock(at = /* @__PURE__ */ new Date()) {
  const d = new Date(at.getTime() + 9 * 36e5);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}
function currentFeedSlot(s, at = /* @__PURE__ */ new Date()) {
  const { date, hour } = jstClock(at);
  if (threePlayOwnsDate(s, date)) {
    if (threePlayMode(s, date).state !== "active") return null;
    return hour === MORNING_FEED_HOUR ? "morning" : hour === 19 ? "evening" : null;
  }
  if (hour === MORNING_FEED_HOUR) return "morning";
  if (hour >= 19 && hour < 22 && eveningFeedEnabled(s, date)) return "evening";
  return null;
}
function doneKey(date, slot) {
  return `autopost_done:${date}:${slot}`;
}
function jstDate() {
  return new Date(Date.now() + 324e5).toISOString().slice(0, 10);
}
function shiftDate(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
}
async function settings(env) {
  const { results } = await env.DB.prepare("SELECT key,value FROM settings").all();
  return Object.fromEntries(results.map((x) => [x.key, x.value]));
}
function publicBase(s) {
  return s.worker_base_url || "https://kabuki-post-365.kerakabuki.workers.dev";
}
function assetUrl(base, key) {
  return `${base}/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}
function captionFor(text, tags, credits = []) {
  return creditedCaption(text, tags, credits);
}
async function sourceHash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeManifest(env, postId) {
  const s = await settings(env);
  if (!s.reel_bgm_key) return null;
  const p2 = await env.DB.prepare(`SELECT p.*,i.r2_key,i.verified,i.privacy_excluded,i.play_name,i.scene_type
    FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(postId).first();
  if (p2 && threePlayOwnsDate(s, p2.post_date)) return null;
  if (!p2 || !p2.image_id || !p2.r2_key || !p2.verified || p2.privacy_excluded || !p2.instagram_text) return null;
  const photos = [{ id: p2.image_id, key: p2.r2_key, caption: p2.play_name || "\u6C17\u826F\u6B4C\u821E\u4F0E" }];
  if (p2.play_name) {
    const related = await env.DB.prepare(`SELECT id,r2_key,play_name FROM images
      WHERE verified=1 AND privacy_excluded=0 AND play_name=? AND id<>?
        AND scene_type=COALESCE(?,scene_type) AND scene_type NOT LIKE '%AI\u751F\u6210%'
      ORDER BY usage_count,id LIMIT 2`).bind(p2.play_name, p2.image_id, p2.scene_type).all();
    for (const i of related.results) photos.push({ id: i.id, key: i.r2_key, caption: i.play_name });
  }
  return {
    version: p2.post_date >= "2026-09-16" ? 4 : 2,
    postId,
    date: p2.post_date,
    photos,
    bgmKey: s.reel_bgm_key,
    title: p2.play_name || "\u6C17\u826F\u6B4C\u821E\u4F0E",
    caption: captionFor(p2.instagram_text, p2.instagram_hashtags, requiredImageCredits(s, photos.map((photo) => photo.id))),
    duration: photos.length === 1 ? 12 : photos.length === 2 ? 16 : 20
  };
}
async function prepareReels(env) {
  const s = await settings(env);
  if (s.reels_enabled !== "1" || !s.reel_bgm_key) return { queued: 0 };
  const today = jstDate(), through = shiftDate(today, 7);
  const { results } = await env.DB.prepare(`SELECT id,post_date FROM posts WHERE post_date BETWEEN ? AND ?
    AND post_date>=? AND auto_publish=1 AND instagram_posted=0
    AND status IN ('draft','approved') AND publish_state IN ('idle','failed')
    ORDER BY post_date,id`).bind(today, through, s.reels_start_date || today).all();
  let queued = 0;
  for (const p2 of results) {
    if (threePlayOwnsDate(s, p2.post_date)) continue;
    if (isPhotoOnlyDate(s, p2.post_date)) continue;
    const manifest = await makeManifest(env, p2.id);
    if (!manifest) continue;
    const hash2 = await sourceHash(manifest);
    const r = await env.DB.prepare(`INSERT OR IGNORE INTO reel_jobs(post_id,source_hash,manifest_json)
      VALUES(?,?,?)`).bind(p2.id, hash2, JSON.stringify(manifest)).run();
    await env.DB.prepare(`UPDATE posts SET content_type='reel' WHERE id=? AND instagram_posted=0`).bind(p2.id).run();
    queued += r.meta.changes;
  }
  return { queued };
}
async function currentJob(env, postId) {
  const manifest = await makeManifest(env, postId);
  if (!manifest) return null;
  return env.DB.prepare("SELECT * FROM reel_jobs WHERE post_id=? AND source_hash=?").bind(postId, await sourceHash(manifest)).first();
}
async function claimReel(env) {
  await prepareReels(env);
  const s = await settings(env);
  if (s.reels_enabled !== "1") return null;
  const candidates = await env.DB.prepare(`SELECT r.* FROM reel_jobs r JOIN posts p ON p.id=r.post_id
    WHERE p.instagram_posted=0 AND p.auto_publish=1 AND p.post_date>=?
      AND p.status IN ('draft','approved') AND r.attempts<3
      AND (r.status IN ('queued','failed') OR (r.status='rendering' AND r.lease_until<datetime('now')))
    ORDER BY p.post_date,r.id DESC LIMIT 20`).bind(jstDate()).all();
  for (const job of candidates.results) {
    const m = await makeManifest(env, job.post_id);
    if (!m || isPhotoOnlyDate(s, m.date) || await sourceHash(m) !== job.source_hash) continue;
    const token = crypto.randomUUID();
    const row32 = await env.DB.prepare(`UPDATE reel_jobs SET status='rendering',lease_token=?,
      lease_until=datetime('now','+15 minutes'),attempts=attempts+1,updated_at=datetime('now'),error=NULL
      WHERE id=? AND attempts<3 AND (status IN ('queued','failed') OR (status='rendering' AND lease_until<datetime('now')))
      RETURNING *`).bind(token, job.id).first();
    if (!row32) continue;
    return { ...row32, manifest: m, base_url: publicBase(s) };
  }
  return null;
}
async function ensureCrossposts(env, postId) {
  await env.DB.batch(["facebook", "x"].map((platform) => env.DB.prepare(`INSERT OR IGNORE INTO crossposts(post_id,platform)
    SELECT id,? FROM posts WHERE id=? AND instagram_posted=1 AND ig_media_id IS NOT NULL
      AND post_date>=COALESCE((SELECT value FROM settings WHERE key='crosspost_start_date'),'9999-01-01')`).bind(platform, postId)));
}
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var splitPath = (path) => {
  const paths22 = path.split("/");
  if (paths22[0] === "") {
    paths22.shift();
  }
  return paths22;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths22 = splitPath(path);
  return replaceGroupMarks(paths22, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths22, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths22.length - 1; j >= 0; j--) {
      if (paths22[j].includes(mark)) {
        paths22[j] = paths22[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths22;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status32) => {
    this.#status = status32;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status32 = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status: status32, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object2, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object2),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status32) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status32 ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p2 of [path].flat()) {
        this.#path = p2;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input22, requestInit, Env, executionCtx) => {
    if (input22 instanceof Request) {
      return this.fetch(requestInit ? new Request(input22, requestInit) : input22, Env, executionCtx);
    }
    input22 = input22.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input22) ? input22 : `http://localhost${mergePath("/", input22)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p2) => {
          handlerMap[method][p2] = [...handlerMap[METHOD_NAME_ALL][p2]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p2) => {
            re.test(p2) && middleware[m][p2].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p2) => re.test(p2) && routes[m][p2].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths22 = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths22.length; i < len; i++) {
      const path2 = paths22[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p2 = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p2, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p2;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p2 = 0; p2 < len; p2++) {
                partOffsets[p2] = offset;
                offset += parts[p2].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};
var charactersRoutes = new Hono2();
charactersRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM characters ORDER BY related_play, name"
  ).all();
  return c.json(results);
});
charactersRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row32 = await c.env.DB.prepare("SELECT * FROM characters WHERE id = ?").bind(id).first();
  if (!row32) return c.json({ error: "Not found" }, 404);
  return c.json(row32);
});
charactersRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id } = body;
  const result = await c.env.DB.prepare(
    `INSERT INTO characters (name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, name_reading || "", aliases, related_play || "", description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url || null, navi_enmoku_id || null, navi_cast_id || null).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});
charactersRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url, navi_enmoku_id, navi_cast_id } = body;
  await c.env.DB.prepare(
    `UPDATE characters SET name=?, name_reading=?, aliases=?, related_play=?, description=?, personality_tags=?, season_tags=?, related_characters=?, kabuki_navi_url=?, navi_image_url=?, navi_enmoku_id=?, navi_cast_id=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url, navi_image_url || null, navi_enmoku_id || null, navi_cast_id || null, id).run();
  return c.json({ success: true });
});
charactersRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
charactersRoutes.post("/import", async (c) => {
  const characters = await c.req.json();
  const batchSize = 50;
  let imported = 0;
  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    const stmts = batch.map(
      (ch) => c.env.DB.prepare(
        `INSERT OR IGNORE INTO characters (name, name_reading, aliases, related_play, description, personality_tags, season_tags, related_characters, kabuki_navi_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        ch.name,
        ch.name_reading || "",
        ch.aliases || null,
        ch.related_play || "",
        ch.description || null,
        ch.personality_tags || null,
        ch.season_tags || null,
        ch.related_characters || null,
        ch.kabuki_navi_url || null
      )
    );
    await c.env.DB.batch(stmts);
    imported += batch.length;
  }
  return c.json({ imported });
});
function logGeminiUsage(tag, model, usage) {
  if (!usage) return;
  const n = (v) => v === void 0 ? "?" : String(v);
  console.log(
    `[gemini-usage] ${tag} model=${model} prompt=${n(usage.promptTokenCount)} output=${n(usage.candidatesTokenCount)} thinking=${n(usage.thoughtsTokenCount ?? 0)} total=${n(usage.totalTokenCount)}`
  );
}
async function analyzeImageWithVision(env, imageBase64, mimeType, characters) {
  const characterList = characters.map((c) => `- ${c.name}\uFF08${c.name_reading}\uFF09: \u6F14\u76EE\u300C${c.related_play}\u300D${c.aliases ? `\u3001\u5225\u540D: ${c.aliases}` : ""}`).join("\n");
  const systemPrompt = `\u3042\u306A\u305F\u306F\u6B4C\u821E\u4F0E\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u6B4C\u821E\u4F0E\u306B\u95A2\u9023\u3059\u308B\u753B\u50CF\u3092\u5206\u6790\u3057\u3001\u30E1\u30BF\u30C7\u30FC\u30BF\u3092\u69CB\u9020\u5316\u3057\u3066\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u6B4C\u821E\u4F0E\u306B\u95A2\u9023\u3057\u306A\u3044\u753B\u50CF\u306E\u5834\u5408\u3067\u3082\u3001\u898B\u3048\u308B\u5185\u5BB9\u3092\u305D\u306E\u307E\u307E\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  const userPrompt = `\u3053\u306E\u753B\u50CF\u3092\u5206\u6790\u3057\u3066\u3001\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u30E1\u30BF\u30C7\u30FC\u30BF\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u767B\u9332\u6E08\u307F\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u4E00\u89A7\u3011
${characterList || "\uFF08\u306A\u3057\uFF09"}

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
{
  "play_name": "\u753B\u50CF\u306B\u95A2\u9023\u3059\u308B\u6B4C\u821E\u4F0E\u306E\u6F14\u76EE\u540D\uFF08\u4E0D\u660E\u306A\u3089\u7A7A\u6587\u5B57\uFF09",
  "scene_type": "\u5834\u9762\u30BF\u30A4\u30D7\uFF08\u4F8B: \u898B\u5F97, \u7ACB\u56DE\u308A, \u82B1\u9053, \u821E\u8E0A, \u7FA4\u8846, \u30DD\u30FC\u30C8\u30EC\u30FC\u30C8, \u821E\u53F0\u5168\u666F, \u7A3D\u53E4\u98A8\u666F, \u8863\u88F3, \u5C0F\u9053\u5177 \u306A\u3069\uFF09",
  "visual_features": "\u753B\u50CF\u306E\u8996\u899A\u7684\u7279\u5FB4\u3092\u30AB\u30F3\u30DE\u533A\u5207\u308A\u3067\uFF08\u4F8B: \u9688\u53D6\u308A,\u8D64\u3044\u8863\u88F3,\u5200,\u685C\u306E\u80CC\u666F\uFF09",
  "season_tag": "\u5B63\u7BC0\u30BF\u30B0\uFF08\u6625, \u590F, \u79CB, \u51AC, \u901A\u5E74 \u306E\u3044\u305A\u308C\u304B\uFF09",
  "character_match": "\u4E0A\u8A18\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u4E00\u89A7\u306E\u4E2D\u3067\u6700\u3082\u4E00\u81F4\u3059\u308B\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u540D\uFF08\u4E00\u81F4\u306A\u3057\u306A\u3089null\uFF09",
  "description": "\u753B\u50CF\u306E\u8AAC\u660E\uFF0820\u6587\u5B57\u4EE5\u5185\uFF09"
}

\u7C21\u6F54\u306B\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u5404\u30D5\u30A3\u30FC\u30EB\u30C9\u306F\u77ED\u304F\u3002`;
  const model = env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64
              }
            },
            { text: userPrompt }
          ]
        }
      ],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        topP: 0.8,
        responseMimeType: "application/json"
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Vision API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  logGeminiUsage("vision", model, data.usageMetadata);
  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    const reason = candidate?.finishReason || "unknown";
    throw new Error(`Gemini returned no content (finishReason: ${reason})`);
  }
  const text = candidate.content.parts.map((p2) => p2.text || "").join("");
  if (!text.trim()) {
    throw new Error("Gemini returned empty text");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`Failed to parse Gemini Vision response: ${text.substring(0, 200)}`);
      }
    }
  }
  let characterId = null;
  const matchName = parsed.character_match || null;
  if (matchName) {
    const matched = characters.find(
      (c) => c.name === matchName || c.name_reading === matchName || c.aliases?.includes(matchName)
    );
    if (matched) characterId = matched.id;
  }
  return {
    play_name: parsed.play_name || "",
    scene_type: parsed.scene_type || "",
    visual_features: parsed.visual_features || "",
    season_tag: parsed.season_tag || "\u901A\u5E74",
    character_match: matchName,
    character_id: characterId,
    description: parsed.description || ""
  };
}
async function generateImage(env, prompt, referenceImageBase64, referenceMimeType) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not configured" };
  }
  const parts = [];
  if (referenceImageBase64 && referenceMimeType) {
    parts.push({
      inlineData: {
        mimeType: referenceMimeType,
        data: referenceImageBase64
      }
    });
  }
  parts.push({ text: prompt });
  const model = env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1
    }
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Gemini image gen error (attempt ${attempt + 1}):`, res.status, errBody);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 2e3));
          continue;
        }
        return { success: false, error: `Gemini API error: ${res.status}` };
      }
      const data = await res.json();
      logGeminiUsage("image", model, data.usageMetadata);
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        return { success: false, error: "No candidates in response" };
      }
      const responseParts = candidates[0].content?.parts || [];
      for (const part of responseParts) {
        if (part.inlineData) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png"
          };
        }
      }
      return { success: false, error: "No image in response (text-only response returned)" };
    } catch (err) {
      console.error(`Gemini image gen exception (attempt ${attempt + 1}):`, err);
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 2e3));
        continue;
      }
      return { success: false, error: err.message || "Unknown error" };
    }
  }
  return { success: false, error: "All attempts failed" };
}
var CTA_TEMPLATES = {
  A: {
    instagram: "\u6B4C\u821E\u4F0E\u306E\u3053\u3068\u3001\u3082\u3063\u3068\u77E5\u308A\u305F\u304F\u306A\u3063\u305F\u3089\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u3078\u{1F3AD}",
    x: "\u6B4C\u821E\u4F0E\u306E\u3053\u3068\u3001\u3082\u3063\u3068\u77E5\u308A\u305F\u304F\u306A\u3063\u305F\u3089\u2192 {url} \u{1F3AD}",
    facebook: "\u6B4C\u821E\u4F0E\u306E\u3053\u3068\u3001\u3082\u3063\u3068\u77E5\u308A\u305F\u304F\u306A\u3063\u305F\u3089\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u3078\u{1F3AD}"
  },
  B: {
    instagram: "\u4ECA\u6708\u306E\u516C\u6F14\u60C5\u5831\u3082\u307E\u3068\u3081\u3066\u3044\u307E\u3059\u2192\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u{1F3AD}",
    x: "\u4ECA\u6708\u306E\u516C\u6F14\u60C5\u5831\u3082\u307E\u3068\u3081\u3066\u3044\u307E\u3059\u2192 {url} \u{1F3AD}",
    facebook: "\u4ECA\u6708\u306E\u516C\u6F14\u60C5\u5831\u3082\u307E\u3068\u3081\u3066\u3044\u307E\u3059\u2192\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u{1F3AD}"
  },
  C: {
    instagram: "\u4E00\u7DD2\u306B\u6B4C\u821E\u4F0E\u306E\u4E16\u754C\u3092\u697D\u3057\u307F\u307E\u3057\u3087\u3046\u{1F3AD} \u30EA\u30F3\u30AF\u306F\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304B\u3089",
    x: "\u4E00\u7DD2\u306B\u6B4C\u821E\u4F0E\u306E\u4E16\u754C\u3092\u697D\u3057\u307F\u307E\u3057\u3087\u3046\u{1F3AD} {url}",
    facebook: "\u4E00\u7DD2\u306B\u6B4C\u821E\u4F0E\u306E\u4E16\u754C\u3092\u697D\u3057\u307F\u307E\u3057\u3087\u3046\u{1F3AD} \u30EA\u30F3\u30AF\u306F\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304B\u3089"
  },
  D: {
    instagram: "",
    x: "",
    facebook: ""
  },
  E: {
    instagram: "",
    x: "",
    facebook: ""
  },
  F: {
    instagram: "\u6C17\u306B\u306A\u3063\u305F\u65B9\u306F\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u3069\u3046\u305E\u{1F3AD}",
    x: "\u6C17\u306B\u306A\u3063\u305F\u65B9\u306F\u3053\u3061\u3089\u304B\u3089\u3069\u3046\u305E\u{1F3AD} {url}",
    facebook: "\u6C17\u306B\u306A\u3063\u305F\u65B9\u306F\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u3069\u3046\u305E\u{1F3AD}"
  },
  N: {
    instagram: "",
    x: "",
    facebook: ""
  }
};
function buildCtaText(ctaType, settings2, platform) {
  const type = ctaType.toUpperCase();
  const templates = CTA_TEMPLATES[type] || CTA_TEMPLATES.A;
  const baseUrl = settings2.kabuki_navi_base_url || "https://kabukiplus.com";
  const platformUrls = {
    instagram: baseUrl,
    // Instagram doesn't support links in posts
    x: settings2.sns_x ? baseUrl : baseUrl,
    facebook: settings2.sns_facebook ? baseUrl : baseUrl
  };
  if (platform) {
    const url = platformUrls[platform] || baseUrl;
    return templates[platform]?.replace("{url}", url) || "";
  }
  return Object.values(templates).filter(Boolean).map((t) => t.replace("{url}", baseUrl)).join(" / ");
}
var COMPOSITION_STYLES = [
  {
    id: "discovery",
    label: "\u767A\u898B\u5148\u51FA\u3057",
    instruction: `1\u884C\u76EE\u304B\u3089\u3001\u8AAD\u8005\u304C\u77E5\u3089\u306A\u3044\u3067\u3042\u308D\u3046\u5177\u4F53\u7684\u306A\u4E8B\u5B9F\u30FB\u6C17\u3065\u304D\u3092\u66F8\u304F\u3002\u524D\u7F6E\u304D\u30FB\u3042\u3044\u3055\u3064\u30FB\u5171\u611F\u306E\u547C\u3073\u304B\u3051\u306F\u4E00\u5207\u66F8\u304B\u306A\u3044\u3002
- \u4E8B\u5B9F \u2192 \u305D\u306E\u4E8B\u5B9F\u304C\u306A\u305C\u9762\u767D\u3044\u304B \u2192 \u6700\u5F8C\u306E1\u884C\u3060\u3051\u81EA\u5206\u306E\u611F\u60F3\u3001\u306E\u9806
- \u672C\u6587\u306E\u76EE\u5B89 400\u301C600\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30672\u500B\u307E\u3067`
  },
  {
    id: "one_detail",
    label: "\u4E00\u70B9\u51DD\u8996",
    needsVisual: true,
    instruction: `\u5199\u771F\u306E\u4E2D\u306E\u7D30\u90E8\u3092\u300C\u3072\u3068\u3064\u3060\u3051\u300D\u9078\u3073\u3001\u305D\u3053\u3060\u3051\u3092\u898B\u3064\u3081\u3066\u66F8\u304F\u3002\u5168\u4F53\u306E\u8AAC\u660E\u3082\u3001\u6F14\u76EE\u306E\u89E3\u8AAC\u3082\u3057\u306A\u3044\u3002
- \u9078\u3076\u7D30\u90E8\u306F\u3010\u753B\u50CF\u306E\u7279\u5FB4\u3011\u3010\u5834\u9762\u30BF\u30A4\u30D7\u3011\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u7BC4\u56F2\u304B\u3089\u53D6\u308B\u3002\u5199\u3063\u3066\u3044\u306A\u3044\u3082\u306E\u3092\u60F3\u50CF\u3067\u63CF\u5199\u3057\u306A\u3044
- \u9078\u3093\u3060\u7D30\u90E8\uFF08\u8272\u30FB\u7DDA\u30FB\u6301\u3061\u7269\u30FB\u624B\u5143\u30FB\u8996\u7DDA\u306A\u3069\uFF09\u304B\u3089\u66F8\u304D\u51FA\u3059
- \u300C\u4ED6\u306B\u3082\u898B\u3069\u3053\u308D\u304C\u300D\u3068\u8A71\u3092\u5E83\u3052\u306A\u3044\u3002\u3072\u3068\u3064\u3067\u7D42\u308F\u308B
- \u672C\u6587\u306E\u76EE\u5B89 200\u301C350\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30671\u500B\u307E\u3067`
  },
  {
    id: "monologue",
    label: "\u5EA7\u54E1\u306E\u3072\u3068\u308A\u3054\u3068",
    instruction: `\u821E\u53F0\u3092\u4F5C\u3063\u3066\u3044\u308B\u5074\u306E\u4EBA\u9593\u306E\u5B9F\u611F\u3092\u3001\u65E5\u8A18\u306E\u3088\u3046\u306B\u66F8\u304F\u3002\u60C5\u5831\u3092\u5C4A\u3051\u308B\u6587\u7AE0\u306B\u3057\u306A\u3044\u3002
- \u77ED\u3044\u6587\u3092\u91CD\u306D\u308B\u3002\u6587\u672B\u3092\u63C3\u3048\u306A\u3044\uFF08\u305F\u3060\u3057\u300C\u3067\u3059\u30FB\u307E\u3059\u300D\u306E\u4E01\u5BE7\u8A9E\u306F\u4FDD\u3064\u3002\u5E38\u4F53\u3067\u66F8\u304B\u306A\u3044\uFF09
- \u300C\u301C\u3067\u3059\u3088\u306D\u300D\u300C\u301C\u3058\u3083\u306A\u3044\u3067\u3057\u3087\u3046\u304B\u300D\u306E\u3088\u3046\u306A\u540C\u610F\u3092\u6C42\u3081\u308B\u8A00\u3044\u56DE\u3057\u3092\u4F7F\u308F\u306A\u3044
- \u307E\u3068\u3081\u30FB\u30AA\u30C1\u30FB\u6559\u8A13\u3092\u3064\u3051\u305A\u306B\u7D42\u308F\u3063\u3066\u3088\u3044
- \u672C\u6587\u306E\u76EE\u5B89 300\u301C500\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30671\u500B\u307E\u3067`
  },
  {
    id: "question",
    label: "\u554F\u3044\u3092\u7ACB\u3066\u308B",
    instruction: `1\u884C\u76EE\u306B\u3001\u7B54\u3048\u304C\u4EBA\u306B\u3088\u3063\u3066\u5272\u308C\u308B\u554F\u3044\u3092\u7F6E\u304F\u3002\u300C\u7D20\u6575\u3067\u3059\u3088\u306D\uFF1F\u300D\u306E\u3088\u3046\u306A\u540C\u610F\u3092\u6C42\u3081\u308B\u3060\u3051\u306E\u554F\u3044\u306F\u7981\u6B62\u3002
- \u554F\u3044 \u2192 \u8003\u3048\u3089\u308C\u308B\u898B\u65B9\u30922\u3064\u63D0\u793A \u2192 \u81EA\u5206\u306F\u3053\u3046\u601D\u3046\u3001\u3092\u6700\u5F8C\u306B\u77ED\u304F
- \u8AAD\u8005\u306B\u7D50\u8AD6\u3092\u62BC\u3057\u3064\u3051\u306A\u3044
- \u672C\u6587\u306E\u76EE\u5B89 300\u301C500\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30672\u500B\u307E\u3067`
  },
  {
    id: "character_dive",
    label: "\u4EBA\u7269\u306E\u4E00\u70B9\u7A81\u7834",
    needsCharacter: true,
    instruction: `\u4E0E\u3048\u3089\u308C\u305F\u4EBA\u7269\u60C5\u5831\u306E\u4E2D\u3067\u3001\u3044\u3061\u3070\u3093\u300C\u3072\u3069\u3044\u300D\u300C\u304A\u304B\u3057\u3044\u300D\u300C\u5207\u306A\u3044\u300D\u4E00\u70B9\u3060\u3051\u3092\u53D6\u308A\u4E0A\u3052\u3066\u66F8\u304F\u3002
- \u7D4C\u6B74\u306E\u8981\u7D04\u3084\u6F14\u76EE\u306E\u3042\u3089\u3059\u3058\u7D39\u4ECB\u306F\u3057\u306A\u3044\u3002\u305D\u306E\u4E00\u70B9\u3060\u3051\u3092\u6398\u308B
- \u4E0E\u3048\u3089\u308C\u305F\u60C5\u5831\u306B\u7121\u3044\u8A2D\u5B9A\u30FB\u30A8\u30D4\u30BD\u30FC\u30C9\u306F\u8DB3\u3055\u306A\u3044
- \u672C\u6587\u306E\u76EE\u5B89 400\u301C600\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30672\u500B\u307E\u3067`
  },
  {
    id: "scene",
    label: "\u60C5\u666F\u63CF\u5199",
    needsVisual: true,
    instruction: `\u305D\u306E\u5834\u306E\u5149\u30FB\u97F3\u30FB\u7A7A\u6C17\u3092\u63CF\u5199\u3059\u308B\u6587\u4F53\u3067\u66F8\u304F\u3002\u8AAD\u8005\u3078\u306E\u547C\u3073\u304B\u3051\u30FB\u554F\u3044\u304B\u3051\u3092\u4E00\u5207\u5165\u308C\u306A\u3044\u3002
- \u63CF\u304F\u306E\u306F\u3010\u753B\u50CF\u306E\u7279\u5FB4\u3011\u3010\u5834\u9762\u30BF\u30A4\u30D7\u3011\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u7BC4\u56F2\u307E\u3067\u3002\u5199\u3063\u3066\u3044\u306A\u3044\u60C5\u666F\u3092\u4F5C\u3089\u306A\u3044
- \u898B\u3048\u3066\u3044\u308B\u3082\u306E\u3092\u6DE1\u3005\u3068\u63CF\u304F\u3002\u300C\u301C\u3067\u3059\u3088\u306D\u300D\u300C\u301C\u3057\u307E\u305B\u3093\u304B\u300D\u306F\u4F7F\u308F\u306A\u3044
- \u63CF\u5199\u6587\u3067\u3082\u6587\u672B\u306F\u3059\u3079\u3066\u300C\u3067\u3059\u30FB\u307E\u3059\u300D\u3067\u7D42\u3048\u308B\uFF08\u4F53\u8A00\u6B62\u3081\u306F\u53EF\u3002\u300C\u301C\u3060\u300D\u300C\u301C\u3067\u3042\u308B\u300D\u300C\u301C\u3066\u3044\u308B\u300D\u300C\u301C\u3059\u308B\u300D\u306E\u3088\u3046\u306A\u5E38\u4F53\u3067\u6587\u3092\u7D42\u3048\u306A\u3044\uFF09
- \u4E3B\u89B3\u3092\u66F8\u304F\u306E\u306F\u6700\u5F8C\u306E1\u884C\u3060\u3051
- \u672C\u6587\u306E\u76EE\u5B89 300\u301C450\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30671\u500B\u307E\u3067`
  },
  {
    id: "short",
    label: "\u77ED\u6587\u3068\u4F59\u767D",
    instruction: `\u5168\u4F53\u3067100\u301C200\u5B57\u306B\u53CE\u3081\u308B\u3002\u5199\u771F\u306B\u8A9E\u3089\u305B\u3001\u8A00\u8449\u306F\u524A\u308B\u3002
- 2\u301C4\u884C\u3002\u8AAC\u660E\u3057\u306A\u3044\u3001\u76DB\u308A\u4E0A\u3052\u306A\u3044
- \u77ED\u304F\u3066\u3082\u4E2D\u8EAB\u306F\u5165\u308C\u308B\u3002\u3010\u753B\u50CF\u306E\u7279\u5FB4\u3011\u3010\u5834\u9762\u30BF\u30A4\u30D7\u3011\u304B\u3089\u5177\u4F53\u3092\u6700\u4F4E\u3072\u3068\u3064\u62FE\u3063\u3066\u66F8\u304F\uFF08\u300C\u5927\u5207\u306A\u4E00\u90E8\u3067\u3059\u300D\u306E\u3088\u3046\u306A\u5F53\u305F\u308A\u969C\u308A\u306E\u306A\u3044\u307E\u3068\u3081\u3060\u3051\u3067\u7D42\u308F\u3089\u305B\u306A\u3044\uFF09
- \u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u6D3B\u52D5\u7D39\u4ECB\u3084CTA\u306E\u5B9A\u578B\u6587\u3092\u5165\u308C\u306A\u3044\uFF08CTA\u6307\u5B9A\u304C\u3042\u308B\u5834\u5408\u306E\u307F\u6700\u5C0F\u9650\u306B\uFF09
- \u7D75\u6587\u5B57\u306F0\u500B\u304B1\u500B`
  },
  {
    id: "gap",
    label: "\u610F\u5916\u6027\u306E\u843D\u5DEE",
    instruction: `\u300C\u305D\u3046\u601D\u308F\u308C\u304C\u3061\u3060\u304C\u3001\u5B9F\u306F\u9055\u3046\u300D\u3068\u3044\u3046\u843D\u5DEE\u3092\u8EF8\u306B\u66F8\u304F\u3002
- \u524D\u6BB5\u3067\u4E00\u822C\u7684\u306A\u30A4\u30E1\u30FC\u30B8\u3092\u66F8\u304D\u3001\u5F8C\u6BB5\u3067\u3072\u3063\u304F\u308A\u8FD4\u3059
- \u3072\u3063\u304F\u308A\u8FD4\u3059\u5074\u306E\u4E2D\u8EAB\u306F\u3001\u4E0E\u3048\u3089\u308C\u305F\u60C5\u5831\u306E\u7BC4\u56F2\u3067\u66F8\u3051\u308B\u4E8B\u5B9F\u306B\u9650\u308B\uFF08\u60F3\u50CF\u3067\u88DC\u308F\u306A\u3044\uFF09
- \u672C\u6587\u306E\u76EE\u5B89 400\u301C600\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30672\u500B\u307E\u3067`
  },
  {
    id: "audience",
    label: "\u5BA2\u5E2D\u76EE\u7DDA",
    instruction: `\u89B3\u306B\u6765\u305F\u4EBA\u306E\u8996\u70B9\u3067\u66F8\u304F\u3002\u821E\u53F0\u306E\u5185\u5074\u306E\u4E8B\u60C5\u3067\u306F\u306A\u304F\u3001\u5BA2\u5E2D\u304B\u3089\u4F55\u304C\u898B\u3048\u308B\u304B\u30FB\u3069\u3046\u611F\u3058\u308B\u304B\u3092\u66F8\u304F\u3002
- \u5E2D\u306E\u4F4D\u7F6E\u306B\u3088\u308B\u898B\u3048\u65B9\u306E\u9055\u3044\uFF08\u524D\u65B9\u30FB\u5F8C\u65B9\u30FB\u82B1\u9053\u8FD1\u304F\uFF09\u3068\u3044\u3063\u305F\u4E00\u822C\u8AD6\u306F\u66F8\u3044\u3066\u3088\u3044
- \u300C\u96A3\u306E\u5E2D\u306E\u4EBA\u304C\u3053\u3046\u8A00\u3063\u3066\u3044\u305F\u300D\u300C\u5BA2\u5E2D\u304B\u3089\u3053\u3093\u306A\u58F0\u304C\u4E0A\u304C\u3063\u305F\u300D\u306E\u3088\u3046\u306A\u3001\u5B9F\u969B\u306B\u3042\u3063\u305F\u304B\u306E\u3088\u3046\u306A\u5834\u9762\u3084\u767A\u8A00\u3092\u5275\u4F5C\u3057\u306A\u3044
- \u672C\u6587\u306E\u76EE\u5B89 300\u301C500\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30672\u500B\u307E\u3067`
  },
  {
    id: "hands",
    label: "\u624B\u3092\u52D5\u304B\u3059\u8A71",
    instruction: `\u4F5C\u308B\u30FB\u904B\u3076\u30FB\u76F4\u3059\u30FB\u7247\u4ED8\u3051\u308B\u3068\u3044\u3063\u305F\u3001\u624B\u3092\u52D5\u304B\u3059\u5074\u306E\u5177\u4F53\u306B\u5BC4\u305B\u3066\u66F8\u304F\u3002
- \u5927\u9053\u5177\u30FB\u5C0F\u9053\u5177\u3092\u5EA7\u54E1\u304C\u624B\u4F5C\u308A\u3057\u3066\u3044\u308B\u70B9\u306F\u66F8\u3044\u3066\u3088\u3044\u304C\u3001\u4E0E\u3048\u3089\u308C\u3066\u3044\u306A\u3044\u5177\u4F53\u7684\u306A\u4F5C\u696D\u5185\u5BB9\u3092\u5275\u4F5C\u3057\u306A\u3044
- \u300C\u611F\u52D5\u300D\u300C\u60C5\u71B1\u300D\u3068\u3044\u3063\u305F\u5927\u304D\u306A\u8A00\u8449\u3092\u4F7F\u308F\u305A\u3001\u4F5C\u696D\u306E\u624B\u3056\u308F\u308A\u3067\u66F8\u304F
- \u672C\u6587\u306E\u76EE\u5B89 300\u301C500\u5B57\u3002\u7D75\u6587\u5B57\u306F\u5168\u4F53\u30671\u500B\u307E\u3067`
  }
];
var FIXED_FORMAT_THEMES = ["\u30AF\u30A4\u30BA", "\u6A5F\u80FD\u7D39\u4ECB"];
function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pickCompositionStyle(postDate, theme, hasCharacter, hasVisual) {
  if (FIXED_FORMAT_THEMES.includes(theme)) return null;
  const pool = COMPOSITION_STYLES.filter(
    (s) => (!s.needsCharacter || hasCharacter) && (!s.needsVisual || hasVisual)
  );
  if (pool.length === 0) return null;
  const epochDay = Math.floor(Date.parse(`${postDate}T00:00:00Z`) / 864e5);
  const base = Number.isFinite(epochDay) ? epochDay : 0;
  const index = ((base + hashString(theme)) % pool.length + pool.length) % pool.length;
  return pool[index];
}
async function fetchRecentOpenings(env, limit = 12) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT instagram_text FROM posts
       WHERE instagram_text IS NOT NULL AND instagram_text != ''
       ORDER BY post_date DESC LIMIT ?`
    ).bind(limit).all();
    const openings = [];
    for (const row32 of results) {
      const first = (row32.instagram_text || "").split("\n").find((l) => l.trim().length > 0) || "";
      const trimmed = first.trim().slice(0, 30);
      if (trimmed) openings.push(trimmed);
    }
    return openings;
  } catch (e) {
    console.error("fetchRecentOpenings failed:", e.message);
    return [];
  }
}
var BANNED_PHRASE_RULES = `\u3010\u4F7F\u3044\u53E4\u3055\u308C\u305F\u8868\u73FE\u306E\u7981\u6B62\uFF08\u6700\u91CD\u8981\u30FB\u5B9F\u969B\u306B\u6295\u7A3F\u304C\u30D1\u30BF\u30FC\u30F3\u5316\u3057\u305F\u305F\u3081\uFF09\u3011
- \u6307\u793A\u8A9E\u3067\u5199\u771F\u3092\u6307\u3057\u3066\u304B\u3089\u611F\u60F3\u3092\u8FF0\u3079\u308B\u5F62\uFF08\u300C\u3053\u306E\u25CB\u25CB\u3001\u301C\u3067\u3059\u3088\u306D\u300D\u300C\u3053\u306E\u25CB\u25CB\u3001\u301C\u307E\u305B\u3093\u304B\u300D\u300C\u3053\u306E\u25CB\u25CB\u3092\u898B\u308B\u3068\u301C\u307E\u3059\u300D\u300C\u3053\u306E\u25CB\u25CB\u3001\u301C\u3057\u307E\u3059\u300D\uFF09\u3067\u66F8\u304D\u59CB\u3081\u306A\u3044\u3002\u76F4\u8FD1\u306E\u6295\u7A3F\u306E\u5927\u534A\u304C\u3053\u306E\u578B\u3067\u3001\u6A5F\u68B0\u6295\u7A3F\u306E\u6307\u7D0B\u306B\u306A\u3063\u3066\u3044\u308B
- \u305D\u3082\u305D\u3082\u300C\u3053\u306E\u300D\u300C\u305D\u306E\u300D\u3067\u59CB\u307E\u308B1\u6587\u76EE\u306B\u3057\u306A\u3044\u3002\u540D\u8A5E\u30FB\u4E8B\u5B9F\u30FB\u52D5\u4F5C\u30FB\u554F\u3044\u306E\u3044\u305A\u308C\u304B\u304B\u3089\u59CB\u3081\u308B
- \u3059\u3079\u3066\u306E\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u672C\u6587\u3067\u300C\u3067\u3059\u30FB\u307E\u3059\u300D\u306E\u4E01\u5BE7\u8A9E\u3092\u57FA\u672C\u306B\u3059\u308B\uFF08\u69CB\u6210\u306E\u6307\u5B9A\u3067\u5E38\u4F53\u304C\u8A31\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u3092\u9664\u304F\uFF09
- \u6B21\u306E\u8A9E\u306F\u4F7F\u308F\u306A\u3044: \u30EF\u30AF\u30EF\u30AF / \u30C9\u30AD\u30C9\u30AD / \u9CE5\u808C / \u5965\u304C\u6DF1\u3044 / \u601D\u308F\u305A\u606F\u3092\u306E\u3080 / \u5FC3\u304C\u6E29\u304B\u304F / \u80F8\u304C\u9AD8\u9CF4\u308B / \u5F15\u304D\u8FBC\u307E\u308C\u307E\u3059 / \u9B45\u4E86\u3055\u308C / \u5727\u5DFB / \u7D20\u6575\u3067\u3059\u3088\u306D
- \u300C\u301C\u3067\u3059\u3088\u306D\u300D\u300C\u301C\u306A\u3093\u3067\u3059\u300D\u300C\u301C\u306A\u3093\u3067\u3059\u3088\u300D\u306F\u672C\u6587\u5168\u4F53\u3067\u5408\u308F\u305B\u30662\u56DE\u307E\u3067
- \u3059\u3079\u3066\u306E\u6BB5\u843D\u3092\u300C\u2728\u300D\u3067\u7DE0\u3081\u306A\u3044\u3002\u7D75\u6587\u5B57\u306F\u6307\u5B9A\u3055\u308C\u305F\u500B\u6570\u306E\u4E0A\u9650\u3092\u5B88\u308B
- \u300C\u79C1\u305F\u3061\u6C17\u826F\u6B4C\u821E\u4F0E\u306F\u301C\u300D\u3067\u59CB\u307E\u308B\u81EA\u5DF1\u7D39\u4ECB\u7684\u306A\u6BB5\u843D\u3092\u6BCE\u56DE\u5165\u308C\u306A\u3044`;
function buildVariationPrompt(style, recentOpenings) {
  const parts = [];
  if (style) {
    parts.push(`\u3010\u4ECA\u65E5\u306E\u69CB\u6210\uFF08\u3053\u306E\u5F62\u3067\u66F8\u304F\u3053\u3068\uFF09\u3011${style.label}
${style.instruction}`);
  }
  if (recentOpenings.length > 0) {
    const list = recentOpenings.map((o) => `- ${o}`).join("\n");
    parts.push(`\u3010\u76F4\u8FD1\u306E\u6295\u7A3F\u306E\u66F8\u304D\u51FA\u3057\uFF08\u3053\u308C\u3089\u3068\u540C\u3058\u578B\u30FB\u540C\u3058\u8A9E\u5F59\u3067\u66F8\u304D\u59CB\u3081\u306A\u3044\uFF09\u3011
${list}`);
  }
  parts.push(BANNED_PHRASE_RULES);
  return parts.join("\n\n");
}
async function generatePostText(env, post, settings2, platform, customPrompt) {
  if (threePlayOwnsDate(settings2, String(post.post_date))) throw new Error("3\u6F14\u76EE\u30E2\u30FC\u30C9\u3067\u306F\u51FA\u5178\u3068\u4E00\u81F4\u3059\u308B\u627F\u8A8D\u6E08\u307F\u672C\u6587\u3092\u4F7F\u7528\u3057\u307E\u3059");
  const characterName = post.character_name || "";
  const characterDesc = post.character_description || "";
  const personalityTags = post.personality_tags || "";
  const visualFeatures = post.visual_features || "";
  const sceneType = post.scene_type || "";
  const theme = post.theme || "";
  const specialDay = post.special_day || "";
  const postDate = post.post_date || "";
  const ctaType = post.cta_type || "A";
  const ctaUrl = post.cta_url || "";
  const cta = buildCtaText(ctaType, settings2);
  const commonHashtags = settings2.common_hashtags || "#\u6B4C\u821E\u4F0E #kabuki";
  const platforms = ["instagram"];
  const platformSpecs = {
    instagram: `Instagram\u6295\u7A3F\u6587\uFF08\u6700\u59272200\u6587\u5B57\u3001\u6539\u884C\u81EA\u7531\u3001\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F\u672C\u6587\u3068\u306F\u5225\u306B\u51FA\u529B\uFF09
- \u89AA\u3057\u307F\u3084\u3059\u304F\u4E01\u5BE7\u306A\u53E3\u8ABF
- \u6587\u5B57\u6570\u3068\u7D75\u6587\u5B57\u306E\u500B\u6570\u306F\u300C\u4ECA\u65E5\u306E\u69CB\u6210\u300D\u306E\u6307\u5B9A\u306B\u5F93\u3046\uFF08\u6307\u5B9A\u304C\u7121\u3044\u5834\u5408\u306E\u307F400\u301C600\u5B57\u30FB\u7D75\u6587\u5B573\u500B\u4EE5\u5185\uFF09
- \u6539\u884C\u3067\u8AAD\u307F\u3084\u3059\u304F\uFF08\u30DE\u30FC\u30AF\u30C0\u30A6\u30F3\u8A18\u6CD5\u300C#\u300D\u300C##\u300D\u300C**\u300D\u300C-\u300D\u306F\u7D76\u5BFE\u306B\u4F7F\u308F\u306A\u3044\u3002SNS\u3067\u306F\u8A18\u53F7\u304C\u305D\u306E\u307E\u307E\u8868\u793A\u3055\u308C\u308B\uFF09
- URL\u30EA\u30F3\u30AF\u306F\u672C\u6587\u306B\u542B\u3081\u306A\u3044\u3053\u3068\uFF08\u30A2\u30EB\u30B4\u30EA\u30BA\u30E0\u7684\u306B\u30EA\u30FC\u30C1\u304C\u4E0B\u304C\u308B\u305F\u3081\uFF09
- \u8A98\u5C0E\u3057\u305F\u3044\u5834\u5408\u306F\u300C\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u300D\u3068\u6848\u5185`,
    x: `X\uFF08\u65E7Twitter\uFF09\u6295\u7A3F\u6587
\u3010\u6587\u5B57\u6570\u5236\u9650 \u2014 \u6700\u91CD\u8981\u30EB\u30FC\u30EB\u3011X\u3067\u306F\u65E5\u672C\u8A9E1\u6587\u5B57\u304C2\u6587\u5B57\u5206\u30AB\u30A6\u30F3\u30C8\u3055\u308C\u308B
- x_text\u306F110\u6587\u5B57\u4EE5\u5185\uFF08\u7D76\u5BFE\u53B3\u5B88\u3002\u7D75\u6587\u5B57\u30FB\u6539\u884C\u542B\u3081\u3066110\u6587\u5B57\uFF09
- x_hashtags\u306F20\u6587\u5B57\u4EE5\u5185\uFF08\u7D76\u5BFE\u53B3\u5B88\uFF09
- \u77ED\u304F\u30A4\u30F3\u30D1\u30AF\u30C8\u306E\u3042\u308B\u6587
- \u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F2-3\u500B
- URL\u306F\u672C\u6587\u306B\u542B\u3081\u306A\u3044\u3053\u3068\uFF08X\u306F\u30EA\u30F3\u30AF\u4ED8\u304D\u6295\u7A3F\u306E\u30EA\u30FC\u30C1\u3092\u4E0B\u3052\u308B\u305F\u3081\u3002\u8A98\u5C0E\u5148URL\u306F\u81EA\u52D5\u3067\u30EA\u30D7\u30E9\u30A4\u306B\u6295\u7A3F\u3055\u308C\u308B\uFF09
- \u300C\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u300D\u3068\u3044\u3046\u6848\u5185\u306FX\u3067\u306F\u4F7F\u308F\u306A\u3044\u3053\u3068`,
    facebook: `Facebook\u6295\u7A3F\u6587\uFF08\u6700\u5927500\u6587\u5B57\u7A0B\u5EA6\uFF09
- \u4E01\u5BE7\u3067\u843D\u3061\u7740\u3044\u305F\u53E3\u8ABF
- \u8A73\u3057\u3044\u89E3\u8AAC\u3092\u542B\u3081\u3066OK
- Instagram\u6295\u7A3F\u6587\u306E\u8981\u7D04\u3084\u8A00\u3044\u63DB\u3048\u306B\u3057\u306A\u3044\u3002\u540C\u3058\u5199\u771F\u3067\u3082\u53D6\u308A\u4E0A\u3052\u308B\u70B9\u3092\u5909\u3048\u3001\u66F8\u304D\u51FA\u3057\u3082\u5225\u306E\u3082\u306E\u306B\u3059\u308B
- \u30DE\u30FC\u30AF\u30C0\u30A6\u30F3\u8A18\u6CD5\uFF08\u300C#\u300D\u300C##\u300D\u300C**\u300D\u300C-\u300D\uFF09\u306F\u7D76\u5BFE\u306B\u4F7F\u308F\u306A\u3044\uFF08SNS\u3067\u306F\u8A18\u53F7\u304C\u305D\u306E\u307E\u307E\u8868\u793A\u3055\u308C\u308B\uFF09
- URL\u30EA\u30F3\u30AF\u306F\u672C\u6587\u306B\u542B\u3081\u306A\u3044\u3053\u3068\uFF08\u30A2\u30EB\u30B4\u30EA\u30BA\u30E0\u7684\u306B\u30EA\u30FC\u30C1\u304C\u4E0B\u304C\u308B\u305F\u3081\uFF09
- \u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F\u4ED8\u3051\u306A\u3044\uFF08Facebook\u306F\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306E\u767A\u898B\u7D4C\u8DEF\u304C\u7121\u304F\u3001\u6A5F\u68B0\u6295\u7A3F\u611F\u304C\u51FA\u308B\u3060\u3051\u306E\u305F\u3081\uFF09
- \u8A98\u5C0E\u3057\u305F\u3044\u5834\u5408\u306F\u300C\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u300D\u3068\u6848\u5185`,
    bluesky: `Bluesky\u6295\u7A3F\u6587\uFF08\u6700\u5927300\u6587\u5B57\u3001\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F\u672C\u6587\u4E2D\u306B\u542B\u3081\u308B\uFF09
- \u30AB\u30B8\u30E5\u30A2\u30EB\u3067\u89AA\u3057\u307F\u3084\u3059\u3044\u53E3\u8ABF
- URL\u306F\u305D\u306E\u307E\u307E\u8A18\u8F09\uFF08\u30EA\u30C3\u30C1\u30C6\u30AD\u30B9\u30C8\u3067\u81EA\u52D5\u30EA\u30F3\u30AF\u5316\u3055\u308C\u308B\uFF09
- \u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F#\u4ED8\u304D\u3067\u672C\u6587\u4E2D\u306B2-3\u500B\u542B\u3081\u308B\uFF08\u5225\u51FA\u529B\u4E0D\u8981\uFF09`
  };
  const promptParts = platforms.map((p2) => platformSpecs[p2]).join("\n\n");
  const accountName = settings2.account_name || "\u6C17\u826F\u6B4C\u821E\u4F0E";
  const snsAccounts = [
    settings2.sns_instagram ? `Instagram: ${settings2.sns_instagram}` : "",
    settings2.sns_x ? `X: ${settings2.sns_x}` : "",
    settings2.sns_facebook ? `Facebook: ${settings2.sns_facebook}` : "",
    settings2.sns_note ? `Note: ${settings2.sns_note}` : "",
    settings2.sns_youtube ? `YouTube: ${settings2.sns_youtube}` : ""
  ].filter(Boolean).join("\n");
  const systemPrompt = `\u3042\u306A\u305F\u306F\u300C${accountName}\u300D\u306E\u6B4C\u821E\u4F0E\u304C\u5927\u597D\u304D\u306ASNS\u62C5\u5F53\u3067\u3059\u3002
\u30D5\u30A9\u30ED\u30EF\u30FC\u3068\u4E00\u7DD2\u306B\u6B4C\u821E\u4F0E\u3092\u697D\u3057\u3093\u3067\u3044\u308B\u4E00\u4EBA\u3068\u3057\u3066\u3001\u81EA\u5206\u306E\u8A00\u8449\u3067\u8A9E\u3063\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u6D3B\u52D5\u306B\u3064\u3044\u3066\uFF08\u4E8B\u5B9F\u8AA4\u8A8D\u3092\u9632\u3050\u305F\u3081\u306E\u80CC\u666F\u60C5\u5831\u3002\u6BCE\u56DE\u306E\u6295\u7A3F\u306B\u76DB\u308A\u8FBC\u3080\u6750\u6599\u3067\u306F\u306A\u3044\uFF09\u3011
- \u8863\u88C5\u306F\u8CB8\u8863\u88C5\u3092\u5229\u7528\u3057\u3066\u3044\u308B
- \u5316\u7CA7\u306F\u5C02\u9580\u306E\u65B9\u306B\u304A\u9858\u3044\u3057\u3066\u3044\u308B
- \u5927\u9053\u5177\u30FB\u5C0F\u9053\u5177\u306F\u5EA7\u54E1\u304C\u81EA\u5206\u305F\u3061\u3067\u624B\u4F5C\u308A\u3057\u3066\u3044\u308B
- \u7FA9\u592A\u592B\u30FB\u4E09\u5473\u7DDA\u306E\u4F53\u5236\u306F\u516C\u6F14\u3054\u3068\u306B\u7570\u306A\u308B\u305F\u3081\u3001\u6295\u7A3F\u3067\u306F\u7FA9\u592A\u592B\u30FB\u4E09\u5473\u7DDA\u306B\u89E6\u308C\u306A\u3044
\u203B\u3053\u306E4\u70B9\u306F\u300C\u89E6\u308C\u308B\u306A\u3089\u4E8B\u5B9F\u306F\u3053\u3046\u3060\u300D\u3068\u3044\u3046\u78BA\u8A8D\u7528\u3002\u8A71\u306E\u6D41\u308C\u3067\u5FC5\u8981\u306B\u306A\u3063\u305F\u3068\u304D\u3060\u3051\u66F8\u304D\u3001\u6BCE\u56DE\u306E\u6295\u7A3F\u306B\u5B9A\u578B\u6BB5\u843D\u3068\u3057\u3066\u8CBC\u308A\u4ED8\u3051\u306A\u3044\u3053\u3068\u3002

\u3010\u30C8\u30FC\u30F3\u6307\u91DD\u3011
- \u300C\u305C\u3072\u30C1\u30A7\u30C3\u30AF\u300D\u300C\u304A\u898B\u9003\u3057\u306A\u304F\u300D\u300C\u5FC5\u898B\u300D\u306A\u3069\u306E\u58F2\u308A\u8FBC\u307F\u8868\u73FE\u306F\u4F7F\u308F\u306A\u3044
- \u300C\u7686\u3055\u3093\u3001\u3053\u3093\u306B\u3061\u306F\uFF01\u300D\u300C\u4ECA\u65E5\u306E\u6295\u7A3F\u306F\u301C\u3067\u3059\u300D\u306E\u3088\u3046\u306A\u5B9A\u578B\u3042\u3044\u3055\u3064\u30FB\u524D\u7F6E\u304D\u3067\u66F8\u304D\u59CB\u3081\u306A\u3044\uFF08\u6BCE\u65E5\u540C\u3058\u66F8\u304D\u51FA\u3057\u306F\u6A5F\u68B0\u6295\u7A3F\u306E\u6307\u7D0B\u306B\u306A\u308B\uFF09
- \u6B4C\u821E\u4F0E\u306B\u8A73\u3057\u304F\u306A\u3044\u4EBA\u306B\u3082\u697D\u3057\u3093\u3067\u3082\u3089\u3048\u308B\u3088\u3046\u3001\u308F\u304B\u308A\u3084\u3059\u304F
- \u300C\u81EA\u5206\u3082\u597D\u304D\u3060\u304B\u3089\u8A9E\u308A\u305F\u3044\u300D\u3068\u3044\u3046\u6E29\u5EA6\u611F\u3067
- \u611F\u5606\u3068\u5171\u611F\u3060\u3051\u3067\u5B57\u6570\u3092\u57CB\u3081\u306A\u3044\u3002\u66F8\u3051\u308B\u3053\u3068\u304C\u5C11\u306A\u3044\u65E5\u306F\u3001\u7121\u7406\u306B\u9577\u304F\u305B\u305A\u77ED\u304F\u7D42\u3048\u308B\u65B9\u304C\u3088\u3044
- \u6BCE\u56DE\u540C\u3058\u8ABF\u5B50\u306B\u3057\u306A\u3044\u3002\u5171\u611F\u3092\u6C42\u3081\u308B\u6587\u3001\u554F\u3044\u304B\u3051\u3001\u63CF\u5199\u3001\u8A00\u3044\u5207\u308A\u306E\u3069\u308C\u3067\u9032\u3081\u308B\u304B\u306F\u300C\u4ECA\u65E5\u306E\u69CB\u6210\u300D\u306E\u6307\u5B9A\u306B\u5F93\u3046

\u3010\u4E8B\u5B9F\u306B\u95A2\u3059\u308B\u30EB\u30FC\u30EB\uFF08\u6700\u91CD\u8981\uFF09\u3011
- \u4E0E\u3048\u3089\u308C\u305F\u60C5\u5831\u306B\u66F8\u304B\u308C\u3066\u3044\u306A\u3044\u3053\u3068\u3092\u4E8B\u5B9F\u3068\u3057\u3066\u66F8\u304B\u306A\u3044\u3002\u6F14\u76EE\u306E\u3042\u3089\u3059\u3058\u3084\u4EBA\u7269\u8A2D\u5B9A\u3092\u81EA\u5206\u306E\u77E5\u8B58\u3067\u88DC\u5B8C\u3057\u306A\u3044
- \u6C17\u826F\u6B4C\u821E\u4F0E\u304C\u7279\u5B9A\u306E\u6F14\u76EE\u3092\u4E0A\u6F14\u3057\u305F\u30FB\u7A3D\u53E4\u3057\u3066\u3044\u308B\u3001\u3068\u3044\u3063\u305F\u6D3B\u52D5\u5B9F\u7E3E\u306F\u3001\u60C5\u5831\u3068\u3057\u3066\u4E0E\u3048\u3089\u308C\u306A\u3044\u9650\u308A\u66F8\u304B\u306A\u3044
- \u6DFB\u4ED8\u753B\u50CF\u306B\u3064\u3044\u3066\u3001\u4E0E\u3048\u3089\u308C\u305F\u8AAC\u660E\uFF08\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u60C5\u5831\u30FB\u753B\u50CF\u306E\u7279\u5FB4\uFF09\u4EE5\u5916\u306E\u65AD\u5B9A\u3092\u3057\u306A\u3044

\u3010\u516C\u5F0FSNS\u30A2\u30AB\u30A6\u30F3\u30C8\u3011
${snsAccounts}

\u203B\u5404\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u6295\u7A3F\u6587\u3067\u306F\u3001\u540C\u3058\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306E\u516C\u5F0F\u30A2\u30AB\u30A6\u30F3\u30C8URL\u306F\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF08\u30D5\u30A9\u30ED\u30EF\u30FC\u306F\u65E2\u306B\u30D5\u30A9\u30ED\u30FC\u6E08\u307F\uFF09\u3002
\u203B\u4ED6\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3078\u306E\u8A98\u5C0E\u3084\u3001KABUKI PLUS+\u30B5\u30A4\u30C8\u3078\u306E\u30EA\u30F3\u30AF\u306F\u9069\u5EA6\u306B\u6D3B\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  let featureContext = "";
  if (theme === "\u6A5F\u80FD\u7D39\u4ECB" && specialDay) {
    try {
      const feature = JSON.parse(specialDay);
      const postMonth = postDate ? new Date(postDate).getMonth() + 1 : 0;
      const isJikabuki = feature.brand === "JIKABUKI+";
      const recruitmentNote = isJikabuki && postMonth >= 1 && postMonth <= 3 ? `
\u3010\u52DF\u96C6\u306E\u304A\u77E5\u3089\u305B\u3011JIKABUKI PLUS+\u3092\u4E00\u7DD2\u306B\u4F7F\u3063\u3066\u304F\u308C\u308B\u5730\u6B4C\u821E\u4F0E\u30FB\u5730\u829D\u5C45\u306E\u56E3\u4F53\u3092\u52DF\u96C6\u3057\u3066\u3044\u307E\u3059\u30023\u6708\u4E2D\u306B\u59CB\u3081\u3066\u3044\u305F\u3060\u3051\u308B\u3068\u5B09\u3057\u3044\u3067\u3059\u3002\u8208\u5473\u306E\u3042\u308B\u56E3\u4F53\u3055\u3093\u306F\u304A\u6C17\u8EFD\u306B\u3054\u9023\u7D61\u304F\u3060\u3055\u3044\u3002` : "";
      featureContext = `
\u3010\u7D39\u4ECB\u3059\u308B\u6A5F\u80FD\u3011${feature.name}\uFF08${feature.brand}\uFF09
\u3010\u6A5F\u80FD\u306E\u8AAC\u660E\u3011${feature.description}
\u3010\u4E3B\u306A\u7279\u5FB4\u3011${feature.highlights.join(" / ")}
\u3010URL\u3011${settings2.kabuki_navi_base_url || "https://kabukiplus.com"}${feature.path}
${feature.story ? `\u3010\u4F5C\u3063\u305F\u80CC\u666F\u3011${feature.story}` : ""}
${feature.imageAlt ? `\u3010\u6DFB\u4ED8\u753B\u50CF\u306E\u5185\u5BB9\u3011${feature.imageAlt}` : ""}${recruitmentNote}

\u203B\u6C17\u826F\u6B4C\u821E\u4F0E\u306F\u5C90\u961C\u770C\u306E\u5730\u6B4C\u821E\u4F0E\u56E3\u4F53\u3067\u3001\u81EA\u5206\u305F\u3061\u306E\u6D3B\u52D5\u306E\u4E2D\u3067\u5FC5\u8981\u306B\u306A\u3063\u305F\u30C4\u30FC\u30EB\u3092\u958B\u767A\u3057\u3066\u304D\u307E\u3057\u305F\u3002
\u203B\u300C\u4F5C\u3063\u305F\u80CC\u666F\u300D\u306E\u30B9\u30C8\u30FC\u30EA\u30FC\u3092\u8EF8\u306B\u3001\u306A\u305C\u3053\u306E\u6A5F\u80FD\u304C\u751F\u307E\u308C\u305F\u304B\u3092\u8A9E\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u6A5F\u80FD\u30B9\u30DA\u30C3\u30AF\u306E\u7F85\u5217\u3067\u306F\u306A\u304F\u3001\u5B9F\u969B\u306E\u56F0\u308A\u3054\u3068\u2192\u89E3\u6C7A\u306E\u6D41\u308C\u3067\u81EA\u7136\u306B\u7D39\u4ECB\u3059\u308B\u5F62\u3067\u3002
\u203B\u6DFB\u4ED8\u753B\u50CF\u306F\u6A5F\u80FD\u306E\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u5165\u308A\u753B\u50CF\u3067\u3059\u3002\u753B\u9762\u306B\u6620\u3063\u3066\u3044\u308B\u5185\u5BB9\u306B\u3082\u89E6\u308C\u3066\u304F\u3060\u3055\u3044\u3002
\u203B\u58F2\u308A\u8FBC\u307F\u8868\u73FE\uFF08\u300C\u305C\u3072\u300D\u300C\u5FC5\u898B\u300D\u300C\u304A\u898B\u9003\u3057\u306A\u304F\u300D\uFF09\u306F\u4F7F\u308F\u306A\u3044\u3002\u3042\u304F\u307E\u3067\u300C\u3053\u3046\u3044\u3046\u306E\u3042\u308B\u3088\u300D\u304F\u3089\u3044\u306E\u6E29\u5EA6\u611F\u3067\u3002
${recruitmentNote ? "\u203B\u300C\u52DF\u96C6\u306E\u304A\u77E5\u3089\u305B\u300D\u306E\u5185\u5BB9\u3092\u6295\u7A3F\u306E\u6700\u5F8C\u306B\u81EA\u7136\u306A\u5F62\u3067\u6DFB\u3048\u3066\u304F\u3060\u3055\u3044\u3002\u62BC\u3057\u3064\u3051\u304C\u307E\u3057\u304F\u306A\u304F\u3001\u300C\u4E00\u7DD2\u306B\u3084\u308A\u307E\u305B\u3093\u304B\u300D\u304F\u3089\u3044\u306E\u6E29\u5EA6\u611F\u3067\u3002" : ""}`;
    } catch {
    }
  }
  const quizQuestion = post.quiz_question || "";
  const quizOptions = post.quiz_options || "";
  const quizCorrectAnswer = post.quiz_correct_answer;
  const quizExplanation = post.quiz_explanation || "";
  let quizContext = "";
  let quizAnswerInstruction = "";
  if (theme === "\u30AF\u30A4\u30BA" && quizQuestion) {
    let optionsList = "";
    let correctAnswerText = "";
    try {
      const options = JSON.parse(quizOptions);
      optionsList = options.map((o, i) => `${i + 1}. ${o}`).join("\n");
      correctAnswerText = options[quizCorrectAnswer] || "";
    } catch {
    }
    quizContext = `
\u3010\u30AF\u30A4\u30BA\u554F\u984C\uFF08\u3053\u306E\u554F\u984C\u3092\u305D\u306E\u307E\u307E\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u81EA\u5206\u3067\u554F\u984C\u3092\u4F5C\u3089\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF09\u3011
\u554F\u984C: ${quizQuestion}
\u9078\u629E\u80A2:
${optionsList}
\u6B63\u89E3: ${correctAnswerText}
\u89E3\u8AAC: ${quizExplanation}`;
    quizAnswerInstruction = `

\u3010\u30AF\u30A4\u30BA\u7B54\u3048\u8FFD\u8A18\u30C6\u30AD\u30B9\u30C8\u306B\u3064\u3044\u3066\uFF08comment_x / comment_bluesky\uFF09\u3011
X\u30FBBluesky\u306E\u672C\u6587\u672B\u5C3E\u306B\u8FFD\u8A18\u3059\u308B\u30AF\u30A4\u30BA\u306E\u6B63\u89E3\u3068\u89E3\u8AAC\u3092\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002
- \u6B63\u89E3\u306F\u300C${correctAnswerText}\u300D\u3067\u3059
- \u89E3\u8AAC: ${quizExplanation}
- \u4E0A\u8A18\u306E\u6B63\u89E3\u3068\u89E3\u8AAC\u306B\u57FA\u3065\u3044\u3066\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002\u4E8B\u5B9F\u3092\u6B63\u78BA\u306B\u3002\u77E5\u3089\u306A\u3044\u3053\u3068\u306F\u66F8\u304B\u306A\u3044\u3067\u304F\u3060\u3055\u3044
- comment_x: X\u5411\u3051\uFF08x_text\u306E\u6587\u5B57\u6570\u3068\u5408\u8A08\u3057\u3066280\u6587\u5B57\u4EE5\u5185\u306B\u53CE\u307E\u308B\u3088\u3046\u7C21\u6F54\u306B\uFF09
- comment_bluesky: Bluesky\u5411\u3051\uFF08bluesky_text\u306E\u6587\u5B57\u6570\u3068\u5408\u8A08\u3057\u3066300\u6587\u5B57\u4EE5\u5185\u306B\u53CE\u307E\u308B\u3088\u3046\u7C21\u6F54\u306B\uFF09`;
  } else if (theme === "\u30AF\u30A4\u30BA" && !quizQuestion) {
    quizContext = `
\u3010\u6CE8\u610F\u3011\u3053\u306E\u30AF\u30A4\u30BA\u6295\u7A3F\u306B\u306F\u30AF\u30A4\u30BA\u30C7\u30FC\u30BF\u304C\u7D10\u3065\u3044\u3066\u3044\u307E\u305B\u3093\u3002\u30AF\u30A4\u30BA\u554F\u984C\u306F\u4F5C\u6210\u305B\u305A\u3001\u6B4C\u821E\u4F0E\u306E\u8C46\u77E5\u8B58\u3068\u3057\u3066\u6295\u7A3F\u6587\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  }
  const style = pickCompositionStyle(postDate, theme, !!characterName, !!(visualFeatures || sceneType));
  const recentOpenings = await fetchRecentOpenings(env);
  const variationPrompt = buildVariationPrompt(style, recentOpenings);
  const editorialPhoto = ["\u516C\u6F14\u5199\u771F", "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9"].includes(theme);
  const editorialRules = editorialPhoto ? `\u3010\u516C\u6F14\u5199\u771F\u30FB\u30D6\u30ED\u30DE\u30A4\u30C9\u306E\u7DE8\u96C6\u65B9\u91DD\uFF08\u9577\u3044\u69CB\u6210\u578B\u3088\u308A\u512A\u5148\uFF09\u3011
\u672C\u6587\u306F40\u301C160\u5B57\u3002\u6C17\u826F\u6B4C\u821E\u4F0E\u81EA\u8EAB\u306E\u516C\u6F14\u8A18\u9332\u3068\u3057\u3066\u3001\u5199\u771F\u3084\u8CC7\u6599\u3067\u78BA\u8A8D\u3067\u304D\u308B\u5185\u5BB9\u3092\u4E00\u3064\u3060\u3051\u5C4A\u3051\u308B\u3002
\u8863\u88F3\u306E\u8272\u30FB\u624B\u30FB\u8996\u7DDA\u3092\u4E26\u3079\u305F\u3060\u3051\u306E\u8AAC\u660E\u3067\u7D42\u308F\u3089\u306A\u3044\u3002\u5F79\u540D\u30FB\u5834\u9762\u30FB\u4EBA\u7269\u306E\u95A2\u4FC2\u306F\u691C\u54C1\u6E08\u307F\u306E\u6839\u62E0\u304C\u3042\u308B\u5834\u5408\u3060\u3051\u66F8\u304F\u3002
\u5199\u771F\u3060\u3051\u3067\u306F\u5F79\u540D\u30FB\u51FA\u6F14\u8005\u540D\u30FB\u53F0\u8A5E\u30FB\u5FC3\u60C5\u3092\u63A8\u6E2C\u3057\u306A\u3044\u3002\u7A3D\u53E4\u306E\u82E6\u52B4\u3084\u89B3\u5BA2\u306E\u53CD\u5FDC\u3092\u5275\u4F5C\u3057\u306A\u3044\u3002
\u300E\u5199\u771F\u304B\u3089\u3082\u60F3\u50CF\u3057\u307E\u3059\u300F\u300E\u4F1D\u308F\u3063\u3066\u304D\u307E\u3059\u300F\u300E\u611F\u3058\u3089\u308C\u307E\u3059\u300F\u300E\u4E00\u77AC\u3092\u5207\u308A\u53D6\u3063\u305F\u300F\u300E\u76EE\u304C\u7559\u307E\u308A\u307E\u3059\u300F\u3067\u6C34\u5897\u3057\u3057\u306A\u3044\u3002
\u6839\u62E0\u4E0D\u8DB3\u306A\u3089\u516C\u6F14\u65E5\u30FB\u6F14\u76EE\u30FB\u5199\u771F\u306E\u4F4D\u7F6E\u4ED8\u3051\u3092\u7C21\u6F54\u306B\u8A18\u3059\u3002\u7121\u7406\u306B\u611F\u60F3\u3001\u307E\u3068\u3081\u3001\u554F\u3044\u304B\u3051\u3001\u30D5\u30A9\u30ED\u30FC\u8A98\u5C0E\u3092\u8DB3\u3055\u306A\u3044\u3002
\u5199\u771F\u306B\u6307\u5B9A\u3055\u308C\u305F\u64AE\u5F71\u8005\u8868\u8A18\u3092\u7701\u7565\u3057\u306A\u3044\u3002` : "";
  console.log(`Composition style for ${postDate} (${theme}): ${style ? style.id : "none (fixed-format theme)"}`);
  const userPrompt = `\u4EE5\u4E0B\u306E\u60C5\u5831\u3092\u3082\u3068\u306B\u3001SNS\u6295\u7A3F\u6587\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6295\u7A3F\u65E5\u3011${postDate}
\u3010\u30C6\u30FC\u30DE\u3011${theme}
${specialDay && theme !== "\u6A5F\u80FD\u7D39\u4ECB" ? `\u3010\u7279\u5225\u306A\u65E5\u3011${specialDay}` : ""}
${featureContext}${quizContext}
${theme !== "\u6A5F\u80FD\u7D39\u4ECB" && characterName ? `\u3010\u6DFB\u4ED8\u753B\u50CF\u306E\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC/\u6F14\u76EE\u3011${characterName}` : ""}
${theme !== "\u6A5F\u80FD\u7D39\u4ECB" && !characterName ? `\u3010\u6CE8\u610F\u3011\u6DFB\u4ED8\u753B\u50CF\u306B\u7279\u5B9A\u306E\u767B\u5834\u4EBA\u7269\u306F\u7D10\u3065\u3044\u3066\u3044\u307E\u305B\u3093\u3002\u753B\u50CF\u3068\u7D50\u3073\u3064\u3051\u3066\u7279\u5B9A\u306E\u6F14\u76EE\u306E\u767B\u5834\u4EBA\u7269\u3092\u8A9E\u3089\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002\u3053\u306E\u6CE8\u610F\u304C\u3042\u308B\u5834\u5408\u3001\u81EA\u5206\u304B\u3089\u7279\u5B9A\u306E\u767B\u5834\u4EBA\u7269\u540D\u3092\u6301\u3061\u51FA\u3055\u305A\u3001\u30C6\u30FC\u30DE\u306B\u6CBF\u3063\u305F\u4E00\u822C\u7684\u306A\u5185\u5BB9\u306B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u30AF\u30A4\u30BA\u554F\u984C\u306A\u3069\u4E0E\u3048\u3089\u308C\u305F\u60C5\u5831\u306B\u4EBA\u7269\u540D\u304C\u542B\u307E\u308C\u308B\u5834\u5408\u306F\u3001\u305D\u306E\u307E\u307E\u4F7F\u3063\u3066\u69CB\u3044\u307E\u305B\u3093\uFF09\u3002` : ""}
${characterDesc ? `\u3010\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u8AAC\u660E\u3011${characterDesc}` : ""}
${personalityTags ? `\u3010\u6027\u683C\u30BF\u30B0\u3011${personalityTags}` : ""}
${visualFeatures ? `\u3010\u753B\u50CF\u306E\u7279\u5FB4\u3011${visualFeatures}` : ""}
${sceneType ? `\u3010\u5834\u9762\u30BF\u30A4\u30D7\u3011${sceneType}` : ""}
${cta ? `\u3010CTA\u3011${cta}` : "\u3010CTA\u3011\u306A\u3057\uFF08CTA\u306F\u5165\u308C\u305A\u3001\u8AAD\u8005\u3078\u306E\u554F\u3044\u304B\u3051\u3084\u81EA\u5206\u306E\u611F\u60F3\u3067\u81EA\u7136\u306B\u7DE0\u3081\u3066\u304F\u3060\u3055\u3044\uFF09"}${ctaUrl ? `
\u3010\u8A98\u5C0E\u5148URL\u3011${ctaUrl}
- Bluesky\u306E\u672C\u6587\u306B\u306F\u3053\u306EURL\u3092\u542B\u3081\u3066OK
- X\u30FBFacebook\u30FBInstagram\u306E\u672C\u6587\u306B\u306FURL\u3092\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\uFF08\u30A2\u30EB\u30B4\u30EA\u30BA\u30E0\u7684\u306B\u30EA\u30FC\u30C1\u304C\u4E0B\u304C\u308B\u305F\u3081\uFF09
- X\u3067\u306F\u8A98\u5C0E\u5148URL\u306F\u81EA\u52D5\u3067\u30EA\u30D7\u30E9\u30A4\u306B\u6295\u7A3F\u3055\u308C\u308B\u305F\u3081\u3001\u672C\u6587\u3067\u7121\u7406\u306B\u89E6\u308C\u306A\u304F\u3066\u3088\u3044
- Facebook\u30FBInstagram\u3067\u306F\u300C\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u300D\u3068\u6848\u5185\u3057\u3066\u304F\u3060\u3055\u3044` : ""}
\u3010\u5171\u901A\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u3011${commonHashtags}

${variationPrompt}
${customPrompt ? `
\u3010\u8FFD\u52A0\u6307\u793A\uFF08\u69CB\u6210\u6307\u793A\u3068\u98DF\u3044\u9055\u3046\u5834\u5408\u306F\u3053\u3061\u3089\u3092\u512A\u5148\uFF09\u3011${customPrompt}` : ""}
Instagram\u3060\u3051\u306E\u6295\u7A3F\u6587\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4ED6SNS\u306E\u6587\u7AE0\u306F\u51FA\u529B\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002
\u5199\u771F\u306E\u64AE\u5F71\u65E5\u304C\u4E0D\u660E\u306A\u5834\u5408\u3001\u300C\u4ECA\u65E5\u300D\u300C\u4ECA\u591C\u306E\u7A3D\u53E4\u300D\u306A\u3069\u73FE\u5728\u306E\u51FA\u6765\u4E8B\u3068\u3057\u3066\u66F8\u304B\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002
\u672C\u6587\u306F150\u301C250\u5B57\u3092\u76EE\u5B89\u306B\u3001\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0\u306F\u6700\u59275\u500B\u3002\u8AAD\u307F\u4E0A\u3052\u7528\u306E\u53F0\u672C\u3084Markdown\u306F\u4E0D\u8981\u3067\u3059\u3002
${promptParts}
${editorialRules}
\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3060\u3051\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{"instagram_text":"...","instagram_hashtags":"..."}`;
  const model = env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      // 文体が固定化しやすいので温度は高め（0.7だと毎回ほぼ同じ言い回しに収束した）
      temperature: 1,
      maxOutputTokens: 8192,
      topP: 0.95
    }
  });
  console.log("Gemini request URL:", url.replace(/key=.*/, "key=***"));
  console.log("Gemini request body length:", requestBody.length);
  let res = null;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody
      });
      if (res.ok) break;
      const errBody = await res.text();
      console.error(`Gemini API error (attempt ${attempt}): status=${res.status}, body=${errBody.substring(0, 500)}`);
      lastError = `Gemini API error ${res.status}: ${errBody.substring(0, 300)}`;
      res = null;
    } catch (e) {
      lastError = `Fetch failed: ${e.message}`;
      res = null;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 2e3));
  }
  if (!res || !res.ok) {
    throw new Error(lastError || "Gemini API request failed after retries");
  }
  const data = await res.json();
  logGeminiUsage("text", model, data.usageMetadata);
  const allParts = data.candidates?.[0]?.content?.parts || [];
  let text = allParts.map((p2) => p2.text || "").join("");
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatches = [...text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
    for (let i = jsonMatches.length - 1; i >= 0; i--) {
      try {
        const candidate = JSON.parse(jsonMatches[i][0]);
        if (candidate.instagram_text || candidate.x_text) {
          parsed = candidate;
          break;
        }
      } catch {
      }
    }
    if (!parsed) {
      const first = text.indexOf("{");
      const last = text.lastIndexOf("}");
      if (first !== -1 && last > first) {
        try {
          parsed = JSON.parse(text.substring(first, last + 1));
        } catch {
        }
      }
    }
  }
  if (!parsed) {
    console.error("Gemini raw response:", text.substring(0, 500));
    throw new Error("Failed to parse Gemini response as JSON");
  }
  return {
    instagram_text: parsed.instagram_text || "",
    instagram_hashtags: parsed.instagram_hashtags || commonHashtags,
    x_text: parsed.x_text || "",
    x_hashtags: parsed.x_hashtags || commonHashtags,
    facebook_text: parsed.facebook_text || "",
    // FBはハッシュタグ無し運用（2026-07〜）。手動で付けたい場合は管理画面でfacebook_hashtagsを編集すれば、
    // auto-post側が従来通り本文末尾に連結する
    facebook_hashtags: "",
    bluesky_text: parsed.bluesky_text || "",
    cta_url: post.cta_url || null,
    quiz_answer_comment: parsed.comment_x || parsed.comment_bluesky ? JSON.stringify({
      x: parsed.comment_x || "",
      bluesky: parsed.comment_bluesky || ""
    }) : null
  };
}
var GRAPH = "https://graph.facebook.com/v21.0";
async function graph(env, path, body) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    ...body ? { body: JSON.stringify(body) } : {},
    signal: AbortSignal.timeout(25e3)
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `Meta HTTP ${res.status}`);
  return data;
}
async function finished(env, p2, mediaId, permalink) {
  if (!permalink) {
    try {
      permalink = (await graph(env, `${mediaId}?fields=permalink`)).permalink;
    } catch {
    }
  }
  await env.DB.batch([
    env.DB.prepare(`UPDATE posts SET instagram_posted=1,ig_media_id=?,ig_permalink=?,publish_state='published',publish_error=NULL,status='posted',updated_at=datetime('now') WHERE id=?`).bind(mediaId, permalink || null, p2.id),
    env.DB.prepare(`INSERT INTO post_log(post_id,platform,success,platform_post_id) SELECT ?,'instagram',1,?
      WHERE NOT EXISTS(SELECT 1 FROM post_log WHERE post_id=? AND platform='instagram' AND success=1 AND platform_post_id=?)`).bind(p2.id, mediaId, p2.id, mediaId)
  ]);
  await ensureCrossposts(env, p2.id);
  return { platform: "instagram", success: true, platformPostId: mediaId, permalink };
}
async function publishInstagram(env, postId, automatic = false) {
  const fail = (error) => ({ platform: "instagram", success: false, error });
  const p2 = await env.DB.prepare(`SELECT p.*,i.r2_key,COALESCE(i.verified,0) verified,COALESCE(i.privacy_excluded,1) privacy_excluded
    FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(postId).first();
  if (!p2) return fail("\u6295\u7A3F\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
  if (p2.instagram_posted) {
    await ensureCrossposts(env, p2.id);
    return { platform: "instagram", success: true, skipped: true, platformPostId: p2.ig_media_id || void 0, permalink: p2.ig_permalink || void 0 };
  }
  const s = await settings(env);
  if ((s.disabled_platforms || "").split(",").map((x) => x.trim()).includes("instagram")) return fail("Instagram\u306F\u505C\u6B62\u4E2D\u3067\u3059");
  if (!env.INSTAGRAM_USER_ID || !env.META_ACCESS_TOKEN) return fail("Instagram\u8A8D\u8A3C\u304C\u672A\u8A2D\u5B9A\u3067\u3059");
  if (automatic && (!p2.auto_publish || p2.post_date !== jstDate() || p2.publish_slot !== currentFeedSlot(s) || !["draft", "approved"].includes(p2.status))) return fail("\u81EA\u52D5\u6295\u7A3F\u306E\u5BFE\u8C61\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  if (!p2.r2_key || p2.privacy_excluded || automatic && !p2.verified) return fail("\u691C\u54C1\u6E08\u307F\u306E\u4F7F\u7528\u53EF\u80FD\u306A\u5199\u771F\u304C\u5FC5\u8981\u3067\u3059");
  if (!p2.instagram_text) return fail("\u6295\u7A3F\u6587\u304C\u3042\u308A\u307E\u305B\u3093");
  if (["publishing", "uncertain"].includes(p2.publish_state)) {
    if (p2.publish_container_id) {
      try {
        const state = await graph(env, `${p2.publish_container_id}?fields=status_code`);
        if (state.status_code === "PUBLISHED") {
          const recent32 = await graph(env, `${env.INSTAGRAM_USER_ID}/media?fields=id,caption,permalink,timestamp&limit=25`);
          const since = Date.parse((p2.publish_started_at || "1970-01-01").replace(" ", "T") + "Z") - 6e4;
          const matches = (recent32.data || []).filter((m) => m.caption === p2.published_caption && Date.parse(m.timestamp || "") >= since);
          if (matches.length === 1) return finished(env, p2, matches[0].id, matches[0].permalink);
        }
      } catch {
      }
    }
    return fail("\u516C\u958B\u7D50\u679C\u3092\u78BA\u8A8D\u4E2D\u3067\u3059\u3002\u91CD\u8907\u9632\u6B62\u306E\u305F\u3081\u518D\u9001\u4FE1\u3057\u307E\u305B\u3093");
  }
  const curated = await guardThreePlayPublication(env, s, p2, { date: jstDate(), slot: currentFeedSlot(s) });
  if (curated.error) return fail(curated.error);
  if (!p2.publish_container_id) {
    if (p2.publish_state === "creating" && p2.publish_started_at && Date.now() - Date.parse(p2.publish_started_at.replace(" ", "T") + "Z") < 12e4)
      return { platform: "instagram", success: false, pending: true, error: "\u30E1\u30C7\u30A3\u30A2\u3092\u767B\u9332\u3057\u3066\u3044\u307E\u3059" };
    let key = p2.r2_key, isReel = false;
    let caption = curated.caption || captionFor(p2.instagram_text, p2.instagram_hashtags, requiredImageCredits(s, [p2.image_id]));
    if (p2.content_type === "reel" && s.reels_enabled === "1" && !isPhotoOnlyDate(s, p2.post_date)) {
      const job = await currentJob(env, p2.id);
      if (job?.status === "ready" && job.video_key) {
        key = job.video_key;
        isReel = true;
        caption = JSON.parse(job.manifest_json).caption;
      }
    }
    const lock = await env.DB.prepare(`UPDATE posts SET publish_state='creating',publish_started_at=datetime('now'),published_media_key=?,published_caption=?,publish_error=NULL
      WHERE id=? AND instagram_posted=0 AND publish_container_id IS NULL
      AND (publish_state IN ('idle','failed') OR (publish_state='creating' AND publish_started_at<datetime('now','-2 minutes')))
      ${automatic || curated.managed ? `AND NOT EXISTS(SELECT 1 FROM posts other WHERE other.post_date=posts.post_date AND other.publish_slot=posts.publish_slot AND other.id<>posts.id AND (other.instagram_posted=1 OR other.publish_state IN ('creating','processing','publishing','uncertain')))` : ""}
      ${curated.managed ? `AND NOT EXISTS(SELECT 1 FROM posts other WHERE other.id<>posts.id AND other.instagram_posted=0 AND other.publish_state IN ('publishing','uncertain'))
        AND EXISTS(SELECT 1 FROM settings WHERE key='ig_editorial_mode' AND value=?)
        AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_manifest_v1' AND value=?)
        AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_evidence_v1' AND value=?)
        AND theme=? AND image_id=? AND character_id IS ? AND instagram_text=? AND COALESCE(instagram_hashtags,'')=?
        AND post_date=? AND publish_slot=? AND status='approved' AND auto_publish=1 AND content_type='photo'` : ""}
      RETURNING id`).bind(key, caption, p2.id, ...curated.managed ? [s.ig_editorial_mode, s.ig_three_plays_manifest_v1, s[EDITORIAL_EVIDENCE_KEY], p2.theme, p2.image_id, p2.character_id, p2.instagram_text, p2.instagram_hashtags || "", p2.post_date, p2.publish_slot] : []).first();
    if (!lock) return { platform: "instagram", success: false, skipped: true, error: "\u51E6\u7406\u4E2D\u3001\u307E\u305F\u306F\u3053\u306E\u6642\u9593\u5E2F\u306E\u6295\u7A3F\u306F\u5B8C\u4E86\u3057\u3066\u3044\u307E\u3059" };
    try {
      const media = await graph(env, `${env.INSTAGRAM_USER_ID}/media`, isReel ? { media_type: "REELS", video_url: assetUrl(publicBase(s), key), caption, share_to_feed: true } : { image_url: assetUrl(publicBase(s), key), caption });
      if (!media.id) throw new Error("\u30B3\u30F3\u30C6\u30CAID\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
      p2.publish_container_id = media.id;
      p2.published_caption = caption;
      p2.published_media_key = key;
      await env.DB.prepare(`UPDATE posts SET publish_state='processing',publish_container_id=? WHERE id=?`).bind(media.id, p2.id).run();
    } catch (e) {
      const msg = e.message;
      await env.DB.prepare(`UPDATE posts SET publish_state='failed',publish_error=? WHERE id=?`).bind(msg, p2.id).run();
      return fail(msg);
    }
  }
  try {
    let status32;
    for (let i = 0; i < 3; i++) {
      status32 = (await graph(env, `${p2.publish_container_id}?fields=status_code`)).status_code;
      if (status32 !== "IN_PROGRESS") break;
      if (i < 2) await new Promise((r) => setTimeout(r, 2e3));
    }
    if (status32 === "ERROR" || status32 === "EXPIRED") {
      await env.DB.prepare(`UPDATE posts SET publish_state='failed',publish_container_id=NULL,publish_error=? WHERE id=?`).bind(`\u30E1\u30C7\u30A3\u30A2\u51E6\u7406: ${status32}`, p2.id).run();
      return fail(`\u30E1\u30C7\u30A3\u30A2\u51E6\u7406: ${status32}`);
    }
    if (status32 === "PUBLISHED") {
      await env.DB.prepare(`UPDATE posts SET publish_state='uncertain' WHERE id=?`).bind(p2.id).run();
      return fail("\u516C\u958B\u6E08\u307F\u30E1\u30C7\u30A3\u30A2\u306E\u7167\u5408\u304C\u5FC5\u8981\u3067\u3059");
    }
    if (status32 !== "FINISHED") return { platform: "instagram", success: false, pending: true, error: "Instagram\u3067\u52D5\u753B\u3092\u51E6\u7406\u4E2D\u3067\u3059" };
    const latestSettings = await settings(env);
    if ((latestSettings.disabled_platforms || "").split(",").map((x) => x.trim()).includes("instagram")) return fail("Instagram\u306F\u505C\u6B62\u4E2D\u3067\u3059");
    const latest = await env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(p2.id).first();
    if (!latest) return fail("\u516C\u958B\u76F4\u524D\u306B\u6295\u7A3F\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F");
    if (latest.publish_container_id !== p2.publish_container_id) return fail("\u51E6\u7406\u3092\u78BA\u8A8D\u3057\u305F\u30B3\u30F3\u30C6\u30CA\u304C\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u3059");
    const finalGuard = await guardThreePlayPublication(env, latestSettings, latest, { date: jstDate(), slot: currentFeedSlot(latestSettings) });
    if (finalGuard.error) return fail(finalGuard.error);
    if (!latest.publish_container_id) return fail("\u516C\u958B\u76F4\u524D\u306B\u30B3\u30F3\u30C6\u30CA\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F");
    const photo = finalGuard.photo;
    if (photo && (latest.post_date !== jstDate() || latest.publish_slot !== currentFeedSlot(latestSettings))) return fail("\u516C\u958B\u67A0\u306E\u6642\u523B\u3092\u904E\u304E\u305F\u305F\u3081\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3059");
    const claim = await env.DB.prepare(`UPDATE posts SET publish_state='publishing',publish_started_at=datetime('now') WHERE id=? AND publish_state='processing' AND instagram_posted=0
      ${photo ? `AND theme=? AND image_id=? AND instagram_text=? AND COALESCE(instagram_hashtags,'')=? AND content_type='photo'
      AND post_date=? AND publish_slot=? AND auto_publish=1 AND character_id IS ? AND status='approved'
      AND publish_container_id=? AND published_media_key=? AND published_caption=?
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_editorial_mode' AND value=?)
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_manifest_v1' AND value=?)
      AND EXISTS(SELECT 1 FROM settings WHERE key='ig_three_plays_evidence_v1' AND value=?)
      AND COALESCE((SELECT value FROM settings WHERE key='disabled_platforms'),'')=?
      AND COALESCE((SELECT value FROM settings WHERE key='image_required_credits'),'')=?
      AND EXISTS(SELECT 1 FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=posts.image_id
        AND i.verified=1 AND i.privacy_excluded=0 AND i.r2_key=? AND i.play_name=? AND COALESCE(i.scene_type,'') NOT LIKE '%AI\u751F\u6210%'
        ${photo.kind === "portrait" ? `AND i.character_id=? AND c.name=? AND c.navi_enmoku_id=? AND c.navi_cast_id=?
          AND (i.scene_type LIKE '%\u30DD\u30FC\u30C8\u30EC\u30FC\u30C8%' OR LOWER(i.scene_type) LIKE '%portrait%' OR i.scene_type LIKE '%\u30D6\u30ED\u30DE\u30A4\u30C9%')` : `AND (i.scene_type LIKE '%\u821E\u53F0%' OR LOWER(i.scene_type) LIKE '%stage%') AND i.scene_type NOT LIKE '%\u30DD\u30FC\u30C8\u30EC\u30FC\u30C8%' AND LOWER(i.scene_type) NOT LIKE '%portrait%' AND i.scene_type NOT LIKE '%\u30D6\u30ED\u30DE\u30A4\u30C9%'`})
      AND NOT EXISTS(SELECT 1 FROM posts other WHERE other.post_date=posts.post_date AND other.publish_slot=posts.publish_slot AND other.id<>posts.id AND (other.instagram_posted=1 OR other.publish_state IN ('creating','processing','publishing','uncertain')))
      AND NOT EXISTS(SELECT 1 FROM posts other WHERE other.id<>posts.id AND other.instagram_posted=0 AND other.publish_state IN ('publishing','uncertain'))` : ""} RETURNING id`).bind(p2.id, ...photo ? [
      latest.theme,
      latest.image_id,
      latest.instagram_text,
      latest.instagram_hashtags || "",
      latest.post_date,
      latest.publish_slot,
      latest.character_id,
      latest.publish_container_id,
      latest.published_media_key,
      latest.published_caption,
      latestSettings.ig_editorial_mode,
      latestSettings.ig_three_plays_manifest_v1,
      latestSettings[EDITORIAL_EVIDENCE_KEY],
      latestSettings.disabled_platforms || "",
      latestSettings.image_required_credits || "",
      photo.r2Key,
      photo.playName,
      ...photo.kind === "portrait" ? [photo.characterId, photo.characterName, photo.playId, photo.naviCastId] : []
    ] : []).first();
    if (!claim) return fail("\u5225\u306E\u51E6\u7406\u304C\u516C\u958B\u78BA\u8A8D\u4E2D\u3067\u3059");
    try {
      const published = await graph(env, `${env.INSTAGRAM_USER_ID}/media_publish`, { creation_id: latest.publish_container_id });
      if (!published.id) throw new Error("\u516C\u958BID\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
      return await finished(env, p2, published.id);
    } catch (e) {
      await env.DB.prepare(`UPDATE posts SET publish_state='uncertain',publish_error=? WHERE id=?`).bind(e.message, p2.id).run();
      return fail("\u516C\u958B\u7D50\u679C\u304C\u4E0D\u660E\u3067\u3059\u3002Instagram\u5074\u306E\u7167\u5408\u307E\u3067\u518D\u9001\u4FE1\u3092\u4FDD\u7559\u3057\u307E\u3059");
    }
  } catch (e) {
    return fail(e.message);
  }
}
async function executeAutoPost(env, targetDate, requestedSlot) {
  const date = targetDate || jstDate();
  const report = { date, postsProcessed: 0, results: [] };
  const s = await settings(env), slot = currentFeedSlot(s);
  if (date !== jstDate() || !slot || requestedSlot && requestedSlot !== slot) return report;
  if (threePlayOwnsDate(s, date)) {
    const prepared = await prepareThreePlaySlot(env, s, date, slot);
    console.log(`[three-plays] ${date} ${slot}: ${prepared.reason}`);
    if (prepared.postId) {
      report.results.push({ postId: prepared.postId, platforms: [await publishInstagram(env, prepared.postId, true)] });
      report.postsProcessed = 1;
    }
    return report;
  }
  const posts = await env.DB.prepare(`SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND auto_publish=1
    AND status IN ('draft','approved','posted') ORDER BY instagram_posted DESC,id LIMIT 1`).bind(date, slot).all();
  for (const p2 of posts.results) {
    report.results.push({ postId: p2.id, platforms: [await publishInstagram(env, p2.id, true)] });
    report.postsProcessed++;
  }
  return report;
}
async function postSinglePlatform(env, postId, platform, _image) {
  if (platform !== "instagram") return { platform, success: false, error: "365\u306FInstagram\u5C02\u7528\u3067\u3059\u3002Facebook\u30FBX\u306FCodex\u3067\u8EE2\u8A18\u3057\u307E\u3059\u3002" };
  return publishInstagram(env, postId, false);
}
async function notifyAdmin(env, text) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = env.LINE_ADMIN_USER_ID;
  if (!token || !to) {
    console.log("[line-notify] LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID \u672A\u8A2D\u5B9A\u306E\u305F\u3081\u901A\u77E5\u30B9\u30AD\u30C3\u30D7");
    return false;
  }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: text.slice(0, 4900) }]
      })
    });
    if (!res.ok) {
      console.error(`[line-notify] Push failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[line-notify] Error:", e.message);
    return false;
  }
}
var PREFERRED_IMAGE_PLAY_MARKERS = [
  "\u7A32\u702C\u5DDD",
  "\u767D\u6D6A\u4E94\u4EBA\u7537",
  "\u9752\u7825\u7A3F\u82B1\u7D05\u5F69\u753B"
];
var PREFERRED_IMAGE_REUSE_DAYS = 14;
var PREFERRED_IMAGE_PLAY_SQL = `(
  play_name LIKE '%\u7A32\u702C\u5DDD%'
  OR play_name LIKE '%\u767D\u6D6A\u4E94\u4EBA\u7537%'
  OR play_name LIKE '%\u9752\u7825\u7A3F\u82B1\u7D05\u5F69\u753B%'
)`;
function isPreferredImagePlay(playName) {
  if (typeof playName !== "string") return false;
  return PREFERRED_IMAGE_PLAY_MARKERS.some((marker) => playName.includes(marker));
}
function seasonTagForMonth(month) {
  if (month >= 4 && month <= 5) return "\u6625";
  if (month >= 6 && month <= 8) return "\u590F";
  if (month >= 9 && month <= 11) return "\u79CB";
  return "\u51AC";
}
async function ensureImages(env, date) {
  const result = { assigned: 0, generated: 0, errors: [] };
  if (threePlayOwnsDate(await readThreePlaySettings(env), date)) return result;
  const { results: posts } = await env.DB.prepare(
    `SELECT id, theme, special_day FROM posts
     WHERE post_date = ? AND status IN ('draft', 'approved') AND image_id IS NULL
       AND auto_publish=1 AND publish_state IN ('idle','failed')`
  ).bind(date).all();
  if (!posts.length) return result;
  const month = Number(date.slice(5, 7));
  const season = seasonTagForMonth(month);
  for (const post of posts) {
    try {
      let image = await pickLibraryImage(env, season, date);
      if (!image) {
        image = await generateAndRegisterImage(env, post, date);
        if (image) result.generated++;
      } else {
        result.assigned++;
      }
      if (!image) {
        result.errors.push(`post ${post.id}: \u753B\u50CF\u3092\u78BA\u4FDD\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F`);
        continue;
      }
      const propagatedCharacterId = image.verified ? image.character_id : null;
      await env.DB.batch([
        // 画像に人物が紐づいていれば投稿のキャラクターも画像側に合わせる（本文生成は画像のキャラクターを使うため、管理画面の表示も揃える）
        env.DB.prepare(
          `UPDATE posts SET image_id = ?, character_id = COALESCE(?, character_id), updated_at = datetime('now') WHERE id = ?`
        ).bind(image.id, propagatedCharacterId, post.id),
        env.DB.prepare(
          `UPDATE images SET usage_count = usage_count + 1, updated_at = datetime('now') WHERE id = ?`
        ).bind(image.id)
      ]);
    } catch (e) {
      result.errors.push(`post ${post.id}: ${e.message}`);
      console.error(`[auto-image] Failed for post ${post.id}:`, e);
    }
  }
  return result;
}
async function pickLibraryImage(env, season, date) {
  const recentlyUsed = `
    SELECT image_id FROM posts
    WHERE image_id IS NOT NULL AND post_date >= date(?, '-60 days') AND post_date <= ?`;
  const recentlyUsedPreferred = `
    SELECT image_id FROM posts
    WHERE image_id IS NOT NULL AND post_date >= date(?, '-${PREFERRED_IMAGE_REUSE_DAYS} days') AND post_date <= ?`;
  let row32 = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE verified = 1 AND privacy_excluded = 0
       AND ${PREFERRED_IMAGE_PLAY_SQL}
       AND id NOT IN (${recentlyUsedPreferred}) AND season_tag IN (?, '\u901A\u5E74')
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`
  ).bind(date, date, season).first();
  if (row32) return row32;
  row32 = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE verified = 1 AND privacy_excluded = 0
       AND ${PREFERRED_IMAGE_PLAY_SQL}
       AND id NOT IN (${recentlyUsedPreferred})
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`
  ).bind(date, date).first();
  if (row32) return row32;
  row32 = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE verified = 1 AND privacy_excluded = 0
       AND id NOT IN (${recentlyUsed}) AND season_tag IN (?, '\u901A\u5E74')
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`
  ).bind(date, date, season).first();
  if (row32) return row32;
  row32 = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE verified = 1 AND privacy_excluded = 0
       AND id NOT IN (${recentlyUsed})
     ORDER BY usage_count ASC, RANDOM() LIMIT 1`
  ).bind(date, date).first();
  if (row32) return row32;
  row32 = await env.DB.prepare(
    `SELECT id, character_id, verified FROM images
     WHERE verified = 1 AND privacy_excluded = 0
     ORDER BY CASE WHEN ${PREFERRED_IMAGE_PLAY_SQL} THEN 0 ELSE 1 END,
              usage_count ASC, RANDOM() LIMIT 1`
  ).first();
  return row32 || null;
}
async function generateAndRegisterImage(env, post, date) {
  const prompt = buildImagePrompt(post.theme, date);
  const gen = await generateImage(env, prompt);
  if (!gen.success || !gen.imageBase64) {
    console.error(`[auto-image] AI generation failed: ${gen.error}`);
    return null;
  }
  const ext = gen.mimeType === "image/png" ? "png" : "jpg";
  const filename = `auto_${date.replace(/-/g, "")}_${post.id}.${ext}`;
  const r2Key = `originals/${filename}`;
  const binaryStr = atob(gen.imageBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  await env.R2.put(r2Key, bytes.buffer, {
    httpMetadata: { contentType: gen.mimeType || "image/png" }
  });
  for (const dir of ["sns/instagram", "sns/x", "sns/facebook"]) {
    await env.R2.put(`${dir}/${filename}`, bytes.buffer, {
      httpMetadata: { contentType: gen.mimeType || "image/png" }
    });
  }
  const dbResult = await env.DB.prepare(
    `INSERT INTO images (filename, r2_key, scene_type, visual_features, season_tag, verified)
     VALUES (?, ?, 'AI\u751F\u6210', ?, '\u901A\u5E74', 1)`
  ).bind(filename, r2Key, `AI\u751F\u6210\u753B\u50CF\uFF08\u30C6\u30FC\u30DE: ${post.theme}\uFF09`).run();
  return { id: dbResult.meta.last_row_id, character_id: null, verified: 1 };
}
function buildImagePrompt(theme, date) {
  const themeHints = {
    "\u6F14\u76EE": "\u6B4C\u821E\u4F0E\u306E\u821E\u53F0\u306E\u4E00\u5834\u9762\u3002\u5F79\u8005\u304C\u898B\u5F97\u3092\u5207\u308B\u5287\u7684\u306A\u77AC\u9593",
    "\u5F79\u8005": "\u6B4C\u821E\u4F0E\u5F79\u8005\u306E\u9688\u53D6\u30E1\u30A4\u30AF\u306E\u30AF\u30ED\u30FC\u30BA\u30A2\u30C3\u30D7\u3002\u529B\u5F37\u3044\u8868\u60C5",
    "\u8C46\u77E5\u8B58": "\u6B4C\u821E\u4F0E\u306E\u5C0F\u9053\u5177\u3084\u8863\u88C5\u306E\u30C7\u30A3\u30C6\u30FC\u30EB\u3002\u6247\u5B50\u3001\u7740\u7269\u306E\u67C4\u306A\u3069",
    "\u540D\u5834\u9762": "\u6B4C\u821E\u4F0E\u306E\u540D\u5834\u9762\u3002\u82B1\u9053\u3067\u306E\u6F14\u6280\u3001\u685C\u5439\u96EA\u306E\u821E\u53F0",
    "\u30AF\u30A4\u30BA": "\u6B4C\u821E\u4F0E\u306B\u307E\u3064\u308F\u308B\u610F\u5320\u3092\u6563\u308A\u3070\u3081\u305F\u697D\u3057\u3044\u96F0\u56F2\u6C17\u306E\u30A4\u30E9\u30B9\u30C8",
    "\u821E\u53F0\u88CF": "\u6B4C\u821E\u4F0E\u306E\u697D\u5C4B\u3084\u821E\u53F0\u88CF\u3002\u8863\u88C5\u3084\u9B18\u3001\u5316\u7CA7\u9053\u5177\u306E\u3042\u308B\u98A8\u666F",
    "\u6B74\u53F2": "\u6C5F\u6238\u6642\u4EE3\u306E\u829D\u5C45\u5C0F\u5C4B\u306E\u96F0\u56F2\u6C17\u3002\u6D6E\u4E16\u7D75\u98A8\u306E\u6B4C\u821E\u4F0E\u306E\u60C5\u666F"
  };
  const hint = themeHints[theme] || "\u6B4C\u821E\u4F0E\u3092\u30C6\u30FC\u30DE\u306B\u3057\u305F\u7F8E\u3057\u3044\u548C\u98A8\u306E\u30A4\u30E1\u30FC\u30B8";
  return `SNS\u6295\u7A3F\u7528\u306E\u6B63\u65B9\u5F62\u753B\u50CF\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C6\u30FC\u30DE: ${hint}
\u30B9\u30BF\u30A4\u30EB: \u548C\u306E\u8272\u5F69\uFF08\u7D05\u3001\u91D1\u3001\u85CD\uFF09\u3092\u57FA\u8ABF\u306B\u3057\u305F\u4E0A\u54C1\u3067\u76EE\u3092\u5F15\u304F\u30D3\u30B8\u30E5\u30A2\u30EB\u3002\u6587\u5B57\u306F\u5165\u308C\u306A\u3044\u3002
\u5B9F\u5728\u306E\u4EBA\u7269\u306E\u9854\u306F\u63CF\u304B\u306A\u3044\u3002\u65E5\u672C\u306E\u4F1D\u7D71\u82B8\u80FD\u30FB\u6B4C\u821E\u4F0E\u306E\u4E16\u754C\u89B3\u3092\u5927\u5207\u306B\u3002`;
}
function getJSTNow() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1e3);
  return {
    date: jst.toISOString().slice(0, 10),
    hour: jst.getUTCHours(),
    minute: jst.getUTCMinutes()
  };
}
function addDays(date, days) {
  const value = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function pickSlotForDate(_date) {
  return { hour: MORNING_FEED_HOUR, minute: 0 };
}
async function shouldRunNow(env) {
  const slot = currentFeedSlot(await settings(env));
  if (!slot) return { run: false, reason: "outside feed windows" };
  const date = getJSTNow().date;
  if (await env.KV.get(doneKey(date, slot))) return { run: false, reason: `already done: ${slot}` };
  return { run: true, slot, reason: `${slot} feed slot` };
}
async function markDone(env, date, slot = "morning") {
  await env.KV.put(doneKey(date, slot), (/* @__PURE__ */ new Date()).toISOString(), { expirationTtl: 60 * 60 * 48 });
}
async function generateMissingTexts(env, date) {
  if (threePlayOwnsDate(await readThreePlaySettings(env), date)) return { generated: 0, failed: 0, errors: [] };
  const { results: posts } = await env.DB.prepare(
    `SELECT p.*, c.name as character_name, c.description as character_description,
     c.personality_tags, i.visual_features, i.scene_type,
     qp.question as quiz_question, qp.options as quiz_options,
     qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p
     LEFT JOIN images i ON p.image_id = i.id
     -- \u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u60C5\u5831\u306F\u6DFB\u4ED8\u753B\u50CF\u306B\u7D10\u3065\u304F\u3082\u306E\u3001\u304B\u3064\u4EBA\u9593\u304C\u691C\u54C1\u6E08\u307F\uFF08verified=1\uFF09\u306E\u3082\u306E\u3060\u3051\u4F7F\u3046
     -- \uFF08\u753B\u50CF\u3068\u7121\u95A2\u4FC2\u306A\u30AD\u30E3\u30E9\u540D\uFF0FGemini Vision\u306E\u8AA4\u5224\u5B9A\u3067\u672C\u6587\u304C\u751F\u6210\u3055\u308C\u308B\u306E\u3092\u9632\u3050\uFF09
     LEFT JOIN characters c ON c.id = i.character_id AND i.verified = 1
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.post_date = ? AND p.auto_publish=1 AND p.publish_state IN ('idle','failed') AND p.status IN ('draft', 'approved')
       AND p.instagram_text IS NULL`
  ).bind(date).all();
  const result = { generated: 0, failed: 0, errors: [] };
  if (!posts.length) return result;
  const { results: settingsRows } = await env.DB.prepare("SELECT key, value FROM settings").all();
  const settings2 = {};
  for (const s of settingsRows) {
    settings2[s.key] = s.value;
  }
  for (const post of posts) {
    try {
      const texts = await generatePostText(env, post, settings2, "instagram");
      await env.DB.prepare(
        `UPDATE posts SET
          instagram_text=?, instagram_hashtags=?,
          updated_at=datetime('now')
        WHERE id=?`
      ).bind(
        texts.instagram_text,
        texts.instagram_hashtags,
        post.id
      ).run();
      result.generated++;
    } catch (err) {
      result.failed++;
      result.errors.push(`post ${post.id}: ${err.message}`);
      console.error(`[daily-run] Text generation failed for post ${post.id}:`, err);
    }
  }
  return result;
}
async function prepareAhead(env, baseDate, daysAhead) {
  const result = { generated: 0, errors: [] };
  if (daysAhead <= 0) return result;
  for (let d = 1; d <= daysAhead; d++) {
    const targetDate = addDays(baseDate, d);
    try {
      await ensureImages(env, targetDate);
      const gen = await generateMissingTexts(env, targetDate);
      result.generated += gen.generated;
      for (const e of gen.errors) result.errors.push(`${targetDate}: ${e}`);
    } catch (err) {
      result.errors.push(`${targetDate}: ${err.message}`);
      console.error(`[daily-run] Prepare-ahead failed for ${targetDate}:`, err);
    }
  }
  return result;
}
async function getPrepareDaysAhead(env) {
  try {
    const row32 = await env.DB.prepare(
      `SELECT value FROM settings WHERE key = 'prepare_days_ahead'`
    ).first();
    if (row32?.value == null || row32.value.trim() === "") return 7;
    const parsed = parseInt(row32.value, 10);
    if (Number.isNaN(parsed)) return 7;
    if (parsed > 30) return 30;
    if (parsed < 0) return 0;
    return parsed;
  } catch (e) {
    console.error("[daily-run] getPrepareDaysAhead failed, fallback to 7:", e);
    return 7;
  }
}
async function runDailyPipeline(env, targetDate, slot) {
  const date = targetDate || getJSTNow().date;
  if (threePlayOwnsDate(await readThreePlaySettings(env), date)) {
    return executeAutoPost(env, date, slot);
  }
  console.log(`[daily-run] Pipeline start for ${date}`);
  const img = await ensureImages(env, date);
  const gen = await generateMissingTexts(env, date);
  const report = await executeAutoPost(env, date, slot);
  const daysAhead = await getPrepareDaysAhead(env);
  const prepare = await prepareAhead(env, date, daysAhead);
  await prepareReels(env);
  await notifyAdmin(env, buildNotificationText(date, img, gen, report, prepare));
  return report;
}
function buildNotificationText(date, img, gen, report, prepare) {
  const lines = [`\u3010kabuki-post-365\u3011${date} \u306E\u6295\u7A3F\u7D50\u679C`];
  if (img.assigned > 0) lines.push(`\u753B\u50CF\u5272\u5F53: \u30E9\u30A4\u30D6\u30E9\u30EA\u304B\u3089${img.assigned}\u4EF6`);
  if (img.generated > 0) lines.push(`\u753B\u50CF\u5272\u5F53: AI\u751F\u6210${img.generated}\u4EF6`);
  if (gen.generated > 0) lines.push(`\u672C\u6587\u751F\u6210: ${gen.generated}\u4EF6`);
  if (gen.failed > 0) lines.push(`\u672C\u6587\u751F\u6210\u306E\u5931\u6557: ${gen.failed}\u4EF6`);
  if (report.postsProcessed === 0) {
    lines.push("");
    lines.push("\u6295\u7A3F\u5BFE\u8C61\u304C\u3042\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
    if (gen.failed > 0) {
      lines.push("\u672C\u6587\u751F\u6210\u306B\u5931\u6557\u3057\u305F\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002\u7BA1\u7406\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    } else {
      lines.push("\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u5F53\u65E5\u5206\u306E\u6295\u7A3F\u67A0\u30FB\u753B\u50CF\u304C\u3042\u308B\u304B\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
  } else {
    let hasFacebookPermalink = false;
    for (const r of report.results) {
      const parts = [];
      const permalinks = [];
      for (const p2 of r.platforms) {
        if (p2.skipped && p2.success) continue;
        if (p2.skipped) parts.push(`${p2.platform}: \u30B9\u30AD\u30C3\u30D7`);
        else if (p2.success) parts.push(`${p2.platform}: OK`);
        else parts.push(`${p2.platform}: \u5931\u6557 (${(p2.error || "").slice(0, 80)})`);
        if (p2.success && !p2.skipped && p2.permalink) {
          permalinks.push(p2.permalink);
          if (p2.platform === "facebook") {
            hasFacebookPermalink = true;
            permalinks.push(`\u25BC\u30B7\u30A7\u30A2\u753B\u9762\u3092\u958B\u304F: https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p2.permalink)}`);
          }
        }
      }
      if (parts.length > 0) {
        lines.push("");
        lines.push(`\u6295\u7A3F #${r.postId}`);
        lines.push(...parts.map((s) => `\u30FB${s}`));
        lines.push(...permalinks);
      }
    }
    const okCount = report.results.flatMap((r) => r.platforms).filter((p2) => p2.success && !p2.skipped).length;
    if (okCount > 0) {
      lines.push("");
      lines.push("Facebook\u30FBX\u306F19\u6642\u30FB20\u6642\u30FB21\u6642\u3068PC\u8D77\u52D5\u30FB\u5FA9\u5E30\u6642\u306BCodex\u304C\u78BA\u8A8D\u3057\u3001\u672A\u8EE2\u8A18\u3092\u53E4\u3044\u9806\u306B\u51E6\u7406\u3057\u307E\u3059\u3002");
      if (hasFacebookPermalink) {
        lines.push("Facebook\u306F\u30DA\u30FC\u30B8\u6295\u7A3F\u3060\u3051\u3060\u3068\u307B\u307C\u5C4A\u304D\u307E\u305B\u3093\u3002\u30B7\u30A7\u30A2\u753B\u9762\u30EA\u30F3\u30AF\u3092\u958B\u3044\u3066\u300C\u6295\u7A3F\u3059\u308B\u300D\u3092\u62BC\u3059\u3060\u3051\u3002\u30B0\u30EB\u30FC\u30D7\u3078\u306E\u30B7\u30A7\u30A2\u3082\u305D\u306E\u753B\u9762\u304B\u3089\u9078\u3079\u307E\u3059\u3002");
      }
    }
  }
  if (prepare.generated > 0) {
    lines.push("");
    lines.push(`\u5148\u8AAD\u307F\u6E96\u5099: \u660E\u65E5\u4EE5\u964D\u306E\u672C\u6587\u3092${prepare.generated}\u4EF6\u751F\u6210`);
  }
  const allErrors = [
    ...img.errors.map((e) => `\u753B\u50CF\u30A8\u30E9\u30FC: ${e.slice(0, 100)}`),
    ...gen.errors.map((e) => `\u751F\u6210\u30A8\u30E9\u30FC: ${e.slice(0, 100)}`),
    ...prepare.errors.map((e) => `\u5148\u8AAD\u307F\u30A8\u30E9\u30FC: ${e.slice(0, 100)}`)
  ];
  if (allErrors.length > 0) {
    lines.push("");
    lines.push(...allErrors.slice(0, 5));
  }
  return lines.join("\n");
}
init_meta_api();
init_x_api();
init_bluesky_api();
async function getDisabledPlatforms(env) {
  const row32 = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'disabled_platforms'`
  ).first();
  return new Set(
    (row32?.value || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}
async function getWorkerBaseUrl(env) {
  const baseUrlRow = await env.DB.prepare(
    `SELECT value FROM settings WHERE key = 'worker_base_url'`
  ).first();
  return baseUrlRow?.value || "https://kabuki-post-365.kerakabuki.workers.dev";
}
function buildR2ImageUrl(baseUrl, r2Key) {
  return `${baseUrl}/images/r2/${r2Key.split("/").map((s) => encodeURIComponent(s)).join("/")}`;
}
init_meta_api();
var STORY_SLOT_START_HOUR_JST = 19;
var STORY_SLOT_COUNT = 4;
function hashString2(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pickStorySlotForDate(date) {
  const slot = hashString2(`${date}story`) % STORY_SLOT_COUNT;
  const hour = STORY_SLOT_START_HOUR_JST + Math.floor(slot / 4);
  const minute = slot % 4 * 15;
  return { hour, minute };
}
async function shouldRunStoryNow(env) {
  const now = getJSTNow();
  if (threePlayOwnsDate(await readThreePlaySettings(env), now.date)) return { run: false, reason: "3\u6F14\u76EE\u30E2\u30FC\u30C9\u3067\u306FStories\u3092\u8FFD\u52A0\u5B9F\u884C\u3057\u307E\u305B\u3093" };
  const target = pickStorySlotForDate(now.date);
  const doneKey2 = `story_done:${now.date}`;
  const alreadyDone = await env.KV.get(doneKey2);
  if (alreadyDone) return { run: false, reason: "story already done today" };
  if (now.hour === target.hour && now.minute >= target.minute && now.minute < target.minute + 15) {
    return { run: true, reason: `scheduled story slot ${target.hour}:${String(target.minute).padStart(2, "0")} JST` };
  }
  const lastHour = STORY_SLOT_START_HOUR_JST + Math.floor((STORY_SLOT_COUNT - 1) / 4);
  const lastMinute = (STORY_SLOT_COUNT - 1) % 4 * 15;
  if (now.hour === lastHour && now.minute >= lastMinute) {
    return { run: true, reason: "story fallback (last slot, not yet done)" };
  }
  return { run: false, reason: `waiting for story slot ${target.hour}:${String(target.minute).padStart(2, "0")} JST` };
}
async function markStoryDone(env, date) {
  await env.KV.put(`story_done:${date}`, (/* @__PURE__ */ new Date()).toISOString(), { expirationTtl: 60 * 60 * 48 });
}
function isLastStorySlot() {
  const now = getJSTNow();
  const lastHour = STORY_SLOT_START_HOUR_JST + Math.floor((STORY_SLOT_COUNT - 1) / 4);
  const lastMinute = (STORY_SLOT_COUNT - 1) % 4 * 15;
  return now.hour === lastHour && now.minute >= lastMinute;
}
var STORY_POOL_WHERE = `verified = 1
  AND privacy_excluded = 0
  AND r2_key IS NOT NULL
  AND (
    scene_type LIKE '%\u697D\u5C4B%'
    OR scene_type LIKE '%\u5316\u7CA7%'
    OR scene_type LIKE '%\u7A3D\u53E4%'
    OR scene_type LIKE '%\u821E\u53F0\u88CF%'
    OR scene_type LIKE '%\u8863\u88F3%'
    OR scene_type LIKE '%\u8863\u88C5%'
    OR scene_type LIKE '%\u6E96\u5099%'
    OR scene_type LIKE '%\u4F11\u61A9%'
    OR scene_type LIKE '%\u5C0F\u9053\u5177%'
    OR scene_type LIKE '%\u904B\u55B6%'
    OR LOWER(scene_type) LIKE '%backstage%'
  )`;
async function runEveningStory(env) {
  const now = getJSTNow();
  if (threePlayOwnsDate(await readThreePlaySettings(env), now.date)) return;
  console.log(`[story-post] Evening story start for ${now.date}`);
  try {
    const disabled = await getDisabledPlatforms(env);
    if (disabled.has("instagram") || disabled.has("instagram_story")) {
      console.log("[story-post] Instagram(_story) is disabled; skip evening story");
      return;
    }
    const image = await env.DB.prepare(`
      SELECT id, r2_key, scene_type
      FROM images
      WHERE ${STORY_POOL_WHERE}
      ORDER BY (story_posted_at IS NULL) DESC, story_posted_at ASC, RANDOM()
      LIMIT 1
    `).first();
    if (!image) {
      console.log("[story-post] No backstage image (verified & scene_type match) available; nothing to post");
      return;
    }
    const baseUrl = await getWorkerBaseUrl(env);
    const imageUrl = buildR2ImageUrl(baseUrl, image.r2_key);
    if (!env.META_ACCESS_TOKEN) {
      console.log("[story-post] META_ACCESS_TOKEN \u672A\u8A2D\u5B9A\u306E\u305F\u3081\u30B9\u30C8\u30FC\u30EA\u30FC\u30BA\u6295\u7A3F\u30B9\u30AD\u30C3\u30D7");
      return;
    }
    const config = {
      accessToken: env.META_ACCESS_TOKEN,
      igUserId: env.INSTAGRAM_USER_ID,
      fbPageId: env.FACEBOOK_PAGE_ID
    };
    const result = await postInstagramStory(config, imageUrl);
    if (result.success) {
      await markStoryDone(env, now.date);
      try {
        await env.DB.prepare(
          `UPDATE images SET story_posted_at = datetime('now') WHERE id = ?`
        ).bind(image.id).run();
      } catch (e) {
        console.error(`[story-post] story_posted_at UPDATE failed (post itself succeeded): ${e}`);
      }
      console.log(`[story-post] Story posted OK (image #${image.id}, scene_type="${image.scene_type ?? ""}")`);
      return;
    }
    const errMsg = (result.error || "").slice(0, 80);
    await notifyAdmin(env, `\u3010kabuki-post-365\u3011\u30B9\u30C8\u30FC\u30EA\u30FC\u30BA\u6295\u7A3F\u5931\u6557: ${errMsg}`);
    console.error(`[story-post] Story post failed: ${result.error}`);
    if (isLastStorySlot()) {
      await markStoryDone(env, now.date);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[story-post] Unexpected error: ${msg}`);
    await notifyAdmin(env, `\u3010kabuki-post-365\u3011\u30B9\u30C8\u30FC\u30EA\u30FC\u30BA\u6295\u7A3F\u5931\u6557(\u4F8B\u5916): ${msg.slice(0, 80)}`).catch(() => {
    });
    if (isLastStorySlot()) {
      await markStoryDone(env, now.date).catch(() => {
      });
    }
  }
}
var imagesRoutes = new Hono2();
imagesRoutes.post("/generate", async (c) => {
  const formData = await c.req.formData();
  const prompt = formData.get("prompt");
  if (!prompt) {
    return c.json({ error: "prompt is required" }, 400);
  }
  let referenceBase64;
  let referenceMimeType;
  const refFile = formData.get("reference_image");
  if (refFile) {
    const arrayBuffer = await refFile.arrayBuffer();
    referenceBase64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    referenceMimeType = refFile.type || "image/png";
  }
  const result = await generateImage(c.env, prompt, referenceBase64, referenceMimeType);
  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }
  const timestamp = Date.now();
  const ext = result.mimeType === "image/png" ? "png" : "jpg";
  const filename = `ai_generated_${timestamp}.${ext}`;
  const r2Key = `originals/${filename}`;
  const binaryStr = atob(result.imageBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  await c.env.R2.put(r2Key, bytes.buffer, {
    httpMetadata: { contentType: result.mimeType }
  });
  const snsVariants = ["sns/instagram", "sns/x", "sns/facebook"];
  for (const dir of snsVariants) {
    await c.env.R2.put(`${dir}/${filename}`, bytes.buffer, {
      httpMetadata: { contentType: result.mimeType }
    });
  }
  const dbResult = await c.env.DB.prepare(
    `INSERT INTO images (filename, r2_key, scene_type, visual_features, season_tag, verified)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).bind(filename, r2Key, "AI\u751F\u6210", "AI\u751F\u6210\u753B\u50CF", "\u901A\u5E74").run();
  return c.json({
    id: dbResult.meta.last_row_id,
    filename,
    r2_key: r2Key,
    imageBase64: result.imageBase64,
    mimeType: result.mimeType
  }, 201);
});
imagesRoutes.post("/analyze", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("image");
  if (!file) {
    return c.json({ error: "No image file provided" }, 400);
  }
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  const mimeType = file.type || "image/jpeg";
  const { results: characters } = await c.env.DB.prepare(
    "SELECT * FROM characters ORDER BY name"
  ).all();
  const result = await analyzeImageWithVision(c.env, base64, mimeType, characters || []);
  return c.json(result);
});
imagesRoutes.get("/", async (c) => {
  const characterId = c.req.query("character_id");
  const seasonTag = c.req.query("season_tag");
  const verified = c.req.query("verified");
  const privacyExcluded = c.req.query("privacy_excluded");
  const eligible = c.req.query("eligible");
  let query = "SELECT * FROM images WHERE 1=1";
  const params = [];
  if (characterId) {
    query += " AND character_id = ?";
    params.push(Number(characterId));
  }
  if (seasonTag) {
    query += " AND season_tag = ?";
    params.push(seasonTag);
  }
  if (verified === "0" || verified === "1") {
    query += " AND verified = ?";
    params.push(Number(verified));
  }
  if (privacyExcluded === "0" || privacyExcluded === "1") {
    query += " AND privacy_excluded = ?";
    params.push(Number(privacyExcluded));
  }
  if (eligible === "1") {
    query += " AND verified = 1 AND privacy_excluded = 0";
  }
  query += " ORDER BY created_at DESC";
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});
imagesRoutes.get("/story-history", async (c) => {
  const totalRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM images WHERE ${STORY_POOL_WHERE}`
  ).first();
  const unpostedRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM images WHERE ${STORY_POOL_WHERE} AND story_posted_at IS NULL`
  ).first();
  const { results: history } = await c.env.DB.prepare(
    `SELECT id, filename, r2_key, scene_type, story_posted_at
     FROM images
     WHERE ${STORY_POOL_WHERE} AND story_posted_at IS NOT NULL
     ORDER BY story_posted_at DESC
     LIMIT 30`
  ).all();
  return c.json({
    pool_total: totalRow?.n ?? 0,
    pool_unposted: unpostedRow?.n ?? 0,
    history: history ?? []
  });
});
imagesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row32 = await c.env.DB.prepare("SELECT * FROM images WHERE id = ?").bind(id).first();
  if (!row32) return c.json({ error: "Not found" }, 404);
  return c.json(row32);
});
imagesRoutes.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const characterId = formData.get("character_id");
  const playName = formData.get("play_name");
  const sceneType = formData.get("scene_type");
  const visualFeatures = formData.get("visual_features");
  const seasonTag = formData.get("season_tag") || "\u901A\u5E74";
  const naviCaption = formData.get("navi_caption");
  const uploads = [];
  const prefixes = ["original", "sns_instagram", "sns_x", "sns_facebook", "navi_card", "navi_detail", "navi_thumb"];
  const r2Paths = {
    original: "originals",
    sns_instagram: "sns/instagram",
    sns_x: "sns/x",
    sns_facebook: "sns/facebook",
    navi_card: "navi/card",
    navi_detail: "navi/detail",
    navi_thumb: "navi/thumb"
  };
  let filename = "";
  for (const prefix22 of prefixes) {
    const file = formData.get(prefix22);
    if (file) {
      if (!filename) filename = file.name;
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const ext = file.name.split(".").pop() || "jpg";
      const r2Key2 = `${r2Paths[prefix22]}/${baseName}.${ext}`;
      uploads.push({ key: r2Key2, file });
    }
  }
  if (uploads.length === 0) {
    return c.json({ error: "No files uploaded" }, 400);
  }
  for (const { key, file } of uploads) {
    await c.env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "image/jpeg" }
    });
  }
  const r2Key = uploads[0].key;
  const result = await c.env.DB.prepare(
    `INSERT INTO images (filename, r2_key, character_id, play_name, scene_type, visual_features, season_tag, navi_caption)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(filename, r2Key, characterId ? Number(characterId) : null, playName, sceneType, visualFeatures, seasonTag, naviCaption).run();
  return c.json({ id: result.meta.last_row_id, filename, r2_key: r2Key }, 201);
});
imagesRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { character_id, play_name, scene_type, visual_features, season_tag, navi_caption, navi_display_order, navi_visible } = body;
  await c.env.DB.prepare(
    `UPDATE images SET character_id=?, play_name=?, scene_type=?, visual_features=?, season_tag=?, navi_caption=?, navi_display_order=?, navi_visible=?, verified=COALESCE(?, verified), updated_at=datetime('now')
     WHERE id=?`
  ).bind(character_id, play_name, scene_type, visual_features, season_tag, navi_caption, navi_display_order, navi_visible ?? 1, body.verified ?? null, id).run();
  return c.json({ success: true });
});
imagesRoutes.post("/:id/verify", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null) ?? {};
  const existing = await c.env.DB.prepare("SELECT id FROM images WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);
  const sets = ["verified = 1", "updated_at = datetime('now')"];
  const params = [];
  if (Object.prototype.hasOwnProperty.call(body, "character_id")) {
    sets.push("character_id = ?");
    params.push(body.character_id ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(body, "play_name")) {
    sets.push("play_name = ?");
    params.push(body.play_name ?? null);
  }
  params.push(id);
  await c.env.DB.prepare(
    `UPDATE images SET ${sets.join(", ")} WHERE id = ?`
  ).bind(...params).run();
  return c.json({ success: true });
});
var PRIVACY_EXCLUSION_REASONS = /* @__PURE__ */ new Set([
  "child_face",
  "backstage_woman_face"
]);
imagesRoutes.post("/:id/privacy-exclusion", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "Invalid image id" }, 400);
  const body = await c.req.json();
  const excluded = body.excluded === true;
  let reason = null;
  if (excluded) {
    if (!body.reason || !PRIVACY_EXCLUSION_REASONS.has(body.reason)) {
      return c.json({ error: "Invalid privacy exclusion reason" }, 400);
    }
    reason = body.reason;
  }
  const existing = await c.env.DB.prepare("SELECT id FROM images WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Not found" }, 404);
  const statements = [
    c.env.DB.prepare(
      `UPDATE images
       SET privacy_excluded = ?, privacy_exclusion_reason = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(excluded ? 1 : 0, reason, id)
  ];
  if (excluded) {
    statements.push(
      c.env.DB.prepare(
        `UPDATE posts
         SET image_id = NULL,
             instagram_text = NULL, instagram_hashtags = NULL,
             x_text = NULL, x_hashtags = NULL,
             facebook_text = NULL, facebook_hashtags = NULL,
             bluesky_text = NULL,
             updated_at = datetime('now')
         WHERE image_id = ?
           AND instagram_posted = 0
           AND x_posted = 0
           AND facebook_posted = 0
           AND bluesky_posted = 0`
      ).bind(id)
    );
  }
  const results = await c.env.DB.batch(statements);
  return c.json({
    success: true,
    excluded,
    affected_posts: excluded ? results[1]?.meta.changes ?? 0 : 0
  });
});
imagesRoutes.post("/:id/variants", async (c) => {
  const id = c.req.param("id");
  const image = await c.env.DB.prepare("SELECT filename FROM images WHERE id = ?").bind(id).first();
  if (!image) return c.json({ error: "Not found" }, 404);
  const formData = await c.req.formData();
  const r2Paths = {
    sns_instagram: "sns/instagram",
    sns_x: "sns/x",
    sns_facebook: "sns/facebook",
    navi_card: "navi/card",
    navi_detail: "navi/detail",
    navi_thumb: "navi/thumb"
  };
  let uploaded = 0;
  for (const [key, r2Dir] of Object.entries(r2Paths)) {
    const file = formData.get(key);
    if (file) {
      const baseName = image.filename.replace(/\.[^.]+$/, "");
      const ext = file.name.split(".").pop() || "jpg";
      const r2Key = `${r2Dir}/${baseName}.${ext}`;
      await c.env.R2.put(r2Key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type || "image/jpeg" }
      });
      uploaded++;
    }
  }
  return c.json({ success: true, uploaded });
});
imagesRoutes.put("/:id/primary", async (c) => {
  const id = c.req.param("id");
  const image = await c.env.DB.prepare("SELECT character_id FROM images WHERE id = ?").bind(id).first();
  if (!image || !image.character_id) return c.json({ error: "Image not found or no character assigned" }, 400);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE images SET is_primary = 0 WHERE character_id = ?").bind(image.character_id),
    c.env.DB.prepare("UPDATE images SET is_primary = 1, updated_at = datetime('now') WHERE id = ?").bind(id)
  ]);
  return c.json({ success: true });
});
imagesRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const image = await c.env.DB.prepare("SELECT r2_key, filename FROM images WHERE id = ?").bind(id).first();
  if (!image) return c.json({ error: "Not found" }, 404);
  const baseName = image.filename.replace(/\.[^.]+$/, "");
  const ext = image.filename.split(".").pop() || "jpg";
  const paths22 = [
    `originals/${baseName}.${ext}`,
    `sns/instagram/${baseName}.${ext}`,
    `sns/x/${baseName}.${ext}`,
    `sns/facebook/${baseName}.${ext}`,
    `navi/card/${baseName}.${ext}`,
    `navi/detail/${baseName}.${ext}`,
    `navi/thumb/${baseName}.${ext}`
  ];
  for (const path of paths22) {
    await c.env.R2.delete(path);
  }
  await c.env.DB.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var postsRoutes = new Hono2();
function approvalCAS(g, old) {
  if (!g.managed) return { sql: "", args: [] };
  const keys = ["ig_editorial_mode", "ig_three_plays_manifest_v1", "ig_three_plays_evidence_v1"];
  let sql = keys.map(() => " AND EXISTS(SELECT 1 FROM settings WHERE key=? AND value=?)").join("");
  const args = keys.flatMap((k) => [k, g.settings[k]]);
  if (old) for (const k of ["theme", "post_date", "publish_slot", "image_id", "character_id", "instagram_text", "instagram_hashtags", "content_type", "auto_publish", "status"]) {
    sql += " AND " + k + " IS ?";
    args.push(old[k] ?? null);
  }
  return { sql, args };
}
async function isPrivacyExcluded(env, imageId) {
  const image = await env.DB.prepare(
    "SELECT privacy_excluded FROM images WHERE id = ?"
  ).bind(imageId).first();
  return image?.privacy_excluded === 1;
}
postsRoutes.get("/", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const status32 = c.req.query("status");
  let query = "SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key FROM posts p LEFT JOIN characters c ON p.character_id = c.id LEFT JOIN images i ON p.image_id = i.id WHERE 1=1";
  const params = [];
  if (from) {
    query += " AND p.post_date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND p.post_date <= ?";
    params.push(to);
  }
  if (status32) {
    query += " AND p.status = ?";
    params.push(status32);
  }
  query += " ORDER BY p.post_date ASC";
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});
postsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row32 = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key,
            COALESCE(i.privacy_excluded, 0) as image_privacy_excluded,
            qp.question as quiz_question, qp.options as quiz_options,
            qp.correct_answer as quiz_correct_answer, qp.explanation as quiz_explanation
     FROM posts p
     LEFT JOIN characters c ON p.character_id = c.id
     LEFT JOIN images i ON p.image_id = i.id
     LEFT JOIN quiz_posts qp ON qp.post_id = p.id
     WHERE p.id = ?`
  ).bind(id).first();
  if (!row32) return c.json({ error: "Not found" }, 404);
  return c.json(row32);
});
postsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const imageId = body.image_id ? Number(body.image_id) : null;
  const slot = body.publish_slot || "morning";
  if (!["morning", "evening"].includes(slot)) return c.json({ error: "Invalid feed slot" }, 400);
  if (imageId && await isPrivacyExcluded(c.env, imageId)) {
    return c.json({ error: "\u3053\u306E\u5199\u771F\u306F\u500B\u4EBA\u60C5\u5831\u4FDD\u8B77\u306E\u305F\u3081\u6295\u7A3F\u5BFE\u8C61\u5916\u3067\u3059" }, 400);
  }
  const proposed = { ...body, id: 0, image_id: imageId, character_id: body.character_id || null, publish_slot: slot, content_type: body.content_type || "photo", instagram_text: body.instagram_text || null, instagram_hashtags: body.instagram_hashtags || null };
  const gate = body.auto_publish === 1 || body.status === "approved" ? await guardThreePlayApproval(c.env, proposed) : { managed: false, settings: {} };
  if (gate.error) return c.json({ error: gate.error }, 409);
  const cas = approvalCAS(gate);
  const result = await c.env.DB.prepare(
    `INSERT INTO posts (post_date, day_of_week, theme, image_id, character_id, special_day, instagram_text, instagram_hashtags, x_text, x_hashtags, facebook_text, facebook_hashtags, cta_type, cta_url, status, auto_publish, publish_slot,content_type)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE 1=1 ${cas.sql}`
  ).bind(
    body.post_date,
    body.day_of_week,
    body.theme,
    imageId,
    body.character_id || null,
    body.special_day || null,
    body.instagram_text || null,
    body.instagram_hashtags || null,
    body.x_text || null,
    body.x_hashtags || null,
    body.facebook_text || null,
    body.facebook_hashtags || null,
    body.cta_type || null,
    body.cta_url || null,
    body.status || "draft",
    body.auto_publish === 1 ? 1 : 0,
    slot,
    gate.managed ? proposed.content_type : "photo",
    ...cas.args
  ).run();
  if (!result.meta.changes) return c.json({ error: "\u627F\u8A8D\u6839\u62E0\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  return c.json({ id: result.meta.last_row_id }, 201);
});
postsRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const b = await c.req.json();
  const old = await c.env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
  if (!old) return c.json({ error: "Not found" }, 404);
  if (old.instagram_posted || !["idle", "failed"].includes(String(old.publish_state))) return c.json({ error: "\u516C\u958B\u6E08\u307F\u30FB\u51E6\u7406\u4E2D\u306E\u6295\u7A3F\u306F\u5909\u66F4\u3067\u304D\u307E\u305B\u3093" }, 409);
  const allowed = ["theme", "image_id", "character_id", "special_day", "instagram_text", "instagram_hashtags", "cta_type", "cta_url", "quiz_answer_comment", "auto_publish", "content_type", "publish_slot"];
  const updates = {};
  for (const k of allowed) if (k in b) updates[k] = b[k];
  if ("image_id" in updates && updates.image_id && await isPrivacyExcluded(c.env, Number(updates.image_id))) return c.json({ error: "\u6295\u7A3F\u9664\u5916\u306E\u5199\u771F\u3067\u3059" }, 400);
  if ("auto_publish" in updates) updates.auto_publish = updates.auto_publish === 1 ? 1 : 0;
  if ("publish_slot" in updates && !["morning", "evening"].includes(String(updates.publish_slot))) return c.json({ error: "Invalid feed slot" }, 400);
  if ("content_type" in updates && !["photo", "reel"].includes(String(updates.content_type))) return c.json({ error: "Invalid content type" }, 400);
  if ("image_id" in updates && updates.image_id !== old.image_id && (!("instagram_text" in updates) || updates.instagram_text === old.instagram_text)) {
    updates.instagram_text = null;
    updates.instagram_hashtags = null;
  }
  const keys = Object.keys(updates);
  if (!keys.length) return c.json({ success: true });
  const proposed = { ...old, ...updates };
  const gate = proposed.auto_publish === 1 ? await guardThreePlayApproval(c.env, proposed) : { managed: false, settings: {} };
  if (gate.error) return c.json({ error: gate.error }, 409);
  const cas = approvalCAS(gate, old);
  const sql = keys.map((k) => k + "=?").join(",");
  const result = await c.env.DB.prepare(`UPDATE posts SET ${sql},publish_container_id=NULL,publish_state='idle',updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed') ${cas.sql}`).bind(...keys.map((k) => updates[k] ?? null), id, ...cas.args).run();
  if (!result.meta.changes) return c.json({ error: "\u627F\u8A8D\u6839\u62E0\u307E\u305F\u306F\u6295\u7A3F\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  return c.json({ success: true });
});
postsRoutes.post("/:id/schedule", async (c) => {
  const id = Number(c.req.param("id"));
  const { date } = await c.req.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date(Date.now() + 324e5).toISOString().slice(0, 10)) return c.json({ error: "\u4ECA\u65E5\u4EE5\u964D\u306E\u65E5\u4ED8\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
  const p2 = await c.env.DB.prepare(`SELECT p.*,i.verified,i.privacy_excluded FROM posts p LEFT JOIN images i ON i.id=p.image_id WHERE p.id=?`).bind(id).first();
  if (!p2 || p2.instagram_posted || !p2.verified || p2.privacy_excluded || !["idle", "failed"].includes(String(p2.publish_state))) return c.json({ error: "\u672A\u516C\u958B\u3067\u5199\u771F\u30C1\u30A7\u30C3\u30AF\u6E08\u307F\u306E\u6295\u7A3F\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 409);
  const proposed = { ...p2, post_date: date, auto_publish: 1, status: "approved", content_type: String(p2.theme).startsWith("ig3:") ? "photo" : "reel" };
  const gate = await guardThreePlayApproval(c.env, proposed);
  if (gate.error) return c.json({ error: gate.error }, 409);
  const cas = approvalCAS(gate, p2);
  const settingsCAS = approvalCAS(gate);
  const active22 = await c.env.DB.prepare(`SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain'))`).bind(date, p2.publish_slot).first();
  if (active22) return c.json({ error: "\u3053\u306E\u65E5\u306E\u540C\u3058\u6642\u9593\u5E2F\u306F\u51E6\u7406\u4E2D\u307E\u305F\u306F\u516C\u958B\u6E08\u307F\u3067\u3059" }, 409);
  const results = await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE posts SET auto_publish=0 WHERE post_date=? AND publish_slot=? AND id<>? AND instagram_posted=0 AND publish_state IN ('idle','failed') ${settingsCAS.sql}`).bind(date, p2.publish_slot, id, ...settingsCAS.args),
    c.env.DB.prepare(`UPDATE posts SET post_date=?,day_of_week=?,auto_publish=1,status='approved',content_type=?,publish_state='idle',publish_container_id=NULL,updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed') ${cas.sql}`).bind(date, (/* @__PURE__ */ new Date(`${date}T00:00:00Z`)).getUTCDay(), proposed.content_type, id, ...cas.args)
  ]);
  if (!results[1].meta.changes) return c.json({ error: "\u627F\u8A8D\u6839\u62E0\u307E\u305F\u306F\u6295\u7A3F\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  return c.json({ success: true });
});
postsRoutes.put("/:id/status", async (c) => {
  const id = c.req.param("id");
  const { status: status32 } = await c.req.json();
  if (!["draft", "approved"].includes(status32)) {
    return c.json({ error: "Invalid status" }, 400);
  }
  const old = await c.env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
  if (!old) return c.json({ error: "Not found" }, 404);
  const gate = status32 === "approved" ? await guardThreePlayApproval(c.env, { ...old, status: status32, auto_publish: 1 }) : { managed: false, settings: {} };
  if (gate.error) return c.json({ error: gate.error }, 409);
  const cas = approvalCAS(gate, old);
  const result = await c.env.DB.prepare(
    `UPDATE posts SET status=?,auto_publish=?, updated_at=datetime('now') WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed') ${cas.sql}`
  ).bind(status32, status32 === "approved" ? 1 : 0, id, ...cas.args).run();
  if (!result.meta.changes) return c.json({ error: "\u627F\u8A8D\u6839\u62E0\u307E\u305F\u306F\u6295\u7A3F\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  return c.json({ success: true });
});
postsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM posts WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed') AND NOT EXISTS(SELECT 1 FROM reel_jobs WHERE post_id=posts.id)").bind(id).run();
  return c.json({ success: true });
});
var DAY_THEMES = {
  1: "\u6F14\u76EE",
  // Monday
  2: "\u5F79\u8005",
  // Tuesday
  3: "\u8C46\u77E5\u8B58",
  // Wednesday
  4: "\u540D\u5834\u9762",
  // Thursday
  5: "\u30AF\u30A4\u30BA",
  // Friday
  6: "\u821E\u53F0\u88CF",
  // Saturday
  0: "\u6B74\u53F2"
  // Sunday
};
function getSeason(month) {
  if (month >= 4 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
var CTA_DISTRIBUTION = {
  1: "N",
  // Monday — no CTA
  2: "B",
  // Tuesday — performance info
  3: "N",
  // Wednesday — no CTA
  4: "N",
  // Thursday — no CTA
  5: "D",
  // Friday — quiz teaser
  6: "N",
  // Saturday — no CTA
  0: "C"
  // Sunday — experience
};
var FEATURES = [
  // ── KABUKI PLUS+ ──
  {
    name: "KABUKI NAVI\uFF08\u6F14\u76EE\u30AC\u30A4\u30C9\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/navi/enmoku",
    description: "21\u306E\u6B4C\u821E\u4F0E\u6F14\u76EE\u3092\u3001\u3042\u3089\u3059\u3058\u30FB\u898B\u3069\u3053\u308D\u30FB\u914D\u5F79\u4ED8\u304D\u3067\u308F\u304B\u308A\u3084\u3059\u304F\u89E3\u8AAC\u3002\u521D\u5FC3\u8005\u3067\u3082\u5B89\u5FC3\u306E\u30AC\u30A4\u30C9\u3002",
    highlights: ["\u5168\u6587\u691C\u7D22", "\u5E55\u69CB\u6210\u30FB\u914D\u5F79\u30FB\u3042\u3089\u3059\u3058\u30FB\u898B\u3069\u3053\u308D", "\u767B\u5834\u4EBA\u7269\u306E\u8A73\u3057\u3044\u7D39\u4ECB"],
    ogpImage: "feature_navi_enmoku.png",
    imageAlt: "KABUKI NAVI\u306E\u6F14\u76EE\u30AC\u30A4\u30C9\u753B\u9762\u3002\u6F14\u76EE\u4E00\u89A7\u3068\u8A73\u7D30\u30DA\u30FC\u30B8\u306E\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8",
    story: "\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u30E1\u30F3\u30D0\u30FC\u304C\u6F14\u76EE\u306E\u7A3D\u53E4\u306B\u5165\u308B\u3068\u304D\u3001\u3042\u3089\u3059\u3058\u3084\u914D\u5F79\u3092\u307E\u3068\u3081\u305F\u8CC7\u6599\u304C\u30D0\u30E9\u30D0\u30E9\u3067\u6BCE\u56DE\u63A2\u3059\u306E\u304C\u5927\u5909\u3060\u3063\u305F\u3002\u300C\u4E00\u7B87\u6240\u306B\u307E\u3068\u307E\u3063\u3066\u3044\u308C\u3070\u300D\u3068\u3044\u3046\u58F0\u304B\u3089\u751F\u307E\u308C\u305F\u6F14\u76EE\u30AC\u30A4\u30C9\u3002"
  },
  {
    name: "KABUKI NAVI\uFF08\u7528\u8A9E\u8F9E\u5178\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/navi/glossary",
    description: "126\u8A9E\u306E\u6B4C\u821E\u4F0E\u7528\u8A9E\u30928\u30AB\u30C6\u30B4\u30EA\u3067\u53CE\u9332\u3002\u8AAD\u307F\u304C\u306A\u3068\u308F\u304B\u308A\u3084\u3059\u3044\u89E3\u8AAC\u4ED8\u304D\u3002",
    highlights: ["126\u8A9E\u30FB8\u30AB\u30C6\u30B4\u30EA", "\u8AAD\u307F\u304C\u306A\u4ED8\u304D", "\u30AB\u30C6\u30B4\u30EA\u5225\u95B2\u89A7"],
    ogpImage: "feature_navi_glossary.png",
    imageAlt: "KABUKI NAVI\u306E\u7528\u8A9E\u8F9E\u5178\u753B\u9762\u3002\u30AB\u30C6\u30B4\u30EA\u5225\u306E\u6B4C\u821E\u4F0E\u7528\u8A9E\u4E00\u89A7",
    story: "\u5730\u6B4C\u821E\u4F0E\u306E\u516C\u6F14\u306B\u6765\u3066\u304F\u308C\u305F\u304A\u5BA2\u3055\u3093\u304B\u3089\u300C\u82B1\u9053\u3063\u3066\u4F55\uFF1F\u300D\u300C\u4E0B\u5EA7\u97F3\u697D\u3063\u3066\uFF1F\u300D\u3068\u805E\u304B\u308C\u308B\u3053\u3068\u304C\u591A\u304B\u3063\u305F\u3002\u89B3\u5287\u524D\u306B\u3055\u3063\u3068\u8ABF\u3079\u3089\u308C\u308B\u8F9E\u5178\u304C\u3042\u308C\u3070\u3068\u601D\u3044\u3001\u30E1\u30F3\u30D0\u30FC\u306E\u77E5\u8B58\u3092\u96C6\u3081\u3066\u4F5C\u3063\u305F\u3002"
  },
  {
    name: "KABUKI NAVI\uFF08\u89B3\u5287\u30CA\u30D3\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/navi/kangekinavi",
    description: "\u521D\u5FC3\u8005\u5411\u30516\u30B9\u30C6\u30C3\u30D7\u3067\u6B4C\u821E\u4F0E\u89B3\u5287\u3092\u30CA\u30D3\u30B2\u30FC\u30C8\u3002\u30C1\u30B1\u30C3\u30C8\u8CFC\u5165\u304B\u3089\u30DE\u30CA\u30FC\u307E\u3067\u3002",
    highlights: ["\u30C1\u30B1\u30C3\u30C8\u2192\u30A2\u30AF\u30BB\u30B9\u2192\u5EA7\u5E2D\u2192\u30DE\u30CA\u30FC\u2192\u639B\u3051\u58F0\u2192\u96F0\u56F2\u6C17", "\u5199\u771F\u3064\u304D\u30AC\u30A4\u30C9"],
    ogpImage: "feature_navi_kangeki.png",
    imageAlt: "KABUKI NAVI\u306E\u89B3\u5287\u30CA\u30D3\u753B\u9762\u3002\u521D\u5FC3\u8005\u5411\u30516\u30B9\u30C6\u30C3\u30D7\u30AC\u30A4\u30C9",
    story: "\u300C\u6B4C\u821E\u4F0E\u3092\u89B3\u3066\u307F\u305F\u3044\u3051\u3069\u3001\u4F55\u304B\u3089\u59CB\u3081\u308C\u3070\uFF1F\u300D\u3068\u3044\u3046\u53CB\u4EBA\u3084\u77E5\u4EBA\u306E\u58F0\u304C\u591A\u304B\u3063\u305F\u3002\u30C1\u30B1\u30C3\u30C8\u306E\u8CB7\u3044\u65B9\u304B\u3089\u5F53\u65E5\u306E\u904E\u3054\u3057\u65B9\u307E\u3067\u3001\u521D\u3081\u3066\u306E\u4EBA\u304C\u8FF7\u308F\u306A\u3044\u30AC\u30A4\u30C9\u3092\u4F5C\u308A\u305F\u304B\u3063\u305F\u3002"
  },
  {
    name: "KABUKI LIVE\uFF08\u516C\u6F14\u60C5\u5831\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/live",
    description: "\u6B4C\u821E\u4F0E\u5EA7\u30FB\u65B0\u6A4B\u6F14\u821E\u5834\u30FB\u5357\u5EA7\u306A\u3069\u5168\u56FD6\u5927\u5287\u5834\u306E\u516C\u6F14\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u66F4\u65B0\u3002",
    highlights: ["6\u5927\u5287\u5834\u306E\u516C\u6F14\u60C5\u5831", "\u6B4C\u821E\u4F0E\u30CB\u30E5\u30FC\u30B9\u81EA\u52D5\u53CE\u96C6", "\u958B\u5E55\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3"],
    ogpImage: "feature_live.png",
    imageAlt: "KABUKI LIVE\u306E\u516C\u6F14\u60C5\u5831\u753B\u9762\u3002\u5168\u56FD\u4E3B\u8981\u5287\u5834\u306E\u516C\u6F14\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u4E00\u89A7",
    story: "\u300C\u4ECA\u6708\u3069\u3053\u3067\u4F55\u3084\u3063\u3066\u308B\uFF1F\u300D\u3092\u8ABF\u3079\u308B\u306E\u306B\u6BCE\u56DE\u3042\u3061\u3053\u3061\u306E\u30B5\u30A4\u30C8\u3092\u56DE\u308B\u306E\u304C\u9762\u5012\u3060\u3063\u305F\u3002\u5168\u56FD\u306E\u6B4C\u821E\u4F0E\u516C\u6F14\u60C5\u5831\u3092\u4E00\u7B87\u6240\u3067\u898B\u3089\u308C\u308B\u3088\u3046\u306B\u3057\u305F\u304F\u3066\u4F5C\u3063\u305F\u3002"
  },
  {
    name: "KABUKI RECO\uFF08\u89B3\u5287\u8A18\u9332\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/reco",
    description: "\u89B3\u305F\u6B4C\u821E\u4F0E\u3092\u8A18\u9332\u30FB\u632F\u308A\u8FD4\u308A\u3002\u304A\u6C17\u306B\u5165\u308A\u4FF3\u512A\u306E\u7BA1\u7406\u3001\u6708\u6B21\u30B5\u30DE\u30EA\u30FC\u3001SNS\u30B7\u30A7\u30A2\u3002",
    highlights: ["\u89B3\u5287\u30ED\u30B0500\u4EF6", "\u7D71\u8A08\u30FB\u30C1\u30E3\u30FC\u30C8", "SNS\u30B7\u30A7\u30A2\u30FB\u516C\u958B\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB", "11\u6BB5\u968E\u30E9\u30F3\u30AF\u79F0\u53F7"],
    ogpImage: "feature_reco.png",
    imageAlt: "KABUKI RECO\u306E\u89B3\u5287\u8A18\u9332\u753B\u9762\u3002\u7D71\u8A08\u30C1\u30E3\u30FC\u30C8\u3068\u30E9\u30F3\u30AD\u30F3\u30B0\u8868\u793A",
    story: "\u30E1\u30F3\u30D0\u30FC\u306E\u4E2D\u306B\u300C\u4ECA\u5E74\u4F55\u56DE\u89B3\u5287\u3057\u305F\uFF1F\u300D\u300C\u3042\u306E\u6F14\u76EE\u3044\u3064\u89B3\u305F\u3063\u3051\uFF1F\u300D\u3068\u632F\u308A\u8FD4\u308A\u305F\u3044\u4EBA\u304C\u591A\u304B\u3063\u305F\u3002\u6620\u753B\u306E\u8A18\u9332\u30A2\u30D7\u30EA\u306E\u3088\u3046\u306B\u3001\u6B4C\u821E\u4F0E\u306E\u89B3\u5287\u3082\u8A18\u9332\u3057\u3066\u697D\u3057\u3081\u308B\u3088\u3046\u306B\u3057\u305F\u304B\u3063\u305F\u3002"
  },
  {
    name: "KABUKI DOJO\uFF08\u6B4C\u821E\u4F0E\u30AF\u30A4\u30BA\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/dojo/quiz",
    description: "3\u6BB5\u968E\u306E\u96E3\u6613\u5EA6\u3067\u6B4C\u821E\u4F0E\u306E\u77E5\u8B58\u3092\u697D\u3057\u304F\u30C6\u30B9\u30C8\u3002\u521D\u7D1A\u304B\u3089\u4E0A\u7D1A\u307E\u3067\u6311\u6226\u3002",
    highlights: ["\u521D\u7D1A\u30FB\u4E2D\u7D1A\u30FB\u4E0A\u7D1A", "10\u30B9\u30C6\u30FC\u30B8\u5236", "70%\u4EE5\u4E0A\u3067\u6B21\u306E\u96E3\u6613\u5EA6\u30A2\u30F3\u30ED\u30C3\u30AF"],
    ogpImage: "feature_dojo_quiz.png",
    imageAlt: "KABUKI DOJO\u306E\u30AF\u30A4\u30BA\u753B\u9762\u30023\u6BB5\u968E\u306E\u96E3\u6613\u5EA6\u9078\u629E\u3068\u30B9\u30C6\u30FC\u30B8\u8868\u793A",
    story: "\u5730\u6B4C\u821E\u4F0E\u306E\u516C\u6F14\u306E\u5E55\u9593\u3067\u3001\u304A\u5BA2\u3055\u3093\u306B\u697D\u3057\u3093\u3067\u3082\u3089\u3048\u308B\u30AF\u30A4\u30BA\u30B3\u30FC\u30CA\u30FC\u3092\u3084\u3063\u3066\u3044\u305F\u3002\u300C\u30B9\u30DE\u30DB\u3067\u3044\u3064\u3067\u3082\u3067\u304D\u305F\u3089\u9762\u767D\u3044\u306E\u306B\u300D\u3068\u3044\u3046\u767A\u60F3\u304B\u3089\u30AF\u30A4\u30BA\u6A5F\u80FD\u304C\u751F\u307E\u308C\u305F\u3002"
  },
  {
    name: "KABUKI DOJO\uFF08\u5927\u5411\u3046\u9053\u5834\uFF09",
    brand: "KABUKI+",
    path: "/training/kakegoe",
    description: "\u52D5\u753B\u306B\u5408\u308F\u305B\u3066\u639B\u3051\u58F0\u3068\u62CD\u624B\u306E\u30BF\u30A4\u30DF\u30F3\u30B0\u3092\u7DF4\u7FD2\u3002\u767D\u6D6A\u4E94\u4EBA\u7537\u3067\u5B9F\u8DF5\u3002",
    highlights: ["\u52D5\u753B\u9023\u52D5", "\u639B\u3051\u58F0\uFF06\u62CD\u624B\u30BF\u30A4\u30DF\u30F3\u30B0\u7DF4\u7FD2", "\u304A\u3072\u306D\u308A\u30DC\u30FC\u30CA\u30B9"],
    ogpImage: "feature_dojo_kakegoe.png",
    imageAlt: "KABUKI DOJO\u306E\u5927\u5411\u3046\u9053\u5834\u753B\u9762\u3002\u52D5\u753B\u9023\u52D5\u306E\u639B\u3051\u58F0\u7DF4\u7FD2\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9",
    story: "\u5C90\u961C\u5927\u5B66\u306E\u7559\u5B66\u751F\u3068\u306E\u5730\u6B4C\u821E\u4F0E\u4F53\u9A13\u4EA4\u6D41\u4F1A\u3067\u300C\u304A\u3072\u306D\u308A\u3063\u3066\u3069\u306E\u30BF\u30A4\u30DF\u30F3\u30B0\u3067\u6295\u3052\u308B\u306E\uFF1F\u300D\u300C\u5927\u5411\u3053\u3046\u306F\uFF1F\u300D\u3068\u3044\u3046\u58F0\u3092\u805E\u3044\u305F\u3002\u305D\u308C\u304C\u304D\u3063\u304B\u3051\u3067\u3001\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u516C\u6F14\u52D5\u753B\u3092\u4F7F\u3063\u3066\u904A\u3073\u306A\u304C\u3089\u639B\u3051\u58F0\u3084\u304A\u3072\u306D\u308A\u306E\u30BF\u30A4\u30DF\u30F3\u30B0\u3092\u5B66\u3079\u308B\u6A5F\u80FD\u3092\u4F5C\u3063\u305F\u3002"
  },
  {
    name: "\u3051\u3089\u306E\u3059\u3051\uFF08AI\u30C1\u30E3\u30C3\u30C8\uFF09",
    brand: "KABUKI+",
    path: "/kabuki/chat",
    description: "AI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u300C\u3051\u3089\u306E\u3059\u3051\u300D\u306B\u6B4C\u821E\u4F0E\u306E\u3053\u3068\u3092\u4F55\u3067\u3082\u8CEA\u554F\u3002\u6F14\u76EE\u30FB\u7528\u8A9E\u30FB\u516C\u6F14\u60C5\u5831\u3092RAG\u3067\u56DE\u7B54\u3002",
    highlights: ["\u6B4C\u821E\u4F0E\u5C02\u9580AI", "\u6F14\u76EE\u30FB\u7528\u8A9E\u306E\u77E5\u8B58\u30D9\u30FC\u30B9", "LINE\u3067\u3082\u5229\u7528\u53EF\u80FD"],
    ogpImage: "feature_chat.png",
    imageAlt: "\u3051\u3089\u306E\u3059\u3051AI\u30C1\u30E3\u30C3\u30C8\u306E\u4F1A\u8A71\u753B\u9762\u3002\u6B4C\u821E\u4F0E\u306B\u95A2\u3059\u308BQ&A\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9",
    story: "\u6B4C\u821E\u4F0E\u306E\u8CEA\u554F\u3092\u3057\u305F\u304F\u3066\u3082\u3001\u8A73\u3057\u3044\u4EBA\u304C\u8FD1\u304F\u306B\u3044\u308B\u3068\u306F\u9650\u3089\u306A\u3044\u3002AI\u306A\u308924\u6642\u9593\u3044\u3064\u3067\u3082\u6C17\u8EFD\u306B\u805E\u3051\u308B\u3002NAVI\u306B\u84C4\u7A4D\u3057\u305F\u6F14\u76EE\u30FB\u7528\u8A9E\u306E\u30C7\u30FC\u30BF\u3092\u6D3B\u304B\u3057\u3066\u6B4C\u821E\u4F0E\u5C02\u9580\u306EAI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3092\u4F5C\u3063\u305F\u3002"
  },
  // ── JIKABUKI PLUS+ ──
  {
    name: "JIKABUKI GATE\uFF08\u56E3\u4F53\u516C\u5F0F\u30DA\u30FC\u30B8\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/gate",
    description: "\u5730\u6B4C\u821E\u4F0E\u30FB\u5730\u829D\u5C45\u306E\u56E3\u4F53\u304C\u81EA\u5206\u305F\u3061\u306E\u516C\u5F0F\u30DA\u30FC\u30B8\u3092\u7C21\u5358\u306B\u4F5C\u6210\u30FB\u904B\u55B6\u3067\u304D\u308B\u30B5\u30FC\u30D3\u30B9\u3002",
    highlights: ["8\u7A2E\u985E\u306E\u30C6\u30FC\u30DE", "\u516C\u6F14\u6848\u5185\u30FB\u30CB\u30E5\u30FC\u30B9\u30FBFAQ", "\u30DE\u30EB\u30C1\u30C6\u30CA\u30F3\u30C8\u5BFE\u5FDC"],
    ogpImage: "feature_gate.png",
    imageAlt: "JIKABUKI GATE\u306E\u56E3\u4F53\u516C\u5F0F\u30DA\u30FC\u30B8\u3002\u30C6\u30FC\u30DE\u9078\u629E\u3068\u516C\u6F14\u6848\u5185\u306E\u7BA1\u7406\u753B\u9762",
    story: "\u5730\u6B4C\u821E\u4F0E\u306E\u56E3\u4F53\u306FWeb\u30B5\u30A4\u30C8\u3092\u6301\u3063\u3066\u3044\u306A\u3044\u3068\u3053\u308D\u304C\u591A\u3044\u3002\u6C17\u826F\u6B4C\u821E\u4F0E\u3082\u6700\u521D\u306FSNS\u3060\u3051\u3060\u3063\u305F\u3002IT\u306B\u8A73\u3057\u304F\u306A\u304F\u3066\u3082\u7C21\u5358\u306B\u516C\u5F0F\u30DA\u30FC\u30B8\u3092\u6301\u3066\u308B\u3088\u3046\u306B\u3057\u305F\u304B\u3063\u305F\u3002"
  },
  {
    name: "JIKABUKI INFO\uFF08\u5730\u6B4C\u821E\u4F0E\u60C5\u5831\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/info",
    description: "\u5168\u56FD\u306E\u5730\u6B4C\u821E\u4F0E\u30FB\u5730\u829D\u5C45\u56E3\u4F53\u306E\u4E00\u89A7\u3001\u829D\u5C45\u5C0F\u5C4B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3001\u30A4\u30D9\u30F3\u30C8\u60C5\u5831\u3092\u96C6\u7D04\u3002",
    highlights: ["\u5168\u56FD\u306E\u56E3\u4F53\u691C\u7D22", "\u829D\u5C45\u5C0F\u5C4B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9", "\u5730\u6B4C\u821E\u4F0E\u30CB\u30E5\u30FC\u30B9"],
    ogpImage: "feature_info.png",
    imageAlt: "JIKABUKI INFO\u306E\u5730\u6B4C\u821E\u4F0E\u60C5\u5831\u753B\u9762\u3002\u5168\u56FD\u306E\u56E3\u4F53\u4E00\u89A7\u3068\u829D\u5C45\u5C0F\u5C4B\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9",
    story: "\u5168\u56FD\u306B\u5730\u6B4C\u821E\u4F0E\u306E\u56E3\u4F53\u304C\u305F\u304F\u3055\u3093\u3042\u308B\u306E\u306B\u3001\u60C5\u5831\u304C\u307E\u3068\u307E\u3063\u3066\u3044\u306A\u304F\u3066\u4E92\u3044\u306E\u5B58\u5728\u3092\u77E5\u3089\u306A\u3044\u3053\u3068\u3082\u591A\u3044\u3002\u5730\u6B4C\u821E\u4F0E\u306E\u4E16\u754C\u3092\u3064\u306A\u3050\u30DD\u30FC\u30BF\u30EB\u3092\u4F5C\u308A\u305F\u304B\u3063\u305F\u3002"
  },
  {
    name: "JIKABUKI BASE\uFF08\u53F0\u672C\u5171\u6709\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/base",
    description: "\u30C7\u30B8\u30BF\u30EB\u53F0\u672C\u306E\u7BA1\u7406\u30FB\u95B2\u89A7\u6A5F\u80FD\u3002\u30B9\u30DE\u30DB\u3084\u30BF\u30D6\u30EC\u30C3\u30C8\u3067\u53F0\u672C\u3092\u8868\u793A\u3001\u4ED6\u306E\u56E3\u4F53\u3068\u3082\u5171\u6709\u3067\u304D\u308B\u3002",
    highlights: ["\u30B9\u30DE\u30DB\u30FB\u30BF\u30D6\u30EC\u30C3\u30C8\u3067\u53F0\u672C\u8868\u793A", "\u30C7\u30B8\u30BF\u30EB\u30C7\u30FC\u30BF\u3067\u691C\u7D22", "\u56E3\u4F53\u9593\u3067\u53F0\u672C\u5171\u6709"],
    ogpImage: "feature_base.png",
    imageAlt: "JIKABUKI BASE\u306E\u53F0\u672C\u7BA1\u7406\u753B\u9762",
    story: "\u6C17\u826F\u6B4C\u821E\u4F0E\u3067\u306F\u53F0\u672C\u3092\u7D19\u3067\u306F\u306A\u304F\u30B9\u30DE\u30DB\u3084\u30BF\u30D6\u30EC\u30C3\u30C8\u3067\u8868\u793A\u3057\u3066\u3044\u308B\u3002\u30C7\u30B8\u30BF\u30EB\u30C7\u30FC\u30BF\u306A\u3089\u691C\u7D22\u3082\u3067\u304D\u308B\u3057\u3001\u4F55\u3088\u308A\u4ED6\u306E\u56E3\u4F53\u3068\u3082\u5171\u6709\u3067\u304D\u308B\u3002\u53C2\u52A0\u56E3\u4F53\u3092\u52DF\u96C6\u4E2D\u3067\u3001\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u53F0\u672C\u30C7\u30FC\u30BF\u306F\u3054\u81EA\u7531\u306B\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\uFF08\u53C2\u8003\u306B\u306A\u308B\u304B\u306F\u308F\u304B\u3089\u306A\u3044\u3051\u3069\uFF09\u3002"
  },
  {
    name: "JIKABUKI BASE\uFF08\u516C\u6F14\u8A18\u9332\u30FB\u5F79\u8005DB\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/base",
    description: "\u904E\u53BB\u306E\u516C\u6F14\u8A18\u9332\u30A2\u30FC\u30AB\u30A4\u30D6\u3068\u5F79\u8005\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3002\u8AB0\u304C\u3069\u3093\u306A\u5F79\u3092\u6F14\u3058\u3066\u304D\u305F\u304B\u3092\u4E00\u89A7\u3067\u78BA\u8A8D\u3001\u6B21\u306E\u914D\u5F79\u6C7A\u3081\u306B\u3082\u6D3B\u7528\u3002",
    highlights: ["\u516C\u6F14\u8A18\u9332\u30A2\u30FC\u30AB\u30A4\u30D6", "\u5F79\u8005\u306E\u51FA\u6F14\u5C65\u6B74DB", "\u914D\u5F79\u6C7A\u3081\u306E\u53C2\u8003\u8CC7\u6599"],
    ogpImage: "feature_base.png",
    imageAlt: "JIKABUKI BASE\u306E\u516C\u6F14\u8A18\u9332\u30FB\u5F79\u8005DB\u753B\u9762",
    story: "\u6C17\u826F\u6B4C\u821E\u4F0E20\u5E74\u3084\u3063\u3066\u304D\u3066\u3001\u305D\u308D\u305D\u308D\u904E\u53BB\u306E\u516C\u6F14\u8A18\u9332\u3092\u6574\u7406\u3057\u3088\u3046\u3068\u601D\u3044\u7ACB\u3063\u305F\u3002\u8AB0\u304C\u3069\u3093\u306A\u5F79\u3092\u3084\u3063\u3066\u304D\u305F\u306E\u304B\u304C\u308F\u304B\u308B\u5F79\u8005DB\u6A5F\u80FD\u3092\u4F5C\u3063\u3066\u3001\u6B21\u306E\u914D\u5F79\u6C7A\u3081\u306B\u3082\u8EE2\u7528\u3067\u304D\u308B\u3088\u3046\u306B\u3057\u305F\u3002"
  },
  {
    name: "JIKABUKI BASE\uFF08\u6F14\u76EE\u9078\u3073\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/base",
    description: "\u6B21\u306E\u516C\u6F14\u306E\u6F14\u76EE\u9078\u3073\u3092\u652F\u63F4\u3002\u904E\u53BB\u306E\u4E0A\u6F14\u5C65\u6B74\u30FB\u4E0A\u6F14\u6642\u9593\u30FB\u5B50\u5F79\u306E\u6709\u7121\u30FB\u51FA\u6F14\u4EBA\u6570\u306A\u3069\u306E\u6761\u4EF6\u3067\u6F14\u76EE\u3092\u7D5E\u308A\u8FBC\u3081\u308B\u3002",
    highlights: ["\u904E\u53BB\u306E\u4E0A\u6F14\u5C65\u6B74\u304B\u3089\u691C\u7D22", "\u4E0A\u6F14\u6642\u9593\u30FB\u5B50\u5F79\u6709\u7121\u3067\u7D5E\u308A\u8FBC\u307F", "\u51FA\u6F14\u53EF\u80FD\u4EBA\u6570\u304B\u3089\u5019\u88DC\u3092\u63D0\u6848"],
    ogpImage: "feature_base.png",
    imageAlt: "JIKABUKI BASE\u306E\u6F14\u76EE\u9078\u3073\u753B\u9762",
    story: "\u6F14\u76EE\u6C7A\u3081\u306B\u60A9\u3080\u5B63\u7BC0\u304C\u3084\u3063\u3066\u304F\u308B\u3002\u904E\u53BB\u306B\u6F14\u3058\u305F\u3082\u306E\u3001\u4E0A\u6F14\u6642\u9593\u3001\u5B50\u5F79\u306E\u3042\u308A\u306A\u3057\u3001\u51FA\u6F14\u53EF\u80FD\u4EBA\u6570\u2026\u3044\u308D\u3093\u306A\u6761\u4EF6\u3092\u8003\u3048\u306A\u304C\u3089\u7D5E\u3063\u3066\u3044\u304F\u4F5C\u696D\u306F\u5927\u5909\u3002\u305D\u308C\u3092\u52A9\u3051\u3066\u304F\u308C\u308B\u6A5F\u80FD\u3092\u4F5C\u3063\u305F\u3002"
  },
  {
    name: "JIKABUKI BASE\uFF08\u7A3D\u53E4\u30FB\u4F1A\u8A08\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/base",
    description: "\u7A3D\u53E4\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u30FB\u51FA\u6B20\u7BA1\u7406\u30FB\u53CE\u652F\u7BA1\u7406\u306A\u3069\u3001\u56E3\u4F53\u904B\u55B6\u306E\u65E5\u5E38\u696D\u52D9\u3092\u307E\u3068\u3081\u3066\u7BA1\u7406\u3002",
    highlights: ["\u7A3D\u53E4\u30AB\u30EC\u30F3\u30C0\u30FC\uFF06\u51FA\u6B20", "\u53CE\u652F\u7BA1\u7406", "LINE\u30B0\u30EB\u30FC\u30D7\uFF06\u7D19\u304B\u3089\u306E\u79FB\u884C"],
    ogpImage: "feature_base.png",
    imageAlt: "JIKABUKI BASE\u306E\u7A3D\u53E4\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u53CE\u652F\u7BA1\u7406\u306E\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    story: "\u7A3D\u53E4\u306E\u51FA\u6B20\u9023\u7D61\u306FLINE\u30B0\u30EB\u30FC\u30D7\u3001\u4F1A\u8A08\u306F\u7D19\u306E\u5E33\u7C3F\u2026\u30D0\u30E9\u30D0\u30E9\u3060\u3063\u305F\u56E3\u4F53\u904B\u55B6\u306E\u65E5\u5E38\u696D\u52D9\u3092\u4E00\u7B87\u6240\u306B\u307E\u3068\u3081\u305F\u304B\u3063\u305F\u3002\u81EA\u5206\u305F\u3061\u304C\u6BCE\u65E5\u4F7F\u3046\u3082\u306E\u3060\u304B\u3089\u3001\u4F7F\u3044\u3084\u3059\u3055\u306B\u3053\u3060\u308F\u3063\u3066\u4F5C\u3063\u305F\u3002"
  },
  {
    name: "JIKABUKI LABO\uFF08\u30B3\u30F3\u30C6\u30F3\u30C4\u7BA1\u7406\uFF09",
    brand: "JIKABUKI+",
    path: "/jikabuki/labo",
    description: "\u6F14\u76EE\u30FB\u7528\u8A9E\u30FB\u30AF\u30A4\u30BA\u306A\u3069\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u7DE8\u96C6\u30FB\u8FFD\u52A0\u3067\u304D\u308B\u30A8\u30C7\u30A3\u30BF\u30FC\u3002\u307F\u3093\u306A\u3067\u6B4C\u821E\u4F0E\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u80B2\u3066\u308B\u3002",
    highlights: ["\u6F14\u76EE\u30A8\u30C7\u30A3\u30BF", "\u7528\u8A9E\u96C6\u30A8\u30C7\u30A3\u30BF", "\u30AF\u30A4\u30BA\u30A8\u30C7\u30A3\u30BF"],
    ogpImage: "feature_labo.png",
    imageAlt: "JIKABUKI LABO\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\u7BA1\u7406\u753B\u9762\u3002\u6F14\u76EE\u30FB\u7528\u8A9E\u30A8\u30C7\u30A3\u30BF\u30FC\u306E\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9",
    story: "\u6F14\u76EE\u3084\u7528\u8A9E\u306E\u30C7\u30FC\u30BF\u306F\u4E00\u4EBA\u3067\u4F5C\u308B\u306B\u306F\u9650\u754C\u304C\u3042\u308B\u3002\u6B4C\u821E\u4F0E\u306B\u8A73\u3057\u3044\u30E1\u30F3\u30D0\u30FC\u304C\u305D\u308C\u305E\u308C\u306E\u5F97\u610F\u5206\u91CE\u3092\u6301\u3061\u5BC4\u3063\u3066\u3001\u307F\u3093\u306A\u3067\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3092\u80B2\u3066\u3089\u308C\u308B\u4ED5\u7D44\u307F\u304C\u6B32\u3057\u304B\u3063\u305F\u3002"
  },
  // ── YouTube チャンネル動画紹介 ──
  {
    name: "YouTube\uFF1A\u6C17\u826F\u6B4C\u821E\u4F0E\u30C1\u30E3\u30F3\u30CD\u30EB\u7D39\u4ECB",
    brand: "YouTube",
    path: "",
    description: "\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u7DF4\u7FD2\u98A8\u666F\u3084\u672C\u756A\u6620\u50CF\u3001\u6B4C\u821E\u4F0E\u306E\u9B45\u529B\u3092\u4F1D\u3048\u308B\u52D5\u753B\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\u30C1\u30E3\u30F3\u30CD\u30EB\u767B\u9332\u3067\u6700\u65B0\u52D5\u753B\u3092\u30C1\u30A7\u30C3\u30AF\uFF01",
    highlights: ["\u7DF4\u7FD2\u98A8\u666F\u30FB\u821E\u53F0\u88CF", "\u672C\u756A\u30C0\u30A4\u30B8\u30A7\u30B9\u30C8", "\u6B4C\u821E\u4F0E\u5165\u9580\u52D5\u753B", "\u30C1\u30E3\u30F3\u30CD\u30EB\u767B\u9332\u304A\u9858\u3044\u3057\u307E\u3059"],
    ogpImage: "feature_youtube.png",
    imageAlt: "\u6C17\u826F\u6B4C\u821E\u4F0E\u306EYouTube\u30C1\u30E3\u30F3\u30CD\u30EB\u3002\u7DF4\u7FD2\u98A8\u666F\u3084\u516C\u6F14\u6620\u50CF\u306E\u30B5\u30E0\u30CD\u30A4\u30EB",
    story: "\u5730\u6B4C\u821E\u4F0E\u306E\u9B45\u529B\u306F\u821E\u53F0\u3092\u89B3\u3066\u3082\u3089\u3046\u306E\u304C\u4E00\u756A\u3060\u3051\u3069\u3001\u9060\u65B9\u306E\u4EBA\u306B\u306F\u96E3\u3057\u3044\u3002\u7DF4\u7FD2\u98A8\u666F\u3084\u821E\u53F0\u88CF\u3082\u542B\u3081\u3066\u52D5\u753B\u3067\u4F1D\u3048\u308B\u3053\u3068\u3067\u3001\u5730\u6B4C\u821E\u4F0E\u306B\u8208\u5473\u3092\u6301\u3063\u3066\u3082\u3089\u3046\u304D\u3063\u304B\u3051\u3092\u4F5C\u308A\u305F\u304B\u3063\u305F\u3002"
  }
];
var SPECIAL_DAYS = {
  "01-01": "\u5143\u65E6",
  "02-20": "\u6B4C\u821E\u4F0E\u306E\u65E5",
  "03-03": "\u3072\u306A\u796D\u308A",
  "05-05": "\u3053\u3069\u3082\u306E\u65E5",
  "07-07": "\u4E03\u5915",
  "11-03": "\u6587\u5316\u306E\u65E5",
  "12-31": "\u5927\u6666\u65E5"
};
async function generateCalendar(db, startDate) {
  const start = /* @__PURE__ */ new Date(startDate + "T00:00:00Z");
  const baseUrlRow = await db.prepare(
    `SELECT value FROM settings WHERE key = 'kabuki_navi_base_url'`
  ).first();
  const baseUrl = baseUrlRow?.value || "https://kabukiplus.com";
  const { results: images } = await db.prepare(
    `SELECT id, filename, play_name, season_tag, scene_type, character_id, usage_count
     FROM images
     WHERE verified = 1 AND privacy_excluded = 0
     ORDER BY usage_count ASC`
  ).all();
  const { results: quizzes } = await db.prepare(
    "SELECT id FROM quiz_posts WHERE post_id IS NULL ORDER BY id ASC"
  ).all();
  const imageLastUsed = /* @__PURE__ */ new Map();
  let quizIndex = 0;
  let featureIndex = 0;
  let sundayCount = 0;
  const posts = [];
  for (let day = 0; day < 365; day++) {
    const date = new Date(start.getTime() + day * 864e5);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getUTCDay();
    const month = date.getUTCMonth() + 1;
    const monthDay = `${String(month).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    let theme = DAY_THEMES[dayOfWeek];
    const season = getSeason(month);
    const specialDay = SPECIAL_DAYS[monthDay] || null;
    let ctaType = CTA_DISTRIBUTION[dayOfWeek];
    let featureInfo = null;
    let featureOgpImage = null;
    if (dayOfWeek === 0) {
      sundayCount++;
      if (sundayCount % 4 === 0) {
        theme = "\u6A5F\u80FD\u7D39\u4ECB";
        ctaType = "F";
        const feature = FEATURES[featureIndex % FEATURES.length];
        featureInfo = JSON.stringify({
          name: feature.name,
          brand: feature.brand,
          path: feature.path,
          description: feature.description,
          highlights: feature.highlights,
          ogpImage: feature.ogpImage,
          imageAlt: feature.imageAlt,
          story: feature.story
        });
        featureOgpImage = feature.ogpImage;
        featureIndex++;
      }
    }
    let selectedImageId = null;
    let selectedCharacterId = null;
    if (featureOgpImage && images.length > 0) {
      const featureImg = images.find(
        (img) => img.filename === featureOgpImage
      );
      if (featureImg) {
        selectedImageId = featureImg.id;
        selectedCharacterId = featureImg.character_id;
      }
    }
    if (!selectedImageId && images.length > 0) {
      const seasonMatched = images.filter((img) => {
        const tag = img.season_tag;
        return tag === season || tag === "\u901A\u5E74" || !tag;
      });
      const preferredCandidates = images.filter((img) => {
        const imgId = img.id;
        const lastUsedDay = imageLastUsed.get(imgId);
        return isPreferredImagePlay(img.play_name) && (lastUsedDay === void 0 || day - lastUsedDay >= PREFERRED_IMAGE_REUSE_DAYS);
      });
      const regularCandidates = seasonMatched.filter((img) => {
        const lastUsedDay = imageLastUsed.get(img.id);
        return lastUsedDay === void 0 || day - lastUsedDay >= 30;
      });
      const candidates = preferredCandidates.length > 0 ? preferredCandidates : regularCandidates;
      if (candidates.length > 0) {
        candidates.sort((a, b) => a.usage_count - b.usage_count);
        const chosen = candidates[0];
        selectedImageId = chosen.id;
        selectedCharacterId = chosen.character_id;
        imageLastUsed.set(selectedImageId, day);
        chosen.usage_count = chosen.usage_count + 1;
      }
    }
    let ctaUrl = null;
    if (ctaType === "F" && theme === "\u6A5F\u80FD\u7D39\u4ECB") {
      const feature = FEATURES[(featureIndex - 1 + FEATURES.length) % FEATURES.length];
      ctaUrl = `${baseUrl}${feature.path}`;
    } else if (ctaType !== "N" && ctaType !== "D") {
      ctaUrl = baseUrl;
    }
    posts.push({
      post_date: dateStr,
      day_of_week: dayOfWeek,
      theme,
      image_id: selectedImageId,
      character_id: selectedCharacterId,
      special_day: theme === "\u6A5F\u80FD\u7D39\u4ECB" ? featureInfo : specialDay,
      cta_type: ctaType,
      cta_url: ctaUrl,
      status: "draft"
    });
  }
  const fridayPosts = posts.filter((p2) => p2.day_of_week === 5);
  for (const fp of fridayPosts) {
    if (quizIndex < quizzes.length) {
      const quiz = quizzes[quizIndex];
      fp._quiz_id = quiz.id;
      quizIndex++;
    }
  }
  const batchSize = 50;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const stmts = batch.map(
      (p2) => db.prepare(
        `INSERT OR REPLACE INTO posts (post_date, day_of_week, theme, image_id, character_id, special_day, cta_type, cta_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(p2.post_date, p2.day_of_week, p2.theme, p2.image_id, p2.character_id, p2.special_day, p2.cta_type, p2.cta_url, p2.status)
    );
    await db.batch(stmts);
  }
  if (images.length > 0) {
    const usageStmts = images.filter((img) => img.usage_count > 0).map(
      (img) => db.prepare("UPDATE images SET usage_count = ? WHERE id = ?").bind(img.usage_count, img.id)
    );
    for (let i = 0; i < usageStmts.length; i += batchSize) {
      await db.batch(usageStmts.slice(i, i + batchSize));
    }
  }
  for (const fp of fridayPosts) {
    if (fp._quiz_id) {
      const insertedPost = await db.prepare("SELECT id FROM posts WHERE post_date = ?").bind(fp.post_date).first();
      if (insertedPost) {
        await db.prepare("UPDATE quiz_posts SET post_id = ? WHERE id = ?").bind(insertedPost.id, fp._quiz_id).run();
      }
    }
  }
  return posts.length;
}
var calendarRoutes = new Hono2();
calendarRoutes.get("/:year/:month", async (c) => {
  const year = Number(c.req.param("year"));
  const month = Number(c.req.param("month"));
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name as character_name, i.filename as image_filename, i.r2_key as image_r2_key
     FROM posts p
     LEFT JOIN characters c ON p.character_id = c.id
     LEFT JOIN images i ON p.image_id = i.id
     WHERE p.post_date >= ? AND p.post_date <= ?
     ORDER BY p.post_date ASC`
  ).bind(from, to).all();
  return c.json({
    year,
    month,
    posts: results
  });
});
calendarRoutes.post("/generate", async (c) => {
  const body = await c.req.json();
  const startDate = body.start_date || (await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'start_date'").first())?.value || "2026-04-01";
  const count = await generateCalendar(c.env.DB, startDate);
  return c.json({ generated: count, start_date: startDate });
});
calendarRoutes.post("/swap", async (c) => {
  const { post_id_a, post_id_b } = await c.req.json();
  const postA = await c.env.DB.prepare("SELECT id, post_date FROM posts WHERE id = ?").bind(post_id_a).first();
  const postB = await c.env.DB.prepare("SELECT id, post_date FROM posts WHERE id = ?").bind(post_id_b).first();
  if (!postA || !postB) return c.json({ error: "Post not found" }, 404);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE posts SET post_date = ? WHERE id = ?").bind(postB.post_date, postA.id),
    c.env.DB.prepare("UPDATE posts SET post_date = ? WHERE id = ?").bind(postA.post_date, postB.id)
  ]);
  return c.json({ success: true });
});
var generateRoutes = new Hono2();
async function generate(env, id, prompt) {
  const p2 = await env.DB.prepare(`SELECT p.*,c.name character_name,c.description character_description,c.personality_tags,
    i.visual_features,i.scene_type,qp.question quiz_question,qp.options quiz_options,
    qp.correct_answer quiz_correct_answer,qp.explanation quiz_explanation
    FROM posts p LEFT JOIN images i ON i.id=p.image_id
    LEFT JOIN characters c ON c.id=i.character_id AND i.verified=1
    LEFT JOIN quiz_posts qp ON qp.post_id=p.id WHERE p.id=?`).bind(id).first();
  if (!p2) throw new Error("\u6295\u7A3F\u304C\u3042\u308A\u307E\u305B\u3093");
  if (p2.instagram_posted || !["idle", "failed"].includes(String(p2.publish_state))) throw new Error("\u516C\u958B\u6E08\u307F\u30FB\u51E6\u7406\u4E2D\u306E\u672C\u6587\u306F\u518D\u751F\u6210\u3067\u304D\u307E\u305B\u3093");
  const s = await settings(env);
  if (threePlayOwnsDate(s, String(p2.post_date))) throw new Error("3\u6F14\u76EE\u30E2\u30FC\u30C9\u3067\u306F\u691C\u8A3C\u6E08\u307F\u306E\u767B\u9332\u6587\u3092\u4F7F\u3044\u307E\u3059\u3002\u81EA\u52D5\u518D\u751F\u6210\u3057\u307E\u305B\u3093");
  const texts = await generatePostText(env, p2, s, "instagram", prompt);
  if (!texts.instagram_text.trim()) throw new Error("\u672C\u6587\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
  await env.DB.prepare(`UPDATE posts SET instagram_text=?,instagram_hashtags=?,publish_container_id=NULL,publish_state='idle',updated_at=datetime('now')
    WHERE id=? AND instagram_posted=0 AND publish_state IN ('idle','failed')`).bind(texts.instagram_text, texts.instagram_hashtags, id).run();
  return { instagram_text: texts.instagram_text, instagram_hashtags: texts.instagram_hashtags };
}
generateRoutes.post("/single/:id/:platform", async (c) => {
  if (c.req.param("platform") !== "instagram") return c.json({ error: "\u6587\u7AE0\u751F\u6210\u306FInstagram\u5C02\u7528\u3067\u3059" }, 400);
  const b = await c.req.json().catch(() => ({ customPrompt: void 0 }));
  return c.json({ success: true, texts: await generate(c.env, Number(c.req.param("id")), b.customPrompt) });
});
generateRoutes.post("/single/:id", async (c) => {
  const b = await c.req.json().catch(() => ({ customPrompt: void 0 }));
  return c.json({ success: true, texts: await generate(c.env, Number(c.req.param("id")), b.customPrompt) });
});
generateRoutes.post("/batch", async (c) => {
  const b = await c.req.json();
  const { results } = await c.env.DB.prepare(`SELECT id FROM posts WHERE instagram_posted=0 AND instagram_text IS NULL
    AND publish_state IN ('idle','failed') AND post_date BETWEEN ? AND ? ORDER BY post_date LIMIT ?`).bind(b.from || "0000-01-01", b.to || "9999-12-31", Math.min(30, Math.max(1, b.limit || 10))).all();
  let generated = 0;
  const errors = [];
  for (const p2 of results) {
    try {
      await generate(c.env, p2.id);
      generated++;
    } catch (e) {
      errors.push(e.message);
    }
  }
  return c.json({ generated, total: results.length, errors });
});
var reelsRoutes = new Hono2();
function isFile(value) {
  return value instanceof File;
}
reelsRoutes.get("/status", async (c) => {
  const s = await settings(c.env);
  const jobs = await c.env.DB.prepare(`SELECT r.id,r.post_id,r.status,r.video_key,r.cover_key,r.error,r.updated_at,
    p.post_date,p.instagram_posted,p.ig_permalink,p.content_type,p.publish_state
    FROM reel_jobs r JOIN posts p ON p.id=r.post_id
    WHERE r.id=(SELECT MAX(id) FROM reel_jobs WHERE post_id=r.post_id)
    ORDER BY p.post_date DESC LIMIT 40`).all();
  return c.json({ enabled: s.reels_enabled === "1", bgm_key: s.reel_bgm_key || "", jobs: jobs.results });
});
reelsRoutes.post("/prepare", async (c) => c.json(await prepareReels(c.env)));
reelsRoutes.get("/post/:id", async (c) => {
  const job = await currentJob(c.env, Number(c.req.param("id")));
  const s = await settings(c.env);
  return c.json(job ? { ...job, video_url: job.video_key ? assetUrl(publicBase(s), job.video_key) : null } : null);
});
reelsRoutes.post("/jobs/claim", async (c) => {
  await c.env.DB.prepare(`INSERT INTO settings(key,value) VALUES('renderer_last_seen',datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run();
  return c.json({ job: await claimReel(c.env) });
});
reelsRoutes.get("/jobs/:id/assets/:index", async (c) => {
  const job = await c.env.DB.prepare(`SELECT * FROM reel_jobs WHERE id=? AND lease_token=? AND status='rendering' AND lease_until>datetime('now')`).bind(c.req.param("id"), c.req.header("x-render-lease") || "").first();
  if (!job) return c.json({ error: "Invalid lease" }, 409);
  const m = await makeManifest(c.env, job.post_id);
  if (!m || await sourceHash(m) !== job.source_hash) return c.json({ error: "\u7D20\u6750\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  const index = c.req.param("index");
  const key = index === "bgm" ? m.bgmKey : m.photos[Number(index)]?.key;
  if (!key) return c.json({ error: "Not found" }, 404);
  const object2 = await c.env.R2.get(key);
  if (!object2) return c.json({ error: "\u7D20\u6750\u304C\u3042\u308A\u307E\u305B\u3093" }, 404);
  const h = new Headers();
  object2.writeHttpMetadata(h);
  h.set("Cache-Control", "no-store");
  return new Response(object2.body, { headers: h });
});
reelsRoutes.post("/jobs/:id/complete", async (c) => {
  if (Number(c.req.header("content-length") || 0) > 45e6) return c.json({ error: "\u52D5\u753B\u304C\u5927\u304D\u3059\u304E\u307E\u3059" }, 413);
  const form = await c.req.formData();
  const token = String(form.get("lease_token") || "");
  const job = await c.env.DB.prepare(`SELECT * FROM reel_jobs WHERE id=? AND lease_token=? AND status='rendering' AND lease_until>datetime('now')`).bind(c.req.param("id"), token).first();
  if (!job) return c.json({ error: "Invalid lease" }, 409);
  const m = await makeManifest(c.env, job.post_id);
  if (!m || await sourceHash(m) !== job.source_hash) return c.json({ error: "\u7D20\u6750\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F" }, 409);
  const video = form.get("video"), cover = form.get("cover");
  if (!isFile(video) || video.type !== "video/mp4" || video.size > 4e7 || video.size < 1e3 || !isFile(cover) || cover.type !== "image/jpeg" || cover.size === 0 || cover.size > 3e6) return c.json({ error: "MP4\u3068\u8868\u7D19\u304C\u5FC5\u8981\u3067\u3059" }, 400);
  const key = `reels/video/${job.post_id}-${job.source_hash}.mp4`, coverKey = `reels/covers/${job.post_id}-${job.source_hash}.jpg`;
  await c.env.R2.put(key, video.stream(), { httpMetadata: { contentType: "video/mp4" } });
  await c.env.R2.put(coverKey, cover.stream(), { httpMetadata: { contentType: "image/jpeg" } });
  const r = await c.env.DB.prepare(`UPDATE reel_jobs SET status='ready',video_key=?,cover_key=?,lease_token=NULL,
    lease_until=NULL,error=NULL,updated_at=datetime('now') WHERE id=? AND lease_token=? AND status='rendering' RETURNING id`).bind(key, coverKey, job.id, token).first();
  if (!r) return c.json({ error: "Lease changed" }, 409);
  return c.json({ success: true, video_key: key });
});
reelsRoutes.post("/jobs/:id/fail", async (c) => {
  const b = await c.req.json();
  const r = await c.env.DB.prepare(`UPDATE reel_jobs SET status='failed',error=?,lease_token=NULL,lease_until=NULL,
    updated_at=datetime('now') WHERE id=? AND lease_token=? AND status='rendering' RETURNING id`).bind(String(b.error || "Render failed").slice(0, 500), c.req.param("id"), b.lease_token).first();
  return c.json({ success: !!r });
});
var crosspostRoutes = new Hono2();
var sourceReady = `p.instagram_posted=1 AND p.ig_media_id IS NOT NULL
  AND p.ig_permalink IS NOT NULL AND p.published_media_key IS NOT NULL`;
var usedToday = `status='published' AND (date(started_at,'+9 hours')=date('now','+9 hours')
  OR date(updated_at,'+9 hours')=date('now','+9 hours'))`;
function decorate(r, s) {
  return {
    ...r,
    media_url: r.published_media_key ? assetUrl(publicBase(s), r.published_media_key) : null,
    account: r.platform === "x" ? "https://x.com/KeraKabuki" : "https://www.facebook.com/kerakabuki"
  };
}
crosspostRoutes.get("/queue", async (c) => {
  const today = jstDate(), s = await settings(c.env), since = s.crosspost_start_date || today;
  const platforms = await Promise.all(["facebook", "x"].map(async (platform) => {
    const [pending, review, used] = await c.env.DB.batch([
      c.env.DB.prepare(`SELECT x.*,p.post_date,p.ig_media_id,p.ig_permalink,p.published_caption,p.published_media_key
        FROM crossposts x JOIN posts p ON p.id=x.post_id WHERE x.platform=? AND x.status IN ('pending','failed')
        AND ${sourceReady} AND p.post_date BETWEEN ? AND ? ORDER BY p.post_date,p.id`).bind(platform, since, today),
      c.env.DB.prepare(`SELECT post_id,platform,status,caption,started_at,error FROM crossposts
        WHERE platform=? AND status IN ('publishing','uncertain') ORDER BY started_at,post_id`).bind(platform),
      c.env.DB.prepare(`SELECT post_id,permalink FROM crossposts WHERE platform=? AND (${usedToday})`).bind(platform)
    ]);
    const blocked = review.results.length ? "needs_review" : null;
    return {
      platform,
      daily_limit: null,
      remaining_today: null,
      blocked_reason: blocked,
      backlog_count: pending.results.length,
      next: !blocked && pending.results.length ? decorate(pending.results[0], s) : null,
      needs_review: review.results,
      published_today: used.results
    };
  }));
  const source = await c.env.DB.prepare(`SELECT count(*) AS n FROM posts p WHERE p.post_date=? AND ${sourceReady}`).bind(today).first();
  return c.json({ date: today, source_today_published: !!source?.n, platforms });
});
crosspostRoutes.get("/", async (c) => {
  const date = c.req.query("date") || jstDate();
  const postId = c.req.query("post_id");
  if (postId && !/^\d+$/.test(postId)) return c.json({ error: "Invalid post id" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: "Invalid date" }, 400);
  const s = await settings(c.env);
  const { results } = await c.env.DB.prepare(`SELECT x.*,p.post_date,p.ig_media_id,p.ig_permalink,p.published_caption,
    p.published_media_key FROM crossposts x JOIN posts p ON p.id=x.post_id
    WHERE ${postId ? "p.id=? AND p.post_date<=?" : "p.post_date=?"} AND p.instagram_posted=1 AND p.ig_media_id IS NOT NULL ORDER BY p.id,x.platform`).bind(...postId ? [Number(postId), jstDate()] : [date]).all();
  return c.json(results.map((r) => ({
    ...r,
    media_url: r.published_media_key ? assetUrl(publicBase(s), String(r.published_media_key)) : null,
    account: r.platform === "x" ? "https://x.com/KeraKabuki" : "https://www.facebook.com/kerakabuki"
  })));
});
crosspostRoutes.post("/:id/:platform/start", async (c) => {
  const platform = c.req.param("platform");
  if (!["facebook", "x"].includes(platform)) return c.json({ error: "Invalid platform" }, 400);
  const b = await c.req.json();
  const caption = String(b.caption || "").trim();
  if (!caption) return c.json({ error: "\u672C\u6587\u304C\u3042\u308A\u307E\u305B\u3093" }, 400);
  const s = await settings(c.env), today = jstDate();
  const r = await c.env.DB.prepare(`UPDATE crossposts SET status='publishing',caption=?,started_at=datetime('now'),updated_at=datetime('now'),error=NULL
    WHERE post_id=? AND platform=? AND status IN ('pending','failed')
    AND post_id=(SELECT x.post_id FROM crossposts x JOIN posts p ON p.id=x.post_id
      WHERE x.platform=? AND x.status IN ('pending','failed') AND ${sourceReady}
      AND p.post_date BETWEEN ? AND ? ORDER BY p.post_date,p.id LIMIT 1)
    AND NOT EXISTS(SELECT 1 FROM crossposts WHERE platform=? AND status IN ('publishing','uncertain')) RETURNING *`).bind(caption.slice(0, 5e3), c.req.param("id"), platform, platform, s.crosspost_start_date || today, today, platform).first();
  if (!r) return c.json({ error: "\u7D50\u679C\u78BA\u8A8D\u5F85\u3061\u3001\u307E\u305F\u306F\u6B21\u306E\u8EE2\u8A18\u5BFE\u8C61\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002queue\u3092\u518D\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044" }, 409);
  return c.json(r);
});
crosspostRoutes.post("/:id/:platform/result", async (c) => {
  const platform = c.req.param("platform");
  if (!["facebook", "x"].includes(platform)) return c.json({ error: "Invalid platform" }, 400);
  const b = await c.req.json();
  if (!["published", "failed", "uncertain"].includes(b.status)) return c.json({ error: "Invalid status" }, 400);
  if (b.status === "published") {
    try {
      const u = new URL(b.permalink || "");
      if (u.protocol !== "https:" || (platform === "x" ? !["x.com", "www.x.com"].includes(u.hostname) || !/^\/KeraKabuki\/status\/\d+$/i.test(u.pathname) : !["www.facebook.com", "facebook.com"].includes(u.hostname))) throw Error();
    } catch {
      return c.json({ error: "\u516C\u958B\u5148URL\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    }
  }
  const r = await c.env.DB.prepare(`UPDATE crossposts SET status=?,permalink=?,error=?,updated_at=datetime('now')
    WHERE post_id=? AND platform=? AND status IN ('publishing','uncertain') RETURNING *`).bind(b.status, b.permalink || null, String(b.error || "").slice(0, 500) || null, c.req.param("id"), platform).first();
  if (!r) return c.json({ error: "\u72B6\u614B\u306F\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 409);
  return c.json(r);
});
function decode(part) {
  return Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}
async function verifyRendererToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const c = JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const now = Date.now() / 1e3;
    if (header.alg !== "RS256" || c.iss !== "https://token.actions.githubusercontent.com" || c.aud !== "kabuki-post-365-render" || c.repository_id !== "1154986673" || c.repository_owner_id !== "210201072" || c.repository !== "kerakabuki/kabuki-ai-agent" || c.ref !== "refs/heads/main" || c.workflow_ref !== "kerakabuki/kabuki-ai-agent/.github/workflows/instagram-reels.yml@refs/heads/main" || !["schedule", "workflow_dispatch"].includes(String(c.event_name)) || typeof c.exp !== "number" || c.exp <= now || typeof c.nbf !== "number" || c.nbf > now + 30) return false;
    const r = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", { cf: { cacheTtl: 3600 }, signal: AbortSignal.timeout(1e4) });
    if (!r.ok) return false;
    const { keys } = await r.json();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(parts[2]), new TextEncoder().encode(parts.slice(0, 2).join(".")));
  } catch {
    return false;
  }
}
var quizRoutes = new Hono2();
quizRoutes.get("/", async (c) => {
  const difficulty = c.req.query("difficulty");
  const category = c.req.query("category");
  const used = c.req.query("used");
  let query = "SELECT q.*, p.post_date FROM quiz_posts q LEFT JOIN posts p ON q.post_id = p.id WHERE 1=1";
  const params = [];
  if (difficulty) {
    query += " AND q.difficulty = ?";
    params.push(difficulty);
  }
  if (category) {
    query += " AND q.category = ?";
    params.push(category);
  }
  if (used === "true") {
    query += " AND q.post_id IS NOT NULL";
  }
  if (used === "false") {
    query += " AND q.post_id IS NULL";
  }
  query += " ORDER BY q.id ASC";
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return c.json(results);
});
quizRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row32 = await c.env.DB.prepare("SELECT * FROM quiz_posts WHERE id = ?").bind(id).first();
  if (!row32) return c.json({ error: "Not found" }, 404);
  return c.json(row32);
});
quizRoutes.post("/import", async (c) => {
  const quizzes = await c.req.json();
  const batchSize = 50;
  let imported = 0;
  for (let i = 0; i < quizzes.length; i += batchSize) {
    const batch = quizzes.slice(i, i + batchSize);
    const stmts = batch.map(
      (q) => c.env.DB.prepare(
        `INSERT INTO quiz_posts (question, options, correct_answer, explanation, difficulty, category)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        q.question,
        typeof q.options === "string" ? q.options : JSON.stringify(q.options),
        q.correct_answer,
        q.explanation || null,
        q.difficulty || "intermediate",
        q.category || null
      )
    );
    await c.env.DB.batch(stmts);
    imported += batch.length;
  }
  return c.json({ imported });
});
quizRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(
    `INSERT INTO quiz_posts (question, options, correct_answer, explanation, difficulty, category)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    body.question,
    typeof body.options === "string" ? body.options : JSON.stringify(body.options),
    body.correct_answer,
    body.explanation || null,
    body.difficulty || "intermediate",
    body.category || null
  ).run();
  return c.json({ id: result.meta.last_row_id }, 201);
});
quizRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE quiz_posts SET question=?, options=?, correct_answer=?, explanation=?, difficulty=?, category=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.question,
    typeof body.options === "string" ? body.options : JSON.stringify(body.options),
    body.correct_answer,
    body.explanation || null,
    body.difficulty || "intermediate",
    body.category || null,
    id
  ).run();
  return c.json({ success: true });
});
quizRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM quiz_posts WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var DAY_NAMES = ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"];
function escapeCsv(value) {
  if (value === null || value === void 0) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function generateCsv(posts, platform) {
  const bom = "\uFEFF";
  let headers;
  if (platform === "all") {
    headers = [
      "\u65E5\u4ED8",
      "\u66DC\u65E5",
      "\u30C6\u30FC\u30DE",
      "\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u540D",
      "\u753B\u50CF\u30D5\u30A1\u30A4\u30EB\u540D",
      "Instagram\u672C\u6587",
      "Instagram\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0",
      "X\u672C\u6587",
      "X\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0",
      "Facebook\u672C\u6587",
      "Facebook\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0",
      "CTA URL",
      "\u30B9\u30C6\u30FC\u30BF\u30B9"
    ];
  } else {
    headers = [
      "\u65E5\u4ED8",
      "\u66DC\u65E5",
      "\u30C6\u30FC\u30DE",
      "\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u540D",
      "\u753B\u50CF\u30D5\u30A1\u30A4\u30EB\u540D",
      `${platform}\u672C\u6587`,
      `${platform}\u30CF\u30C3\u30B7\u30E5\u30BF\u30B0`,
      "CTA URL",
      "\u30B9\u30C6\u30FC\u30BF\u30B9"
    ];
  }
  const rows = [headers.map(escapeCsv).join(",")];
  for (const post of posts) {
    let row32;
    const dayName = DAY_NAMES[post.day_of_week] || "";
    if (platform === "all") {
      row32 = [
        escapeCsv(post.post_date),
        escapeCsv(dayName),
        escapeCsv(post.theme),
        escapeCsv(post.character_name),
        escapeCsv(post.image_filename),
        escapeCsv(post.instagram_text),
        escapeCsv(post.instagram_hashtags),
        escapeCsv(post.x_text),
        escapeCsv(post.x_hashtags),
        escapeCsv(post.facebook_text),
        escapeCsv(post.facebook_hashtags),
        escapeCsv(post.cta_url),
        escapeCsv(post.status)
      ];
    } else {
      row32 = [
        escapeCsv(post.post_date),
        escapeCsv(dayName),
        escapeCsv(post.theme),
        escapeCsv(post.character_name),
        escapeCsv(post.image_filename),
        escapeCsv(post[`${platform}_text`]),
        escapeCsv(post[`${platform}_hashtags`]),
        escapeCsv(post.cta_url),
        escapeCsv(post.status)
      ];
    }
    rows.push(row32.join(","));
  }
  return bom + rows.join("\r\n");
}
var exportRoutes = new Hono2();
exportRoutes.get("/csv", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const platform = c.req.query("platform");
  let query = `SELECT p.*, c.name as character_name, i.filename as image_filename
               FROM posts p
               LEFT JOIN characters c ON p.character_id = c.id
               LEFT JOIN images i ON p.image_id = i.id
               WHERE 1=1`;
  const params = [];
  if (from) {
    query += " AND p.post_date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND p.post_date <= ?";
    params.push(to);
  }
  query += " ORDER BY p.post_date ASC";
  const stmt = c.env.DB.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  const csv = generateCsv(results, platform || "all");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kabuki-post-365_${from || "all"}_${to || "all"}.csv"`
    }
  });
});
var settingsRoutes = new Hono2();
settingsRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM settings ORDER BY key").all();
  const settings2 = {};
  for (const row32 of results) {
    settings2[row32.key] = row32.value;
  }
  return c.json(settings2);
});
settingsRoutes.put("/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json();
  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
  ).bind(key, value).run();
  return c.json({ success: true });
});
var naviRoutes = new Hono2();
naviRoutes.get("/characters/:id/images", async (c) => {
  const id = c.req.param("id");
  const { results } = await c.env.DB.prepare(
    `SELECT id, filename, r2_key, navi_caption, navi_display_order, is_primary
     FROM images
     WHERE character_id = ? AND navi_visible = 1
     ORDER BY navi_display_order ASC, is_primary DESC, created_at ASC`
  ).bind(id).all();
  const baseUrl = (await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'kabuki_navi_base_url'").first())?.value || "";
  const images = results.map((img) => ({
    id: img.id,
    caption: img.navi_caption,
    is_primary: img.is_primary,
    urls: {
      card: `${baseUrl}/images/navi/card/${img.id}.jpg`,
      detail: `${baseUrl}/images/navi/detail/${img.id}.jpg`,
      thumb: `${baseUrl}/images/navi/thumb/${img.id}.jpg`
    }
  }));
  return c.json(images);
});
naviRoutes.get("/characters/:id/primary-image", async (c) => {
  const id = c.req.param("id");
  const image = await c.env.DB.prepare(
    `SELECT id, filename, r2_key, navi_caption
     FROM images
     WHERE character_id = ? AND is_primary = 1 AND navi_visible = 1
     LIMIT 1`
  ).bind(id).first();
  if (!image) {
    const fallback = await c.env.DB.prepare(
      `SELECT id, filename, r2_key, navi_caption
       FROM images
       WHERE character_id = ? AND navi_visible = 1
       ORDER BY navi_display_order ASC, created_at ASC
       LIMIT 1`
    ).bind(id).first();
    if (!fallback) return c.json({ error: "No image found" }, 404);
    return c.json(fallback);
  }
  return c.json(image);
});
var autoPostRoutes = new Hono2();
autoPostRoutes.post("/daily-run", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const report = await runDailyPipeline(c.env, body.date);
  return c.json(report);
});
autoPostRoutes.get("/schedule", async (c) => {
  const s = await settings(c.env);
  const today = getJSTNow().date;
  const tomorrow = new Date(new Date(today).getTime() + 864e5).toISOString().slice(0, 10);
  const fmt = (d) => {
    const s2 = pickSlotForDate(d);
    return `${String(s2.hour).padStart(2, "0")}:${String(s2.minute).padStart(2, "0")}`;
  };
  const day = (date) => ({ date, time_jst: fmt(date), slots: [{ slot: "morning", time_jst: "08:00" }, ...eveningFeedEnabled(s, date) ? [{ slot: "evening", time_jst: "19:00" }] : []] });
  return c.json({ today: day(today), tomorrow: day(tomorrow) });
});
autoPostRoutes.post("/trigger", async (c) => {
  const report = await executeAutoPost(c.env);
  return c.json(report);
});
autoPostRoutes.post("/post/:postId/:platform", async (c) => {
  const postId = parseInt(c.req.param("postId"));
  const platform = c.req.param("platform");
  const validPlatforms = ["x", "bluesky", "facebook", "instagram"];
  if (!validPlatforms.includes(platform)) {
    return c.json({ error: `Invalid platform: ${platform}` }, 400);
  }
  if (isNaN(postId)) {
    return c.json({ error: "Invalid post ID" }, 400);
  }
  let compressedImage;
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const imageFile = formData.get("image");
    if (imageFile) {
      compressedImage = new Uint8Array(await imageFile.arrayBuffer());
    }
  }
  const result = await postSinglePlatform(c.env, postId, platform, compressedImage);
  return c.json(result);
});
autoPostRoutes.post("/trigger/:date", async (c) => {
  const date = c.req.param("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
  }
  const report = await executeAutoPost(c.env, date);
  return c.json(report);
});
autoPostRoutes.get("/logs", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 200);
  const postId = c.req.query("post_id");
  const platform = c.req.query("platform");
  let query = `
    SELECT pl.*, p.post_date
    FROM post_log pl
    JOIN posts p ON pl.post_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (postId) {
    query += " AND pl.post_id = ?";
    params.push(parseInt(postId));
  }
  if (platform) {
    query += " AND pl.platform = ?";
    params.push(platform);
  }
  query += " ORDER BY pl.executed_at DESC LIMIT ?";
  params.push(limit);
  const stmt = env_bind(c.env.DB.prepare(query), params);
  const logs = await stmt.all();
  return c.json({ logs: logs.results, total: logs.results.length });
});
function env_bind(stmt, params) {
  if (params.length === 0) return stmt;
  return stmt.bind(...params);
}
var MIMYO_POLICY = {
  "requestId": "mimyo302-manual-20261011",
  "sourceThreadId": "01a10a2a-219a-7535-b0c2-4fc2494370e0",
  "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\u304F\u3060\u3055\u3044",
  "authorization": "User explicitly requested today's Instagram publication now; parent directed use of existing 365 and preservation of tomorrow's reservation",
  "assetId": "photo:mimyo302-20261011",
  "photoId": "mori-mimyo-portrait",
  "imageId": 302,
  "characterId": 63,
  "characterName": "\u5FAE\u5999",
  "playName": "\u76DB\u7DB1\u9663\u5C4B",
  "naviEnmokuId": "moritunajinya",
  "naviCastId": "person_4",
  "sourceSha256": "1b9fb965dd606f63f4cbcc444ca7d9e811e9aeba343889a75c1b1e5d64906db5",
  "deliverySha256": "9847c0687e95f02957a81e4bb220c5ce38e202bdd1cc05ea76db153fdc026c82",
  "permissionSha256": "fc14210d0f805157c61af23eac8bd2e9891b7da823d9282b5d1d8d52e9fc8783",
  "identitySha256": "f76d1ea9eaa2a17649aa38bcbb4d22554b0aa2113dedb38cd0aed5f5302ebec4",
  "identityReviewedAt": "2026-10-07T12:05:10.315Z",
  "primarySha256": "de42d868a40e9359ffa00f738d673855daec0552882e2fdac402d47eadd1487e",
  "caption": "\u4E00\u679A\u306E\u5199\u771F\u304B\u3089\u3001\u7269\u8A9E\u306E\u5165\u53E3\u3078\u3002\n\n\u300E\u76DB\u7DB1\u9663\u5C4B\u300F\u306E\u5FAE\u5999\uFF08\u307F\u307F\u3087\u3046\uFF09\u3002\n\u76DB\u7DB1\u3068\u9AD8\u7DB1\u306E\u304A\u6BCD\u3055\u3093\u3067\u3059\u3002\n\n\u540D\u524D\u3092\u77E5\u308B\u3068\u3001\u821E\u53F0\u304C\u5C11\u3057\u8FD1\u304F\u306A\u308B\u3002\n\u6C17\u826F\u6B4C\u821E\u4F0E\u306E\u4EBA\u7269\u7D39\u4ECB\u3092\u3001\u5199\u771F\u3068\u3068\u3082\u306B\u3002\n\n\u6F14\u76EE\u3084\u767B\u5834\u4EBA\u7269\u306F\u3001\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u304B\u3089\u300C\u8D85\u8A33\uFF01\u6B4C\u821E\u4F0E\u30CA\u30D3\u300D\u3078\u3002\n\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u5730\u6B4C\u821E\u4F0E #\u6B4C\u821E\u4F0E #\u76DB\u7DB1\u9663\u5C4B #\u5FAE\u5999",
  "accountId": null,
  "accountUsername": "kerakabuki_official",
  "tokenSha256": "aa80ce151a0e5b8c56cdfb5d13ec50047607e9671e0aa4b8a27a181bd55fd0bd",
  "notBefore": "2026-10-11T02:10:00.000Z",
  "expiresAt": "2026-10-11T03:30:00.000Z",
  "duplicateSince": "2026-09-27T15:00:00.000Z",
  "todaySince": "2026-10-10T15:00:00.000Z",
  "maxPublications": 1,
  "automaticPublishing": false,
  "otherMediaPublishing": false,
  "sourceKey": "provenance/mimyo302/f76d1ea9eaa2a17649aa38bcbb4d22554b0aa2113dedb38cd0aed5f5302ebec4.ndjson",
  "deliveryKey": "originals/ig3_20261008_mori-mimyo-portrait_9847c0687e95.jpg",
  "rawTokenSaved": false,
  "originalGateApprovalChanged": false,
  "photoPermissionExpiryExtended": false,
  "captionSha256": "fe750cf59772e0704ef93ae225760d872bcbb2e217b302ba840aff87333b57e4",
  "reviewedNonDuplicateAnnouncement": {
    "id": "18123047668928028",
    "caption": "\u5FAE\u5999\u306F\u3001\u306A\u305C\u5B6B\u306B\u53B3\u3057\u3044\u306E\uFF1F\n\n\u304B\u308F\u3044\u3044\u306F\u305A\u306E\u5B6B\u306B\u3001\u3069\u3046\u3057\u3066\u305D\u3093\u306A\u8A00\u8449\u3092\u304B\u3051\u308B\u306E\u304B\u3002\n\u300E\u76DB\u7DB1\u9663\u5C4B\u300F\u3092\u89B3\u308B\u524D\u306B\u77E5\u3063\u3066\u304A\u304D\u305F\u3044\u3001\u7956\u6BCD\u3068\u5B6B\u306E\u95A2\u4FC2\u3092\u3051\u3089\u306E\u3059\u3051\u304C\u89E3\u8AAC\u3057\u307E\u3059\u3002\n\n10\u6708\u6B4C\u821E\u4F0E\u5EA7\u306E\u89B3\u5287\u524D\u306B\u3082\u3001\u89B3\u5287\u5F8C\u306E\u632F\u308A\u8FD4\u308A\u306B\u3082\u3002\nYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u76DB\u7DB1\u9663\u5C4B\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\u25B6 \u76DB\u7DB1\u9663\u5C4B\u2461\u300C\u5FAE\u5999\u306F\u3001\u306A\u305C\u5B6B\u306B\u53B3\u3057\u3044\u306E\uFF1F\u300D\nhttps://youtu.be/934wpU6JZqI\n\n\u8D85\u8A33\uFF01\u6B4C\u821E\u4F0E\u30CA\u30D3\uFF5C\u51685\u56DE\u3001\u516C\u958B\u4E2D\n\u203B\u7269\u8A9E\u306E\u5C55\u958B\u30FB\u7D50\u672B\u306B\u89E6\u308C\u307E\u3059\u3002\n\u4F7F\u7528\u6620\u50CF\u30FB\u5199\u771F\uFF1A\u6C17\u826F\u6B4C\u821E\u4F0E 2013\u5E74\u516C\u6F14\n#\u76DB\u7DB1\u9663\u5C4B #\u6B4C\u821E\u4F0E #\u6C17\u826F\u6B4C\u821E\u4F0E",
    "timestamp": "2026-10-06T03:15:02+0000",
    "visualReviewSha256": "29ae830827b7d04253630c8c6a3c0b93c46732d178d326f0d995c125cb989fec"
  }
};
var GRAPH2 = "https://graph.facebook.com/v21.0";
var ORIGIN = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function windowOpen() {
  if (Date.now() < Date.parse(MIMYO_POLICY.notBefore) || Date.now() >= Date.parse(MIMYO_POLICY.expiresAt)) throw new ManualError("manual_authorization_expired_or_not_started", 410);
}
async function validateInput(env, value) {
  windowOpen();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError("manual_input_required", 400);
  const v = value;
  const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
  if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError("manual_exact_input_required", 400);
  if (v.assetId !== MIMYO_POLICY.assetId || v.sourceSha256 !== MIMYO_POLICY.sourceSha256 || v.deliverySha256 !== MIMYO_POLICY.deliverySha256 || v.captionSha256 !== MIMYO_POLICY.captionSha256 || v.accountUsername !== MIMYO_POLICY.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || MIMYO_POLICY.accountId && v.accountId !== MIMYO_POLICY.accountId || await hex(v.token) !== MIMYO_POLICY.tokenSha256 || await hex(MIMYO_POLICY.caption) !== MIMYO_POLICY.captionSha256) throw new ManualError("manual_approval_binding_mismatch", 422);
  return v;
}
async function row(env) {
  return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(MIMYO_POLICY.requestId).first();
}
async function graph2(env, path, body) {
  if (!env.META_ACCESS_TOKEN) throw new ManualError("existing_instagram_authentication_unavailable", 503);
  const response = await fetch(GRAPH2 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok || value.error) throw new ManualError("existing_meta_request_rejected_http_" + response.status, 502);
  return value;
}
async function identity(env) {
  if (!env.INSTAGRAM_USER_ID || MIMYO_POLICY.accountId && env.INSTAGRAM_USER_ID !== MIMYO_POLICY.accountId) throw new ManualError("manual_account_binding_mismatch", 422);
  const who = await graph2(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
  if (who.id !== env.INSTAGRAM_USER_ID || who.username !== MIMYO_POLICY.accountUsername) throw new ManualError("manual_official_account_mismatch", 422);
  return { id: String(who.id), username: String(who.username) };
}
async function photoProof(env) {
  const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(MIMYO_POLICY.imageId).first();
  if (!image || image.id !== MIMYO_POLICY.imageId || image.r2_key !== MIMYO_POLICY.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== MIMYO_POLICY.characterId || image.play_name !== MIMYO_POLICY.playName || image.name !== MIMYO_POLICY.characterName || image.navi_enmoku_id !== MIMYO_POLICY.naviEnmokuId || image.navi_cast_id !== MIMYO_POLICY.naviCastId || !/(portrait|ポートレート|ブロマイド)/i.test(String(image.scene_type || "")) || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError("approved_exact_photo_metadata_changed", 422);
  return { imageId: MIMYO_POLICY.imageId, playName: MIMYO_POLICY.playName, characterName: MIMYO_POLICY.characterName, originalSha256: MIMYO_POLICY.sourceSha256, deliverySha256: MIMYO_POLICY.deliverySha256, identityReviewedAt: MIMYO_POLICY.identityReviewedAt, permissionProof: MIMYO_POLICY.permissionSha256, identityProof: MIMYO_POLICY.identitySha256, primaryProof: MIMYO_POLICY.primarySha256 };
}
var reviewedDifferentAnnouncement = (m) => m.id === MIMYO_POLICY.reviewedNonDuplicateAnnouncement.id && m.caption === MIMYO_POLICY.reviewedNonDuplicateAnnouncement.caption && m.timestamp === MIMYO_POLICY.reviewedNonDuplicateAnnouncement.timestamp;
var announcementMatch = (m) => m.caption === MIMYO_POLICY.caption || !reviewedDifferentAnnouncement(m) && (m.caption || "").includes(MIMYO_POLICY.characterName) && Date.parse(m.timestamp || "") >= Date.parse(MIMYO_POLICY.duplicateSince);
async function recent(env) {
  const v = await graph2(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
  if (!Array.isArray(v.data)) throw new ManualError("instagram_recent_media_unavailable", 503);
  return v.data;
}
async function assets(env, _required = false) {
  const object2 = await env.R2.get(MIMYO_POLICY.deliveryKey);
  if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex(await object2.arrayBuffer()) !== MIMYO_POLICY.deliverySha256) throw new ManualError("approved_exact_photo_storage_changed", 422);
  return { delivery: true, deliverySha256: MIMYO_POLICY.deliverySha256, originalAndIdentityProofPinned: true };
}
async function inspect(env, allowOwnClaim = false, requireAssets = false) {
  windowOpen();
  const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
  if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError("instagram_is_disabled", 409);
  const own = await row(env);
  if (own && !allowOwnClaim) throw new ManualError("manual_one_time_slot_already_consumed", 409);
  const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(MIMYO_POLICY.caption, MIMYO_POLICY.imageId).first();
  if (duplicate) throw new ManualError("manual_announcement_already_in_existing365", 409);
  const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
  if (inflight) throw new ManualError("existing365_publication_inflight_or_uncertain", 409);
  const account = await identity(env), photo = await photoProof(env), media = await recent(env);
  if (media.some(announcementMatch)) throw new ManualError("manual_photo_already_on_instagram", 409);
  if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(MIMYO_POLICY.todaySince))) throw new ManualError("instagram_has_today_publication", 409);
  const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(MIMYO_POLICY.requestId).first();
  if (otherManual) throw new ManualError("other_manual_publication_inflight_or_uncertain", 409);
  return { account, photo, thumbnail: await assets(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: MIMYO_POLICY.expiresAt, oneTimeClaimed: !!own };
}
var preflight = (env) => inspect(env);
function boundRow(saved, accountId) {
  return saved.request_id === MIMYO_POLICY.requestId && saved.video_id === MIMYO_POLICY.assetId && saved.source_sha256 === MIMYO_POLICY.sourceSha256 && saved.delivery_sha256 === MIMYO_POLICY.deliverySha256 && saved.caption_sha256 === MIMYO_POLICY.captionSha256 && saved.caption === MIMYO_POLICY.caption && saved.token_sha256 === MIMYO_POLICY.tokenSha256 && saved.account_id === accountId && saved.account_username === MIMYO_POLICY.accountUsername && saved.expires_at === MIMYO_POLICY.expiresAt && saved.source_key === MIMYO_POLICY.sourceKey && saved.delivery_key === MIMYO_POLICY.deliveryKey && saved.token_consumed === 1;
}
async function publish(env, value) {
  const input22 = await validateInput(env, value);
  const fresh = await inspect(env, false, true);
  if (fresh.account.id !== input22.accountId) throw new ManualError("manual_account_binding_mismatch", 422);
  const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))`).bind(MIMYO_POLICY.requestId, MIMYO_POLICY.assetId, MIMYO_POLICY.sourceSha256, MIMYO_POLICY.deliverySha256, MIMYO_POLICY.captionSha256, input22.accountId, MIMYO_POLICY.accountUsername, MIMYO_POLICY.tokenSha256, MIMYO_POLICY.expiresAt, MIMYO_POLICY.caption, MIMYO_POLICY.sourceKey, MIMYO_POLICY.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), MIMYO_POLICY.requestId, "%" + MIMYO_POLICY.assetId + "%", "%" + MIMYO_POLICY.assetId + "%", "%" + MIMYO_POLICY.assetId + "%", MIMYO_POLICY.requestId).run();
  if (claim.meta.changes !== 1) throw new ManualError("manual_one_time_claim_conflict", 409);
  let irreversible = false;
  try {
    const container = await graph2(env, input22.accountId + "/media", { image_url: ORIGIN + "/media/" + MIMYO_POLICY.deliveryKey, caption: MIMYO_POLICY.caption });
    if (typeof container.id !== "string" || !container.id) throw new ManualError("manual_container_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, MIMYO_POLICY.requestId).run();
    let ready = false;
    for (let i = 0; i < 8; i++) {
      const result = await graph2(env, container.id + "?fields=status_code");
      if (result.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (result.status_code !== "IN_PROGRESS") throw new ManualError("manual_container_processing_rejected", 502);
      if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
    }
    if (!ready) throw new ManualError("manual_container_processing_not_finished", 503);
    const final = await inspect(env, true, true), saved = await row(env);
    if (final.account.id !== input22.accountId || !saved || !boundRow(saved, input22.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError("manual_final_approval_or_container_changed", 409);
    windowOpen();
    const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(MIMYO_POLICY.requestId, container.id, input22.accountId, MIMYO_POLICY.sourceSha256, MIMYO_POLICY.deliverySha256, MIMYO_POLICY.captionSha256, MIMYO_POLICY.tokenSha256, MIMYO_POLICY.expiresAt).first();
    if (!locked) throw new ManualError("manual_publish_claim_conflict", 409);
    irreversible = true;
    const published = await graph2(env, input22.accountId + "/media_publish", { creation_id: container.id });
    if (typeof published.id !== "string" || !published.id) throw new ManualError("manual_publication_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), MIMYO_POLICY.requestId).run();
    let permalink = null;
    try {
      const media = await graph2(env, published.id + "?fields=permalink");
      if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
    } catch {
    }
    if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, MIMYO_POLICY.requestId, published.id).run();
    return { success: true, requestId: MIMYO_POLICY.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
  } catch (error) {
    const code = error instanceof ManualError ? error.code : "manual_external_or_storage_error";
    await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, MIMYO_POLICY.requestId).run();
    throw new ManualError(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
  }
}
async function status(env) {
  const saved = await row(env);
  const account = await identity(env);
  const media = await recent(env);
  const matches = media.filter(announcementMatch);
  const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
  return { requestId: MIMYO_POLICY.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(MIMYO_POLICY.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === MIMYO_POLICY.caption, thumbnail: await assets(env, !!saved), publicationRequests: 0, automaticRetry: false };
}
var mimyoManualRoutes = new Hono2();
mimyoManualRoutes.use("*", async (c, next) => {
  if (!c.env.API_TOKEN || c.req.header("Authorization") !== "Bearer " + c.env.API_TOKEN) return c.json({ success: false, error: "existing_authentication_required" }, 401);
  await next();
});
mimyoManualRoutes.onError((error, c) => error instanceof ManualError ? c.json({ success: false, error: error.code, automaticRetry: false }, error.httpStatus) : c.json({ success: false, error: "manual_photo_operation_error", errorClass: error.name, automaticRetry: false }, 500));
mimyoManualRoutes.get("/mimyo-20261011/preflight", async (c) => c.json(await preflight(c.env)));
mimyoManualRoutes.get("/mimyo-20261011", async (c) => c.json(await status(c.env)));
mimyoManualRoutes.post("/mimyo-20261011/publish", async (c) => c.json(await publish(c.env, await c.req.json())));
var OHATSU_POLICY = {
  "requestId": "ohatsu-LJWgy_nh12g-manual-20261010",
  "authorizationEvidenceId": "Sentinel_6e300218b48c81919a3f070b1d1d67a9",
  "sourceThreadId": "01a10a2a-219a-7535-b0c2-4fc2494370e0",
  "requestAtJST": "2026-10-10 13:00",
  "request": "\u672C\u7DE8\u516C\u958B\u3057\u305F\u306E\u3067\u3001\u5404SNS\u3067\u544A\u77E5\u3057\u3066",
  "parentAuthorization": "\u4ECA\u56DE1\u4EF6\u306B\u9650\u5B9A\u3057\u305F\u624B\u52D5\u7D4C\u8DEF\u306E\u5B9F\u88C5\u30FB\u30C6\u30B9\u30C8\u30FB\u914D\u5099\u30FBInstagram1\u4EF6\u516C\u958B",
  "videoId": "LJWgy_nh12g",
  "videoTitle": "\u3010\u308F\u304B\u308B\uFF01\u8D85\u8A33\u3011\u304A\u521D\u300C\u6B7B\u306C\u308B\u899A\u609F\u304C\u805E\u304D\u305F\u3044\u300D\uFF5C\u66FD\u6839\u5D0E\u5FC3\u4E2D\u30FB\u5929\u6E80\u5C4B \u7E01\u306E\u4E0B\u3000\u6B4C\u821E\u4F0E",
  "sourceSha256": "a4468e37cacf5e2666d2e42b12c044cee93b21a5ef9d9cdc79a68ad475c804ef",
  "deliverySha256": "dedc4a8a4ddeaf739e955392ba47ef3b4624f4cfc3bf366087d5db5491ef3277",
  "caption": "\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u304A\u521D\u3002\n\u300C\u6B7B\u306C\u308B\u899A\u609F\u304C\u805E\u304D\u305F\u3044\u300D\n\n\u3010\u308F\u304B\u308B\uFF01\u8D85\u8A33\u3011\u306E\u672C\u7DE8\u3092YouTube\u3067\u516C\u958B\u3057\u307E\u3057\u305F\u3002\n\u5929\u6E80\u5C4B\u306E\u7E01\u306E\u4E0B\u306B\u96A0\u308C\u305F\u5FB3\u5175\u885B\u3078\u3001\u304A\u521D\u304C\u899A\u609F\u3092\u554F\u3046\u5834\u9762\u3092\u3001\u539F\u6587\u5B57\u5E55\u30FB\u73FE\u4EE3\u8A9E\u8A33\u4ED8\u304D\u3067\u89E3\u8AAC\u3057\u307E\u3059\u3002\n\n3\u520656\u79D2\u30022026\u5E749\u670826\u65E5\u3001\u6C17\u826F\u5EA7\u516C\u6F14\u3088\u308A\u3002\n\n\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u306E\u30EA\u30F3\u30AF\u96C6\u304B\u3089YouTube\u3078\u3002\n\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u304A\u521D #\u5730\u6B4C\u821E\u4F0E",
  "captionSha256": "41a827ea2f9d544e9239ba475f4b8bc3342bd41ef876e607829c8ccb54719abf",
  "accountId": null,
  "accountUsername": "kerakabuki_official",
  "tokenSha256": "13fdf7d958dd1b26cb800b7847d5723d4b01fb80e223676e4d984a17fe799819",
  "notBefore": "2026-10-10T04:00:00.000Z",
  "expiresAt": "2026-10-10T07:00:00.000Z",
  "maxPublications": 1,
  "automaticPublishing": false,
  "otherMediaPublishing": false,
  "sourceKey": "manual-announcements/LJWgy_nh12g/thumbE-a4468e37cacf5e2666d2e42b12c044cee93b21a5ef9d9cdc79a68ad475c804ef.png",
  "deliveryKey": "manual-announcements/LJWgy_nh12g/thumbE-dedc4a8a4ddeaf739e955392ba47ef3b4624f4cfc3bf366087d5db5491ef3277.jpg",
  "mediaTransform": {
    "sourceFile": "C:\\Users\\NAO\\Documents\\Codex\\2026-10-06\\task-6\\sns-workbench\\operations\\ohatsu-LJWgy_nh12g-manual-20261010\\media\\thumbE.png",
    "deliveryFile": "C:\\Users\\NAO\\Documents\\Codex\\2026-10-06\\task-6\\worker-integration\\evidence\\ohatsu-manual-20261010/thumbE-delivery.jpg",
    "encoding": "JPEG quality100",
    "width": 1280,
    "height": 720,
    "crop": false,
    "resize": false,
    "semanticEdits": false
  },
  "rawTokenSaved": false,
  "tokenProtection": "Windows DPAPI CurrentUser",
  "unrelatedSourcesPreserved": true
};
var GRAPH3 = "https://graph.facebook.com/v21.0";
var ORIGIN2 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError2 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex2 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function windowOpen2() {
  if (Date.now() < Date.parse(OHATSU_POLICY.notBefore) || Date.now() >= Date.parse(OHATSU_POLICY.expiresAt)) throw new ManualError2("manual_authorization_expired_or_not_started", 410);
}
async function validateInput2(env, value) {
  windowOpen2();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError2("manual_input_required", 400);
  const v = value;
  const keys = ["token", "videoId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
  if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError2("manual_exact_input_required", 400);
  if (v.videoId !== OHATSU_POLICY.videoId || v.sourceSha256 !== OHATSU_POLICY.sourceSha256 || v.deliverySha256 !== OHATSU_POLICY.deliverySha256 || v.captionSha256 !== OHATSU_POLICY.captionSha256 || v.accountUsername !== OHATSU_POLICY.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || OHATSU_POLICY.accountId && v.accountId !== OHATSU_POLICY.accountId || await hex2(v.token) !== OHATSU_POLICY.tokenSha256 || await hex2(OHATSU_POLICY.caption) !== OHATSU_POLICY.captionSha256) throw new ManualError2("manual_approval_binding_mismatch", 422);
  return v;
}
async function row2(env) {
  return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(OHATSU_POLICY.requestId).first();
}
async function graph3(env, path, body) {
  if (!env.META_ACCESS_TOKEN) throw new ManualError2("existing_instagram_authentication_unavailable", 503);
  const response = await fetch(GRAPH3 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok || value.error) throw new ManualError2("existing_meta_request_rejected_http_" + response.status, 502);
  return value;
}
async function identity2(env) {
  if (!env.INSTAGRAM_USER_ID || OHATSU_POLICY.accountId && env.INSTAGRAM_USER_ID !== OHATSU_POLICY.accountId) throw new ManualError2("manual_account_binding_mismatch", 422);
  const who = await graph3(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
  if (who.id !== env.INSTAGRAM_USER_ID || who.username !== OHATSU_POLICY.accountUsername) throw new ManualError2("manual_official_account_mismatch", 422);
  return { id: String(who.id), username: String(who.username) };
}
async function publicVideo() {
  const response = await fetch("https://www.youtube.com/oembed?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + OHATSU_POLICY.videoId) + "&format=json", { method: "GET", redirect: "manual", signal: AbortSignal.timeout(15e3) });
  if (!response.ok) throw new ManualError2("approved_youtube_video_not_publicly_available", 409);
  const v = await response.json();
  if (v.title !== OHATSU_POLICY.videoTitle || v.author_url !== "https://www.youtube.com/@kerakabuki") throw new ManualError2("approved_youtube_title_or_owner_differs", 422);
  return { id: OHATSU_POLICY.videoId, title: v.title, publiclyAvailable: true };
}
var announcementMatch2 = (m) => m.caption === OHATSU_POLICY.caption || (m.caption || "").includes("\u6B7B\u306C\u308B\u899A\u609F") && (m.caption || "").includes("\u672C\u7DE8") && (m.caption || "").includes("\u304A\u521D") && Date.parse(m.timestamp || "") >= Date.parse(OHATSU_POLICY.notBefore);
async function recent2(env) {
  const v = await graph3(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
  if (!Array.isArray(v.data)) throw new ManualError2("instagram_recent_media_unavailable", 503);
  return v.data;
}
async function assets2(env, required = false) {
  const found = {};
  for (const [name, key, expected] of [["source", OHATSU_POLICY.sourceKey, OHATSU_POLICY.sourceSha256], ["delivery", OHATSU_POLICY.deliveryKey, OHATSU_POLICY.deliverySha256]]) {
    const object2 = await env.R2.get(key);
    if (!object2) {
      found[name] = false;
      continue;
    }
    if (object2.size < 1e3 || object2.size > 2e6 || await hex2(await object2.arrayBuffer()) !== expected) throw new ManualError2("approved_thumbnail_storage_mismatch", 422);
    found[name] = true;
  }
  if (required && (!found.source || !found.delivery)) throw new ManualError2("approved_thumbnail_not_prepared", 409);
  return found;
}
async function inspect2(env, allowOwnClaim = false, requireAssets = false) {
  windowOpen2();
  const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
  if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError2("instagram_is_disabled", 409);
  const own = await row2(env);
  if (own && !allowOwnClaim) throw new ManualError2("manual_one_time_slot_already_consumed", 409);
  const duplicate = await env.DB.prepare(`SELECT id FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ? OR (instagram_posted=1 AND post_date='2026-10-10' AND published_caption LIKE '%\u6B7B\u306C\u308B\u899A\u609F%' AND published_caption LIKE '%\u672C\u7DE8%' AND published_caption LIKE '%\u304A\u521D%') LIMIT 1`).bind("%" + OHATSU_POLICY.videoId + "%", "%" + OHATSU_POLICY.videoId + "%", "%" + OHATSU_POLICY.videoId + "%").first();
  if (duplicate) throw new ManualError2("manual_announcement_already_in_existing365", 409);
  const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
  if (inflight) throw new ManualError2("existing365_publication_inflight_or_uncertain", 409);
  const account = await identity2(env), video = await publicVideo(), media = await recent2(env);
  if (media.some(announcementMatch2)) throw new ManualError2("manual_announcement_already_on_instagram", 409);
  return { account, video, thumbnail: await assets2(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: OHATSU_POLICY.expiresAt, oneTimeClaimed: !!own };
}
var preflight2 = (env) => inspect2(env);
async function uploadAssets(env, value, source, delivery) {
  await validateInput2(env, value);
  if (await row2(env)) throw new ManualError2("manual_one_time_slot_already_consumed", 409);
  const sourceBytes = await source.arrayBuffer(), deliveryBytes = await delivery.arrayBuffer();
  const png = new Uint8Array(sourceBytes), jpg = new Uint8Array(deliveryBytes);
  if (sourceBytes.byteLength > 2e6 || deliveryBytes.byteLength > 2e6 || png[0] !== 137 || png[1] !== 80 || jpg[0] !== 255 || jpg[1] !== 216 || await hex2(sourceBytes) !== OHATSU_POLICY.sourceSha256 || await hex2(deliveryBytes) !== OHATSU_POLICY.deliverySha256) throw new ManualError2("manual_exact_thumbnail_required", 422);
  for (const [key, bytes, type] of [[OHATSU_POLICY.sourceKey, sourceBytes, "image/png"], [OHATSU_POLICY.deliveryKey, deliveryBytes, "image/jpeg"]]) {
    const existing = await env.R2.get(key);
    if (existing) {
      if (await hex2(await existing.arrayBuffer()) !== await hex2(bytes)) throw new ManualError2("manual_asset_collision", 409);
    } else await env.R2.put(key, bytes, { httpMetadata: { contentType: type } });
  }
  return { prepared: true, ...await assets2(env, true), publicationRequests: 0 };
}
function boundRow2(saved, accountId) {
  return saved.request_id === OHATSU_POLICY.requestId && saved.video_id === OHATSU_POLICY.videoId && saved.source_sha256 === OHATSU_POLICY.sourceSha256 && saved.delivery_sha256 === OHATSU_POLICY.deliverySha256 && saved.caption_sha256 === OHATSU_POLICY.captionSha256 && saved.caption === OHATSU_POLICY.caption && saved.token_sha256 === OHATSU_POLICY.tokenSha256 && saved.account_id === accountId && saved.account_username === OHATSU_POLICY.accountUsername && saved.expires_at === OHATSU_POLICY.expiresAt && saved.source_key === OHATSU_POLICY.sourceKey && saved.delivery_key === OHATSU_POLICY.deliveryKey && saved.token_consumed === 1;
}
async function publish2(env, value) {
  const input22 = await validateInput2(env, value);
  const fresh = await inspect2(env, false, true);
  if (fresh.account.id !== input22.accountId) throw new ManualError2("manual_account_binding_mismatch", 422);
  const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)`).bind(OHATSU_POLICY.requestId, OHATSU_POLICY.videoId, OHATSU_POLICY.sourceSha256, OHATSU_POLICY.deliverySha256, OHATSU_POLICY.captionSha256, input22.accountId, OHATSU_POLICY.accountUsername, OHATSU_POLICY.tokenSha256, OHATSU_POLICY.expiresAt, OHATSU_POLICY.caption, OHATSU_POLICY.sourceKey, OHATSU_POLICY.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), OHATSU_POLICY.requestId, "%" + OHATSU_POLICY.videoId + "%", "%" + OHATSU_POLICY.videoId + "%", "%" + OHATSU_POLICY.videoId + "%").run();
  if (claim.meta.changes !== 1) throw new ManualError2("manual_one_time_claim_conflict", 409);
  let irreversible = false;
  try {
    const container = await graph3(env, input22.accountId + "/media", { image_url: ORIGIN2 + "/media/" + OHATSU_POLICY.deliveryKey, caption: OHATSU_POLICY.caption });
    if (typeof container.id !== "string" || !container.id) throw new ManualError2("manual_container_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, OHATSU_POLICY.requestId).run();
    let ready = false;
    for (let i = 0; i < 8; i++) {
      const result = await graph3(env, container.id + "?fields=status_code");
      if (result.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (result.status_code !== "IN_PROGRESS") throw new ManualError2("manual_container_processing_rejected", 502);
      if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
    }
    if (!ready) throw new ManualError2("manual_container_processing_not_finished", 503);
    const final = await inspect2(env, true, true), saved = await row2(env);
    if (final.account.id !== input22.accountId || !saved || !boundRow2(saved, input22.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError2("manual_final_approval_or_container_changed", 409);
    windowOpen2();
    const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(OHATSU_POLICY.requestId, container.id, input22.accountId, OHATSU_POLICY.sourceSha256, OHATSU_POLICY.deliverySha256, OHATSU_POLICY.captionSha256, OHATSU_POLICY.tokenSha256, OHATSU_POLICY.expiresAt).first();
    if (!locked) throw new ManualError2("manual_publish_claim_conflict", 409);
    irreversible = true;
    const published = await graph3(env, input22.accountId + "/media_publish", { creation_id: container.id });
    if (typeof published.id !== "string" || !published.id) throw new ManualError2("manual_publication_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), OHATSU_POLICY.requestId).run();
    let permalink = null;
    try {
      const media = await graph3(env, published.id + "?fields=permalink");
      if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
    } catch {
    }
    if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, OHATSU_POLICY.requestId, published.id).run();
    return { success: true, requestId: OHATSU_POLICY.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
  } catch (error) {
    const code = error instanceof ManualError2 ? error.code : "manual_external_or_storage_error";
    await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, OHATSU_POLICY.requestId).run();
    throw new ManualError2(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
  }
}
async function status2(env) {
  const saved = await row2(env);
  const account = await identity2(env);
  const media = await recent2(env);
  const matches = media.filter(announcementMatch2);
  const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
  return { requestId: OHATSU_POLICY.requestId, record: saved, account, observedMedia: actual || null, observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === OHATSU_POLICY.caption, thumbnail: await assets2(env, !!saved), publicationRequests: 0, automaticRetry: false };
}
async function reconcile(env) {
  const proof2 = await status2(env), saved = proof2.record;
  if (!saved || !["publishing", "uncertain"].includes(saved.state) || !boundRow2(saved, proof2.account.id) || !proof2.exactCaptionVerified || proof2.observedMatchingCount !== 1 || !proof2.observedMedia) throw new ManualError2("manual_uncertain_result_not_uniquely_proven", 409);
  const media = proof2.observedMedia;
  await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id, media.permalink || null, media.timestamp || (/* @__PURE__ */ new Date()).toISOString(), OHATSU_POLICY.requestId).run();
  return { reconciled: true, mediaId: media.id, permalink: media.permalink, publicationRequests: 0, automaticRetry: false };
}
var ohatsuManualRoutes = new Hono2();
ohatsuManualRoutes.use("*", async (c, next) => {
  if (!c.env.API_TOKEN || c.req.header("Authorization") !== "Bearer " + c.env.API_TOKEN) return c.json({ error: "Unauthorized" }, 401);
  return next();
});
ohatsuManualRoutes.onError((error, c) => error instanceof ManualError2 ? c.json({ success: false, error: error.code, automaticRetry: false }, error.httpStatus) : c.json({ success: false, error: "manual_operation_error", errorClass: error.name, errorKinds: error.message.match(/D1_ERROR|no such column:\s*[a-zA-Z_.]+|no such table:\s*[a-zA-Z_.]+|Invalid URL|AbortSignal|fetch failed|Unexpected offline endpoint|Unexpected offline outbound host/gi) || [], automaticRetry: false }, 500));
ohatsuManualRoutes.get("/ohatsu-20261010/preflight", async (c) => c.json(await preflight2(c.env)));
ohatsuManualRoutes.get("/ohatsu-20261010", async (c) => c.json(await status2(c.env)));
ohatsuManualRoutes.post("/ohatsu-20261010/assets", async (c) => {
  const form = await c.req.formData(), source = form.get("source"), delivery = form.get("delivery");
  if (!(source instanceof File) || !(delivery instanceof File) || typeof form.get("binding") !== "string") throw new ManualError2("manual_source_and_delivery_required", 400);
  const binding = JSON.parse(form.get("binding"));
  return c.json(await uploadAssets(c.env, binding, source, delivery));
});
ohatsuManualRoutes.post("/ohatsu-20261010/publish", async (c) => c.json(await publish2(c.env, await c.req.json())));
ohatsuManualRoutes.post("/ohatsu-20261010/reconcile", async (c) => c.json(await reconcile(c.env)));
var app = new Hono2();
app.onError((err, c) => {
  console.error("Unhandled error:", err.message);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});
app.use("/api/*", cors({
  origin: [
    "https://kabuki-post-365.kerakabuki.workers.dev",
    "https://kabukiplus.com",
    "http://localhost:5173"
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));
app.use("/api/v1/*", async (c, next) => {
  if (c.req.path.startsWith("/api/v1/navi/")) return next();
  if (c.req.path.startsWith("/api/v1/reels/jobs/")) {
    const bearer = (c.req.header("Authorization") || "").replace(/^Bearer /, "");
    if (await verifyRendererToken(bearer)) return next();
  }
  const token = c.env.API_TOKEN;
  if (!token) return next();
  const auth = c.req.header("Authorization");
  if (!auth || auth !== `Bearer ${token}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});
app.route("/api/v1/characters", charactersRoutes);
app.route("/api/v1/images", imagesRoutes);
app.route("/api/v1/posts", postsRoutes);
app.route("/api/v1/calendar", calendarRoutes);
app.route("/api/v1/generate", generateRoutes);
app.route("/api/v1/reels", reelsRoutes);
app.route("/api/v1/crossposts", crosspostRoutes);
app.route("/api/v1/quiz", quizRoutes);
app.route("/api/v1/export", exportRoutes);
app.route("/api/v1/settings", settingsRoutes);
app.route("/api/v1/navi", naviRoutes);
app.route("/api/v1/auto-post", autoPostRoutes);
app.route("/api/v1/manual-announcements", ohatsuManualRoutes);
app.route("/api/v1/manual-photos", mimyoManualRoutes);
app.get("/images/navi/:size/:imageId", async (c) => {
  const { size, imageId } = c.req.param();
  const validSizes = ["card", "detail", "thumb"];
  if (!validSizes.includes(size)) {
    return c.json({ error: "Invalid size" }, 400);
  }
  const id = imageId.replace(/\.jpg$/, "");
  const r2Key = `navi/${size}/${id}.jpg`;
  const object2 = await c.env.R2.get(r2Key);
  if (!object2) {
    return c.json({ error: "Image not found" }, 404);
  }
  const headers = new Headers();
  headers.set("Content-Type", "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000");
  return new Response(object2.body, { headers });
});
app.get("/images/r2/*", async (c) => {
  const r2Key = c.req.path.replace("/images/r2/", "");
  if (!r2Key) return c.json({ error: "No key specified" }, 400);
  if (r2Key.startsWith("reels/audio/")) return c.notFound();
  const object2 = await c.env.R2.get(r2Key);
  if (!object2) {
    return c.json({ error: "Image not found" }, 404);
  }
  const ext = r2Key.split(".").pop()?.toLowerCase() || "jpg";
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=3600");
  return new Response(object2.body, { headers });
});
app.on(["GET", "HEAD"], "/media/*", async (c) => {
  const key = decodeURIComponent(c.req.path.replace("/media/", ""));
  if (!key || key.includes("..") || key.startsWith("reels/audio/")) return c.notFound();
  const object2 = await c.env.R2.get(key, { range: c.req.raw.headers });
  if (!object2) return c.notFound();
  const h = new Headers();
  object2.writeHttpMetadata(h);
  h.set("Accept-Ranges", "bytes");
  h.set("Cache-Control", "public,max-age=3600");
  h.set("ETag", object2.httpEtag);
  if (c.req.header("Range") && object2.range && "offset" in object2.range && object2.range.offset !== void 0 && "length" in object2.range && object2.range.length !== void 0) {
    h.set("Content-Range", `bytes ${object2.range.offset}-${object2.range.offset + object2.range.length - 1}/${object2.size}`);
    h.set("Content-Length", String(object2.range.length));
  } else h.set("Content-Length", String(object2.size));
  return new Response(c.req.method === "HEAD" ? null : object2.body, { status: h.has("Content-Range") ? 206 : 200, headers: h });
});
app.post("/api/auth/verify", async (c) => {
  const token = c.env.API_TOKEN;
  if (!token) return c.json({ ok: true });
  const body = await c.req.json();
  if (body.token === token) return c.json({ ok: true });
  return c.json({ error: "Invalid token" }, 401);
});
app.get("/api/health", (c) => c.json({ status: "ok", service: "kabuki-post-365" }));
var index_default = {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    const eveningWindow = event.cron === "*/15 10 * * *" || event.cron === "*/15 10-12 * * *";
    if (eveningWindow && !eveningFeedEnabled(await settings(env), getJSTNow().date)) {
      ctx.waitUntil((async () => {
        const { run, reason } = await shouldRunStoryNow(env);
        console.log(`[scheduled:story] ${reason}`);
        if (!run) return;
        await runEveningStory(env);
      })());
      return;
    }
    ctx.waitUntil((async () => {
      const { run, reason, slot } = await shouldRunNow(env);
      console.log(`[scheduled] ${reason}`);
      if (!run) return;
      const date = getJSTNow().date;
      const report = await runDailyPipeline(env, date, slot);
      if (report.results.some((r) => r.platforms.some((p2) => p2.success))) await markDone(env, date, slot);
    })());
  }
};
var KIRA_POLICY = {
  "requestId": "kira027-now-20261013-instagram",
  "request": "OK\n\u4ECA\u6295\u7A3F\u3057\u3066",
  "authorization": "Exact corrected stage photo and captions approved by user for publication now; replaces today evening slot.",
  "assetId": "photo:kira027-20261013",
  "photoId": "additional-kira-two-men-027",
  "imageId": 309,
  "characterId": null,
  "characterName": null,
  "playName": "\u5207\u3089\u308C\u4E0E\u4E09",
  "naviEnmokuId": null,
  "naviCastId": null,
  "sourceSha256": "4ab2b1f0ee1755b214d148b803391c464eb0d40190346dce1b18dc00d856c624",
  "deliverySha256": "4a6ef5238a82987646ac302bb6847f6f5bba5cdc06ca0d966e693e69af2ef264",
  "permissionSha256": "5ad0cc0f3b3f60109632939825fa394b25a50ad7036271c47e5637c9955013c6",
  "identitySha256": "74d298f7dc2f7f59462a51e1311aecf3d5a99bd5d9407303ff090953128e7d21",
  "identityReviewedAt": "2026-10-07T12:07:37.346Z",
  "primarySha256": "39bf63500580f49a06e1e43a29cfdf23ca45a9b5f270e997c6b0c10689fb10cb",
  "caption": "\u300E\u5207\u3089\u308C\u4E0E\u4E09\u300F\u306E\u821E\u53F0\u304B\u3089\u3002\n\n\u4E26\u3093\u3060\u4E8C\u4EBA\u306E\u3001\u7E1E\u306E\u8863\u88F3\u3002\n\u5C71\u6C34\u753B\u306E\u5C4F\u98A8\u3068\u3001\u7DD1\u306E\u8956\u3002\n\u821E\u53F0\u306E\u8272\u306B\u3082\u76EE\u3092\u5411\u3051\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002",
  "accountId": null,
  "accountUsername": "kerakabuki_official",
  "tokenSha256": "acfaa8264ad2734ded254b69491d6d940dcf38d3b90c6f1d4cdfd664450ca39b",
  "notBefore": "2026-10-13T00:40:20.352Z",
  "expiresAt": "2026-10-13T02:40:20.352Z",
  "duplicateSince": "2026-09-28T15:00:00.000Z",
  "todaySince": "2026-10-12T15:00:00.000Z",
  "maxPublications": 1,
  "automaticPublishing": false,
  "otherMediaPublishing": false,
  "sourceKey": "local-approval:5ad0cc0f3b3f60109632939825fa394b25a50ad7036271c47e5637c9955013c6",
  "deliveryKey": "originals/kira027_approved_20261013_4a6ef5238a82.jpg",
  "rawTokenSaved": false,
  "originalGateApprovalChanged": false,
  "photoPermissionExpiryExtended": false,
  "captionSha256": "37fb4dc93199bb7713cc3ce6ecb17dea3f46020f5eb468745db8e91d6c3ef888"
};
var GRAPH4 = "https://graph.facebook.com/v21.0";
var ORIGIN3 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError3 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex3 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function windowOpen3() {
  if (Date.now() < Date.parse(KIRA_POLICY.notBefore) || Date.now() >= Date.parse(KIRA_POLICY.expiresAt)) throw new ManualError3("manual_authorization_expired_or_not_started", 410);
}
async function validateInput3(env, value) {
  windowOpen3();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError3("manual_input_required", 400);
  const v = value;
  const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
  if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError3("manual_exact_input_required", 400);
  if (v.assetId !== KIRA_POLICY.assetId || v.sourceSha256 !== KIRA_POLICY.sourceSha256 || v.deliverySha256 !== KIRA_POLICY.deliverySha256 || v.captionSha256 !== KIRA_POLICY.captionSha256 || v.accountUsername !== KIRA_POLICY.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || KIRA_POLICY.accountId && v.accountId !== KIRA_POLICY.accountId || await hex3(v.token) !== KIRA_POLICY.tokenSha256 || await hex3(KIRA_POLICY.caption) !== KIRA_POLICY.captionSha256) throw new ManualError3("manual_approval_binding_mismatch", 422);
  return v;
}
async function row3(env) {
  return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(KIRA_POLICY.requestId).first();
}
async function graph4(env, path, body) {
  if (!env.META_ACCESS_TOKEN) throw new ManualError3("existing_instagram_authentication_unavailable", 503);
  const response = await fetch(GRAPH4 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok || value.error) throw new ManualError3("existing_meta_request_rejected_http_" + response.status, 502);
  return value;
}
async function identity3(env) {
  if (!env.INSTAGRAM_USER_ID || KIRA_POLICY.accountId && env.INSTAGRAM_USER_ID !== KIRA_POLICY.accountId) throw new ManualError3("manual_account_binding_mismatch", 422);
  const who = await graph4(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
  if (who.id !== env.INSTAGRAM_USER_ID || who.username !== KIRA_POLICY.accountUsername) throw new ManualError3("manual_official_account_mismatch", 422);
  return { id: String(who.id), username: String(who.username) };
}
async function photoProof2(env) {
  const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(KIRA_POLICY.imageId).first();
  if (!image || image.id !== KIRA_POLICY.imageId || image.r2_key !== KIRA_POLICY.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== KIRA_POLICY.characterId || image.play_name !== KIRA_POLICY.playName || image.name !== KIRA_POLICY.characterName || image.navi_enmoku_id !== KIRA_POLICY.naviEnmokuId || image.navi_cast_id !== KIRA_POLICY.naviCastId || image.scene_type !== "\u821E\u53F0\u5199\u771F" || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError3("approved_exact_photo_metadata_changed", 422);
  return { imageId: KIRA_POLICY.imageId, playName: KIRA_POLICY.playName, characterName: KIRA_POLICY.characterName, originalSha256: KIRA_POLICY.sourceSha256, deliverySha256: KIRA_POLICY.deliverySha256, identityReviewedAt: KIRA_POLICY.identityReviewedAt, permissionProof: KIRA_POLICY.permissionSha256, identityProof: KIRA_POLICY.identitySha256, primaryProof: KIRA_POLICY.primarySha256 };
}
var announcementMatch3 = (m) => m.caption === KIRA_POLICY.caption;
async function recent3(env) {
  const v = await graph4(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
  if (!Array.isArray(v.data)) throw new ManualError3("instagram_recent_media_unavailable", 503);
  return v.data;
}
async function assets3(env, _required = false) {
  const object2 = await env.R2.get(KIRA_POLICY.deliveryKey);
  if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex3(await object2.arrayBuffer()) !== KIRA_POLICY.deliverySha256) throw new ManualError3("approved_exact_photo_storage_changed", 422);
  return { delivery: true, deliverySha256: KIRA_POLICY.deliverySha256, originalAndIdentityProofPinned: true };
}
async function inspect3(env, allowOwnClaim = false, requireAssets = false) {
  windowOpen3();
  const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
  if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError3("instagram_is_disabled", 409);
  const own = await row3(env);
  if (own && !allowOwnClaim) throw new ManualError3("manual_one_time_slot_already_consumed", 409);
  const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(KIRA_POLICY.caption, KIRA_POLICY.imageId).first();
  if (duplicate) throw new ManualError3("manual_announcement_already_in_existing365", 409);
  const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
  if (inflight) throw new ManualError3("existing365_publication_inflight_or_uncertain", 409);
  const account = await identity3(env), photo = await photoProof2(env), media = await recent3(env);
  if (media.some(announcementMatch3)) throw new ManualError3("manual_photo_already_on_instagram", 409);
  if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(KIRA_POLICY.todaySince))) throw new ManualError3("instagram_has_today_publication", 409);
  const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(KIRA_POLICY.requestId).first();
  if (otherManual) throw new ManualError3("other_manual_publication_inflight_or_uncertain", 409);
  return { account, photo, thumbnail: await assets3(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: KIRA_POLICY.expiresAt, oneTimeClaimed: !!own };
}
var preflight3 = (env) => inspect3(env);
function boundRow3(saved, accountId) {
  return saved.request_id === KIRA_POLICY.requestId && saved.video_id === KIRA_POLICY.assetId && saved.source_sha256 === KIRA_POLICY.sourceSha256 && saved.delivery_sha256 === KIRA_POLICY.deliverySha256 && saved.caption_sha256 === KIRA_POLICY.captionSha256 && saved.caption === KIRA_POLICY.caption && saved.token_sha256 === KIRA_POLICY.tokenSha256 && saved.account_id === accountId && saved.account_username === KIRA_POLICY.accountUsername && saved.expires_at === KIRA_POLICY.expiresAt && saved.source_key === KIRA_POLICY.sourceKey && saved.delivery_key === KIRA_POLICY.deliveryKey && saved.token_consumed === 1;
}
async function publish3(env, value) {
  const input22 = await validateInput3(env, value);
  const fresh = await inspect3(env, false, true);
  if (fresh.account.id !== input22.accountId) throw new ManualError3("manual_account_binding_mismatch", 422);
  const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))`).bind(KIRA_POLICY.requestId, KIRA_POLICY.assetId, KIRA_POLICY.sourceSha256, KIRA_POLICY.deliverySha256, KIRA_POLICY.captionSha256, input22.accountId, KIRA_POLICY.accountUsername, KIRA_POLICY.tokenSha256, KIRA_POLICY.expiresAt, KIRA_POLICY.caption, KIRA_POLICY.sourceKey, KIRA_POLICY.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), KIRA_POLICY.requestId, "%" + KIRA_POLICY.assetId + "%", "%" + KIRA_POLICY.assetId + "%", "%" + KIRA_POLICY.assetId + "%", KIRA_POLICY.requestId).run();
  if (claim.meta.changes !== 1) throw new ManualError3("manual_one_time_claim_conflict", 409);
  let irreversible = false;
  try {
    const container = await graph4(env, input22.accountId + "/media", { image_url: ORIGIN3 + "/media/" + KIRA_POLICY.deliveryKey, caption: KIRA_POLICY.caption });
    if (typeof container.id !== "string" || !container.id) throw new ManualError3("manual_container_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, KIRA_POLICY.requestId).run();
    let ready = false;
    for (let i = 0; i < 8; i++) {
      const result = await graph4(env, container.id + "?fields=status_code");
      if (result.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (result.status_code !== "IN_PROGRESS") throw new ManualError3("manual_container_processing_rejected", 502);
      if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
    }
    if (!ready) throw new ManualError3("manual_container_processing_not_finished", 503);
    const final = await inspect3(env, true, true), saved = await row3(env);
    if (final.account.id !== input22.accountId || !saved || !boundRow3(saved, input22.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError3("manual_final_approval_or_container_changed", 409);
    windowOpen3();
    const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(KIRA_POLICY.requestId, container.id, input22.accountId, KIRA_POLICY.sourceSha256, KIRA_POLICY.deliverySha256, KIRA_POLICY.captionSha256, KIRA_POLICY.tokenSha256, KIRA_POLICY.expiresAt).first();
    if (!locked) throw new ManualError3("manual_publish_claim_conflict", 409);
    irreversible = true;
    const published = await graph4(env, input22.accountId + "/media_publish", { creation_id: container.id });
    if (typeof published.id !== "string" || !published.id) throw new ManualError3("manual_publication_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), KIRA_POLICY.requestId).run();
    let permalink = null;
    try {
      const media = await graph4(env, published.id + "?fields=permalink");
      if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
    } catch {
    }
    if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, KIRA_POLICY.requestId, published.id).run();
    return { success: true, requestId: KIRA_POLICY.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
  } catch (error) {
    const code = error instanceof ManualError3 ? error.code : "manual_external_or_storage_error";
    await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, KIRA_POLICY.requestId).run();
    throw new ManualError3(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
  }
}
async function status3(env) {
  const saved = await row3(env);
  const account = await identity3(env);
  const media = await recent3(env);
  const matches = media.filter(announcementMatch3);
  const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
  return { requestId: KIRA_POLICY.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(KIRA_POLICY.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === KIRA_POLICY.caption, thumbnail: await assets3(env, !!saved), publicationRequests: 0, automaticRetry: false };
}
var prefix = "/api/v1/manual-photos/kira027-20261013";
var paths = /* @__PURE__ */ new Set([prefix, prefix + "/preflight", prefix + "/publish"]);
var index_default2 = { ...index_default, async fetch(request, env, ctx) {
  const pathname = new URL(request.url).pathname;
  if (!paths.has(pathname)) return index_default.fetch(request, env, ctx);
  const json22 = (v, status42 = 200) => new Response(JSON.stringify(v), { status: status42, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (!env.API_TOKEN || request.headers.get("Authorization") !== "Bearer " + env.API_TOKEN) return json22({ success: false, error: "existing_authentication_required" }, 401);
  try {
    if (pathname === prefix && request.method === "GET") return json22(await status3(env));
    if (pathname === prefix + "/preflight" && request.method === "GET") return json22(await preflight3(env));
    if (pathname === prefix + "/publish" && request.method === "POST") return json22(await publish3(env, await request.json()));
    return json22({ success: false, error: "method_not_allowed" }, 405);
  } catch (error) {
    return error instanceof ManualError3 ? json22({ success: false, error: error.code, automaticRetry: false }, error.httpStatus) : json22({ success: false, error: "manual_photo_operation_error", automaticRetry: false }, 500);
  }
} };
var KIRA_POLICY2 = {
  "requestId": "kira054-evening-20261013-instagram",
  "request": "\u5915\u65B9\u5206\u3092\u6295\u7A3F\u3057\u3066",
  "authorization": "User explicitly requests separate evening publication after morning release. Existing photograph-use permission applies. New caption is limited to visually verified details; unconfirmed role and scene claims remain held.",
  "assetId": "photo:kira054-20261013",
  "photoId": "kirare-stage-reunion",
  "imageId": 306,
  "characterId": null,
  "characterName": null,
  "playName": "\u5207\u3089\u308C\u4E0E\u4E09",
  "naviEnmokuId": null,
  "naviCastId": null,
  "sourceSha256": "cf60b968605fa9ea0289798ccc830afbddd3e1d7fa127a2e6a35f2c838e3ce8c",
  "deliverySha256": "13305e8167582d0b4b408ead066e8a035016e73b50e6577c90476dfe99ceae6a",
  "permissionSha256": "fc14210d0f805157c61af23eac8bd2e9891b7da823d9282b5d1d8d52e9fc8783",
  "identitySha256": "89c55fc9e0c8f8155eb700d2571b35f834c861ec48a2116b130e1801f732317b",
  "identityReviewedAt": "2026-10-13T11:17:16.347Z",
  "primarySha256": "620c9a65dad9daa581de6bd6842130e86faf374c77582ee26f3760db3eb6b47b",
  "caption": "\u300E\u5207\u3089\u308C\u4E0E\u4E09\u300F\u306E\u821E\u53F0\u304B\u3089\u3002\n\n\u5DEE\u3057\u51FA\u3057\u305F\u624B\u3068\u3001\u5411\u304B\u3044\u5408\u3046\u4E8C\u4EBA\u3002\n\u9752\u7070\u8272\u306E\u7740\u7269\u3068\u3001\u9BAE\u3084\u304B\u306A\u7E1E\u6A21\u69D8\u3002\n\n\u5199\u771F\u306B\u6B8B\u308B\u4ED5\u8349\u3084\u8863\u88F3\u306B\u3082\u3001\u3054\u6CE8\u76EE\u304F\u3060\u3055\u3044\u3002\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u5207\u3089\u308C\u4E0E\u4E09 #\u5730\u6B4C\u821E\u4F0E",
  "accountId": null,
  "accountUsername": "kerakabuki_official",
  "tokenSha256": "f8ddfd7e8445c85cb9dcd13b87472ada1380fc5a2dec44aee7be001103d347ea",
  "notBefore": "2026-10-13T11:17:16.347Z",
  "expiresAt": "2026-10-13T13:17:16.347Z",
  "duplicateSince": "2026-09-28T15:00:00.000Z",
  "todaySince": "2026-10-12T15:00:00.000Z",
  "maxPublications": 1,
  "automaticPublishing": false,
  "otherMediaPublishing": false,
  "sourceKey": "local-approval:fc14210d0f805157c61af23eac8bd2e9891b7da823d9282b5d1d8d52e9fc8783",
  "deliveryKey": "originals/ig3_20261008_kirare-stage-reunion_13305e816758.jpg",
  "rawTokenSaved": false,
  "originalGateApprovalChanged": false,
  "photoPermissionExpiryExtended": false,
  "captionSha256": "4b75818af7a84e5a6f98e08a9864ba8d6e843a0831ef8461a8a685979eec2790",
  "allowedPriorTodayMediaId": "18144256588586144",
  "altText": "\u300E\u5207\u3089\u308C\u4E0E\u4E09\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u7070\u8272\u306E\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u3068\u3001\u8D64\u30FB\u767D\u30FB\u7D3A\u306E\u7E1E\u6A21\u69D8\u306E\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u304C\u5411\u304B\u3044\u5408\u3063\u3066\u3044\u308B\u3002\u80CC\u666F\u306B\u306F\u5C71\u6C34\u753B\u306E\u5C4F\u98A8\u3068\u7DD1\u306E\u8956\u304C\u3042\u308B\u3002"
};
var GRAPH5 = "https://graph.facebook.com/v21.0";
var ORIGIN4 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError4 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex4 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function windowOpen4() {
  if (Date.now() < Date.parse(KIRA_POLICY2.notBefore) || Date.now() >= Date.parse(KIRA_POLICY2.expiresAt)) throw new ManualError4("manual_authorization_expired_or_not_started", 410);
}
async function validateInput4(env, value) {
  windowOpen4();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError4("manual_input_required", 400);
  const v = value;
  const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
  if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError4("manual_exact_input_required", 400);
  if (v.assetId !== KIRA_POLICY2.assetId || v.sourceSha256 !== KIRA_POLICY2.sourceSha256 || v.deliverySha256 !== KIRA_POLICY2.deliverySha256 || v.captionSha256 !== KIRA_POLICY2.captionSha256 || v.accountUsername !== KIRA_POLICY2.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || KIRA_POLICY2.accountId && v.accountId !== KIRA_POLICY2.accountId || await hex4(v.token) !== KIRA_POLICY2.tokenSha256 || await hex4(KIRA_POLICY2.caption) !== KIRA_POLICY2.captionSha256) throw new ManualError4("manual_approval_binding_mismatch", 422);
  return v;
}
async function row4(env) {
  return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(KIRA_POLICY2.requestId).first();
}
async function graph5(env, path, body) {
  if (!env.META_ACCESS_TOKEN) throw new ManualError4("existing_instagram_authentication_unavailable", 503);
  const response = await fetch(GRAPH5 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok || value.error) throw new ManualError4("existing_meta_request_rejected_http_" + response.status, 502);
  return value;
}
async function identity4(env) {
  if (!env.INSTAGRAM_USER_ID || KIRA_POLICY2.accountId && env.INSTAGRAM_USER_ID !== KIRA_POLICY2.accountId) throw new ManualError4("manual_account_binding_mismatch", 422);
  const who = await graph5(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
  if (who.id !== env.INSTAGRAM_USER_ID || who.username !== KIRA_POLICY2.accountUsername) throw new ManualError4("manual_official_account_mismatch", 422);
  return { id: String(who.id), username: String(who.username) };
}
async function photoProof3(env) {
  const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(KIRA_POLICY2.imageId).first();
  if (!image || image.id !== KIRA_POLICY2.imageId || image.r2_key !== KIRA_POLICY2.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== KIRA_POLICY2.characterId || image.play_name !== KIRA_POLICY2.playName || image.name !== KIRA_POLICY2.characterName || image.navi_enmoku_id !== KIRA_POLICY2.naviEnmokuId || image.navi_cast_id !== KIRA_POLICY2.naviCastId || image.scene_type !== "\u821E\u53F0" || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError4("approved_exact_photo_metadata_changed", 422);
  return { imageId: KIRA_POLICY2.imageId, playName: KIRA_POLICY2.playName, characterName: KIRA_POLICY2.characterName, originalSha256: KIRA_POLICY2.sourceSha256, deliverySha256: KIRA_POLICY2.deliverySha256, identityReviewedAt: KIRA_POLICY2.identityReviewedAt, permissionProof: KIRA_POLICY2.permissionSha256, identityProof: KIRA_POLICY2.identitySha256, primaryProof: KIRA_POLICY2.primarySha256 };
}
var announcementMatch4 = (m) => m.caption === KIRA_POLICY2.caption;
async function recent4(env) {
  const v = await graph5(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
  if (!Array.isArray(v.data)) throw new ManualError4("instagram_recent_media_unavailable", 503);
  return v.data;
}
async function assets4(env, _required = false) {
  const object2 = await env.R2.get(KIRA_POLICY2.deliveryKey);
  if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex4(await object2.arrayBuffer()) !== KIRA_POLICY2.deliverySha256) throw new ManualError4("approved_exact_photo_storage_changed", 422);
  return { delivery: true, deliverySha256: KIRA_POLICY2.deliverySha256, originalAndIdentityProofPinned: true };
}
async function inspect4(env, allowOwnClaim = false, requireAssets = false) {
  windowOpen4();
  const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
  if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError4("instagram_is_disabled", 409);
  const own = await row4(env);
  if (own && !allowOwnClaim) throw new ManualError4("manual_one_time_slot_already_consumed", 409);
  const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(KIRA_POLICY2.caption, KIRA_POLICY2.imageId).first();
  if (duplicate) throw new ManualError4("manual_announcement_already_in_existing365", 409);
  const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
  if (inflight) throw new ManualError4("existing365_publication_inflight_or_uncertain", 409);
  const account = await identity4(env), photo = await photoProof3(env), media = await recent4(env);
  if (media.some(announcementMatch4)) throw new ManualError4("manual_photo_already_on_instagram", 409);
  if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(KIRA_POLICY2.todaySince) && m.id !== KIRA_POLICY2.allowedPriorTodayMediaId)) throw new ManualError4("instagram_has_today_publication", 409);
  const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(KIRA_POLICY2.requestId).first();
  if (otherManual) throw new ManualError4("other_manual_publication_inflight_or_uncertain", 409);
  return { account, photo, thumbnail: await assets4(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: KIRA_POLICY2.expiresAt, oneTimeClaimed: !!own };
}
var preflight4 = (env) => inspect4(env);
function boundRow4(saved, accountId) {
  return saved.request_id === KIRA_POLICY2.requestId && saved.video_id === KIRA_POLICY2.assetId && saved.source_sha256 === KIRA_POLICY2.sourceSha256 && saved.delivery_sha256 === KIRA_POLICY2.deliverySha256 && saved.caption_sha256 === KIRA_POLICY2.captionSha256 && saved.caption === KIRA_POLICY2.caption && saved.token_sha256 === KIRA_POLICY2.tokenSha256 && saved.account_id === accountId && saved.account_username === KIRA_POLICY2.accountUsername && saved.expires_at === KIRA_POLICY2.expiresAt && saved.source_key === KIRA_POLICY2.sourceKey && saved.delivery_key === KIRA_POLICY2.deliveryKey && saved.token_consumed === 1;
}
async function publish4(env, value) {
  const input22 = await validateInput4(env, value);
  const fresh = await inspect4(env, false, true);
  if (fresh.account.id !== input22.accountId) throw new ManualError4("manual_account_binding_mismatch", 422);
  const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))`).bind(KIRA_POLICY2.requestId, KIRA_POLICY2.assetId, KIRA_POLICY2.sourceSha256, KIRA_POLICY2.deliverySha256, KIRA_POLICY2.captionSha256, input22.accountId, KIRA_POLICY2.accountUsername, KIRA_POLICY2.tokenSha256, KIRA_POLICY2.expiresAt, KIRA_POLICY2.caption, KIRA_POLICY2.sourceKey, KIRA_POLICY2.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), KIRA_POLICY2.requestId, "%" + KIRA_POLICY2.assetId + "%", "%" + KIRA_POLICY2.assetId + "%", "%" + KIRA_POLICY2.assetId + "%", KIRA_POLICY2.requestId).run();
  if (claim.meta.changes !== 1) throw new ManualError4("manual_one_time_claim_conflict", 409);
  let irreversible = false;
  try {
    const container = await graph5(env, input22.accountId + "/media", { image_url: ORIGIN4 + "/media/" + KIRA_POLICY2.deliveryKey, caption: KIRA_POLICY2.caption, alt_text: KIRA_POLICY2.altText });
    if (typeof container.id !== "string" || !container.id) throw new ManualError4("manual_container_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, KIRA_POLICY2.requestId).run();
    let ready = false;
    for (let i = 0; i < 8; i++) {
      const result = await graph5(env, container.id + "?fields=status_code");
      if (result.status_code === "FINISHED") {
        ready = true;
        break;
      }
      if (result.status_code !== "IN_PROGRESS") throw new ManualError4("manual_container_processing_rejected", 502);
      if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
    }
    if (!ready) throw new ManualError4("manual_container_processing_not_finished", 503);
    const final = await inspect4(env, true, true), saved = await row4(env);
    if (final.account.id !== input22.accountId || !saved || !boundRow4(saved, input22.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError4("manual_final_approval_or_container_changed", 409);
    windowOpen4();
    const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(KIRA_POLICY2.requestId, container.id, input22.accountId, KIRA_POLICY2.sourceSha256, KIRA_POLICY2.deliverySha256, KIRA_POLICY2.captionSha256, KIRA_POLICY2.tokenSha256, KIRA_POLICY2.expiresAt).first();
    if (!locked) throw new ManualError4("manual_publish_claim_conflict", 409);
    irreversible = true;
    const published = await graph5(env, input22.accountId + "/media_publish", { creation_id: container.id });
    if (typeof published.id !== "string" || !published.id) throw new ManualError4("manual_publication_result_unavailable", 502);
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), KIRA_POLICY2.requestId).run();
    let permalink = null;
    try {
      const media = await graph5(env, published.id + "?fields=permalink");
      if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
    } catch {
    }
    if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, KIRA_POLICY2.requestId, published.id).run();
    return { success: true, requestId: KIRA_POLICY2.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
  } catch (error) {
    const code = error instanceof ManualError4 ? error.code : "manual_external_or_storage_error";
    await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, KIRA_POLICY2.requestId).run();
    throw new ManualError4(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
  }
}
async function status4(env) {
  const saved = await row4(env);
  const account = await identity4(env);
  const media = await recent4(env);
  const matches = media.filter(announcementMatch4);
  const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
  return { requestId: KIRA_POLICY2.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(KIRA_POLICY2.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === KIRA_POLICY2.caption, thumbnail: await assets4(env, !!saved), publicationRequests: 0, automaticRetry: false };
}
var prefix2 = "/api/v1/manual-photos/kira054-evening-20261013";
var paths2 = /* @__PURE__ */ new Set([prefix2, prefix2 + "/preflight", prefix2 + "/publish"]);
var index_default3 = { ...index_default2, async fetch(request, env, ctx) {
  const pathname = new URL(request.url).pathname;
  if (!paths2.has(pathname)) return index_default2.fetch(request, env, ctx);
  const json22 = (v, status5 = 200) => new Response(JSON.stringify(v), { status: status5, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (!env.API_TOKEN || request.headers.get("Authorization") !== "Bearer " + env.API_TOKEN) return json22({ success: false, error: "existing_authentication_required" }, 401);
  try {
    if (pathname === prefix2 && request.method === "GET") return json22(await status4(env));
    if (pathname === prefix2 + "/preflight" && request.method === "GET") return json22(await preflight4(env));
    if (pathname === prefix2 + "/publish" && request.method === "POST") return json22(await publish4(env, await request.json()));
    return json22({ success: false, error: "method_not_allowed" }, 405);
  } catch (error) {
    return error instanceof ManualError4 ? json22({ success: false, error: error.code, automaticRetry: false }, error.httpStatus) : json22({ success: false, error: "manual_photo_operation_error", automaticRetry: false }, 500);
  }
} };
var GRAPH6 = "https://graph.facebook.com/v21.0";
var ORIGIN5 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError5 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex5 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function createFocus(P) {
  function windowOpen5() {
    if (Date.now() < Date.parse(P.notBefore) || Date.now() >= Date.parse(P.expiresAt)) throw new ManualError5("manual_authorization_expired_or_not_started", 410);
  }
  async function validateInput5(env, value) {
    windowOpen5();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError5("manual_input_required", 400);
    const v = value;
    const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
    if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError5("manual_exact_input_required", 400);
    if (v.assetId !== P.assetId || v.sourceSha256 !== P.sourceSha256 || v.deliverySha256 !== P.deliverySha256 || v.captionSha256 !== P.captionSha256 || v.accountUsername !== P.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || P.accountId && v.accountId !== P.accountId || await hex5(v.token) !== P.tokenSha256 || await hex5(P.caption) !== P.captionSha256) throw new ManualError5("manual_approval_binding_mismatch", 422);
    return v;
  }
  async function row5(env) {
    return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(P.requestId).first();
  }
  async function graph6(env, path, body) {
    if (!env.META_ACCESS_TOKEN) throw new ManualError5("existing_instagram_authentication_unavailable", 503);
    const response = await fetch(GRAPH6 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
    const value = await response.json();
    if (!response.ok || value.error) throw new ManualError5("existing_meta_request_rejected_http_" + response.status, 502);
    return value;
  }
  async function identity5(env) {
    if (!env.INSTAGRAM_USER_ID || P.accountId && env.INSTAGRAM_USER_ID !== P.accountId) throw new ManualError5("manual_account_binding_mismatch", 422);
    const who = await graph6(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
    if (who.id !== env.INSTAGRAM_USER_ID || who.username !== P.accountUsername) throw new ManualError5("manual_official_account_mismatch", 422);
    return { id: String(who.id), username: String(who.username) };
  }
  async function photoProof4(env) {
    const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(P.imageId).first();
    if (!image || image.id !== P.imageId || image.r2_key !== P.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== P.characterId || image.play_name !== P.playName || image.name !== P.characterName || image.navi_enmoku_id !== P.naviEnmokuId || image.navi_cast_id !== P.naviCastId || image.scene_type !== P.sceneType || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError5("approved_exact_photo_metadata_changed", 422);
    return { imageId: P.imageId, playName: P.playName, characterName: P.characterName, originalSha256: P.sourceSha256, deliverySha256: P.deliverySha256, identityReviewedAt: P.identityReviewedAt, permissionProof: P.permissionSha256, identityProof: P.identitySha256, primaryProof: P.primarySha256 };
  }
  const announcementMatch5 = (m) => m.caption === P.caption;
  async function recent5(env) {
    const v = await graph6(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
    if (!Array.isArray(v.data)) throw new ManualError5("instagram_recent_media_unavailable", 503);
    return v.data;
  }
  async function assets5(env, _required = false) {
    const object2 = await env.R2.get(P.deliveryKey);
    if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex5(await object2.arrayBuffer()) !== P.deliverySha256) throw new ManualError5("approved_exact_photo_storage_changed", 422);
    return { delivery: true, deliverySha256: P.deliverySha256, originalAndIdentityProofPinned: true };
  }
  async function inspect5(env, allowOwnClaim = false, requireAssets = false) {
    windowOpen5();
    const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
    if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError5("instagram_is_disabled", 409);
    const own = await row5(env);
    if (own && !allowOwnClaim) throw new ManualError5("manual_one_time_slot_already_consumed", 409);
    const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(P.caption, P.imageId).first();
    if (duplicate) throw new ManualError5("manual_announcement_already_in_existing365", 409);
    const previous = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state IN ('creating','processing','publishing','uncertain','published') LIMIT 1").bind(P.requestId, P.deliverySha256).first();
    if (previous) throw new ManualError5("photo_previously_claimed", 409);
    const sameSlot = await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date, P.slot).first();
    if (sameSlot) throw new ManualError5("existing_slot_used", 409);
    const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
    if (inflight) throw new ManualError5("existing365_publication_inflight_or_uncertain", 409);
    const account = await identity5(env), photo = await photoProof4(env), media = await recent5(env);
    if (media.some(announcementMatch5)) throw new ManualError5("manual_photo_already_on_instagram", 409);
    if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(P.notBefore) && Date.parse(m.timestamp || "") < Date.parse(P.expiresAt))) throw new ManualError5("instagram_has_today_publication", 409);
    const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(P.requestId).first();
    if (otherManual) throw new ManualError5("other_manual_publication_inflight_or_uncertain", 409);
    return { account, photo, thumbnail: await assets5(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: P.expiresAt, oneTimeClaimed: !!own };
  }
  const preflight5 = (env) => inspect5(env);
  function boundRow5(saved, accountId) {
    return saved.request_id === P.requestId && saved.video_id === P.assetId && saved.source_sha256 === P.sourceSha256 && saved.delivery_sha256 === P.deliverySha256 && saved.caption_sha256 === P.captionSha256 && saved.caption === P.caption && saved.token_sha256 === P.tokenSha256 && saved.account_id === accountId && saved.account_username === P.accountUsername && saved.expires_at === P.expiresAt && saved.source_key === P.sourceKey && saved.delivery_key === P.deliveryKey && saved.token_consumed === 1;
  }
  async function publish5(env, value) {
    const input22 = await validateInput5(env, value);
    const fresh = await inspect5(env, false, true);
    if (fresh.account.id !== input22.accountId) throw new ManualError5("manual_account_binding_mismatch", 422);
    const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state='published')
 AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')))`).bind(P.requestId, P.assetId, P.sourceSha256, P.deliverySha256, P.captionSha256, input22.accountId, P.accountUsername, P.tokenSha256, P.expiresAt, P.caption, P.sourceKey, P.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), P.requestId, "%" + P.assetId + "%", "%" + P.assetId + "%", "%" + P.assetId + "%", P.requestId, P.requestId, P.deliverySha256, P.date, P.slot).run();
    if (claim.meta.changes !== 1) throw new ManualError5("manual_one_time_claim_conflict", 409);
    let irreversible = false;
    try {
      const container = await graph6(env, input22.accountId + "/media", { image_url: ORIGIN5 + "/media/" + P.deliveryKey, caption: P.caption, alt_text: P.altText });
      if (typeof container.id !== "string" || !container.id) throw new ManualError5("manual_container_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, P.requestId).run();
      let ready = false;
      for (let i = 0; i < 8; i++) {
        const result = await graph6(env, container.id + "?fields=status_code");
        if (result.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (result.status_code !== "IN_PROGRESS") throw new ManualError5("manual_container_processing_rejected", 502);
        if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
      }
      if (!ready) throw new ManualError5("manual_container_processing_not_finished", 503);
      const final = await inspect5(env, true, true), saved = await row5(env);
      if (final.account.id !== input22.accountId || !saved || !boundRow5(saved, input22.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError5("manual_final_approval_or_container_changed", 409);
      windowOpen5();
      const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(P.requestId, container.id, input22.accountId, P.sourceSha256, P.deliverySha256, P.captionSha256, P.tokenSha256, P.expiresAt).first();
      if (!locked) throw new ManualError5("manual_publish_claim_conflict", 409);
      irreversible = true;
      const published = await graph6(env, input22.accountId + "/media_publish", { creation_id: container.id });
      if (typeof published.id !== "string" || !published.id) throw new ManualError5("manual_publication_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
      let permalink = null;
      try {
        const media = await graph6(env, published.id + "?fields=permalink");
        if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
      } catch {
      }
      if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, P.requestId, published.id).run();
      return { success: true, requestId: P.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
    } catch (error) {
      const code = error instanceof ManualError5 ? error.code : "manual_external_or_storage_error";
      await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, P.requestId).run();
      throw new ManualError5(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
    }
  }
  async function status5(env) {
    const saved = await row5(env);
    const account = await identity5(env);
    const media = await recent5(env);
    const matches = media.filter(announcementMatch5);
    const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
    return { requestId: P.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(P.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === P.caption, thumbnail: await assets5(env, !!saved), publicationRequests: 0, automaticRetry: false };
  }
  async function reconcile2(env) {
    const proof2 = await status5(env), saved = proof2.record;
    if (!saved || !["publishing", "uncertain"].includes(saved.state) || !boundRow5(saved, proof2.account.id) || !proof2.exactCaptionVerified || proof2.observedMatchingCount !== 1 || !proof2.observedMedia) throw new ManualError5("manual_uncertain_result_not_uniquely_proven", 409);
    const media = proof2.observedMedia;
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id, media.permalink || null, media.timestamp || (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
    return { reconciled: true, mediaId: media.id, permalink: media.permalink, publicationRequests: 0, automaticRetry: false };
  }
  return { preflight: preflight5, publish: publish5, status: status5, row: row5, reconcile: reconcile2 };
}
var POLICIES = [
  {
    "requestId": "sonezaki-focus-20261014:2026-10-14:morning",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-14",
    "slot": "morning",
    "assetId": "photo:sonezaki-focus:260",
    "imageId": 260,
    "sourceSha256": "0b960e2894495b029623d90b446cb58a36e7232e51c1d895972aac797d8d1944",
    "deliverySha256": "b94968bbb3bd16e0742c2ce88ef30385db3e86a5d6299457101a9531de63ec17",
    "captionSha256": "44fcb0803c8e10a4285799390eb80c5833718431d649a810a55b40a3b3ac5f3e",
    "caption": "9\u670826\u65E5\u306B\u4E0A\u6F14\u3057\u305F\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3002\n\u4ECA\u9031\u672B\u307E\u3067\u306F\u3001\u305D\u306E\u821E\u53F0\u5199\u771F\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7D2B\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u821E\u53F0\u524D\u65B9\u3067\u7247\u624B\u3092\u4F38\u3070\u3057\u3066\u3044\u308B\u3002\u5F8C\u65B9\u306B\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u7ACB\u3064\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-13T23:00:00.000Z",
    "expiresAt": "2026-10-14T00:00:00.000Z",
    "todaySince": "2026-10-13T23:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_5X4A0124_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.140Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "e6a9344e825003fb2a5037d62abf4f3d78ad1b9013b46ca992daec57c55fce04",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/260.jpg",
    "originalFile": "5X4A0124_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-14:morning:44fcb0803c8e10a4285799390eb80c5833718431d649a810a55b40a3b3ac5f3e",
    "tokenSha256": "c79d6f1cf2ee8a250b13a6a7586342b580d0ccd8d0bb5912a5c19c9f7adef46c"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-14:evening",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-14",
    "slot": "evening",
    "assetId": "photo:sonezaki-focus:254",
    "imageId": 254,
    "sourceSha256": "64b7efb5e7a11cd7a12d85eca6e88c0163cbe633ee6593cddf7e8489dbde6339",
    "deliverySha256": "74fd9ee95eb4e6bb8681aff4cddbe53f261bccfec8ebf9a13610218698fa9881",
    "captionSha256": "63fcc9f15d4385ed9ee3a8f670df030b0dda98236eb39d28a0939a5e0892a2b1",
    "caption": "\u3075\u3063\u3068\u307B\u3069\u3051\u305F\u7B11\u9854\u3082\u3001\u821E\u53F0\u306E\u8A18\u9332\u306E\u3072\u3068\u3064\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u683C\u5B50\u67C4\u306E\u7740\u7269\u3067\u5EA7\u308A\u3001\u7B11\u9854\u3092\u898B\u305B\u308B\u4EBA\u7269\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-14T10:00:00.000Z",
    "expiresAt": "2026-10-14T11:00:00.000Z",
    "todaySince": "2026-10-14T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4338_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.142Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "9f68a1bc90229b6ffe707a6ddc4de5a11996c0ff21e8e3a6d8bf465b75801d1b",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/254.jpg",
    "originalFile": "028A4338_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-14:evening:63fcc9f15d4385ed9ee3a8f670df030b0dda98236eb39d28a0939a5e0892a2b1",
    "tokenSha256": "abfca72864c402004e40507faa131338e8a9db45110045f06693c3ea35ab2cac"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-15:morning",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-15",
    "slot": "morning",
    "assetId": "photo:sonezaki-focus:261",
    "imageId": 261,
    "sourceSha256": "381108c2affc803f4c066da4bdb3745ec46c0ea9cd46f2c5f3ebd27f3ed53d00",
    "deliverySha256": "b6235a35dcc93ace319bb5ce6fd13180fc028ba2171e5a5e93cbe987317d35d5",
    "captionSha256": "2ccc2f3c42bdb98aef714e48e8d5cb6e5d7f1363c56418c30db3da103e3729e5",
    "caption": "\u683C\u5B50\u306E\u8863\u88F3\u3068\u3001\u9BAE\u3084\u304B\u306A\u8896\u3002\u4E8C\u4EBA\u306E\u8EAB\u632F\u308A\u304C\u91CD\u306A\u308B\u5834\u9762\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u683C\u5B50\u67C4\u306E\u8863\u88F3\u3067\u7B20\u3092\u6301\u3064\u4EBA\u7269\u3068\u3001\u4E21\u624B\u3092\u4E0A\u3052\u305F\u9BAE\u3084\u304B\u306A\u8863\u88F3\u306E\u4EBA\u7269\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-14T23:00:00.000Z",
    "expiresAt": "2026-10-15T00:00:00.000Z",
    "todaySince": "2026-10-14T23:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_5X4A0192_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.144Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "26b2412a42a587329dbed82f0862b903fc8b09e485cea8979d7e2f5a9cee786f",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/261.jpg",
    "originalFile": "5X4A0192_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-15:morning:2ccc2f3c42bdb98aef714e48e8d5cb6e5d7f1363c56418c30db3da103e3729e5",
    "tokenSha256": "8b4308ed56d1ebf1c1736daf91ce66b473d66ad228f77fb46d92396fd5fb5477"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-15:evening",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-15",
    "slot": "evening",
    "assetId": "photo:sonezaki-focus:255",
    "imageId": 255,
    "sourceSha256": "19c905141782bad31882957522c2c2ede030bfb7c5cc345d145078484f63a9ea",
    "deliverySha256": "2c7c30a7b4ea9001d1b90a9158c6606b3d22c3f1764d42b131a223d7e2f44dce",
    "captionSha256": "078943730073c30aba141096778b3a804422ed7924a8677ba43897cc47149016",
    "caption": "\u5E55\u306E\u9593\u304B\u3089\u306E\u305E\u304F\u9854\u3002\u7D2B\u306E\u5E03\u306B\u56F2\u307E\u308C\u305F\u3001\u5C0F\u3055\u306A\u4E00\u5834\u9762\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7D2B\u306E\u5E55\u3092\u7247\u624B\u3067\u958B\u304D\u3001\u9854\u3092\u306E\u305E\u304B\u305B\u308B\u4EBA\u7269\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-15T10:00:00.000Z",
    "expiresAt": "2026-10-15T11:00:00.000Z",
    "todaySince": "2026-10-15T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4407_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.146Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "ec57ac1e8eca0e047a17170db4552996181338ca0c7158ee099c82e1d778858b",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/255.jpg",
    "originalFile": "028A4407_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-15:evening:078943730073c30aba141096778b3a804422ed7924a8677ba43897cc47149016",
    "tokenSha256": "9ce92fd19bde3422c65e17dd0dc1e0093d6668d1a24d0556002ba6238be5b4c4"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-16:morning",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-16",
    "slot": "morning",
    "assetId": "photo:sonezaki-focus:262",
    "imageId": 262,
    "sourceSha256": "22958c33fb79b5a0820cf62a01279558961d9ae0d73915b319c0d0ca78fdb9b7",
    "deliverySha256": "9ccc4cfa3b224d3ecce41a6ca4bf74b6347053d4ce8d67948664a8de6bcef4de",
    "captionSha256": "f7941a0cb18177528b46ecc87193f08fa974eab10c493ee5e9580e355489a884",
    "caption": "\u4E21\u8155\u3092\u5E83\u3052\u305F\u59FF\u3002\u305D\u306E\u5F8C\u308D\u306B\u306F\u3001\u8D64\u3044\u8863\u88F3\u304C\u898B\u3048\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u4E21\u8155\u3092\u5E83\u3052\u3001\u305D\u306E\u80CC\u5F8C\u306B\u8D64\u3044\u8863\u88F3\u306E\u4EBA\u7269\u304C\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-15T23:00:00.000Z",
    "expiresAt": "2026-10-16T00:00:00.000Z",
    "todaySince": "2026-10-15T23:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_5X4A0242_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.148Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "5e956a0f799131b592beede5094bd6b41b610c40962d037ad57f552a734fcf32",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/262.jpg",
    "originalFile": "5X4A0242_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-16:morning:f7941a0cb18177528b46ecc87193f08fa974eab10c493ee5e9580e355489a884",
    "tokenSha256": "2d8d16a702070984ee86ae359f01c53183c5a890ddc2ea2799761e9ff7643059"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-16:evening",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-16",
    "slot": "evening",
    "assetId": "photo:sonezaki-focus:256",
    "imageId": 256,
    "sourceSha256": "f8253eb6fc5c989a84de7e8e5e6d08644e4e734d9c3d7cdff4f166ffadae92c3",
    "deliverySha256": "989263d866fbaba8819d1b39acab4d24b714f4de60db30f009c83d5112b61d89",
    "captionSha256": "d3c2ea9f97444d4d718605a9222200265efc2591b9a4fc50bd674a801cbc99ba",
    "caption": "\u80F8\u5143\u306B\u6DFB\u3048\u305F\u624B\u3068\u3001\u3084\u308F\u3089\u304B\u306A\u8868\u60C5\u3002\u821E\u53F0\u306E\u4EBA\u7269\u306E\u59FF\u3092\u304A\u5C4A\u3051\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7070\u8272\u306E\u7FBD\u7E54\u3092\u7740\u305F\u4EBA\u7269\u304C\u80F8\u5143\u306B\u7247\u624B\u3092\u6DFB\u3048\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-16T10:00:00.000Z",
    "expiresAt": "2026-10-16T11:00:00.000Z",
    "todaySince": "2026-10-16T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4418_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.149Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "00d163692b044dbc6b8c761fe43308d159992d22565caef4239511852b66a3ae",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/256.jpg",
    "originalFile": "028A4418_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-16:evening:d3c2ea9f97444d4d718605a9222200265efc2591b9a4fc50bd674a801cbc99ba",
    "tokenSha256": "fe21a45c628639e11a86afc972f0a6ad1b175836f1eb043974df8cfc3fa69288"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-17:morning",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-17",
    "slot": "morning",
    "assetId": "photo:sonezaki-focus:263",
    "imageId": 263,
    "sourceSha256": "b7ca6be6dbb370411fbca861414cc86da4329e479a014b06c9d51904819bee20",
    "deliverySha256": "a125dd9cf258f6166796318fd6246cb500ea11a7ffa5b434136317f3a3f8d7c8",
    "captionSha256": "98d0931a2cc07b6147d3a4130fe329dcecd68b74fc96d86339e2b9f709e37999",
    "caption": "\u524D\u3078\u4F38\u3073\u308B\u8155\u3068\u3001\u7FFB\u308B\u8896\u3002\u52D5\u304D\u306E\u5927\u304D\u3055\u304C\u4F1D\u308F\u308B\u4E00\u679A\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u7247\u624B\u3092\u4E0A\u3052\u3001\u8D64\u3044\u8863\u88F3\u306E\u4EBA\u7269\u3068\u3082\u3046\u7247\u65B9\u306E\u624B\u3092\u3064\u306A\u3044\u3067\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-16T23:00:00.000Z",
    "expiresAt": "2026-10-17T00:00:00.000Z",
    "todaySince": "2026-10-16T23:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_5X4A0256_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.152Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "7ea276fa47b6f99e0a8f211188f121530d264e325ba3a702499f3a90da3dbfeb",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/263.jpg",
    "originalFile": "5X4A0256_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-17:morning:98d0931a2cc07b6147d3a4130fe329dcecd68b74fc96d86339e2b9f709e37999",
    "tokenSha256": "253f6185ead6e0aaea1211b3832f73cba213527756e17f12cff06c5637f46374"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-17:evening",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-17",
    "slot": "evening",
    "assetId": "photo:sonezaki-focus:257",
    "imageId": 257,
    "sourceSha256": "57fed3d1b5f0d819fefeedeef7e07da56483567e26c0649ce7a8a053edb003b3",
    "deliverySha256": "47a8acc2411d443cedba17e1307429a906739aeeab413d6bf1fb34743d6d4400",
    "captionSha256": "99d6a061d32b0ace440038c2c2d2545986d8f70cc0a5109cabc31e896f038a7d",
    "caption": "\u524D\u3078\u3068\u4F38\u3070\u3057\u305F\u4E21\u624B\u3002\u6307\u5148\u307E\u3067\u7D9A\u304F\u6240\u4F5C\u3092\u3054\u89A7\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7070\u8272\u306E\u7FBD\u7E54\u3092\u7740\u305F\u4EBA\u7269\u304C\u4E21\u624B\u306E\u6307\u3092\u524D\u3078\u5DEE\u3057\u51FA\u3057\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-17T10:00:00.000Z",
    "expiresAt": "2026-10-17T11:00:00.000Z",
    "todaySince": "2026-10-17T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4422_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.154Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "9f80aca85bd393aa0a6bd6a3e3be3c7e2b9b0d9e175ac0c3a69f35fd2c5a2ee7",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/257.jpg",
    "originalFile": "028A4422_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-17:evening:99d6a061d32b0ace440038c2c2d2545986d8f70cc0a5109cabc31e896f038a7d",
    "tokenSha256": "e00e04f20b86aa12b5bf0d1ecffa5a21260667cb60124029724998688d5329e6"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-18:morning",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-18",
    "slot": "morning",
    "assetId": "photo:sonezaki-focus:264",
    "imageId": 264,
    "sourceSha256": "388bbac26e527de2fee950b0efaa15677afd007336b969d77247c7a9ebc6e176",
    "deliverySha256": "36655d24c36421e89f87b8f8679576fb6c57ee3e523b012565e9a125627bc98c",
    "captionSha256": "a17e645675fb55f5fe522838b4e1515faecf84c57b089f6b2d9452f499b978ca",
    "caption": "\u6697\u3044\u821E\u53F0\u306B\u6D6E\u304B\u3076\u767D\u3044\u8863\u88F3\u3002\u5149\u3092\u53D7\u3051\u305F\u59FF\u3092\u304A\u5C4A\u3051\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u7167\u660E\u3092\u53D7\u3051\u305F\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u304C\u3001\u7247\u624B\u3092\u524D\u3078\u5411\u3051\u3066\u7ACB\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-17T23:00:00.000Z",
    "expiresAt": "2026-10-18T00:00:00.000Z",
    "todaySince": "2026-10-17T23:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4510_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.155Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "e58f0a20ae737c40dfc847986a7975f599c5a8fea84cb53701ea302cbdbe247c",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/264.jpg",
    "originalFile": "028A4510_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-18:morning:a17e645675fb55f5fe522838b4e1515faecf84c57b089f6b2d9452f499b978ca",
    "tokenSha256": "8e4f52092fb1b806f128baf241d811196df8691c72e30c26f76e5e9e65af1966"
  },
  {
    "requestId": "sonezaki-focus-20261014:2026-10-18:evening",
    "request": "\u30A4\u30F3\u30B9\u30BF\u6295\u7A3F\u3057\u3066\uFF0F\u5225\u5199\u771F\u3067\u3002\u4ECA\u9031\u672B\u307E\u3067\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u306B\u3057\u305F\u3044",
    "date": "2026-10-18",
    "slot": "evening",
    "assetId": "photo:sonezaki-focus:259",
    "imageId": 259,
    "sourceSha256": "bd9fa1190a4a04c4f182e4a209c25cabd01ce50d58bc615b550cc2453d19800a",
    "deliverySha256": "d9aa2aee2ff6615725682a220b0a6a4b85f7faf63dc4612bc20c59e95ad3ae58",
    "captionSha256": "5ccebf1aa2315192bebfd39c8a96bce04a2121d82685896f05a2ce2be40001a2",
    "caption": "\u821E\u53F0\u306B\u8FD1\u3044\u4F4D\u7F6E\u304B\u3089\u6349\u3048\u305F\u5F79\u8005\u306E\u59FF\u3002\u8863\u88F3\u3084\u5C0F\u9053\u5177\u306E\u7D30\u90E8\u3082\u8A18\u9332\u3055\u308C\u3066\u3044\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7D2B\u306E\u8863\u88F3\u306E\u4EBA\u7269\u3092\u821E\u53F0\u8FD1\u304F\u304B\u3089\u5199\u3057\u305F\u5199\u771F\u3002\u5F8C\u308D\u306B\u306F\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-18T10:00:00.000Z",
    "expiresAt": "2026-10-18T11:00:00.000Z",
    "todaySince": "2026-10-18T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_5X4A0118_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-13T23:38:04.157Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "2e8beb8088c09427b5bb0f9c3afea2137ff4b083ec66c163081fad58eda61142",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-14_\u66FD\u6839\u5D0E\u5FC3\u4E2D\u9031\u9593/media/259.jpg",
    "originalFile": "5X4A0118_0.jpg",
    "approvalReference": "user-20261014-sonezaki:2026-10-18:evening:5ccebf1aa2315192bebfd39c8a96bce04a2121d82685896f05a2ce2be40001a2",
    "tokenSha256": "ef6c79735938defa1f4158eb29681d67114fd33eb0796f9aa5619a681aac9c47"
  }
];
var prefix3 = "/api/v1/focus-sonezaki-20261014";
function clock(at = Date.now()) {
  const d = new Date(at + 324e5);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}
function active(date) {
  return date >= "2026-10-14" && date <= "2026-10-18";
}
function select(at = Date.now()) {
  const c = clock(at), slot = c.hour === 8 ? "morning" : c.hour === 19 ? "evening" : null;
  return POLICIES.find((p2) => p2.date === c.date && p2.slot === slot);
}
var json = (v, status5 = 200) => new Response(JSON.stringify(v), { status: status5, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function authenticated(req, env) {
  if (!env.API_TOKEN) return false;
  const digest = async (x) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)));
  const a = await digest(req.headers.get("Authorization") || ""), b = await digest("Bearer " + env.API_TOKEN);
  let diff = 0;
  for (let n = 0; n < a.length; n++) diff |= a[n] ^ b[n];
  return diff === 0;
}
function input(p2) {
  return { token: p2.approvalReference, assetId: p2.assetId, sourceSha256: p2.sourceSha256, deliverySha256: p2.deliverySha256, captionSha256: p2.captionSha256, accountId: p2.accountId, accountUsername: p2.accountUsername };
}
var index_default4 = { ...index_default3, async fetch(req, env, ctx) {
  const url = new URL(req.url), pathname = url.pathname, c = clock();
  if (pathname.startsWith(prefix3)) {
    if (!await authenticated(req, env)) return json({ error: "existing_authentication_required" }, 401);
    try {
      if (pathname === prefix3 + "/plan" && req.method === "GET") return json({ startDate: "2026-10-14", endDate: "2026-10-18", plans: POLICIES });
      const parts = pathname.slice(prefix3.length + 1).split("/"), p2 = POLICIES.find((x) => x.date === parts[0] && x.slot === parts[1]);
      if (!p2 || parts.length !== 3) return json({ error: "unknown_dated_slot" }, 404);
      const service = createFocus(p2);
      if (req.method === "GET" && parts[2] === "status") return json(await service.status(env));
      if (req.method === "GET" && parts[2] === "preflight") return json(await service.preflight(env));
      if (req.method === "POST" && parts[2] === "publish") {
        if (await req.text() !== "{}") return json({ error: "exact_empty_request_required" }, 400);
        return json(await service.publish(env, input(p2)));
      }
      return json({ error: "method_not_allowed" }, 405);
    } catch (e) {
      return e instanceof ManualError5 ? json({ success: false, error: e.code, automaticRetry: false }, e.httpStatus) : json({ success: false, error: "focus_operation_error", automaticRetry: false }, 500);
    }
  }
  if (active(c.date) && req.method === "POST" && (pathname.startsWith("/api/v1/auto-post/") || pathname.startsWith("/api/v1/manual-photos/") && pathname.endsWith("/publish"))) {
    if (!await authenticated(req, env)) return json({ error: "existing_authentication_required" }, 401);
    return json({ success: false, error: "use_exact_dated_sonezaki_focus_slot", automaticRetry: false }, 409);
  }
  return index_default3.fetch(req, env, ctx);
}, async scheduled(controller, env, ctx) {
  const c = clock();
  if (!active(c.date)) return index_default3.scheduled(controller, env, ctx);
  const p2 = select();
  if (!p2) return;
  const service = createFocus(p2);
  const saved = await service.row(env);
  if (saved) return;
  try {
    const result = await service.publish(env, input(p2));
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, success: result.success, mediaId: result.mediaId }));
  } catch (e) {
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, error: e instanceof ManualError5 ? e.code : "focus_operation_error", automaticRetry: false }));
  }
} };
var GRAPH7 = "https://graph.facebook.com/v21.0";
var ORIGIN6 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError6 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex6 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function createFocus2(P) {
  function windowOpen5() {
    if (Date.now() < Date.parse(P.notBefore) || Date.now() >= Date.parse(P.expiresAt)) throw new ManualError6("manual_authorization_expired_or_not_started", 410);
  }
  async function validateInput5(env, value) {
    windowOpen5();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError6("manual_input_required", 400);
    const v = value;
    const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
    if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError6("manual_exact_input_required", 400);
    if (v.assetId !== P.assetId || v.sourceSha256 !== P.sourceSha256 || v.deliverySha256 !== P.deliverySha256 || v.captionSha256 !== P.captionSha256 || v.accountUsername !== P.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || P.accountId && v.accountId !== P.accountId || await hex6(v.token) !== P.tokenSha256 || await hex6(P.caption) !== P.captionSha256) throw new ManualError6("manual_approval_binding_mismatch", 422);
    return v;
  }
  async function row5(env) {
    return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(P.requestId).first();
  }
  async function graph6(env, path, body) {
    if (!env.META_ACCESS_TOKEN) throw new ManualError6("existing_instagram_authentication_unavailable", 503);
    const response = await fetch(GRAPH7 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
    const value = await response.json();
    if (!response.ok || value.error) throw new ManualError6("existing_meta_request_rejected_http_" + response.status, 502);
    return value;
  }
  async function identity5(env) {
    if (!env.INSTAGRAM_USER_ID || P.accountId && env.INSTAGRAM_USER_ID !== P.accountId) throw new ManualError6("manual_account_binding_mismatch", 422);
    const who = await graph6(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
    if (who.id !== env.INSTAGRAM_USER_ID || who.username !== P.accountUsername) throw new ManualError6("manual_official_account_mismatch", 422);
    return { id: String(who.id), username: String(who.username) };
  }
  async function photoProof4(env) {
    const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(P.imageId).first();
    if (!image || image.id !== P.imageId || image.r2_key !== P.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== P.characterId || image.play_name !== P.playName || image.name !== P.characterName || image.navi_enmoku_id !== P.naviEnmokuId || image.navi_cast_id !== P.naviCastId || image.scene_type !== P.sceneType || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError6("approved_exact_photo_metadata_changed", 422);
    return { imageId: P.imageId, playName: P.playName, characterName: P.characterName, originalSha256: P.sourceSha256, deliverySha256: P.deliverySha256, identityReviewedAt: P.identityReviewedAt, permissionProof: P.permissionSha256, identityProof: P.identitySha256, primaryProof: P.primarySha256 };
  }
  const announcementMatch5 = (m) => m.caption === P.caption;
  async function recent5(env) {
    const v = await graph6(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
    if (!Array.isArray(v.data)) throw new ManualError6("instagram_recent_media_unavailable", 503);
    return v.data;
  }
  async function assets5(env, _required = false) {
    const object2 = await env.R2.get(P.deliveryKey);
    if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex6(await object2.arrayBuffer()) !== P.deliverySha256) throw new ManualError6("approved_exact_photo_storage_changed", 422);
    return { delivery: true, deliverySha256: P.deliverySha256, originalAndIdentityProofPinned: true };
  }
  async function inspect5(env, allowOwnClaim = false, requireAssets = false) {
    windowOpen5();
    const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
    if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError6("instagram_is_disabled", 409);
    const own = await row5(env);
    if (own && !allowOwnClaim) throw new ManualError6("manual_one_time_slot_already_consumed", 409);
    const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(P.caption, P.imageId).first();
    if (duplicate) throw new ManualError6("manual_announcement_already_in_existing365", 409);
    const previous = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state IN ('creating','processing','publishing','uncertain','published') LIMIT 1").bind(P.requestId, P.deliverySha256).first();
    if (previous) throw new ManualError6("photo_previously_claimed", 409);
    const sameSlot = await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date, P.slot).first();
    if (sameSlot) throw new ManualError6("existing_slot_used", 409);
    const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
    if (inflight) throw new ManualError6("existing365_publication_inflight_or_uncertain", 409);
    const account = await identity5(env), photo = await photoProof4(env), media = await recent5(env);
    if (media.some(announcementMatch5)) throw new ManualError6("manual_photo_already_on_instagram", 409);
    if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(P.notBefore) && Date.parse(m.timestamp || "") < Date.parse(P.expiresAt))) throw new ManualError6("instagram_has_today_publication", 409);
    const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(P.requestId).first();
    if (otherManual) throw new ManualError6("other_manual_publication_inflight_or_uncertain", 409);
    return { account, photo, thumbnail: await assets5(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: P.expiresAt, oneTimeClaimed: !!own };
  }
  const preflight5 = (env) => inspect5(env);
  function boundRow5(saved, accountId) {
    return saved.request_id === P.requestId && saved.video_id === P.assetId && saved.source_sha256 === P.sourceSha256 && saved.delivery_sha256 === P.deliverySha256 && saved.caption_sha256 === P.captionSha256 && saved.caption === P.caption && saved.token_sha256 === P.tokenSha256 && saved.account_id === accountId && saved.account_username === P.accountUsername && saved.expires_at === P.expiresAt && saved.source_key === P.sourceKey && saved.delivery_key === P.deliveryKey && saved.token_consumed === 1;
  }
  async function publish5(env, value) {
    const input32 = await validateInput5(env, value);
    const fresh = await inspect5(env, false, true);
    if (fresh.account.id !== input32.accountId) throw new ManualError6("manual_account_binding_mismatch", 422);
    const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state='published')
 AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')))`).bind(P.requestId, P.assetId, P.sourceSha256, P.deliverySha256, P.captionSha256, input32.accountId, P.accountUsername, P.tokenSha256, P.expiresAt, P.caption, P.sourceKey, P.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), P.requestId, "%" + P.assetId + "%", "%" + P.assetId + "%", "%" + P.assetId + "%", P.requestId, P.requestId, P.deliverySha256, P.date, P.slot).run();
    if (claim.meta.changes !== 1) throw new ManualError6("manual_one_time_claim_conflict", 409);
    let irreversible = false;
    try {
      const container = await graph6(env, input32.accountId + "/media", { image_url: ORIGIN6 + "/media/" + P.deliveryKey, caption: P.caption, alt_text: P.altText });
      if (typeof container.id !== "string" || !container.id) throw new ManualError6("manual_container_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, P.requestId).run();
      let ready = false;
      for (let i = 0; i < 8; i++) {
        const result = await graph6(env, container.id + "?fields=status_code");
        if (result.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (result.status_code !== "IN_PROGRESS") throw new ManualError6("manual_container_processing_rejected", 502);
        if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
      }
      if (!ready) throw new ManualError6("manual_container_processing_not_finished", 503);
      const final = await inspect5(env, true, true), saved = await row5(env);
      if (final.account.id !== input32.accountId || !saved || !boundRow5(saved, input32.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError6("manual_final_approval_or_container_changed", 409);
      windowOpen5();
      const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(P.requestId, container.id, input32.accountId, P.sourceSha256, P.deliverySha256, P.captionSha256, P.tokenSha256, P.expiresAt).first();
      if (!locked) throw new ManualError6("manual_publish_claim_conflict", 409);
      irreversible = true;
      const published = await graph6(env, input32.accountId + "/media_publish", { creation_id: container.id });
      if (typeof published.id !== "string" || !published.id) throw new ManualError6("manual_publication_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
      let permalink = null;
      try {
        const media = await graph6(env, published.id + "?fields=permalink");
        if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
      } catch {
      }
      if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, P.requestId, published.id).run();
      return { success: true, requestId: P.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
    } catch (error) {
      const code = error instanceof ManualError6 ? error.code : "manual_external_or_storage_error";
      await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, P.requestId).run();
      throw new ManualError6(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
    }
  }
  async function status5(env) {
    const saved = await row5(env);
    const account = await identity5(env);
    const media = await recent5(env);
    const matches = media.filter(announcementMatch5);
    const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
    return { requestId: P.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(P.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === P.caption, thumbnail: await assets5(env, !!saved), publicationRequests: 0, automaticRetry: false };
  }
  async function reconcile2(env) {
    const proof2 = await status5(env), saved = proof2.record;
    if (!saved || !["publishing", "uncertain"].includes(saved.state) || !boundRow5(saved, proof2.account.id) || !proof2.exactCaptionVerified || proof2.observedMatchingCount !== 1 || !proof2.observedMedia) throw new ManualError6("manual_uncertain_result_not_uniquely_proven", 409);
    const media = proof2.observedMedia;
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id, media.permalink || null, media.timestamp || (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
    return { reconciled: true, mediaId: media.id, permalink: media.permalink, publicationRequests: 0, automaticRetry: false };
  }
  return { preflight: preflight5, publish: publish5, status: status5, row: row5, reconcile: reconcile2 };
}
var POLICIES2 = [
  {
    "requestId": "sonezaki-pr-20261019:2026-10-19:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-19",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:265",
    "imageId": 265,
    "sourceSha256": "3c5cbfc797fa56662d86b04e9d2d75bdac21a9c359e59c7594fd702f796dac87",
    "deliverySha256": "3c5a275fa413c2b0b416857dae51e76a20b056ad33fe4c8299398816095e7a4c",
    "captionSha256": "f7a828a9cc9f61bfb1df725bfdc19631ef948e8b7cad4a2fa2c98a05b8ec7c04",
    "caption": "\u9752\u3044\u5149\u306E\u4E2D\u3067\u5411\u304D\u5408\u3046\u4E8C\u4EBA\u3002\u624B\u3092\u91CD\u306D\u308B\u3057\u3050\u3055\u306B\u3082\u3001\u305C\u3072\u3054\u6CE8\u76EE\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u9752\u3044\u5149\u306E\u4E2D\u3067\u5411\u304D\u5408\u3046\u4E8C\u4EBA\u3002\u624B\u3092\u91CD\u306D\u308B\u3057\u3050\u3055\u306B\u3082\u3001\u305C\u3072\u3054\u6CE8\u76EE\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u7167\u660E\u306E\u821E\u53F0\u3067\u3001\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u3068\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u5411\u304D\u5408\u3044\u3001\u624B\u3092\u91CD\u306D\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-19T10:00:00.000Z",
    "expiresAt": "2026-10-19T11:00:00.000Z",
    "todaySince": "2026-10-19T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4515_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.087Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "d98bc159a5d417c073fa2d053e0b992caf2f0a3dbf4fbd08f1ae8431600b8064",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/265.jpg",
    "originalFile": "028A4515_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-19:evening:f7a828a9cc9f61bfb1df725bfdc19631ef948e8b7cad4a2fa2c98a05b8ec7c04",
    "tokenSha256": "aebe50315841bc36399a0fcc3b67736d5a9d5236d5f494d065bc732515059bd6"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-20:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-20",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:285",
    "imageId": 285,
    "sourceSha256": "2beea6aa1bf4a3d79847a4ffab8757815b3d4e403e51a5c48db97caedfd31f4d",
    "deliverySha256": "8cb63e00736c4b38ec1746c1bf7c3230f43732adfb63599d42d1ff70d09de31e",
    "captionSha256": "00a770fc8e20efd716a83f5fa39521f181358f603056206267a9a6ef2f512ac7",
    "caption": "\u9BAE\u3084\u304B\u306A\u9752\u306E\u8863\u88F3\u3068\u3001\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3002\u4ECA\u671D\u306F\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u4E00\u679A\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u9BAE\u3084\u304B\u306A\u9752\u306E\u8863\u88F3\u3068\u3001\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3002\u4ECA\u671D\u306F\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u4E00\u679A\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9752\u3044\u8863\u88F3\u3068\u8D64\u767D\u306E\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u9AEA\u98FE\u308A\u3092\u633F\u3057\u3001\u9854\u3092\u659C\u3081\u306B\u5411\u3051\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-19T23:00:00.000Z",
    "expiresAt": "2026-10-20T00:00:00.000Z",
    "todaySince": "2026-10-19T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7469.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.092Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "165d1bab04e137bab32f945c4fb919c3e90f0578c19c8d4243bde06e0f856f76",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/285.jpg",
    "originalFile": "_MG_7469-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-20:morning:00a770fc8e20efd716a83f5fa39521f181358f603056206267a9a6ef2f512ac7",
    "tokenSha256": "bfc28a4c055292797ab1dd31fdc07a6f52fdb4a764781c19a560d471e73a6f79"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-20:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-20",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:266",
    "imageId": 266,
    "sourceSha256": "092d78e5b62d9f824f37f992cdf20fa5265c6135c8fe5b19e38b6dcfba87ae1b",
    "deliverySha256": "72a830927587cf242a08faec7a187fb930094290314a30101ef58ab786b84992",
    "captionSha256": "23aac4597e0686bc3ac2c969121080fa70b627a2c56d197ad04e7553326f40c9",
    "caption": "\u4EA4\u308F\u3059\u8996\u7DDA\u3092\u3001\u5199\u771F\u3067\u3058\u3063\u304F\u308A\u3002\u821E\u53F0\u3067\u306F\u3069\u3093\u306A\u3084\u308A\u3068\u308A\u304C\u7D9A\u304F\u306E\u3067\u3057\u3087\u3046\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u4EA4\u308F\u3059\u8996\u7DDA\u3092\u3001\u5199\u771F\u3067\u3058\u3063\u304F\u308A\u3002\u821E\u53F0\u3067\u306F\u3069\u3093\u306A\u3084\u308A\u3068\u308A\u304C\u7D9A\u304F\u306E\u3067\u3057\u3087\u3046\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u5149\u306E\u4E2D\u3001\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u304C\u96A3\u306E\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u3092\u898B\u4E0A\u3052\u3066\u3044\u308B\u3002\u4E8C\u4EBA\u306F\u624B\u3092\u91CD\u306D\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-20T10:00:00.000Z",
    "expiresAt": "2026-10-20T11:00:00.000Z",
    "todaySince": "2026-10-20T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4517_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.094Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "b7dc67ef2a2f5cbb32566ec9ab254f7e42e3727c3ce3f2a610f35d18350b223c",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/266.jpg",
    "originalFile": "028A4517_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-20:evening:23aac4597e0686bc3ac2c969121080fa70b627a2c56d197ad04e7553326f40c9",
    "tokenSha256": "fb563500d50d2d9924247f37b41997dffb544f52f352335f946de3f42c083749"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-21:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-21",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:287",
    "imageId": 287,
    "sourceSha256": "956b6a5ec7359621d44ca5ec4a1c50177e7f5d5d08b30c33e089910d24016eb7",
    "deliverySha256": "2ead13c90a058a5a346a5c2b63d63c8252b56a0e7fb09c5fb07a83792b0d6149",
    "captionSha256": "a2a7b771d668619c7fe3874d12b6cf27fad88cd3a3556cea1c5c05c915d2d898",
    "caption": "\u8863\u88F3\u306E\u67C4\u3084\u8868\u60C5\u3082\u3001\u821E\u53F0\u3092\u697D\u3057\u3080\u5165\u308A\u53E3\u306B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u8863\u88F3\u306E\u67C4\u3084\u8868\u60C5\u3082\u3001\u821E\u53F0\u3092\u697D\u3057\u3080\u5165\u308A\u53E3\u306B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u7DD1\u3068\u767D\u306E\u5E7E\u4F55\u5B66\u6A21\u69D8\u306E\u7740\u7269\u3068\u7D3A\u8272\u306E\u5E2F\u3092\u7740\u3051\u3001\u6B63\u9762\u3092\u5411\u3044\u3066\u7ACB\u3064\u4EBA\u7269\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-20T23:00:00.000Z",
    "expiresAt": "2026-10-21T00:00:00.000Z",
    "todaySince": "2026-10-20T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7479.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.099Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "f838d751e06b61c3570662d04803a177464e4f0d0ada33b4d607161bccb8ed44",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/287.jpg",
    "originalFile": "_MG_7479-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-21:morning:a2a7b771d668619c7fe3874d12b6cf27fad88cd3a3556cea1c5c05c915d2d898",
    "tokenSha256": "3f40526d7e56a463abd34d68b59e9bcedd987bf3efb4ae8c351b0a2f07b9ab2a"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-21:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-21",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:267",
    "imageId": 267,
    "sourceSha256": "931fd036382c6ff4fdfe314eb0de762d342ee1f3a6ba307ad8c97ec1e97f6216",
    "deliverySha256": "c35dbff5639c8531d72b5e09b89034d1e35aef0fff2f498d407705360fd576f4",
    "captionSha256": "5a57b2693cf8b45726e8b78f662b5f74f7bb1dc35a76dae087a0f6cb20104fa3",
    "caption": "\u624B\u3092\u3064\u306A\u304E\u3001\u5E83\u304C\u308B\u767D\u3044\u8896\u3002\u821E\u53F0\u5199\u771F\u306B\u6B8B\u3063\u305F\u4E00\u77AC\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u624B\u3092\u3064\u306A\u304E\u3001\u5E83\u304C\u308B\u767D\u3044\u8896\u3002\u821E\u53F0\u5199\u771F\u306B\u6B8B\u3063\u305F\u4E00\u77AC\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u7167\u660E\u306E\u821E\u53F0\u3067\u3001\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u3068\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u304C\u7247\u624B\u3092\u3064\u306A\u304E\u3001\u4E92\u3044\u306B\u8155\u3092\u4F38\u3070\u3057\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-21T10:00:00.000Z",
    "expiresAt": "2026-10-21T11:00:00.000Z",
    "todaySince": "2026-10-21T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4522_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.100Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "d0c827e6dd54228b7cd2ec7b7243cc6810bb498ff8c31cdbaa728d29d4753b0a",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/267.jpg",
    "originalFile": "028A4522_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-21:evening:5a57b2693cf8b45726e8b78f662b5f74f7bb1dc35a76dae087a0f6cb20104fa3",
    "tokenSha256": "b05fbf8d8e271bacc47995ca832ac4ab462317cc89ec106d4b47d59158478d11"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-22:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-22",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:295",
    "imageId": 295,
    "sourceSha256": "4fa9c098df33879ff39f47cc9382e1ab34dbc1f564618ba571b0bd69556f3ea9",
    "deliverySha256": "910312e31450a94fa36510666c9b67f0e72f24a44bd0cab76ce891433e5877f0",
    "captionSha256": "6420bf7ad5be14d8f9dd93592f0719628d9b5b9c0f39791cc5368e6527697682",
    "caption": "\u8D64\u3044\u8863\u88F3\u306B\u7D2B\u306E\u5E2F\u3002\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u304B\u3089\u3001\u8863\u88F3\u306E\u8272\u3084\u5F62\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u8D64\u3044\u8863\u88F3\u306B\u7D2B\u306E\u5E2F\u3002\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u304B\u3089\u3001\u8863\u88F3\u306E\u8272\u3084\u5F62\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u88FE\u3092\u5F15\u304F\u8D64\u3044\u8863\u88F3\u3068\u7D2B\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u306E\u5168\u8EAB\u3002\u9AEA\u98FE\u308A\u3092\u633F\u3057\u3001\u9854\u3092\u659C\u3081\u4E0A\u306B\u5411\u3051\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-21T23:00:00.000Z",
    "expiresAt": "2026-10-22T00:00:00.000Z",
    "todaySince": "2026-10-21T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7508.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.103Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "27019f5e92a5c2e2f9758d375e1d0f97a8cc2c1c4d39252832c3998a6425b56a",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/295.jpg",
    "originalFile": "_MG_7508-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-22:morning:6420bf7ad5be14d8f9dd93592f0719628d9b5b9c0f39791cc5368e6527697682",
    "tokenSha256": "15494f9445e7d8bb10c47fd0f008c98629a7352198c7fbba50cfde9539224992"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-22:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-22",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:269",
    "imageId": 269,
    "sourceSha256": "688ed593f9e5f5252b5b409ac48a011d532816ca3f4ab7c37eb7919b410142a9",
    "deliverySha256": "d3f60d1d132f7eb13db759ed77296d5c5b69957dbab445ee7e2c7679a64816e3",
    "captionSha256": "faf36271c40fb672bf7ad96214fca2346a4a175f605d4af7792def5e70675767",
    "caption": "\u5BC4\u308A\u6DFB\u3046\u4E8C\u4EBA\u3092\u3001\u821E\u53F0\u306E\u8FD1\u304F\u304B\u3089\u3002\u8868\u60C5\u306B\u76EE\u3092\u5411\u3051\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u5BC4\u308A\u6DFB\u3046\u4E8C\u4EBA\u3092\u3001\u821E\u53F0\u306E\u8FD1\u304F\u304B\u3089\u3002\u8868\u60C5\u306B\u76EE\u3092\u5411\u3051\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u5149\u306E\u821E\u53F0\u3067\u3001\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u3092\u62B1\u304D\u5BC4\u305B\u3066\u3044\u308B\u3002\u4E8C\u4EBA\u306E\u4E0A\u534A\u8EAB\u3092\u8FD1\u304F\u304B\u3089\u5199\u3057\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-22T10:00:00.000Z",
    "expiresAt": "2026-10-22T11:00:00.000Z",
    "todaySince": "2026-10-22T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4554_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.104Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "6ecd6a7bdc639ca5c988948c8ae545223ac92cc701c8b9fc9ba6e3c899d2cba4",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/269.jpg",
    "originalFile": "028A4554_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-22:evening:faf36271c40fb672bf7ad96214fca2346a4a175f605d4af7792def5e70675767",
    "tokenSha256": "7cfc758497cb2f44324eea7926700d8caadbd08c13bb7de73a8cde527403b16d"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-23:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-23",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:297",
    "imageId": 297,
    "sourceSha256": "4a772f979a600702048cd00b79016c7d8946dfae325dda9f2dba5354efe71366",
    "deliverySha256": "b8f3f06ddf08de62043a14b129398a15fca6c8967dd07ce0900262e5a904d350",
    "captionSha256": "6c480141ebe1d26d0d748752325f54adbaf40a57a8733b48f76be8471c240237",
    "caption": "\u821E\u53F0\u306E\u5199\u771F\u3068\u306F\u307E\u305F\u9055\u3046\u8868\u60C5\u3092\u3002\u7B11\u9854\u3068\u5927\u304D\u306A\u3057\u3050\u3055\u3092\u5199\u3057\u305F\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u821E\u53F0\u306E\u5199\u771F\u3068\u306F\u307E\u305F\u9055\u3046\u8868\u60C5\u3092\u3002\u7B11\u9854\u3068\u5927\u304D\u306A\u3057\u3050\u3055\u3092\u5199\u3057\u305F\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u683C\u5B50\u67C4\u306E\u7740\u7269\u3068\u767D\u3044\u5E2F\u3001\u767D\u3044\u982D\u5E03\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u7B11\u9854\u3067\u4F53\u3092\u50BE\u3051\u3001\u7247\u624B\u3092\u5927\u304D\u304F\u5E83\u3052\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-22T23:00:00.000Z",
    "expiresAt": "2026-10-23T00:00:00.000Z",
    "todaySince": "2026-10-22T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7515.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.110Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "f379cccfe21ef84c049e1ea100e9a7d12307c167591629cff5ed3bd816280249",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/297.jpg",
    "originalFile": "_MG_7515-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-23:morning:6c480141ebe1d26d0d748752325f54adbaf40a57a8733b48f76be8471c240237",
    "tokenSha256": "e926f36a7451139a20253a88418bd06869d303fb09486dec9a8b0b63a139a3f9"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-23:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-23",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:270",
    "imageId": 270,
    "sourceSha256": "afdf7add90ac716c92e96ea0822646aac9c404472cc353a5d3d2d402e37170e7",
    "deliverySha256": "feaf0089942eefbec8751535d7471f2365cc89c9be0846a730f6a3cbd2ec560d",
    "captionSha256": "bac031e745e843cacfeb35130042dd2098c4b19575de4694bec90251d600fa4e",
    "caption": "\u7ACB\u3064\u59FF\u3068\u3001\u5EA7\u308B\u59FF\u3002\u4E8C\u4EBA\u306E\u76EE\u7DDA\u306E\u9AD8\u3055\u304C\u5909\u308F\u308B\u3001\u821E\u53F0\u306E\u4E00\u5834\u9762\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u7ACB\u3064\u59FF\u3068\u3001\u5EA7\u308B\u59FF\u3002\u4E8C\u4EBA\u306E\u76EE\u7DDA\u306E\u9AD8\u3055\u304C\u5909\u308F\u308B\u3001\u821E\u53F0\u306E\u4E00\u5834\u9762\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u7167\u660E\u306E\u821E\u53F0\u3067\u3001\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u304C\u821E\u53F0\u7528\u306E\u5203\u7269\u3092\u6301\u3061\u3001\u5EA7\u3063\u3066\u3044\u308B\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u3092\u898B\u4E0B\u308D\u3057\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-23T10:00:00.000Z",
    "expiresAt": "2026-10-23T11:00:00.000Z",
    "todaySince": "2026-10-23T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4589_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.112Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "7ef61ae35e70cacad55db0e502822d557d5bf6131d122f129c267afcc0d2c211",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/270.jpg",
    "originalFile": "028A4589_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-23:evening:bac031e745e843cacfeb35130042dd2098c4b19575de4694bec90251d600fa4e",
    "tokenSha256": "eea98c10d69727d6664234ce75521500c9cc31cf31cabcc8745ed93fed3843be"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-24:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-24",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:299",
    "imageId": 299,
    "sourceSha256": "9ac199d1c2e0a5fcc253f868857174bc5cf5657029d30847629782ce492b0cdd",
    "deliverySha256": "8ebfffac381615803932c383e47e3425a128bc3f7cd5c96ac403935611514112",
    "captionSha256": "d49eff8d48b3e17deec6b5789a109ae5639755facf7d47fcb2121c83d31b99bc",
    "caption": "\u767D\u3044\u8863\u88F3\u306B\u3001\u9759\u304B\u306B\u5408\u308F\u305B\u305F\u624B\u3002\u4ECA\u671D\u306F\u6A2A\u9854\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u767D\u3044\u8863\u88F3\u306B\u3001\u9759\u304B\u306B\u5408\u308F\u305B\u305F\u624B\u3002\u4ECA\u671D\u306F\u6A2A\u9854\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u767D\u3044\u8863\u88F3\u3068\u7D2B\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u6570\u73E0\u3092\u624B\u306B\u639B\u3051\u3001\u80F8\u306E\u524D\u3067\u4E21\u624B\u3092\u5408\u308F\u305B\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-23T23:00:00.000Z",
    "expiresAt": "2026-10-24T00:00:00.000Z",
    "todaySince": "2026-10-23T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7520.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.116Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "8de9f2a5a5b0daef5063f061a03178e0536b0109d356b35408d795418ff4cb7d",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/299.jpg",
    "originalFile": "_MG_7520-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-24:morning:d49eff8d48b3e17deec6b5789a109ae5639755facf7d47fcb2121c83d31b99bc",
    "tokenSha256": "f151b98c2520c82b88dcc849eff34ea9f132b9fc7a99b6f6dadec4ac2ca215c8"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-24:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-24",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:271",
    "imageId": 271,
    "sourceSha256": "e12b03e605cd867b0ac80310ca94617870d690a791f1ae5802a02ef3a9d47753",
    "deliverySha256": "17caf029d337424f7faa34c291263031f4ca471fd0360def9c065f7eb5cc3c9c",
    "captionSha256": "748912fb8059ea3bf436c3b0f92a8ce7c18c8bbce84a5cdd8ba3d0bc53a1f7c1",
    "caption": "\u9752\u304F\u7167\u3089\u3055\u308C\u305F\u821E\u53F0\u3067\u3001\u4E8C\u4EBA\u304C\u5411\u304D\u5408\u3046\u4E00\u77AC\u3002\u7269\u8A9E\u306E\u7D9A\u304D\u306F\u516C\u6F14\u6620\u50CF\u3067\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u9752\u304F\u7167\u3089\u3055\u308C\u305F\u821E\u53F0\u3067\u3001\u4E8C\u4EBA\u304C\u5411\u304D\u5408\u3046\u4E00\u77AC\u3002\u7269\u8A9E\u306E\u7D9A\u304D\u306F\u516C\u6F14\u6620\u50CF\u3067\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u9752\u3044\u7167\u660E\u306E\u821E\u53F0\u3067\u3001\u767D\u3044\u8863\u88F3\u306E\u4EBA\u7269\u304C\u6570\u73E0\u3092\u639B\u3051\u3066\u624B\u3092\u5408\u308F\u305B\u3066\u3044\u308B\u3002\u624B\u524D\u306E\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4EBA\u7269\u306F\u80CC\u3092\u5411\u3051\u3001\u821E\u53F0\u7528\u306E\u5203\u7269\u3092\u6301\u3063\u305F\u8155\u3092\u4E0A\u3052\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-24T10:00:00.000Z",
    "expiresAt": "2026-10-24T11:00:00.000Z",
    "todaySince": "2026-10-24T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4600_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.117Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "9d9507dcaa03dd1bab33f43a7b3f2a402c665802450428274dd0d6f51787c46e",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/271.jpg",
    "originalFile": "028A4600_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-24:evening:748912fb8059ea3bf436c3b0f92a8ce7c18c8bbce84a5cdd8ba3d0bc53a1f7c1",
    "tokenSha256": "16a6a12a8626e6f24b0eac0ebab65df5937178a04da509d189e18c6c4b9ca00e"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-25:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-25",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:301",
    "imageId": 301,
    "sourceSha256": "4c2d2a3ade032cb2ace207d6aa705d614ce681d2d43b6c13e94c38bd8d8dbca7",
    "deliverySha256": "849e15fbb1568adf11196520a4a81dbb1128d3da85b81d8e37e4a85e508d26c0",
    "captionSha256": "36ded43f27767a4dfa83ee8cb1814cd102cb366a32dcf7ecde9fd444a3049a62",
    "caption": "\u683C\u5B50\u67C4\u306E\u8863\u88F3\u3068\u3001\u9854\u306B\u65BD\u3055\u308C\u305F\u5316\u7CA7\u3002\u7D30\u90E8\u3082\u3054\u89A7\u3044\u305F\u3060\u3051\u308B\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u683C\u5B50\u67C4\u306E\u8863\u88F3\u3068\u3001\u9854\u306B\u65BD\u3055\u308C\u305F\u5316\u7CA7\u3002\u7D30\u90E8\u3082\u3054\u89A7\u3044\u305F\u3060\u3051\u308B\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9752\u7DD1\u306E\u683C\u5B50\u67C4\u306E\u7740\u7269\u3068\u9EC4\u8272\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u984D\u306B\u8D64\u3044\u5316\u7CA7\u304C\u3042\u308A\u3001\u821E\u53F0\u7528\u306E\u5203\u7269\u3092\u4E0B\u3078\u5411\u3051\u3066\u6301\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-24T23:00:00.000Z",
    "expiresAt": "2026-10-25T00:00:00.000Z",
    "todaySince": "2026-10-24T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7527.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:20:45.121Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "79405826374c9f034f42f9dbedbc747d4dbf662a99f8cfa7d13ca80e633822fd",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/301.jpg",
    "originalFile": "_MG_7527-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-25:morning:36ded43f27767a4dfa83ee8cb1814cd102cb366a32dcf7ecde9fd444a3049a62",
    "tokenSha256": "ec0f39a9ff1faee2960f632ee94b4584abbe33222121fe087d68c848d6f68af3"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-25:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3082\u542B\u3081\u3066\u6E96\u5099\u3059\u308B\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\u304B\u306A",
    "date": "2026-10-25",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:273",
    "imageId": 273,
    "sourceSha256": "82f02c53c133102e07800147e5e0e4cdc40ea927f23200b5ffbece0942e9a358",
    "deliverySha256": "ffd0d813ef549f4adc9612f51f190e0e0e81649bd6971c75b95bde2e825adcd3",
    "captionSha256": "75cd9e774a7670f651af210bc877920a833d8289907d135374adf16d727c57fc",
    "caption": "\u821E\u53F0\u3092\u7D42\u3048\u3066\u3001\u3054\u6328\u62F6\u306E\u4E00\u679A\u3002\u3054\u6765\u5834\u304F\u3060\u3055\u3063\u305F\u7686\u3055\u307E\u3001\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3057\u305F\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u516C\u6F14\u6620\u50CF\u306FYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u821E\u53F0\u3092\u7D42\u3048\u3066\u3001\u3054\u6328\u62F6\u306E\u4E00\u679A\u3002\u3054\u6765\u5834\u304F\u3060\u3055\u3063\u305F\u7686\u3055\u307E\u3001\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3057\u305F\u3002",
    "requiredCredit": "\u64AE\u5F71:\u7BE0\u7530\u91CD\u898F \u69D8",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u821E\u53F0\u5199\u771F\u3002\u7D42\u6F14\u5F8C\u306E\u821E\u53F0\u3067\u3001\u767D\u3044\u8863\u88F3\u3001\u7070\u7DD1\u306E\u7FBD\u7E54\u3001\u683C\u5B50\u67C4\u306E\u8863\u88F3\u306E\u4E09\u4EBA\u304C\u6A2A\u306B\u4E26\u3093\u3067\u5EA7\u3063\u3066\u3044\u308B\u3002\u5F8C\u65B9\u306B\u3082\u4EBA\u5F71\u304C\u898B\u3048\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-25T10:00:00.000Z",
    "expiresAt": "2026-10-25T11:00:00.000Z",
    "todaySince": "2026-10-25T10:00:00.000Z",
    "sourceKey": "local-permission:659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "deliveryKey": "originals/20260926_shinoda_028A4612_0.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "2026\u5E749\u670826\u65E5\u516C\u6F14\u30FB\u821E\u53F0",
    "identityReviewedAt": "2026-10-19T03:20:45.122Z",
    "permissionSha256": "659c636f3cd7a6bf84b2aaa6dbb72fb9e91da0f0aa1d5534f68692926168a61b",
    "permissionFile": "D:/\u6C17\u826F\u6B4C\u821E\u4F0E/\u8A18\u9332\u5199\u771F/2026/2026-09-26_\u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14_\u7BE0\u7530\u91CD\u898F\u64AE\u5F71_SNS\u63B2\u8F09\u53EF\uFF08\u30AF\u30EC\u30B8\u30C3\u30C8\u5FC5\u9808\uFF09/\u4FDD\u5B58\u8A18\u9332.json",
    "identitySha256": "d22ba2f0de501ed9eceadea7d0ea13505d7f5263b4aa9429010d5640873e8cbb",
    "primarySha256": "3927ca6eb4ae43091b1a50fac09c24bce249aa7dcba3b3da711ec51f6ea0287a",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/media/273.jpg",
    "originalFile": "028A4612_0.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-25:evening:75cd9e774a7670f651af210bc877920a833d8289907d135374adf16d727c57fc",
    "tokenSha256": "87f731fcd2eea581df1f989c682970b827c152c97e9ba5dc933f22ab42e4d7c5"
  }
];
var prefix4 = "/api/v1/pr-sonezaki-20261019";
function clock2(at = Date.now()) {
  const d = new Date(at + 324e5);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}
function active2(date) {
  return date >= "2026-10-19";
}
function select2(at = Date.now()) {
  const c = clock2(at), slot = c.hour === 8 ? "morning" : c.hour === 19 ? "evening" : null;
  return POLICIES2.find((p2) => p2.date === c.date && p2.slot === slot);
}
var json2 = (v, status5 = 200) => new Response(JSON.stringify(v), { status: status5, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function authenticated2(req, env) {
  if (!env.API_TOKEN) return false;
  const digest = async (x) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)));
  const a = await digest(req.headers.get("Authorization") || ""), b = await digest("Bearer " + env.API_TOKEN);
  let diff = 0;
  for (let n = 0; n < a.length; n++) diff |= a[n] ^ b[n];
  return diff === 0;
}
function input2(p2) {
  return { token: p2.approvalReference, assetId: p2.assetId, sourceSha256: p2.sourceSha256, deliverySha256: p2.deliverySha256, captionSha256: p2.captionSha256, accountId: p2.accountId, accountUsername: p2.accountUsername };
}
var index_default5 = { ...index_default4, async fetch(req, env, ctx) {
  const url = new URL(req.url), pathname = url.pathname, c = clock2();
  if (pathname.startsWith(prefix4)) {
    if (!await authenticated2(req, env)) return json2({ error: "existing_authentication_required" }, 401);
    try {
      if (pathname === prefix4 + "/plan" && req.method === "GET") return json2({ startDate: "2026-10-19", endDate: "2026-10-25", plans: POLICIES2 });
      const parts = pathname.slice(prefix4.length + 1).split("/"), p2 = POLICIES2.find((x) => x.date === parts[0] && x.slot === parts[1]);
      if (!p2 || parts.length !== 3) return json2({ error: "unknown_dated_slot" }, 404);
      const service = createFocus2(p2);
      if (req.method === "GET" && parts[2] === "status") return json2(await service.status(env));
      if (req.method === "GET" && parts[2] === "preflight") return json2(await service.preflight(env));
      if (req.method === "POST" && parts[2] === "publish") {
        if (await req.text() !== "{}") return json2({ error: "exact_empty_request_required" }, 400);
        return json2(await service.publish(env, input2(p2)));
      }
      return json2({ error: "method_not_allowed" }, 405);
    } catch (e) {
      return e instanceof ManualError6 ? json2({ success: false, error: e.code, automaticRetry: false }, e.httpStatus) : json2({ success: false, error: "focus_operation_error", automaticRetry: false }, 500);
    }
  }
  if (active2(c.date) && req.method === "POST" && (pathname.startsWith("/api/v1/auto-post/") || pathname.startsWith("/api/v1/manual-photos/") && pathname.endsWith("/publish"))) {
    if (!await authenticated2(req, env)) return json2({ error: "existing_authentication_required" }, 401);
    return json2({ success: false, error: "use_exact_dated_sonezaki_focus_slot", automaticRetry: false }, 409);
  }
  return index_default4.fetch(req, env, ctx);
}, async scheduled(controller, env, ctx) {
  const c = clock2();
  if (!active2(c.date)) return index_default4.scheduled(controller, env, ctx);
  const p2 = select2();
  if (!p2) {
    if (c.hour === 8 || c.hour === 19) console.log(JSON.stringify({ event: "sonezaki_pr_materials_needed", date: c.date, preparationEnd: "2026-10-25", automaticRetry: false }));
    return;
  }
  const service = createFocus2(p2);
  const saved = await service.row(env);
  if (saved) return;
  try {
    const result = await service.publish(env, input2(p2));
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, success: result.success, mediaId: result.mediaId }));
  } catch (e) {
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, error: e instanceof ManualError6 ? e.code : "focus_operation_error", automaticRetry: false }));
  }
} };
var GRAPH8 = "https://graph.facebook.com/v21.0";
var ORIGIN7 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError7 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex7 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function createFocus3(P) {
  function windowOpen5() {
    if (Date.now() < Date.parse(P.notBefore) || Date.now() >= Date.parse(P.expiresAt)) throw new ManualError7("manual_authorization_expired_or_not_started", 410);
  }
  async function validateInput5(env, value) {
    windowOpen5();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError7("manual_input_required", 400);
    const v = value;
    const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
    if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError7("manual_exact_input_required", 400);
    if (v.assetId !== P.assetId || v.sourceSha256 !== P.sourceSha256 || v.deliverySha256 !== P.deliverySha256 || v.captionSha256 !== P.captionSha256 || v.accountUsername !== P.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || P.accountId && v.accountId !== P.accountId || await hex7(v.token) !== P.tokenSha256 || await hex7(P.caption) !== P.captionSha256) throw new ManualError7("manual_approval_binding_mismatch", 422);
    return v;
  }
  async function row5(env) {
    return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(P.requestId).first();
  }
  async function graph6(env, path, body) {
    if (!env.META_ACCESS_TOKEN) throw new ManualError7("existing_instagram_authentication_unavailable", 503);
    const response = await fetch(GRAPH8 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
    const value = await response.json();
    if (!response.ok || value.error) throw new ManualError7("existing_meta_request_rejected_http_" + response.status, 502);
    return value;
  }
  async function identity5(env) {
    if (!env.INSTAGRAM_USER_ID || P.accountId && env.INSTAGRAM_USER_ID !== P.accountId) throw new ManualError7("manual_account_binding_mismatch", 422);
    const who = await graph6(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
    if (who.id !== env.INSTAGRAM_USER_ID || who.username !== P.accountUsername) throw new ManualError7("manual_official_account_mismatch", 422);
    return { id: String(who.id), username: String(who.username) };
  }
  async function photoProof4(env) {
    const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(P.imageId).first();
    if (!image || image.id !== P.imageId || image.r2_key !== P.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== P.characterId || image.play_name !== P.playName || image.name !== P.characterName || image.navi_enmoku_id !== P.naviEnmokuId || image.navi_cast_id !== P.naviCastId || image.scene_type !== P.sceneType || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError7("approved_exact_photo_metadata_changed", 422);
    return { imageId: P.imageId, playName: P.playName, characterName: P.characterName, originalSha256: P.sourceSha256, deliverySha256: P.deliverySha256, identityReviewedAt: P.identityReviewedAt, permissionProof: P.permissionSha256, identityProof: P.identitySha256, primaryProof: P.primarySha256 };
  }
  const announcementMatch5 = (m) => m.caption === P.caption;
  async function recent5(env) {
    const v = await graph6(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
    if (!Array.isArray(v.data)) throw new ManualError7("instagram_recent_media_unavailable", 503);
    return v.data;
  }
  async function assets5(env, _required = false) {
    const object2 = await env.R2.get(P.deliveryKey);
    if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex7(await object2.arrayBuffer()) !== P.deliverySha256) throw new ManualError7("approved_exact_photo_storage_changed", 422);
    return { delivery: true, deliverySha256: P.deliverySha256, originalAndIdentityProofPinned: true };
  }
  async function inspect5(env, allowOwnClaim = false, requireAssets = false) {
    windowOpen5();
    const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
    if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError7("instagram_is_disabled", 409);
    const own = await row5(env);
    if (own && !allowOwnClaim) throw new ManualError7("manual_one_time_slot_already_consumed", 409);
    const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>='2026-09-28')) LIMIT 1").bind(P.caption, P.imageId).first();
    if (duplicate) throw new ManualError7("manual_announcement_already_in_existing365", 409);
    const previous = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state IN ('creating','processing','publishing','uncertain','published') LIMIT 1").bind(P.requestId, P.deliverySha256).first();
    if (previous) throw new ManualError7("photo_previously_claimed", 409);
    const sameSlot = await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date, P.slot).first();
    if (sameSlot) throw new ManualError7("existing_slot_used", 409);
    const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
    if (inflight) throw new ManualError7("existing365_publication_inflight_or_uncertain", 409);
    const account = await identity5(env), photo = await photoProof4(env), media = await recent5(env);
    if (media.some(announcementMatch5)) throw new ManualError7("manual_photo_already_on_instagram", 409);
    if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(P.notBefore) && Date.parse(m.timestamp || "") < Date.parse(P.expiresAt))) throw new ManualError7("instagram_has_today_publication", 409);
    const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(P.requestId).first();
    if (otherManual) throw new ManualError7("other_manual_publication_inflight_or_uncertain", 409);
    return { account, photo, thumbnail: await assets5(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: P.expiresAt, oneTimeClaimed: !!own };
  }
  const preflight5 = (env) => inspect5(env);
  function boundRow5(saved, accountId) {
    return saved.request_id === P.requestId && saved.video_id === P.assetId && saved.source_sha256 === P.sourceSha256 && saved.delivery_sha256 === P.deliverySha256 && saved.caption_sha256 === P.captionSha256 && saved.caption === P.caption && saved.token_sha256 === P.tokenSha256 && saved.account_id === accountId && saved.account_username === P.accountUsername && saved.expires_at === P.expiresAt && saved.source_key === P.sourceKey && saved.delivery_key === P.deliveryKey && saved.token_consumed === 1;
  }
  async function publish5(env, value) {
    const input4 = await validateInput5(env, value);
    const fresh = await inspect5(env, false, true);
    if (fresh.account.id !== input4.accountId) throw new ManualError7("manual_account_binding_mismatch", 422);
    const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state='published')
 AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')))`).bind(P.requestId, P.assetId, P.sourceSha256, P.deliverySha256, P.captionSha256, input4.accountId, P.accountUsername, P.tokenSha256, P.expiresAt, P.caption, P.sourceKey, P.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), P.requestId, "%" + P.assetId + "%", "%" + P.assetId + "%", "%" + P.assetId + "%", P.requestId, P.requestId, P.deliverySha256, P.date, P.slot).run();
    if (claim.meta.changes !== 1) throw new ManualError7("manual_one_time_claim_conflict", 409);
    let irreversible = false;
    try {
      const container = await graph6(env, input4.accountId + "/media", { image_url: ORIGIN7 + "/media/" + P.deliveryKey, caption: P.caption, alt_text: P.altText });
      if (typeof container.id !== "string" || !container.id) throw new ManualError7("manual_container_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, P.requestId).run();
      let ready = false;
      for (let i = 0; i < 8; i++) {
        const result = await graph6(env, container.id + "?fields=status_code");
        if (result.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (result.status_code !== "IN_PROGRESS") throw new ManualError7("manual_container_processing_rejected", 502);
        if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
      }
      if (!ready) throw new ManualError7("manual_container_processing_not_finished", 503);
      const final = await inspect5(env, true, true), saved = await row5(env);
      if (final.account.id !== input4.accountId || !saved || !boundRow5(saved, input4.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError7("manual_final_approval_or_container_changed", 409);
      windowOpen5();
      const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(P.requestId, container.id, input4.accountId, P.sourceSha256, P.deliverySha256, P.captionSha256, P.tokenSha256, P.expiresAt).first();
      if (!locked) throw new ManualError7("manual_publish_claim_conflict", 409);
      irreversible = true;
      const published = await graph6(env, input4.accountId + "/media_publish", { creation_id: container.id });
      if (typeof published.id !== "string" || !published.id) throw new ManualError7("manual_publication_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
      let permalink = null;
      try {
        const media = await graph6(env, published.id + "?fields=permalink");
        if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
      } catch {
      }
      if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, P.requestId, published.id).run();
      return { success: true, requestId: P.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
    } catch (error) {
      const code = error instanceof ManualError7 ? error.code : "manual_external_or_storage_error";
      await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, P.requestId).run();
      throw new ManualError7(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
    }
  }
  async function status5(env) {
    const saved = await row5(env);
    const account = await identity5(env);
    const media = await recent5(env);
    const matches = media.filter(announcementMatch5);
    const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
    return { requestId: P.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(P.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === P.caption, thumbnail: await assets5(env, !!saved), publicationRequests: 0, automaticRetry: false };
  }
  async function reconcile2(env) {
    const proof2 = await status5(env), saved = proof2.record;
    if (!saved || !["publishing", "uncertain"].includes(saved.state) || !boundRow5(saved, proof2.account.id) || !proof2.exactCaptionVerified || proof2.observedMatchingCount !== 1 || !proof2.observedMedia) throw new ManualError7("manual_uncertain_result_not_uniquely_proven", 409);
    const media = proof2.observedMedia;
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id, media.permalink || null, media.timestamp || (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
    return { reconciled: true, mediaId: media.id, permalink: media.permalink, publicationRequests: 0, automaticRetry: false };
  }
  return { preflight: preflight5, publish: publish5, status: status5, row: row5, reconcile: reconcile2 };
}
var POLICIES3 = [
  {
    "requestId": "sonezaki-pr-20261019:2026-10-19:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-19",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:275",
    "imageId": 275,
    "sourceSha256": "460be7e3f24b4b939f6fb54db81130eb625dc847c051ab25cf5b51448c78c6b9",
    "deliverySha256": "1919393a4aa1daaa5e91ac6e63fa4d37aad850097c6bc6ef3858fed87210da68",
    "captionSha256": "1dbdc7492c8f628a81e83fce5762394e343a9c676addcbb56973fb9b638d72ba",
    "caption": "\u4ECA\u9031\u3082\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3092\u5199\u771F\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\u4ECA\u5915\u306F\u3001\u6247\u5B50\u3092\u624B\u306B\u7B11\u9854\u3092\u898B\u305B\u308B\u4E00\u679A\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u4ECA\u9031\u3082\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3092\u5199\u771F\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\u4ECA\u5915\u306F\u3001\u6247\u5B50\u3092\u624B\u306B\u7B11\u9854\u3092\u898B\u305B\u308B\u4E00\u679A\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9752\u7DD1\u3068\u767D\u306E\u7E1E\u6A21\u69D8\u306E\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u3002\u5C11\u3057\u524D\u304B\u304C\u307F\u306B\u306A\u308A\u3001\u958B\u3044\u305F\u6247\u5B50\u3092\u4E21\u624B\u3067\u6301\u3063\u3066\u7B11\u9854\u3092\u898B\u305B\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-19T10:00:00.000Z",
    "expiresAt": "2026-10-19T11:00:00.000Z",
    "todaySince": "2026-10-19T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7413.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.412Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "064573ede42135a343012d7371c6be50420aa55ab1f7d7f9aa15117613d2f50b",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/275.jpg",
    "originalFile": "_MG_7413-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-19:evening:1dbdc7492c8f628a81e83fce5762394e343a9c676addcbb56973fb9b638d72ba",
    "tokenSha256": "24bfe22266eabefd025bb90f364a6c423a078e3558fb5e0e33a9a98abb7eb9d3"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-20:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-20",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:285",
    "imageId": 285,
    "sourceSha256": "2beea6aa1bf4a3d79847a4ffab8757815b3d4e403e51a5c48db97caedfd31f4d",
    "deliverySha256": "8cb63e00736c4b38ec1746c1bf7c3230f43732adfb63599d42d1ff70d09de31e",
    "captionSha256": "01003ba0414caa14995735a5d68a83c2d817e8215821a07b3167b92e8bec3a04",
    "caption": "\u9BAE\u3084\u304B\u306A\u9752\u306E\u8863\u88F3\u3068\u3001\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3002\u4ECA\u671D\u306F\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u4E00\u679A\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u9BAE\u3084\u304B\u306A\u9752\u306E\u8863\u88F3\u3068\u3001\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3002\u4ECA\u671D\u306F\u30D6\u30ED\u30DE\u30A4\u30C9\u3092\u4E00\u679A\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9752\u3044\u8863\u88F3\u3068\u8D64\u767D\u306E\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u9AEA\u98FE\u308A\u3092\u633F\u3057\u3001\u9854\u3092\u659C\u3081\u306B\u5411\u3051\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-19T23:00:00.000Z",
    "expiresAt": "2026-10-20T00:00:00.000Z",
    "todaySince": "2026-10-19T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7469.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.416Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "165d1bab04e137bab32f945c4fb919c3e90f0578c19c8d4243bde06e0f856f76",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/285.jpg",
    "originalFile": "_MG_7469-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-20:morning:01003ba0414caa14995735a5d68a83c2d817e8215821a07b3167b92e8bec3a04",
    "tokenSha256": "9713c3e8f5274243873dfa3eacefc5d43f3d228e14cd22e02b1eb6405bba0972"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-20:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-20",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:280",
    "imageId": 280,
    "sourceSha256": "2d9d725b24bfb2a57764ab16914661a99a9faf9851291c791b1f62589fb04da3",
    "deliverySha256": "89a1d0c3af4176d692b89261da9eaab4812a4a5f09b1ff083c2866a47587e3e1",
    "captionSha256": "8613548518d9495a85282b8320af6b0d3f57a5d1749ed18e73d954f463387dba",
    "caption": "\u6247\u5B50\u3092\u958B\u3044\u305F\u6A2A\u9854\u3002\u8868\u60C5\u3084\u8863\u88F3\u306E\u7D30\u90E8\u3082\u3001\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u6247\u5B50\u3092\u958B\u3044\u305F\u6A2A\u9854\u3002\u8868\u60C5\u3084\u8863\u88F3\u306E\u7D30\u90E8\u3082\u3001\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u8336\u8272\u306E\u7E1E\u67C4\u306E\u7FBD\u7E54\u3092\u7740\u305F\u4EBA\u7269\u306E\u6A2A\u9854\u3002\u7247\u624B\u306B\u9ED2\u3044\u6247\u5B50\u3092\u958B\u3044\u3066\u6301\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-20T10:00:00.000Z",
    "expiresAt": "2026-10-20T11:00:00.000Z",
    "todaySince": "2026-10-20T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7445.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.421Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "aaea5705182ceda1cf9bd293e555ae2bab726c85bd28a82c0a00e31342da67cd",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/280.jpg",
    "originalFile": "_MG_7445-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-20:evening:8613548518d9495a85282b8320af6b0d3f57a5d1749ed18e73d954f463387dba",
    "tokenSha256": "89e343f6e3011a7212336a4710bea8e0af2d5b655d12f19f456d7d7067bb4967"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-21:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-21",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:287",
    "imageId": 287,
    "sourceSha256": "956b6a5ec7359621d44ca5ec4a1c50177e7f5d5d08b30c33e089910d24016eb7",
    "deliverySha256": "2ead13c90a058a5a346a5c2b63d63c8252b56a0e7fb09c5fb07a83792b0d6149",
    "captionSha256": "2668b5211b034df797ee621185404e035c56837e8578a05c43dbe5231e6eddd8",
    "caption": "\u8863\u88F3\u306E\u67C4\u3084\u8868\u60C5\u3082\u3001\u821E\u53F0\u3092\u697D\u3057\u3080\u5165\u308A\u53E3\u306B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u8863\u88F3\u306E\u67C4\u3084\u8868\u60C5\u3082\u3001\u821E\u53F0\u3092\u697D\u3057\u3080\u5165\u308A\u53E3\u306B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u7DD1\u3068\u767D\u306E\u5E7E\u4F55\u5B66\u6A21\u69D8\u306E\u7740\u7269\u3068\u7D3A\u8272\u306E\u5E2F\u3092\u7740\u3051\u3001\u6B63\u9762\u3092\u5411\u3044\u3066\u7ACB\u3064\u4EBA\u7269\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-20T23:00:00.000Z",
    "expiresAt": "2026-10-21T00:00:00.000Z",
    "todaySince": "2026-10-20T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7479.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.424Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "f838d751e06b61c3570662d04803a177464e4f0d0ada33b4d607161bccb8ed44",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/287.jpg",
    "originalFile": "_MG_7479-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-21:morning:2668b5211b034df797ee621185404e035c56837e8578a05c43dbe5231e6eddd8",
    "tokenSha256": "4cd777d13f479bb40a20d7df316fa65fe1167dbdafbd133c42b455c7b31ba603"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-21:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-21",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:282",
    "imageId": 282,
    "sourceSha256": "78b9c3591eb3b1160dee50ba0e1b0fd2046efd6651187f35055e2ceb1eff1e89",
    "deliverySha256": "d808a217173fbc284c1a8484a3ecf01dbe66842fd1835d0d44d2eadfacdc024b",
    "captionSha256": "5baad8e73947c19fdf9b3ebb283fd4a99443c9107e7861fc518e085da178f74d",
    "caption": "\u6247\u5B50\u3092\u4E0B\u308D\u3057\u3001\u307E\u3063\u3059\u3050\u7ACB\u3064\u59FF\u3002\u7FBD\u7E54\u306E\u67C4\u3084\u8272\u306B\u3082\u3054\u6CE8\u76EE\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u6247\u5B50\u3092\u4E0B\u308D\u3057\u3001\u307E\u3063\u3059\u3050\u7ACB\u3064\u59FF\u3002\u7FBD\u7E54\u306E\u67C4\u3084\u8272\u306B\u3082\u3054\u6CE8\u76EE\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u8336\u8272\u306E\u7E1E\u67C4\u306E\u7FBD\u7E54\u3068\u67C4\u306E\u5165\u3063\u305F\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u306E\u5168\u8EAB\u3002\u7247\u624B\u306B\u9589\u3058\u305F\u6247\u5B50\u3092\u6301\u3063\u3066\u7ACB\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-21T10:00:00.000Z",
    "expiresAt": "2026-10-21T11:00:00.000Z",
    "todaySince": "2026-10-21T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7448.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.428Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "810b19a5fdfe1a4903b82f8b26bce7cfd8f1470c1f55e7329cc7214b4bc9525f",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/282.jpg",
    "originalFile": "_MG_7448-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-21:evening:5baad8e73947c19fdf9b3ebb283fd4a99443c9107e7861fc518e085da178f74d",
    "tokenSha256": "d2714c209f345c5ffa5457703e1c5075b996a34ad57fc310d5797b74069dc6db"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-22:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-22",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:295",
    "imageId": 295,
    "sourceSha256": "4fa9c098df33879ff39f47cc9382e1ab34dbc1f564618ba571b0bd69556f3ea9",
    "deliverySha256": "910312e31450a94fa36510666c9b67f0e72f24a44bd0cab76ce891433e5877f0",
    "captionSha256": "2b8d484ee703e5eba950702382078369b81598a904b6e9b0fd0a6e88c4a7ccc3",
    "caption": "\u8D64\u3044\u8863\u88F3\u306B\u7D2B\u306E\u5E2F\u3002\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u304B\u3089\u3001\u8863\u88F3\u306E\u8272\u3084\u5F62\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u8D64\u3044\u8863\u88F3\u306B\u7D2B\u306E\u5E2F\u3002\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u304B\u3089\u3001\u8863\u88F3\u306E\u8272\u3084\u5F62\u3092\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u88FE\u3092\u5F15\u304F\u8D64\u3044\u8863\u88F3\u3068\u7D2B\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u306E\u5168\u8EAB\u3002\u9AEA\u98FE\u308A\u3092\u633F\u3057\u3001\u9854\u3092\u659C\u3081\u4E0A\u306B\u5411\u3051\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-21T23:00:00.000Z",
    "expiresAt": "2026-10-22T00:00:00.000Z",
    "todaySince": "2026-10-21T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7508.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.430Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "27019f5e92a5c2e2f9758d375e1d0f97a8cc2c1c4d39252832c3998a6425b56a",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/295.jpg",
    "originalFile": "_MG_7508-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-22:morning:2b8d484ee703e5eba950702382078369b81598a904b6e9b0fd0a6e88c4a7ccc3",
    "tokenSha256": "ceed2044a3ab7df749f80bb2a099198a29dd9b5c6abe97d3853b3bd71ab6bb2b"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-22:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-22",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:276",
    "imageId": 276,
    "sourceSha256": "bf9124ef2cbc66bc5c180f3cada5c9781b03dab3f946fbb88af9c08e0d6d8dd6",
    "deliverySha256": "8e5c596d42c7541593c4a7f5fe669ff0943de6e6e8ab8e31bb72127b7691071b",
    "captionSha256": "121fdbd235a09eb8b4923926e15a715d1b55715ca19c6ad0714457f8e65f73d1",
    "caption": "\u4E09\u4EBA\u304C\u4E26\u3093\u3060\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u305D\u308C\u305E\u308C\u306E\u8868\u60C5\u3084\u8863\u88F3\u306E\u9055\u3044\u3082\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u4E09\u4EBA\u304C\u4E26\u3093\u3060\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u305D\u308C\u305E\u308C\u306E\u8868\u60C5\u3084\u8863\u88F3\u306E\u9055\u3044\u3082\u304A\u697D\u3057\u307F\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u4E09\u4EBA\u306E\u4EBA\u7269\u304C\u4E26\u3076\u3002\u4E2D\u592E\u306F\u9752\u3044\u7740\u7269\u3068\u7D2B\u306E\u7FBD\u7E54\u3001\u4E21\u8107\u306F\u7D2B\u3068\u767D\u3001\u9752\u7DD1\u3068\u767D\u306E\u7E1E\u6A21\u69D8\u306E\u7740\u7269\u3092\u7740\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-22T10:00:00.000Z",
    "expiresAt": "2026-10-22T11:00:00.000Z",
    "todaySince": "2026-10-22T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7415.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.436Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "c57113373375de86d592ce327feaca091c553540ed9b9284210662d612bc2639",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/276.jpg",
    "originalFile": "_MG_7415-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-22:evening:121fdbd235a09eb8b4923926e15a715d1b55715ca19c6ad0714457f8e65f73d1",
    "tokenSha256": "0f4dc1369a9f9d02f1339a754e4a9a13c228b60d97cca62cff546c0cdc5e888a"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-23:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-23",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:297",
    "imageId": 297,
    "sourceSha256": "4a772f979a600702048cd00b79016c7d8946dfae325dda9f2dba5354efe71366",
    "deliverySha256": "b8f3f06ddf08de62043a14b129398a15fca6c8967dd07ce0900262e5a904d350",
    "captionSha256": "e54b8e031f142535e649c8f011b26c4fbca0e3ae92c00db927938d9c81528660",
    "caption": "\u821E\u53F0\u306E\u5199\u771F\u3068\u306F\u307E\u305F\u9055\u3046\u8868\u60C5\u3092\u3002\u7B11\u9854\u3068\u5927\u304D\u306A\u3057\u3050\u3055\u3092\u5199\u3057\u305F\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u821E\u53F0\u306E\u5199\u771F\u3068\u306F\u307E\u305F\u9055\u3046\u8868\u60C5\u3092\u3002\u7B11\u9854\u3068\u5927\u304D\u306A\u3057\u3050\u3055\u3092\u5199\u3057\u305F\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u683C\u5B50\u67C4\u306E\u7740\u7269\u3068\u767D\u3044\u5E2F\u3001\u767D\u3044\u982D\u5E03\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u7B11\u9854\u3067\u4F53\u3092\u50BE\u3051\u3001\u7247\u624B\u3092\u5927\u304D\u304F\u5E83\u3052\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-22T23:00:00.000Z",
    "expiresAt": "2026-10-23T00:00:00.000Z",
    "todaySince": "2026-10-22T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7515.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.439Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "f379cccfe21ef84c049e1ea100e9a7d12307c167591629cff5ed3bd816280249",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/297.jpg",
    "originalFile": "_MG_7515-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-23:morning:e54b8e031f142535e649c8f011b26c4fbca0e3ae92c00db927938d9c81528660",
    "tokenSha256": "3ba5374d9a86c003a640d8127c4653d8ba815f8276cab49666e63522cecd4dc6"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-23:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-23",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:288",
    "imageId": 288,
    "sourceSha256": "071a179699dfa9ad7b9f78df1122ed90559b8f0df89046ebb36ce40a2010c30f",
    "deliverySha256": "339016e6bfe583697ca2243ba306d878de79f593fd93db6384b7513a1d8beeee",
    "captionSha256": "ef2179cd799a473e5367ccfd53011adea8dfab4c62d2acfa45c6f4ef4d6bab23",
    "caption": "\u843D\u3061\u7740\u3044\u305F\u7DD1\u306E\u8863\u88F3\u3067\u7ACB\u3064\u59FF\u3002\u5199\u771F\u304B\u3089\u3001\u821E\u53F0\u3078\u306E\u8208\u5473\u304C\u5E83\u304C\u308C\u3070\u3046\u308C\u3057\u3044\u3067\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u843D\u3061\u7740\u3044\u305F\u7DD1\u306E\u8863\u88F3\u3067\u7ACB\u3064\u59FF\u3002\u5199\u771F\u304B\u3089\u3001\u821E\u53F0\u3078\u306E\u8208\u5473\u304C\u5E83\u304C\u308C\u3070\u3046\u308C\u3057\u3044\u3067\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u7D30\u304B\u306A\u7E1E\u306E\u5165\u3063\u305F\u7DD1\u8272\u306E\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u3002\u4E21\u624B\u3092\u4E0B\u308D\u3057\u3066\u6B63\u9762\u3092\u5411\u3044\u3066\u7ACB\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-23T10:00:00.000Z",
    "expiresAt": "2026-10-23T11:00:00.000Z",
    "todaySince": "2026-10-23T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7485.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.443Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "029b4c60f02d2b443e86fce15c8a4446f449b283b66111d462534c79b96406d6",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/288.jpg",
    "originalFile": "_MG_7485-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-23:evening:ef2179cd799a473e5367ccfd53011adea8dfab4c62d2acfa45c6f4ef4d6bab23",
    "tokenSha256": "ca5ca0818f1604ef0408f9be7bf8f3b76f93f194380405baa44a7f0031dff64d"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-24:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-24",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:286",
    "imageId": 286,
    "sourceSha256": "f6478490c6f6839efd24a1be7a7e71703525b821a28168b0e947bdd2ab28a344",
    "deliverySha256": "5fcd49c8b96fb7a3ed14ee72c36361b0c30e664c53093783c3e2bb99feaeeaab",
    "captionSha256": "c95118db61621dad1852b9c20f3e26c9f722de4147ec63d0bb7b8f77da111077",
    "caption": "\u9752\u3044\u8863\u88F3\u306E\u88FE\u306B\u5E83\u304C\u308B\u82B1\u306E\u6A21\u69D8\u3002\u4ECA\u65E5\u306F\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u9752\u3044\u8863\u88F3\u306E\u88FE\u306B\u5E83\u304C\u308B\u82B1\u306E\u6A21\u69D8\u3002\u4ECA\u65E5\u306F\u5168\u8EAB\u306E\u7ACB\u3061\u59FF\u3092\u3054\u7D39\u4ECB\u3057\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u82B1\u306E\u6A21\u69D8\u304C\u3042\u308B\u9752\u3044\u8863\u88F3\u3068\u8D64\u767D\u306E\u5E02\u677E\u6A21\u69D8\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u6A2A\u5411\u304D\u306B\u7ACB\u3063\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-23T23:00:00.000Z",
    "expiresAt": "2026-10-24T00:00:00.000Z",
    "todaySince": "2026-10-23T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7474.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.445Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "f033b16d4a6d82db454da18cf5f8ea34759b8a0cf1d6a040e516de18d1d83c88",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/286.jpg",
    "originalFile": "_MG_7474-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-24:morning:c95118db61621dad1852b9c20f3e26c9f722de4147ec63d0bb7b8f77da111077",
    "tokenSha256": "b5e6bcbbe8870311ccde42d49402b32c2457b6e14e5c6787ade759c4c8c98384"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-24:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-24",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:289",
    "imageId": 289,
    "sourceSha256": "ff7dd429fbf50091a7e1378a2d56d4bb24e2a4dbf8c5de1639a4ca1c99ca114b",
    "deliverySha256": "e5699066615bfa81836f0cbefd45ec81cf972e25ea13475b4dd2f47d98174068",
    "captionSha256": "dd4c18cdbf12e43c59a0645a6afb938d201e6e83d5e50be2ce9730c88f504f15",
    "caption": "\u683C\u5B50\u67C4\u306E\u7740\u7269\u306B\u3001\u524D\u3067\u91CD\u306D\u305F\u624B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u306B\u6B8B\u3063\u305F\u8868\u60C5\u3092\u3054\u89A7\u304F\u3060\u3055\u3044\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u683C\u5B50\u67C4\u306E\u7740\u7269\u306B\u3001\u524D\u3067\u91CD\u306D\u305F\u624B\u3002\u30D6\u30ED\u30DE\u30A4\u30C9\u306B\u6B8B\u3063\u305F\u8868\u60C5\u3092\u3054\u89A7\u304F\u3060\u3055\u3044\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9ED2\u5730\u306B\u8D64\u3084\u767D\u306E\u7D30\u304B\u306A\u683C\u5B50\u67C4\u304C\u3042\u308B\u7740\u7269\u3092\u7740\u305F\u4EBA\u7269\u3002\u4E21\u624B\u3092\u8179\u306E\u524D\u3067\u91CD\u306D\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-24T10:00:00.000Z",
    "expiresAt": "2026-10-24T11:00:00.000Z",
    "todaySince": "2026-10-24T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7490.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.449Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "5ed31e509bf04c8f0e89817c4ccba6e46f289430cd4b016f3329ca0d70ff781f",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/289.jpg",
    "originalFile": "_MG_7490-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-24:evening:dd4c18cdbf12e43c59a0645a6afb938d201e6e83d5e50be2ce9730c88f504f15",
    "tokenSha256": "c4b731c82ef4c6fa77fd47715b135e70a62cfbbc396f7e0aead91866c1673b79"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-25:morning",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-25",
    "slot": "morning",
    "assetId": "photo:sonezaki-pr-20261019:291",
    "imageId": 291,
    "sourceSha256": "0c1a74f0d6091c6d6f1c7a156611b63271735dd72cf95fee2a83cd6c6ded4460",
    "deliverySha256": "abbf0681b3c49c94729cfe5ff52e42c64dfa48750c9337395b8d4e5d9e613dd1",
    "captionSha256": "4a75643a658802ca3bf6490f0d29a5770fae17a454ee749ecfa09f23013da98f",
    "caption": "\u6DE1\u3044\u8272\u306E\u7E1E\u6A21\u69D8\u3068\u3001\u3059\u3063\u3068\u4F38\u3070\u3057\u305F\u7ACB\u3061\u59FF\u3002\u4ECA\u671D\u3082\u30D6\u30ED\u30DE\u30A4\u30C9\u304B\u3089\u4E00\u679A\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u6DE1\u3044\u8272\u306E\u7E1E\u6A21\u69D8\u3068\u3001\u3059\u3063\u3068\u4F38\u3070\u3057\u305F\u7ACB\u3061\u59FF\u3002\u4ECA\u671D\u3082\u30D6\u30ED\u30DE\u30A4\u30C9\u304B\u3089\u4E00\u679A\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u6DE1\u3044\u9752\u3084\u7D2B\u306E\u7E1E\u6A21\u69D8\u306E\u7740\u7269\u3068\u8584\u7DD1\u306E\u5E2F\u3092\u7740\u3051\u305F\u4EBA\u7269\u3002\u4E21\u624B\u3092\u4E0B\u308D\u3057\u3066\u6B63\u9762\u3092\u5411\u3044\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-24T23:00:00.000Z",
    "expiresAt": "2026-10-25T00:00:00.000Z",
    "todaySince": "2026-10-24T23:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7493.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.454Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "b77c59129759d2e359f7c99ef92432e1ae0a2b81774c38e9c1c54fbf5102f4a9",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/291.jpg",
    "originalFile": "_MG_7493-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-25:morning:4a75643a658802ca3bf6490f0d29a5770fae17a454ee749ecfa09f23013da98f",
    "tokenSha256": "7853c3539476c6d449b7dfcd215fc4f800157b7ae78b2600916cd278f682a523"
  },
  {
    "requestId": "sonezaki-pr-20261019:2026-10-25:evening",
    "request": "\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F\u3092\u6E96\u5099\u3057\u3066\uFF0F\u5F53\u9762\u306F\u66FD\u6839\u5D0E\u5FC3\u4E2D\u3092PR\uFF0F\u7B2C\u4E09\u5E55\u306E\u5199\u771F\u3082\u516C\u958B\u307E\u3067\u4F7F\u308F\u306A\u3044",
    "date": "2026-10-25",
    "slot": "evening",
    "assetId": "photo:sonezaki-pr-20261019:296",
    "imageId": 296,
    "sourceSha256": "ed275209c05c0a83b3e228d183b307f9a30e62df43fbb3b5f2373aa126ce20d1",
    "deliverySha256": "1a4155551afdcbe2ce80d36787518caff0f4a50daa8a5f01a15028848d0f1a0b",
    "captionSha256": "3c7ab49e80eae1d7f60116d79fcb512aafd74cede7012b9c4b4a80031c372f48",
    "caption": "\u83EF\u3084\u304B\u306A\u8863\u88F3\u3068\u9AEA\u98FE\u308A\u3002\u4E8C\u4EBA\u4E26\u3093\u3060\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3001\u4E00\u9031\u9593\u3092\u7DE0\u3081\u304F\u304F\u308A\u307E\u3059\u3002\n\n2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u3088\u308A\u3002\n\u7B2C\u4E00\u5E55\u300C\u751F\u7389\u793E\u524D\u300D\u30FB\u7B2C\u4E8C\u5E55\u300C\u5929\u6E80\u5C4B\u300D\u3092YouTube\u3067\u516C\u958B\u4E2D\u3002\n\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u66FD\u6839\u5D0E\u5FC3\u4E2D\u300D\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u66FD\u6839\u5D0E\u5FC3\u4E2D #\u5730\u6B4C\u821E\u4F0E",
    "lead": "\u83EF\u3084\u304B\u306A\u8863\u88F3\u3068\u9AEA\u98FE\u308A\u3002\u4E8C\u4EBA\u4E26\u3093\u3060\u30D6\u30ED\u30DE\u30A4\u30C9\u3067\u3001\u4E00\u9031\u9593\u3092\u7DE0\u3081\u304F\u304F\u308A\u307E\u3059\u3002",
    "requiredCredit": "\u64AE\u5F71\uFF1A\u30AB\u30E4\u30D0\u30C7\u30B6\u30A4\u30F3",
    "altText": "2026\u5E749\u670826\u65E5 \u6C17\u826F\u6B4C\u821E\u4F0E\u516C\u6F14\u300E\u66FD\u6839\u5D0E\u5FC3\u4E2D\u300F\u306E\u30D6\u30ED\u30DE\u30A4\u30C9\u3002\u767D\u3044\u80CC\u666F\u306B\u3001\u9AEA\u98FE\u308A\u3092\u633F\u3057\u305F\u4E8C\u4EBA\u306E\u4EBA\u7269\u304C\u4E26\u3093\u3067\u3044\u308B\u3002\u6A21\u69D8\u306E\u5165\u3063\u305F\u8863\u88F3\u3068\u3001\u9280\u8272\u306E\u6A21\u69D8\u304C\u3042\u308B\u5927\u304D\u306A\u8D64\u3044\u5E2F\u3092\u7740\u3051\u3066\u3044\u308B\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-25T10:00:00.000Z",
    "expiresAt": "2026-10-25T11:00:00.000Z",
    "todaySince": "2026-10-25T10:00:00.000Z",
    "sourceKey": "local-permission:96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "deliveryKey": "originals/20260926_kayaba_MG_7512.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u66FD\u6839\u5D0E\u5FC3\u4E2D\uFF082026\u5E749\u670826\u65E5\u516C\u6F14\uFF09",
    "sceneType": "\u5F79\u8005\u30D6\u30ED\u30DE\u30A4\u30C9",
    "identityReviewedAt": "2026-10-19T03:58:36.457Z",
    "permissionSha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "permissionFile": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/365\u904B\u7528/2026-09-28_\u671D\u5915\u6295\u7A3F\u3068\u6587\u4F53\u6539\u5584/\u8431\u5834\u6C0F\u5199\u771F_\u7D20\u6750\u4E00\u89A7.json",
    "identitySha256": "96d5a5214d5e7528a8722e5738f888ec8317c0799964997d86d8064ce19f25a9",
    "primarySha256": "09bb6ccc670bd3bfb2036bdaf64df57f5f91fa6839c7d526467583d6c0076f78",
    "localMedia": "D:/Codex/\u6C17\u826F\u6B4C\u821E\u4F0E\u4E8B\u52D9/SNS\u6295\u7A3F/2026-10-19_\u4ECA\u5915\u304B\u3089\u306E\u5B9A\u671F\u6295\u7A3F/\u7B2C\u4E00\u7B2C\u4E8C\u5E55\u306E\u307F_v2/media/296.jpg",
    "originalFile": "_MG_7512-Edit.jpg",
    "approvalReference": "user-20261019-sonezaki-pr:2026-10-25:evening:3c7ab49e80eae1d7f60116d79fcb512aafd74cede7012b9c4b4a80031c372f48",
    "tokenSha256": "d4b624593baac14f2afb3658990a0fc5e60e038f9cd6d6f8afd9a091048564dd"
  }
];
var prefix5 = "/api/v1/pr-sonezaki-20261019";
function clock3(at = Date.now()) {
  const d = new Date(at + 324e5);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}
function active3(date) {
  return date >= "2026-10-19";
}
function select3(at = Date.now()) {
  const c = clock3(at), slot = c.hour === 8 ? "morning" : c.hour === 19 ? "evening" : null;
  return POLICIES3.find((p2) => p2.date === c.date && p2.slot === slot);
}
var json3 = (v, status5 = 200) => new Response(JSON.stringify(v), { status: status5, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function authenticated3(req, env) {
  if (!env.API_TOKEN) return false;
  const digest = async (x) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)));
  const a = await digest(req.headers.get("Authorization") || ""), b = await digest("Bearer " + env.API_TOKEN);
  let diff = 0;
  for (let n = 0; n < a.length; n++) diff |= a[n] ^ b[n];
  return diff === 0;
}
function input3(p2) {
  return { token: p2.approvalReference, assetId: p2.assetId, sourceSha256: p2.sourceSha256, deliverySha256: p2.deliverySha256, captionSha256: p2.captionSha256, accountId: p2.accountId, accountUsername: p2.accountUsername };
}
var index_default6 = { ...index_default5, async fetch(req, env, ctx) {
  const url = new URL(req.url), pathname = url.pathname, c = clock3();
  if (pathname.startsWith(prefix5)) {
    if (!await authenticated3(req, env)) return json3({ error: "existing_authentication_required" }, 401);
    try {
      if (pathname === prefix5 + "/plan" && req.method === "GET") return json3({ startDate: "2026-10-19", endDate: "2026-10-25", plans: POLICIES3 });
      const parts = pathname.slice(prefix5.length + 1).split("/"), p2 = POLICIES3.find((x) => x.date === parts[0] && x.slot === parts[1]);
      if (!p2 || parts.length !== 3) return json3({ error: "unknown_dated_slot" }, 404);
      const service = createFocus3(p2);
      if (req.method === "GET" && parts[2] === "status") return json3(await service.status(env));
      if (req.method === "GET" && parts[2] === "preflight") return json3(await service.preflight(env));
      if (req.method === "POST" && parts[2] === "publish") {
        if (await req.text() !== "{}") return json3({ error: "exact_empty_request_required" }, 400);
        return json3(await service.publish(env, input3(p2)));
      }
      return json3({ error: "method_not_allowed" }, 405);
    } catch (e) {
      return e instanceof ManualError7 ? json3({ success: false, error: e.code, automaticRetry: false }, e.httpStatus) : json3({ success: false, error: "focus_operation_error", automaticRetry: false }, 500);
    }
  }
  if (active3(c.date) && req.method === "POST" && (pathname.startsWith("/api/v1/auto-post/") || pathname.startsWith("/api/v1/manual-photos/") && pathname.endsWith("/publish"))) {
    if (!await authenticated3(req, env)) return json3({ error: "existing_authentication_required" }, 401);
    return json3({ success: false, error: "use_exact_dated_sonezaki_focus_slot", automaticRetry: false }, 409);
  }
  return index_default5.fetch(req, env, ctx);
}, async scheduled(controller, env, ctx) {
  const c = clock3();
  if (!active3(c.date)) return index_default5.scheduled(controller, env, ctx);
  const p2 = select3();
  if (!p2) {
    if (c.hour === 8 || c.hour === 19) console.log(JSON.stringify({ event: "sonezaki_pr_materials_needed", date: c.date, preparationEnd: "2026-10-25", automaticRetry: false }));
    return;
  }
  const service = createFocus3(p2);
  const saved = await service.row(env);
  if (saved) return;
  try {
    const result = await service.publish(env, input3(p2));
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, success: result.success, mediaId: result.mediaId }));
  } catch (e) {
    console.log(JSON.stringify({ event: "sonezaki_focus", requestId: p2.requestId, error: e instanceof ManualError7 ? e.code : "focus_operation_error", automaticRetry: false }));
  }
} };

// SNS投稿/2026-10-29_Instagram朝/recovery/src/lib/publication-policy.ts
function requiredImageCredits2(settings2, imageIds) {
  const raw2 = settings2.image_required_credits;
  if (!raw2) return [];
  const parsed = JSON.parse(raw2);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid image_required_credits setting");
  }
  const entries = parsed;
  const credits = [];
  for (const id of imageIds) {
    const value = entries[String(id)];
    if (value === void 0) continue;
    if (typeof value !== "string" || !value.trim()) throw new Error("Invalid required photo credit");
    if (!credits.includes(value.trim())) credits.push(value.trim());
  }
  return credits;
}

// SNS投稿/2026-10-29_Instagram朝/recovery/src/lib/known-external.ts
var KNOWN_EXTERNAL = [
  { date: "2026-10-28", slot: "morning", imageId: 313, photoId: "label-8f84d0ef2344e2", publishedAt: "2026-10-28T00:55:21Z", permalink: "https://www.instagram.com/p/DfBMYgFD2iS/" },
  {
    "date": "2026-10-27",
    "slot": "morning",
    "imageId": 312,
    "photoId": "label-2b13bd286adc81",
    "publishedAt": "2026-10-27T02:18:28.000Z",
    "permalink": "https://www.instagram.com/p/De-xGK4j5I-/"
  }
];

// SNS投稿/2026-10-29_Instagram朝/recovery/src/lib/focus.ts
var GRAPH9 = "https://graph.facebook.com/v21.0";
var ORIGIN8 = "https://kabuki-post-365.kerakabuki.workers.dev";
var ManualError8 = class extends Error {
  constructor(code, httpStatus = 409) {
    super(code);
    this.code = code;
    this.httpStatus = httpStatus;
  }
};
var hex8 = async (data) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash2 = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash2), (x) => x.toString(16).padStart(2, "0")).join("");
};
function createFocus4(P) {
  const base = P;
  async function resolveCaption() {
  }
  async function useSavedCaption(caption) {
    if (caption !== base.caption) throw new ManualError8("stored_caption_changed", 422);
  }
  function windowOpen5() {
    if (Date.now() < Date.parse(P.notBefore) || Date.now() >= Date.parse(P.expiresAt)) throw new ManualError8("manual_authorization_expired_or_not_started", 410);
  }
  async function validateInput5(env, value) {
    windowOpen5();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualError8("manual_input_required", 400);
    const v = value;
    const keys = ["token", "assetId", "sourceSha256", "deliverySha256", "captionSha256", "accountId", "accountUsername"];
    if (Object.keys(v).length !== keys.length || keys.some((k) => typeof v[k] !== "string")) throw new ManualError8("manual_exact_input_required", 400);
    if (v.assetId !== base.assetId || v.sourceSha256 !== base.sourceSha256 || v.deliverySha256 !== base.deliverySha256 || v.captionSha256 !== base.captionSha256 || v.accountUsername !== base.accountUsername || !env.INSTAGRAM_USER_ID || v.accountId !== env.INSTAGRAM_USER_ID || base.accountId && v.accountId !== base.accountId || await hex8(v.token) !== base.tokenSha256 || await hex8(base.caption) !== base.captionSha256) throw new ManualError8("manual_approval_binding_mismatch", 422);
    return v;
  }
  async function row5(env) {
    return env.DB.prepare("SELECT * FROM manual_announcements WHERE request_id=?").bind(P.requestId).first();
  }
  async function graph6(env, path, body) {
    if (!env.META_ACCESS_TOKEN) throw new ManualError8("existing_instagram_authentication_unavailable", 503);
    const response = await fetch(GRAPH9 + "/" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + env.META_ACCESS_TOKEN, ...body ? { "Content-Type": "application/json" } : {} }, ...body ? { body: JSON.stringify(body) } : {}, redirect: "manual", signal: AbortSignal.timeout(2e4) });
    const value = await response.json();
    if (!response.ok || value.error) throw new ManualError8("existing_meta_request_rejected_http_" + response.status, 502);
    return value;
  }
  async function identity5(env) {
    if (!env.INSTAGRAM_USER_ID || P.accountId && env.INSTAGRAM_USER_ID !== P.accountId) throw new ManualError8("manual_account_binding_mismatch", 422);
    const who = await graph6(env, env.INSTAGRAM_USER_ID + "?fields=id,username");
    if (who.id !== env.INSTAGRAM_USER_ID || who.username !== P.accountUsername) throw new ManualError8("manual_official_account_mismatch", 422);
    return { id: String(who.id), username: String(who.username) };
  }
  async function photoProof4(env) {
    const creditSetting = await env.DB.prepare("SELECT value FROM settings WHERE key='image_required_credits'").first();
    const creditLines = requiredImageCredits2({ image_required_credits: creditSetting?.value || "" }, [P.imageId]);
    if (creditLines.some((line) => !P.caption.split(/\r?\n/).map((v) => v.trim()).includes(line))) throw new ManualError8("required_photo_credit_changed", 422);
    const image = await env.DB.prepare("SELECT i.id,i.r2_key,i.verified,i.privacy_excluded,i.character_id,i.play_name,i.scene_type,c.name,c.navi_enmoku_id,c.navi_cast_id FROM images i LEFT JOIN characters c ON c.id=i.character_id WHERE i.id=?").bind(P.imageId).first();
    if (!image || image.id !== P.imageId || image.r2_key !== P.deliveryKey || image.verified !== 1 || image.privacy_excluded !== 0 || image.character_id !== P.characterId || image.play_name !== P.playName || image.name !== P.characterName || image.navi_enmoku_id !== P.naviEnmokuId || image.navi_cast_id !== P.naviCastId || image.scene_type !== P.sceneType || /AI生成/i.test(String(image.scene_type || ""))) throw new ManualError8("approved_exact_photo_metadata_changed", 422);
    return { imageId: P.imageId, playName: P.playName, characterName: P.characterName, originalSha256: P.sourceSha256, deliverySha256: P.deliverySha256, identityReviewedAt: P.identityReviewedAt, permissionProof: P.permissionSha256, identityProof: P.identitySha256, primaryProof: P.primarySha256 };
  }
  const announcementMatch5 = (m) => m.caption === P.caption;
  async function recent5(env) {
    const v = await graph6(env, env.INSTAGRAM_USER_ID + "/media?fields=id,caption,permalink,timestamp,media_type,media_url&limit=50");
    if (!Array.isArray(v.data)) throw new ManualError8("instagram_recent_media_unavailable", 503);
    return v.data;
  }
  async function assets5(env, _required = false) {
    const object2 = await env.R2.get(P.deliveryKey);
    if (!object2 || object2.size < 1e3 || object2.size > 2e6 || await hex8(await object2.arrayBuffer()) !== P.deliverySha256) throw new ManualError8("approved_exact_photo_storage_changed", 422);
    return { delivery: true, deliverySha256: P.deliverySha256, originalAndIdentityProofPinned: true };
  }
  async function inspect5(env, allowOwnClaim = false, requireAssets = false) {
    windowOpen5();
    await resolveCaption();
    const disabled = await env.DB.prepare("SELECT value FROM settings WHERE key='disabled_platforms'").first();
    if ((disabled?.value || "").split(",").map((x) => x.trim()).includes("instagram")) throw new ManualError8("instagram_is_disabled", 409);
    const own = await row5(env);
    if (own && !allowOwnClaim) throw new ManualError8("manual_one_time_slot_already_consumed", 409);
    if (P.reuseAfterDays !== 14) throw new ManualError8("preserved_14_day_reuse_required", 422);
    if (KNOWN_EXTERNAL.some((p2) => p2.date === P.date && p2.slot === P.slot)) throw new ManualError8("known_external_slot_already_published", 409);
    if (KNOWN_EXTERNAL.some((p2) => p2.imageId === P.imageId && (Date.parse(P.date) - Date.parse(p2.date)) / 864e5 < 14)) throw new ManualError8("known_external_photo_within_14_days", 409);
    const duplicate = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=1 AND (published_caption=? OR (image_id=? AND post_date>=date(?,'-'||?||' days'))) LIMIT 1").bind(P.caption, P.imageId, P.date, P.reuseAfterDays - 1).first();
    if (duplicate) throw new ManualError8("manual_announcement_already_in_existing365", 409);
    const previous = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND (state IN ('creating','processing','publishing','uncertain') OR (state='published' AND (published_at IS NULL OR date(published_at,'+9 hours')>=date(?,'-'||?||' days')))) LIMIT 1").bind(P.requestId, P.deliverySha256, P.date, P.reuseAfterDays - 1).first();
    if (previous) throw new ManualError8("photo_previously_claimed", 409);
    const sameSlot = await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date, P.slot).first();
    if (sameSlot) throw new ManualError8("existing_slot_used", 409);
    const reservation = await env.DB.prepare("SELECT id FROM posts WHERE post_date=? AND publish_slot=? AND instagram_posted=0 AND (status IN ('approved','scheduled') OR publish_state IN ('creating','processing','publishing','uncertain')) LIMIT 1").bind(P.date, P.slot).first();
    if (reservation) throw new ManualError8("existing_slot_reservation_requires_reconciliation", 409);
    const inflight = await env.DB.prepare("SELECT id FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain') LIMIT 1").first();
    if (inflight) throw new ManualError8("existing365_publication_inflight_or_uncertain", 409);
    const account = await identity5(env), photo = await photoProof4(env), media = await recent5(env);
    if (media.some(announcementMatch5)) throw new ManualError8("manual_photo_already_on_instagram", 409);
    if (media.some((m) => Date.parse(m.timestamp || "") >= Date.parse(P.notBefore) && Date.parse(m.timestamp || "") < Date.parse(P.expiresAt))) throw new ManualError8("instagram_has_today_publication", 409);
    const otherManual = await env.DB.prepare("SELECT request_id FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain') LIMIT 1").bind(P.requestId).first();
    if (otherManual) throw new ManualError8("other_manual_publication_inflight_or_uncertain", 409);
    return { account, photo, thumbnail: await assets5(env, requireAssets), existing365DuplicateCount: 0, instagramRecentDuplicateCount: 0, existing365InflightCount: 0, expiresAt: P.expiresAt, oneTimeClaimed: !!own };
  }
  const preflight5 = (env) => inspect5(env);
  function boundRow5(saved, accountId) {
    return saved.request_id === P.requestId && saved.video_id === P.assetId && saved.source_sha256 === P.sourceSha256 && saved.delivery_sha256 === P.deliverySha256 && saved.caption_sha256 === P.captionSha256 && saved.caption === P.caption && saved.token_sha256 === P.tokenSha256 && saved.account_id === accountId && saved.account_username === P.accountUsername && saved.expires_at === P.expiresAt && saved.source_key === P.sourceKey && saved.delivery_key === P.deliveryKey && saved.token_consumed === 1;
  }
  async function publish5(env, value) {
    const input4 = await validateInput5(env, value);
    const fresh = await inspect5(env, false, true);
    if (fresh.account.id !== input4.accountId) throw new ManualError8("manual_account_binding_mismatch", 422);
    const claim = await env.DB.prepare(`INSERT INTO manual_announcements(request_id,video_id,source_sha256,delivery_sha256,caption_sha256,account_id,account_username,token_sha256,expires_at,caption,source_key,delivery_key,state,token_consumed,claimed_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'creating',1,? WHERE NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id=?)
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=0 AND publish_state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_text LIKE ? OR published_caption LIKE ? OR theme LIKE ?)
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND state IN ('creating','processing','publishing','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM manual_announcements WHERE request_id<>? AND delivery_sha256=? AND state='published' AND (published_at IS NULL OR date(published_at,'+9 hours')>=date(?,'-'||?||' days')))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE instagram_posted=1 AND image_id=? AND post_date>=date(?,'-'||?||' days'))
 AND NOT EXISTS(SELECT 1 FROM posts WHERE post_date=? AND publish_slot=? AND (instagram_posted=1 OR status IN ('approved','scheduled') OR publish_state IN ('creating','processing','publishing','uncertain')))`).bind(P.requestId, P.assetId, P.sourceSha256, P.deliverySha256, P.captionSha256, input4.accountId, P.accountUsername, P.tokenSha256, P.expiresAt, P.caption, P.sourceKey, P.deliveryKey, (/* @__PURE__ */ new Date()).toISOString(), P.requestId, "%" + P.assetId + "%", "%" + P.assetId + "%", "%" + P.assetId + "%", P.requestId, P.requestId, P.deliverySha256, P.date, P.reuseAfterDays - 1, P.imageId, P.date, P.reuseAfterDays - 1, P.date, P.slot).run();
    if (claim.meta.changes !== 1) throw new ManualError8("manual_one_time_claim_conflict", 409);
    let irreversible = false;
    try {
      const container = await graph6(env, input4.accountId + "/media", { image_url: ORIGIN8 + "/media/" + P.deliveryKey, caption: P.caption, alt_text: P.altText });
      if (typeof container.id !== "string" || !container.id) throw new ManualError8("manual_container_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='processing',container_id=? WHERE request_id=? AND state='creating'").bind(container.id, P.requestId).run();
      let ready = false;
      for (let i = 0; i < 8; i++) {
        const result = await graph6(env, container.id + "?fields=status_code");
        if (result.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (result.status_code !== "IN_PROGRESS") throw new ManualError8("manual_container_processing_rejected", 502);
        if (i < 7) await new Promise((r) => setTimeout(r, 1e3));
      }
      if (!ready) throw new ManualError8("manual_container_processing_not_finished", 503);
      const final = await inspect5(env, true, true), saved = await row5(env);
      if (final.account.id !== input4.accountId || !saved || !boundRow5(saved, input4.accountId) || saved.state !== "processing" || saved.container_id !== container.id) throw new ManualError8("manual_final_approval_or_container_changed", 409);
      windowOpen5();
      const locked = await env.DB.prepare("UPDATE manual_announcements SET state='publishing' WHERE request_id=? AND state='processing' AND container_id=? AND token_consumed=1 AND account_id=? AND source_sha256=? AND delivery_sha256=? AND caption_sha256=? AND token_sha256=? AND expires_at=? RETURNING request_id").bind(P.requestId, container.id, input4.accountId, P.sourceSha256, P.deliverySha256, P.captionSha256, P.tokenSha256, P.expiresAt).first();
      if (!locked) throw new ManualError8("manual_publish_claim_conflict", 409);
      irreversible = true;
      const published = await graph6(env, input4.accountId + "/media_publish", { creation_id: container.id });
      if (typeof published.id !== "string" || !published.id) throw new ManualError8("manual_publication_result_unavailable", 502);
      await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state='publishing'").bind(published.id, (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
      let permalink = null;
      try {
        const media = await graph6(env, published.id + "?fields=permalink");
        if (typeof media.permalink === "string" && media.permalink.startsWith("https://www.instagram.com/p/")) permalink = media.permalink;
      } catch {
      }
      if (permalink) await env.DB.prepare("UPDATE manual_announcements SET permalink=? WHERE request_id=? AND media_id=?").bind(permalink, P.requestId, published.id).run();
      return { success: true, requestId: P.requestId, platform: "instagram", mediaId: published.id, permalink, tokenConsumed: true, publicationRequests: 1, automaticRetry: false };
    } catch (error) {
      const code = error instanceof ManualError8 ? error.code : "manual_external_or_storage_error";
      await env.DB.prepare("UPDATE manual_announcements SET state=?,last_error_class=? WHERE request_id=? AND state<>'published'").bind(irreversible ? "uncertain" : "failed", code, P.requestId).run();
      throw new ManualError8(irreversible ? "manual_publication_uncertain_do_not_resend" : code, 502);
    }
  }
  async function status5(env) {
    const saved = await row5(env);
    if (saved) await useSavedCaption(saved.caption);
    else await resolveCaption();
    const account = await identity5(env);
    const media = await recent5(env);
    const matches = media.filter(announcementMatch5);
    const actual = saved?.media_id ? media.find((m) => m.id === saved.media_id) : matches.length === 1 ? matches[0] : void 0;
    return { requestId: P.requestId, record: saved, account, observedMedia: actual || null, todayMedia: media.filter((m) => Date.parse(m.timestamp || "") >= Date.parse(P.todaySince)).map((m) => ({ id: m.id, caption: m.caption, permalink: m.permalink, timestamp: m.timestamp, media_type: m.media_type })), observedMatchingCount: matches.length, exactCaptionVerified: actual?.caption === P.caption, thumbnail: await assets5(env, !!saved), publicationRequests: 0, automaticRetry: false };
  }
  async function reconcile2(env) {
    const proof2 = await status5(env), saved = proof2.record;
    if (!saved || !["publishing", "uncertain"].includes(saved.state) || !boundRow5(saved, proof2.account.id) || !proof2.exactCaptionVerified || proof2.observedMatchingCount !== 1 || !proof2.observedMedia) throw new ManualError8("manual_uncertain_result_not_uniquely_proven", 409);
    const media = proof2.observedMedia;
    await env.DB.prepare("UPDATE manual_announcements SET state='published',media_id=?,permalink=?,published_at=?,last_error_class=NULL WHERE request_id=? AND state IN ('publishing','uncertain') AND token_consumed=1").bind(media.id, media.permalink || null, media.timestamp || (/* @__PURE__ */ new Date()).toISOString(), P.requestId).run();
    return { reconciled: true, mediaId: media.id, permalink: media.permalink, publicationRequests: 0, automaticRetry: false };
  }
  return { preflight: preflight5, publish: publish5, status: status5, row: row5, reconcile: reconcile2 };
}

// SNS投稿/2026-10-29_Instagram朝/recovery/src/lib/policies.ts
var POLICIES4 = [
  {
    "requestId": "instagram-recovery-20261029:morning:315",
    "request": "\u5FE0\u81E3\u8535\u4E2D\u5FC3\u306E\u65E2\u5B58\u8A31\u53EF\u5199\u771F\u3002\u516C\u958B\u524D\u306B\u95A2\u9023YouTube\u306E\u516C\u958B\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u3001\u78BA\u8A8D\u4E0D\u53EF\u306A\u3089\u7D39\u4ECB\u6587\u3092\u7701\u7565",
    "date": "2026-10-29",
    "slot": "morning",
    "assetId": "photo:instagram-recovery-20261029:morning:315",
    "photoId": "label-bce4d609700560",
    "imageId": 315,
    "sourceSha256": "bce4d609700560014df6888723ec60441b17805eeaf11cc59e20fca585af75e9",
    "deliverySha256": "51913ad5793bc859eabb61fb7c5e44658187d520fa071c2d7d01b10b64ae32a1",
    "captionSha256": "d549a35ec6658edd2454e6675c48208717115000a775388f4e54e9244fb92bfd",
    "caption": "\u6C17\u826F\u6B4C\u821E\u4F0E\u300E\u4EEE\u540D\u624B\u672C\u5FE0\u81E3\u8535\u300F\u306E\u5199\u771F\u3002\n\u4E09\u6BB5\u76EE\u306E\u6843\u4E95\u82E5\u72ED\u4E4B\u52A9\u3002\n\n\u4E09\u6BB5\u76EE\u306E\u516C\u6F14\u672C\u7DE8\u3092YouTube\u3067\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002\nYouTube\u3067\u300C\u6C17\u826F\u6B4C\u821E\u4F0E \u5FE0\u81E3\u8535 \u7B2C\u4E00\u591C \u4E09\u6BB5\u76EE \u5287\u4E2D\u89E3\u8AAC\u306A\u3057\u300D\u3068\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n#\u6C17\u826F\u6B4C\u821E\u4F0E #\u4EEE\u540D\u624B\u672C\u5FE0\u81E3\u8535",
    "photoBaseText": "\u6C17\u826F\u6B4C\u821E\u4F0E\u300E\u4EEE\u540D\u624B\u672C\u5FE0\u81E3\u8535\u300F\u306E\u5199\u771F\u3002\n\u4E09\u6BB5\u76EE\u306E\u6843\u4E95\u82E5\u72ED\u4E4B\u52A9\u3002",
    "youtubeRules": [
      {
        "id": "ko7QYxHhzq0",
        "acts": [
          "\u4E09\u6BB5\u76EE"
        ],
        "rolesAny": [],
        "label": "\u4E09\u6BB5\u76EE\u306E\u516C\u6F14\u672C\u7DE8\u3092YouTube\u3067\u3054\u89A7\u3044\u305F\u3060\u3051\u307E\u3059\u3002",
        "searchQuery": "\u6C17\u826F\u6B4C\u821E\u4F0E \u5FE0\u81E3\u8535 \u7B2C\u4E00\u591C \u4E09\u6BB5\u76EE \u5287\u4E2D\u89E3\u8AAC\u306A\u3057",
        "titleIncludes": [
          "\u4E09\u6BB5\u76EE"
        ],
        "officialChannelId": "UCBi7GXW0HJ1opsOmKBX7iuw"
      }
    ],
    "requiredCredit": "",
    "altText": "\u6C17\u826F\u6B4C\u821E\u4F0E\u300E\u4EEE\u540D\u624B\u672C\u5FE0\u81E3\u8535\u300F\u3002\u6843\u4E95\u82E5\u72ED\u4E4B\u52A9\u3068\u3057\u3066\u5F79\u540D\u4ED8\u304D\u8CC7\u6599\u306B\u4FDD\u5B58\u3055\u308C\u3066\u3044\u308B\u5199\u771F\u3002",
    "accountId": "17841474751641148",
    "accountUsername": "kerakabuki_official",
    "notBefore": "2026-10-28T23:00:00.000Z",
    "expiresAt": "2026-10-29T03:00:00.000Z",
    "todaySince": "2026-10-28T15:00:00.000Z",
    "sourceKey": "local-permission:4eede7cfd00ced898b4c60720e9033362041d91d0d1b37260c9cb287be65e4fe",
    "deliveryKey": "originals/chushingura-approved-07.jpg",
    "characterId": null,
    "characterName": null,
    "naviEnmokuId": null,
    "naviCastId": null,
    "playName": "\u4EEE\u540D\u624B\u672C\u5FE0\u81E3\u8535 \u4E09\u6BB5\u76EE",
    "sceneType": "\u30DD\u30FC\u30C8\u30EC\u30FC\u30C8",
    "identityReviewedAt": "2026-10-27T10:47:49.9419579+09:00",
    "permissionSha256": "4eede7cfd00ced898b4c60720e9033362041d91d0d1b37260c9cb287be65e4fe",
    "identitySha256": "f9bd27dadbdeeb5509109e207fb2ecb9fa5123942459674d2e09cbef059ec3ae",
    "primarySha256": "65995f45aa9f160ed6e645b586d743e8e1b51f5476e212fd64882df79c2e2323",
    "tokenSha256": "dd1021f17295516d1f562183c8deeb9131c9b37ff1e89a5035cb00dda6580b93",
    "approvalReference": "requested-recovery:instagram:2026-10-29:morning:d549a35ec6658edd2454e6675c48208717115000a775388f4e54e9244fb92bfd",
    "reuseAfterDays": 14,
    "preparationStatus": "single_requested_recovery",
    "authorizationBasis": "Current user request to recover this morning Instagram publication. Execute at actual time before noon; no backdating. Original automated 08:00-09:00 packet is only the approved content source.",
    "originalAutomatedSlotDeadline": "2026-10-29T00:00:00.000Z",
    "youtubeVerifiedBy": "authenticated local controller; fresh Data API evidence required within 5 minutes"
  }
];

// SNS投稿/2026-10-29_Instagram朝/recovery/src/index.ts
var prefix6 = "/api/v1/recovery-instagram-20261029";
var p = POLICIES4[0];
var json4 = (v, status5 = 200) => new Response(JSON.stringify(v), { status: status5, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function authenticated4(req, env) {
  if (!env.API_TOKEN) return false;
  const digest = async (x) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)));
  const a = await digest(req.headers.get("Authorization") || ""), b = await digest("Bearer " + env.API_TOKEN);
  let diff = 0;
  for (let n = 0; n < a.length; n++) diff |= a[n] ^ b[n];
  return diff === 0;
}
var index_default7 = { ...index_default6, async fetch(req, env, ctx) {
  const pathname = new URL(req.url).pathname;
  if (!pathname.startsWith(prefix6)) return index_default6.fetch(req, env, ctx);
  if (!await authenticated4(req, env)) return json4({ error: "existing_authentication_required" }, 401);
  const service = createFocus4(p);
  try {
    if (pathname === prefix6 + "/plan" && req.method === "GET") return json4({ policy: p, scope: "one requested morning publication; scheduled handler unchanged" });
    if (pathname === prefix6 + "/preflight" && req.method === "GET") return json4(await service.preflight(env));
    if (pathname === prefix6 + "/status" && req.method === "GET") return json4(await service.status(env));
    if (pathname === prefix6 + "/publish" && req.method === "POST") {
      if (await req.text() !== "{}") return json4({ error: "exact_empty_request_required" }, 400);
      return json4(await service.publish(env, { token: p.approvalReference, assetId: p.assetId, sourceSha256: p.sourceSha256, deliverySha256: p.deliverySha256, captionSha256: p.captionSha256, accountId: p.accountId, accountUsername: p.accountUsername }));
    }
    return json4({ error: "unknown_recovery_route" }, 404);
  } catch (e) {
    return e instanceof ManualError8 ? json4({ success: false, error: e.code, automaticRetry: false }, e.httpStatus) : json4({ success: false, error: "recovery_operation_error", automaticRetry: false }, 500);
  }
} };
export {
  index_default7 as default
};
