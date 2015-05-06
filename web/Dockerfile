# Dockerfile - web
# A node express server with Redis cache.
# Serves the web front-end for Azure News.

FROM node

#Install node dependencies
ADD package.json /var/www/
WORKDIR /var/www/
RUN npm install

#Add web server
ADD . /var/www/
RUN ls -l /var/www

#Launch web server when container starts
ENTRYPOINT ["node", "/var/www/server.js"]