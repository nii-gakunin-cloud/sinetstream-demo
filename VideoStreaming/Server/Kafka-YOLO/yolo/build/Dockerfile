FROM nvcr.io/nvidia/pytorch:23.05-py3

WORKDIR /srv/yolo

COPY scripts /srv/yolo

RUN pip3.10 install --no-cache-dir -r requirements.txt

COPY entrypoint.d /opt/nvidia/entrypoint.d

CMD ["/srv/yolo/realtime_demo_yolov5.py"]
