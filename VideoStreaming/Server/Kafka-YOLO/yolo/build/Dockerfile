FROM nvcr.io/nvidia/pytorch:22.06-py3

WORKDIR /srv/yolo

COPY scripts /srv/yolo

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.d /opt/nvidia/entrypoint.d

CMD ["/srv/yolo/realtime_demo_yolov5.py"]
