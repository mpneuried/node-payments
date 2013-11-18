module.exports = class BaseProvider extends require( "../../lib/basic" )
	payment: require( "./payment" )

	constructor: ( @main, options )->
		super( options )

		return

	create: ( data )=>
		payment = new @payment( @, data )
		payment.on "exec", @onExec
		payment.on "approved", @onApproved
		payment.on "cancel", @onCancel
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

				@main.emit( "payment", "exec", payment )
				@main.emit( "payment:#{payment.id}", "exec", payment )
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
				
				@main.emit( "payment", "approved", payment )
				@main.emit( "payment:#{payment.id}", "approved", payment )
				return
			return
		return

	onCancel: ( payment )=>
		payment.removeAllListeners()
		@main.emit( "payment", "cancel", payment )
		@main.emit( "payment:#{payment.id}", "cancel", payment )
		return

	onDispose: ( payment )=>
		payment.removeAllListeners()
		return 
