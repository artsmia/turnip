require 'rubygems'
require 'bundler/setup' 
require 'yaml'
require 'pp'
require 'mp3info'
require 'pry'
require 'json'
# json = JSON.yaml_as(yaml)

class Stop
  def initialize(yaml)
    @yaml = yaml
  end

  def name; @yaml['name']; end
  def speaker; @yaml['speaker']; end

  def tag!(opts={})
    Mp3Info.open(File.expand_path("./" + file)) do |mp3|
      mp3.tag.title = (opts[:prefix] && opts[:prefix] + ' – ' || '') + name
      mp3.tag.artist = speaker
    end
  end

  def colors
    @yaml['colors'] || []
  end

  # private

  def file
    'AudaciousEye_AudioFiles/MP3/%s.mp3' % @yaml['file'].to_s
  end
end

yaml = YAML.load(File.read('stops.yaml'))

if ARGV[0] == 'tag'
  yaml['stops'].each do |stop|
    stop = Stop.new(stop)
    stop.tag!
    stop.colors.each do |color, info|
      Stop.new(info).tag!(prefix: stop.name)
    end
  end
else
  puts JSON.yaml_as(yaml)
end
