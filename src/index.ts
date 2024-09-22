import { openDb, createTable, fetchHistoricalData, insertOrReplaceData } from './binanceData';

// Função principal para realizar o processo e chamar as funções do banco de dados e captura de dados históricos
async function main() {
    try {
        const db = await openDb();

        // Configurações de exemplo
        const symbol = 'SOLUSDT';  // Moeda escolhida
        const interval = '1m';     // Intervalo dos dados (1 minuto, 5 minutos, etc)
        const startTime = Date.parse('2023-10-01T00:00:00Z');  // Data inicial
        const endTime = Date.parse('2024-01-01T00:00:00Z');    // Data final

        // Criação da tabela, se necessário
        await createTable(db, symbol, interval);

        // Captura dos dados históricos da Binance
        const historicalData = await fetchHistoricalData(symbol, interval, startTime, endTime);

        // Inserir ou substituir os dados capturados no banco de dados
        await insertOrReplaceData(db, symbol, interval, historicalData);

        console.log(`Dados para ${symbol} no intervalo ${interval} inseridos ou substituídos com sucesso.`);

    } catch (error) {
        console.error('Erro ao executar o script:', error);
    }
}

// Chamar a função principal para executar o fluxo completo
main();
