FROM harbor.vcloud.nii.ac.jp/sinetstream/raspios:bullseye

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      python3-picamera2 \
      python3-pip \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/ss-camera
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
COPY ./scripts/*.py /opt/ss-camera
CMD ["/opt/ss-camera/ss-camera.py"]
