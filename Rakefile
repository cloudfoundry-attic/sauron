require "active_record"
require "active_record/fixtures"
require "digest/md5"
require "logger"
require "securerandom"
require "yaml"


task :default => :help

env = ENV['RACK_ENV'] || "development"

namespace :db do

  desc "establish connection"
  task :environment do

    @config = YAML.load_file("conf/database.yml")["#{env}"]
    ActiveRecord::Base.establish_connection @config
    ActiveRecord::Base.logger = Logger.new(STDOUT)

  end

  desc "create database"
  task :create => :environment do
    ActiveRecord::Base.connection.create_database @config
    ActiveRecord::Base.establish_connection @config
  end

  desc "migrate database"
  task :migrate => :environment do

    ActiveRecord::Migration.verbose   = true
    ActiveRecord::Migrator.migrate("db/migrate")

  end

end

desc "configuration"
task :config do

  require "highline/import"
  require "erb"

  dbfile   = File.dirname(__FILE__) + "/db/defekts.db"
  username = ask("username: ")
  password = ask("password: ") {|q| q.echo = "*"}

  config = ERB.new(File.read("./conf/database.yml.erb"))
  contents = config.result(binding)

  file = File.open( "./conf/database.yml", "w" )
  file.write(contents)
  file.close

end

desc "generate help text"
task :help do

  puts "rake"
  puts "  config"
  puts "  db:migrate"
  puts "  db:seed"

end

