.PHONY: dist build
install:
	@npm install

dev: install
	@npm run dev

build:
	@npm run build && \
	git checkout gh-pages && \
	cp dist/* . && \
	rm -rf dist && \
	git add . && \
	git commit -m "build" && \
	git push origin gh-pages
