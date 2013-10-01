all: rsync s3

rsync:
	rsync -avz * new:/var/www/audio-tours/ --exclude=".*" --exclude="audacious-eye-tour"

s3:
	s3cmd put --recursive *.html *.css *.js *.svg bower_components s3://audio-tours/audacious-eye/
	s3cmd setacl --acl-public --recursive s3://audio-tours/audacious-eye
