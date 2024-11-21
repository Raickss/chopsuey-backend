const { readdirSync, statSync } = require('fs');
const { join } = require('path');

// Función recursiva para buscar archivos con una extensión específica
function findEntities(directory, extension) {
    const files = [];
    const items = readdirSync(directory);

    for (const item of items) {
        const fullPath = join(directory, item);
        if (statSync(fullPath).isDirectory()) {
            files.push(...findEntities(fullPath, extension)); // Busca recursivamente en subdirectorios
        } else if (fullPath.endsWith(extension)) {
            files.push(fullPath); // Agrega el archivo si tiene la extensión deseada
        }
    }

    return files;
}

// Ruta base donde buscarás las entidades
const entityPath = join(__dirname, 'dist/modules'); // Cambia la ruta según tu entorno
console.log('Verificando entidades en:', entityPath);

try {
    const entityFiles = findEntities(entityPath, '.entity.js'); // Busca archivos con extensión .entity.js
    console.log('Entidades encontradas:', entityFiles);
} catch (error) {
    console.error('Error al verificar las rutas:', error.message);
}

console.log('Ruta de entidades:', __dirname + '/../../../../modules/**/*.entity.js');
