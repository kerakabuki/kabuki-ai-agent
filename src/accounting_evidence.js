// 会計証憑はOCRに送らず、元ファイルのまま保存する。
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
export const EVIDENCE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf";

export async function readEvidenceFile(file) {
  if (!file || !file.name || typeof file.arrayBuffer !== "function") {
    return { error: "ファイルを選んでください。" };
  }
  if (!file.size) return { error: "空のファイルは添付できません。" };
  if (file.size > MAX_EVIDENCE_BYTES) return { error: "ファイルは5MB以下にしてください。" };
  const declaredType = (file.type || "").toLowerCase();
  const genericType = !declaredType || declaredType === "application/octet-stream";
  if (!genericType && !Object.hasOwn(EVIDENCE_TYPES, declaredType)) {
    return { error: "JPEG・PNG・WebP画像またはPDFを選んでください。" };
  }

  // 拡張子や端末から渡されたMIMEだけに頼らず、ファイルのシグネチャも確認する。
  const bytes = await file.arrayBuffer();
  const head = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  const starts = (signature) => signature.every((byte, i) => head[i] === byte);
  let contentType = "";
  if (starts([0xff, 0xd8, 0xff])) contentType = "image/jpeg";
  else if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) contentType = "image/png";
  else if (starts([0x52, 0x49, 0x46, 0x46]) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) contentType = "image/webp";
  else if (/^%PDF-\d\.\d/.test(new TextDecoder().decode(head))) {
    // 複数ページを含め、PDF全体を変換せず保持する。
    const tail = new TextDecoder().decode(bytes.slice(-1024));
    if (tail.includes("%%EOF")) contentType = "application/pdf";
  }
  if (!contentType || (!genericType && declaredType !== contentType)) {
    return { error: "ファイル形式を確認できません。JPEG・PNG・WebP画像またはPDFを選び直してください。" };
  }
  return { bytes, contentType, extension: EVIDENCE_TYPES[contentType] };
}
