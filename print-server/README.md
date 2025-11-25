# Print Server - Store Lamayer

Servidor de impressão térmica para pedidos.

## Instalação

```bash
cd print-server
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Configure o IP ou caminho da impressora:

### Impressora de Rede (Recomendado)
```
PRINTER_INTERFACE=tcp://192.168.1.100
```

### Impressora USB (Windows)
```
PRINTER_INTERFACE=\\\\localhost\\NOME_DA_IMPRESSORA
```

### Impressora USB (Linux)
```
PRINTER_INTERFACE=/dev/usb/lp0
```

## Uso

### Iniciar servidor
```bash
npm start
```

### Descobrir IP da impressora
```bash
# Windows
arp -a

# Linux
nmap -sn 192.168.1.0/24
```

### Testar impressão
```bash
curl -X POST http://localhost:3001/test-print
```

## API

### POST /print
Imprime um pedido.

**Body:**
```json
{
  "orderData": {
    "orderNumber": "ORD-20251125-0001",
    "customerName": "João",
    "customerPhone": "(11) 9999-9999",
    "totalBRL": 10.50,
    "totalPYG": 14175,
    "exchangeRate": 1350,
    "items": [
      {
        "productName": "Pimenta",
        "quantity": 2,
        "unitPriceBRL": 5.00,
        "unitPricePYG": 6750,
        "subtotalBRL": 10.00,
        "subtotalPYG": 13500
      }
    ]
  }
}
```

### GET /health
Verifica status do servidor.

## Troubleshooting

**Erro "ECONNREFUSED"**: Impressora offline ou IP incorreto
**Erro "EACCES"**: Sem permissão USB (Linux: `sudo usermod -a -G lp $USER`)
**Nada imprime**: Verificar se a impressora está em modo ESC/POS

## Manter rodando 24/7

### Com PM2 (Linux/Mac)
```bash
npm install -g pm2
pm2 start index.js --name print-server
pm2 save
pm2 startup
```

### Como Serviço Windows
Use `nssm` ou `node-windows`
