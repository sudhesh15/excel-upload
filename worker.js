const xlsx = require('xlsx');

const { workerData, parentPort } = require('worker_threads');

const workbook = xlsx.readFile(workerData);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

parentPort.postMessage(data);