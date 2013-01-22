require "active_record"
require "logger"
require "pg"
require "sinatra"
require "time"
require "yajl"
require "yaml"

require File.join( File.dirname(__FILE__), "defekts", "defekts_helper" )
require File.join( File.dirname(__FILE__), "defekts", "server" )
require File.join( File.dirname(__FILE__), "defekts", "pivotal_helper" )
require File.join( File.dirname(__FILE__), "defekts", "jira_helper" )
require File.join( File.dirname(__FILE__), "defekts", "version" )
require File.join( File.dirname(__FILE__), "defekts/models", "defekt" )
require File.join( File.dirname(__FILE__), "defekts/models", "project" )
require File.join( File.dirname(__FILE__), "defekts/models", "projectdefekt" )
require File.join( File.dirname(__FILE__), "defekts/models", "system" )

module Defekts

  configure do

    env = ENV["RACK_ENV"] || "development"

    db_config = YAML.load_file(File.join(
      Sinatra::Application.root, "../conf/database.yml" ))[env]
    defekt_config = YAML.load_file(File.join(Sinatra::Application.root, "../conf/config.yml" ))

    ActiveRecord::Base.establish_connection db_config

    set :last_sync, -1
    set :defekt_config, defekt_config
  end

  before do
    #ActiveRecord::Base.connection.verify_active_connections!
  end

  def self.check_synced

    if settings.last_sync == -1
      return false
    end

    elapsed = Time.now.to_i - settings.last_sync.to_i

    if elapsed >= 3600
      return false
    else
      return true
    end

  end

end

