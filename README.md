# docker-autodeploy
Auto deploy a container from a hook


## Usage

### With Traefik

```
docker service create \
    --name autodeploy \
    --constraint=node.role==manager \
    --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    --mount type=bind,source=/.docker,target=/.docker \
    --network traefik-net \
    --env SLACK_HOOK=http://... \
    --env SECRET= \
    --label traefik.port=8080 \
    --label traefik.docker.network=traefik-net \
    firstandthird/docker-autodeploy:3.4.0"
```

