/**
 * Mengambil semua data calon daripada Google Sheets (SSoT)
 * untuk dipaparkan di Dashboard.
 */
function getStudentsData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    // Pastikan ia memanggil helaian "Calon" yang tepat
    const sheet = ss.getSheetByName("Calon"); 
    
    if (!sheet) {
      throw new Error("Helaian 'Calon' tidak dijumpai dalam Google Sheets. Sila pastikan ejaan betul.");
    }

    // Menggunakan getDisplayValues() supaya format tarikh dan nombor kekal cantik
    const data = sheet.getDataRange().getDisplayValues(); 
    
    // Jika sheet kosong (hanya ada tajuk/header)
    if (data.length <= 1) return [];

    const headers = data[0];
    const students = [];

    // Gelung (loop) untuk menukar data baris kepada objek JSON
    for (let i = 1; i < data.length; i++) {
      let studentObj = {};
      for (let j = 0; j < headers.length; j++) {
        studentObj[headers[j]] = data[i][j];
      }
      students.push(studentObj);
    }
    
    return students;
    
  } catch (error) {
    Logger.log("Ralat getStudentsData: " + error.toString());
    throw new Error(error.message); // Hantar ralat ke frontend untuk dipaparkan
  }
}