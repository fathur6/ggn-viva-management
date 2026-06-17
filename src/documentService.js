// TODO: Masukkan ID fail Google Docs templat anda di sini
const TEMPLATE_DOC_ID = "MASUKKAN_ID_GOOGLE_DOCS_TEMPLAT_ANDA_DI_SINI";

/**
 * STRATEGI V2: Menjana Surat Pelantikan Menggunakan Konsep Relational Database
 * @param {string} studentId - No Matrik Calon
 * @param {string} examinerType - Jenis Lantikan (e.g., 'Pengerusi', 'Pemeriksa Dalam', 'Pemeriksa Luar')
 */
function generateExaminerLetterV2(studentId, examinerType) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetCalon = ss.getSheetByName("Calon");
    const dataCalon = sheetCalon.getDataRange().getDisplayValues();
    const headersCalon = dataCalon[0];
    
    // 1. Cari data Calon di jadual SSoT
    let student = {};
    let rowIndex = -1;
    for (let i = 1; i < dataCalon.length; i++) {
      if (dataCalon[i][0] == studentId) { // Lajur A: No_Matrik
        rowIndex = i + 1;
        headersCalon.forEach((header, idx) => { student[header] = dataCalon[i][idx]; });
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error("Data calon tidak ditemui.");

    // 2. Tentukan nama pensyarah yang dilantik berdasarkan kategori butang
    let staffName = "";
    if (examinerType === "Pengerusi") staffName = student.Pengerusi;
    else if (examinerType === "Pemeriksa Dalam") staffName = student.Pemeriksa_Dalam;
    else if (examinerType === "Pemeriksa Luar") staffName = student.Pemeriksa_Luar;

    if (!staffName || staffName === "-") {
      throw new Error(`Nama untuk ${examinerType} belum diisi di dalam jadual Calon.`);
    }

    // 3. Panggil fungsi helper dari dbService untuk cari info Staf di jadual "Direktori"
    const staffInfo = getStaffInfo(staffName);
    if (!staffInfo) {
      throw new Error(`Profil [${staffName}] tidak ditemui dalam jadual Direktori. Sila daftarkan emel staf terlebih dahulu.`);
    }

    // 4. Akses storan Drive Calon (Gunakan pelindung ralat jika URL Drive kosong)
    let targetFolder;
    if (student.Folder_Drive_URL && student.Folder_Drive_URL.includes("folders/")) {
      const mainFolderId = student.Folder_Drive_URL.split("folders/")[1].split("?")[0];
      const mainFolder = DriveApp.getFolderById(mainFolderId);
      const subFolders = mainFolder.getFoldersByName("2. Surat Pelantikan & Jemputan");
      if (subFolders.hasNext()) targetFolder = subFolders.next();
    }
    
    // Jika tiada folder spesifik, simpan di Root Google Drive Urus Setia sebagai backup
    if (!targetFolder) targetFolder = DriveApp.getRootFolder();

    // 5. Salin templat Google Docs & Jalankan LOGIK MAIL MERGE
    const templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
    const newDocFile = templateFile.makeCopy(`Surat Pelantikan ${examinerType} - ${student.Nama_Pelajar}`, targetFolder);
    const doc = DocumentApp.openById(newDocFile.getId());
    const body = doc.getBody();

    // Gantikan placeholders dalam dokumen templat
    body.replaceText("{{Nama_Pemeriksa}}", staffInfo.Nama_Staf);
    body.replaceText("{{Institusi_Pemeriksa}}", staffInfo.Institusi || "UniSZA");
    body.replaceText("{{Kepakaran_Pemeriksa}}", staffInfo.Kepakaran || "-");
    
    body.replaceText("{{Nama_Pelajar}}", student.Nama_Pelajar);
    body.replaceText("{{No_Matrik}}", student.No_Matrik);
    body.replaceText("{{Nama_Program}}", student.Nama_Program);
    body.replaceText("{{Tajuk_Penyelidikan}}", student.Tajuk_Penyelidikan);
    body.replaceText("{{Tarikh_Viva}}", student.Tarikh_Viva || "Belum Ditetapkan");
    
    doc.saveAndClose();

    // 6. Tukar dokumen kepada PDF & padam fail komponen draf (.docx sementara)
    const pdfBlob = newDocFile.getAs(MimeType.PDF);
    const pdfFile = targetFolder.createFile(pdfBlob);
    newDocFile.setTrashed(true);

    // 7. AUTOMASI EMEL: Hantar emel rasmi bersama lampiran PDF melalui Gmail Urus Setia
    const emailSubject = `[URGENT] Pelantikan Sebagai ${examinerType} - Peperiksaan Lisan (VIVA) ${student.Nama_Pelajar} (${student.No_Matrik})`;
    const emailBody = `
      Assalamualaikum dan Salam Sejahtera,
      
      YBhg. Prof./Prof. Madya/Dr. ${staffInfo.Nama_Staf},
      
      Merujuk kepada keputusan Mesyuarat JAPSU, sukacitanya dimaklumkan bahawa pihak Fakulti bersetuju melantik YBhg. Prof./Prof. Madya/Dr. sebagai ${examinerType} untuk menilai tesis calon berikut:
      
      Nama Calon: ${student.Nama_Pelajar}
      No. Matrik: ${student.No_Matrik}
      Tajuk Tesis: ${student.Tajuk_Penyelidikan}
      
      Bersama-sama ini dilampirkan Surat Pelantikan rasmi dalam format PDF untuk rujukan dan tindakan YBhg. Prof./Prof. Madya/Dr. seterusnya.
      
      Segala kerjasama dan sumbangan kepakaran daripada pihak YBhg. Prof./Prof. Madya/Dr. amatlah dihargai oleh pihak pengurusan fakulti.
      
      Sekian, terima kasih.
      
      Urus Setia Pascasiswazah (PPS)
      Sistem Automasi Pengurusan VIVA Fakulti
    `;

    // Ambil emel staf daripada hasil carian Direktori
    const recipientEmail = staffInfo.Emel;
    
    if (recipientEmail) {
      GmailApp.sendEmail(recipientEmail, emailSubject, emailBody, {
        attachments: [pdfFile.getBlob()]
      });
      
      // 8. Kemaskini log status di Google Sheets SSoT secara real-time
      sheetCalon.getRange(rowIndex, 21).setValue(`Langkah 4: Surat ${examinerType} Diemel`);
    } else {
      throw new Error(`Gagal menghantar emel kerana alamat emel untuk ${staffInfo.Nama_Staf} kosong.`);
    }

    return {
      success: true,
      message: `Surat Pelantikan ${examinerType} rasmi berjaya dijana dan diemel kepada ${staffInfo.Nama_Staf}!`
    };

  } catch (error) {
    Logger.log("Ralat documentService V2: " + error.toString());
    throw new Error(error.message);
  }
}