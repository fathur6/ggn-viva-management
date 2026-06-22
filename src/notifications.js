/**
 * Perkhidmatan Notifikasi
 * Hantar notifikasi automatik kepada pihak berkepentingan
 */

/**
 * Notifikasi kepada Intan (surat keputusan)
 */
function notifyIntan(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  const emel = _cariEmelPIC("Intan");
  if (emel) {
    GmailApp.sendEmail(emel, "SURAT KEPUTUSAN VIVA - " + calon.Nama_Pelajar, "Puan Intan,\n\nBerikut adalah keputusan Viva untuk tindakan selanjutnya:\n\nNama: " + calon.Nama_Pelajar + "\nMatrik: " + calon.No_Matrik + "\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce");
    auditLog(studentId, 11, "Notifikasi dihantar kepada Intan.");
  }
}

/**
 * Notifikasi kepada Zaila (bayaran honorarium)
 */
function notifyZaila(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  const emel = _cariEmelPIC("Zaila");
  if (emel) {
    GmailApp.sendEmail(emel, "BAYARAN HONORARIUM VIVA - " + calon.Nama_Pelajar, "Puan Zaila,\n\nBerikut adalah dokumen untuk proses bayaran honorarium Viva:\n\nNama: " + calon.Nama_Pelajar + "\nMatrik: " + calon.No_Matrik + "\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce");
    auditLog(studentId, 11, "Notifikasi dihantar kepada Zaila.");
  }
}

/**
 * Notifikasi permohonan nama baharu kepada TNC AA (Langkah 5 — jika penolakan)
 */
function notifyTNCAA(studentId, namaAsal, peranan) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  const emel = _cariEmelPIC("TNC");
  if (emel) {
    GmailApp.sendEmail(emel, "PERMOHONAN PELANTIKAN BAHARU " + peranan.toUpperCase() + " - " + calon.Nama_Pelajar, "YBhg. TNC AA,\n\nDimohon kelulusan pelantikan baharu " + peranan + " bagi calon:\n\nNama: " + calon.Nama_Pelajar + "\nMatrik: " + calon.No_Matrik + "\nNama Asal: " + namaAsal + " (menolak pelantikan)\n\nSekian, terima kasih.");
    auditLog(studentId, 5, "Permohonan nama baharu " + peranan + " dihantar kepada TNC AA.");
  }
}

/**
 * Notifikasi pindaan SSoT — kemas kini status tanpa lampiran
 */
function notifyStatusUpdate(studentId, stepNum, catatan) {
  updateStepStatus(studentId, stepNum, {
    tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
    pic: Session.getActiveUser().getEmail(),
    catatan: catatan || ""
  });
  auditLog(studentId, stepNum, catatan || "Status dikemaskini.");
  return { success: true, message: "Status langkah " + stepNum + " dikemaskini." };
}

function _cariEmelPIC(kod) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const s = ss.getSheetByName("Term");
    if (!s) return null;
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (d[i][6] && d[i][6].toString().trim().toLowerCase() === kod.toLowerCase()) {
        return d[i][7] || null;
      }
    }
  } catch (e) { Logger.log("_cariEmelPIC: " + e); }
  return null;
}
