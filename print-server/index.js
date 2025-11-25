const express = require('express');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração da impressora
const getPrinter = () => {
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: process.env.PRINTER_INTERFACE || 'tcp://192.168.1.100',
        characterSet: 'BRAZIL',
        removeSpecialCharacters: false,
        lineCharacter: "=",
        options: {
            timeout: 5000
        }
    });

    return printer;
};

// Rota de teste
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        printer: process.env.PRINTER_INTERFACE,
        timestamp: new Date().toISOString()
    });
});

// Rota de teste de impressão
app.post('/test-print', async (req, res) => {
    try {
        const printer = getPrinter();

        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println('TESTE DE IMPRESSÃO');
        printer.bold(false);
        printer.drawLine();
        printer.println('Store Lamayer');
        printer.println('Impressora configurada com sucesso!');
        printer.drawLine();
        printer.println(new Date().toLocaleString('pt-BR'));
        printer.cut();

        await printer.execute();

        res.json({
            success: true,
            message: 'Teste de impressão enviado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao imprimir teste:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota principal de impressão de pedidos
app.post('/print', async (req, res) => {
    try {
        const { orderData } = req.body;

        if (!orderData) {
            return res.status(400).json({
                success: false,
                error: 'Dados do pedido não fornecidos'
            });
        }

        const printer = getPrinter();

        // Cabeçalho
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println('STORE LAMAYER');
        printer.bold(false);
        printer.setTextSize(0, 0);
        printer.println('Especiarias e Temperos');
        printer.drawLine();
        printer.newLine();

        // Informações do pedido
        printer.alignLeft();
        printer.bold(true);
        printer.println(`Pedido: ${orderData.orderNumber}`);
        printer.bold(false);
        printer.println(`Data: ${new Date(orderData.createdAt || Date.now()).toLocaleString('pt-BR')}`);

        if (orderData.customerName) {
            printer.println(`Cliente: ${orderData.customerName}`);
        }
        if (orderData.customerPhone) {
            printer.println(`Tel: ${orderData.customerPhone}`);
        }

        printer.drawLine();
        printer.newLine();

        // Itens do pedido
        if (orderData.items && orderData.items.length > 0) {
            orderData.items.forEach((item, index) => {
                // Nome do produto e quantidade
                printer.bold(true);
                printer.println(`${item.quantity}x ${item.productName}`);
                printer.bold(false);

                // Preços unitários
                printer.println(`   R$ ${item.unitPriceBRL.toFixed(2)} | G$ ${Math.round(item.unitPricePYG).toLocaleString('es-PY')}/un`);

                // Subtotal
                printer.println(`   Subtotal: R$ ${item.subtotalBRL.toFixed(2)}`);

                if (index < orderData.items.length - 1) {
                    printer.newLine();
                }
            });
        }

        printer.newLine();
        printer.drawLine();
        printer.newLine();

        // Totais
        printer.bold(true);
        printer.setTextSize(0, 1);
        printer.println(`TOTAL BRL:  R$ ${orderData.totalBRL.toFixed(2)}`);
        printer.println(`TOTAL PYG: G$ ${Math.round(orderData.totalPYG).toLocaleString('es-PY')}`);
        printer.setTextSize(0, 0);
        printer.bold(false);

        printer.newLine();
        printer.println(`Taxa: G$ ${orderData.exchangeRate.toFixed(2)} = R$ 1,00`);

        printer.newLine();
        printer.drawLine();
        printer.newLine();

        // Rodapé
        printer.alignCenter();
        printer.println('Obrigado pela preferencia!');
        printer.newLine();

        // Corte
        printer.cut();

        // Executar impressão
        await printer.execute();

        console.log(`✓ Pedido ${orderData.orderNumber} impresso com sucesso`);

        res.json({
            success: true,
            message: `Pedido ${orderData.orderNumber} impresso com sucesso`
        });

    } catch (error) {
        console.error('Erro ao imprimir pedido:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🖨️  Print Server rodando na porta ${PORT}`);
    console.log(`📡 Interface da impressora: ${process.env.PRINTER_INTERFACE}`);
    console.log(`🌐 Teste: http://localhost:${PORT}/health`);
});
