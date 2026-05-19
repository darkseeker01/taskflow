FROM node:18-alpine
WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
You pushed to us-east-1. What breaks if ECS runs in a different region?