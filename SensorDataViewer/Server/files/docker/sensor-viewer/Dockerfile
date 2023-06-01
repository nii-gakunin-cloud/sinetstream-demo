FROM node:18.16.0 AS builder

WORKDIR /home/node
COPY . ./
RUN npm install && \
    npm run build

FROM nginx:1.25.0

COPY --from=builder /home/node/dist /var/www/html/
