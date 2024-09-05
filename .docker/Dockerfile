ARG NGINX_IMAGE

FROM ${NGINX_IMAGE}

COPY .docker/nginx/default.conf etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

ARG DIST_DIR
ENV DIST_DIR=$DIST_DIR
COPY $DIST_DIR .

COPY documentation documentation
