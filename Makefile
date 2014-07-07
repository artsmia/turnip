all: rsync

rsync:
	jekyll build
	rsync -avh --progress _site/ new:/var/www/audio-tours/
	rsync -avz --exclude "*.zip" --exclude "*.aif" --exclude "*.wav" _files/ dx:/apps/cdn/audio-tours
