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
		try
			express = require( "express" )
		catch _err
			if _err.code is "MODULE_NOT_FOUND"
				@_handleError( null, "EMISSINGEXPRESS" )

			return

		@server = express()

		@server.set( "title", "node-payment" )
		@server.use( express.logger( "dev" ) )
		@server.use( express.bodyParser() )

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
		@main.onSuccessReturn req.params.pid, req.query.token, req.query.PayerID, ( err, payment )=>
			if err
				res.send( err, 500 )
				return
			@main.emit( "redirect:approved", res, payment )
			return
		return

	onCancel: ( req, res )=>
		console.log "CANCEL"
		return


	ERRORS: =>
		@extend super, 
			"EMISSINGEXPRESS": "To use a internal express you have to run `npm install express`. It's not a hard dependency to reduce node_module size for the usually used integrated version."
