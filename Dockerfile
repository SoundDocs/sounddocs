FROM debian:bookworm-slim

RUN mkdir -p /app

WORKDIR /app

RUN apt-get update
COPY scripts/add_docker_apt_repository ./scripts/add_docker_apt_repository
RUN scripts/add_docker_apt_repository
RUN apt-get update
COPY scripts/install_docker ./scripts/install_docker
RUN scripts/install_docker

COPY scripts/docker_entrypoint ./scripts/docker_entrypoint
ENTRYPOINT ["./scripts/docker_entrypoint"]

COPY .node-version .node-version
COPY scripts/bootstrap_nodejs scripts/bootstrap_nodejs
RUN scripts/bootstrap_nodejs

COPY . ./

RUN npm ci
