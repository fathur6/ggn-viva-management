/**
 * Perkhidmatan Google Calendar
 * Pengurusan slot Viva dan block tarikh Jawatankuasa
 */

const CALENDAR_ID = Session.getActiveUser().getEmail();

/**
 * Langkah 3: Tempah slot Viva dalam kalendar
 */
function calendarBookVivaSlot(noMatrik, tarikh, masa, tempat, webexLink) {
  const calon = getStudentFull(noMatrik);
  if (!calon) throw new Error("Calon tidak dijumpai.");

  const dateObj = new Date(tarikh);
  const timeObj = masa ? new Date(tarikh + "T" + masa + ":00") : dateObj;
  const endTime = new Date(timeObj.getTime() + 3 * 60 * 60 * 1000);

  const eventTitle = "VIVA: " + calon.Nama_Pelajar + " (" + noMatrik + ")";
  const description = "Peperiksaan Lisan Viva Voce\n" +
    "Pelajar: " + calon.Nama_Pelajar + "\n" +
    "Matrik: " + noMatrik + "\n" +
    "Program: " + calon.Nama_Program + "\n" +
    "Tajuk: " + calon.Tajuk_Penyelidikan;

  const options = {
    description: description,
    location: tempat || "Bilik Viva / Webex",
    guests: "",
    sendInvites: true
  };

  if (webexLink) {
    options.description += "\n\nWebex: " + webexLink;
  }

  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const event = cal.createEvent(eventTitle, timeObj, endTime, options);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Calon");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][DB_MAP.CALON.MATRIK].toString().trim() === noMatrik.toString().trim()) {
      const rowIdx = i + 1;
      sheet.getRange(rowIdx, DB_MAP.CALON.TARIKH_VIVA + 1).setValue(Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "dd/MM/yyyy"));
      if (tempat) sheet.getRange(rowIdx, DB_MAP.CALON.TEMPAT + 1).setValue(tempat);
      if (webexLink) sheet.getRange(rowIdx, DB_MAP.CALON.WEBEX + 1).setValue(webexLink);
    }
  }

  updateStepStatus(noMatrik, 3, {
    tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
    pic: Session.getActiveUser().getEmail(),
    catatan: "Event ID: " + event.getId()
  });

  return {
    success: true,
    message: "Slot Viva berjaya ditempah pada " + Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
    eventId: event.getId()
  };
}

/**
 * Langkah 5: Block tarikh kalendar untuk Ahli JKPT sebagai makluman awal
 */
function calendarBlockCommittee(noMatrik) {
  const calon = getStudentFull(noMatrik);
  if (!calon) throw new Error("Calon tidak dijumpai.");
  if (!calon.Tarikh_Viva || calon.Tarikh_Viva === "TBC") throw new Error("Tarikh Viva belum ditetapkan.");

  const ahliList = [calon.Pengerusi, calon.Pemeriksa_Dalam, calon.Pemeriksa_Luar, calon.Wakil_Dekan];
  const blocked = [];

  ahliList.forEach(nama => {
    const info = getStaffInfo(nama);
    if (info && info.Emel) {
      const cal = CalendarApp.getCalendarById(info.Emel);
      if (cal) {
        const dateParts = calon.Tarikh_Viva.split("/");
        const vivaDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], 9, 0);
        const endTime = new Date(vivaDate.getTime() + 8 * 60 * 60 * 1000);
        const event = cal.createEvent(
          "[BLOK] VIVA: " + calon.Nama_Pelajar,
          vivaDate, endTime,
          { description: "Makluman awal. Sila simpan tarikh ini untuk sesi Viva." }
        );
        blocked.push({ nama: nama, emel: info.Emel, eventId: event.getId() });
      }
    }
  });

  updateStepStatus(noMatrik, 5, {
    tarikhSiap: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
    pic: Session.getActiveUser().getEmail(),
    catatan: "Block: " + blocked.length + " ahli"
  });

  auditLog(noMatrik, 5, "Tarikh Viva diblok dalam kalendar JKPT.", "", JSON.stringify(blocked));
  return { success: true, message: "Blok kalendar untuk " + blocked.length + " ahli JKPT berjaya.", blok: blocked };
}

/**
 * Dapatkan senarai event Viva dalam julat tarikh
 */
function calendarGetVivaEvents(startDate, endDate) {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = cal.getEvents(start, end);
  return events
    .filter(ev => ev.getTitle().startsWith("VIVA:"))
    .map(ev => ({
      id: ev.getId(),
      title: ev.getTitle(),
      start: ev.getStartTime().toISOString(),
      end: ev.getEndTime().toISOString(),
      location: ev.getLocation(),
      description: ev.getDescription()
    }));
}
