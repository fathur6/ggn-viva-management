/**
 * Orkestrator Aliran Kerja 14-Langkah
 * Mengawal auto-advance, validasi prasyarat, dan pencetus automatik
 */

/**
 * Majukan calon ke langkah seterusnya selepas validasi prasyarat
 */
function workflowAdvanceStep(noMatrik, stepNum, data) {
  if (stepNum < 1 || stepNum > 14) {
    throw new Error("Nombor langkah tidak sah: " + stepNum + ". Julat sah: 1-14.");
  }

  const current = workflowGetCurrentStep(noMatrik);

  if (stepNum > 1) {
    const prereq = workflowValidatePrerequisites(noMatrik, stepNum);
    if (!prereq.lulus) {
      throw new Error("Prasyarat tidak dipenuhi: " + prereq.mesej);
    }
  }

  updateStepStatus(noMatrik, stepNum, data || {});

  auditLog(
    noMatrik, stepNum,
    "Langkah " + stepNum + " selesai: " + LANGKAH_LABELS[stepNum - 1],
    data ? data.lampiranUrl : "",
    data ? data.catatan : ""
  );

  return {
    success: true,
    message: "Langkah " + stepNum + " berjaya dikemaskini.",
    langkahSebelum: current,
    langkahSekarang: stepNum
  };
}

/**
 * Dapatkan langkah semasa calon
 */
function workflowGetCurrentStep(noMatrik) {
  const full = getStudentFull(noMatrik);
  if (!full) throw new Error("Rekod calon tidak dijumpai.");
  return extractStepNumber(full.Status_Langkah);
}

/**
 * Validasi sama ada prasyarat untuk sesuatu langkah telah dipenuhi
 */
function workflowValidatePrerequisites(noMatrik, targetStep) {
  const full = getStudentFull(noMatrik);
  if (!full) return { lulus: false, mesej: "Calon tidak dijumpai." };

  const current = extractStepNumber(full.Status_Langkah);

  if (targetStep <= current) {
    return { lulus: true, mesej: "Langkah " + targetStep + " sudah selesai.", sudahSelesai: true };
  }

  if (targetStep > 1) {
    for (let s = 1; s < targetStep; s++) {
      const audit = full.Audit["L" + s];
      if (!audit || !audit.tarikhSiap) {
        return {
          lulus: false,
          mesej: "Langkah " + s + " (" + LANGKAH_LABELS[s - 1] + ") belum diselesaikan.",
          langkahTertunggak: s
        };
      }
    }
  }

  const prasyarat = PRASYARAT_LANGKAH[targetStep];
  if (prasyarat) {
    return prasyarat(full);
  }

  return { lulus: true, mesej: "Prasyarat lulus." };
}

/**
 * Dapatkan senarai tindakan yang layak untuk seorang calon
 */
function workflowGetEligibleActions(noMatrik) {
  const full = getStudentFull(noMatrik);
  if (!full) throw new Error("Calon tidak dijumpai.");

  const current = extractStepNumber(full.Status_Langkah);
  const next = current + 1;
  const actions = [];

  if (next > 14) {
    return { status: "Selesai", langkahSemasa: 14, tindakan: [] };
  }

  const prereq = workflowValidatePrerequisites(noMatrik, next);

  actions.push({
    langkah: next,
    label: LANGKAH_LABELS[next - 1],
    tindakanKey: "SELESAIKAN_" + next,
    prasyaratLulus: prereq.lulus,
    mesejPrasyarat: prereq.mesej
  });

  return {
    status: "Aktif",
    langkahSemasa: current,
    langkahSeterusnya: next,
    tindakan: actions
  };
}

/**
 * Prasyarat khusus setiap langkah (boleh dikembangkan mengikut keperluan)
 */
const PRASYARAT_LANGKAH = {
  3: function(full) {
    if (!full.Tarikh_Viva || full.Tarikh_Viva === "TBC" || full.Tarikh_Viva === "") {
      return { lulus: false, mesej: "Tarikh Viva belum ditetapkan. Sila tetapkan dalam Langkah 3 dahulu." };
    }
    return { lulus: true, mesej: "OK." };
  },
  4: function(full) {
    const missing = [];
    if (!full.Pemeriksa_Luar || full.Pemeriksa_Luar === "-") missing.push("Pemeriksa Luar");
    if (!full.Pemeriksa_Dalam || full.Pemeriksa_Dalam === "-") missing.push("Pemeriksa Dalam");
    if (!full.Pengerusi || full.Pengerusi === "-") missing.push("Pengerusi");
    if (missing.length > 0) {
      return { lulus: false, mesej: "Jawatankuasa belum lengkap: " + missing.join(", ") };
    }
    return { lulus: true, mesej: "OK." };
  },
  10: function(full) {
    if (!full.Tarikh_Viva || full.Tarikh_Viva === "TBC") {
      return { lulus: false, mesej: "Sesi Viva belum berlangsung." };
    }
    const now = new Date();
    const vivaDate = new Date(full.Tarikh_Viva);
    if (now < vivaDate) {
      return { lulus: false, mesej: "Sesi Viva belum berlangsung (tarikh: " + full.Tarikh_Viva + ")." };
    }
    return { lulus: true, mesej: "OK." };
  }
};
