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
			if @store[ id ]?
				cb( null, @store[ id ] )
				return
			cb( null )
			return
		return

	set: ( id, data, cb )=>
		process.nextTick =>
			@store[ id ] = data
			@debug "saved", data
			cb( null )
			return
		return

	destroy: ( id, cb )=>
		process.nextTick =>
			@debug "destroy", id
			_.omit( @store, [ id ] )
			cb( null )
			return
		return

	clear: ( cb )=>
		@debug "clear"
		@store = {}
		cb()
		return

