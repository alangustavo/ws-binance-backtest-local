import WebSocket from 'ws';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Função para abrir conexão com o banco de dados SQLite
async function openDb() {
    return open({
        filename: './data/cryptoData.db',
        driver: sqlite3.Database
    });
}

// Função para buscar os dados históricos no banco de dados
async function getHistoricalData(symbol: string, interval: string, startTime: number, endTime: number) {
    const db = await openDb();
    const query = `
    SELECT * FROM historical_data
    WHERE symbol = ? AND interval = ? AND timestamp >= ? AND timestamp <= ?
    ORDER BY timestamp ASC
  `;
    return db.all(query, [symbol, interval, startTime, endTime]);
}

// Função para iniciar o WebSocket Server
export function startWebSocketServer(symbol: string, interval: string, timeInterval: number, startTime: number, endTime: number) {
    const wss = new WebSocket.Server({ port: 8080 });

    wss.on('connection', async (ws) => {
        console.log('Client connected');

        // Obter dados históricos do banco de dados
        const historicalData = await getHistoricalData(symbol, interval, startTime, endTime);

        // Enviar os dados ao cliente com o intervalo definido
        let index = 0;
        const intervalId = setInterval(() => {
            if (index < historicalData.length) {
                const data = historicalData[index];
                ws.send(JSON.stringify(data));
                index++;
            } else {
                clearInterval(intervalId);
                ws.close();
            }
        }, timeInterval * 1000);

        ws.on('close', () => {
            console.log('Client disconnected');
            clearInterval(intervalId);
        });
    });

    console.log(`WebSocket server started on port 8080 for ${symbol} (${interval})`);
}
