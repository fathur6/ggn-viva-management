//const SPREADSHEET_ID = "1u4e5upuzRpV4W6jhLIYfRLGcCrLCbQSdPWX6vyEUArs";

/**
 * KAMUS PEMETAAN BERPUSAT (Berpandukan Struktur SSoT Terkini)
 */
const DB_MAP = {
  CALON: {
    MATRIK: 0, NAMA: 1, SEMESTER: 2, LEVEL: 3, PROGRAM: 4, NEC: 5, TAJUK: 6, 
    EMEL: 7, NOTEL: 8, PENYELIA: 9, PENYELIA_EMEL: 10, SV_BERSAMA: 11, SV_BERSAMA_EMEL: 12,
    PENGERUSI: 13, PENGERUSI_SIMPANAN: 14, PEM_LUAR: 15, PEM_LUAR_SIMPANAN: 16, 
    PEM_DALAM: 17, PEM_DALAM_SIMPANAN: 18, WAKIL_DEKAN: 19, WAKIL_DEKAN_SIMPANAN: 20,
    TARIKH_VIVA: 21, TEMPAT: 22, WEBEX: 23, STATUS_LANGKAH: 24, FOLDER: 25, TARIKH_HANTAR: 26
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

/**
 * Mengambil data baris demi baris dari jadual Calon untuk dipaparkan di UI (Dashboard)
 */
function getStudentsData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const data = sheet.getDataRange().getDisplayValues();
  
  // Abaikan baris header (index 0)
  return data.slice(1).map(row => ({
    No_Matrik: row[DB_MAP.CALON.MATRIK],
    Nama_Pelajar: row[DB_MAP.CALON.NAMA],
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
 * [FUNGSI BAHARU] Mengambil maklumat pentadbiran Fakulti dari jadual Term
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