/**
 * KAMUS PEMETAAN BERPUSAT (Berpandukan Struktur SSoT Terkini)
 */
const DB_MAP = {
  CALON: {
    MATRIK: 0, NAMA: 1, SEMESTER: 2, LEVEL: 3, PROGRAM: 4, NEC: 5, TAJUK: 6,
    EMEL: 7, NOTEL: 8, PENYELIA: 9, PENYELIA_EMEL: 10, SV_BERSAMA: 11, SV_BERSAMA_EMEL: 12,
    PENGERUSI: 13, PENGERUSI_SIMPANAN: 14, PEM_LUAR: 15, PEM_LUAR_SIMPANAN: 16,
    PEM_DALAM: 17, PEM_DALAM_SIMPANAN: 18, WAKIL_DEKAN: 19, WAKIL_DEKAN_SIMPANAN: 20,
    TARIKH_VIVA: 21, TEMPAT: 22, WEBEX: 23, STATUS_LANGKAH: 24, FOLDER: 25, TARIKH_HANTAR: 26,
    RUJUKAN1: 27, RUJUKAN2: 28
  },
  DIREKTORI: {
    NAMA: 0, EMEL: 1, NOTEL: 2, INSTITUSI: 3, KATEGORI: 4,
    STATUS: 5, KEKERAPAN: 6, KEPAKARAN: 7, TAHUN: 8, TARIKH_LANTIK: 9
  },
  TERM: {
    FAKULTI: 0, FAKULTI_NAMA: 1, DEKAN: 2, DEKAN_EMEL: 3,
    KOORDINATOR: 4, KOOR_EMEL: 5, PIC: 6, PIC_EMEL: 7
  }
};

/** 42 kolum audit (14 langkah × 3 medan) bermula selepas 29 kolum sedia ada (indeks 0–28) */
const AUDIT_OFFSET = 29;

/** Label 14 langkah untuk rujukan pelayan */
const LANGKAH_LABELS = [
  "Terima Kelulusan NoS JAPSU", "Terima Tesis & PPS17/PPS25", "Penetapan Tarikh & Kalendar",
  "Surat Pelantikan Penilai", "Pengesahan Tarikh & Pelantikan JKPT", "Surat Jemputan Rasmi Viva",
  "Emel 3 Hari Sebelum Viva", "Emel 1 Hari Sebelum Viva", "Emel Hari Viva (Semasa Sesi)",
  "Terima Laporan Pasca Viva", "Edar Dokumen & Bayaran Hono", "Surat Keputusan & Dokumen Pelajar",
  "Terima Tesis Pembetulan", "Edar PPS-19 & Senat"
];

/**
 * Dapatkan indeks kolum audit. Medan: 0=Tarikh_Siap, 1=PIC, 2=Catatan
 */
function getAuditColumn(stepNum, fieldType) {
  return AUDIT_OFFSET + (stepNum - 1) * 3 + fieldType;
}

/**
 * Ekstrak nombor langkah daripada rentetan status
 */
function extractStepNumber(status) {
  if (!status) return 0;
  const match = status.toString().match(/Langkah (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Inisial helaian Log_Audit dan Templat_Surat jika belum wujud
 */
function initLogSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss.getSheetByName("Log_Audit")) {
    const sheet = ss.insertSheet("Log_Audit");
    sheet.appendRow(["Tarikh_Masa", "No_Matrik", "Langkah", "Tindakan", "PIC", "Lampiran_URL", "Catatan"]);
  }
  if (!ss.getSheetByName("Templat_Surat")) {
    const sheet = ss.insertSheet("Templat_Surat");
    sheet.appendRow(["Kod_Templat", "ID_Docs", "Penerangan"]);
  }
}

/**
 * Kemas kini status satu langkah dalam baris Calon
 */
function updateStepStatus(noMatrik, stepNum, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][DB_MAP.CALON.MATRIK].toString().trim() === noMatrik.toString().trim()) {
      const rowIdx = i + 1;
      if (data.tarikhSiap) sheet.getRange(rowIdx, getAuditColumn(stepNum, 0) + 1).setValue(data.tarikhSiap);
      if (data.pic) sheet.getRange(rowIdx, getAuditColumn(stepNum, 1) + 1).setValue(data.pic);
      if (data.catatan) sheet.getRange(rowIdx, getAuditColumn(stepNum, 2) + 1).setValue(data.catatan);
      sheet.getRange(rowIdx, DB_MAP.CALON.STATUS_LANGKAH + 1).setValue("Langkah " + stepNum + ": Selesai");
      return true;
    }
  }
  throw new Error("Rekod calon tidak dijumpai untuk kemas kini status.");
}

/**
 * Ambil rekod penuh seorang calon termasuk audit 14 langkah
 */
function getStudentFull(noMatrik) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const values = sheet.getDataRange().getDisplayValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][DB_MAP.CALON.MATRIK].toString().trim() === noMatrik.toString().trim()) {
      const row = values[i];
      const audit = {};
      for (let s = 1; s <= 14; s++) {
        audit["L" + s] = {
          tarikhSiap: row[getAuditColumn(s, 0)] || "",
          pic: row[getAuditColumn(s, 1)] || "",
          catatan: row[getAuditColumn(s, 2)] || ""
        };
      }
      return {
        No_Matrik: row[DB_MAP.CALON.MATRIK],
        Nama_Pelajar: row[DB_MAP.CALON.NAMA],
        Semester: row[DB_MAP.CALON.SEMESTER],
        Level: row[DB_MAP.CALON.LEVEL],
        Nama_Program: row[DB_MAP.CALON.PROGRAM],
        NEC: row[DB_MAP.CALON.NEC],
        Tajuk_Penyelidikan: row[DB_MAP.CALON.TAJUK],
        Emel_Pelajar: row[DB_MAP.CALON.EMEL],
        Penyelia_Utama: row[DB_MAP.CALON.PENYELIA],
        Pengerusi: row[DB_MAP.CALON.PENGERUSI],
        Pemeriksa_Luar: row[DB_MAP.CALON.PEM_LUAR],
        Pemeriksa_Dalam: row[DB_MAP.CALON.PEM_DALAM],
        Wakil_Dekan: row[DB_MAP.CALON.WAKIL_DEKAN],
        Tarikh_Viva: row[DB_MAP.CALON.TARIKH_VIVA],
        Status_Langkah: row[DB_MAP.CALON.STATUS_LANGKAH],
        Folder_Drive_URL: row[DB_MAP.CALON.FOLDER],
        Audit: audit
      };
    }
  }
  return null;
}

/**
 * Mengambil data baris demi baris dari jadual Calon untuk dipaparkan di UI (Dashboard)
 */
function getStudentsData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const data = sheet.getDataRange().getDisplayValues();

  return data.slice(1).map(row => ({
    No_Matrik: row[DB_MAP.CALON.MATRIK],
    Nama_Pelajar: row[DB_MAP.CALON.NAMA],
    Nama_Program: row[DB_MAP.CALON.PROGRAM],
    Tajuk_Penyelidikan: row[DB_MAP.CALON.TAJUK],
    Emel_Pelajar: row[DB_MAP.CALON.EMEL],
    Penyelia_Utama: row[DB_MAP.CALON.PENYELIA],
    Pengerusi: row[DB_MAP.CALON.PENGERUSI],
    Pemeriksa_Luar: row[DB_MAP.CALON.PEM_LUAR],
    Pemeriksa_Dalam: row[DB_MAP.CALON.PEM_DALAM],
    Wakil_Dekan: row[DB_MAP.CALON.WAKIL_DEKAN],
    Tarikh_Viva: row[DB_MAP.CALON.TARIKH_VIVA],
    Status_Langkah: row[DB_MAP.CALON.STATUS_LANGKAH],
    Folder_Drive_URL: row[DB_MAP.CALON.FOLDER]
  }));
}

/**
 * Mencari maklumat profil staf/penilai dari jadual Direktori
 */
function getStaffInfo(namaStaf) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Direktori");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][DB_MAP.DIREKTORI.NAMA].toString().trim() === namaStaf.toString().trim()) {
      return {
        Nama_Staf: data[i][DB_MAP.DIREKTORI.NAMA],
        Emel: data[i][DB_MAP.DIREKTORI.EMEL],
        Institusi: data[i][DB_MAP.DIREKTORI.INSTITUSI],
        Kepakaran: data[i][DB_MAP.DIREKTORI.KEPAKARAN]
      };
    }
  }
  return null;
}

/**
 * Mengambil maklumat pentadbiran Fakulti dari jadual Term
 */
function getTermInfo(kodFakulti) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Term");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][DB_MAP.TERM.FAKULTI].toString().trim().toUpperCase() === kodFakulti.toString().trim().toUpperCase()) {
      return {
        Nama_Fakulti: data[i][DB_MAP.TERM.FAKULTI_NAMA],
        Dekan: data[i][DB_MAP.TERM.DEKAN],
        Emel_Dekan: data[i][DB_MAP.TERM.DEKAN_EMEL]
      };
    }
  }
  return null;
}

/**
 * Ambil semua data Direktori untuk paparan tab
 */
function getDirektoriData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Direktori");
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  return data.slice(1).map(row => ({
    nama: row[DB_MAP.DIREKTORI.NAMA] || "",
    emel: row[DB_MAP.DIREKTORI.EMEL] || "",
    institusi: row[DB_MAP.DIREKTORI.INSTITUSI] || "",
    kepakaran: row[DB_MAP.DIREKTORI.KEPAKARAN] || "",
    kekerapan: row[DB_MAP.DIREKTORI.KEKERAPAN] || "",
    kategori: row[DB_MAP.DIREKTORI.KATEGORI] || ""
  }));
}

/**
 * Catat log audit ke helaian Log_Audit (9 lajur: termasuk Penerima & Penerima_Emel)
 */
function appendAuditLog(noMatrik, stepNum, tindakan, pic, lampiranUrl, catatan, penerima, penerimaEmel) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Log_Audit");
  if (!sheet) {
    sheet = ss.insertSheet("Log_Audit");
    sheet.appendRow(["Tarikh_Masa", "No_Matrik", "Langkah", "Tindakan", "PIC", "Penerima", "Penerima_Emel", "Lampiran_URL", "Catatan"]);
  }
  sheet.appendRow([
    new Date().toISOString(),
    noMatrik.toString(),
    stepNum,
    tindakan,
    pic || Session.getActiveUser().getEmail(),
    penerima || "",
    penerimaEmel || "",
    lampiranUrl || "",
    catatan || ""
  ]);
}

/**
 * Dapatkan jejak audit untuk seorang calon (9 lajur)
 */
function getAuditTrail(noMatrik) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Log_Audit");
  if (!sheet) return [];
  const data = sheet.getDataRange().getDisplayValues();
  return data.slice(1).filter(row => row[1].toString().trim() === noMatrik.toString().trim()).map(row => ({
    tarikhMasa: row[0],
    noMatrik: row[1],
    langkah: row[2],
    tindakan: row[3],
    pic: row[4],
    penerima: row[5] || "",
    penerimaEmel: row[6] || "",
    lampiranUrl: row[7],
    catatan: row[8]
  }));
}

/**
 * STATUS DOKUMEN — scan 14 folder Drive + banding penerima SSoT vs Audit
 * Pulangkan: { L1: {status, files, latestUrl}, L4_Pengerusi: {status, files, latestUrl, penerimaFail, penerimaSSoT}, ... }
 */
function getDocumentStatus(noMatrik) {
  const calon = getStudentFull(noMatrik);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  const folderUrl = calon.Folder_Drive_URL;
  if (!folderUrl || !folderUrl.includes("folders/")) return {};

  const folderId = folderUrl.split("folders/")[1].split("?")[0];
  const auditTrail = getAuditTrail(noMatrik);
  const status = {};

  function _scanStep(stepNum) {
    const targetFolder = getOrCreateStepFolder(folderId, stepNum);
    const files = targetFolder.getFiles();
    const result = [];
    while (files.hasNext()) {
      const f = files.next();
      const name = f.getName();
      if (name.startsWith(noMatrik + "_") || name.startsWith(noMatrik + ".")) {
        result.push({ nama: name, url: f.getUrl(), tarikh: f.getDateCreated().toISOString(), saiz: f.getSize() });
      }
    }
    result.sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));
    return result;
  }

  function _cariAuditPenerima(stepNum, keyword) {
    const matches = auditTrail.filter(a => parseInt(a.langkah) === stepNum && a.tindakan.toLowerCase().includes(keyword.toLowerCase()));
    if (matches.length === 0) return null;
    const latest = matches[matches.length - 1];
    return { penerima: latest.penerima, penerimaEmel: latest.penerimaEmel, tarikh: latest.tarikhMasa, lampiranUrl: latest.lampiranUrl };
  }

  function _buildResult(files, penerimaAudit, penerimaSSoT) {
    if (files.length === 0) return { status: "not_generated", files: [], latestUrl: null };
    const statusVal = (penerimaAudit && penerimaSSoT && penerimaAudit !== penerimaSSoT) ? "changed" : "generated";
    return {
      status: statusVal,
      files: files,
      latestUrl: files[0].url,
      latestName: files[0].nama,
      penerimaFail: penerimaAudit || null,
      penerimaSSoT: penerimaSSoT || null
    };
  }

  // L1 - NoS
  status["L1"] = _buildResult(_scanStep(1));

  // L2 - Upload pengguna
  status["L2"] = _buildResult(_scanStep(2));

  // L3 - Tiada dokumen
  status["L3"] = { status: "na", files: [], latestUrl: null };

  // L4 - Lantikan (4 peranan)
  const perananL4 = ["Pengerusi", "Pemeriksa_Luar", "Pemeriksa_Dalam", "Wakil_Dekan"];
  const fileL4 = _scanStep(4);
  perananL4.forEach(p => {
    const key = "L4_" + p;
    const files = fileL4.filter(f => f.nama.includes("Lantikan_" + p.replace(/ /g, "_")));
    const penerimaAudit = _cariAuditPenerima(4, p.replace(/_/g, " "));
    const penerimaSSoT = p === "Pengerusi" ? calon.Pengerusi : (p === "Pemeriksa_Luar" ? calon.Pemeriksa_Luar : (p === "Pemeriksa_Dalam" ? calon.Pemeriksa_Dalam : calon.Wakil_Dekan));
    status[key] = _buildResult(files, penerimaAudit ? penerimaAudit.penerima : null, penerimaSSoT);
  });

  // L5-L11 — muat naik pengguna sahaja
  for (let s = 5; s <= 11; s++) {
    status["L" + s] = _buildResult(_scanStep(s));
  }

  // L12 - Surat Keputusan
  status["L12"] = _buildResult(_scanStep(12));

  // L13 - Tesis Pembetulan (muat naik)
  status["L13"] = _buildResult(_scanStep(13));

  // L14 - PPS-19
  status["L14"] = _buildResult(_scanStep(14));

  return status;
}
