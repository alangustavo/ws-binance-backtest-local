import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Função para abrir conexão com o banco de dados SQLite
async function openDb() {
    return open({
        filename: './data/cryptoData.db',
        driver: sqlite3.Database
    });
}

// Função para criar a tabela de dados históricos se não existir
async function createTable() {
    const db = await openDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS historical_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      interval TEXT,
      timestamp INTEGER,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      volume REAL
    )
  `);
}

// Função para salvar os dados históricos no banco de dados
async function saveHistoricalData(symbol: string, interval: string, data: any[]) {
    const db = await openDb();
    const insertQuery = `
    INSERT INTO historical_data (symbol, interval, timestamp, open, high, low, close, volume)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
    const stmt = await db.prepare(insertQuery);

    for (const entry of data) {
        await stmt.run(
            symbol,
            interval,
            entry[0], // timestamp
            entry[1], // open
            entry[2], // high
            entry[3], // low
            entry[4], // close
            entry[5]  // volume
        );
    }

    await stmt.finalize();
}

// Função para buscar dados históricos da API da Binance
async function fetchHistoricalData(symbol: string, interval: string, startTime: number, endTime: number) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`;
    const response = await axios.get(url);
    return response.data;
}

// Função principal para buscar e armazenar os dados históricos
export async function fetchAndStoreData(symbol: string, interval: string, startTime: number, endTime: number) {
    // Criar a tabela se não existir
    await createTable();

    // Buscar os dados históricos da Binance
    const historicalData = await fetchHistoricalData(symbol, interval, startTime, endTime);

    // Salvar os dados no banco de dados
    await saveHistoricalData(symbol, interval, historicalData);
}
