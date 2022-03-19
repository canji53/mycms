FROM node:14.18.1-stretch as builder
WORKDIR /app
COPY . /app/
RUN yarn \
    && yarn build \
    && yarn install:prod

FROM public.ecr.aws/lambda/nodejs:14 AS lambda
COPY --from=builder /app  ${LAMBDA_TASK_ROOT}
