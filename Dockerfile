FROM nginx
COPY ./build/ /var/www/html
COPY ./nginx_config/nginx /etc/nginx/conf.d
