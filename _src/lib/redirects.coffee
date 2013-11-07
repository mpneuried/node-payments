config = require( "./config" )

module.exports = class RedirServer extends require( "./basic" )
	constructor: ( @main, express )->
		super()

		if express?.engines?
			# reuse an existing express server
			@server = express
		else
			# create a express server
			@createExpress()

		@createRoutes()
		return

	createExpress: =>
		_econfig = config.get( "serverConfig" )
		express = require( "express" )
		@server = express()

		@server.set( "title", "node-payment" )
		@server.use( express.logger( "dev" ) )

		@server.listen( _econfig.port, _econfig.listenhost )
		return

	auth: ( req, res, next )=>
		next()
		return

	createRoutes: =>
		_urls = @main.getUrls()
		
		@debug "redir-urls", _urls

		@server.get _urls.success, @auth, @onSuccess
		@server.get _urls.cancel, @auth, @onCancel
		return

	onSuccess: ( req, res )=>
		console.log "SUCCESS"
		return

	onCancel: ( req, res )=>
		console.log "CANCEL"
		return