/**
 * Peta ID Templat Google Docs untuk penjanaan surat automatik
 * Dapatkan TEMPLATE_NOS_ID & TEMPLATE_LANTIKAN_ID dari src/config.js
 */
const TEMPLATES = {
  L1_NOS:                   TEMPLATE_NOS_ID,
  L4_LANTIKAN:              TEMPLATE_LANTIKAN_ID,
  // SLOT — isi ID Docs kemudian
  L4_BORANG_KEWANGAN:       "",
  L5_SURAT_PERMOHONAN_TNC:  "",
  L6_SURAT_JEMPUTAN:        "",
  L7_EMEL_H3:               "",
  L8_EMEL_H1:               "",
  L9_EMEL_HARI_H:           "",
  L10_BORANG_LAPORAN:       "",
  L11_HONO:                 "",
  L12_SURAT_KEPUTUSAN:      "",
  L12_PPS26:                "",
  L12_PPS19:                "",
  L14_PPS28:                "",
};

/**
 * Dapatkan ID templat bagi kod tertentu, lemparkan ralat jika kosong
 */
function getTemplateId(kodTemplat) {
  const id = TEMPLATES[kodTemplat];
  if (!id) throw new Error("ID Templat [" + kodTemplat + "] belum dikonfigurasikan. Sila isi dalam src/templates.js.");
  return id;
}

/**
 * Senaraikan semua templat yang telah dikonfigurasi (ID tidak kosong)
 */
function getTemplatTersedia() {
  return Object.keys(TEMPLATES)
    .filter(k => TEMPLATES[k])
    .map(k => ({ kod: k, id: TEMPLATES[k] }));
}
