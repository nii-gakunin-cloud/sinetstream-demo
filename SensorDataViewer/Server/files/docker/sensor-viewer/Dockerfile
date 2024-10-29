FROM node:20.18.0 AS builder

WORKDIR /home/node
COPY . ./
RUN npm install && \
    npm run build

FROM nginx:1.27.2

COPY --from=builder /home/node/dist /var/www/html/
