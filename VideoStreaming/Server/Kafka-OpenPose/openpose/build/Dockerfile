FROM nvidia/cuda:11.5.1-cudnn8-devel-ubuntu20.04 AS builder

RUN apt-get update \
    && env DEBIAN_FRONTEND=noninteractive apt-get upgrade -y \
    && env DEBIAN_FRONTEND=noninteractive apt-get install -y \
        build-essential \
        cmake \
        git \
        vim \
        wget \
        sudo \
        lsb-release \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ARG OPENPOSE_REPOSITORY_URL=https://github.com/CMU-Perceptual-Computing-Lab/openpose.git
ARG OPENPOSE_VERSION=v1.7.0

RUN cd /opt \
  && git clone ${OPENPOSE_REPOSITORY_URL} -b ${OPENPOSE_VERSION} --depth 1 \
  && cd openpose \
  && git submodule update --init --recursive --remote \
  && apt-get update \
  && env DEBIAN_FRONTEND=noninteractive apt-get install -y \
      libopencv-dev=4.2.* \
      python3.8-dev=3.8.* \
  && env DEBIAN_FRONTEND=noninteractive bash scripts/ubuntu/install_deps.sh \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN cd /opt/openpose \
 && mkdir -p build \
 && cd build \
 && cmake -DBUILD_PYTHON=ON -DPYTHON_EXECUTABLE=/usr/bin/python3.8 -DPYTHON_LIBRARY=/usr/lib/x86_64-linux-gnu/libpython3.8.so .. \
 && make -j"$(nproc)" \
 && cd python \
 && make install

##########################################################################

FROM nvidia/cuda:11.5.1-cudnn8-runtime-ubuntu20.04

COPY --from=builder /opt/openpose /opt/openpose
COPY --from=builder /usr/local/python /usr/local/python

RUN apt-get update \
    && env DEBIAN_FRONTEND=noninteractive apt-get upgrade -y \
    && env DEBIAN_FRONTEND=noninteractive apt-get install -y \
        vim \
        sudo \
        lsb-release \
        libopencv-dev=4.2.* \
        python3.8-dev=3.8.* \
  && cd /opt/openpose \
  && env DEBIAN_FRONTEND=noninteractive bash scripts/ubuntu/install_deps.sh \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH /usr/local/python

RUN mkdir -p /srv/openpose

WORKDIR /srv/openpose

COPY ./scripts/* /srv/openpose/

RUN  pip install --no-cache-dir -r requirements.txt


CMD ["./ss-openpose.py"]

