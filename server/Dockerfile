# Used by Coolify (base directory: /server). The database lives in /data,
# which must be a Coolify "Persistent Storage" volume so scores survive redeploys.
FROM node:24-alpine
WORKDIR /app
COPY server.js ./
ENV PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.js"]
