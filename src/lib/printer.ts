// Função para imprimir pedido na impressora térmica
export async function printOrder(orderData: any) {
    const printServerUrl = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'http://localhost:3001';

    try {
        const response = await fetch(`${printServerUrl}/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderData }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falha na impressão');
        }

        return { success: true, message: result.message };
    } catch (error: any) {
        console.error('Erro ao imprimir pedido:', error);
        return {
            success: false,
            error: error.message || 'Erro ao conectar com o servidor de impressão'
        };
    }
}

// Função para testar conexão com o print server
export async function testPrintServer() {
    const printServerUrl = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'http://localhost:3001';

    try {
        const response = await fetch(`${printServerUrl}/health`);
        const result = await response.json();

        return {
            success: true,
            online: result.status === 'ok',
            printer: result.printer
        };
    } catch (error) {
        return {
            success: false,
            online: false,
            error: 'Print server offline'
        };
    }
}

// Função para teste de impressão
export async function testPrint() {
    const printServerUrl = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || 'http://localhost:3001';

    try {
        const response = await fetch(`${printServerUrl}/test-print`, {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falha no teste');
        }

        return { success: true, message: result.message };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
