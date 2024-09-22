import { fetchAndStoreData } from './binanceData';
import { startWebSocketServer } from './websocketServer';

// Parâmetros de exemplo
const symbol = 'SOLUSDT';
const interval = '1m';  // Pode ser '1m', '5m', '15m', etc.
const startTime = new Date('2023-01-01').getTime();  // Data de início
const endTime = new Date('2023-01-02').getTime();    // Data de fim
const timeInterval = 1;  // Enviar dados a cada 1 segundo

// Função principal
async function main() {
    // Captura os dados históricos e armazena no banco de dados
    await fetchAndStoreData(symbol, interval, startTime, endTime);

    // Inicia o servidor WebSocket
    startWebSocketServer(symbol, interval, timeInterval, startTime, endTime);
}

main();
