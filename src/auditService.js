/**
 * Perkhidmatan Audit & Pelaporan
 */

/**
 * Catat log audit untuk sesuatu tindakan langkah (termasuk metadata penerima)
 */
function auditLog(noMatrik, stepNum, tindakan, lampiranUrl, catatan, penerima, penerimaEmel) {
  const pic = Session.getActiveUser().getEmail();
  appendAuditLog(noMatrik, stepNum, tindakan, pic, lampiranUrl || "", catatan || "", penerima || "", penerimaEmel || "");
}

/**
 * Dapatkan jejak audit penuh untuk seorang calon
 */
function auditGetTrail(noMatrik) {
  return getAuditTrail(noMatrik);
}

/**
 * Senarai pelajar yang lewat SLA (tiada kemas kini melebihi had hari)
 */
function auditGetOverdueList(slaHari, langkahSemasa) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const values = sheet.getDataRange().getDisplayValues();
  const now = new Date();
  const overdue = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const matrik = row[DB_MAP.CALON.MATRIK];
    if (!matrik) continue;

    const status = row[DB_MAP.CALON.STATUS_LANGKAH];
    const currentStep = extractStepNumber(status);
    if (currentStep === 0 || currentStep >= 14) continue;

    if (langkahSemasa && currentStep !== langkahSemasa) continue;

    const tarikhSiap = row[getAuditColumn(currentStep, 0)];
    if (!tarikhSiap) {
      const audit = getAuditTrail(matrik);
      const lastAction = audit.find(a => parseInt(a.langkah) === currentStep);
      if (lastAction) {
        const lastDate = new Date(lastAction.tarikhMasa);
        const diffHari = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (diffHari > slaHari) {
          overdue.push({
            No_Matrik: matrik,
            Nama_Pelajar: row[DB_MAP.CALON.NAMA],
            Langkah: currentStep,
            label: LANGKAH_LABELS[currentStep - 1] || "",
            HariLewat: diffHari,
            TarikhAkhirAktiviti: lastAction.tarikhMasa
          });
        }
      }
    }
  }
  return overdue;
}

/**
 * Laporan ringkas taburan pelajar mengikut langkah
 */
function auditGetLaporanTaburan() {
  const students = getStudentsData();
  const taburan = {};
  for (let s = 1; s <= 14; s++) {
    taburan["L" + s] = 0;
  }
  taburan["Belum_Mula"] = 0;
  taburan["Selesai"] = 0;

  students.forEach(st => {
    const sn = extractStepNumber(st.Status_Langkah);
    if (sn === 0) taburan["Belum_Mula"]++;
    else if (sn >= 14) taburan["Selesai"]++;
    else taburan["L" + sn]++;
  });

  return {
    jumlahCalon: students.length,
    taburan: taburan,
    labelLangkah: LANGKAH_LABELS
  };
}

/**
 * Kira SLA piawai untuk setiap langkah (hari)
 */
function auditGetSLAStandard() {
  return {
    1: 1, 2: 3, 3: 2, 4: 3, 5: 5, 6: 2, 7: 1,
    8: 1, 9: 1, 10: 7, 11: 3, 12: 2, 13: 14, 14: 30
  };
}
