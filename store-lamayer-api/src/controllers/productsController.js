const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

exports.createProduct = async (req, res) => {
    const { name, quantity, buyPrice, sellPrice } = req.body;
    try {
        const product = await prisma.product.create({
            data: {
                name,
                quantity: parseInt(quantity),
                buyPrice: parseFloat(buyPrice),
                sellPrice: parseFloat(sellPrice)
            }
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, quantity, buyPrice, sellPrice } = req.body;
    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                quantity: parseInt(quantity),
                buyPrice: parseFloat(buyPrice),
                sellPrice: parseFloat(sellPrice)
            }
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
};
