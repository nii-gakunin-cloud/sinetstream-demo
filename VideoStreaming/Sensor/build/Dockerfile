FROM harbor.vcloud.nii.ac.jp/sinetstream/raspios:buster

RUN apt-get update \
      && apt-get install -y --no-install-recommends \
      python3-pip \
      libraspberrypi0 \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir \
      picamera \
      setuptools \
      sinetstream-kafka \
      sinetstream-mqtt \
      schedule \
      && mkdir -p /opt/ss-camera

COPY ./scripts/ /opt/ss-camera

RUN pip3 install --no-cache-dir "requests[socks]"

WORKDIR /opt/ss-camera

CMD ["/opt/ss-camera/ss-camera.py"]