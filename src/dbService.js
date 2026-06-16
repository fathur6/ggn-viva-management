/**
 * Fungsi untuk membina susunan lajur (columns) secara automatik 
 * untuk helaian "Calon" dan "Direktori".
 */
function setupDatabaseHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // ==========================================
  // 1. SETUP HELAIAN "Calon"
  // ==========================================
  let sheetCalon = ss.getSheetByName("Calon");
  if (!sheetCalon) sheetCalon = ss.insertSheet("Calon");
  
  const headerCalon = [
    "No_Matrik", "Nama_Pelajar", "Semester_Semasa", "Nama_Program", "NEC", 
    "Tajuk_Penyelidikan", "Emel_Pelajar", "NoTel_Pelajar", "Penyelia_Utama", 
    "Penyelia_Bersama", "Pengerusi", "Pengerusi_Simpanan", "Pemeriksa_Luar", 
    "Pemeriksa_Luar_Simpanan", "Pemeriksa_Dalam", "Pemeriksa_Dalam_Simpanan", 
    "Wakil_Dekan", "Wakil_Dekan_Simpanan", "Tarikh_Viva", "Pautan_Webex", 
    "Status_Langkah", "Folder_Drive_URL"
  ];
  
  sheetCalon.getRange(1, 1, 1, headerCalon.length).setValues([headerCalon]);
  sheetCalon.getRange(1, 1, 1, headerCalon.length).setFontWeight("bold").setBackground("#D9EAD3");
  sheetCalon.setFrozenRows(1);

  // ==========================================
  // 2. SETUP HELAIAN "Direktori"
  // ==========================================
  let sheetDirektori = ss.getSheetByName("Direktori");
  if (!sheetDirektori) sheetDirektori = ss.insertSheet("Direktori");
  
  // PEMETAAN BAHARU (Tahun & Tarikh_Lantikan ditambah)
  const headerDirektori = [
    "Nama_Staf", "Emel", "No_Telefon", "Institusi", 
    "Kategori", "Status_Simpanan", "Kekerapan_Lantikan", "Kepakaran",
    "Tahun", "Tarikh_Lantikan"
  ];
  
  sheetDirektori.getRange(1, 1, 1, headerDirektori.length).setValues([headerDirektori]);
  sheetDirektori.getRange(1, 1, 1, headerDirektori.length).setFontWeight("bold").setBackground("#C9DAF8");
  sheetDirektori.setFrozenRows(1);

  return "Pangkalan Data Berjaya Disusun!";
}

/**
 * FUNGSI CARIAN (HELPER)
 * Sistem akan memanggil fungsi ini untuk "memetik" emel dan no telefon
 * daripada tab Direktori berdasarkan nama Pensyarah.
 */
function getStaffInfo(staffName) {
  if (!staffName || staffName === "-") return null;
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Direktori");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Loop untuk cari baris yang sepadan dengan nama staf
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === staffName) {
      let staffInfo = {};
      headers.forEach((header, index) => {
        staffInfo[header] = data[i][index];
      });
      // Memulangkan objek data (contoh: {Emel: "ali@gmail.com", Institusi: "UMS"})
      return staffInfo; 
    }
  }
  
  return null; // Pulangkan null jika nama tidak wujud dalam direktori
}