module.exports = class BaseProvider extends require( "../../lib/basic" )
	payment: require( "./payment" )

	constructor: ( @main, options )->
		super( options )

		return

	create: =>
		payment = new @payment( @ )
		payment.on "exec", @onExec
		payment.on "success", @onSuccess
		return payment

	onExec: ( payment )=>
		@main.getStore ( err, store )=>
			if err
				@error( "getstore", err )
				return
			store.set payment.id, payment.valueOf(), ( err )=>
				if err
					@error( "payment save", err )
					return
				@debug( "payment save", payment.valueOf() )
				@passEvent( @main, "payment:exec", payment )
				return
			return
		return

	onSuccess: ( payment )=>
		payment.removeAllListeners()
		@main.getStore ( err, store )=>
			if err
				@error( "getstore", err )
				return
			store.destroy payment.id, ( err )=>
				if err
					@error( "payment destroy", err )
					return
				@debug( "payment destroyed", payment.valueOf() )
				@main.emit( "payment:success", payment )
				return
			return
		return

