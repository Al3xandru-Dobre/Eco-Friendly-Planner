# Folosește o imagine Node.js LTS (Long Term Support) ca bază
# Alpine este o versiune mai mică, bună pentru producție
FROM node:18-alpine
# Sau FROM node:20-alpine dacă preferi o versiune mai nouă

# Setează directorul de lucru în container
WORKDIR /usr/src/app

# Copiază package.json și package-lock.json (sau yarn.lock)
# * este folosit pentru a include și package-lock.json dacă există
COPY package*.json ./

# Instalează dependințele proiectului
# Pentru producție, ai putea folosi 'npm ci --only=production'
RUN npm install

# Copiază restul codului sursă al aplicației în directorul de lucru
COPY . .

# Expune portul pe care aplicația Node.js va rula în container
EXPOSE 4000
# Asigură-te că process.env.PORT din server.js este 4000 sau este preluat din .env

# Comanda pentru a porni aplicația când containerul pornește
# 'npm run dev' folosește nodemon, bun pentru dezvoltare
# Pentru producție, ar fi 'npm start' care rulează 'node src/server.js'
CMD [ "npm", "run", "dev" ]