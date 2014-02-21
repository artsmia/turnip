all: rsync

rsync:
	jekyll build
	cd _site; ln -s . matisse-tour; cd ..
	rsync -avh --progress _site/ new:/var/www/audio-tours/
