/**
 * Konfigurasi Pemetaan Lajur (Berdasarkan Mapping Baharu)
 */
const COL_MAPPING = {
  CALON: {
    NO_MATRIK: 0, NAMA: 1, EMAIL: 7, 
    PENGERUSI: 13, PEM_LUAR: 15, PEM_DALAM: 17,
    TARIKH_VIVA: 21, URL_DRIVE: 25, TARIKH_HANTAR: 26
  },
  DIREKTORI: {
    NAMA_STAF: 0, EMEL: 1, INSTITUSI: 3, KEPAKARAN: 7
  }
};

/**
 * Mengambil data calon
 */
function getStudentsData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const data = sheet.getDataRange().getDisplayValues();
  
  return data.slice(1).map(row => ({
    id: row[COL_MAPPING.CALON.NO_MATRIK],
    nama: row[COL_MAPPING.CALON.NAMA],
    email: row[COL_MAPPING.CALON.EMAIL],
    pengerusi: row[COL_MAPPING.CALON.PENGERUSI],
    pemeriksaLuar: row[COL_MAPPING.CALON.PEM_LUAR],
    pemeriksaDalam: row[COL_MAPPING.CALON.PEM_DALAM],
    tarikhViva: row[COL_MAPPING.CALON.TARIKH_VIVA],
    tarikhHantar: row[COL_MAPPING.CALON.TARIKH_HANTAR]
  }));
}

/**
 * Mencari maklumat staf dari Direktori
 */
function getStaffInfo(namaStaf) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Direktori");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_MAPPING.DIREKTORI.NAMA_STAF].toString().trim() === namaStaf.toString().trim()) {
      return {
        Nama_Staf: data[i][COL_MAPPING.DIREKTORI.NAMA_STAF],
        Emel: data[i][COL_MAPPING.DIREKTORI.EMEL],
        Institusi: data[i][COL_MAPPING.DIREKTORI.INSTITUSI],
        Kepakaran: data[i][COL_MAPPING.DIREKTORI.KEPAKARAN]
      };
    }
  }
  return null;
}