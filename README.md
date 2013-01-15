sauron
=======

software defect data warehouse, extracts defects from multiple sources,
normalizes defect information, and provides restful api to access the
warehouse.

dependencies
------------

* ruby 1.9.2-p290 or greater (not tested with 1.9.3)
* sinatra
* thin
* postgresql
* sqlite3 (for development)
* activerecord
* highline

install
-------

1. clone the source from gerrit
```
    gerrit clone ssh://reviews.cloudfoundry.org/sauron
```
2. bundle install
```
    bundle install
```
3. create a config file
```
    rake config # input postgresql username and password
```
4. create the database
```
    rake db:migrate
```
5. set environment # default is development which uses sqlite3
```
    export RACK_ENV=production
```
6. start up the web server
```
    bundle exec thin start -d -p <port>   # e.g. bundle exec thin start -d -p 8000
```
7. stop the web server
```
    thin stop
```

troubleshooting
---------------

* on occassion, the thin stop command fails to shutdown the server in which
case you'll need to kill the process manually via the kill command
```
    kill -9 PID
```

