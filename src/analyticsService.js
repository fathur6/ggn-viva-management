/**
 * Perkhidmatan Analitik Dashboard
 * Membekalkan data untuk papan pemuka utama (Overview)
 */

/**
 * Gambaran keseluruhan — pulangkan semua KPI untuk kad utama
 */
function getDashboardOverview() {
  const students = getStudentsData();
  const now = new Date();
  const bulanIni = now.getMonth();
  const tahunIni = now.getFullYear();
  const transitPresets = getTransitPresets();

  let countAktif = 0, countVivaBulanIni = 0, countSelesaiBulanIni = 0, countSLALewat = 0;

  students.forEach(s => {
    const step = extractStepNumber(s.Status_Langkah);
    if (step >= 1 && step < 14) countAktif++;
    if (step >= 14) countSelesaiBulanIni++;

    // Viva bulan ini
    if (s.Tarikh_Viva && s.Tarikh_Viva !== 'TBC') {
      const parts = s.Tarikh_Viva.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni) countVivaBulanIni++;
      }
    }

    // SLA lewat
    if (step >= 1 && step < 14) {
      const audit = getAuditTrail(s.No_Matrik);
      const lastAction = audit.filter(a => parseInt(a.langkah) === step).pop();
      if (lastAction) {
        const lastDate = new Date(lastAction.tarikhMasa);
        const diff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        const preset = transitPresets[step] || 7;
        if (diff > preset) countSLALewat++;
      }
    }
  });

  return {
    jumlahCalon: students.length,
    calonAktif: countAktif,
    vivaBulanIni: countVivaBulanIni,
    selesaiBulanIni: countSelesaiBulanIni,
    slaLewat: countSLALewat,
    peratusSelesai: students.length > 0 ? Math.round(countSelesaiBulanIni / students.length * 100) : 0,
    tarikhJanakuasa: now.toISOString()
  };
}

/**
 * Taburan calon per langkah (untuk bar chart)
 */
function getStepDistribution() {
  const students = getStudentsData();
  const dist = {};
  for (let s = 1; s <= 14; s++) dist["L" + s] = 0;
  dist["L0"] = 0;
  dist["L14_Selesai"] = 0;

  students.forEach(st => {
    const sn = extractStepNumber(st.Status_Langkah);
    if (sn === 0) dist["L0"]++;
    else if (sn >= 14) dist["L14_Selesai"]++;
    else dist["L" + sn]++;
  });

  return {
    taburan: dist,
    labelLangkah: ["Belum Mula"].concat(LANGKAH_LABELS).concat(["Selesai Semua"]),
    jumlahCalon: students.length,
    langkahPalingSesak: _cariPalingSesak(dist)
  };
}

function _cariPalingSesak(dist) {
  let maxKey = "L0", maxVal = dist["L0"] || 0;
  for (let s = 1; s <= 14; s++) {
    if ((dist["L" + s] || 0) > maxVal) { maxKey = "L" + s; maxVal = dist["L" + s] || 0; }
  }
  return { langkah: maxKey, bilangan: maxVal, label: maxKey === "L0" ? "Belum Mula" : LANGKAH_LABELS[parseInt(maxKey.slice(1)) - 1] };
}

/**
 * Analisis transit time — perbandingan preset vs sebenar
 */
function getTransitTimeAnalysis() {
  const students = getStudentsData();
  const presets = getTransitPresets();
  const transit = {};

  for (let s = 1; s <= 14; s++) {
    transit["L" + s] = { preset: presets[s] || 7, sebenar: [], avg: 0, onTrack: 0, overdue: 0, total: 0 };
  }

  students.forEach(st => {
    const step = extractStepNumber(st.Status_Langkah);
    if (step === 0 || step >= 14) return;
    const audit = getAuditTrail(st.No_Matrik);
    const lastAction = audit.filter(a => parseInt(a.langkah) === step).pop();
    if (lastAction) {
      const lastDate = new Date(lastAction.tarikhMasa);
      const diff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
      const key = "L" + step;
      if (transit[key]) {
        transit[key].sebenar.push(diff);
        transit[key].total++;
        transit[key].avg = Math.round(transit[key].sebenar.reduce((a, b) => a + b, 0) / transit[key].sebenar.length);
        if (diff > (presets[step] || 7)) transit[key].overdue++;
        else transit[key].onTrack++;
      }
    }
  });

  return {
    transit: transit,
    presets: presets,
    labelLangkah: LANGKAH_LABELS,
    overdueTotal: Object.values(transit).reduce((sum, t) => sum + t.overdue, 0)
  };
}

/**
 * SLA Compliance — on-time / at-risk / overdue
 */
function getSLAStats() {
  const t = getTransitTimeAnalysis();
  let onTime = 0, overdue = 0, atRisk = 0;
  Object.values(t.transit).forEach(v => {
    if (v.total === 0) return;
    onTime += v.onTrack;
    overdue += v.overdue;
    v.sebenar.forEach(d => {
      const preset = v.preset;
      if (d > preset * 0.8 && d <= preset) atRisk++;
    });
  });
  const total = onTime + overdue + atRisk;
  return {
    onTime: onTime, onTimePct: total > 0 ? Math.round(onTime / total * 100) : 100,
    atRisk: atRisk, atRiskPct: total > 0 ? Math.round(atRisk / total * 100) : 0,
    overdue: overdue, overduePct: total > 0 ? Math.round(overdue / total * 100) : 0,
    skorSLA: total > 0 ? Math.round((onTime + atRisk * 0.5) / total * 100) : 100
  };
}

/**
 * Taburan calon mengikut fakulti (diekstrak dari program)
 */
function getFacultyDistribution() {
  const students = getStudentsData();
  const fakulti = {};
  students.forEach(st => {
    const prog = st.Nama_Program || "Lain-lain";
    const f = prog.split(' ')[0] || "Lain-lain";
    fakulti[f] = (fakulti[f] || 0) + 1;
  });
  return {
    label: Object.keys(fakulti),
    nilai: Object.values(fakulti)
  };
}

/**
 * Viva akan datang dalam julat hari
 */
function getUpcomingVivas(daysAhead) {
  const students = getStudentsData();
  const now = new Date();
  const limit = new Date(now.getTime() + (daysAhead || 30) * 24 * 60 * 60 * 1000);
  const result = [];

  students.forEach(st => {
    if (!st.Tarikh_Viva || st.Tarikh_Viva === 'TBC') return;
    const parts = st.Tarikh_Viva.split('/');
    if (parts.length !== 3) return;
    const vivaDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (vivaDate >= now && vivaDate <= limit) {
      const diff = Math.ceil((vivaDate - now) / (1000 * 60 * 60 * 24));
      let urgensi = 'normal';
      if (diff <= 1) urgensi = 'kritikal';
      else if (diff <= 3) urgensi = 'tinggi';
      else if (diff <= 7) urgensi = 'sederhana';
      result.push({
        No_Matrik: st.No_Matrik,
        Nama_Pelajar: st.Nama_Pelajar,
        Tarikh_Viva: st.Tarikh_Viva,
        HariHingga: diff,
        Urgensi: urgensi
      });
    }
  });

  result.sort((a, b) => a.HariHingga - b.HariHingga);
  return result;
}
