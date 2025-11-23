import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Store Lamayer - Gestão de Estoque',
        short_name: 'Store Lamayer',
        description: 'Sistema de gestão de estoque e fornecedores para Store Lamayer',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#16a34a', // green-600
        icons: [
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
