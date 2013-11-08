_ = require( "lodash" )

module.exports = class MemoryStore extends require( "../basic" )
	constructor: ->
		super
		
		@warning "You are using the fallback in memory store!"

		@store = {}
		# just a simulation to globaly handle server powered stores
		@connected = false
		return

	connect: =>
		@debug "connect"
		@connected = true
		@emit( "connect" )
		return

	get: ( id, cb )=>
		process.nextTick =>
			@debug "GET. current id list", id, Object.keys( @store )
			if @store[ id ]?
				cb( null, @store[ id ] )
				return
			cb( null )
			return
		return

	set: ( payment, cb )=>
		process.nextTick =>
			@store[ payment.id ] = payment.valueOf()
			@debug "saved", payment.id, payment.toString()
			cb( null )
			return
		return

	destroy: ( payment, cb )=>
		process.nextTick =>
			@debug "destroy", payment.id
			_.omit( @store, [ payment.id ] )
			cb( null )
			return
		return

	clear: ( cb )=>
		@debug "clear"
		@store = {}
		cb()
		return

