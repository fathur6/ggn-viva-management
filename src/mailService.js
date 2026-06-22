/**
 * Perkhidmatan Penghantaran Emel Automatik
 * Templat emel dalam Bahasa Melayu Malaysia untuk setiap langkah SOP
 */

/**
 * Langkah 6: Jemputan Rasmi Viva kepada JKPT, Penyelia, dan Pelajar
 */
function mailSendJemputanViva(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const maklumat = {
    nama: calon.Nama_Pelajar,
    matrik: calon.No_Matrik,
    tajuk: calon.Tajuk_Penyelidikan,
    tarikh: calon.Tarikh_Viva || "Akan Dimaklumkan",
    tempat: "Akan Dimaklumkan",
    webex: ""
  };

  // JKPT
  const jkpt = [
    { nama: calon.Pengerusi, emel: "" },
    { nama: calon.Pemeriksa_Dalam, emel: "" },
    { nama: calon.Pemeriksa_Luar, emel: "" },
    { nama: calon.Wakil_Dekan, emel: "" }
  ];

  jkpt.forEach(ahli => {
    if (ahli.nama && ahli.nama !== "-") {
      const info = getStaffInfo(ahli.nama);
      if (info && info.Emel) {
        GmailApp.sendEmail(
          info.Emel,
          "JEMPUTAN SEBAGAI AHLI JAWATANKUASA PEMERIKSAAN TESIS - " + maklumat.nama,
          _tubuhEmelJemputanJKPT(maklumat, ahli.nama)
        );
      }
    }
  });

  // Penyelia
  if (calon.Penyelia_Utama && calon.Penyelia_Utama !== "-") {
    const sv = getStaffInfo(calon.Penyelia_Utama);
    if (sv && sv.Emel) {
      GmailApp.sendEmail(
        sv.Emel,
        "MAKLUMAN SESI VIVA - " + maklumat.nama,
        _tubuhEmelJemputanPenyelia(maklumat)
      );
    }
  }

  // Pelajar (cc Penyelia)
  if (calon.Emel_Pelajar) {
    GmailApp.sendEmail(
      calon.Emel_Pelajar,
      "JEMPUTAN SESI PEPERIKSAAN LISAN (VIVA VOCE) - " + maklumat.matrik,
      _tubuhEmelJemputanPelajar(maklumat)
    );
  }

  updateStepStatus(studentId, 6, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 6, "Surat jemputan Viva diemel kepada JKPT, Penyelia, dan Pelajar.");

  return { success: true, message: "Surat jemputan Viva berjaya diemel." };
}

/**
 * Langkah 7: Emel 3 Hari Sebelum Viva
 */
function mailSendH3(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = {
    nama: calon.Nama_Pelajar,
    matrik: calon.No_Matrik,
    tajuk: calon.Tajuk_Penyelidikan,
    tarikh: calon.Tarikh_Viva,
    webex: "Link Webex akan diberikan",
    program: calon.Nama_Program
  };

  // Pengerusi
  _hantarJikaAda(calon.Pengerusi, "PENGERUSI: DOKUMEN VIVA (H-3) - " + m.nama, _tubuhH3Pengerusi(m));
  // Pemeriksa Dalam & Luar
  _hantarJikaAda(calon.Pemeriksa_Dalam, "PEMERIKSA: DOKUMEN VIVA (H-3) - " + m.nama, _tubuhH3Pemeriksa(m));
  _hantarJikaAda(calon.Pemeriksa_Luar, "PEMERIKSA: DOKUMEN VIVA (H-3) - " + m.nama, _tubuhH3Pemeriksa(m));
  // Penyelia
  _hantarJikaAda(calon.Penyelia_Utama, "PENYELIA: MAKLUMAN VIVA (H-3) - " + m.nama, _tubuhH3Penyelia(m));
  // Pelajar
  if (calon.Emel_Pelajar) {
    GmailApp.sendEmail(calon.Emel_Pelajar, "BRIEFING VIVA (H-3) - " + m.nama, _tubuhH3Pelajar(m));
  }

  updateStepStatus(studentId, 7, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 7, "Emel H-3 dihantar kepada semua pihak.");
  return { success: true, message: "Emel H-3 berjaya dihantar." };
}

/**
 * Langkah 8: Emel 1 Hari Sebelum Viva
 */
function mailSendH1(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = { nama: calon.Nama_Pelajar, tarikh: calon.Tarikh_Viva, webex: "Link Webex akan diberikan" };

  // Pengerusi & Pemeriksa
  const IE_EE = [calon.Pengerusi, calon.Pemeriksa_Dalam, calon.Pemeriksa_Luar];
  IE_EE.forEach(nama => {
    _hantarJikaAda(nama, "BORANG LAPORAN AWAL TESIS (H-1) - " + m.nama, _tubuhH1PengerusiPemeriksa(m));
  });

  // Wakil Dekan (cc Pengerusi)
  _hantarJikaAda(calon.Wakil_Dekan, "WAKIL DEKAN: DOKUMEN VIVA (H-1) - " + m.nama, _tubuhH1WakilDekan(m));

  updateStepStatus(studentId, 8, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 8, "Emel H-1 dihantar kepada Pengerusi, Pemeriksa, dan Wakil Dekan.");
  return { success: true, message: "Emel H-1 berjaya dihantar." };
}

/**
 * Langkah 9: Emel Hari Viva (semasa sesi)
 */
function mailSendHariViva(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = { nama: calon.Nama_Pelajar, tarikh: calon.Tarikh_Viva };

  _hantarJikaAda(calon.Penyelia_Utama, "BORANG LAPORAN AWAL TESIS (HARI VIVA) - " + m.nama, _tubuhHariVPenyelia(m));

  updateStepStatus(studentId, 9, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 9, "Emel Hari Viva dihantar kepada Penyelia.");
  return { success: true, message: "Emel Hari Viva berjaya dihantar." };
}

/**
 * Langkah 11: Edar Dokumen & Bayaran Hono kepada Intan dan Zaila
 */
function mailSendEdarDokumen(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = { nama: calon.Nama_Pelajar, matrik: calon.No_Matrik };

  // Nota: Emel ke Intan dan Zaila perlu ID emel sebenar dari konfigurasi
  const intanEmel = _getPICEmel("Intan");
  const zailaEmel = _getPICEmel("Zaila");

  if (intanEmel) {
    GmailApp.sendEmail(intanEmel, "DOKUMEN KEPUTUSAN VIVA - " + m.nama, _tubuhEdarIntan(m));
  }
  if (zailaEmel) {
    GmailApp.sendEmail(zailaEmel, "BAYARAN HONORARIUM VIVA - " + m.nama, _tubuhEdarZaila(m));
  }

  updateStepStatus(studentId, 11, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 11, "Dokumen diedar kepada Intan dan Zaila.");
  return { success: true, message: "Dokumen berjaya diedarkan." };
}

/**
 * Langkah 12: Surat Keputusan Viva & Dokumen kepada Pelajar
 */
function mailSendKeputusan(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = { nama: calon.Nama_Pelajar, matrik: calon.No_Matrik, tajuk: calon.Tajuk_Penyelidikan };

  if (calon.Emel_Pelajar) {
    GmailApp.sendEmail(calon.Emel_Pelajar, "KEPUTUSAN PEPERIKSAAN LISAN (VIVA VOCE) - " + m.nama, _tubuhKeputusanPelajar(m));
  }

  // cc Penyelia
  _hantarJikaAda(calon.Penyelia_Utama, "KEPUTUSAN VIVA (SALINAN) - " + m.nama, _tubuhKeputusanPenyelia(m));

  updateStepStatus(studentId, 12, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 12, "Surat keputusan Viva diemel kepada pelajar.");
  return { success: true, message: "Surat keputusan Viva berjaya dihantar." };
}

/**
 * Langkah 14: Edar PPS-19 kepada Pemeriksa & kirim ke JKPS/Akademik
 */
function mailSendPPS19(studentId) {
  const calon = getStudentFull(studentId);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const m = { nama: calon.Nama_Pelajar, matrik: calon.No_Matrik };

  // Emel kepada Pemeriksa
  const pemeriksa = [calon.Pemeriksa_Dalam, calon.Pemeriksa_Luar, calon.Pengerusi];
  pemeriksa.forEach(nama => {
    _hantarJikaAda(nama, "PPS-19: VERIFIKASI PEMBETULAN TESIS - " + m.nama, _tubuhPPS19Pemeriksa(m));
  });

  updateStepStatus(studentId, 14, { tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"), pic: Session.getActiveUser().getEmail() });
  auditLog(studentId, 14, "PPS-19 diedar kepada pemeriksa untuk pengesahan.");
  return { success: true, message: "PPS-19 berjaya diedar kepada pemeriksa." };
}

/* ────── PEMBANTU DALAMAN ────── */

function _hantarJikaAda(nama, subjek, tubuh) {
  if (!nama || nama === "-") return;
  const info = getStaffInfo(nama);
  if (info && info.Emel) {
    GmailApp.sendEmail(info.Emel, subjek, tubuh);
  }
}

function _getPICEmel(kod) {
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
  } catch (e) { Logger.log("_getPICEmel: " + e); }
  return null;
}

/* ────── TEMPLAT TUBUH EMEL ────── */

function _tubuhEmelJemputanJKPT(m, nama) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr/Saudara/i ${nama},\n\nDengan hormatnya, dimaklumkan bahawa tuan telah dilantik sebagai Ahli Jawatankuasa Pemeriksaan Tesis bagi calon berikut:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\nTajuk Tesis: ${m.tajuk}\nTarikh Viva: ${m.tarikh}\n\nPihak Urus Setia akan memaklumkan butiran lanjut sebelum sesi viva berlangsung.\n\nKerjasama dan perhatian tuan amatlah dihargai.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhEmelJemputanPenyelia(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr.,\n\nDimaklumkan bahawa sesi Peperiksaan Lisan (VIVA) bagi pelajar seliaan tuan akan berlangsung seperti berikut:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\nTarikh Viva: ${m.tarikh}\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhEmelJemputanPelajar(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nSaudara/i ${m.nama},\n\nDimaklumkan bahawa sesi Peperiksaan Lisan (VIVA) anda akan berlangsung pada tarikh berikut:\n\nTarikh: ${m.tarikh}\nNo. Matrik: ${m.matrik}\n\nSila buat persediaan sewajarnya. Sebarang pertanyaan, sila hubungi Urus Setia.\n\nSemoga dipermudahkan.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH3Pengerusi(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Pengerusi,\n\nBerikut adalah dokumen untuk sesi Viva yang akan berlangsung 3 hari dari sekarang:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\nTajuk: ${m.tajuk}\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nLampiran: Abstrak, CV Pelajar, Slide, Tesis, Borang Laporan Pengerusi, PPS-18, Garis Panduan Pelaksanaan, Background Webex.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH3Pemeriksa(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Pemeriksa,\n\nBerikut adalah dokumen untuk sesi Viva yang akan berlangsung 3 hari dari sekarang:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nLampiran: Abstrak, CV Pelajar, Slide, Background Webex.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH3Penyelia(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Penyelia,\n\nDimaklumkan sesi Viva pelajar seliaan tuan akan berlangsung 3 hari dari sekarang:\n\nNama Pelajar: ${m.nama}\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nLampiran: Garis Panduan Pelaksanaan, Background Webex.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH3Pelajar(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nSaudara/i ${m.nama},\n\nSesi Peperiksaan Lisan (VIVA) anda akan berlangsung 3 hari dari sekarang.\n\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nSila hadir 15 minit awal dan pastikan sambungan internet stabil.\n\nLampiran: Online Oral Examination Briefing, Background Webex.\n\nSemoga dipermudahkan.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH1PengerusiPemeriksa(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr.,\n\nPeringatan: Sesi Viva bagi calon ${m.nama} akan berlangsung ESOK.\n\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nLampiran: Borang Laporan Awal Tesis.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhH1WakilDekan(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Wakil Dekan,\n\nPeringatan: Sesi Viva ${m.nama} akan berlangsung ESOK.\n\nTarikh: ${m.tarikh}\nLink Webex: ${m.webex}\n\nLampiran: Tesis, Borang Wakil Dekan, Peranan Wakil Dekan, Borang Laporan Pengerusi, Background Webex.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhHariVPenyelia(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Penyelia,\n\nSesi Viva bagi pelajar seliaan tuan sedang berlangsung hari ini.\n\nNama Pelajar: ${m.nama}\nTarikh: ${m.tarikh}\n\nLampiran: Borang Laporan Awal Tesis (IE & EE).\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhEdarIntan(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nPuan Intan,\n\nBerikut adalah dokumen keputusan Viva untuk proses selanjutnya:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\n\nLampiran: Surat Keputusan, Laporan Pemeriksa, PPS-18, Borang Wakil Dekan.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhEdarZaila(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nPuan Zaila,\n\nBerikut adalah dokumen untuk proses bayaran honorarium Viva:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\n\nLampiran: Surat Pelantikan, Borang Hono.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhKeputusanPelajar(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nSaudara/i ${m.nama},\n\nDimaklumkan keputusan Peperiksaan Lisan (VIVA) anda:\n\nNo. Matrik: ${m.matrik}\nTajuk Tesis: ${m.tajuk}\n\nLampiran: Viva Voce Result, Reports dari Pengerusi/Pemeriksa, PPS-19, PPS-26, Senarai Semak Formatting, Garis Panduan Penulisan, Templat Tesis, Borang Pengesahan Penerbitan.\n\nSila rujuk lampiran untuk tindakan pembetulan (jika ada).\n\nTahniah dan selamat maju jaya.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}

function _tubuhKeputusanPenyelia(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Dr. Penyelia,\n\nDimaklumkan keputusan Viva pelajar seliaan tuan, ${m.nama} (${m.matrik}), telah dikeluarkan.\n\nSila rujuk salinan yang diemel kepada pelajar.\n\nSekian, terima kasih.`;
}

function _tubuhPPS19Pemeriksa(m) {
  return `Assalamualaikum Wrm. Wbt.\n\nYBhg. Prof/Dr. Pemeriksa,\n\nBersama ini dilampirkan PPS-19 untuk pengesahan pembetulan tesis:\n\nNama Pelajar: ${m.nama}\nNo. Matrik: ${m.matrik}\n\nLampiran: Tesis Pembetulan, Senarai Semak Formatting, Laporan Pengerusi, PPS-26, PPS-19.\n\nMohon semakan dan pengesahan pihak tuan.\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce`;
}
