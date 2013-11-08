module.exports = class BaseProvider extends require( "../../lib/basic" )
	payment: require( "./payment" )

	constructor: ( @main, options )->
		super( options )

		return

	create: ( data )=>
		payment = new @payment( @, data )
		payment.on "exec", @onExec
		payment.on "approved", @onApproved
		payment.on "dispose", @onDispose
		return payment

	onExec: ( payment )=>
		@main.getStore ( err, store )=>
			if err
				@error( "getstore", err )
				return
			store.set payment, ( err )=>
				if err
					@error( "payment save", err )
					return
				@passEvent( @main, "payment:exec", payment )
				return
			return
		return

	onApproved: ( payment )=>
		payment.removeAllListeners()
		@main.getStore ( err, store )=>
			if err
				@error( "getstore", err )
				return
			store.set payment, ( err )=>
				if err
					@error( "payment saved", err )
					return
				@main.emit( "payment:approved", payment )
				@main.emit( "approved:#{payment.id}", payment )
				return
			return
		return

	onDispose: ( payment )=>
		payment.removeAllListeners()
		return 
