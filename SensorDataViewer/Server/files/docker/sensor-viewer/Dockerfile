FROM node:18.18.0 AS builder

WORKDIR /home/node
COPY . ./
RUN npm install --legacy-peer-deps && \
    npm run build

FROM nginx:1.25.2

COPY --from=builder /home/node/dist /var/www/html/
