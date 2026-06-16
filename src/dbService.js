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
  if (!sheetCalon) {
    sheetCalon = ss.insertSheet("Calon");
  }
  
  const headerCalon = [
    "No_Matrik", "Nama_Pelajar", "Semester_Semasa", "Nama_Program", "NEC", 
    "Tajuk_Penyelidikan", "Emel_Pelajar", "NoTel_Pelajar", "Penyelia_Utama", 
    "Penyelia_Bersama", "Pengerusi", "Pengerusi_Simpanan", "Pemeriksa_Luar", 
    "Pemeriksa_Luar_Simpanan", "Pemeriksa_Dalam", "Pemeriksa_Dalam_Simpanan", 
    "Wakil_Dekan", "Wakil_Dekan_Simpanan", "Tarikh_Viva", "Pautan_Webex", 
    "Status_Langkah", "Folder_Drive_URL"
  ];
  
  // Masukkan data ke baris pertama (Row 1)
  sheetCalon.getRange(1, 1, 1, headerCalon.length).setValues([headerCalon]);
  // Format baris pertama (Tebal & Warna Latar Hijau Cair)
  sheetCalon.getRange(1, 1, 1, headerCalon.length).setFontWeight("bold").setBackground("#D9EAD3");
  // Pegunkan (Freeze) baris pertama supaya mudah skrol
  sheetCalon.setFrozenRows(1);

  // ==========================================
  // 2. SETUP HELAIAN "Direktori"
  // ==========================================
  let sheetDirektori = ss.getSheetByName("Direktori");
  if (!sheetDirektori) {
    sheetDirektori = ss.insertSheet("Direktori");
  }
  
  const headerDirektori = [
    "Nama_Staf", "Emel", "No_Telefon", "Institusi", 
    "Kategori", "Status_Simpanan", "Kekerapan_Lantikan", "Kepakaran"
  ];
  
  // Masukkan data ke baris pertama (Row 1)
  sheetDirektori.getRange(1, 1, 1, headerDirektori.length).setValues([headerDirektori]);
  // Format baris pertama (Tebal & Warna Latar Biru Cair)
  sheetDirektori.getRange(1, 1, 1, headerDirektori.length).setFontWeight("bold").setBackground("#C9DAF8");
  // Pegunkan (Freeze) baris pertama
  sheetDirektori.setFrozenRows(1);

  return "Pangkalan Data Berjaya Disusun!";
}