require 'rubygems'
require 'bundler/setup' 
require 'yaml'
require 'pp'
require 'mp3info'
require 'pry'
require 'json'

#
# ruby tag-mp3s.rb <tour> <tag>
#
# <tour> is the name of the tour. `tours/<tour>.md` must be the tour listing with all
# metadata as 'front matter', and `_files/<tour>/` should contain all the MP3 files
# to be tagged.
#

TOUR = tour = ARGV[0]

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
    "_files/#{TOUR}/%s.mp3" % @yaml['file'].to_s
  end
end

yaml = YAML.load(File.read("tours/#{tour}.md"))

if ARGV[1] == 'tag'
  yaml['stops'].each do |stop|
    stop = Stop.new(stop)
    stop.tag!
    stop.colors.each do |color, info|
      Stop.new(info).tag!(prefix: stop.name)
    end
  end
else
  puts ARGV.inspect
  puts JSON.yaml_as(yaml)
end
