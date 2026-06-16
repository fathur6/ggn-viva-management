/**
 * Membaca data daripada Google Sheets untuk dipaparkan di Dashboard
 */
function getStudentsData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Pelajar");
  
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Tukar array kepada format JSON Object supaya senang dibaca oleh Frontend JS
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Mendaftarkan pelajar baru, menjana folder Drive, dan merekod ke Google Sheets (Langkah 1 & 2)
 */
function registerNewStudent(studentData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("Pelajar");
  
  // Jika sheet 'Pelajar' belum ada, cipta secara automatik berserta headers
  if (!sheet) {
    sheet = ss.insertSheet("Pelajar");
    sheet.appendRow([
      "ID_Pelajar", "Nama_Pelajar", "Tajuk_Tesis", "Emel_Pelajar", 
      "Pengerusi", "Pemeriksa_Dalam", "Pemeriksa_Luar", "Wakil_Dekan", 
      "Penyelia", "Tarikh_Viva", "Pautan_Webex", "Status_Langkah", "Folder_Drive_URL"
    ]);
  }
  
  // 1. Jalankan fungsi automasi folder Google Drive yang kita bina tadi
  const folderUrl = createStudentFolderStructure(studentData.Nama_Pelajar, studentData.ID_Pelajar);
  
  // 2. Masukkan data ke baris baharu di Google Sheets
  sheet.appendRow([
    studentData.ID_Pelajar,
    studentData.Nama_Pelajar,
    studentData.Tajuk_Tesis,
    studentData.Emel_Pelajar,
    studentData.Pengerusi || "",
    studentData.Pemeriksa_Dalam || "",
    studentData.Pemeriksa_Luar || "",
    studentData.Wakil_Dekan || "",
    studentData.Penyelia || "",
    "", // Tarikh Viva (Diisi kemudian di Langkah 3) 
    "", // Pautan Webex (Diisi kemudian di Langkah 3/4) 
    "Langkah 2: Terima Dokumen (PPS17/PPS25)", // Status Fasa Semasa 
    folderUrl
  ]);
  
  return { success: true, message: "Pendaftaran berjaya dan folder Drive telah dicipta!" };
}