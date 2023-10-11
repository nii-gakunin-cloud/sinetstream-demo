FROM python:3.10.13-slim

COPY requirements.txt /srv/
RUN pip install --no-cache-dir -r /srv/requirements.txt

COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

WORKDIR /srv/
COPY scripts /srv/
CMD ["/srv/generator.py"]
