/**
 * Perkhidmatan Peringatan Automatik
 * Peringatan H-7, H-3, H-1 untuk sesi Viva Voce
 */

const REMINDER_TYPES = {
  H7: { days: 7, label: "Peringatan 1 (H-7)", subjek: "PERINGATAN 1: SESI VIVA DALAM 7 HARI" },
  H3: { days: 3, label: "Peringatan 2 (H-3)", subjek: "PERINGATAN 2: SESI VIVA DALAM 3 HARI" },
  H1: { days: 1, label: "Peringatan 3 (H-1)", subjek: "PERINGATAN AKHIR: SESI VIVA ESOK" }
};

/**
 * Fungsi utama — dipanggil oleh trigger harian 8:00 AM
 * Imbas semua calon dengan tarikh Viva dan hantar peringatan
 */
function sendDailyReminders() {
  const students = getStudentsData();
  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
  let hantarCount = 0;
  let ralatCount = 0;
  let log = [];

  students.forEach(st => {
    if (!st.Tarikh_Viva || st.Tarikh_Viva === 'TBC') return;
    const diff = _parseVivaDateDiff(st.Tarikh_Viva, now.getTime());
    if (diff < 0) return;

    let jenis = null;
    if (diff === 7) jenis = 'H7';
    else if (diff === 3) jenis = 'H3';
    else if (diff === 1) jenis = 'H1';
    if (!jenis) return;

    // Cegah hantar dua kali
    if (_sudahDihantar(st.No_Matrik, jenis, today)) return;

    try {
      _hantarPeringatan(st, jenis, diff);
      _rekodPeringatan(st.No_Matrik, jenis, today);
      hantarCount++;
      log.push(st.No_Matrik + " " + REMINDER_TYPES[jenis].label);
    } catch (e) {
      ralatCount++;
      log.push("RALAT " + st.No_Matrik + ": " + e.message);
    }
  });

  Logger.log("Peringatan dihantar: " + hantarCount + ". Ralat: " + ralatCount + ". " + log.join(" | "));
  return { dihantar: hantarCount, ralat: ralatCount, log: log };
}

/**
 * Ambil senarai calon yang layak untuk peringatan (untuk paparan UI)
 */
function getReminderQueue() {
  const students = getStudentsData();
  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");
  const queue = [];

  students.forEach(st => {
    if (!st.Tarikh_Viva || st.Tarikh_Viva === 'TBC') return;
    const diff = _parseVivaDateDiff(st.Tarikh_Viva, now.getTime());
    if (diff <= 0) return;

    let jenis = null;
    if (diff === 7) jenis = 'H7';
    else if (diff === 3) jenis = 'H3';
    else if (diff === 1) jenis = 'H1';
    if (!jenis) return;

    const sudah = _sudahDihantar(st.No_Matrik, jenis, today);

    queue.push({
      No_Matrik: st.No_Matrik,
      Nama_Pelajar: st.Nama_Pelajar,
      Tarikh_Viva: st.Tarikh_Viva,
      HariHingga: diff,
      Jenis: jenis,
      Label: REMINDER_TYPES[jenis].label,
      SudahDihantar: sudah
    });
  });

  return queue;
}

/**
 * Hantar peringatan secara manual (untuk satu calon + jenis)
 */
function sendReminderManual(noMatrik, jenis) {
  const calon = getStudentFull(noMatrik);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  if (!calon.Tarikh_Viva || calon.Tarikh_Viva === 'TBC') throw new Error("Tarikh Viva belum ditetapkan.");

  const now = new Date();
  const diff = _parseVivaDateDiff(calon.Tarikh_Viva, now.getTime());
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy");

  _hantarPeringatan({
    No_Matrik: calon.No_Matrik,
    Nama_Pelajar: calon.Nama_Pelajar,
    Tarikh_Viva: calon.Tarikh_Viva,
    Pengerusi: calon.Pengerusi,
    Penyelia_Utama: calon.Penyelia_Utama,
    Pemeriksa_Dalam: calon.Pemeriksa_Dalam,
    Pemeriksa_Luar: calon.Pemeriksa_Luar,
    Wakil_Dekan: calon.Wakil_Dekan,
    Emel_Pelajar: calon.Emel_Pelajar
  }, jenis, diff);

  _rekodPeringatan(noMatrik, jenis, today);
  return { success: true, message: "Peringatan " + jenis + " dihantar secara manual." };
}

/* ────── PEMBANTU DALAMAN ────── */

function _parseVivaDateDiff(tarikhViva, nowMs) {
  const parts = tarikhViva.split('/');
  if (parts.length !== 3) return -1;
  const vivaDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  vivaDate.setHours(0, 0, 0, 0);
  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  return Math.floor((vivaDate - today) / (1000 * 60 * 60 * 24));
}

function _sudahDihantar(noMatrik, jenis, today) {
  const trail = getAuditTrail(noMatrik);
  const keyword = REMINDER_TYPES[jenis].label;
  return trail.some(a => {
    const tarikh = a.tarikhMasa ? a.tarikhMasa.substring(0, 10) : '';
    return a.tindakan.includes(keyword) && tarikh === today;
  });
}

function _rekodPeringatan(noMatrik, jenis, today) {
  auditLog(noMatrik, 0, REMINDER_TYPES[jenis].label + " — dihantar automatik pada " + today);
}

function _hantarPeringatan(st, jenis, diff) {
  const r = REMINDER_TYPES[jenis];
  const subjek = r.subjek + " — " + st.Nama_Pelajar + " (" + st.No_Matrik + ")";

  const tubuh = `Assalamualaikum Wrm. Wbt.\n\n`;
  const badan = jenis === 'H7' ? _tubuhH7(st, diff) :
                jenis === 'H3' ? _tubuhH3Peringatan(st, diff) :
                _tubuhH1Peringatan(st, diff);

  const penerima = _kumpulPenerima(st, jenis);

  penerima.forEach(p => {
    if (p.emel) {
      GmailApp.sendEmail(p.emel, subjek, tubuh + badan + "\n\nSekian, terima kasih.\nUrus Setia Peperiksaan Lisan Viva Voce");
    }
  });
}

function _kumpulPenerima(st, jenis) {
  const list = [];
  const ahli = [st.Pengerusi, st.Pemeriksa_Dalam, st.Pemeriksa_Luar, st.Penyelia_Utama, st.Wakil_Dekan];
  ahli.forEach(nama => {
    if (nama && nama !== '-') {
      const info = getStaffInfo(nama);
      if (info && info.Emel) list.push({ nama: nama, emel: info.Emel, peranan: 'Ahli JKPT' });
    }
  });
  if (st.Emel_Pelajar) list.push({ nama: st.Nama_Pelajar, emel: st.Emel_Pelajar, peranan: 'Pelajar' });
  return list;
}

function _tubuhH7(st, diff) {
  return `Peringatan 1: Sesi Peperiksaan Lisan (VIVA) anda akan berlangsung dalam masa ${diff} hari.\n\nNama Pelajar: ${st.Nama_Pelajar}\nNo. Matrik: ${st.No_Matrik}\nTarikh Viva: ${st.Tarikh_Viva}\n\nSila buat persediaan sewajarnya. Pastikan semua dokumen telah lengkap.`;
}

function _tubuhH3Peringatan(st, diff) {
  return `Peringatan 2: Sesi VIVA anda hanya ${diff} hari sahaja lagi.\n\nNama Pelajar: ${st.Nama_Pelajar}\nTarikh: ${st.Tarikh_Viva}\n\nSila semak link Webex, slaid pembentangan, dan keperluan teknikal. Hadir 15 minit awal.`;
}

function _tubuhH1Peringatan(st, diff) {
  return `PERINGATAN AKHIR: Sesi VIVA anda adalah ESOK.\n\nNama Pelajar: ${st.Nama_Pelajar}\nTarikh: ${st.Tarikh_Viva}\n\nSila pastikan semua persediaan telah lengkap. Semoga dipermudahkan.`;
}
