/**
 * Global Configurations
 */
const SPREADSHEET_ID = "1u4e5upuzRpV4W6jhLIYfRLGcCrLCbQSdPWX6vyEUArs";

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Dashboard Pengurusan Peperiksaan Lisan (VIVA)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}