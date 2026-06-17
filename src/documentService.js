// ID Google Docs Templat
const TEMPLATE_NOS_ID = "1C-eaXo-_7oQWRIcrFrSFDasoxeSZFxrqMh5OTCsYI1E";
const TEMPLATE_LANTIKAN_ID = "1ptdb-WM7W5SzDy6huxcXPkLRqv9Oprur8F9I2xkA7pk";

// Pemetaan Lajur (Berdasarkan Struktur Terkini)
const MAP = {
  CALON: {
    MATRIK: 0, NAMA: 1, PROGRAM: 4, TAJUK: 6, EMEL: 7, 
    PENGERUSI: 13, PEM_LUAR: 15, PEM_DALAM: 17, WAKIL_DEKAN: 19, 
    TARIKH_VIVA: 21, TEMPAT: 22, WEBEX: 23, STATUS: 24, FOLDER: 25, TARIKH_HANTAR: 26
  },
  DIREKTORI: { NAMA: 0, EMEL: 1, INSTITUSI: 3, KEPAKARAN: 7 }
};

/**
 * Helper: Ambil Data Calon
 */
function getCalonRecord(studentId) {
  const data = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][MAP.CALON.MATRIK] == studentId) return { rowIdx: i + 1, data: data[i] };
  }
  throw new Error("Rekod calon tidak dijumpai.");
}

/**
 * Helper: Ambil Folder Calon
 */
function getTargetFolder(folderUrl, subFolderName) {
  if (!folderUrl || !folderUrl.includes("folders/")) return DriveApp.getRootFolder();
  const folderId = folderUrl.split("folders/")[1].split("?")[0];
  const mainFolder = DriveApp.getFolderById(folderId);
  const subFolders = mainFolder.getFoldersByName(subFolderName);
  return subFolders.hasNext() ? subFolders.next() : mainFolder;
}

/**
 * 1. FUNGSI MENJANA SURAT PEMAKLUMAN NoS (Langkah 1)
 */
function generateNoSLetter(studentId) {
  try {
    const record = getCalonRecord(studentId);
    const calon = record.data;
    
    // Tetapkan Tarikh Akhir Hantar (3 bulan dari sekarang) jika kosong
    let tarikhHantar = calon[MAP.CALON.TARIKH_HANTAR];
    if (!tarikhHantar) {
      let d = new Date();
      d.setMonth(d.getMonth() + 3);
      tarikhHantar = Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, MAP.CALON.TARIKH_HANTAR + 1).setValue(tarikhHantar);
    }

    const folder = getTargetFolder(calon[MAP.CALON.FOLDER], "1. Kelulusan NoS");
    const docFile = DriveApp.getFileById(TEMPLATE_NOS_ID).makeCopy(`Pemakluman NoS - ${calon[MAP.CALON.NAMA]}`, folder);
    const doc = DocumentApp.openById(docFile.getId());
    const body = doc.getBody();

    // Gantikan Placeholder
    body.replaceText("{{Nama_Pelajar}}", calon[MAP.CALON.NAMA]);
    body.replaceText("{{No_Matrik}}", calon[MAP.CALON.MATRIK]);
    body.replaceText("{{Nama_Program}}", calon[MAP.CALON.PROGRAM]);
    body.replaceText("{{Tajuk_Penyelidikan}}", calon[MAP.CALON.TAJUK]);
    body.replaceText("{{Tarikh_Akhir_Hantar}}", tarikhHantar);
    
    doc.saveAndClose();
    
    // Convert to PDF & Email
    const pdfBlob = docFile.getAs(MimeType.PDF);
    folder.createFile(pdfBlob);
    docFile.setTrashed(true);

    const emailSubject = `PEMAKLUMAN KELULUSAN NOTIS PENYERAHAN TESIS (NOS) & ARAHAN PENGHANTARAN - ${calon[MAP.CALON.NAMA]}`;
    const emailBody = `Tahniah! Rujuk lampiran PDF untuk kelulusan Notis Penyerahan Tesis (NoS) anda. Sila hantar tesis sebelum: ${tarikhHantar}.`;
    
    if(calon[MAP.CALON.EMEL]) {
      GmailApp.sendEmail(calon[MAP.CALON.EMEL], emailSubject, emailBody, { attachments: [pdfBlob] });
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, MAP.CALON.STATUS + 1).setValue("Langkah 1: Menunggu Tesis");
    }

    return { success: true, message: "Surat Pemakluman NoS berjaya dijana dan diemel kepada pelajar!" };

  } catch (error) { throw new Error("Ralat NoS: " + error.message); }
}

/**
 * 2. FUNGSI MENJANA SURAT PELANTIKAN PENILAI / JAWATANKUASA
 */
function generateAppointmentLetter(studentId, peranan) {
  try {
    const record = getCalonRecord(studentId);
    const calon = record.data;
    
    let namaStaf = "";
    if (peranan === "Pengerusi") namaStaf = calon[MAP.CALON.PENGERUSI];
    else if (peranan === "Pemeriksa Luar") namaStaf = calon[MAP.CALON.PEM_LUAR];
    else if (peranan === "Pemeriksa Dalam") namaStaf = calon[MAP.CALON.PEM_DALAM];
    else if (peranan === "Wakil Dekan") namaStaf = calon[MAP.CALON.WAKIL_DEKAN];

    if (!namaStaf || namaStaf === "-") throw new Error(`Nama ${peranan} belum diisi.`);

    const staffInfo = getStaffInfo(namaStaf); // Memanggil fungsi dari dbService.js
    if (!staffInfo) throw new Error(`Profil [${namaStaf}] tiada dalam Direktori.`);

    const folder = getTargetFolder(calon[MAP.CALON.FOLDER], "2. Surat Pelantikan & Jemputan");
    const docFile = DriveApp.getFileById(TEMPLATE_LANTIKAN_ID).makeCopy(`Surat Lantikan ${peranan} - ${calon[MAP.CALON.NAMA]}`, folder);
    const doc = DocumentApp.openById(docFile.getId());
    const body = doc.getBody();

    body.replaceText("{{Peranan}}", peranan.toUpperCase());
    body.replaceText("{{Nama_Staf}}", staffInfo.Nama_Staf);
    body.replaceText("{{Institusi_Staf}}", staffInfo.Institusi || "UniSZA");
    body.replaceText("{{Nama_Pelajar}}", calon[MAP.CALON.NAMA]);
    body.replaceText("{{No_Matrik}}", calon[MAP.CALON.MATRIK]);
    body.replaceText("{{Tajuk_Penyelidikan}}", calon[MAP.CALON.TAJUK]);
    body.replaceText("{{Tarikh_Viva}}", calon[MAP.CALON.TARIKH_VIVA] || "Akan Dimaklumkan");
    body.replaceText("{{Masa_Viva}}", "Akan Dimaklumkan");
    body.replaceText("{{Tempat_Viva}}", calon[MAP.CALON.TEMPAT] || "Akan Dimaklumkan");

    doc.saveAndClose();

    const pdfBlob = docFile.getAs(MimeType.PDF);
    folder.createFile(pdfBlob);
    docFile.setTrashed(true);

    const emailSubject = `PELANTIKAN JAWATANKUASA PEMERIKSAAN TESIS (${peranan.toUpperCase()}) - ${calon[MAP.CALON.NAMA]}`;
    const emailBody = `Assalamualaikum Wrm. Wbt. \n\nYBhg. Prof/Dr.,\nBersama-sama ini dilampirkan Surat Pelantikan rasmi.`;

    if(staffInfo.Emel) {
      GmailApp.sendEmail(staffInfo.Emel, emailSubject, emailBody, { attachments: [pdfBlob] });
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Calon").getRange(record.rowIdx, MAP.CALON.STATUS + 1).setValue(`Langkah 4: Surat ${peranan} Diemel`);
    }

    return { success: true, message: `Surat Lantikan ${peranan} berjaya dijana dan diemel kepada ${staffInfo.Nama_Staf}!` };

  } catch (error) { throw new Error("Ralat Lantikan: " + error.message); }
}