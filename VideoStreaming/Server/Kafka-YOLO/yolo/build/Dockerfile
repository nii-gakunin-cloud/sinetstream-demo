FROM nvcr.io/nvidia/pytorch:22.03-py3

RUN apt-get update \
  && env DEBIAN_FRONTEND=noninteractive apt-get install -y libopencv-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
      seaborn \
      opencv-python \
      sinetstream-kafka \
 && pip install --no-cache-dir --force-reinstall Pillow \
 && mkdir -p /srv/yolo

WORKDIR /srv/yolo

COPY entrypoint.d /opt/nvidia/entrypoint.d
COPY scripts /srv/yolo

CMD ["/srv/yolo/realtime_demo_yolov5.py"]
