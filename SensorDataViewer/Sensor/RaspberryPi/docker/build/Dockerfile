FROM debian:12.7

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN apt-get update \
     && apt-get install -y --no-install-recommends \
          ca-certificates \
          curl \
          gnupg2 \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/* \
     && curl -fsSL http://archive.raspberrypi.org/debian/raspberrypi.gpg.key | gpg --dearmor -o /etc/apt/keyrings/raspi.gpg \
     && echo "deb [signed-by=/etc/apt/keyrings/raspi.gpg] http://archive.raspberrypi.com/debian/ $(sh -c '. /etc/os-release; echo ${VERSION_CODENAME}') main" > /etc/apt/sources.list.d/raspi.list

RUN apt-get update \
     && apt-get install -y --no-install-recommends \
          python3-picamera2 \
          python3-pip \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/ss-camera
COPY requirements.txt .

ARG TARGETPLATFORM
RUN [ "$TARGETPLATFORM" != "linux/arm/v7" ] || \
     ( apt-get update \
     && apt-get install -y --no-install-recommends \
          python3-dev \
          gcc \
          libffi-dev \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/* )
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
COPY ./scripts/*.py /opt/ss-camera
CMD ["/opt/ss-camera/ss-camera.py"]
