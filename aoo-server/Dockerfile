FROM debian:stable-slim
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y build-essential cmake git
CMD ["./build.sh"]