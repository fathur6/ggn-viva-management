/**
 * ID Google Docs Templat (akan digantikan oleh src/templates.js)
 */
const TEMPLATE_NOS_ID = "1C-eaXo-_7oQWRIcrFrSFDasoxeSZFxrqMh5OTCsYI1E";
const TEMPLATE_LANTIKAN_ID = "1ptdb-WM7W5SzDy6huxcXPkLRqv9Oprur8F9I2xkA7pk";

/**
 * Helper: Ambil rekod lengkap calon dari helaian Calon
 */
function getCalonRecord(studentId) {
  const data = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][DB_MAP.CALON.MATRIK] == studentId) return { rowIdx: i + 1, data: data[i] };
  }
  throw new Error("Rekod calon tidak dijumpai.");
}

/**
 * Helper: Cari sub-folder dalam folder calon ikut nama
 */
function getTargetFolder(folderUrl, subFolderName) {
  if (!folderUrl || !folderUrl.includes("folders/")) return DriveApp.getRootFolder();
  const folderId = folderUrl.split("folders/")[1].split("?")[0];
  const mainFolder = DriveApp.getFolderById(folderId);
  const subFolders = mainFolder.getFolders();
  const prefix = subFolderName + " ";
  while (subFolders.hasNext()) {
    const f = subFolders.next();
    const name = f.getName();
    if (name === subFolderName || name.startsWith(prefix)) return f;
  }
  return mainFolder;
}

/**
 * Helper: Tentukan suffix versi fail (v2, v3...) untuk gantian
 */
function _getVersionSuffix(folder, fileNameBase) {
  let suffix = "";
  let version = 1;
  const baseName = fileNameBase + ".pdf";
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (name === baseName || name.match(new RegExp("^" + fileNameBase + "_(\\d+)\\.pdf$"))) {
      let v = 1;
      if (name !== baseName) {
        const match = name.match(/_(\d+)\.pdf$/);
        v = match ? parseInt(match[1], 10) : 1;
      }
      if (v >= version) version = v + 1;
    }
  }
  if (version > 1) suffix = "_" + version;
  return { suffix: suffix, pdfFileName: fileNameBase + suffix + ".pdf" };
}

/**
 * Helper: Jana surat, simpan PDF dengan nama piawai [Matrik]_[Kod].pdf
 * Kembalikan { pdfUrl, penerima, penerimaEmel }
 */
function _janaDanSimpanPdf(templateId, folder, noMatrik, kodRingkas, placeholderMap, dataRow) {
  const docFile = DriveApp.getFileById(templateId).makeCopy("_TEMP_" + noMatrik, folder);
  const doc = DocumentApp.openById(docFile.getId());
  const body = doc.getBody();
  body.replaceText("{{Nama_Pelajar}}", dataRow[DB_MAP.CALON.NAMA] || "");
  body.replaceText("{{No_Matrik}}", noMatrik || "");
  body.replaceText("{{Nama_Program}}", dataRow[DB_MAP.CALON.PROGRAM] || "");
  Object.keys(placeholderMap).forEach(k => body.replaceText(k, placeholderMap[k] || ""));
  doc.saveAndClose();
  docFile.setDescription(dataRow[DB_MAP.CALON.NAMA]);

  const pdfBlob = docFile.getAs(MimeType.PDF);
  const versi = _getVersionSuffix(folder, noMatrik + "_" + kodRingkas);
  const pdfName = versi.pdfFileName;
  const pdfFile = folder.createFile(pdfBlob);
  pdfFile.setName(pdfName);
  docFile.setTrashed(true);

  return { pdfUrl: pdfFile.getUrl(), pdfName: pdfName };
}



/* ══════════════════════════════════════════════════════════════
   1. SURAT PEMAKLUMAN KELULUSAN NoS (Langkah 1)
   ══════════════════════════════════════════════════════════════ */
function generateNoSLetter(studentId) {
  try {
    const record = getCalonRecord(studentId);
    const calon = record.data;
    const matrik = calon[DB_MAP.CALON.MATRIK];
    const namaPelajar = calon[DB_MAP.CALON.NAMA];

    let tarikhHantar = calon[DB_MAP.CALON.TARIKH_HANTAR];
    if (!tarikhHantar) {
      let d = new Date();
      d.setMonth(d.getMonth() + 3);
      tarikhHantar = Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, DB_MAP.CALON.TARIKH_HANTAR + 1).setValue(tarikhHantar);
    }

    const folder = getTargetFolder(calon[DB_MAP.CALON.FOLDER], "Viva-1 Kelulusan NoS");
    const result = _janaDanSimpanPdf(TEMPLATE_NOS_ID, folder, matrik, "Pemakluman_NoS", {
      "{{Tajuk_Penyelidikan}}": calon[DB_MAP.CALON.TAJUK],
      "{{Tarikh_Akhir_Hantar}}": tarikhHantar
    }, calon);

    if (calon[DB_MAP.CALON.EMEL]) {
      const subj = `PEMAKLUMAN KELULUSAN NOTIS PENYERAHAN TESIS (NOS) - ${namaPelajar}`;
      const body = `Tahniah! Rujuk lampiran PDF untuk kelulusan Notis Penyerahan Tesis (NoS) anda. Sila hantar tesis sebelum: ${tarikhHantar}.`;
      GmailApp.sendEmail(calon[DB_MAP.CALON.EMEL], subj, body, { attachments: [DriveApp.getFileById(result.pdfUrl.match(/[-\w]{25,}/))] });
    }

    auditLog(matrik, 1, "Surat Pemakluman NoS dijana", result.pdfUrl, "", calon[DB_MAP.CALON.NAMA], calon[DB_MAP.CALON.EMEL]);
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, DB_MAP.CALON.STATUS_LANGKAH + 1).setValue("Langkah 1: Selesai");
    updateStepStatus(matrik, 1, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });

    return { success: true, message: "Surat Pemakluman NoS berjaya dijana.", pdfUrl: result.pdfUrl };
  } catch (error) { throw new Error("Ralat NoS: " + error.message); }
}

/* ══════════════════════════════════════════════════════════════
   2. SURAT PELANTIKAN JAWATANKUASA PEMERIKSAAN (Langkah 4)
   ══════════════════════════════════════════════════════════════ */
function generateAppointmentLetter(studentId, peranan) {
  try {
    const record = getCalonRecord(studentId);
    const calon = record.data;
    const matrik = calon[DB_MAP.CALON.MATRIK];
    const namaPelajar = calon[DB_MAP.CALON.NAMA];

    let namaStaf = "";
    if (peranan === "Pengerusi") namaStaf = calon[DB_MAP.CALON.PENGERUSI];
    else if (peranan === "Pemeriksa Luar") namaStaf = calon[DB_MAP.CALON.PEM_LUAR];
    else if (peranan === "Pemeriksa Dalam") namaStaf = calon[DB_MAP.CALON.PEM_DALAM];
    else if (peranan === "Wakil Dekan") namaStaf = calon[DB_MAP.CALON.WAKIL_DEKAN];
    if (!namaStaf || namaStaf === "-") throw new Error("Nama " + peranan + " belum diisi.");

    const staffInfo = getStaffInfo(namaStaf);
    if (!staffInfo) throw new Error("Profil [" + namaStaf + "] tiada dalam Direktori.");

    const perananSnake = peranan.replace(/ /g, "_");
    const folder = getTargetFolder(calon[DB_MAP.CALON.FOLDER], "Viva-4 Surat Pelantikan");
    const result = _janaDanSimpanPdf(TEMPLATE_LANTIKAN_ID, folder, matrik, "Lantikan_" + perananSnake, {
      "{{Peranan}}": peranan.toUpperCase(),
      "{{Nama_Staf}}": staffInfo.Nama_Staf,
      "{{Institusi_Staf}}": staffInfo.Institusi || "UniSZA",
      "{{Nama_Pelajar}}": namaPelajar,
      "{{No_Matrik}}": matrik,
      "{{Tajuk_Penyelidikan}}": calon[DB_MAP.CALON.TAJUK],
      "{{Tarikh_Viva}}": calon[DB_MAP.CALON.TARIKH_VIVA] || "Akan Dimaklumkan",
      "{{Masa_Viva}}": "Akan Dimaklumkan",
      "{{Tempat_Viva}}": calon[DB_MAP.CALON.TEMPAT] || "Akan Dimaklumkan"
    }, calon);

    if (staffInfo.Emel) {
      const subj = "PELANTIKAN " + peranan.toUpperCase() + " JKPT - " + namaPelajar;
      const body = "Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr.,\nBersama-sama ini dilampirkan Surat Pelantikan rasmi.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce";
      GmailApp.sendEmail(staffInfo.Emel, subj, body, { attachments: [DriveApp.getFileById(result.pdfUrl.match(/[-\w]{25,}/))] });
    }

    auditLog(matrik, 4, "Surat Lantikan " + peranan + " dijana", result.pdfUrl, "", staffInfo.Nama_Staf, staffInfo.Emel);
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, DB_MAP.CALON.STATUS_LANGKAH + 1).setValue("Langkah 4: Selesai");
    updateStepStatus(matrik, 4, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });

    return { success: true, message: "Surat Lantikan " + peranan + " berjaya dijana.", pdfUrl: result.pdfUrl, penerima: staffInfo.Nama_Staf };
  } catch (error) { throw new Error("Ralat Lantikan: " + error.message); }
}

/* ══════════════════════════════════════════════════════════════
   3. SURAT KEPUTUSAN VIVA (Langkah 12)
   ══════════════════════════════════════════════════════════════ */
function generateSuratKeputusan(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  return generateFromTemplate(
    studentId, "L12_SURAT_KEPUTUSAN", 12,
    { "{{Keputusan}}": "Lulus dengan Pembetulan" },
    calon.Emel_Pelajar,
    "KEPUTUSAN PEPERIKSAAN LISAN (VIVA VOCE) - " + calon.Nama_Pelajar,
    "Assalamualaikum Wrm. Wbt.\n\nDimaklumkan keputusan Viva anda. Sila rujuk lampiran.\n\nTahniah."
  );
}

/* ══════════════════════════════════════════════════════════════
   4. PENJANA DOKUMEN GENERIK
   ══════════════════════════════════════════════════════════════ */
function generateFromTemplate(studentId, kodTemplat, stepNum, placeholderMap, penerimaEmel, subjekEmel, tubuhEmel) {
  try {
    const templateId = getTemplateId(kodTemplat);
    const record = getCalonRecord(studentId);
    const calon = record.data;
    const matrik = calon[DB_MAP.CALON.MATRIK];

    const folderName = "Viva-" + stepNum;
    const folder = getTargetFolder(calon[DB_MAP.CALON.FOLDER], folderName);
    const result = _janaDanSimpanPdf(templateId, folder, matrik, "Surat_Keputusan_Viva", placeholderMap, calon);

    if (penerimaEmel && subjekEmel) {
      GmailApp.sendEmail(penerimaEmel, subjekEmel, tubuhEmel || "", { attachments: [DriveApp.getFileById(result.pdfUrl.match(/[-\w]{25,}/))] });
    }

    auditLog(matrik, stepNum, "Dokumen " + kodTemplat + " dijana", result.pdfUrl, "", calon[DB_MAP.CALON.NAMA], penerimaEmel);
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, DB_MAP.CALON.STATUS_LANGKAH + 1).setValue("Langkah " + stepNum + ": Selesai");
    updateStepStatus(matrik, stepNum, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });

    return { success: true, message: "Dokumen " + kodTemplat + " berjaya dijana.", pdfUrl: result.pdfUrl };
  } catch (error) { throw new Error("Ralat Penjanaan: " + error.message); }
}
