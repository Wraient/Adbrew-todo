# set base image (host OS)
FROM python:3.8

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get -y update
# build-essential: several pinned requirements (uWSGI, argon2-cffi, ...) have no
# manylinux wheel and are compiled from source during `pip install`.
RUN apt-get install -y curl nano wget nginx git build-essential


# Mongo
RUN ln -s /bin/echo /bin/systemctl
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
RUN apt-get -y update
RUN apt-get install -y mongodb-org

# Install Node + Yarn
# Pinned to Node 16, the newest release create-react-app 4 supports. Debian's
# own nodejs package is 18.x, which breaks this toolchain twice over:
#   * webpack 4 hashes with md4, dropped from OpenSSL 3 (Node 17+)
#   * postcss 8.1.x exports subpaths via the trailing-slash form ("./": "./"),
#     which Node 17 removed, so postcss-safe-parser can no longer resolve
#     `postcss/lib/tokenize`
# Installing Node from the official tarball also pins the major, which apt
# cannot do -- it would otherwise pick the higher versioned Debian build.
RUN curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors \
        https://nodejs.org/dist/v16.20.2/node-v16.20.2-linux-x64.tar.gz \
        -o /tmp/node.tar.gz \
 && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
 && rm /tmp/node.tar.gz
RUN npm install -g yarn
RUN node --version && yarn --version

# Install PIP
# (removed) `RUN easy_install pip` -- easy_install was removed from setuptools and
# is absent from python:3.8. The base image already ships pip, so this no-ops.


ENV ENV_TYPE staging
ENV MONGO_HOST mongo
ENV MONGO_PORT 27017
##########

ENV PYTHONPATH=$PYTHONPATH:/src/

# copy the dependencies file to the working directory
COPY src/requirements.txt .

# install dependencies
RUN pip install -r requirements.txt
