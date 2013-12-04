_ = require( "lodash" )
redis = require("redis")

module.exports = class RedisHashStore extends require( "../basic" )

	defaults: =>
		return @extend super, 
			hkey: "nodepaymentexample"
			host: "localhost"
			port: 6379
			options: {}
			redis: null

	constructor: ->
		super
		# just a simulation to globaly handle server powered stores
		@connected = false
		return

	connect: =>
		if @config.redis?.constructor?.name is "RedisClient"
			@redis = @config.redis
		else
			@redis = redis.createClient( @config.port or 6379, @config.host or "127.0.0.1", @config.options or {} )

		@connected = @redis.connected or false
		@redis.on "connect", =>
			@connected = true
			@emit( "connect" )
			return

		@redis.on "error", ( err )=>
			if err.message.indexOf( "ECONNREFUSED" )
				@connected = false
				@emit( "disconnect" )
			else
				@error( "Redis ERROR", err )
				@emit( "error" )
			return
		return

	get: ( id, cb )=>
		process.nextTick =>
			@redis.hget @config.hkey, id, ( err, data )=>
				if err
					cb( err )
					return
				cb( null, JSON.parse( data ) )
				return
			return
		return

	set: ( payment, cb )=>
		process.nextTick =>
			@redis.hset @config.hkey, payment.id, payment.toString(), ( err, done )=>
				if err
					cb( err )
					return
				@debug "saved", payment.id, payment.toString()
				cb( null )
				return
			return
		return

	destroy: ( payment, cb )=>
		process.nextTick =>
			@debug "destroy", payment.id
			@redis.hdel @config.hkey, payment.id, ( err, done )=>
				cb( err )
				return
			return
		return

	clear: ( cb )=>
		@debug "clear"
		@redis.del @config.hkey, ( err, done )=>
			cb( err )
			return
		return

