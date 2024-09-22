import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import axios from 'axios';
import path from 'path';

// Função para abrir ou criar o banco de dados SQLite
export async function openDb() {
    const db = await open({
        filename: path.resolve(__dirname, 'crypto_data.db'),
        driver: sqlite3.Database
    });
    return db;
}

// Função para criar uma tabela com base no símbolo e no intervalo
export async function createTable(db: any, symbol: string, interval: string) {
    const tableName = `${symbol}_${interval}`;
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      timestamp INTEGER PRIMARY KEY,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      volume REAL
    );
  `;
    await db.exec(createTableQuery);
}

// Função para contar registros no banco de dados
export async function countRecordsInRange(db: any, symbol: string, interval: string, startTime: number, endTime: number) {
    const tableName = `${symbol}_${interval}`;
    const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE timestamp >= ? AND timestamp <= ?`;
    const result = await db.get(query, [startTime, endTime]);
    return result.count;
}

// Função para buscar o primeiro e o último timestamp no banco de dados
export async function fetchBoundaryTimestamps(db: any, symbol: string, interval: string) {
    const tableName = `${symbol}_${interval}`;
    const queryFirst = `SELECT MIN(timestamp) AS min FROM ${tableName}`;
    const queryLast = `SELECT MAX(timestamp) AS max FROM ${tableName}`;

    const minResult = await db.get(queryFirst);
    const maxResult = await db.get(queryLast);

    return {
        minTimestamp: minResult.min,
        maxTimestamp: maxResult.max
    };
}

// Função para calcular a quantidade de registros esperados
function calculateExpectedRecords(startTime: number, endTime: number, interval: number) {
    return Math.floor((endTime - startTime) / interval);
}

// Função para capturar dados históricos da Binance
export async function fetchHistoricalData(db: any, symbol: string, interval: string, startTime: number, endTime: number) {
    const intervalMapping: { [key: string]: number; } = {
        '1m': 60 * 1000,
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        // Adicione outros intervalos conforme necessário
    };

    const intervalMs = intervalMapping[interval];

    // Checa se existem registros suficientes
    const recordCount = await countRecordsInRange(db, symbol, interval, startTime, endTime);
    const expectedRecords = calculateExpectedRecords(startTime, endTime, intervalMs);

    if (recordCount >= expectedRecords) {
        console.log(`Dados suficientes já existem para ${symbol} no intervalo ${startTime} a ${endTime}.`);
        return []; // Retorna um array vazio, pois não precisamos buscar mais dados
    }

    const allData: any[] = [];
    let currentStartTime = startTime;

    // Loop para buscar dados que faltam
    while (currentStartTime < endTime) {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${currentStartTime}&endTime=${endTime}&limit=1000`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.length === 0) {
            break; // Não há mais dados disponíveis
        }

        allData.push(...data);
        currentStartTime = data[data.length - 1][0] + 1; // Atualiza currentStartTime
    }

    return allData;
}

// Função para inserir ou substituir dados no banco de dados
export async function insertOrReplaceData(db: any, symbol: string, interval: string, data: any[]) {
    const tableName = `${symbol}_${interval}`;
    const insertOrReplaceQuery = `
    INSERT OR REPLACE INTO ${tableName} (timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?);
  `;

    for (const item of data) {
        const [timestamp, open, high, low, close, volume] = item;

        // Inserir ou substituir os dados com base no timestamp
        await db.run(insertOrReplaceQuery, [timestamp, open, high, low, close, volume]);
    }
}
