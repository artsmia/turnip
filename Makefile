all: rsync

rsync:
	jekyll build
	rsync -avh --progress _site/ new:/var/www/audio-tours/
	rsync -avz --exclude "*.zip" --exclude "*.aif" --exclude "*.wav" _files/ dx:/apps/cdn/audio-tours

logs:
	@echo syncing dx logs
	@rsync -avh --progress dx:/var/log/nginx/ logs > /dev/null

stats: logs
	ag audio logs | sed -n 's|.* /audio-tours/\(.*\).mp3 .*|\1|p' | sort | uniq -c

.PHONY: rsync logs stats
