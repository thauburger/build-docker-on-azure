# consul-load-balancer
# nginx load-balancer for HTTP requests
# uses consul-template, which listens for consul service changes
# and updates nginx config dynamically

FROM nginx:1.9.0

RUN apt-get update -qq
RUN apt-get -y install curl runit

ENV CONSUL_TEMPLATE https://github.com/hashicorp/consul-template/releases/download/v0.9.0/consul-template_0.9.0_linux_amd64.tar.gz
RUN curl -L $CONSUL_TEMPLATE | tar -C /usr/local/bin --strip-components 1 -zxf -

ADD nginx.service /etc/service/nginx/run
ADD consul-template.service /etc/service/consul-template/run

RUN chmod +x /etc/service/nginx/run
RUN chmod +x /etc/service/consul-template/run

RUN rm -v /etc/nginx/conf.d/*
ADD nginx.conf-template /etc/consul-templates/nginx.conf-template

CMD ["/usr/bin/runsvdir", "/etc/service"]
