.PHONY: up
up:
    docker-compose up -d

.PHONY: build
build:
    docker-compose build

.PHONY: down
down:
    docker-compose down

.PHONY: logs
logs:
    docker-compose logs -f

.PHONY: restart
restart:
    docker-compose restart

.PHONY: start
start: build up logs