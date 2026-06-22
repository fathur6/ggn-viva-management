/**
 * Global Configuration untuk Google Drive
 * Dapatkan PARENT_FOLDER_ID dari src/config.js (tidak dijejak Git)
 */

/**
 * Senarai nama 14 sub-folder ikut SOP (diguna untuk cipta & cari)
 */
const VIVA_FOLDER_NAMES = [
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

/**
 * Helper kanonik: Cari sub-folder Viva-X dalam folder pelajar.
 * Jika tiada, auto-cipta folder tersebut.
 * @param {string|Folder} parent — ID folder (string) atau objek Folder
 * @param {number} stepNum — nombor langkah 1-14
 * @returns {Folder} folder Viva-X yang ditemui atau baru dicipta
 */
function getOrCreateStepFolder(parent, stepNum) {
  if (stepNum < 1 || stepNum > 14) stepNum = 1;
  const parentFolder = (typeof parent === "string") ? DriveApp.getFolderById(parent) : parent;
  const prefix = "Viva-" + stepNum + " ";
  const folders = parentFolder.getFolders();
  while (folders.hasNext()) {
    const f = folders.next();
    const name = f.getName();
    if (name === ("Viva-" + stepNum) || name.startsWith(prefix)) return f;
  }
  const folderName = VIVA_FOLDER_NAMES[stepNum - 1] || ("Viva-" + stepNum);
  return parentFolder.createFolder(folderName);
}

/**
 * Helper: Dapatkan ID folder pelajar dari URL Drive
 */
function extractFolderId(folderUrl) {
  if (!folderUrl || !folderUrl.includes("folders/")) return null;
  return folderUrl.split("folders/")[1].split("?")[0];
}

/**
 * Mencipta struktur folder pelajar di dalam folder "Oral Exams"
 */
function createStudentFolderStructure(namaPelajar, idPelajar) {
  try {
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    const mainFolderName = `${idPelajar} - ${namaPelajar}`;
    const studentFolder = parentFolder.createFolder(mainFolderName);

    VIVA_FOLDER_NAMES.forEach(name => studentFolder.createFolder(name));

    return studentFolder.getUrl();
  } catch (error) {
    Logger.log("Ralat failDrive: " + error.toString());
    throw new Error("Gagal mencipta struktur folder di Google Drive. Sila pastikan ID folder induk adalah betul.");
  }
}