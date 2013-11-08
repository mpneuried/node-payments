# import the external modules
_ = require('lodash')._
extend = require('extend')
colors = require('colors')

config = require('./config')

# # Basic Module
# ### extends [EventEmitter]
# Basic module to handle errors and initialize modules
module.exports = class Basic extends require('events').EventEmitter
	# ## internals

	# make the deep extend availible for all modles
	extend: extend

	# **defaults** *Function* basic object to hold config defaults. Will be overwritten by the constructor options
	defaults: =>
		return config.get( @constructor.name.toLowerCase(), true )

	###	
	## constructor 

	`new Baisc( options )`
	
	Basic constructor. Define the configuration by options and defaults, init logging and init the error handler

	@param {Object} options Basic config object

	###
	constructor: ( options = {} )->
		@on "_log", @_log

		@config = extend( true, {}, @defaults(), options )

		# init errors
		@_initErrors()

		@initialize()

		@debug "loaded"
		return

	###
	## initialize
	
	`basic.initialize()`
	
	Overwritible Method to initialize the module
	
	@api public
	###
	initialize: =>
		return

	###
	## define
	
	`basic.define( prop, fnGet [, fnSet] )`
	
	Helper to define getter and setter methods fot a property
	
	@param { String } prop Property name 
	@param { Function|Object } fnGet Get method or a object with `get` and `set` 
	@param { Function } [fnSet] Set method

	@api public
	###
	define: ( prop, fnGet, fnSet, writable = true, enumerable = true )=>
		_oGetSet = 
			enumerable: enumerable
			writable: writable

		if _.isFunction( fnGet )
			# set the `defineProperty` object
			_oGetSet = 
				get: fnGet
			_oGetSet.set = fnSet if fnSet? and _.isFunction( fnSet )
		else
			_oGetSet.value = fnGet
		
		# define by object
		Object.defineProperty @, prop, _oGetSet
		return

	###
	## getter
	
	`basic.getter( prop, fnGet )`
	
	Shortcut to define a getter
	
	@param { String } prop Property name 
	@param { Function } fnGet Get method 
	
	@api public
	###
	getter: ( prop, _get, enumerable = true )=>
		_obj = 
			enumerable: enumerable
			#writable: false

		if _.isFunction( _get )
			_obj.get = _get
		else
			_obj.value = _get
		Object.defineProperty @, prop, _obj
		return

	###
	## setter
	
	`basic.setter( prop, fnSet )`
	
	Shortcut to define a setter
	
	@param { String } prop Property name 
	@param { Function } fnSet Get method 
	
	@api public
	###
	setter: ( prop, fnGet, enumerable = true )=>
		Object.defineProperty @, prop, set: fnGet, enumerable: enumerable, writable: true
		return	

	passEvent: ( obj, ename )=>
		return ( args... )->
			args.unshift( ename )
			obj.emit.apply( obj, args )
			return

	_waitUntil: ( method, key = "ready", context = @ )=>
		return =>
			args = arguments
			if context[ key ]
				method.apply( @, args )
			else
				context.once key, =>
					method.apply( @, args )
					return
			return

	# handle a error
	###
	## _handleError
	
	`basic._handleError( cb, err [, data] )`
	
	Baisc error handler. It creates a true error object and returns it to the callback, logs it or throws the error hard
	
	@param { Function|String } cb Callback function or NAme to send it to the logger as error 
	@param { String|Error|Object } err Error type, Obejct or real error object
	
	@api private
	###
	_handleError: ( cb, err, data = {}, errExnd )=>
		# try to create a error Object with humanized message
		if _.isString( err )
			_err = new Error()
			_err.name = err
			if @isRest
				_err.message = @_ERRORS?[ err ][ 1 ]?( data ) or "unkown"
			else
				_err.message = @_ERRORS?[ err ]?( data ) or "unkown"
			_err.customError = true
		else 
			_err = err

		if errExnd?
			_err.data = errExnd

		for _k, _v of data 
			_err[ _k ] = _v

		if _.isFunction( cb )
			#@log "error", "", _err
			cb( _err )
		else if _.isString( cb )
			@log "error", cb, _err
		else
			throw _err
		return _err

	###
	## log
	
	`base.log( severity, code [, content1, content2, ... ] )`
	
	write a log to the console if the current severity matches the message severity
	
	@param { String } severity Message severity
	@param { String } code Simple code the describe/label the output
	@param { Any } [contentN] Content to append to the log
	
	@api public
	###
	log: ( severity, code, content... )=>
		args = [ "_log", severity, code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	###
	## _log
	
	`base._log( severity, code [, content1, content2, ... ] )`
	
	write a log to the console if the current severity matches the message severity
	
	@param { String } severity Message severity
	@param { String } code Simple code the describe/label the output
	@param { Any } [contentN] Content to append to the log
	
	@api private
	###
	_log: ( severity, code, content... )=>
		# get the severity and throw a log event
		
		if @_checkLogging( severity )
			_tmpl = "%s %s - #{ new Date().toString()[4..23]} - %s "

			args = [ _tmpl, severity.toUpperCase(), @constructor.name, code ]

			if content.length
				args[ 0 ] += "\n"
				for _c in content
					args.push _c

			switch severity
				when "fatal"
					args[ 0 ] = args[ 0 ].red.bold.inverse
					console.error.apply( console, args )
					console.trace()
				when "error"
					args[ 0 ] = args[ 0 ].red.bold
					console.error.apply( console, args )
				when "warning"
					args[ 0 ] = args[ 0 ].yellow.bold
					console.warn.apply( console, args )
				when "info"
					args[ 0 ] = args[ 0 ].blue.bold
					console.info.apply( console, args )
				when "debug"
					args[ 0 ] = args[ 0 ].green.bold
					console.log.apply( console, args )
				else
	
		return

	fatal: ( code, content... )=>
		args = [ "_log", "fatal", code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	error: ( code, content... )=>
		args = [ "_log", "error", code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	warning: ( code, content... )=>
		args = ["_log",  "warning", code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	info: ( code, content... )=>
		args = [ "_log", "info", code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	debug: ( code, content... )=>
		args = [ "_log", "debug", code ]
		@emit.apply( @, args.concat( content ) ) 
		return

	###
	## _checkLogging
	
	`basic._checkLogging( severity )`
	
	Helper to check if a log will be written to the console
	
	@param { String } severity Message severity
	
	@return { Boolean } Flag if the severity is allowed to write to the console
	
	@api private
	###
	_checkLogging: ( severity )=>
		if not @_logging_iseverity?
			@_logging_iseverity = @config.logging.severitys.indexOf( @config.logging.severity )

		iServ = @config.logging.severitys.indexOf( severity )
		if @config.logging.severity? and iServ <= @_logging_iseverity
			true
		else
			false

	###
	## _initErrors
	
	`basic._initErrors(  )`
	
	convert error messages to underscore templates
	
	@api private
	###
	_initErrors: =>
		@_ERRORS = @ERRORS()
		for key, msg of @_ERRORS
			if @isRest
				if not _.isFunction( msg[ 1 ] )
					@_ERRORS[ key ][ 1 ] = _.template( msg[ 1 ] )
			else
				if not _.isFunction( msg )
					@_ERRORS[ key ] = _.template( msg )
		return

	# error message mapping
	ERRORS: =>
		"ENOTIMPLEMENTED": "This function is planed but currently not implemented"