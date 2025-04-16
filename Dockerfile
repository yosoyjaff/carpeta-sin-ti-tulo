# Usa una imagen ligera de Node.js
FROM node:18-alpine

# Crea el directorio de la app
WORKDIR /app

# Copia los archivos de configuración
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el código fuente
COPY . .

# Expone el puerto de la API
EXPOSE 3441

# Comando para iniciar la aplicación
CMD ["npm", "start"]

