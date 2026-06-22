/**
 * Global Configuration untuk Google Drive
 * Dapatkan PARENT_FOLDER_ID dari src/config.js (tidak dijejak Git)
 */

/**
 * Helper: Cari sub-folder Viva-X dalam folder utama (boleh eksak atau prefix)
 */
function getStepFolder(mainFolderId, stepNum) {
  const mainFolder = DriveApp.getFolderById(mainFolderId);
  const prefix = "Viva-" + stepNum + " ";
  const folders = mainFolder.getFolders();
  while (folders.hasNext()) {
    const f = folders.next();
    const name = f.getName();
    if (name === ("Viva-" + stepNum) || name.startsWith(prefix)) return f;
  }
  return mainFolder;
}

/**
 * Mencipta struktur folder pelajar di dalam folder "Oral Exams" (Langkah 1 & 2)
 */
function createStudentFolderStructure(namaPelajar, idPelajar) {
  try {
    // 1. Dapatkan Folder Induk "Oral Exams" menggunakan ID spesifik
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    
    // 2. Cipta folder utama bagi pelajar tersebut
    const mainFolderName = `${idPelajar} - ${namaPelajar}`;
    const studentFolder = parentFolder.createFolder(mainFolderName);
    
    const langkahFolderNames = [
      "Viva-1 Kelulusan NoS",
      "Viva-2 Tesis & PPS17-PPS25",
      "Viva-3 Jadual & Kalendar",
      "Viva-4 Surat Pelantikan",
      "Viva-5 Pengesahan Tarikh & JKPT",
      "Viva-6 Jemputan Rasmi Viva",
      "Viva-7 Emel 3 Hari Sebelum",
      "Viva-8 Emel 1 Hari Sebelum",
      "Viva-9 Emel Hari Viva",
      "Viva-10 Laporan Pasca Viva",
      "Viva-11 Edar Dokumen & Hono",
      "Viva-12 Surat Keputusan & Dokumen",
      "Viva-13 Tesis Pembetulan",
      "Viva-14 PPS-19 & Senat"
    ];
    langkahFolderNames.forEach(name => studentFolder.createFolder(name));
    
    // Kembalikan URL folder utama untuk direkodkan dalam Google Sheets (SSoT)
    return studentFolder.getUrl();
  } catch (error) {
    Logger.log("Ralat failDrive: " + error.toString());
    throw new Error("Gagal mencipta struktur folder di Google Drive. Sila pastikan ID folder induk adalah betul.");
  }
}