# Dockerfile - sms
# A node express server to handle incoming messages.

FROM node

#Install node dependencies
ADD package.json /var/www/
WORKDIR /var/www/
RUN npm install

#Add web server
ADD server-sms.js /var/www/
RUN ls -l /var/www

#Launch web server when container starts
ENTRYPOINT ["node", "/var/www/server-sms.js"]