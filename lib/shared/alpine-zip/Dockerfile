FROM public.ecr.aws/docker/library/alpine:3.19 as builder
RUN apk add --no-cache zip

FROM public.ecr.aws/docker/library/alpine:3.19
COPY --from=builder /usr/bin/zip /usr/bin/zip
RUN adduser -D default && \
    rm -rf /var/cache/apk/* /tmp/*
USER default