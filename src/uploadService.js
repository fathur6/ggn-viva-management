/**
 * Perkhidmatan Muat Naik Dokumen
 * Mengendalikan muat naik PDF imbasan ke folder Viva calon
 * Auto-rename fail kepada format [Matrik]_[NamaAsal].pdf
 */

/**
 * Muat naik fail PDF yang diimbas ke folder langkah spesifik
 */
function uploadScannedPdf(base64Data, fileName, noMatrik, stepNum) {
  try {
    const calon = getStudentFull(noMatrik);
    if (!calon) throw new Error("Calon tidak dijumpai.");

    const folderUrl = calon.Folder_Drive_URL;
    if (!folderUrl || !folderUrl.includes("folders/")) throw new Error("Folder calon tidak sah.");

    const folderId = folderUrl.split("folders/")[1].split("?")[0];
    const targetFolder = getStepFolder(folderId, stepNum);

    const safeName = fileName.replace(/[^a-zA-Z0-9_\-\.\u0600-\u06FF\u00C0-\u024F ]/g, "_").replace(/\s+/g, "_");
    const pdfNameBase = noMatrik + "_" + safeName.replace(/\.pdf$/i, "");
    const versi = _getUploadVersionSuffix(targetFolder, pdfNameBase);
    const pdfName = pdfNameBase + versi + ".pdf";

    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, MimeType.PDF, pdfName);
    const file = targetFolder.createFile(blob);
    const fileUrl = file.getUrl();

    updateStepStatus(noMatrik, stepNum, {
      tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
      pic: Session.getActiveUser().getEmail(),
      catatan: "Fail dimuat naik: " + pdfName
    });

    auditLog(noMatrik, stepNum, "Dokumen " + pdfName + " dimuat naik ke Viva-" + stepNum, fileUrl);

    return { success: true, message: pdfName + " berjaya dimuat naik.", fileUrl: fileUrl, fileName: pdfName };
  } catch (error) {
    throw new Error("Ralat muat naik: " + error.message);
  }
}

function _getUploadVersionSuffix(folder, fileNameBase) {
  let suffix = "";
  const baseName = fileNameBase + ".pdf";
  const files = folder.getFiles();
  let maxV = 0;
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (name === baseName) maxV = Math.max(maxV, 1);
    else {
      const match = name.match(new RegExp("^" + fileNameBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "_(\\d+)\\.pdf$"));
      if (match) maxV = Math.max(maxV, parseInt(match[1], 10));
    }
  }
  if (maxV > 0) suffix = "_" + (maxV + 1);
  return suffix;
}

/**
 * Senaraikan fail dalam folder langkah tertentu
 */
function listStepFiles(noMatrik, stepNum) {
  const calon = getStudentFull(noMatrik);
  if (!calon) return [];

  const folderUrl = calon.Folder_Drive_URL;
  if (!folderUrl || !folderUrl.includes("folders/")) return [];
  const folderId = folderUrl.split("folders/")[1].split("?")[0];
  const targetFolder = getStepFolder(folderId, stepNum);
  const files = targetFolder.getFiles();
  const result = [];
  while (files.hasNext()) {
    const file = files.next();
    result.push({
      nama: file.getName(),
      url: file.getUrl(),
      saiz: file.getSize(),
      tarikhDicipta: file.getDateCreated().toISOString()
    });
  }
  return result;
}

/**
 * Dapatkan semua fail dari SEMUA 14 folder untuk seorang calon
 */
function listAllStepFiles(noMatrik) {
  const result = {};
  for (let s = 1; s <= 14; s++) {
    result["L" + s] = listStepFiles(noMatrik, s);
  }
  return result;
}
