
// КОНФИГУРАЦИЯ
const SHEETS = {
  DOGS: "Dogs",
  GROUPS: "Groups",
  VOLUNTEERS: "Volunteers",
  SETTINGS: "Settings"
};

const TTL_DAYS = 365;

/**
 * Глобальная обертка для обработки ошибок и возврата JSON.
 */
function safeExecute(fn) {
  try {
    return fn();
  } catch (error) {
    console.error("Critical server error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: "GAS_SERVER_CRITICAL: " + error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return safeExecute(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    cleanupOldGroups();
    
    return createJsonResponse({
      status: 'success',
      dogs: getNormalizedData(ss, SHEETS.DOGS),
      groups: getNormalizedData(ss, SHEETS.GROUPS),
      volunteers: getNormalizedData(ss, SHEETS.VOLUNTEERS),
      settings: readSheetSettings(ss)
    });
  });
}

function doPost(e) {
  return safeExecute(() => {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000); 
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const data = JSON.parse(e.postData.contents);
      let targetTeamId = data.payload?.teamId || null;

      switch (data.action) {
        case 'finishWalk':
          targetTeamId = targetTeamId || getTeamIdByGroupId(ss, data.payload.groupId);
          finishWalkInSheet(ss, data.payload.groupId, data.payload.dogIds, data.payload.endTime, data.payload.durationMinutes);
          break;
        case 'resetWalks':
          resetWalksInSheet();
          incrementDbVersion(ss, "global");
          break;
        case 'saveSetting':
          upsertSetting(ss, data.payload.key, data.payload.value);
          break;
        case 'addDog': 
          appendRow(ss, SHEETS.DOGS, data.payload); 
          break;
        case 'updateDog': 
          targetTeamId = targetTeamId || getTeamIdByDogId(ss, data.payload.id);
          updateRow(ss, SHEETS.DOGS, data.payload.id, data.payload.updates); 
          break;
        case 'addVolunteer': 
          appendRow(ss, SHEETS.VOLUNTEERS, data.payload); 
          break;
        case 'updateVolunteer': 
          updateRow(ss, SHEETS.VOLUNTEERS, data.payload.id, data.payload.updates); 
          break;
        case 'createGroup':
          const groupPayload = data.payload;
          const exp = new Date();
          exp.setDate(exp.getDate() + TTL_DAYS);
          groupPayload.ttl = exp.toISOString(); 
          appendRow(ss, SHEETS.GROUPS, groupPayload);
          break;
        case 'updateGroup': 
          targetTeamId = targetTeamId || getTeamIdByGroupId(ss, data.payload.id);
          updateRow(ss, SHEETS.GROUPS, data.payload.id, data.payload.updates); 
          break;
        case 'deleteGroup': 
          targetTeamId = targetTeamId || getTeamIdByGroupId(ss, data.payload.id);
          deleteGroupAndClearDogs(ss, data.payload.id); 
          break;
      }

      if (targetTeamId) incrementDbVersion(ss, targetTeamId);
      return createJsonResponse({ status: 'success' });
    } finally {
      lock.releaseLock();
    }
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getNormalizedData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  if (range.getNumRows() < 2) return [];
  const data = range.getValues();
  const rawHeaders = data[0];
  const normalizedHeaders = rawHeaders.map(h => h.toString().trim().toLowerCase().replace(/[^a-z]/g, ''));
  
  const map = {
    'id': 'id', 'name': 'name', 'age': 'age', 'weight': 'weight', 'row': 'row',
    'notes': 'notes', 'health': 'health', 'complexity': 'complexity', 
    'pairs': 'pairs', 'conflicts': 'conflicts', 'teamid': 'teamId', 
    'walkstoday': 'walksToday', 'lastwalktime': 'lastWalkTime', 
    'groupid': 'groupId', 'ishidden': 'isHidden', 'status': 'status',
    'volunteername': 'volunteerName', 'volunteerid': 'volunteerId',
    'starttime': 'startTime', 'endtime': 'endTime', 'durationminutes': 'durationMinutes',
    'telegramid': 'telegramId', 'telegramusername': 'telegramUsername', 'role': 'role',
    'experience': 'experience', 'lastlogin': 'lastLogin'
  };

  return data.slice(1).map(row => {
    let obj = {};
    normalizedHeaders.forEach((h, i) => {
      const key = map[h] || h;
      obj[key] = row[i];
    });
    return obj;
  });
}

function findColumn(headers, target) {
  const t = target.toLowerCase().replace(/[^a-z]/g, '');
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toString().toLowerCase().replace(/[^a-z]/g, '');
    if (h === t) return i + 1;
  }
  return 0;
}

function finishWalkInSheet(ss, groupId, dogIds, endTime, durationMinutes) {
  const groupSheet = ss.getSheetByName(SHEETS.GROUPS);
  const groupRow = findRowIndexById(groupSheet, groupId);
  
  if (groupRow) {
    const headers = groupSheet.getRange(1, 1, 1, groupSheet.getLastColumn()).getValues()[0];
    const statusCol = findColumn(headers, 'status');
    const endCol = findColumn(headers, 'endtime');
    const durCol = findColumn(headers, 'durationminutes');
    
    if (statusCol > 0) groupSheet.getRange(groupRow, statusCol).setValue('completed');
    if (endCol > 0) groupSheet.getRange(groupRow, endCol).setValue(endTime);
    if (durCol > 0) groupSheet.getRange(groupRow, durCol).setValue(durationMinutes);
  }

  const dogSheet = ss.getSheetByName(SHEETS.DOGS);
  if (!dogSheet) return;
  const dogData = dogSheet.getDataRange().getValues();
  const dogHeaders = dogData[0];
  const idCol = findColumn(dogHeaders, 'id');
  const walksCol = findColumn(dogHeaders, 'walkstoday');
  const lastTimeCol = findColumn(dogHeaders, 'lastwalktime');
  const gIdCol = findColumn(dogHeaders, 'groupid');

  if (idCol === 0) return;
  
  const idsToUpdate = Array.isArray(dogIds) ? dogIds : String(dogIds).split(',').map(s => s.trim());
  
  idsToUpdate.forEach(id => {
    const targetId = String(id).trim();
    if (!targetId) return;
    for (let i = 1; i < dogData.length; i++) {
      if (dataToString(dogData[i][idCol-1]) === targetId) {
        if (walksCol > 0) {
          const cur = Number(dogData[i][walksCol-1]) || 0;
          dogSheet.getRange(i+1, walksCol).setValue(cur + 1);
        }
        if (lastTimeCol > 0) dogSheet.getRange(i+1, lastTimeCol).setValue(endTime);
        if (gIdCol > 0) dogSheet.getRange(i+1, gIdCol).setValue("");
        break;
      }
    }
  });

  if (gIdCol > 0) {
    const targetGroupId = String(groupId).trim();
    for (let i = 1; i < dogData.length; i++) {
      if (dataToString(dogData[i][gIdCol-1]) === targetGroupId) {
        dogSheet.getRange(i+1, gIdCol).setValue("");
      }
    }
  }
}

function findRowIndexById(sheet, id) {
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return null;
  const idCol = findColumn(data[0], 'id');
  if (idCol === 0) return null;
  const targetId = String(id).trim();
  for (let i = 1; i < data.length; i++) {
    if (dataToString(data[i][idCol-1]) === targetId) return i + 1;
  }
  return null;
}

function updateRow(ss, sheetName, id, updates) {
  const sheet = ss.getSheetByName(sheetName);
  const rowIndex = findRowIndexById(sheet, id);
  if (!rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let key in updates) {
    const colIndex = findColumn(headers, key);
    if (colIndex > 0) {
      let val = updates[key];
      // Используем ПРОБЕЛ для объединения массивов (pairs/conflicts)
      if (Array.isArray(val)) val = val.join(' ');
      sheet.getRange(rowIndex, colIndex).setValue(val);
    }
  }
}

function deleteGroupAndClearDogs(ss, groupId) {
  const targetId = String(groupId).trim();
  const dogSheet = ss.getSheetByName(SHEETS.DOGS);
  if (dogSheet) {
    const data = dogSheet.getDataRange().getValues();
    const gIdCol = findColumn(data[0], 'groupid');
    if (gIdCol > 0) {
      for (let i = 1; i < data.length; i++) {
        if (dataToString(data[i][gIdCol - 1]) === targetId) {
          dogSheet.getRange(i + 1, gIdCol).setValue("");
        }
      }
    }
  }
  const groupSheet = ss.getSheetByName(SHEETS.GROUPS);
  const rowIndex = findRowIndexById(groupSheet, targetId);
  if (rowIndex) {
    const headers = groupSheet.getRange(1, 1, 1, groupSheet.getLastColumn()).getValues()[0];
    const statusCol = findColumn(headers, 'status');
    if (statusCol > 0) groupSheet.getRange(rowIndex, statusCol).setValue('deleted');
    else groupSheet.deleteRow(rowIndex);
  }
}

function readSheetSettings(ss) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  if (range.getNumRows() < 1) return [];
  const data = range.getValues();
  return data.map(row => ({ key: row[0], value: row[1] }));
}

function appendRow(ss, sheetName, dataObj) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const map = {
    'id': 'id', 'name': 'name', 'age': 'age', 'weight': 'weight', 'row': 'row',
    'notes': 'notes', 'health': 'health', 'complexity': 'complexity', 
    'pairs': 'pairs', 'conflicts': 'conflicts', 'teamid': 'teamId', 
    'walkstoday': 'walksToday', 'lastwalktime': 'lastWalkTime', 
    'groupid': 'groupId', 'ishidden': 'isHidden', 'status': 'status',
    'volunteername': 'volunteerName', 'volunteerid': 'volunteerId',
    'starttime': 'startTime', 'endtime': 'endTime', 'durationminutes': 'durationMinutes',
    'telegramid': 'telegramId', 'telegramusername': 'telegramUsername', 'role': 'role',
    'experience': 'experience', 'lastlogin': 'lastLogin'
  };

  const newRow = headers.map(h => {
    const norm = h.toString().trim().toLowerCase().replace(/[^a-z]/g, '');
    const key = map[norm] || norm;
    let val = dataObj[key] !== undefined ? dataObj[key] : (dataObj[norm] !== undefined ? dataObj[norm] : "");
    // Используем ПРОБЕЛ для объединения массивов
    if (Array.isArray(val)) val = val.join(' ');
    return val;
  });
  sheet.appendRow(newRow);
}

function cleanupOldGroups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.GROUPS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  const ttlCol = findColumn(data[0], 'ttl');
  const statusCol = findColumn(data[0], 'status');
  const now = new Date().getTime();
  for (let i = data.length - 1; i >= 1; i--) {
    let shouldDelete = false;
    if (ttlCol > 0) {
      const val = data[i][ttlCol-1];
      if (val && new Date(val).getTime() < now) shouldDelete = true;
    }
    if (!shouldDelete && statusCol > 0) {
      const s = String(data[i][statusCol-1]).toLowerCase();
      if (s === 'deleted' || s === 'completed') shouldDelete = true;
    }
    if (shouldDelete) sheet.deleteRow(i + 1);
  }
}

function resetWalksInSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dogSheet = ss.getSheetByName(SHEETS.DOGS);
  if (dogSheet) {
    const lastRow = dogSheet.getLastRow();
    if (lastRow >= 2) {
      const headers = dogSheet.getRange(1, 1, 1, dogSheet.getLastColumn()).getValues()[0];
      const walksCol = findColumn(headers, 'walkstoday');
      const timeCol = findColumn(headers, 'lastwalktime');
      const groupCol = findColumn(headers, 'groupid');
      if (walksCol > 0) dogSheet.getRange(2, walksCol, lastRow - 1, 1).setValue(0);
      if (timeCol > 0) dogSheet.getRange(2, timeCol, lastRow - 1, 1).setValue("");
      if (groupCol > 0) dogSheet.getRange(2, groupCol, lastRow - 1, 1).setValue("");
    }
  }
  const groupSheet = ss.getSheetByName(SHEETS.GROUPS);
  if (groupSheet) {
    const lastRow = groupSheet.getLastRow();
    if (lastRow >= 2) groupSheet.deleteRows(2, lastRow - 1);
  }
}

function upsertSetting(ss, key, value) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() == key) { foundRow = i + 1; break; }
  }
  if (foundRow !== -1) sheet.getRange(foundRow, 2).setValue(value);
  else sheet.appendRow([key, value]);
}

function getTeamIdByGroupId(ss, groupId) {
  const sheet = ss.getSheetByName(SHEETS.GROUPS);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const idCol = findColumn(data[0], 'id');
  const teamCol = findColumn(data[0], 'teamid');
  if (!idCol || !teamCol) return null;
  for (let i = 1; i < data.length; i++) {
    if (dataToString(data[i][idCol-1]) === String(groupId)) return data[i][teamCol-1];
  }
  return null;
}

function getTeamIdByDogId(ss, dogId) {
  const sheet = ss.getSheetByName(SHEETS.DOGS);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const idCol = findColumn(data[0], 'id');
  const teamCol = findColumn(data[0], 'teamid');
  if (!idCol || !teamCol) return null;
  for (let i = 1; i < data.length; i++) {
    if (dataToString(data[i][idCol-1]) === String(dogId)) return data[i][teamCol-1];
  }
  return null;
}

function dataToString(cell) {
  return cell === null || cell === undefined ? "" : String(cell).trim();
}

function incrementDbVersion(ss, teamId) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const key = "db_version_" + teamId;
  let foundRow = -1;
  let cur = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === key) {
      foundRow = i + 1;
      cur = parseInt(data[i][1]) || 0;
      break;
    }
  }
  if (foundRow !== -1) sheet.getRange(foundRow, 2).setValue(cur + 1);
  else sheet.appendRow([key, 1]);
}
