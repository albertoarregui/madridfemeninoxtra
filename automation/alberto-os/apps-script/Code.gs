const ALBERTO_OS = Object.freeze({
  spreadsheetId: '1aBj-n_B6zu_eM5izZz5HiC1lJsDsqqnscmgQF8cBDJY',
  inboxSheet: 'INBOX',
  logSheet: 'LOG',
  driveFolders: [
    { id: '1VOfS_i3DZMt7eS-R75yJ4AXXjDNGmt_6', process: 'Datos MFX' },
    { id: '1A0XBG_O5IvMajAcXXNRvGreTR8GqLryn', process: 'Fotos MFX' },
    { id: '1tS8iAofKUMJOqT-bq-hKE99iKIqITFrd', process: 'Vídeo MFX' },
    { id: '1hO68cLKzy7oDX1-lSlXfjdA5OeG4XmFS', process: 'Noticias MFX' },
    { id: '1oEaelSmncqdIvdge019BvDw14d4rT6RY', process: 'Correos MFX' },
  ],
  gmailLabels: [
    { name: 'ALBERTO_OS/MFX', area: 'MFX', process: 'Correo MFX' },
    { name: 'ALBERTO_OS/VIAJES', area: 'PERSONAL', process: 'Viaje' },
    { name: 'ALBERTO_OS/EMPLEO', area: 'PROFESIONAL', process: 'Oferta laboral' },
    { name: 'ALBERTO_OS/NEGOCIO', area: 'PROFESIONAL', process: 'Oportunidad de negocio' },
  ],
});

function setupAlbertoOs() {
  ALBERTO_OS.gmailLabels.forEach(({ name }) => {
    if (!GmailApp.getUserLabelByName(name)) GmailApp.createLabel(name);
  });
  logEvent_('ALBERTO_OS_SETUP', 'SYSTEM', 'GOOGLE', 'OK', 'Etiquetas y configuración verificadas', 'NO', '');
}

function syncAlbertoOsInbox() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Otra sincronización sigue en curso.');

  try {
    const known = getKnownExternalIds_();
    const rows = [
      ...collectDriveRows_(known),
      ...collectGmailRows_(known),
    ];

    if (rows.length) {
      const sheet = getSheet_(ALBERTO_OS.inboxSheet);
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    logEvent_('ALBERTO_OS_SYNC', 'SYSTEM', 'INBOX', 'OK', `${rows.length} entradas nuevas`, 'NO', '');
    return rows.length;
  } catch (error) {
    logEvent_('ALBERTO_OS_SYNC', 'SYSTEM', 'INBOX', 'ERROR', String(error.message || error), 'SÍ', '');
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function createHourlyTrigger() {
  const handler = 'syncAlbertoOsInbox';
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === handler)
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger(handler).timeBased().everyHours(1).create();
  logEvent_('ALBERTO_OS_TRIGGER', 'SYSTEM', 'INBOX', 'OK', 'Sincronización horaria activada', 'NO', '');
}

function removeHourlyTrigger() {
  const handler = 'syncAlbertoOsInbox';
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === handler)
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  logEvent_('ALBERTO_OS_TRIGGER', 'SYSTEM', 'INBOX', 'OK', 'Sincronización horaria desactivada', 'NO', '');
}

function collectDriveRows_(known) {
  const rows = [];
  ALBERTO_OS.driveFolders.forEach(({ id, process }) => {
    const folder = DriveApp.getFolderById(id);
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const externalId = `drive:${file.getId()}`;
      if (known.has(externalId)) continue;
      known.add(externalId);
      rows.push(makeInboxRow_({
        area: 'MFX',
        process,
        name: file.getName(),
        input: file.getUrl(),
        externalId,
        date: file.getDateCreated(),
      }));
    }
  });
  return rows;
}

function collectGmailRows_(known) {
  const rows = [];
  ALBERTO_OS.gmailLabels.forEach(({ name, area, process }) => {
    const label = GmailApp.getUserLabelByName(name);
    if (!label) return;

    label.getThreads(0, 100).forEach((thread) => {
      const message = thread.getMessages().slice(-1)[0];
      const externalId = `gmail:${message.getId()}`;
      if (known.has(externalId)) return;
      known.add(externalId);
      rows.push(makeInboxRow_({
        area,
        process,
        name: message.getSubject() || '(sin asunto)',
        input: `https://mail.google.com/mail/u/0/#all/${thread.getId()}`,
        externalId,
        date: message.getDate(),
      }));
    });
  });
  return rows;
}

function makeInboxRow_({ area, process, name, input, externalId, date }) {
  const now = new Date();
  return [
    Utilities.getUuid(),
    date || now,
    area,
    process,
    name,
    'INBOX',
    'MEDIA',
    'NO',
    input,
    '',
    externalId,
    '',
    now,
  ];
}

function getKnownExternalIds_() {
  const sheet = getSheet_(ALBERTO_OS.inboxSheet);
  if (sheet.getLastRow() < 2) return new Set();
  return new Set(
    sheet.getRange(2, 11, sheet.getLastRow() - 1, 1)
      .getDisplayValues()
      .flat()
      .filter(Boolean),
  );
}

function logEvent_(workflow, area, entity, result, detail, attention, reference) {
  getSheet_(ALBERTO_OS.logSheet).appendRow([
    new Date(), workflow, area, entity, result, detail, attention, reference,
  ]);
}

function getSheet_(name) {
  const sheet = SpreadsheetApp.openById(ALBERTO_OS.spreadsheetId).getSheetByName(name);
  if (!sheet) throw new Error(`No existe la pestaña ${name}.`);
  return sheet;
}
